/**
 * Performance utilities — thermal throttle detection + low-end device check
 */

// Rolling frame delta average (60 frames)
const DELTA_WINDOW = 60;
const deltas: number[] = [];
let slowFrameSeconds = 0;

/** Opt-in CPU/render counters, readable in the dev console as window.__drivePerf(). */
const PROFILE_WINDOW = 600;
// R3F callbacks run before rendering: GPU counters refer to the preceding render.
type Metric = 'frameMs' | 'vehicleMs' | 'missionMs' | 'previousDrawCalls' | 'previousTriangles';
const samples: Record<Metric, number[]> = {
  frameMs: [], vehicleMs: [], missionMs: [], previousDrawCalls: [], previousTriangles: [],
};
const profiling = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('profileDrive');
let firstFrameMs: number | null = null;

export function recordPerformanceSample(metric: Metric, value: number): void {
  if (!profiling || !Number.isFinite(value)) return;
  const values = samples[metric];
  values.push(value);
  if (values.length > PROFILE_WINDOW) values.shift();
}

export function getDrivePerformance() {
  const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
  const metrics = Object.fromEntries((Object.keys(samples) as Metric[]).map((name) => {
    const sorted = [...samples[name]].sort((a, b) => a - b);
    return [name, { count: sorted.length, p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), p99: percentile(sorted, 0.99) }];
  })) as Record<Metric, { count: number; p50: number; p95: number; p99: number }>;
  const frame = metrics.frameMs;
  return {
    ...metrics,
    firstFrameMs,
    fps: frame.p50 > 0 ? 1000 / frame.p50 : 0,
    onePctLowFps: frame.p99 > 0 ? 1000 / frame.p99 : 0,
  };
}

if (profiling) Object.assign(window, { __drivePerf: getDrivePerformance });

/**
 * Call each frame with the frame delta.
 * Returns true if throttling is detected (avg delta > 50ms for 5+ seconds).
 */
export function recordDelta(delta: number): boolean {
  if (firstFrameMs == null && typeof performance !== 'undefined') firstFrameMs = performance.now();
  recordPerformanceSample('frameMs', delta * 1000);
  deltas.push(delta);
  if (deltas.length > DELTA_WINDOW) deltas.shift();

  const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;

  if (avg > 0.05) {
    slowFrameSeconds += delta;
  } else {
    slowFrameSeconds = Math.max(0, slowFrameSeconds - delta * 2);
  }

  return slowFrameSeconds > 5;
}

/**
 * Check if this is a low-end device at mount time.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const lowCores = navigator.hardwareConcurrency <= 4;
  const oldAndroid = /Android.*Chrome\/[0-6]/.test(navigator.userAgent);
  return lowCores || oldAndroid;
}

/**
 * Draw-call / triangle counters for the KENT SCENE pass.
 *
 * The old 2026-10-01 profile read `gl.info.render.calls` from a `useFrame`
 * callback and reported 1 every frame. That was not a small city: three resets
 * `gl.info` at the start of every `renderer.render`, and `EffectComposer` calls
 * render once per postprocessing pass with a fullscreen blit LAST. So a read taken
 * after the render always landed on the blit — one quad, one draw call — no matter
 * how much Kent actually drew.
 *
 * The scene pass is the scene graph we care about, so we sample it where it is
 * still intact: an object whose `onAfterRender` fires after the scene has been
 * drawn and before any post pass runs. Those numbers are recorded here and read by
 * `getDrivePerformance`.
 *
 * This is a counter, not a claim about a frame rate. It reports what the renderer
 * was asked to draw last frame and nothing more.
 */
const pass = { calls: 0, triangles: 0 };

/** The two three.js Object3D hooks we wrap. Structurally typed so this module
 *  stays renderer-agnostic and unit-testable without importing three. */
export interface RenderTarget {
  onBeforeRender?: ((...args: never[]) => void) | null;
  onAfterRender?: ((...args: never[]) => void) | null;
}

/**
 * Attach to the root of the drawn scene. On every render it records the counters
 * for exactly that pass, before postprocessing overwrites `gl.info`.
 */
export function attachScenePassProbe(
  target: RenderTarget,
  info: () => { calls: number; triangles: number },
): () => void {
  const prevBefore = target.onBeforeRender;
  const prevAfter = target.onAfterRender;

  target.onAfterRender = ((...args: never[]) => {
    const r = info();
    pass.calls = r.calls;
    pass.triangles = r.triangles;
    recordPerformanceSample('previousDrawCalls', r.calls);
    recordPerformanceSample('previousTriangles', r.triangles);
    prevAfter?.apply(target, args);
  }) as RenderTarget['onAfterRender'];

  return () => {
    target.onAfterRender = prevAfter;
    target.onBeforeRender = prevBefore;
  };
}

/** The last published Kent scene-pass counts (0 before the first frame renders). */
export function scenePassCounters(): { calls: number; triangles: number } {
  return { calls: pass.calls, triangles: pass.triangles };
}

/** Test seam: drop the counters so one case cannot read another's numbers. */
export function resetScenePassCounters(): void {
  pass.calls = 0;
  pass.triangles = 0;
}

// ─── P8: quality tiers ─────────────────────────────────────────────────────────
// Three tiers chosen from *measured frame time*, not a one-shot CPU check.
// This module is pure data + a pure reducer: it never touches WebGL, so the
// unit test can step it without a canvas. Game3D owns the single DPR writer
// and PostProcessing mounts only the chosen tier's effects.

export type QualityTier = 'high' | 'mid' | 'low';

/** Order matters: a lower index is more capable. */
export const TIER_ORDER: QualityTier[] = ['high', 'mid', 'low'];

export interface TierEffect {
  /** Stable id, used by the unit test to count mounted effects. */
  id: 'bloom' | 'brightnessContrast' | 'hueSaturation' | 'vignette' | 'chromaticAberration' | 'noise' | 'headlightFlares';
  /** Whether the per-frame intensity updates in PostProcessing apply. */
  animated: boolean;
}

/**
 * Exactly what each tier mounts.
 *   high — the current post stack, unchanged.
 *   mid  — vignette + colour grade only.
 *   low  — no bloom, no chromatic aberration, no noise (DPR is capped at 1).
 */
export const TIER_EFFECTS: Record<QualityTier, TierEffect[]> = {
  high: [
    { id: 'bloom', animated: true },
    { id: 'brightnessContrast', animated: true },
    { id: 'hueSaturation', animated: true },
    { id: 'vignette', animated: true },
    { id: 'chromaticAberration', animated: true },
    { id: 'noise', animated: true },
    { id: 'headlightFlares', animated: false },
  ],
  mid: [
    { id: 'brightnessContrast', animated: true },
    { id: 'hueSaturation', animated: true },
    { id: 'vignette', animated: true },
  ],
  low: [
    { id: 'vignette', animated: true },
  ],
};

/** Frame time above this (ms) counts as a slow frame. ~30 fps. */
export const SLOW_FRAME_MS = 33.4;
/**
 * Recovery needs frames at or under this, RELATIVE to the display's own refresh.
 * The old absolute 18.2 ms (~55 fps) could never be met by a panel locked at
 * 30 Hz, so once such a panel stepped down one tier it could never climb back.
 */
/**
 * Recovery is judged by SLOW_FRAME_MS, not by a second hard-coded frame time.
 * Anything at or under the demotion threshold counts as recovered.
 */
export const FAST_FRAME_MS = SLOW_FRAME_MS;
/** Sustained seconds of slow frames before stepping down one tier. */
export const SLOW_HOLD_S = 2.5;
/** Sustained seconds of recovered frames before stepping back up one tier. */
export const FAST_HOLD_S = 6;

export interface QualityState {
  tier: QualityTier;
  /** Seconds of sustained slow frames so far. */
  slowS: number;
  /** Seconds of sustained recovered frames so far. */
  fastS: number;
}

export const initialQualityState = (tier: QualityTier = 'high'): QualityState =>
  ({ tier, slowS: 0, fastS: 0 });

/**
 * Step the tier from a measured frame time. Pure: given the same state and the
 * same frame time it always returns the same next state.
 *
 * Sustained slow frames step high → mid → low. Sustained recovered frames step
 * back up. Mixed frames decay both counters, so a stutter neither promotes nor
 * demotes. Recovery takes longer than demotion (FAST_HOLD_S > SLOW_HOLD_S) so the
 * tier does not oscillate.
 *
 * THE THRESHOLD IS ONE LINE, NOT TWO. A frame is slow if it is over
 * SLOW_FRAME_MS, and recovered if it is not. The reducer used to carry a second,
 * much stricter recovery bar (18.2 ms, ~55 fps) alongside the demotion bar
 * (33.4 ms, ~30 fps). That gap is what trapped a 30 Hz panel: a display locked at
 * 33.3 ms a frame can never produce an 18.2 ms frame, so a tier that stepped down
 * on one transient stall stayed at `low` for the rest of the session — the post
 * stack stayed cheap and nothing gave the tier back. With one threshold, a panel
 * sitting at its own refresh rate is by definition keeping up, so it recovers as
 * soon as the stall is over, and a genuinely slow panel still walks down.
 *
 * No frame rate is claimed here. SLOW_FRAME_MS is the demotion threshold, not a
 * measurement of this build.
 */
export function stepQuality(state: QualityState, frameMs: number, dtS: number): QualityState {
  const finite = Number.isFinite(frameMs) && frameMs > 0;
  const slow = finite && frameMs > SLOW_FRAME_MS;
  // Recovered == not slow. A flat refresh at the display's own rate clears this.
  const fast = finite && !slow;

  let slowS = slow ? state.slowS + dtS : 0;
  let fastS = fast ? state.fastS + dtS : 0;
  let tier = state.tier;

  if (slowS >= SLOW_HOLD_S) {
    const next = TIER_ORDER[Math.min(TIER_ORDER.length - 1, TIER_ORDER.indexOf(tier) + 1)];
    if (next !== tier) {
      tier = next;
      slowS = 0;
      fastS = 0;
    }
  } else if (fastS >= FAST_HOLD_S) {
    const next = TIER_ORDER[Math.max(0, TIER_ORDER.indexOf(tier) - 1)];
    if (next !== tier) {
      tier = next;
      slowS = 0;
      fastS = 0;
    }
  }
  return { tier, slowS, fastS };
}

/** How many effects a tier mounts — the unit test asserts low < high. */
export function effectCount(tier: QualityTier): number {
  return TIER_EFFECTS[tier].length;
}

/** Effect ids a tier mounts, in mount order. */
export function effectsFor(tier: QualityTier): string[] {
  return TIER_EFFECTS[tier].map((e) => e.id);
}

/**
 * The Canvas pixel ratio for a tier. This is the ONE place DPR is decided.
 * Mobile never goes above 1.5, and the low tier is pinned at 1.
 */
export function dprForTier(tier: QualityTier, devicePixelRatio = 1, lowEnd = false): number {
  if (tier === 'low') return 1;
  const ceiling = lowEnd ? 1 : 1.5;
  return Math.max(1, Math.min(devicePixelRatio, ceiling));
}

/**
 * Reduce pixel ratio on a WebGL renderer to save GPU.
 * @deprecated Kept for compatibility; the tier system in Game3D owns DPR now.
 */
export function applyThrottledQuality(gl: WebGLRenderingContext | null): void {
  if (gl && 'setPixelRatio' in gl) {
    (gl as unknown as { setPixelRatio: (r: number) => void }).setPixelRatio(1);
  }
}
