/**
 * The handbrake key (Space by default) also advances the pop-up that is up: a
 * card's CONTINUE, a quiz's CONTINUE, a dialogue line. Driving reads the same key
 * as held (`bindHeld('handbrake')`), so a tap costs a moment of brake and nothing
 * else. One press advances one surface — the highest priority that is open — and
 * a held key (auto-repeat) advances nothing more.
 */
import type { BindMap } from './driveInput';

export const ADVANCE_PRIORITY = { dialogue: 1, quiz: 2, card: 3 } as const;

export interface AdvanceEntry {
  priority: number;
  run: () => void;
}

/** Does this `KeyboardEvent.key` belong to the handbrake bind? */
export function isAdvanceKey(key: string, binds: BindMap): boolean {
  return binds.handbrake.some((k) => k === key || (k.length === 1 && key.length === 1 && k.toLowerCase() === key.toLowerCase()));
}

/** The surface one press advances: the highest priority open. */
export function pickAdvance(entries: Iterable<AdvanceEntry>): AdvanceEntry | null {
  let best: AdvanceEntry | null = null;
  for (const e of entries) if (!best || e.priority > best.priority) best = e;
  return best;
}
