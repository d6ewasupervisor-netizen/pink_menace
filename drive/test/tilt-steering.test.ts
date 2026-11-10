/**
 * Tilt steering, two-sided (item 4.3).
 *
 * The feature is a phone's roll becoming a car's steering. Every claim it makes
 * has a failure next to it here, because the failure mode is not "the car does
 * not steer" — it is "the car steers when the player did not ask", which is a
 * crash. So each test pins both the direction the player meant AND the reading
 * that must produce nothing.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TILT,
  clearTiltReading,
  isTiltReading,
  isTiltUsable,
  lastTiltReading,
  noteTiltReading,
  relativeRoll,
  tiltSteer,
  tiltToSteer,
  type TiltReading,
} from '../src/input/tiltSteering';

const held = (roll: number, pitch = 0): TiltReading => ({ roll, pitch });

describe('tiltToSteer — the dead zone is what stops a resting hand weaving', () => {
  it('a flat phone steers nothing', () => {
    expect(tiltToSteer(0)).toBe(0);
  });

  it('inside the dead zone, in both directions, is exactly zero', () => {
    for (const deg of [-2.4, -1, -0.1, 0, 0.1, 1, 2.4]) {
      expect(tiltToSteer(deg), `${deg}° is straight`).toBe(0);
    }
  });

  it('past the dead zone it steers, and the sign is the direction', () => {
    expect(tiltToSteer(10)).toBeGreaterThan(0);
    expect(tiltToSteer(-10)).toBeLessThan(0);
  });

  it('the dead zone edge itself is still straight, and a hair past is not', () => {
    expect(tiltToSteer(TILT.deadZoneDeg)).toBe(0);
    expect(tiltToSteer(TILT.deadZoneDeg + 0.1)).toBeGreaterThan(0);
    expect(tiltToSteer(-(TILT.deadZoneDeg + 0.1))).toBeLessThan(0);
  });
});

describe('tiltToSteer — full lock, clamping and linearity', () => {
  it('30° is full lock and 45° is still full lock', () => {
    expect(tiltToSteer(TILT.fullLockDeg)).toBe(1);
    expect(tiltToSteer(45)).toBe(1);
    expect(tiltToSteer(89)).toBe(1);
    expect(tiltToSteer(-TILT.fullLockDeg)).toBe(-1);
  });

  it('halfway between the dead zone and full lock is half steering', () => {
    const half = (TILT.deadZoneDeg + TILT.fullLockDeg) / 2; // 16.25°
    expect(tiltToSteer(half)).toBeCloseTo(0.5, 6);
    expect(tiltToSteer(-half)).toBeCloseTo(-0.5, 6);
  });

  it('left and right are mirror images, not two curves', () => {
    for (const deg of [3, 7.5, 12, 21, 29]) {
      expect(tiltToSteer(deg) + tiltToSteer(-deg), `${deg}° mirrors`).toBeCloseTo(0, 9);
    }
  });

  it('a broken reading steers nothing rather than everything', () => {
    expect(tiltToSteer(Number.NaN)).toBe(0);
    expect(tiltToSteer(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('a misconfigured pair (full lock at or under the dead zone) steers nothing', () => {
    expect(tiltToSteer(20, { fullLockDeg: 2, deadZoneDeg: 2.5 })).toBe(0);
    expect(tiltToSteer(20, { fullLockDeg: 2.5, deadZoneDeg: 2.5 })).toBe(0);
  });

  it('invert flips the sense without changing the magnitude', () => {
    expect(tiltToSteer(15, { invert: true })).toBeCloseTo(-tiltToSteer(15), 9);
    expect(tiltToSteer(-15, { invert: true })).toBeCloseTo(-tiltToSteer(-15), 9);
  });
});

describe('relativeRoll — the green-light calibration', () => {
  it('the angle the phone was held at is straight, not a permanent turn', () => {
    const neutral = held(12);
    expect(relativeRoll(held(12), neutral)).toBe(0);
    expect(tiltToSteer(relativeRoll(held(12), neutral))).toBe(0);
  });

  it('a turn is measured from the calibration, so 12° → 22° is 10° of steering', () => {
    const neutral = held(12);
    expect(relativeRoll(held(22), neutral)).toBe(10);
    expect(tiltToSteer(relativeRoll(held(22), neutral))).toBeGreaterThan(0);
    expect(relativeRoll(held(2), neutral)).toBe(-10);
  });

  it('clamps to ±90 so a wrapped reading cannot lock the other way', () => {
    expect(relativeRoll(held(89), held(-89))).toBe(90);
    expect(relativeRoll(held(-89), held(89))).toBe(-90);
  });
});

describe('tiltSteer — the whole path, and when it must answer nothing', () => {
  it('a phone held as a wheel steers', () => {
    expect(tiltSteer(held(20), held(0))).toBeCloseTo(0.6363, 3);
    expect(tiltSteer(held(-20), held(0))).toBeLessThan(-0.6);
  });

  it('a phone lying down is not a wheel: null, not zero', () => {
    // null keeps the sticks and keys in charge; 0 would mean "steering straight"
    // and would fight a thumb on the stick.
    expect(tiltSteer(held(20, 60))).toBeNull();
    expect(tiltSteer(held(20, -60))).toBeNull();
    expect(tiltSteer(held(20, 44))).not.toBeNull();
  });

  it('no reading at all is null, so nothing is invented', () => {
    expect(tiltSteer(null)).toBeNull();
    expect(tiltSteer(undefined)).toBeNull();
    expect(tiltSteer({} as TiltReading)).toBeNull();
    expect(tiltSteer({ roll: Number.NaN, pitch: 0 })).toBeNull();
  });

  it('out of the device cone is a broken reading, not a turn', () => {
    expect(tiltSteer({ roll: 120, pitch: 0 })).toBeNull();
    expect(tiltSteer({ roll: 0, pitch: 200 })).toBeNull();
  });
});

describe('the guards the listener depends on', () => {
  it('isTiltReading accepts the device cone and refuses outside it', () => {
    expect(isTiltReading({ roll: 0, pitch: 0 })).toBe(true);
    expect(isTiltReading({ roll: -90, pitch: -180 })).toBe(true);
    expect(isTiltReading({ roll: 91, pitch: 0 })).toBe(false);
    expect(isTiltReading({ roll: 0, pitch: -181 })).toBe(false);
    expect(isTiltReading({ roll: 'x', pitch: 0 } as unknown as TiltReading)).toBe(false);
    expect(isTiltReading(null)).toBe(false);
  });

  it('isTiltUsable is the upright test alone', () => {
    expect(isTiltUsable({ roll: 0, pitch: TILT.uprightPitchDeg })).toBe(true);
    expect(isTiltUsable({ roll: 0, pitch: TILT.uprightPitchDeg + 1 })).toBe(false);
    expect(isTiltUsable({ roll: 0, pitch: -(TILT.uprightPitchDeg + 1) })).toBe(false);
  });

  it('the shipped constants are the ones the maths assumes', () => {
    expect(TILT.fullLockDeg).toBe(30);
    expect(TILT.deadZoneDeg).toBe(2.5);
    expect(TILT.uprightPitchDeg).toBe(45);
    // Full lock is well inside the usable cone, or the phone would stop steering
    // before the axis reached its end.
    expect(TILT.fullLockDeg).toBeLessThan(TILT.uprightPitchDeg);
  });
});

describe('the last reading — what "SET STRAIGHT" calibrates against', () => {
  beforeEach(() => clearTiltReading());

  it('starts empty: a button pressed before any reading has nothing to save', () => {
    expect(lastTiltReading()).toBeNull();
  });

  it('keeps a usable reading, and copies it so a later mutation cannot rewrite it', () => {
    const live: TiltReading = { roll: 11, pitch: -3 };
    noteTiltReading(live);
    live.roll = 40;
    expect(lastTiltReading()).toEqual({ roll: 11, pitch: -3 });
  });

  it('a reading outside the device cone is not kept', () => {
    noteTiltReading({ roll: 120, pitch: 0 });
    expect(lastTiltReading()).toBeNull();
  });

  it('a phone lying down is kept (it is a real angle) and refused only at steer time', () => {
    noteTiltReading({ roll: 8, pitch: 70 });
    expect(lastTiltReading()).toEqual({ roll: 8, pitch: 70 });
    expect(tiltSteer(lastTiltReading())).toBeNull();
  });

  it('clearing leaves nothing to calibrate against', () => {
    noteTiltReading({ roll: 4, pitch: 2 });
    clearTiltReading();
    expect(lastTiltReading()).toBeNull();
  });
});
