/**
 * TouchOverlay — Road Rush stick layouts on the 3D drive.
 *
 *   2 STICK · STEER L/R   horizontal steer + vertical gas/reverse
 *   1 STICK · L/C/R       one thumb: x = steer, y = gas/reverse
 *
 * Rings capture the pointer. Wrappers do not, so the rest of the screen
 * stays free for horn / pause / cards.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useCompactHud } from '@/hooks/useCompactHud';
import { flushDriveInput } from '@/hooks/useTouchControls';
import {
  isSingleStick,
  setStickAxes,
  setTouchHandbrake,
} from '@/input/driveInput';

type StickAxis = 'x' | 'y' | 'radial';
type StickSide = 'left' | 'right' | 'center';

const dualHeld = { steer: 0, throttle: 0, brake: 0, steerOn: false, gasOn: false };

function flushDual() {
  setStickAxes({
    steer: dualHeld.steerOn ? dualHeld.steer : 0,
    throttle: dualHeld.gasOn ? dualHeld.throttle : 0,
    brake: dualHeld.gasOn ? dualHeld.brake : 0,
    active: dualHeld.steerOn || dualHeld.gasOn,
  });
  flushDriveInput();
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function shapeAxis(raw: number, dead: number, curve: number) {
  return Math.abs(raw) < dead
    ? 0
    : Math.sign(raw) * ((Math.abs(raw) - dead) / (1 - dead)) ** curve;
}

function ThumbStick({
  axis,
  side,
  label,
  kind,
  onChange,
}: {
  axis: StickAxis;
  side: StickSide;
  label: string;
  kind: 'steer' | 'throttle' | 'single';
  onChange: (x: number, y: number, active: boolean) => void;
}) {
  const ringRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const ring = ringRef.current;
    const knob = knobRef.current;
    if (!ring || !knob) return;

    const resetKnob = () => {
      knob.style.transform = 'translate(-50%, -50%)';
    };

    const update = (clientX: number, clientY: number) => {
      const rect = ring.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = rect.width * 0.38;
      let dx = clientX - cx;
      let dy = clientY - cy;
      if (axis === 'x') dy = 0;
      if (axis === 'y') dx = 0;
      const mag = Math.hypot(dx, dy);
      if (mag > radius) {
        dx = (dx / mag) * radius;
        dy = (dy / mag) * radius;
      }
      const x = clamp(shapeAxis(dx / radius, 0.1, 1.05), -1, 1);
      const y = clamp(shapeAxis(-dy / radius, 0.08, 0.95), -1, 1);
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      onChangeRef.current(x, y, true);
    };

    const onDown = (e: PointerEvent) => {
      if (pointerRef.current != null) return;
      e.preventDefault();
      e.stopPropagation();
      pointerRef.current = e.pointerId;
      try {
        ring.setPointerCapture(e.pointerId);
      } catch {
        /* some WebViews reject capture */
      }
      ring.parentElement?.classList.add('pm-stick-active');
      update(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (pointerRef.current !== e.pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      update(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (pointerRef.current != null && e.pointerId !== pointerRef.current) return;
      pointerRef.current = null;
      resetKnob();
      ring.parentElement?.classList.remove('pm-stick-active');
      onChangeRef.current(0, 0, false);
    };

    ring.addEventListener('pointerdown', onDown);
    ring.addEventListener('pointermove', onMove);
    ring.addEventListener('pointerup', onUp);
    ring.addEventListener('pointercancel', onUp);
    ring.addEventListener('lostpointercapture', onUp);
    return () => {
      ring.removeEventListener('pointerdown', onDown);
      ring.removeEventListener('pointermove', onMove);
      ring.removeEventListener('pointerup', onUp);
      ring.removeEventListener('pointercancel', onUp);
      ring.removeEventListener('lostpointercapture', onUp);
      resetKnob();
      onChangeRef.current(0, 0, false);
    };
  }, [axis]);

  return (
    <div
      style={{
        ...styles.thumb,
        ...(side === 'left' ? styles.sideLeft : side === 'right' ? styles.sideRight : styles.sideCenter),
      }}
    >
      <div
        ref={ringRef}
        data-ui
        style={{
          ...styles.ring,
          ...(kind === 'throttle' ? styles.ringThrottle : null),
          ...(kind === 'single' ? styles.ringSingle : null),
          ...(side === 'center' && kind === 'single' ? styles.ringSingleCenter : null),
        }}
      >
        <div style={kind === 'steer' ? styles.crossH : styles.crossV} />
        <div style={kind === 'steer' ? styles.crossVThin : kind === 'single' ? styles.crossH : styles.crossHThin} />
        <div
          ref={knobRef}
          style={{
            ...styles.knob,
            ...(kind === 'throttle' ? styles.knobThrottle : null),
            ...(kind === 'single' ? styles.knobSingle : null),
          }}
        />
      </div>
      <span style={styles.caption}>{label}</span>
    </div>
  );
}

export function TouchOverlay() {
  const phase = useGameStore((s) => s.phase);
  const scheme = useGameStore((s) => s.controlsScheme);
  const worldMode = useGameStore((s) => s.worldMode);
  const compact = useCompactHud();
  const walking = phase === 'walking';
  const highway = worldMode === 'highway' && !walking;

  const onSteer = useCallback((x: number, _y: number, active: boolean) => {
    dualHeld.steerOn = active;
    dualHeld.steer = active ? x : 0;
    flushDual();
  }, []);

  const onThrottle = useCallback((_x: number, y: number, active: boolean) => {
    dualHeld.gasOn = active;
    dualHeld.throttle = active ? Math.max(0, y) : 0;
    dualHeld.brake = active ? Math.max(0, -y) : 0;
    flushDual();
  }, []);

  const onSingle = useCallback((x: number, y: number, active: boolean) => {
    dualHeld.steerOn = false;
    dualHeld.gasOn = false;
    setStickAxes({
      steer: x,
      throttle: Math.max(0, y),
      brake: Math.max(0, -y),
      active,
    });
    flushDriveInput();
  }, []);

  useEffect(() => {
    if (phase === 'driving' && highway) return;
    setTouchHandbrake(false);
  }, [phase, highway]);

  if (!compact) return null;
  if (phase !== 'driving' && phase !== 'walking') return null;

  const single = isSingleStick(scheme);
  const gasLabel = walking ? 'WALK' : 'GAS · REV';

  return (
    <div style={styles.root} aria-hidden>
      {single ? (
        <ThumbStick
          key={scheme}
          axis="radial"
          kind="single"
          side={scheme === 'single-right' ? 'right' : scheme === 'single-center' ? 'center' : 'left'}
          label={walking ? 'STEER · WALK' : 'STEER · GAS'}
          onChange={onSingle}
        />
      ) : (
        <>
          <ThumbStick
            key={`steer-${scheme}`}
            axis="x"
            kind="steer"
            side={scheme === 'dual-steer-right' ? 'right' : 'left'}
            label="STEER"
            onChange={onSteer}
          />
          <ThumbStick
            key={`gas-${scheme}`}
            axis="y"
            kind="throttle"
            side={scheme === 'dual-steer-right' ? 'left' : 'right'}
            label={gasLabel}
            onChange={onThrottle}
          />
        </>
      )}
      {highway && (
        <button
          type="button"
          style={styles.handbrake}
          onPointerDown={(e) => {
            e.preventDefault();
            setTouchHandbrake(true);
            flushDriveInput();
          }}
          onPointerUp={() => {
            setTouchHandbrake(false);
            flushDriveInput();
          }}
          onPointerCancel={() => {
            setTouchHandbrake(false);
            flushDriveInput();
          }}
          onPointerLeave={() => {
            setTouchHandbrake(false);
            flushDriveInput();
          }}
        >
          HB
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 220,
  },
  thumb: {
    position: 'absolute',
    bottom: 'calc(14px + env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  sideLeft: {
    left: 'max(10px, env(safe-area-inset-left))',
    right: 'auto',
  },
  sideRight: {
    right: 'max(10px, env(safe-area-inset-right))',
    left: 'auto',
  },
  sideCenter: {
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
  },
  ring: {
    position: 'relative',
    width: 'min(142px, 36vw)',
    height: 'min(142px, 36vw)',
    borderRadius: '50%',
    border: '2px solid rgba(255,79,176,0.48)',
    background: 'radial-gradient(circle at 40% 35%, rgba(50,31,82,0.55), rgba(8,5,16,0.72))',
    boxShadow: '0 10px 35px rgba(0,0,0,0.5), inset 0 0 30px rgba(94,240,255,0.08)',
    touchAction: 'none',
    pointerEvents: 'auto',
    userSelect: 'none',
  },
  ringThrottle: {
    borderColor: 'rgba(94,240,255,0.45)',
  },
  ringSingle: {
    borderColor: 'rgba(255,140,200,0.55)',
  },
  ringSingleCenter: {
    width: 'min(158px, 40vw)',
    height: 'min(158px, 40vw)',
  },
  crossH: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 2,
    background: 'rgba(255,255,255,0.16)',
    pointerEvents: 'none',
    transform: 'translateY(-50%)',
  },
  crossHThin: {
    position: 'absolute',
    top: '50%',
    left: '28%',
    right: '28%',
    height: 1,
    background: 'rgba(255,255,255,0.16)',
    pointerEvents: 'none',
    opacity: 0.35,
    transform: 'translateY(-50%)',
  },
  crossV: {
    position: 'absolute',
    left: '50%',
    top: '10%',
    bottom: '10%',
    width: 2,
    background: 'rgba(255,255,255,0.16)',
    pointerEvents: 'none',
    transform: 'translateX(-50%)',
  },
  crossVThin: {
    position: 'absolute',
    left: '50%',
    top: '28%',
    bottom: '28%',
    width: 1,
    background: 'rgba(255,255,255,0.16)',
    pointerEvents: 'none',
    opacity: 0.35,
    transform: 'translateX(-50%)',
  },
  knob: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '42%',
    height: '42%',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    border: '2px solid rgba(255,255,255,0.32)',
    background: 'linear-gradient(145deg, #ff7ad4, #ce2d95 58%, #7443e7)',
    boxShadow: '0 5px 18px rgba(255,79,176,0.45), inset 0 2px 6px rgba(255,255,255,0.2)',
  },
  knobThrottle: {
    background: 'linear-gradient(145deg, #7af0ff, #2d9ece 58%, #4357e7)',
    boxShadow: '0 5px 18px rgba(94,240,255,0.4), inset 0 2px 6px rgba(255,255,255,0.2)',
  },
  knobSingle: {
    background: 'linear-gradient(145deg, #ff7ad4 20%, #7af0ff 85%)',
    boxShadow: '0 5px 18px rgba(255,79,176,0.35), 0 0 14px rgba(94,240,255,0.25), inset 0 2px 6px rgba(255,255,255,0.2)',
  },
  handbrake: {
    position: 'absolute',
    right: 'max(18px, env(safe-area-inset-right))',
    bottom: 'calc(168px + env(safe-area-inset-bottom))',
    width: 64,
    height: 64,
    borderRadius: 8,
    border: '2px solid #ffb000',
    background: 'rgba(20, 12, 0, 0.72)',
    color: '#ffb000',
    fontWeight: 800,
    letterSpacing: '0.08em',
    fontSize: 16,
    pointerEvents: 'auto',
    touchAction: 'none',
  },
  caption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textShadow: '0 2px 6px #000',
    pointerEvents: 'none',
  },
};
