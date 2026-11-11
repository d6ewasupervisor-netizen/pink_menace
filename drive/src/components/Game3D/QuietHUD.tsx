/**
 * QuietHUD — the noise bar, the lights/horn pair, and toasts.
 *
 * ITEM 3.3 moved the old "meter" out of the top band: a 46 px labelled widget with
 * a track, two threshold marks and a sub-label, sitting *under* the act badge at
 * 390x844 (measured 168x46 at (111,6) with the badge at (102,66)). What is left is
 * the spec's 6 px bar across the top, with the words — "QUIET · 22 dB · 3 looking"
 * — fading in when the value changes and leaving 2.5 s later. A bar that is always
 * labelled is a bar you stop reading.
 *
 * The lights/horn pair moved with it: they were 52 px buttons on the far left at
 * `bottom: 312px`, under the nav panel and away from the thumb that uses them. They
 * are now 44 px, inside the control band, above the right stick — `buttonOrigin()`
 * in `cockpit/spec.ts` owns both the position and the "above it, or beside it where
 * the band has no room" rule, and the unit test pins it at five shapes.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useCompactHud } from '@/hooks/useCompactHud';
import { steerCorner } from '@/input/driveInput';
import { actForScene } from '@/quietroads';
import { buzz } from '@/quietroads/haptics';
import { specForAct } from './sceneSpec';
import { buttonOrigin, type CockpitSpec } from './cockpit/spec';
import { useCockpitSpec, useCompoundCockpit, useDrivingHud } from './cockpit/layout';
import { tokens } from './cockpit/tokens';

const BAND = [
  { word: 'QUIET', color: '#39ff14', shape: '●' },
  { word: 'HEARD', color: '#ffd93d', shape: '▲' },
  { word: 'LOUD',  color: '#ff4444', shape: '■' },
] as const;

/** How long the noise words stay up after a change. The plan says 2.5 s. */
const NOISE_HOLD_MS = 2_500;

export function QuietHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const frame = useQRHud((s) => s.frame);
  const toast = useQRHud((s) => s.toast);
  const sceneId = useQRStore((s) => s.sceneId);
  const setHorn = useQRHud((s) => s.setHorn);
  const headlights = useGameStore((s) => s.headlights);
  const cycleHeadlights = useGameStore((s) => s.cycleHeadlights);
  // ITEM 5.1: the player's HAPTICS switch. Read here, at the press, not in the
  // haptics module — the module is pure and the switch is the panel's.
  const haptics = useGameStore((s) => s.haptics);
  const run = useQRHud((s) => s.run);
  const setRun = useQRHud((s) => s.setRun);
  const scheme = useGameStore((s) => s.controlsScheme);
  const compact = useCompactHud();
  const hornOnLeft = compact && steerCorner(scheme) === 'left';
  const compound = useCompoundCockpit();
  const drivingHudVisible = useDrivingHud();
  const spec = useCockpitSpec();

  // ── the noise words: up on change, gone 2.5 s later ─────────────────────
  const db = frame?.noiseDb ?? 20;
  const lastDb = useRef(db);
  const changedAt = useRef(0);
  const [now, setNow] = useState(0);
  if (db !== lastDb.current) {
    lastDb.current = db;
    changedAt.current = performance.now();
  }
  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const showWords = now - changedAt.current < NOISE_HOLD_MS;

  if (worldMode !== 'kent') return null;
  const walking = phase === 'walking';
  // The noise bar and the buttons are a *driving* surface: down on foot and down
  // under a compound surface. The cockpit rule adds the one case that was broken —
  // a mission running with the phase left behind by a card.
  const livePhase = phase === 'driving' || phase === 'walking';
  const drivingHud = livePhase ? phase === 'driving' && !compound : drivingHudVisible;
  // The Quiet meter belongs on every playable act (owner decision, 2026-10-05);
  // the scene spec is what says so, one place for all of them.
  const meter = specForAct((sceneId ? actForScene(sceneId) : null) ?? 'I').quiet;
  const band = BAND[frame?.noiseBand ?? 0];
  const pct = Math.max(0, Math.min(1, (db - 20) / 80));
  const counts = QuietRoads.sim.quietSummary();
  const awake = counts.curious + counts.alert + counts.swarm;

  const lights = buttonOrigin(spec, 0);
  const horn = buttonOrigin(spec, 1);

  return (
    <div data-layer="world-hud" style={styles.root}>
      {/* Noise bar — the 6 px strip the spec budgets for, across the full column. */}
      {drivingHud && meter && (
        <div
          data-noise-meter
          data-noise-band={band.word}
          style={noiseBarStyle(spec)}
          role="img"
          aria-label={`${band.word}, ${Math.round(db)} decibels`}
        >
          <div style={{ ...styles.meterTrack, height: Math.max(spec.noise.height, 4) }}>
            <div style={{ ...styles.meterFill, width: `${pct * 100}%`, background: band.color }} />
            <div style={{ ...styles.meterMark, left: `${((55 - 20) / 80) * 100}%` }} />
            <div style={{ ...styles.meterMark, left: `${((75 - 20) / 80) * 100}%` }} />
          </div>
          {showWords && (
            <div data-noise-sub-label style={{ ...styles.words, color: band.color }}>
              {band.shape} {band.word} · {Math.round(db)} dB
              {awake > 0 ? ` · ${awake} looking` : ''}
            </div>
          )}
        </div>
      )}

      {/* The lights/horn pair: 44 px, inside the control band, on the thumb's side. */}
      {drivingHud && (
        <>
          <button
            data-ui
            data-layer="lights"
            style={{
              ...styles.button,
              left: hornOnLeft ? horn.x : lights.x,
              top: hornOnLeft ? horn.y : lights.y,
              width: lights.size,
              height: lights.size,
              ...(headlights === 'off'
                ? styles.lightsOff
                : headlights === 'high'
                  ? styles.lightsHigh
                  : styles.lightsLow),
            }}
            onPointerDown={(e) => { e.preventDefault(); buzz('button', { enabled: haptics }); cycleHeadlights(); }}
            aria-label="Headlights (L)"
          >
            {headlights === 'off' ? 'OFF' : headlights === 'high' ? 'HIGH' : 'LOW'}
          </button>
          <button
            data-ui
            data-layer="horn"
            style={{
              ...styles.button,
              left: hornOnLeft ? lights.x : horn.x,
              top: hornOnLeft ? lights.y : horn.y,
              width: horn.size,
              height: horn.size,
              borderColor: '#ff4444',
              background: 'rgba(120,20,20,0.55)',
              color: '#ff9a9a',
            }}
            // ITEM 5.1: a horn that is only a 44 px rectangle does not feel pressed.
            // `setHorn` still does the sounding; the buzz is the hand's half of it.
            onPointerDown={(e) => { e.preventDefault(); buzz('horn', { enabled: haptics }); setHorn(true); }}
            onPointerUp={() => setHorn(false)}
            onPointerLeave={() => setHorn(false)}
            onPointerCancel={() => setHorn(false)}
            aria-label="Horn (H)"
          >
            HORN
          </button>
        </>
      )}

      {/* On foot, the same slot carries RUN — the walker's only speed control. */}
      {walking && !compound && (
        <button
          data-ui
          data-layer="run"
          style={{
            ...styles.button,
            left: lights.x,
            top: lights.y,
            width: lights.size,
            height: lights.size,
            borderColor: run ? '#ffd93d' : '#888',
            background: run ? 'rgba(120,100,20,0.6)' : 'rgba(30,30,40,0.55)',
            color: run ? '#ffe680' : '#bbb',
          }}
          onPointerDown={(e) => { e.preventDefault(); setRun(!run); }}
          aria-label="Run (Shift)"
        >
          {run ? 'RUNNING' : 'WALK'}
        </button>
      )}

      {toast && (
        <div
          data-layer="toast"
          style={{
            ...styles.toast,
            bottom: spec.dialogue.bottom + tokens.space.sm,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/** The noise bar's band: full column width, the spec's 6 px, at the spec's y. */
function noiseBarStyle(spec: CockpitSpec): React.CSSProperties {
  return {
    position: 'fixed',
    top: spec.noise.y,
    left: spec.noise.x,
    width: spec.noise.width,
    height: Math.max(spec.noise.height, 4),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: tokens.z.hud,
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 210, fontFamily: tokens.fonts.ui },
  // The track is the band itself; the fill is the value.
  meterTrack: { position: 'relative', width: '100%', background: 'rgba(0,0,0,0.55)', overflow: 'hidden' },
  meterFill: { height: '100%', transition: 'width 80ms linear, background 200ms' },
  meterMark: { position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.45)' },
  // The words: one line, under the bar, only while the value is moving.
  words: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 'var(--qr-type-micro)',
    fontWeight: 800,
    letterSpacing: '0.1em',
    textShadow: '0 1px 4px #000',
    whiteSpace: 'nowrap',
  },
  // The lights/horn pair: 44 px, glass, in the control band.
  button: {
    position: 'fixed',
    borderRadius: tokens.radius.sm,
    border: '2px solid #ffe6b0',
    fontWeight: 800,
    fontSize: 'var(--qr-type-micro)',
    letterSpacing: '0.06em',
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
    backdropFilter: 'var(--qr-blur)',
    WebkitBackdropFilter: 'var(--qr-blur)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: tokens.z.hud + 1,
  },
  lightsOff: { borderColor: '#666', background: 'rgba(20,20,24,0.55)', color: '#aaa' },
  lightsLow: { borderColor: '#ffe6b0', background: 'rgba(80,60,20,0.6)', color: '#ffe6b0' },
  lightsHigh: { borderColor: '#fff6d0', background: 'rgba(150,110,30,0.75)', color: '#fff8e0' },
  toast: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10,12,18,0.92)',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: tokens.radius.lg,
    fontSize: 'calc(14px * var(--qr-text-scale, 1))',
    border: `1px solid ${tokens.colors.stroke}`,
    maxWidth: '90vw',
    zIndex: tokens.z.hud + 1,
  },
  toastPhone: { maxWidth: '86vw' },
};

