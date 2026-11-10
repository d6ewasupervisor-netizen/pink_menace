/**
 * haptics — the feel tests for the phone's motor (item 5.1).
 *
 * The failure mode this file exists for is not "the buzz sounds wrong". It is
 * "the car was hit and nothing touched the player", and its twin: "the player
 * turned haptics off and the phone still buzzed in their pocket". So every
 * claim here has its failure next to it.
 */
import { describe, expect, it } from 'vitest';
import {
  HAPTIC_PATTERNS,
  buzz,
  hapticAvailable,
  hapticNav,
  type HapticPattern,
} from '../src/quietroads/haptics';

/** A device that records what it was asked to do. */
function phone() {
  const calls: (number | number[])[] = [];
  const nav = {
    vibrate: (p: number | number[]) => { calls.push(p); return true; },
  } as Pick<Navigator, 'vibrate'>;
  return { nav, calls };
}

describe('the pattern table', () => {
  it('gives every event its own sentence, and every sentence is real', () => {
    const patterns = Object.entries(HAPTIC_PATTERNS);
    expect(patterns.length).toBeGreaterThanOrEqual(6);
    for (const [name, ms] of patterns) {
      expect(ms.length, `${name} has a sequence`).toBeGreaterThan(0);
      // The Vibration API reads even indices as buzz and odd as pause. A zero or
      // a negative is either "no buzz" or undefined behaviour on the platform.
      for (const n of ms) expect(n, `${name} has a real duration`).toBeGreaterThan(0);
    }
    // The events are not the same event: a wreck is not a gust, and a horn is a
    // press. If two patterns are equal, one of the two call sites is lying.
    const serialised = patterns.map(([, ms]) => JSON.stringify(ms));
    expect(new Set(serialised).size).toBe(serialised.length);
  });

  it('keeps the gust pattern the one that already shipped', () => {
    // `GUST_VIBRATION` in wind.ts was [35, 55, 90]; the gust moved here so the
    // table is one place, and the numbers did not change with the move.
    expect(HAPTIC_PATTERNS.gust).toEqual([35, 55, 90]);
  });
});

describe('buzz', () => {
  it('buzzes a phone that has a motor, with the pattern for the event', () => {
    const { nav, calls } = phone();
    expect(buzz('collision', { nav })).toBe(true);
    expect(calls).toEqual([[...HAPTIC_PATTERNS.collision]]);
  });

  it('says no on a device with no motor instead of throwing', () => {
    // iOS Safari: no navigator.vibrate at all. A desktop browser: the method
    // exists and there is nothing to move. Both are "false", never an exception.
    expect(buzz('gust', { nav: null })).toBe(false);
    expect(buzz('gust', { nav: {} as Pick<Navigator, 'vibrate'> })).toBe(false);
    expect(hapticAvailable(null)).toBe(false);
    expect(hapticAvailable({} as Pick<Navigator, 'vibrate'>)).toBe(false);
  });

  it('treats a browser that refuses as a refusal, not a crash', () => {
    const refuses = { vibrate: () => { throw new Error('nope'); } } as unknown as Pick<Navigator, 'vibrate'>;
    expect(() => buzz('horn', { nav: refuses })).not.toThrow();
    expect(buzz('horn', { nav: refuses })).toBe(false);
  });

  it('the player switch is real: off means the motor is never asked', () => {
    const { nav, calls } = phone();
    expect(buzz('verdict', { nav, enabled: false })).toBe(false);
    expect(calls, 'a buzz the player turned off never reached the API').toEqual([]);
    // And on means on, so the switch is not a one-way door.
    expect(buzz('verdict', { nav, enabled: true })).toBe(true);
    expect(calls.length).toBe(1);
  });

  it('a device without a motor is a device, not an error', () => {
    const { nav } = phone();
    expect(hapticAvailable(nav)).toBe(true);
    // hapticNav() reads the real navigator; in a node test that is a real object
    // without vibrate, which is exactly the "no motor" case the game must survive.
    expect(typeof hapticNav()).not.toBe('undefined');
  });
});

describe('the patterns are the events, not synonyms', () => {
  const names: HapticPattern[] = ['gust', 'collision', 'horn', 'button', 'qte', 'verdict'];
  it('has an entry for every name the call sites use', () => {
    for (const n of names) expect(HAPTIC_PATTERNS[n], n).toBeTruthy();
  });
});
