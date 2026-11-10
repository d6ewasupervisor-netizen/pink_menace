/**
 * Screen shake — the one thing a collision does to the camera (item 5.1).
 *
 * The maths lived in `GameCamera.tsx` as two module-level variables beside a
 * `useFrame` loop, so the only way to ask "does reduced motion stop the shake?"
 * was to run a WebGL context. That is a poor trade for a two-line decay: the
 * failure this guards is "steady cam is on and a wreck still throws the frame
 * around", which is arithmetic and should be testable as arithmetic.
 *
 * So the state machine is here and the camera asks it two questions per frame:
 * `triggerScreenShake` when something hits the car, and `shakeLevel(dt)` for the
 * amount to offset by. The random direction stays in the camera, because that is
 * the frame's business, not the maths'.
 *
 * The one refusal: **reduced motion is a refusal, not a lower intensity.** A
 * player who asked for a steady camera did not ask for a quieter wreck. The
 * option is passed in (`reducedMotion`) so a unit test can be a player, exactly
 * as `haptics.buzz` takes the switch.
 */

export interface ShakeOptions {
  /** The store's `reducedMotion` setting. True means "never shake". */
  reducedMotion?: boolean;
}

// Module-level, like the camera's own copy: one car, one shake.
let _intensity = 0;
let _decay = 0;

/** How much shake is left right now, without advancing the frame. */
export function shakeIntensity(): number {
  return _intensity;
}

/**
 * Ask for a shake. Returns whether it was taken — a refusal is not an error, so
 * the caller can tell "steady cam" from "nothing happened".
 *
 * intensity 0–1, duration in seconds. A stronger hit over the same time decays
 * faster (the decay rate is intensity / duration), so a wreck is a spike and a
 * scrape is a wobble.
 */
export function triggerScreenShake(
  intensity = 0.5,
  duration = 0.3,
  opts: ShakeOptions = {},
): boolean {
  if (opts.reducedMotion) return false;
  if (!Number.isFinite(intensity) || intensity <= 0) return false;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  _intensity = Math.max(_intensity, intensity);
  _decay = intensity / duration;
  return true;
}

/**
 * Advance one frame and return the level to offset the camera by. Monotonic: a
 * longer delta decays further, a negative delta (a clock jump backwards) is
 * treated as no time passing rather than as a reprieve.
 */
export function shakeLevel(delta: number): number {
  if (_intensity <= 0) return 0;
  const level = _intensity;
  _intensity = Math.max(0, _intensity - _decay * Math.max(0, delta));
  return level;
}

/** Forget the shake. Called when steady cam is switched on, and on unmount. */
export function resetShake(): void {
  _intensity = 0;
  _decay = 0;
}
