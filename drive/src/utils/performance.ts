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

export function recordPerformanceSample(metric: Metric, value: number): void {
  if (!profiling || !Number.isFinite(value)) return;
  const values = samples[metric];
  values.push(value);
  if (values.length > PROFILE_WINDOW) values.shift();
}

export function getDrivePerformance() {
  const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
  return Object.fromEntries((Object.keys(samples) as Metric[]).map((name) => {
    const sorted = [...samples[name]].sort((a, b) => a - b);
    return [name, { count: sorted.length, p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), p99: percentile(sorted, 0.99) }];
  }));
}

if (profiling) Object.assign(window, { __drivePerf: getDrivePerformance });

/**
 * Call each frame with the frame delta.
 * Returns true if throttling is detected (avg delta > 50ms for 5+ seconds).
 */
export function recordDelta(delta: number): boolean {
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
 * Reduce pixel ratio on a WebGL renderer to save GPU.
 */
export function applyThrottledQuality(gl: WebGLRenderingContext | null): void {
  if (gl && 'setPixelRatio' in gl) {
    (gl as unknown as { setPixelRatio: (r: number) => void }).setPixelRatio(1);
  }
}
