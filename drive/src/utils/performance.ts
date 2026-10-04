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
/** Frame time below this (ms) counts as a fast (recovered) frame. ~55 fps. */
export const FAST_FRAME_MS = 18.2;
/** Sustained seconds of slow frames before stepping down one tier. */
export const SLOW_HOLD_S = 2.5;
/** Sustained seconds of fast frames before stepping back up one tier. */
export const FAST_HOLD_S = 6;

export interface QualityState {
  tier: QualityTier;
  /** Seconds of sustained slow frames so far. */
  slowS: number;
  /** Seconds of sustained fast frames so far. */
  fastS: number;
}

export const initialQualityState = (tier: QualityTier = 'high'): QualityState => ({ tier, slowS: 0, fastS: 0 });

/**
 * Step the tier from a measured frame time. Pure: given the same state and the
 * same frame time it always returns the same next state.
 *
 * Sustained slow frames step high → mid → low. Sustained fast frames step back
 * up. Mixed frames decay both counters, so a stutter neither promotes nor
 * demotes. Recovery is deliberately slower than demotion (FAST_HOLD_S >
 * SLOW_HOLD_S) so the tier does not oscillate on a marginal frame rate.
 */
export function stepQuality(state: QualityState, frameMs: number, dtS: number): QualityState {
  const slow = Number.isFinite(frameMs) && frameMs > SLOW_FRAME_MS;
  const fast = Number.isFinite(frameMs) && frameMs < FAST_FRAME_MS;
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
