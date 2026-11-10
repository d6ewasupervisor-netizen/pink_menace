/**
 * haptics — what the phone feels, in one place (item 5.1).
 *
 * Before this, exactly one thing in the whole drive buzzed: the gust, through
 * `buzzGust` in `wind.ts`. That was the right first event — a crosswind is the
 * one force the cockpit cannot show without a word — but it left the other
 * physical moments silent. A wreck that throws the camera does not touch the
 * hand holding the phone; a horn press that is only a 44 px rectangle does not
 * feel pressed; the QTE's pass window is a bar on glass.
 *
 * So this module is the pattern table and the gate, and nothing else:
 *
 *   - **A pattern per event, not one array copied at call sites.** A wreck is
 *     not a gust; the pause inside `collision` is the car coming to rest. When a
 *     new event arrives, the pattern is written once here and the call site says
 *     the event's name.
 *   - **A missing or refusing API is not a crash.** iOS Safari has no
 *     `navigator.vibrate`; a desktop browser has the method and no motor. `buzz`
 *     returns `false` so the caller — and a test — can tell "no motor" from
 *     "buzzed". A browser that has the method and refuses it is a refusal, not
 *     an exception in the frame loop.
 *   - **The player owns the switch.** `haptics` is a store setting; off is a real
 *     preference. It is deliberately *not* wired to `reducedMotion`: motion is a
 *     vestibular concern and vibration is a different sense, so a player who
 *     stops the camera moving may still want the wheel to feel. Both switches
 *     exist; neither implies the other.
 *
 * The one thing this module does NOT do is decide when an event happens. It is
 * pure: call sites pass the store's switch in (`enabled`) and the navigator they
 * are on (`nav`), so a unit test can be a phone without a motor or a browser
 * with one.
 */

/** Every physical event the cockpit can feel. */
export type HapticPattern =
  | 'gust'
  | 'collision'
  | 'horn'
  | 'button'
  | 'qte'
  | 'verdict';

/**
 * The patterns, in milliseconds: `[on, off, on, off…]`, the shape the Vibration
 * API takes. Each one is a sentence, not a copy — the pause is the meaning.
 */
export const HAPTIC_PATTERNS: Readonly<Record<HapticPattern, readonly number[]>> = {
  // The crosswind: three pushes, the same shape as GUST_VIBRATION before it moved.
  gust: [35, 55, 90],
  // A wreck: the hit, the car settling, the rest of the stop.
  collision: [90, 40, 120],
  // A horn is a press, not a sentence.
  horn: [60],
  // The lightest tap the API can give: a 44 px button you can feel through a glove.
  button: [12],
  // The pass window opens and closes — twice, because a miss should be felt.
  qte: [45, 30, 45],
  // A verdict: the pause between the two halves is the answer.
  verdict: [25, 60, 25],
};

/** What the caller knows: the player's switch and the device's navigator. */
export interface HapticOptions {
  /** The store's `haptics` setting. `false` means the player asked for silence. */
  enabled?: boolean;
  /** The navigator in use. `null` means "no device to ask"; injected for tests. */
  nav?: Pick<Navigator, 'vibrate'> | null;
}

/** The navigator, or `null` where there is none (a server render, a test). */
export function hapticNav(): Pick<Navigator, 'vibrate'> | null {
  return typeof navigator === 'undefined' ? null : navigator;
}

/** Whether this device can be buzzed at all. False is normal, not an error. */
export function hapticAvailable(nav: Pick<Navigator, 'vibrate'> | null = hapticNav()): boolean {
  return Boolean(nav && typeof nav.vibrate === 'function');
}

/**
 * Buzz once, for one event. Returns whether the device took it.
 *
 * Three reasons to return `false`, and they are different things: the player
 * turned haptics off, the device has no motor, or the browser refused. The
 * caller does not branch on which — a missing buzz is never a failed action.
 */
export function buzz(pattern: HapticPattern, opts: HapticOptions = {}): boolean {
  const nav = opts.nav === undefined ? hapticNav() : opts.nav;
  if (opts.enabled === false) return false;
  if (!hapticAvailable(nav)) return false;
  try {
    // Copy the readonly array: the API takes a mutable number[].
    (nav as Pick<Navigator, 'vibrate'>).vibrate([...HAPTIC_PATTERNS[pattern]]);
    return true;
  } catch {
    return false;   // present and refusing is not a crash in the frame loop
  }
}
