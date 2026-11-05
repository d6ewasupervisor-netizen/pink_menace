/**
 * handsoff — the waits where the right answer is to do nothing, and the screen
 * has to say so.
 *
 * 6.3's night wait (`bridge_engine_off_wait`) is sixty seconds of sitting still
 * with the engine off while the Quiet forget about the car. On a phone there is
 * no engine to switch off and no handbrake to set, so what the player is told
 * ("Engine off. Hands off. … Sixty seconds.") and what the controls do (a touch
 * on either stick is throttle) contradict each other. Her HAR: the mission
 * started four times, `engine.start_early` fired six times and
 * `bridge_wait_restarts` reached three — every one of those was a thumb resting
 * on a stick that had nothing else to do for a minute.
 *
 * This module is the rule for every such wait: what it is called, how long it
 * runs, the marks the story speaks on, and the beat the overlay holds *after*
 * the ring completes so the release line lands inside it. The overlay, the input
 * lock and the sticks all read the same object.
 *
 * The sweep (2026-11-05) — every `wait_for` in the act data, and why only one is
 * converted:
 *
 *   bridge.wait:15/30/45/60   nothing to act on but a clock      → converted
 *   park.clean (6.2 ×2)       pull in and stop: the player acts    not a wait
 *   quiet.settle              drive under 9 mph until it settles    not a wait
 *   gracie.toy / gracie.moth  creep, or keep rolling                not a wait
 *   microsleep.drift,         keep driving on the night straight    not a wait
 *   rumble.strip
 *   waypoint.reach:*          drive to the place                   not a wait
 *   week.elapsed (4.3)        a played week, not a timer            not a wait
 *   cutscene.*                self-resolving in 2.5 s (waitWatch)   too short to
 *                             cover the screen for
 *   quiet.reason_passed       answered by the mission on the spot   not a wait
 */
/** 6.3's wait length — the story's sixty seconds, in one place. */
export const BRIDGE_WAIT_S = 60;

/** What the hands-off overlay is showing, published by the bridge. */
export interface HandsOffState {
  /** The mission that owns the wait (`handsOffFor` keys on it). */
  mission: string;
  /** The wait's whole length, seconds. */
  totalS: number;
  /** How much of it the sim has spent. Frozen while the game is paused/hidden. */
  elapsedS: number;
}

export interface HandsOffWait {
  /** The mission that owns the wait. The overlay is keyed on it. */
  mission: string;
  /** The band title, in the cockpit's caps voice. */
  title: string;
  /** One line of why, under the title. */
  note: string;
  /** The ring: how long the wait is. */
  totalS: number;
  /** The marks the story speaks on, in order. */
  marks: readonly number[];
  /**
   * How long the overlay holds after the ring completes, so the release beat
   * (6.3.clear, a 2.4 s direction) plays inside it instead of behind it.
   */
  tailS: number;
}

/** 6.3's sixty seconds: the engine off on Vantage Bridge. */
export const BRIDGE_HANDS_OFF: HandsOffWait = {
  mission: 'bridge_engine_off_wait',
  title: 'ENGINE OFF · HANDS OFF',
  note: 'Sixty seconds. Nothing to do. Let the meter drain.',
  totalS: BRIDGE_WAIT_S,
  marks: [15, 30, 45, BRIDGE_WAIT_S],
  tailS: 4,
};

export const HANDS_OFF_WAITS: readonly HandsOffWait[] = [BRIDGE_HANDS_OFF];

/** The wait a mission runs, or null when the mission is not a hands-off one. */
export function handsOffFor(missionId: string | null | undefined): HandsOffWait | null {
  if (!missionId) return null;
  return HANDS_OFF_WAITS.find((w) => w.mission === missionId) ?? null;
}

export interface HandsOffView {
  /** Whole seconds left on the ring (never negative). */
  remainingS: number;
  /** 1 → 0 across the wait's own seconds. */
  fraction: number;
  /** The last mark the clock has passed (0 before the first). */
  mark: number;
  /** The ring is spent; the overlay is holding for the release beat. */
  spent: boolean;
  /** The overlay is done: the car is hers again. */
  released: boolean;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * The overlay's whole state, from the one number the sim owns. `elapsedS` is
 * `Simulation.waitElapsedS`, which only moves while the world is running — so a
 * paused game or a locked phone holds the ring where it was, and the resume
 * picks up mid-count instead of starting over.
 */
export function handsOffView(wait: HandsOffWait, elapsedS: number): HandsOffView {
  const elapsed = Math.max(0, elapsedS);
  const remaining = Math.max(0, wait.totalS - elapsed);
  let mark = 0;
  for (const m of wait.marks) if (elapsed >= m) mark = m;
  return {
    remainingS: Math.ceil(remaining),
    fraction: clamp01(remaining / wait.totalS),
    mark,
    spent: elapsed >= wait.totalS,
    released: elapsed >= wait.totalS + wait.tailS,
  };
}
