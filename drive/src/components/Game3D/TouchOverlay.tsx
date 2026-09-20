/**
 * TouchOverlay — always-visible touch control zones for mobile.
 *
 * Layout mirrors useTouchControls zone split:
 *   Left 50 %  → STEER (position-based: far-left = full-left, far-right = full-right)
 *   Right 50 %, upper 65 % → GAS
 *   Right 50 %, lower 35 % → BRAKE
 *
 * The overlay is purely visual (pointerEvents: none).  All actual touch events
 * are handled by useTouchControls listening on #game-touch-area.
 */
import { useGameStore } from '@/stores/gameStore';

// Must match constants in useTouchControls.ts
const BRAKE_SPLIT = 0.65; // fraction of screen height below which = brake (right zone)

function SteerZone({ steering }: { steering: number }) {
  // Track: 80 % wide, centered in the zone
  // Knob: slides left/right with the steering value (−1 → 0 → +1)
  const knobPct = ((steering + 1) / 2) * 100; // 0 % = far left, 100 % = far right

  return (
    <div style={styles.steerZone}>
      {/* Direction labels */}
      <div style={styles.steerLabels}>
        <span style={styles.steerArrow}>◄</span>
        <span style={styles.steerWord}>STEER</span>
        <span style={styles.steerArrow}>►</span>
      </div>

      {/* Horizontal track + sliding knob */}
      <div style={styles.steerTrack}>
        {/* Centre line */}
        <div style={styles.steerCentreMark} />
        {/* Moving knob */}
        <div
          style={{
            ...styles.steerKnob,
            left: `${knobPct}%`,
            // Highlight when actually steering
            background: Math.abs(steering) > 0.05 ? '#F28DB2' : 'rgba(255,255,255,0.35)',
            boxShadow: Math.abs(steering) > 0.05
              ? '0 0 8px rgba(242,141,178,0.7)'
              : 'none',
          }}
        />
      </div>

      {/* Hint text — shown only when straight */}
      {Math.abs(steering) < 0.05 && (
        <div style={styles.steerHint}>slide left or right</div>
      )}
    </div>
  );
}

function GasZone({ throttle }: { throttle: number }) {
  const active = throttle > 0.05;
  return (
    <div
      style={{
        ...styles.gasZone,
        background: active
          ? 'rgba(57,255,20,0.18)'
          : 'rgba(57,255,20,0.06)',
        borderTop: `2px solid ${active ? 'rgba(57,255,20,0.6)' : 'rgba(57,255,20,0.18)'}`,
      }}
    >
      <span style={{ ...styles.pedalWord, color: active ? '#39ff14' : 'rgba(57,255,20,0.45)' }}>
        GAS
      </span>
      {/* Fill bar rises from bottom */}
      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${throttle * 100}%`,
            background: 'rgba(57,255,20,0.12)',
            borderRadius: '0 0 8px 8px',
            transition: 'height 60ms',
          }}
        />
      )}
    </div>
  );
}

function BrakeZone({ brake }: { brake: number }) {
  const active = brake > 0.05;
  return (
    <div
      style={{
        ...styles.brakeZone,
        background: active
          ? 'rgba(255,68,68,0.22)'
          : 'rgba(255,68,68,0.06)',
        borderTop: `2px solid ${active ? 'rgba(255,68,68,0.6)' : 'rgba(255,68,68,0.2)'}`,
      }}
    >
      <span style={{ ...styles.pedalWord, color: active ? '#ff4444' : 'rgba(255,68,68,0.4)' }}>
        BRAKE
      </span>
    </div>
  );
}

export function TouchOverlay() {
  const steering = useGameStore((s) => s.steering);
  const throttle = useGameStore((s) => s.throttle);
  const brake = useGameStore((s) => s.brake);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'driving' && phase !== 'walking') return null;

  return (
    <div style={styles.root} aria-hidden>
      {/* ── Left 50 %: steering ────────────────────────────── */}
      <div style={styles.leftHalf}>
        <SteerZone steering={steering} />
      </div>

      {/* ── Right 50 %: gas + brake ────────────────────────── */}
      <div style={styles.rightHalf}>
        <GasZone throttle={throttle} />
        <BrakeZone brake={brake} />
      </div>
    </div>
  );
}

const BOTTOM_CTRL_HEIGHT = '38%'; // control zone occupies bottom 38 % of screen

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 48,
    display: 'flex',
    alignItems: 'flex-end',
  },

  // ── Left zone (steer) ────────────────────────────────────────────────────────
  leftHalf: {
    width: '50%',
    height: BOTTOM_CTRL_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '0 0 0 12px',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  steerZone: {
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  steerLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  steerArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    fontWeight: 300,
  },
  steerWord: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: '0.2em',
    fontWeight: 600,
  },
  steerTrack: {
    position: 'relative',
    width: '100%',
    height: 6,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
  },
  steerCentreMark: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 2,
    height: 14,
    background: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  steerKnob: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
    transition: 'background 100ms, box-shadow 100ms',
  },
  steerHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    letterSpacing: '0.1em',
  },

  // ── Right zone (gas + brake) ─────────────────────────────────────────────────
  rightHalf: {
    width: '50%',
    height: BOTTOM_CTRL_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0 0 12px 0',
    overflow: 'hidden',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  gasZone: {
    flex: `0 0 ${BRAKE_SPLIT * 100}%`,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 80ms',
    borderRadius: '0 0 0 0',
  },
  brakeZone: {
    flex: '1 1 auto',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 80ms',
    borderRadius: '0 0 12px 0',
  },
  pedalWord: {
    fontSize: 12,
    letterSpacing: '0.2em',
    fontWeight: 700,
    zIndex: 1,
    transition: 'color 80ms',
  },
};
