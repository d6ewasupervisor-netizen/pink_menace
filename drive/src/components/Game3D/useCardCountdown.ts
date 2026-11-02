/**
 * useCardCountdown — one card's clock, on screen.
 *
 * The rule lives in `quietroads/cardTimeout.ts` (`CardCountdown`); this is only
 * the wiring: a 100 ms tick that hands the countdown the time that actually
 * passed, a pause while the cockpit is paused or the tab is hidden, and one
 * `onExpire` call on the tick the clock reaches zero.
 *
 * Pausing is the point of doing it this way rather than with a `setTimeout`: the
 * pause menu and a backgrounded phone must not spend the player's decision for
 * them, and a `setTimeout` would fire on the wall clock anyway.
 */
import { useEffect, useRef, useState } from 'react';
import { CardCountdown } from '@/quietroads/cardTimeout';

const TICK_MS = 100;

export interface CountdownView {
  remainingMs: number;
  /** 1 → 0, for the bar. */
  fraction: number;
  /** Whole seconds left, like the card game's clock. */
  secondsLeft: number;
  expired: boolean;
}

export function useCardCountdown(
  /** Identifies the clock: a new card id or a new duration starts a new one. */
  key: string | null,
  ms: number | null,
  /** False while the cockpit is paused, the grade is in flight, or the card closed. */
  running: boolean,
  onExpire: () => void,
): CountdownView {
  const countdown = useRef<CardCountdown | null>(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [view, setView] = useState<CountdownView>(() => ({
    remainingMs: ms ?? 0,
    fraction: ms ? 1 : 0,
    secondsLeft: Math.ceil((ms ?? 0) / 1000),
    expired: false,
  }));

  // A backgrounded app is a paused clock, not a fast-forwarded one.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // A new card (or a new duration) starts a new countdown.
  useEffect(() => {
    countdown.current = ms != null ? new CardCountdown(ms) : null;
    setView({
      remainingMs: ms ?? 0,
      fraction: ms != null ? 1 : 0,
      secondsLeft: Math.ceil((ms ?? 0) / 1000),
      expired: false,
    });
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
      const fired = cd.advance(dt);
      setView({
        remainingMs: cd.remainingMs,
        fraction: cd.fraction,
        secondsLeft: cd.secondsLeft,
        expired: cd.expired,
      });
      if (fired) expire.current();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [live, key, ms]);

  return view;
}
