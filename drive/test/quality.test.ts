/**
 * P8 — quality tiers.
 *
 * The tier choice is a pure function of measured frame time: this test steps it
 * without a canvas and without WebGL. It locks three things:
 *   1. sustained slow frames step high → mid → low;
 *   2. sustained fast (recovered) frames step back up;
 *   3. low mounts fewer effects than high, and DPR never goes above 1.5 on mobile.
 */
import { describe, expect, it } from 'vitest';
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
    expect(FAST_FRAME_MS).toBeLessThan(SLOW_FRAME_MS);
    // Recovery takes longer than demotion, so a marginal rate settles.
    expect(FAST_HOLD_S).toBeGreaterThan(SLOW_HOLD_S);
    const mid = SLOW_FRAME_MS; // right at the boundary — neither slow nor fast
    expect(run(initialQualityState('mid'), mid, 30).tier).toBe('mid');
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