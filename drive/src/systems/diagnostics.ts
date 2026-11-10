/**
 * diagnostics — what the phone's GPU is actually doing, in numbers.
 *
 * Scene 6.3 on an Android phone drew a black 3D view under a live HUD, and the
 * LOW/HIGH button changed nothing. "Black" has only a few causes and each leaves
 * a different fingerprint:
 *
 *   - no context at all (a loss, not a dark frame);
 *   - a shader that refused to compile or link;
 *   - a sky/fog band a cheap tier dropped, leaving nothing behind the road;
 *   - a scene whose light never reached the materials it was meant to light.
 *
 * A screenshot cannot tell those apart, and none of it was reported anywhere on
 * the device. This module is the phone's own answer, and it is pure so it can be
 * measured in node: `readGpuInfo` formats a context, `meanLuminance` reads a
 * 16x16 readback, `stepDarkFrame` decides when a dark frame is a *finding* rather
 * than a moment, and `parseShaderError` finds the material three.js names in its
 * own console error.
 *
 * The wiring lives in `Game3D/FieldDiagnostics.tsx`: one `client.gpu` at start,
 * one `client.frame_dark` per dark episode, one `client.shader_error` per program
 * — all of them through DriveSync's batched uploader, so a diagnostic can never
 * become the flood it is meant to explain.
 */

// ─── GPU / context facts ──────────────────────────────────────────────────────

/** The slice of a WebGL context this module reads. Real contexts satisfy it. */
export interface GlLike {
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  /**
   * A real WebGL context exposes its element as `canvas`; a renderer exposes
   * `domElement`. Either is accepted — reading the wrong one was a real crash
   * (the diagnostics took the Canvas down with them) on the first e2e run.
   */
  canvas?: { getBoundingClientRect(): { width: number; height: number } };
  domElement?: { getBoundingClientRect(): { width: number; height: number } };
  getParameter(p: number): unknown;
  getExtension(name: string): unknown;
}

export interface GpuEnv {
  /** The tier the renderer is running (`low` / `mid` / `high`). */
  tier: string;
  dpr: number;
  /** `navigator.deviceMemory`, where the browser has it. */
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  ua: string;
}

export interface GpuReport {
  version: string;
  vendor: string;
  renderer: string;
  /** The real GPU string; the plain one is often "WebKit WebGL". */
  unmaskedVendor: string | null;
  unmaskedRenderer: string | null;
  maxTextureSize: number;
  dpr: number;
  /** CSS pixels the canvas occupies. */
  cssWidth: number;
  cssHeight: number;
  /** Pixels the GPU is actually asked to fill (CSS x DPR, capped by the tier). */
  bufferWidth: number;
  bufferHeight: number;
  tier: string;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  ua: string;
}

// GL constants, spelled out so this module needs no context to be imported.
const GL_VENDOR = 0x1f00;
const GL_RENDERER = 0x1f01;
const GL_VERSION = 0x1f02;
const GL_MAX_TEXTURE_SIZE = 0x0d33;

export function readGpuInfo(gl: GlLike, env: GpuEnv): GpuReport {
  const str = (p: number): string => {
    const v = gl.getParameter(p);
    return typeof v === 'string' ? v : '';
  };
  const num = (p: number): number => {
    const v = gl.getParameter(p);
    return typeof v === 'number' ? v : 0;
  };
  const ext = gl.getExtension('WEBGL_debug_renderer_info') as
    | { UNMASKED_VENDOR_WEBGL: number; UNMASKED_RENDERER_WEBGL: number }
    | null;
  const rect = (gl.domElement ?? gl.canvas)?.getBoundingClientRect() ?? { width: 0, height: 0 };
  return {
    version: str(GL_VERSION),
    vendor: str(GL_VENDOR),
    renderer: str(GL_RENDERER),
    unmaskedVendor: ext ? str(ext.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: ext ? str(ext.UNMASKED_RENDERER_WEBGL) : null,
    maxTextureSize: num(GL_MAX_TEXTURE_SIZE),
    dpr: env.dpr,
    cssWidth: Math.round(rect.width),
    cssHeight: Math.round(rect.height),
    bufferWidth: gl.drawingBufferWidth,
    bufferHeight: gl.drawingBufferHeight,
    tier: env.tier,
    deviceMemory: env.deviceMemory,
    hardwareConcurrency: env.hardwareConcurrency,
    ua: env.ua,
  };
}

// ─── Luminance of a downsampled frame ─────────────────────────────────────────

/**
 * Mean luminance (0..1) of an RGBA readback, Rec.709 weights.
 *
 * The frame is read into a 16x16 render target, so 1 024 bytes describe the whole
 * view: a black render is 0, a night road under headlights is a few hundredths, a
 * daylight sky is over half. Alpha is ignored — a transparent clear is not light.
 */
export function meanLuminance(rgba: ArrayLike<number>, pixels = Math.floor(rgba.length / 4)): number {
  if (!Number.isFinite(pixels) || pixels <= 0) return Number.NaN;
  let sum = 0;
  for (let i = 0; i < pixels; i++) {
    const o = i * 4;
    sum += 0.2126 * (rgba[o] ?? 0) + 0.7152 * (rgba[o + 1] ?? 0) + 0.0722 * (rgba[o + 2] ?? 0);
  }
  return sum / (pixels * 255);
}

/**
 * Mean luminance of a band of rows of a square readback — the road, not the sky.
 *
 * A 16x16 frame of a sunset is mostly sky: the headlights can light every metre
 * of road in front of the car and move the whole-frame mean by less than a
 * thousandth, which is what the first version of the never-black test measured
 * (0.3603 → 0.3603). `readRenderTargetPixels` returns rows bottom-up, so rows
 * 0..5 are the bottom third of the view — where the road is.
 */
export function meanLuminanceRows(
  rgba: ArrayLike<number>,
  rowFrom: number,
  rowTo: number,
  width = 16,
): number {
  const rows = Math.max(0, Math.min(width, rowTo) - Math.max(0, rowFrom));
  if (!rows) return Number.NaN;
  let sum = 0;
  for (let row = Math.max(0, rowFrom); row < Math.min(width, rowTo); row++) {
    for (let col = 0; col < width; col++) {
      const o = (row * width + col) * 4;
      sum += 0.2126 * (rgba[o] ?? 0) + 0.7152 * (rgba[o + 1] ?? 0) + 0.0722 * (rgba[o + 2] ?? 0);
    }
  }
  return sum / (rows * width * 255);
}

// ─── Dark-frame detector ──────────────────────────────────────────────────────

/**
 * Thresholds. Calibrated against what the drive actually draws, not guessed: a
 * night frame with a lit sky reads 0.02–0.06, so `luminance` sits below the
 * dimmest honest frame, and the hold is long enough that a card, a pause or a
 * load cannot trip it.
 */
export const DARK_FRAME = {
  /** Mean luminance below which a frame counts as dark. */
  luminance: 0.012,
  /** How long it must stay dark before it is reported, once. */
  holdS: 3,
  /** How often the sampler reads the frame. */
  sampleS: 2,
  /** Bright time that re-arms the report, so a second black screen is also sent. */
  rearmS: 1,
} as const;

export interface DarkFrameState {
  /** Seconds of continuous dark frames. */
  darkS: number;
  /** Seconds of continuous non-dark frames. */
  brightS: number;
  /** True once this episode has been reported. */
  reported: boolean;
}

export const initialDarkFrame: DarkFrameState = { darkS: 0, brightS: 0, reported: false };

export interface DarkFrameStep {
  state: DarkFrameState;
  /** Was this sample dark? */
  dark: boolean;
  /** Send `client.frame_dark` for this sample (exactly once per episode). */
  report: boolean;
}

/**
 * Step the detector with one sampled mean luminance.
 *
 * Reports once per episode: a phone that renders black for a minute owes one row,
 * not thirty. A frame that stays bright for `rearmS` re-arms it, so a *second*
 * black screen in the same session is reported too.
 */
export function stepDarkFrame(state: DarkFrameState, mean: number, dtS: number): DarkFrameStep {
  // No measurement (a lost context cannot be read) is not a dark frame.
  if (!Number.isFinite(mean)) {
    return { state, dark: false, report: false };
  }
  const dt = Math.max(0, dtS);
  const dark = mean < DARK_FRAME.luminance;

  if (dark) {
    const darkS = state.darkS + dt;
    const report = !state.reported && darkS >= DARK_FRAME.holdS;
    return { state: { darkS, brightS: 0, reported: state.reported || report }, dark: true, report };
  }

  const brightS = state.brightS + dt;
  // Re-arm only after real time in the light, so a single flicker between two
  // dark samples cannot produce a second row for the same episode.
  const reported = state.reported && brightS < DARK_FRAME.rearmS;
  return { state: { darkS: 0, brightS, reported }, dark: false, report: false };
}

// ─── Shader compile / link failures ───────────────────────────────────────────

export interface ShaderError {
  /** Which stage three.js said failed, as far as its own text tells. */
  stage: 'compile' | 'link' | 'other';
  /** The material three.js names in the same error, when it names one. */
  material: string | null;
  /** The console text, truncated — enough to name the shader. */
  detail: string;
}

const SHADER_MARK = /THREE\.WebGLProgram/;
const SHADER_FAIL = /Shader Error|not compiled|LINK_STATUS|VALIDATE_STATUS/i;

/**
 * Read a console-error argument list and return a shader failure, or null.
 *
 * three.js reports a broken program through `console.error` (an `Error` object
 * followed by the info log), never through an exception, so the only way to hear
 * it is to sniff the error channel. The material name is optional in the message;
 * when it is missing the row still names the stage, which is what distinguishes
 * "a shader broke" from "the scene is dark".
 */
export function parseShaderError(args: unknown[]): ShaderError | null {
  const text = args
    .map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'string' ? a : ''))
    .filter(Boolean)
    .join(' ');
  if (!SHADER_MARK.test(text) || !SHADER_FAIL.test(text)) return null;

  // three.js prints one message for both stages (the compile errors arrive in the
  // program info log), so the log text is what separates them: "not compiled" is
  // a shader, LINK_STATUS is the program.
  const stage: ShaderError['stage'] = /not compiled|getShaderInfoLog|ERROR:\s*\d+:\d+/i.test(text)
    ? 'compile'
    : /LINK_STATUS|link failed|link error/i.test(text)
      ? 'link'
      : 'other';

  const named = /Material Name:\s*"?([^"\n]+)"?/.exec(text);
  return {
    stage,
    material: named ? named[1].trim() : null,
    detail: text.replace(/\s+/g, ' ').slice(0, 600),
  };
}

// ─── The live board ?diag=1 reads ─────────────────────────────────────────────

/**
 * What the field diagnostic has measured, for the `?diag=1` board.
 *
 * A mutable singleton rather than a store on purpose: it is written from inside
 * the render loop (no React) and read by one panel on a 250 ms timer, and nothing
 * else in the game may depend on it. Off by default — the panel is the only
 * reader, and the writes are a handful of number assignments.
 */
export interface DiagSnapshot {
  gpu: GpuReport | null;
  tier: string;
  drawCalls: number;
  triangles: number;
  frameMs: number;
  meanLuminance: number;
  /** The bottom third of the same readback — the road under the car. */
  meanLuminanceRoad: number;
  darkS: number;
  context: 'live' | 'lost' | 'restored';
  sceneId: string | null;
  sampleAt: number;
}

export const diag: DiagSnapshot = {
  gpu: null,
  tier: '',
  drawCalls: 0,
  triangles: 0,
  frameMs: 0,
  meanLuminance: Number.NaN,
  meanLuminanceRoad: Number.NaN,
  darkS: 0,
  context: 'live',
  sceneId: null,
  sampleAt: 0,
};

/** True when the URL asks for the live board (`?diag=1`). */
export function diagEnabled(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  try {
    return new URLSearchParams(search).get('diag') === '1';
  } catch {
    return false;
  }
}
