/**
 * QuietHUD — Quiet Roads overlay: noise meter (colour + shape + word, so it
 * reads without colour), posted speed limit vs. your speed,
 * horn button, toasts. Sits alongside the existing GameHUD/EngineHUD.
 */
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useCompactHud } from '@/hooks/useCompactHud';
import { steerCorner } from '@/input/driveInput';
import { phoneChrome } from './cockpit/tokens';

const BAND = [
  { word: 'QUIET', color: '#39ff14', shape: '●' },
  { word: 'HEARD', color: '#ffd93d', shape: '▲' },
  { word: 'LOUD',  color: '#ff4444', shape: '■' },
] as const;

export function QuietHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const frame = useQRHud((s) => s.frame);
  const toast = useQRHud((s) => s.toast);
  const tp = useQRStore((s) => s.vars.trade_points ?? 0);
  const setHorn = useQRHud((s) => s.setHorn);
  const headlights = useGameStore((s) => s.headlights);
  const cycleHeadlights = useGameStore((s) => s.cycleHeadlights);
  const run = useQRHud((s) => s.run);
  const setRun = useQRHud((s) => s.setRun);
  const scheme = useGameStore((s) => s.controlsScheme);
  const compact = useCompactHud();
  const hornOnLeft = compact && steerCorner(scheme) === 'left';

  if (worldMode !== 'kent') return null;
  const driving = phase === 'driving';
  const walking = phase === 'walking';
  const active = driving || walking;
  const band = BAND[frame?.noiseBand ?? 0];
  const db = frame?.noiseDb ?? 20;
  const pct = Math.max(0, Math.min(1, (db - 20) / 80));
  const counts = QuietRoads.sim.quietSummary();
  const awake = counts.curious + counts.alert + counts.swarm;

  return (
    <div style={styles.root}>
      {/* Noise meter — top centre */}
      {active && (
        <div style={{ ...styles.meterWrap, ...(compact ? styles.meterWrapCompact : null) }}>
          <div style={styles.meterLabel}>
            <span style={{ color: band.color, fontWeight: 800 }}>{band.shape} {band.word}</span>
            <span style={{ color: '#777' }}>{Math.round(db)} dB</span>
          </div>
          <div style={styles.meterTrack}>
            <div style={{ ...styles.meterFill, width: `${pct * 100}%`, background: band.color }} />
            <div style={{ ...styles.meterMark, left: `${((55 - 20) / 80) * 100}%` }} />
            <div style={{ ...styles.meterMark, left: `${((75 - 20) / 80) * 100}%` }} />
          </div>
          <div style={styles.awake}>
            {awake === 0 ? 'nobody\u2019s looking' : `${awake} looking${counts.swarm ? ` · ${counts.swarm} coming` : ''}`}
          </div>
        </div>
      )}

      <div style={{ ...styles.tp, ...(compact ? styles.tpCompact : null) }}>TP {Math.round(tp)}</div>

      {driving && (
        <button
          data-ui
          style={{
            ...styles.lights,
            ...(compact ? styles.lightsCompact : null),
            ...(hornOnLeft ? styles.lightsLeft : null),
            ...(headlights === 'off'
              ? styles.lightsOff
              : headlights === 'high'
                ? styles.lightsHigh
                : styles.lightsLow),
          }}
          onPointerDown={(e) => { e.preventDefault(); cycleHeadlights(); }}
          aria-label="Headlights (L)"
        >
          {headlights === 'off' ? 'OFF' : headlights === 'high' ? 'HIGH' : 'LOW'}
        </button>
      )}

      {/* Horn — big, deliberately in the way, because it should be a decision */}
      {driving && (
        <button
          data-ui
          style={{
            ...styles.horn,
            ...(compact ? styles.hornCompact : null),
            ...(hornOnLeft ? styles.hornLeft : null),
          }}
          onPointerDown={(e) => { e.preventDefault(); setHorn(true); }}
          onPointerUp={() => setHorn(false)}
          onPointerLeave={() => setHorn(false)}
          onPointerCancel={() => setHorn(false)}
          aria-label="Horn (H)"
        >
          HORN
        </button>
      )}

      {walking && (
        <button
          data-ui
          style={{
            ...styles.horn,
            ...(compact ? styles.hornCompact : null),
            ...(hornOnLeft ? styles.hornLeft : null),
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

      {toast && <div style={{ ...styles.toast, ...(compact ? styles.toastPhone : null) }}>{toast}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 210, fontFamily: 'system-ui, sans-serif' },
  meterWrap: { position: 'absolute', top: 'calc(10px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', width: 220 },
  meterWrapCompact: { width: 168, top: 'calc(6px + env(safe-area-inset-top))' },
  meterLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 'calc(12px * var(--qr-text-scale, 1))', letterSpacing: '0.1em', marginBottom: 3 },
  meterTrack: { position: 'relative', height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' },
  meterFill: { height: '100%', transition: 'width 80ms linear, background 200ms' },
  meterMark: { position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.5)' },
  awake: { textAlign: 'center', fontSize: 'calc(10px * var(--qr-text-scale, 1))', color: '#999', marginTop: 3, letterSpacing: '0.08em' },
  tp: { position: 'absolute', top: 'calc(10px + env(safe-area-inset-top))', right: 16, color: '#ffd93d', fontWeight: 800, fontSize: 'calc(13px * var(--qr-text-scale, 1))', letterSpacing: '0.08em', background: 'rgba(0,0,0,0.45)', padding: '4px 8px', borderRadius: 6 },
  tpCompact: { top: 'calc(52px + env(safe-area-inset-top))', right: 12, fontSize: 'calc(11px * var(--qr-text-scale, 1))', padding: '3px 7px' },
  lights: { position: 'absolute', bottom: 'calc(168px + env(safe-area-inset-bottom))', right: 16, width: 64, height: 64, borderRadius: 32, border: '2px solid #ffe6b0', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', pointerEvents: 'auto', touchAction: 'none', userSelect: 'none' },
  lightsCompact: { bottom: 'calc(312px + env(safe-area-inset-bottom))', right: 12, width: 52, height: 52, borderRadius: 26, fontSize: 10 },
  lightsLeft: { right: 'auto', left: 12 },
  lightsOff: { borderColor: '#666', background: 'rgba(20,20,24,0.55)', color: '#aaa' },
  lightsLow: { borderColor: '#ffe6b0', background: 'rgba(80,60,20,0.6)', color: '#ffe6b0' },
  lightsHigh: { borderColor: '#fff6d0', background: 'rgba(150,110,30,0.75)', color: '#fff8e0' },
  horn: { position: 'absolute', bottom: 'calc(96px + env(safe-area-inset-bottom))', right: 16, width: 64, height: 64, borderRadius: 32, border: '2px solid #ff4444', background: 'rgba(120,20,20,0.55)', color: '#ff9a9a', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', pointerEvents: 'auto', touchAction: 'none', userSelect: 'none' },
  hornCompact: { bottom: 'calc(252px + env(safe-area-inset-bottom))', right: 12, width: 52, height: 52, borderRadius: 26, fontSize: 10 },
  hornLeft: { right: 'auto', left: 12 },
  // P12: HUD type scales with the text-size step (var set on the overlay root).\n  toast: { position: 'absolute', bottom: 'calc(180px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,12,18,0.92)', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 'calc(14px * var(--qr-text-scale, 1))', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '90vw' },
  toastPhone: { bottom: phoneChrome.aboveSticks },
};
