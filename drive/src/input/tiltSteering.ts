/**
 * Tilt steering — the phone's own roll as the steering axis (item 4.2).
 *
 * A thumb on a stick covers the road; the phone's roll does not. The phone is
 * the one controller the player already owns, and it is already held at the
 * angle a wheel would be — so the maths here is the whole feature. The listener,
 * the settings row and the e2e are wiring around these functions, and they all
 * read the same answer.
 *
 * Why this is not just "gamma / 30":
 *
 *   1. **The phone is not flat at the green light.** A player holds it tilted
 *      toward themselves and often a few degrees to one side. Without a
 *      calibration the car would steer before the thumb touched anything, so
 *      `neutral` is the reading taken when the player says "this is straight".
 *   2. **A hand is not steady.** The dead zone is what stops a resting hand from
 *      weaving. It is in degrees, not in the normalised axis, because the axis is
 *      what the calibration moved.
 *   3. **A phone is not a wheel.** 30° of roll is a full lock — further than a real
 *      wheel's 90° would map to a car's steering, and far enough that the car can
 *      be steered one-handed without the phone leaving the windscreen's cone.
 *   4. **The phone lies down.** Lying on a desk or in a cradle, `beta` goes past
 *      ±45° and the reading is not a hand's steering any more. `isTiltUsable`
 *      refuses it rather than sending the car into a wall, and the merge leaves
 *      the sticks and keys in charge while it is refused.
 *
 * `deviceorientation` is in degrees and its own convention: `gamma` is the
 * left-to-right tilt, positive when the device's right edge drops. Positive
 * `gamma` is steering RIGHT here, which is the same sign the touch stick and the
 * pad's `axes[0]` already use, so nothing downstream has to be inverted twice.
 */

/** What the listener hands this module: raw `deviceorientation` degrees. */
export interface TiltReading {
  /** `gamma`: roll, −90..90. Positive = the device's right edge is down. */
  roll: number;
  /** `beta`: pitch, −180..180. Read only to notice the phone is not held. */
  pitch: number;
}

export interface TiltOptions {
  /** Roll at which steering is full lock. */
  fullLockDeg?: number;
  /** Roll that still counts as "straight". */
  deadZoneDeg?: number;
  /** Flip the sense (a player who reads "tilt left to go right"). */
  invert?: boolean;
}

/**
 * The shipped numbers. `fullLockDeg` 30 is a wheel the phone can be held at
 * one-handed; `deadZoneDeg` 2.5 is ~1.5 cm of edge lift on a 16 cm phone, about
 * the slack in a resting wrist; `uprightPitchDeg` 45 is "in a cradle, not on a
 * desk".
 */
export const TILT = {
  fullLockDeg: 30,
  deadZoneDeg: 2.5,
  uprightPitchDeg: 45,
  /** The neutral reading is measured at the green light; this is "straight". */
  defaultNeutral: { roll: 0, pitch: 0 } as TiltReading,
} as const;

/** A raw reading is only usable if both angles are finite and inside the cone. */
export function isTiltReading(raw: Partial<TiltReading> | null | undefined): raw is TiltReading {
  if (!raw) return false;
  const { roll, pitch } = raw;
  return (
    typeof roll === 'number' &&
    typeof pitch === 'number' &&
    Number.isFinite(roll) &&
    Number.isFinite(pitch) &&
    Math.abs(roll) <= 90 &&
    Math.abs(pitch) <= 180
  );
}

/**
 * Is the phone being held the way a wheel is? A device past 45° of pitch is a
 * phone on a table, in a pocket or in a cradle pointing at the roof — not a hand
 * steering. Callers answer `null` (no tilt input) rather than guessing.
 */
export function isTiltUsable(raw: Partial<TiltReading> | null | undefined): raw is TiltReading {
  if (!isTiltReading(raw)) return false;
  return Math.abs(raw.pitch) <= TILT.uprightPitchDeg;
}

/**
 * The roll relative to the neutral the player calibrated, clamped to ±90 so a
 * broken reading cannot wrap around into a full lock in the other direction.
 */
export function relativeRoll(raw: TiltReading, neutral: TiltReading = TILT.defaultNeutral): number {
  const delta = raw.roll - neutral.roll;
  return Math.max(-90, Math.min(90, delta));
}

/**
 * Degrees of roll → −1..1.
 *
 * Straight through the dead zone is 0. Past it, the axis runs linearly to full
 * lock and clamps there — the same shape the touch stick has, so the car cannot
 * tell which one moved it. `invert` flips the sign for the players who read the
 * other way; it is a setting, not a preference buried in the maths.
 */
export function tiltToSteer(rollDeg: number, opts: TiltOptions = {}): number {
  if (!Number.isFinite(rollDeg)) return 0;
  const fullLock = opts.fullLockDeg ?? TILT.fullLockDeg;
  const deadZone = opts.deadZoneDeg ?? TILT.deadZoneDeg;
  if (fullLock <= deadZone) return 0; // a misconfigured pair steers nothing, not everything
  const sign = opts.invert ? -1 : 1;
  const magnitude = Math.abs(rollDeg);
  if (magnitude <= deadZone) return 0;
  const scaled = ((magnitude - deadZone) / (fullLock - deadZone)) * Math.sign(rollDeg);
  return Math.max(-1, Math.min(1, scaled * sign));
}

/**
 * The whole path in one call: a raw reading and the player's neutral, in, a
 * steering axis out. `null` means "this phone is not being held as a wheel" —
 * the caller keeps the sticks and keys in charge instead of sending zeros, so a
 * player can put the phone down mid-drive without the car stopping dead.
 */
export function tiltSteer(
  raw: Partial<TiltReading> | null | undefined,
  neutral: TiltReading = TILT.defaultNeutral,
  opts: TiltOptions = {},
): number | null {
  if (!isTiltUsable(raw)) return null;
  return tiltToSteer(relativeRoll(raw, neutral), opts);
}

/**
 * The last reading the listener saw, so "SET STRAIGHT" can be a button.
 *
 * The neutral is measured, not chosen: the player holds the phone the way they
 * will drive and presses the row. A button needs the reading from outside the
 * listener's closure, and a module-level last value is the smallest honest way
 * to hand it over — the listener is the only writer, and `null` means no reading
 * has ever arrived (no sensor, or permission not granted yet).
 */
let lastReading: TiltReading | null = null;

export function noteTiltReading(reading: TiltReading | null): void {
  lastReading = isTiltReading(reading) ? { roll: reading.roll, pitch: reading.pitch } : null;
}

export function lastTiltReading(): TiltReading | null {
  return lastReading;
}

/** Forget the reading. Called when the listener detaches, so a stale angle cannot calibrate. */
export function clearTiltReading(): void {
  lastReading = null;
}
