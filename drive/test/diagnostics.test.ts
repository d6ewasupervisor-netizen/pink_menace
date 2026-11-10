/**
 * diagnostics — the numbers a black screen leaves behind.
 *
 * The drive reported nothing when 6.3 rendered black on Android, so the first
 * job is making the phone able to say what it saw. These tests measure the pure
 * half: what a context reports, what a 16x16 readback reads, when a dark frame
 * becomes a finding (once, not thirty times), and which console errors are shader
 * failures rather than noise.
 */
import { describe, expect, it } from 'vitest';
import {
  DARK_FRAME,
  diagEnabled,
  initialDarkFrame,
  meanLuminance,
  meanLuminanceRows,
  parseShaderError,
  readGpuInfo,
  stepDarkFrame,
  type DarkFrameState,
  type GlLike,
} from '../src/systems/diagnostics';

function stubGl(opts: { ext?: boolean } = {}): GlLike {
  const params: Record<number, unknown> = {
    0x1f02: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    0x1f00: 'WebKit',
    0x1f01: 'WebKit WebGL',
    0x0d33: 8192,
    0x9245: 'Qualcomm',
    0x9246: 'Adreno (TM) 640',
  };
  return {
    drawingBufferWidth: 1236,
    drawingBufferHeight: 2745,
    domElement: { getBoundingClientRect: () => ({ width: 412, height: 915 }) },
    getParameter: (p: number) => params[p],
    getExtension: (name: string) =>
      name === 'WEBGL_debug_renderer_info' && opts.ext !== false
        ? { UNMASKED_VENDOR_WEBGL: 0x9245, UNMASKED_RENDERER_WEBGL: 0x9246 }
        : null,
  };
}

describe('readGpuInfo', () => {
  it('reports the unmasked GPU, the buffer and the CSS box', () => {
    const report = readGpuInfo(stubGl(), {
      tier: 'mid',
      dpr: 1.5,
      deviceMemory: 4,
      hardwareConcurrency: 8,
      ua: 'Android 14; Pixel 7',
    });

    expect(report.unmaskedVendor).toBe('Qualcomm');
    expect(report.unmaskedRenderer).toBe('Adreno (TM) 640');
    expect(report.version).toContain('WebGL 2.0');
    expect(report.maxTextureSize).toBe(8192);
    expect(report.cssWidth).toBe(412);
    expect(report.cssHeight).toBe(915);
    // The buffer is what the GPU fills; CSS size is what the player sees.
    expect(report.bufferWidth).toBe(1236);
    expect(report.tier).toBe('mid');
    expect(report.deviceMemory).toBe(4);
  });

  it('survives a context without the debug extension', () => {
    const report = readGpuInfo(stubGl({ ext: false }), {
      tier: 'low',
      dpr: 1,
      deviceMemory: null,
      hardwareConcurrency: null,
      ua: 'ua',
    });
    expect(report.unmaskedVendor).toBeNull();
    expect(report.unmaskedRenderer).toBeNull();
    expect(report.renderer).toBe('WebKit WebGL');
    expect(report.deviceMemory).toBeNull();
  });

  it('reads the element from a real context (`canvas`) and from a renderer (`domElement`)', () => {
    // A WebGL context has no `domElement` — that is the renderer's. Reading the
    // wrong one threw on the first e2e run and took the Canvas down with it.
    const context: GlLike = {
      drawingBufferWidth: 824,
      drawingBufferHeight: 1830,
      canvas: { getBoundingClientRect: () => ({ width: 412, height: 915 }) },
      getParameter: () => 0,
      getExtension: () => null,
    };
    const fromContext = readGpuInfo(context, { tier: 'mid', dpr: 2, deviceMemory: null, hardwareConcurrency: null, ua: '' });
    expect(fromContext.cssWidth).toBe(412);
    expect(fromContext.cssHeight).toBe(915);

    const fromRenderer = readGpuInfo(stubGl(), { tier: 'mid', dpr: 2, deviceMemory: null, hardwareConcurrency: null, ua: '' });
    expect(fromRenderer.cssWidth).toBe(412);

    // Neither: no element is zero pixels, not a throw.
    const nothing: GlLike = { drawingBufferWidth: 0, drawingBufferHeight: 0, getParameter: () => 0, getExtension: () => null };
    expect(readGpuInfo(nothing, { tier: 'low', dpr: 1, deviceMemory: null, hardwareConcurrency: null, ua: '' }).cssWidth).toBe(0);
  });
});

describe('meanLuminance', () => {
  it('reads black as 0 and white as 1', () => {
    expect(meanLuminance(new Uint8Array(16 * 16 * 4))).toBe(0);
    const white = new Uint8Array(16 * 16 * 4).fill(255);
    expect(meanLuminance(white)).toBeCloseTo(1, 5);
  });

  it('weights the channels the way an eye does, and ignores alpha', () => {
    const green = new Uint8Array([0, 255, 0, 255]);
    expect(meanLuminance(green)).toBeCloseTo(0.7152, 4);
    const transparent = new Uint8Array([0, 0, 0, 255]);
    expect(meanLuminance(transparent)).toBe(0);
  });

  it('says "no measurement" rather than zero when there is nothing to read', () => {
    expect(meanLuminance(new Uint8Array(0))).toBeNaN();
    expect(meanLuminance(new Uint8Array(0), 0)).toBeNaN();
  });

  it('can read one band of rows — the road, not the sky', () => {
    // 16 rows: the bottom 6 are the road (white), the rest are sky (black).
    const buf = new Uint8Array(16 * 16 * 4);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 16; col++) {
        const o = (row * 16 + col) * 4;
        buf[o] = buf[o + 1] = buf[o + 2] = 255;
        buf[o + 3] = 255;
      }
    }
    expect(meanLuminance(buf)).toBeCloseTo(6 / 16, 4);
    expect(meanLuminanceRows(buf, 0, 6)).toBeCloseTo(1, 4);
    expect(meanLuminanceRows(buf, 10, 16)).toBeCloseTo(0, 4);
    expect(meanLuminanceRows(buf, 0, 0)).toBeNaN();
  });
});

describe('stepDarkFrame', () => {
  const run = (state: DarkFrameState, mean: number, dtS: number) => stepDarkFrame(state, mean, dtS);

  it('does not report a dark frame before the hold has elapsed', () => {
    let s = initialDarkFrame;
    const first = run(s, 0.001, DARK_FRAME.sampleS);
    s = first.state;
    expect(first.report).toBe(false);
    expect(s.darkS).toBeCloseTo(DARK_FRAME.sampleS, 5);
    expect(s.reported).toBe(false);
  });

  it('reports exactly once per episode', () => {
    let s = initialDarkFrame;
    const reports: number[] = [];
    for (let i = 0; i < 10; i++) {
      const step = run(s, 0.0, DARK_FRAME.sampleS);
      s = step.state;
      if (step.report) reports.push(i);
    }
    expect(reports).toHaveLength(1);
    // 2 s samples: the second sample is the first one at or past the 3 s hold.
    expect(reports[0]).toBe(1);
    expect(s.reported).toBe(true);
  });

  it('never reports while a bright frame is in the window', () => {
    let s = initialDarkFrame;
    s = run(s, 0, 1).state;
    s = run(s, 0.4, 1).state; // headlights: a bright sample resets the run
    s = run(s, 0, 1).state;
    const step = run(s, 0, 1);
    expect(step.report).toBe(false);
    expect(step.state.darkS).toBe(2);
  });

  it('treats a lost context (no readback) as no finding', () => {
    let s = initialDarkFrame;
    s = run(s, 0, 2).state;
    const lost = run(s, Number.NaN, 2);
    expect(lost.report).toBe(false);
    expect(lost.dark).toBe(false);
    expect(lost.state).toBe(s);
  });

  it('re-arms after real time in the light, and not on a flicker', () => {
    let s = initialDarkFrame;
    for (let i = 0; i < 3; i++) s = run(s, 0, 2).state;
    expect(s.reported).toBe(true);

    // A bright sample shorter than the re-arm window keeps the episode closed.
    const flicker = run(s, 0.5, DARK_FRAME.rearmS / 2);
    expect(flicker.state.reported).toBe(true);
    expect(run(flicker.state, 0, 2).report).toBe(false);

    // A full bright second re-arms it; a new episode reports again.
    let t = run(flicker.state, 0.5, DARK_FRAME.rearmS).state;
    expect(t.reported).toBe(false);
    t = run(t, 0, 2).state;
    expect(t.reported).toBe(false);
    expect(run(t, 0, 2).report).toBe(true);
  });
});

describe('parseShaderError', () => {
  it('finds the material three.js names on a compile failure', () => {
    const err = new Error(
      'THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false\n\nProgram Info Log: Fragment shader is not compiled.\n\nMaterial Name: road-wet',
    );
    const parsed = parseShaderError([err, '']);
    expect(parsed).not.toBeNull();
    expect(parsed!.stage).toBe('compile');
    expect(parsed!.material).toBe('road-wet');
    expect(parsed!.detail).toContain('Fragment shader is not compiled');
  });

  it('reads a link failure and survives a message with no material', () => {
    const parsed = parseShaderError(['THREE.WebGLProgram: Shader Error 1 - LINK_STATUS false']);
    expect(parsed!.stage).toBe('link');
    expect(parsed!.material).toBeNull();

    const bare = parseShaderError(['THREE.WebGLProgram: Shader Error 2']);
    expect(bare!.stage).toBe('other');
  });

  it('ignores console noise that is not a shader failure', () => {
    expect(parseShaderError(['THREE.WebGLRenderer: Context Lost.'])).toBeNull();
    expect(parseShaderError([new Error('Failed to load texture')])).toBeNull();
    expect(parseShaderError([])).toBeNull();
  });
});

describe('diagEnabled', () => {
  it('is off unless the URL asks for it', () => {
    expect(diagEnabled('')).toBe(false);
    expect(diagEnabled('?tier=low')).toBe(false);
    expect(diagEnabled('?diag=0')).toBe(false);
    expect(diagEnabled('?tier=low&diag=1')).toBe(true);
  });
});
