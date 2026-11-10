/**
 * cockpit/objective — what the nav strip's words do over time, and when HP/FUEL earns
 * screen space back.
 *
 * The rebuild removes three always-on things from the driving HUD: the minimap strip,
 * the clock, and the HP/FUEL bars. The first two are gone (a portrait phone does not
 * need a map of a road with one turn in it, and the clock belongs to the story); the
 * bars come back as a small tag, and only when the tag has something to say:
 *
 *   - the objective shows for OBJECTIVE_HOLD_MS after it changes, and stays for the
 *     whole of a mission that walks the player through sub-steps (a chain-up is one
 *     instruction that survives four taps);
 *   - tapping the nav strip brings it back for another OBJECTIVE_HOLD_MS;
 *   - the HP/FUEL tag appears under 30 % **or** for RESOURCE_FLASH_MS after a change,
 *     then leaves. A bar that is always full is not information.
 *
 * Pure: `now` is passed in, so the rules are unit-testable without a clock, and the
 * component only has to remember *when* things changed. `test/objective.test.ts` pins
 * the four cases the plan names (change, tap, sub-step, threshold).
 */

/** How long the objective stays up after a change or a tap. The plan says ~6 s. */
export const OBJECTIVE_HOLD_MS = 6_000;
/** How long a resource change keeps the HP/FUEL tag on screen. */
export const RESOURCE_FLASH_MS = 4_000;
/** Below this fraction of the tank or the body the tag stays up by itself. */
export const WARN_FRACTION = 0.3;

export interface ObjectiveState {
  /** `performance.now()` when the objective text last changed. */
  changedAt: number;
  /** `performance.now()` of the player's last tap on the nav strip, or null. */
  tappedAt: number | null;
  /** The running mission is a sub-step mission (chain-up, escort checklist…). */
  subStep: boolean;
  now: number;
}

/**
 * Is the objective line on screen right now?
 *
 * Hidden objectives are not a CSS trick: the band collapses to nothing, so the world
 * band is taller while the player is just driving. That is the point of the budget.
 */
export function objectiveVisible(s: ObjectiveState): boolean {
  if (s.subStep) return true;
  if (s.now - s.changedAt < OBJECTIVE_HOLD_MS) return true;
  if (s.tappedAt != null && s.now - s.tappedAt < OBJECTIVE_HOLD_MS) return true;
  return false;
}

/** Seconds left of the flash, for a fade-out that does not pop. 0 when hidden. */
export function objectiveRemainingMs(s: ObjectiveState): number {
  if (s.subStep) return OBJECTIVE_HOLD_MS;
  const sinceChange = s.now - s.changedAt;
  const sinceTap = s.tappedAt == null ? Infinity : s.now - s.tappedAt;
  const left = OBJECTIVE_HOLD_MS - Math.min(sinceChange, sinceTap);
  return Math.max(0, Math.min(OBJECTIVE_HOLD_MS, left));
}

export interface ResourceState {
  hp: number;
  fuel: number;
  maxHp: number;
  maxFuel: number;
  /** `performance.now()` of the last change to either value. */
  changedAt: number;
  now: number;
}

export type ResourceWarning = 'hp' | 'fuel' | null;

const fraction = (value: number, max: number): number => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 1);

/** Which resource is low enough to say so out loud, worst first. */
export function resourceWarning(s: ResourceState): ResourceWarning {
  const hp = fraction(s.hp, s.maxHp);
  const fuel = fraction(s.fuel, s.maxFuel);
  if (hp <= WARN_FRACTION && hp <= fuel) return 'hp';
  if (fuel <= WARN_FRACTION) return 'fuel';
  if (hp <= WARN_FRACTION) return 'hp';
  return null;
}

/**
 * Does the HP/FUEL tag show right now? Under 30 % it stays; otherwise it is up for
 * RESOURCE_FLASH_MS after a change, which is what "or on change" means.
 */
export function resourceTagVisible(s: ResourceState): boolean {
  if (resourceWarning(s) !== null) return true;
  return s.now - s.changedAt < RESOURCE_FLASH_MS;
}

/** The tag's text: `HP 24` / `FUEL 12` / `FUEL 12 · HP 24` when both are low. */
export function resourceTagText(s: ResourceState): string | null {
  const warn = resourceWarning(s);
  if (warn === null && !resourceTagVisible(s)) return null;
  const hp = Math.max(0, Math.round(s.hp));
  const fuel = Math.max(0, Math.round(s.fuel));
  const hpLow = fraction(s.hp, s.maxHp) <= WARN_FRACTION;
  const fuelLow = fraction(s.fuel, s.maxFuel) <= WARN_FRACTION;
  if (hpLow && fuelLow) return `HP ${hp} · FUEL ${fuel}`;
  if (hpLow) return `HP ${hp}`;
  if (fuelLow) return `FUEL ${fuel}`;
  return `HP ${hp} · FUEL ${fuel}`;
}
