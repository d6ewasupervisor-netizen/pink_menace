/**
 * useCardCountdown — one card's clock, on screen.
 *
 * The rule lives in `quietroads/cardTimeout.ts` (`CardCountdown`, `optionsInView`);
 * this is only the wiring: a 100 ms tick that hands the countdown the time that
 * actually passed, the two pauses, the answers-in-view gate, and one `onExpire`
 * call on the tick the clock reaches zero.
 *
 * Pausing is the point of doing it this way rather than with a `setTimeout`: the
 * pause menu and a backgrounded phone must not spend the player's decision for
 * them, and a `setTimeout` would fire on the wall clock anyway. The same reasoning
 * covers the gate — the card game only spends the decision while the answers are
 * on screen (`choiceDockInView`), and the dock here scrolls, so a player reading a
 * long scene must not be charged for the reading either. The grace itself (1 750 ms
 * + 800 ms) is part of the clock in `cardTimeout.ts`, so a tick that starts late
 * still gives the player the whole grace.
 */
import { useEffect, useRef, useState } from 'react';
import { CardCountdown, optionsInView, type Box } from '@/quietroads/cardTimeout';

const TICK_MS = 100;

export interface CountdownView {
  remainingMs: number;
  /** 1 → 0, for the bar. */
  fraction: number;
  /** Whole seconds left, like the card game's clock. */
  secondsLeft: number;
  expired: boolean;
  /** The bar is on screen — false through the card game's grace. */
  shown: boolean;
  /** The decision is being spent (grace + wind are over). */
  armed: boolean;
}

/**
 * Where the answers are, and the box the player can see them in. Both are refs so
 * the gate can be measured on the tick without re-rendering on every scroll.
 */
export interface CountdownGate {
  options: { readonly current: HTMLElement | null };
  viewport: { readonly current: HTMLElement | null };
}

const initialView = (ms: number | null): CountdownView => ({
  remainingMs: ms ?? 0,
  fraction: ms != null ? 1 : 0,
  secondsLeft: Math.ceil((ms ?? 0) / 1000),
  expired: false,
  shown: false,
  armed: false,
});

const viewOf = (cd: CardCountdown): CountdownView => ({
  remainingMs: cd.remainingMs,
  fraction: cd.fraction,
  secondsLeft: cd.secondsLeft,
  expired: cd.expired,
  shown: cd.shown,
  armed: cd.armed,
});

const boxOf = (el: HTMLElement | null): Box | null => (el ? el.getBoundingClientRect() : null);

export function useCardCountdown(
  /** Identifies the clock: a new card id or a new duration starts a new one. */
  key: string | null,
  ms: number | null,
  /** False while the cockpit is paused, the grade is in flight, or the card closed. */
  running: boolean,
  onExpire: () => void,
  /** The answers and the dock they scroll in; omit it for a clock with no gate. */
  gate?: CountdownGate | null,
): CountdownView {
  const countdown = useRef<CardCountdown | null>(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [view, setView] = useState<CountdownView>(() => initialView(ms));
  const optionsEl = gate?.options ?? null;
  const viewportEl = gate?.viewport ?? null;

  // A backgrounded app is a paused clock, not a fast-forwarded one.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // A new card (or a new duration) starts a new countdown — grace included.
  useEffect(() => {
    countdown.current = ms != null ? new CardCountdown(ms) : null;
    setView(initialView(ms));
  }, [key, ms]);

  // The pause: the tick below only exists while the clock is allowed to run. The
  // reset effect above runs first on every commit, so by the time this one looks
  // for its countdown the card's clock is the current one.
  const live = ms != null && running && !hidden;

  useEffect(() => {
    const cd = countdown.current;
    if (!cd || ms == null) return;
    cd.paused = !live;
    if (!live) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      // The card game's `choiceDockInView()`: the decision is only spent while the
      // answers are on screen. Measured per tick, so a scroll costs nothing.
      cd.visible = optionsInView(boxOf(optionsEl?.current ?? null), boxOf(viewportEl?.current ?? null));
      const fired = cd.advance(dt);
      setView(viewOf(cd));
      if (fired) expire.current();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [live, key, ms, optionsEl, viewportEl]);

  return view;
}

