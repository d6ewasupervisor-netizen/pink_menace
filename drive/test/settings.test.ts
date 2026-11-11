/**
 * The settings the panel writes (items 4.1 and 4.2).
 *
 * The panel is a view; the store is the contract. These tests pin the contract —
 * the clamps, the defaults, and what survives a restart — so a slider cannot
 * write a value the drive would have to defend itself against, and a calibration
 * cannot be the thing a reset throws away.
 */
import { beforeAll, describe, expect, it } from 'vitest';

type Stores = {
  game: typeof import('../src/stores/gameStore').useGameStore;
  tilt: typeof import('../src/input/tiltSteering');
};
let s: Stores;

beforeAll(async () => {
  // gameStore persists through zustand/persist; node has no localStorage.
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
    tilt: await import('../src/input/tiltSteering'),
  };
});

const g = () => s.game.getState();

describe('the defaults a player never touched', () => {
  it('ships the drive unchanged: sensitivity 1, no tilt, a zero neutral', () => {
    expect(g().steeringSensitivity).toBe(1);
    expect(g().tiltSteering).toBe(false);
    expect(g().tiltInvert).toBe(false);
    expect(g().tiltNeutral).toEqual({ roll: 0, pitch: 0 });
  });
});

describe('steering sensitivity', () => {
  it('accepts the slider range', () => {
    g().setSteeringSensitivity(0.5);
    expect(g().steeringSensitivity).toBe(0.5);
    g().setSteeringSensitivity(2);
    expect(g().steeringSensitivity).toBe(2);
  });

  it('clamps outside the range rather than trusting the caller', () => {
    g().setSteeringSensitivity(0);
    expect(g().steeringSensitivity).toBe(0.5);
    g().setSteeringSensitivity(99);
    expect(g().steeringSensitivity).toBe(2);
    g().setSteeringSensitivity(1);
  });
});

describe('the volume sliders', () => {
  it('clamp to 0–1 in both directions', () => {
    g().setSfxVolume(-1);
    expect(g().sfxVolume).toBe(0);
    g().setSfxVolume(2);
    expect(g().sfxVolume).toBe(1);
    g().setMusicVolume(0.25);
    expect(g().musicVolume).toBe(0.25);
    g().setSfxVolume(0.7);
    g().setMusicVolume(0.3);
  });
});

describe('haptics: a switch, not a side effect of steady cam', () => {
  it('ships on, so a phone that can buzz does', () => {
    expect(g().haptics).toBe(true);
  });

  it('is its own switch in both directions', () => {
    g().setHaptics(false);
    expect(g().haptics).toBe(false);
    g().setHaptics(true);
    expect(g().haptics).toBe(true);
  });

  it('does not follow reduced motion: motion and vibration are different senses', () => {
    g().setHaptics(true);
    g().setReducedMotion(true);
    expect(g().haptics, 'a steady camera still wants the wreck in the hand').toBe(true);
    g().setReducedMotion(false);
    g().setHaptics(true);
  });

  it('survives a reset, like the rest of the settings', () => {
    g().setHaptics(false);
    g().resetProgress();
    expect(g().haptics).toBe(false);
    g().setHaptics(true);
  });
});

describe('tilt: the three writes and the calibration', () => {
  it('turns on, reverses and turns off', () => {
    g().setTiltSteering(true);
    expect(g().tiltSteering).toBe(true);
    g().setTiltInvert(true);
    expect(g().tiltInvert).toBe(true);
    g().setTiltSteering(false);
    g().setTiltInvert(false);
    expect(g().tiltSteering).toBe(false);
    expect(g().tiltInvert).toBe(false);
  });

  it('calibrating with no reading changes nothing and says so', () => {
    s.tilt.clearTiltReading();
    const before = g().tiltNeutral;
    expect(g().calibrateTilt()).toBeNull();
    expect(g().tiltNeutral).toBe(before);
  });

  it('calibrating stores the reading the player held', () => {
    s.tilt.noteTiltReading({ roll: 9, pitch: -4 });
    expect(g().calibrateTilt()).toEqual({ roll: 9, pitch: -4 });
    expect(g().tiltNeutral).toEqual({ roll: 9, pitch: -4 });
    // ...and the maths now calls that angle straight.
    expect(s.tilt.tiltSteer({ roll: 9, pitch: -4 }, g().tiltNeutral)).toBe(0);
    expect(s.tilt.tiltSteer({ roll: 19, pitch: -4 }, g().tiltNeutral)).toBeGreaterThan(0);
    // Leave the store as the suite found it.
    g().calibrateTilt();
    s.tilt.noteTiltReading({ roll: 0, pitch: 0 });
    g().calibrateTilt();
  });

  it('a calibration survives a reset, like the other settings', () => {
    s.tilt.noteTiltReading({ roll: 6, pitch: 1 });
    g().calibrateTilt();
    g().setTiltSteering(true);
    g().setTiltInvert(true);
    g().setSteeringSensitivity(1.4);

    g().resetProgress();

    expect(g().tiltNeutral).toEqual({ roll: 6, pitch: 1 });
    expect(g().tiltSteering).toBe(true);
    expect(g().tiltInvert).toBe(true);
    expect(g().steeringSensitivity).toBe(1.4);

    // Put the settings back so a later test does not inherit a hand.
    g().setTiltSteering(false);
    g().setTiltInvert(false);
    g().setSteeringSensitivity(1);
    s.tilt.noteTiltReading({ roll: 0, pitch: 0 });
    g().calibrateTilt();
  });
});
