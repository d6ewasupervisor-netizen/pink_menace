/**
 * useTiltSteering — the phone's roll, listened to, and merged into steering (4.2).
 *
 * This hook is the only part of tilt steering that touches the DOM. The maths is
 * in `input/tiltSteering.ts` and the merge is in `input/driveInput.ts`, so this
 * file's whole job is: attach one listener when the player turned tilt on, hand
 * each reading to the maths, and detach cleanly when they turn it off.
 *
 * Three things it deliberately does NOT do:
 *
 *   - **It does not ask for permission.** iOS 13+ needs
 *     `DeviceOrientationEvent.requestPermission()` from a user gesture, so the
 *     settings row asks when the player taps TILT. A hook that asked on mount
 *     would be refused silently and tilt would look broken.
 *   - **It does not zero the steering when the phone lies down.** A `null` from
 *     the maths means "no tilt opinion", not "straight"; the sticks and keys stay
 *     in charge. See `tiltSteer`.
 *   - **It does not run on the highway's desktop build.** No
 *     `DeviceOrientationEvent` → no listener, and the setting stays honest
 *     (`tiltSupported()` is what the settings row greys out).
 */
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { setLiveTilt } from '@/input/driveInput';
import { clearTiltReading, noteTiltReading, tiltSteer, type TiltReading } from '@/input/tiltSteering';

/** Is this device even able to report an orientation? */
export function tiltSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

/**
 * iOS 13+ hides the sensor behind a permission prompt that only a user gesture
 * may raise. Everywhere else (Android, desktop, older iOS) the call does not
 * exist and permission is implicitly granted.
 */
export async function requestTiltPermission(): Promise<boolean> {
  if (!tiltSupported()) return false;
  const ctor = window.DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
  };
  if (typeof ctor.requestPermission !== 'function') return true;
  try {
    return (await ctor.requestPermission()) === 'granted';
  } catch {
    // The prompt throws when it is not in a gesture's call stack. Treat it as a
    // refusal rather than a crash; the settings row can be tapped again.
    return false;
  }
}

/** `deviceorientation` in the module's own vocabulary, or `null` when there is none. */
export function readingFromEvent(e: Pick<DeviceOrientationEvent, 'gamma' | 'beta'>): TiltReading | null {
  if (e.gamma === null || e.beta === null) return null;
  if (!Number.isFinite(e.gamma) || !Number.isFinite(e.beta)) return null;
  return { roll: e.gamma, pitch: e.beta };
}

export function useTiltSteering(): void {
  const tiltSteering = useGameStore((s) => s.tiltSteering);

  /**
   * ONE dependency, on purpose: the on/off switch.
   *
   * The first version also listed the neutral and the invert flag, and every
   * store write that replaced the neutral object tore the listener down and
   * rebuilt it — the cleanup zeroed the axis between two readings, and the 16 ms
   * pad poll then wrote "straight" over a car that was mid-turn. The listener's
   * lifetime is the setting's lifetime; everything else is read at event time,
   * where it is always current anyway.
   */
  useEffect(() => {
    // Off: make sure the merge has no tilt opinion to read.
    if (!tiltSteering) {
      setLiveTilt(null);
      return;
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      const { tiltNeutral, tiltInvert } = useGameStore.getState();
      const reading = readingFromEvent(e);
      // The settings' SET STRAIGHT row reads this when it is pressed.
      noteTiltReading(reading);
      setLiveTilt(tiltSteer(reading, tiltNeutral, { invert: tiltInvert }));
    };

    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      // Off (or unmounted): no stale axis in the merge, and no stale angle for
      // SET STRAIGHT to calibrate against.
      setLiveTilt(null);
      clearTiltReading();
    };
  }, [tiltSteering]);
}
