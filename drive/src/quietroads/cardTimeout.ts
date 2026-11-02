/**
 * cardTimeout — the card game's clock, carried into the cockpit.
 *
 * A graded card can name the decision that time makes for you: `timeout_option_id`
 * (per card, `cards/*.json`) and `timeout_ms`. The card game has always run that
 * clock (`public/game/app.js` → `startHazardWindow` → `submitAnswer(card.timeout_option_id)`,
 * `Number(card.timeout_ms) || 24000`); the drive ignored both fields, so a hazard
 * card left alone stayed open forever and a card that never got a grade showed no
 * CONTINUE at all (AUDIT §20).
 *
 * This module is the whole rule, with no DOM and no React, so the expiry, the
 * pause and the "no timeout_option_id, no clock" cases are testable directly:
 *
 *   const clock = cardClock(card);                  // null when the card has none
 *   const cd = new CardCountdown(clock.ms);
 *   cd.paused = appIsPausedOrHidden;                 // a paused clock does not move
 *   if (cd.advance(now - last)) pick(clock.optionId); // the pick the player didn't make
 *
 * The expiry is not a separate path: the drive calls the same `pick()` the option
 * buttons call, so the grading, the verdict and the debrief are identical to a
 * tap — the option the clock named is the option that was answered.
 */

/** `Number(card.timeout_ms) || 24000` — the card game's default, by name. */
export const CARD_TIMEOUT_DEFAULT_MS = 24_000;

export interface CardClock {
  /** The option the timeout picks, as if the player tapped it. */
  optionId: string;
  /** How long the decision has, in ms. */
  ms: number;
}

/** Just the fields the clock reads, so anything card-shaped can be passed. */
export interface ClockedCard {
  timeout_option_id?: string | null;
  timeout_ms?: number | null;
  options?: { id: string }[];
}

/**
 * The clock this card runs, or null.
 *
 * No `timeout_option_id` ⇒ no clock (beat / continue-only / ordinary cards).
 * An id the card's options don't carry also ⇒ no clock: there is nothing to pick,
 * so firing would only strand the card a second way.
 */
export function cardClock(card: ClockedCard | null | undefined): CardClock | null {
  const optionId = card?.timeout_option_id ?? null;
  if (!optionId) return null;
  if (card?.options && !card.options.some((o) => o.id === optionId)) return null;
  const ms = Number(card?.timeout_ms);
  return { optionId, ms: Number.isFinite(ms) && ms > 0 ? ms : CARD_TIMEOUT_DEFAULT_MS };
}

/**
 * One card's countdown. Pure: it only moves when `advance()` is called with
 * running time, so a paused clock (the pause menu, a backgrounded tab) simply
 * isn't advanced — no wall clock, no timers of its own.
 */
export class CardCountdown {
  readonly ms: number;
  remainingMs: number;
  /** While true, `advance()` is a no-op. */
  paused = false;
  private fired = false;

  constructor(ms: number) {
    this.ms = Math.max(0, ms);
    this.remainingMs = this.ms;
  }

  /** Advance by running time. True on the one tick that expires the clock. */
  advance(elapsedMs: number): boolean {
    if (this.fired) return false;
    if (this.paused) return false;
    const dt = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
    this.remainingMs = Math.max(0, this.remainingMs - dt);
    if (this.remainingMs > 0) return false;
    this.fired = true;
    return true;
  }

  get expired(): boolean {
    return this.fired;
  }

  /** 1 → 0, for the bar. */
  get fraction(): number {
    return this.ms > 0 ? this.remainingMs / this.ms : 0;
  }

  /** Whole seconds left, for the label (the card game shows `Math.ceil`). */
  get secondsLeft(): number {
    return Math.ceil(this.remainingMs / 1000);
  }
}
