/**
 * FieldDiagnostics — the phone reports what it can see.
 *
 * The black 3D view in 6.3 gave no evidence at all: the HUD ran, the world did
 * not, and LOW/HIGH changed nothing anybody could see. Every candidate cause
 * (a lost context, a shader that never compiled, a tier with no sky, a scene with
 * no light) leaves a different fingerprint, so this component puts the fingerprints
 * on the wire:
 *
 *   - `client.gpu` once per session: the unmasked GPU, the WebGL version, the
 *     texture ceiling, the DPR, the CSS and buffer sizes, the tier, the memory
 *     and core counts, the UA.
 *   - `client.shader_error` when three.js prints a compile/link failure, with the
 *     material name it prints.
 *   - `client.frame_dark` once per dark episode: a 16x16 render-target readback
 *     every ~2 s while a mission owns the car, reported when the mean luminance
 *     has stayed under `DARK_FRAME.luminance` for 3 s.
 *
 * Everything goes through `DriveSync.noteEvent`, so the batched uploader decides
 * when a POST happens: a diagnostic cannot become the flood it explains.
 *
 * `?diag=1` mounts `DiagPanel` beside it and nothing else reads the snapshot.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { useQRStore } from '@/stores/qrStore';
import { DriveSync } from '@/systems/DriveSync';
import {
  DARK_FRAME,
  diag,
  initialDarkFrame,
  meanLuminance,
  meanLuminanceRows,
  parseShaderError,
  readGpuInfo,
  stepDarkFrame,
  type GlLike,
  type GpuReport,
} from '@/systems/diagnostics';
import type { QualityTier } from '@/utils/performance';

/** The readback is deliberately tiny: 16 x 16 is a whole frame's mean. */
const SAMPLE = 16;

function navigatorNumber(key: 'deviceMemory'): number | null {
  if (typeof navigator === 'undefined') return null;
  const v = (navigator as Navigator & { deviceMemory?: number })[key];
  return typeof v === 'number' ? v : null;
}

/** Lights that are actually contributing — the "is the scene lit" half of a dark frame. */
function litLightCount(scene: THREE.Object3D): number {
  let n = 0;
  scene.traverse((o) => {
    const l = o as THREE.Light;
    if (l.isLight && l.intensity > 0 && l.visible) n++;
  });
  return n;
}

export function FieldDiagnostics({
  tier,
  onDevice,
}: {
  tier: QualityTier;
  /** Handed the GPU report once, so the tier can be refined from the real GPU. */
  onDevice?: (report: GpuReport) => void;
}) {
  const { gl, scene, camera } = useThree();
  const target = useMemo(
    () => new THREE.WebGLRenderTarget(SAMPLE, SAMPLE, { depthBuffer: false, stencilBuffer: false }),
    [],
  );
  const pixels = useMemo(() => new Uint8Array(SAMPLE * SAMPLE * 4), []);
  const dark = useRef(initialDarkFrame);
  const sinceSample = useRef(0);
  const gpuSent = useRef(false);

  // One row per session: what this phone's GPU is. Not per tier change — the tier
  // that was chosen at start is the one a dark frame will name, and a second
  // client.gpu row would only be a duplicate.
  useEffect(() => {
    if (gpuSent.current) return;
    gpuSent.current = true;
    try {
      const report = readGpuInfo((gl.getContext() ?? gl.domElement) as unknown as GlLike, {
        tier,
        dpr: gl.getPixelRatio(),
        deviceMemory: navigatorNumber('deviceMemory'),
        hardwareConcurrency: typeof navigator === 'undefined' ? null : navigator.hardwareConcurrency ?? null,
        ua: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      });
      diag.gpu = report;
      diag.tier = tier;
      DriveSync.noteEvent({ ts: Date.now(), event: 'client.gpu', data: { ...report } });
      onDevice?.(report);
    } catch {
      // Diagnostics may never take the Canvas down with them — the first e2e run
      // proved that they can, and a broken report is not worth a black screen.
      gpuSent.current = false;
    }
  }, [gl, tier]);

  // A shader failure is a console.error in three.js, never an exception.
  useEffect(() => {
    const original = console.error;
    console.error = (...args: unknown[]) => {
      const failure = parseShaderError(args);
      if (failure) {
        DriveSync.noteEvent({
          ts: Date.now(),
          event: 'client.shader_error',
          data: { ...failure, scene: useQRStore.getState().sceneId, tier },
        });
      }
      original.apply(console, args as unknown[] as []);
    };
    return () => {
      console.error = original;
    };
  }, [tier]);

  useEffect(() => () => target.dispose(), [target]);

  useFrame((_, delta) => {
    // The ?diag board reads these; they are a handful of assignments when off.
    diag.frameMs = diag.frameMs === 0 ? delta * 1000 : THREE.MathUtils.lerp(diag.frameMs, delta * 1000, 0.1);
    // gl.info is reset by every render, so these are the previous frame's scene
    // pass — read before the 16x16 sample below resets them again.
    diag.drawCalls = gl.info.render.calls;
    diag.triangles = gl.info.render.triangles;
    diag.tier = tier;
    const context = gl.getContext();
    diag.context = context.isContextLost() ? 'lost' : diag.context === 'lost' ? 'restored' : 'live';

    // A dark frame only means something while the world is the surface: the car
    // driving, a frozen scene mid-line, or the walker between beats. A menu does
    // not draw the world at all, and a paused game draws the frame it froze.
    const st = useGameStore.getState();
    const hud = useQRHud.getState();
    const worldOnScreen =
      st.worldMode === 'kent' &&
      st.phase !== 'paused' &&
      st.phase !== 'menu' &&
      (hud.missionActive || st.phase === 'driving' || st.phase === 'dialogue' || st.phase === 'walking');
    if (!worldOnScreen) {
      sinceSample.current = 0;
      return;
    }
    if (context.isContextLost()) return;

    sinceSample.current += delta;
    if (sinceSample.current < DARK_FRAME.sampleS) return;
    const dtS = sinceSample.current;
    sinceSample.current = 0;

    let mean = Number.NaN;
    let roadMean = Number.NaN;
    try {
      const previous = gl.getRenderTarget();
      gl.setRenderTarget(target);
      gl.render(scene, camera);
      gl.readRenderTargetPixels(target, 0, 0, SAMPLE, SAMPLE, pixels);
      gl.setRenderTarget(previous);
      mean = meanLuminance(pixels);
      roadMean = meanLuminanceRows(pixels, 0, Math.round(SAMPLE * 0.35), SAMPLE);
    } catch {
      // A readback that fails is not a dark frame — it is no measurement, and
      // stepDarkFrame treats NaN as such.
      mean = Number.NaN;
      roadMean = Number.NaN;
    }

    const step = stepDarkFrame(dark.current, mean, dtS);
    dark.current = step.state;
    diag.meanLuminance = mean;
    diag.meanLuminanceRoad = roadMean;
    diag.darkS = step.state.darkS;
    diag.sceneId = useQRStore.getState().sceneId;
    diag.sampleAt = Date.now();

    if (step.report) {
      DriveSync.noteEvent({
        ts: Date.now(),
        event: 'client.frame_dark',
        data: {
          scene: diag.sceneId,
          tier,
          mean: Number(mean.toFixed(4)),
          dark_s: Number(step.state.darkS.toFixed(1)),
          lights: litLightCount(scene),
          camera: [Math.round(camera.position.x), Math.round(camera.position.y), Math.round(camera.position.z)],
          dpr: gl.getPixelRatio(),
          context: context.isContextLost() ? 'lost' : 'live',
          headlights: st.headlights,
          time_of_day: st.timeOfDay,
        },
      });
    }
  });

  return null;
}

// ─── The live board (?diag=1) ─────────────────────────────────────────────────

/**
 * The same numbers on screen, for the times a phone is in a hand and the console
 * is not. It polls a plain object on a 250 ms timer: off by default, and when it
 * is on it is four times a second, not once a frame.
 */
export function DiagPanel() {
  const [snap, setSnap] = useState(() => ({ ...diag }));
  useEffect(() => {
    const t = window.setInterval(() => setSnap({ ...diag }), 250);
    return () => window.clearInterval(t);
  }, []);
  const gpu = snap.gpu;
  const rows: Array<[string, string]> = [
    ['tier', `${snap.tier || '—'} · dpr ${gpu ? gpu.dpr : '—'}`],
    ['gpu', gpu ? `${gpu.unmaskedRenderer ?? gpu.renderer} · ${gpu.unmaskedVendor ?? gpu.vendor}` : '—'],
    ['webgl', gpu ? `${gpu.version} · max tex ${gpu.maxTextureSize}` : '—'],
    ['canvas', gpu ? `${gpu.cssWidth}x${gpu.cssHeight} css · ${gpu.bufferWidth}x${gpu.bufferHeight} px` : '—'],
    ['draws', `${snap.drawCalls} calls · ${snap.triangles} tris · ${snap.frameMs.toFixed(1)} ms`],
    ['luma', `${Number.isFinite(snap.meanLuminance) ? snap.meanLuminance.toFixed(4) : '—'} · dark ${snap.darkS.toFixed(1)} s`],
    ['context', snap.context],
    ['scene', snap.sceneId ?? '—'],
    ['device', gpu ? `${gpu.deviceMemory ?? '?'} GB · ${gpu.hardwareConcurrency ?? '?'} cores` : '—'],
  ];
  return (
    <div
      data-layer="diag"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 'calc(8px + env(safe-area-inset-bottom))',
        zIndex: 400,
        maxWidth: 320,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(6,8,12,0.86)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#e8e6e1',
        font: '10px/1.45 ui-monospace, Menlo, Consolas, monospace',
        pointerEvents: 'none',
      }}
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          <span style={{ color: '#F28DB2' }}>{k}</span> {v}
        </div>
      ))}
    </div>
  );
}
