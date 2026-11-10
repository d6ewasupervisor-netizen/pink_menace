/**
 * reduced motion — one switch, and every surface behind it (item 5.1).
 *
 * The cockpit's tokens file has carried a `.qr-anim` rule since item 3.1, and
 * nothing used the class: the switch was written and never plugged in. This file
 * exists so that cannot happen again — it pins the CSS contract and the store
 * value that drives it, and the e2e (`e2e/feel.spec.ts`) proves the same contract
 * in a real browser.
 *
 * Two doors lead to the same room, and both must be open:
 *
 *   - the OS preference (`@media (prefers-reduced-motion: reduce)`), and
 *   - the game's own settings row, which is a store boolean and therefore needs
 *     an attribute the CSS can read (`[data-reduced-motion="true"]`).
 *
 * A player who turns steady cam on in the pause menu is not running a media
 * query; without the second door the camera stops shaking and every CSS
 * animation keeps running.
 */
import { beforeAll, describe, expect, it } from 'vitest';

type Stores = {
  game: typeof import('../src/stores/gameStore').useGameStore;
  tokens: typeof import('../src/components/Game3D/cockpit/tokens');
};
let s: Stores;

beforeAll(async () => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  } as Storage;
  s = {
    game: (await import('../src/stores/gameStore')).useGameStore,
    tokens: await import('../src/components/Game3D/cockpit/tokens'),
  };
});

describe('the CSS switch', () => {
  const css = () => s.tokens.TOKEN_CSS;

  it('has a class an animated surface can join, and the class really stops it', () => {
    expect(css(), 'the class exists').toContain('.qr-anim');
    // `animation:none !important` and `transition:none !important`: a surface's
    // own inline animation must lose to the switch, so !important is the point.
    expect(css()).toMatch(/\.qr-anim\s*\{[^}]*animation:\s*none\s*!important/i);
    expect(css()).toMatch(/\.qr-anim\s*\{[^}]*transition:\s*none\s*!important/i);
  });

  it('opens for the OS preference', () => {
    expect(css()).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('opens for the game own settings row, which is not a media query', () => {
    // The second door: the settings row writes a store boolean, so the CSS needs
    // an attribute selector or the toggle stops the camera and nothing else.
    expect(css()).toMatch(/\[data-reduced-motion="true"\][^{]*\.qr-anim/);
  });
});

describe('the store value behind the settings row', () => {
  it('defaults to off, so a player who never asked gets the animation', () => {
    expect(s.game.getState().reducedMotion).toBe(false);
  });

  it('is a switch, not a one-way door', () => {
    s.game.getState().setReducedMotion(true);
    expect(s.game.getState().reducedMotion).toBe(true);
    s.game.getState().setReducedMotion(false);
    expect(s.game.getState().reducedMotion).toBe(false);
  });

  it('survives a reset, like the rest of the settings', () => {
    s.game.getState().setReducedMotion(true);
    s.game.getState().resetProgress();
    expect(s.game.getState().reducedMotion).toBe(true);
    s.game.getState().setReducedMotion(false);
  });
});
