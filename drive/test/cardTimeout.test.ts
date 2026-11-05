/**
 * The card clock, on the deck the drive ships.
 *
 * The card game has always run a hazard window for cards that name
 * `timeout_option_id` / `timeout_ms` (`public/game/app.js`: `Number(card.timeout_ms)
 * || 24000`, then `submitAnswer(card.timeout_option_id)`), and the drive ignored
 * both fields, so a hazard card left alone stayed open forever (AUDIT §20).
 *
 * These tests pin the rule the cockpit now runs, on the card game's own timing:
 * `armHazardWindow` waits `grace = 1750` ms with no clock on screen, then
 * `wind = 800` ms with the clock on screen and still full, and `startHazardWindow`
 * only spends the decision while `choiceDockInView()` — the answers on screen. The
 * deck carries the clocks, an expiry resolves the card through the option the card
 * named, a paused clock does not move, and a card without a timeout id never fires.
 */
import { describe, expect, it } from 'vitest';
import {
  CardCountdown,
  CARD_ARM_MS,
  CARD_GRACE_MS,
  CARD_TIMEOUT_DEFAULT_MS,
  CARD_WIND_MS,
  cardClock,
  optionsInView,
} from '../src/quietroads/cardTimeout';
import cardsJson from '../src/quietroads/data/cards.json';
import type { Card } from '../src/quietroads/study/cards';

const deck = cardsJson as unknown as Card[];
const byId = (id: string) => deck.find((c) => c.card_id === id) as Card;

describe('cardClock — which cards have a clock', () => {
  it('a card with a timeout id and ms runs for that long', () => {
    expect(cardClock({ timeout_option_id: 'b', timeout_ms: 12000, options: [{ id: 'a' }, { id: 'b' }] }))
      .toEqual({ optionId: 'b', ms: 12000 });
  });

  it('a timeout id without ms falls back to the card game\'s 24 s', () => {
    expect(cardClock({ timeout_option_id: 'a', options: [{ id: 'a' }] }))
      .toEqual({ optionId: 'a', ms: CARD_TIMEOUT_DEFAULT_MS });
    expect(CARD_TIMEOUT_DEFAULT_MS).toBe(24000);
    // `Number(x) || 24000`: 0, negative and junk are all "no duration given".
    for (const bad of [0, -5, Number.NaN, null] as const) {
      expect(cardClock({ timeout_option_id: 'a', timeout_ms: bad, options: [{ id: 'a' }] })?.ms).toBe(24000);
    }
  });

  it('no timeout id, no clock — dossiers, beats and ordinary cards never fire', () => {
    expect(cardClock({ options: [{ id: 'a' }] })).toBeNull();
    expect(cardClock({ timeout_option_id: null, timeout_ms: 8000 })).toBeNull();
    expect(cardClock(null)).toBeNull();
  });

  it('a timeout id the card cannot offer is not a clock: there is nothing to pick', () => {
    expect(cardClock({ timeout_option_id: 'z', options: [{ id: 'a' }, { id: 'b' }] })).toBeNull();
  });
});

describe('cardClock — on the shipped deck', () => {
  it('carries every clock the card game carries (17 cards)', () => {
    const clocked = deck.filter((c) => c.timeout_option_id);
    expect(clocked).toHaveLength(17);
    for (const c of clocked) {
      const clock = cardClock(c);
      expect(clock, c.card_id).not.toBeNull();
      expect(clock!.optionId, c.card_id).toBe(c.timeout_option_id);
      expect(clock!.ms, c.card_id).toBeGreaterThan(0);
      // ...and that option is on the card, so the expiry can be graded.
      expect(c.options?.some((o) => o.id === c.timeout_option_id), c.card_id).toBe(true);
    }
  });

  it('VII-002 is the 5.2 hazard: option b, 12 s', () => {
    expect(cardClock(byId('VII-002'))).toEqual({ optionId: 'b', ms: 12000 });
  });

  it('leaves the cards without a timeout id alone', () => {
    for (const id of ['VII-001', 'I-005', 'VI-001', 'III-002']) {
      expect(cardClock(byId(id)), id).toBeNull();
    }
  });
});

describe('the grace the card game waits', () => {
  it('is the card game\'s own 1 750 ms + 800 ms', () => {
    // `armHazardWindow`: `const grace = 1750;` … `const wind = 800;`
    expect(CARD_GRACE_MS).toBe(1750);
    expect(CARD_WIND_MS).toBe(800);
    expect(CARD_ARM_MS).toBe(2550);
  });

  it('shows the bar only after the grace, and counts only after the wind-up', () => {
    const cd = new CardCountdown(12000);
    expect(cd.phase).toBe('grace');
    expect(cd.shown).toBe(false); // nothing on screen yet
    expect(cd.armed).toBe(false);

    cd.advance(CARD_GRACE_MS - 1);
    expect(cd.phase).toBe('grace');
    expect(cd.shown).toBe(false);

    cd.advance(1); // 1 750 ms: the card game reveals the clock, full
    expect(cd.phase).toBe('wind');
    expect(cd.shown).toBe(true);
    expect(cd.armed).toBe(false);
    expect(cd.fraction).toBe(1);
    expect(cd.secondsLeft).toBe(12);

    cd.advance(CARD_WIND_MS - 1);
    expect(cd.phase).toBe('wind');
    expect(cd.armed).toBe(false);
    expect(cd.remainingMs).toBe(12000);

    cd.advance(1); // 2 550 ms: counting
    expect(cd.phase).toBe('running');
    expect(cd.armed).toBe(true);
    expect(cd.remainingMs).toBe(12000);
    cd.advance(100);
    expect(cd.remainingMs).toBe(11900);
  });

  it('spends nothing before the wind-up is over, however the ticks land', () => {
    const cd = new CardCountdown(12000);
    for (let i = 0; i < 25; i++) cd.advance(100); // 2 500 ms in 100 ms ticks
    expect(cd.remainingMs).toBe(12000);
    expect(cd.armed).toBe(false);
    cd.advance(100); // the 26th tick crosses 2 550 ms
    expect(cd.armed).toBe(true);
    // Only the 50 ms past the arm point is spent, not the whole tick.
    expect(cd.remainingMs).toBe(11950);
  });

  it('expires at grace + wind + ms, not at ms', () => {
    const cd = new CardCountdown(12000);
    expect(cd.advance(CARD_ARM_MS + 12000 - 1)).toBe(false);
    expect(cd.remainingMs).toBe(1);
    expect(cd.advance(1)).toBe(true);
  });

  it('a paused clock does not spend the grace either', () => {
    const cd = new CardCountdown(12000);
    cd.paused = true;
    cd.advance(60_000);
    expect(cd.phase).toBe('grace');
    expect(cd.remainingMs).toBe(12000);
    cd.paused = false;
    cd.advance(CARD_ARM_MS);
    expect(cd.phase).toBe('running');
    expect(cd.remainingMs).toBe(12000);
  });
});

describe('the answers in view (the card game\'s choiceDockInView)', () => {
  const dock = { top: 400, bottom: 800 };

  it('the answers count as on screen while their box overlaps the dock', () => {
    expect(optionsInView({ top: 420, bottom: 700 }, dock)).toBe(true);
    expect(optionsInView({ top: 300, bottom: 500 }, dock)).toBe(true);
    expect(optionsInView({ top: 100, bottom: 1100 }, dock)).toBe(true); // taller than the dock
  });

  it('scrolled below the fold, or above it, is not on screen', () => {
    expect(optionsInView({ top: 900, bottom: 1100 }, dock)).toBe(false);
    expect(optionsInView({ top: 100, bottom: 380 }, dock)).toBe(false);
  });

  it('keeps the card game\'s 8 px slack', () => {
    expect(optionsInView({ top: 100, bottom: 404 }, dock)).toBe(false); // 4 px in
    expect(optionsInView({ top: 100, bottom: 410 }, dock)).toBe(true); // 10 px in
  });

  it('a box that cannot be measured does not hold the clock', () => {
    // Holding a clock the player cannot see the answers for would strand the card.
    expect(optionsInView(null, dock)).toBe(true);
    expect(optionsInView({ top: 0, bottom: 10 }, null)).toBe(true);
  });

  it('off-screen answers spend nothing, and the clock resumes where it was', () => {
    const cd = new CardCountdown(12000);
    cd.visible = false;
    cd.advance(30_000);
    expect(cd.remainingMs).toBe(12000);
    expect(cd.expired).toBe(false);
    // ...but the grace and the wind-up ran, exactly as the card game's timeouts do.
    expect(cd.phase).toBe('running');
    expect(cd.armed).toBe(true);

    cd.visible = true;
    expect(cd.advance(11_999)).toBe(false);
    expect(cd.advance(1)).toBe(true);
  });

  it('a scroll in the middle of the decision costs nothing', () => {
    const cd = new CardCountdown(12000);
    cd.advance(CARD_ARM_MS + 2000);
    expect(cd.remainingMs).toBe(10000);
    cd.visible = false; // the player scrolls back to the scene
    cd.advance(20_000);
    expect(cd.remainingMs).toBe(10000);
    cd.visible = true;
    cd.advance(1000);
    expect(cd.remainingMs).toBe(9000);
  });
});

describe('CardCountdown — expiry', () => {
  it('fires once, on the tick the clock reaches zero', () => {
    const cd = new CardCountdown(12000);
    expect(cd.expired).toBe(false);
    expect(cd.advance(CARD_ARM_MS + 11900)).toBe(false);
    expect(cd.remainingMs).toBe(100);
    expect(cd.expired).toBe(false);
    expect(cd.advance(100)).toBe(true);
    expect(cd.expired).toBe(true);
    expect(cd.remainingMs).toBe(0);
    // Nothing fires twice, however the frame times land.
    expect(cd.advance(1000)).toBe(false);
  });

  it('overshoot in one frame still expires, clamped at zero', () => {
    const cd = new CardCountdown(8000);
    expect(cd.advance(60_000)).toBe(true);
    expect(cd.remainingMs).toBe(0);
    expect(cd.fraction).toBe(0);
    expect(cd.secondsLeft).toBe(0);
  });

  it('the bar reads 1 → 0 and the label counts whole seconds up front', () => {
    const cd = new CardCountdown(12000);
    expect(cd.fraction).toBe(1);
    expect(cd.secondsLeft).toBe(12);
    cd.advance(CARD_ARM_MS + 6000);
    expect(cd.fraction).toBe(0.5);
    expect(cd.secondsLeft).toBe(6);
    cd.advance(5500);
    expect(cd.secondsLeft).toBe(1); // 0.5 s left still reads "1s"
  });
});

describe('the expiry picks the timeout option', () => {
  /**
   * What the overlay does: advance the clock in 100 ms ticks (grace, wind-up and
   * all) and pick on the tick it fires.
   */
  function run(card: Card, opts: { pauseAtMs?: number; pauseForMs?: number } = {}) {
    const clock = cardClock(card);
    if (!clock) return { picked: [] as string[], expired: false };
    const cd = new CardCountdown(clock.ms);
    const picked: string[] = [];
    let spent = 0;
    for (let i = 0; i < 1000 && !cd.expired; i++) {
      if (opts.pauseAtMs != null && spent === opts.pauseAtMs) {
        cd.paused = true;
        if (cd.advance(opts.pauseForMs ?? 5000)) picked.push(clock.optionId);
        cd.paused = false;
      }
      const fired = cd.advance(100);
      if (fired) picked.push(clock.optionId);
      spent += 100;
    }
    return { picked, expired: cd.expired };
  }

  it('VII-002 times out onto option b — a real, gradable option', () => {
    const card = byId('VII-002');
    const { picked, expired } = run(card);
    expect(expired).toBe(true);
    expect(picked).toEqual(['b']);
    expect(card.options!.map((o) => o.id)).toContain(picked[0]);
  });

  it('a pause in the middle delays the pick by exactly the time it was away', () => {
    const plain = run(byId('VII-002'));
    const paused = run(byId('VII-002'), { pauseAtMs: 6000, pauseForMs: 30_000 });
    expect(paused.picked).toEqual(['b']);
    expect(paused.expired).toBe(plain.expired);
    // The 30 s away did not spend the decision: the clock still ran its full 12 s.
    const cd = new CardCountdown(12000);
    cd.advance(CARD_ARM_MS + 6000);
    cd.paused = true;
    cd.advance(30_000);
    cd.paused = false;
    expect(cd.remainingMs).toBe(6000);
  });

  it('a card without a timeout id never fires', () => {
    for (const id of ['VII-001', 'I-005', 'VI-001']) {
      expect(run(byId(id))).toEqual({ picked: [], expired: false });
    }
  });
});

describe('CardCountdown — pause', () => {
  it('a paused clock does not move, and does not fire', () => {
    const cd = new CardCountdown(12000);
    cd.advance(CARD_ARM_MS + 2000);
    expect(cd.remainingMs).toBe(10000);
    cd.paused = true; // the pause menu, or a backgrounded tab
    expect(cd.advance(60_000)).toBe(false);
    expect(cd.remainingMs).toBe(10000);
    expect(cd.expired).toBe(false);
    // Resumed: it spends what is left, not the time it was away.
    cd.paused = false;
    expect(cd.advance(9999)).toBe(false);
    expect(cd.advance(1)).toBe(true);
  });

  it('nonsense elapsed time is ignored, never a free tick', () => {
    const cd = new CardCountdown(5000);
    expect(cd.advance(Number.NaN)).toBe(false);
    expect(cd.advance(-250)).toBe(false);
    expect(cd.remainingMs).toBe(5000);
  });
});
