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
 * grace, the pause and the "no timeout_option_id, no clock" cases are testable
 * directly:
 *
 *   const clock = cardClock(card);                   // null when the card has none
 *   const cd = new CardCountdown(clock.ms);
 *   cd.paused = appIsPausedOrHidden;                  // a paused clock does not move
 *   cd.visible = optionsAreOnScreen;                  // off-screen answers don't spend it
 *   if (cd.advance(now - last)) pick(clock.optionId);  // the pick the player didn't make
 *
 * The expiry is not a separate path: the drive calls the same `pick()` the option
 * buttons call, so the grading, the verdict and the debrief are identical to a
 * tap — the option the clock named is the option that was answered.
 *
 * The timing is the card game's, not the drive's own. `armHazardWindow`
 * (`public/game/app.js:711-747`) waits `grace = 1750` ms with the clock hidden,
 * then `wind = 800` ms with the clock on screen and still full, and only then
 * does `startHazardWindow` (`:749-778`) start spending — and it spends only while
 * `choiceDockInView()` (`:592-598`), i.e. while the answers are on screen. Both
 * halves are modelled here (`CARD_GRACE_MS`, `CARD_WIND_MS`, `visible`), so a
 * player reading the scene is never charged for it.
 */

/** `Number(card.timeout_ms) || 24000` — the card game's default, by name. */
export const CARD_TIMEOUT_DEFAULT_MS = 24_000;

/**
 * The delay before the clock counts at all — `armHazardWindow`'s
 * `const grace = 1750` (`public/game/app.js:720`). The clock is not on screen
 * during it.
 */
export const CARD_GRACE_MS = 1_750;

/**
 * The second half of that delay — `armHazardWindow`'s `const wind = 800`
 * (`public/game/app.js:721`). The clock is on screen, at full, and still not
 * counting.
 */
export const CARD_WIND_MS = 800;

/** `grace + wind` — the moment the decision starts being spent (2 550 ms). */
export const CARD_ARM_MS = CARD_GRACE_MS + CARD_WIND_MS;

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
 *
 * It runs the card game's three states in order:
 *
 *   grace   the first 1 750 ms — the bar is not on screen and nothing is spent
 *   wind    the next 800 ms — the bar is on screen, full, still nothing spent
 *   running the decision is being spent, but only while `visible`
 *   done    it fired; it never fires again
 */
export type CardClockPhase = 'grace' | 'wind' | 'running' | 'done';

export interface CardCountdownOptions {
  /** Override the card game's `grace` (tests, and a future card that names one). */
  graceMs?: number;
  /** Override the card game's `wind`. */
  windMs?: number;
}

export class CardCountdown {
  readonly ms: number;
  readonly graceMs: number;
  readonly windMs: number;
  remainingMs: number;
  /** While true, `advance()` is a no-op. */
  paused = false;
  /**
   * The answers are on screen. False while the dock is scrolled away from them:
   * the card game's `choiceDockInView()` gate on `startHazardWindow`. Only the
   * decision waits on this — the grace and the wind-up are wall time there too.
   */
  visible = true;
  private waitedMs = 0;
  private fired = false;

  constructor(ms: number, opts: CardCountdownOptions = {}) {
    this.ms = Math.max(0, ms);
    this.graceMs = Math.max(0, opts.graceMs ?? CARD_GRACE_MS);
    this.windMs = Math.max(0, opts.windMs ?? CARD_WIND_MS);
    this.remainingMs = this.ms;
  }

  /** Where the card game is between `armHazardWindow` and `startHazardWindow`. */
  get phase(): CardClockPhase {
    if (this.fired) return 'done';
    if (this.waitedMs < this.graceMs) return 'grace';
    if (this.waitedMs < this.graceMs + this.windMs) return 'wind';
    return 'running';
  }

  /** The bar is on screen — false through the grace, as in the card game. */
  get shown(): boolean {
    return this.phase !== 'grace';
  }

  /** The decision is being spent. */
  get armed(): boolean {
    return this.phase === 'running' || this.phase === 'done';
  }

  /** Advance by running time. True on the one tick that expires the clock. */
  advance(elapsedMs: number): boolean {
    if (this.fired || this.paused) return false;
    let left = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
    if (left <= 0) return false;
    // `armHazardWindow` runs its two `setTimeout`s whatever the player is looking
    // at, so the grace and the wind-up elapse even with the answers off screen...
    const armMs = this.graceMs + this.windMs;
    if (this.waitedMs < armMs) {
      const take = Math.min(left, armMs - this.waitedMs);
      this.waitedMs += take;
      left -= take;
    }
    // ...the decision does not: `startHazardWindow` spends time only while
    // `choiceDockInView()`, so an off-screen answer set costs the player nothing.
    if (!this.visible || left <= 0) return false;
    this.remainingMs = Math.max(0, this.remainingMs - left);
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

/** Just the part of a `DOMRect` this rule reads, so it is testable without one. */
export interface Box {
  top: number;
  bottom: number;
}

/**
 * The card game's `choiceDockInView()` (`public/game/app.js:592-598`), with no
 * DOM: the answers count as being on screen while their box overlaps the box the
 * player can see, with the card game's 8 px slack.
 *
 * A box that cannot be measured is *not* a reason to hold the clock. Holding a
 * clock the player cannot see the answers for would strand the card, which is the
 * dead end AUDIT §20 closed; a missing element therefore counts as visible.
 */
export function optionsInView(
  options: Box | null | undefined,
  viewport: Box | null | undefined,
  slack = 8,
): boolean {
  if (!options || !viewport) return true;
  return options.top < viewport.bottom - slack && options.bottom > viewport.top + slack;
}

