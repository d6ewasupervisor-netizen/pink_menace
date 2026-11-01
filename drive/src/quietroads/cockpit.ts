/**
 * cockpit — the one rule for who owns the screen.
 *
 * A card, a quiz, a grade debrief and a dialogue choice are *compound* surfaces:
 * they want the whole screen, so the driving HUD (the noise meter, the nav
 * cluster, the lights/horn rail) stands down. Everything else is the car. A
 * spoken line is NOT compound — it lives in the bottom band and the HUD in the
 * top band, so the bands keep them apart. The touch sticks are the phase's: they
 * stay up while a choice is open, as they always have, and the rule only ever
 * *restores* them.
 *
 * The rule is DERIVED, never a flag some code path has to remember to clear. That
 * is the bug it replaces: a card's own phase left set after the card resolved
 * into a `start_gameplay` leaves the car on screen with no sticks and no
 * dashboard, and the player is stuck. Every close path (answered, timed out,
 * continue-only) lands on the same answer now, because nothing has to be cleared
 * by hand — `showDrivingHud` is computed from what is open right now.
 */

/** The store's GamePhase, spelled out so this stays a leaf module. */
export type CockpitPhase =
  | 'menu'
  | 'driving'
  | 'walking'
  | 'dialogue'
  | 'card'
  | 'quiz'
  | 'paused'
  | 'gasStation'
  | 'outOfGas'
  | 'victory'
  | 'gameover';

export interface CockpitState {
  phase: CockpitPhase;
  /** A mission this scene started is running (QuietRoadsBridge owns the flag). */
  missionActive: boolean;
  cardOpen: boolean;
  quizOpen: boolean;
  debriefOpen: boolean;
  choiceOpen: boolean;
  /**
   * A spoken line or stage direction is on screen. It does not hide the HUD (it
   * lives in the bottom band), but it does own the phase: a scene that hands the
   * car back on `idle` must not be overruled while a line is up.
   */
  storyOnScreen?: boolean;
}

/** Phases where something other than the car owns the screen on purpose. */
const NOT_DRIVING: readonly CockpitPhase[] = ['paused', 'menu', 'victory', 'gameover', 'gasStation', 'outOfGas'];

/**
 * A full-screen story surface is open: the driving HUD stands down.
 *
 * Deliberately the surfaces themselves, not the phase: a phase left at 'card'
 * with no card open is the bug, and reading it as "a card is open" would hide the
 * HUD exactly the way the bug did. The phase is what gets repaired, below.
 */
export function compoundOpen(s: Pick<CockpitState, 'cardOpen' | 'quizOpen' | 'debriefOpen' | 'choiceOpen'>): boolean {
  return s.cardOpen || s.quizOpen || s.debriefOpen || s.choiceOpen;
}

/**
 * The rule. `missionActive` is what makes it independent of how a card closed:
 * while a mission owns the car and nothing compound is open, the driving HUD is
 * the surface — whatever the phase flag happens to say.
 */
export function showDrivingHud(s: CockpitState): boolean {
  if (compoundOpen(s)) return false;
  if (NOT_DRIVING.includes(s.phase)) return false;
  if (s.missionActive) return true;
  return s.phase === 'driving' || s.phase === 'walking';
}

/**
 * What is holding the driving HUD down when a mission is running and nothing is
 * open. Used only for the console warning — naming the flag is the point.
 */
export function staleCockpitFlag(s: CockpitState): string | null {
  if (!s.missionActive) return null;
  if (s.cardOpen) return 'qrHud.card';
  if (s.choiceOpen) return 'qrHud.choices';
  if (s.debriefOpen) return 'qrHud.debrief';
  if (s.quizOpen) return 'quiz';
  if (s.phase === 'card' || s.phase === 'quiz' || s.phase === 'dialogue') return `phase="${s.phase}"`;
  return null;
}

/**
 * The phase a running mission wants when no story surface is on screen: the car
 * (or the walker, for the on-foot missions). Null when the player owns the screen
 * (pause menu) or a surface is open — reconcile must never fight those.
 */
export function cockpitPhaseFor(s: CockpitState, walker: boolean): 'driving' | 'walking' | null {
  if (!s.missionActive) return null;
  if (compoundOpen(s)) return null;
  // A spoken line owns the screen (and the scene hands the car back when it
  // idles). The rule repairs the phase; it never talks over a line.
  if (s.storyOnScreen) return null;
  if (NOT_DRIVING.includes(s.phase)) return null;
  if (s.phase === 'driving' || s.phase === 'walking') return null; // already right
  return walker ? 'walking' : 'driving';
}
