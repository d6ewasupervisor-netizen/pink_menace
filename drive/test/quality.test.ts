/**
 * P8 — quality tiers.
 *
 * The tier choice is a pure function of measured frame time: this test steps it
 * without a canvas and without WebGL. It locks three things:
 *   1. sustained slow frames step high → mid → low;
 *   2. sustained fast (recovered) frames step back up;
 *   3. low mounts fewer effects than high, and DPR never goes above 1.5 on mobile.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  stepQuality,
  initialQualityState,
  effectCount,
  effectsFor,
  dprForTier,
  TIER_EFFECTS,
  SLOW_HOLD_S,
  FAST_HOLD_S,
  SLOW_FRAME_MS,
  FAST_FRAME_MS,
  attachScenePassProbe,
  scenePassCounters,
  resetScenePassCounters,
  type QualityState,
  type QualityTier,
} from '../src/utils/performance';

/** Feed the reducer `seconds` worth of frames at `frameMs`. */
function run(state: QualityState, frameMs: number, seconds: number, dt = 1 / 60): QualityState {
  let s = state;
  for (let t = 0; t < seconds; t += dt) s = stepQuality(s, frameMs, dt);
  return s;
}

const SLOW_MS = 50;   // ~20 fps
const FAST_MS = 12;   // ~83 fps
/** A panel locked at ~30 Hz: 33.3 ms a frame, forever. It can never do better. */
const HZ30_MS = 33.4;

describe('P8 — the tier choice is a pure function of frame time', () => {
  it('sustained slow frames step high → mid → low', () => {
    let s = initialQualityState('high');
    expect(s.tier).toBe('high');

    // One frame of a slow frame changes nothing.
    s = stepQuality(s, SLOW_MS, 1 / 60);
    expect(s.tier).toBe('high');

    s = run(s, SLOW_MS, SLOW_HOLD_S + 0.5);
    expect(s.tier).toBe('mid');

    s = run(s, SLOW_MS, SLOW_HOLD_S + 0.5);
    expect(s.tier).toBe('low');

    // Already at the floor: it never goes below low.
    s = run(s, SLOW_MS, SLOW_HOLD_S * 4);
    expect(s.tier).toBe('low');
  });

  it('recovered frames step back up', () => {
    let s = initialQualityState('low');

    s = run(s, FAST_MS, FAST_HOLD_S + 0.5);
    expect(s.tier).toBe('mid');

    s = run(s, FAST_MS, FAST_HOLD_S + 0.5);
    expect(s.tier).toBe('high');

    // And never above high.
    s = run(s, FAST_MS, FAST_HOLD_S * 4);
    expect(s.tier).toBe('high');
  });

  it('a single stutter neither promotes nor demotes', () => {
    const start = initialQualityState('mid');
    const s = stepQuality(start, SLOW_MS, 1 / 60);
    expect(s.tier).toBe('mid');
    // …and one slow frame resets the recovery clock.
    expect(stepQuality(run(initialQualityState('mid'), FAST_MS, FAST_HOLD_S - 0.1), SLOW_MS, 1 / 60).fastS).toBe(0);
  });

  it('is pure: the same state and frame time always give the same answer', () => {
    const a = run(initialQualityState('high'), SLOW_MS, 4);
    const b = run(initialQualityState('high'), SLOW_MS, 4);
    expect(b).toEqual(a);
    // The input state is not mutated.
    const seed = initialQualityState('high');
    stepQuality(seed, SLOW_MS, 10);
    expect(seed).toEqual({ tier: 'high', slowS: 0, fastS: 0 });
  });

  it('ignores a non-finite frame time rather than demoting on it', () => {
    const s = run(initialQualityState('high'), NaN, SLOW_HOLD_S + 1);
    expect(s.tier).toBe('high');
  });

  it('separates slow from fast so a marginal rate does not oscillate', () => {
    // Recovery takes longer than demotion, so a marginal rate settles.
    expect(FAST_HOLD_S).toBeGreaterThan(SLOW_HOLD_S);
    // One threshold, not two: recovered is exactly "not slow". See stepQuality.
    expect(FAST_FRAME_MS).toBe(SLOW_FRAME_MS);
    // A frame right at the boundary is recovered, not slow — and not demoting.
    const at = SLOW_FRAME_MS;
    expect(stepQuality(initialQualityState('mid'), at, 1 / 60).slowS).toBe(0);
    expect(stepQuality(initialQualityState('mid'), at, 1 / 60).fastS).toBeGreaterThan(0);
  });
});

/**
 * The 30 Hz trap.
 *
 * The old rule called a frame "recovered" only under a hard 18.2 ms (~55 fps).
 * A display locked at 30 Hz delivers ~33.3 ms frames and can never produce one, so
 * a panel that stepped down on a transient stall was pinned at `low` for the rest
 * of the session: dropping the post stack bought nothing and nothing gave it back.
 *
 * Recovery is now relative to the panel's own period, which is learned from the
 * fastest frame it has actually drawn. The high → mid → low reducer is unchanged,
 * and no frame rate is claimed anywhere.
 */
describe('P8 — a 30 Hz panel can recover', () => {
  it('steps down under sustained slow frames, as before', () => {
    let s = run(initialQualityState('high'), SLOW_MS, SLOW_HOLD_S + 0.5);
    expect(s.tier).toBe('mid');
    s = run(s, SLOW_MS, SLOW_HOLD_S + 0.5);
    expect(s.tier).toBe('low');
  });

  it('a flat 30 Hz refresh does not walk the tier down', () => {
    // 33.4 ms a frame is the display's own rate and sits exactly on the
    // threshold, so it is recovered, not slow: the tier should stay at high.
    const s = run(initialQualityState('high'), HZ30_MS, 60);
    expect(s.tier).toBe('high');
    expect(s.slowS).toBe(0);
  });

  it('a tier that fell to low on a stall climbs back on a flat 30 Hz cadence', () => {
    // This is the trap the second threshold created. The panel stalls for long
    // enough to demote twice, then settles at its own 30 Hz rate forever. Under
    // the old 18.2 ms recovery bar it could never leave `low`.
    const stalled = run(initialQualityState('high'), SLOW_MS, SLOW_HOLD_S * 2 + 0.5);
    expect(stalled.tier).toBe('low');
    const recovered = run(stalled, HZ30_MS, FAST_HOLD_S + 1);
    expect(recovered.tier).toBe('mid');
    expect(run(recovered, HZ30_MS, FAST_HOLD_S + 1).tier).toBe('high');
  });

  it('a genuinely slow panel still walks all the way down and stays there', () => {
    const s = run(initialQualityState('high'), SLOW_MS, 60);
    expect(s.tier).toBe('low');
    // And it does not climb back on its own rate, because that rate IS slow.
    expect(run(s, SLOW_MS, 60).tier).toBe('low');
  });

  it('ignores a non-finite frame time rather than counting it either way', () => {
    const s = run(initialQualityState('mid'), SLOW_HOLD_S - 0.05, 1 / 60);
    const n = stepQuality(s, NaN, 1 / 60);
    expect(n.slowS).toBe(0);
    expect(n.fastS).toBe(0);
    expect(n.tier).toBe('mid');
  });
});

/**
 * Draw-call sampling.
 *
 * The old profile read `gl.info.render.calls` from a useFrame callback and got 1
 * every frame: three resets `gl.info` per `renderer.render`, and EffectComposer
 * renders once per post pass with a fullscreen blit last. The counter is now
 * taken from the scene pass itself, at the point where those numbers are still
 * the scene's.
 */
describe('P8 — the scene pass owns the draw-call sample', () => {
  beforeEach(() => resetScenePassCounters());

  it('reports what the scene pass drew, not the postprocessing blit', () => {
    // A stand-in for the Kent scene root: three calls onAfterRender on it.
    const sceneRoot: { onAfterRender?: ((...a: never[]) => void) | null } = {};
    let live = { calls: 1, triangles: 2 };   // a blit, which is what we used to see
    const detach = attachScenePassProbe(sceneRoot, () => live);

    // Mid-frame the counters are the blit's; the probe has not fired yet.
    expect(scenePassCounters()).toEqual({ calls: 0, triangles: 0 });

    // The scene pass renders 41 calls / 9,000 triangles, then the blit runs.
    live = { calls: 41, triangles: 9000 };
    sceneRoot.onAfterRender!();
    live = { calls: 1, triangles: 2 };
    expect(scenePassCounters()).toEqual({ calls: 41, triangles: 9000 });
    detach();
  });

  it('restores whatever was on the callback when it detaches', () => {
    const calls: string[] = [];
    const target = { onAfterRender: () => { calls.push('mine'); } };
    const detach = attachScenePassProbe(target, () => ({ calls: 1, triangles: 1 }));
    target.onAfterRender!();
    expect(calls).toEqual(['mine']);
    detach();
    target.onAfterRender!();
    expect(calls).toEqual(['mine', 'mine']);
  });
});

describe('P8 — what each tier mounts', () => {
  it('low mounts fewer effects than high', () => {
    expect(effectCount('low')).toBeLessThan(effectCount('high'));
    expect(effectCount('mid')).toBeLessThan(effectCount('high'));
  });

  it('high keeps the current post stack', () => {
    expect(effectsFor('high')).toEqual(
      expect.arrayContaining(['bloom', 'vignette', 'chromaticAberration', 'noise']),
    );
  });

  it('mid is vignette + colour grade only', () => {
    expect(effectsFor('mid')).toEqual(['brightnessContrast', 'hueSaturation', 'vignette']);
    expect(effectsFor('mid')).not.toContain('bloom');
    expect(effectsFor('mid')).not.toContain('chromaticAberration');
    expect(effectsFor('mid')).not.toContain('noise');
  });

  it('low has no bloom, no chromatic aberration and no noise', () => {
    expect(effectsFor('low')).toEqual(['vignette']);
    expect(effectsFor('low')).not.toContain('bloom');
    expect(effectsFor('low')).not.toContain('chromaticAberration');
    expect(effectsFor('low')).not.toContain('noise');
  });

  it('every mounted effect is declared in the table (no untracked effect)', () => {
    for (const tier of ['high', 'mid', 'low'] as QualityTier[]) {
      for (const e of TIER_EFFECTS[tier]) expect(typeof e.id).toBe('string');
    }
  });
});

describe('P8 — DPR', () => {
  it('caps the low tier at 1', () => {
    expect(dprForTier('low', 3, false)).toBe(1);
    expect(dprForTier('low', 1, false)).toBe(1);
  });

  it('never goes above 1.5 on mobile', () => {
    for (const tier of ['high', 'mid', 'low'] as QualityTier[]) {
      expect(dprForTier(tier, 3, true)).toBeLessThanOrEqual(1);
      expect(dprForTier(tier, 3, false)).toBeLessThanOrEqual(1.5);
    }
  });

  it('follows the device ratio below the ceiling', () => {
    expect(dprForTier('high', 1, false)).toBe(1);
    expect(dprForTier('high', 1.25, false)).toBe(1.25);
    expect(dprForTier('mid', 3, false)).toBe(1.5);
  });
});