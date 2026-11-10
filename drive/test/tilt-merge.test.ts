/**
 * Tilt steering's place in the merge (item 4.3).
 *
 * `mergeDriveInput` is where four sources meet: keys, an analog pad, the touch
 * stick, and now the phone's roll. The order is not arbitrary — a thumb on the
 * glass is a clearer statement of intent than a wrist angle, and a key held down
 * is clearer still. These tests pin the order, because the failure mode is a car
 * that fights the player: two sources both writing steering, and whichever ran
 * last winning.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  getLiveTilt,
  liveKeys,
  mergeDriveInput,
  setDriveInputLocked,
  setLiveTilt,
  setStickAxes,
  clearStickAxes,
} from '../src/input/driveInput';

function reset() {
  liveKeys.clear();
  clearStickAxes();
  setLiveTilt(null);
  setDriveInputLocked(false);
}

afterEach(reset);

describe('the tilt is a steering source', () => {
  it('steers the way the phone leans, both ways', () => {
    setLiveTilt(0.6);
    expect(mergeDriveInput(1).steering).toBeCloseTo(0.6, 6);
    setLiveTilt(-0.6);
    expect(mergeDriveInput(1).steering).toBeCloseTo(-0.6, 6);
  });

  it('goes through the sensitivity, like every other source', () => {
    setLiveTilt(0.5);
    expect(mergeDriveInput(2).steering).toBeCloseTo(1, 6); // clamped, not doubled past full lock
    expect(mergeDriveInput(0.5).steering).toBeCloseTo(0.25, 6);
  });

  it('no tilt opinion is not the same as straight: the merge leaves the steering alone', () => {
    setLiveTilt(null);
    expect(getLiveTilt()).toBeNull();
    expect(mergeDriveInput(1).steering).toBe(0);
  });

  it('a reading cannot smuggle in a value outside the axis', () => {
    setLiveTilt(5);
    expect(getLiveTilt()).toBe(1);
    setLiveTilt(-5);
    expect(getLiveTilt()).toBe(-1);
  });

  it('a broken number is no opinion, not a phantom turn', () => {
    setLiveTilt(Number.NaN);
    expect(getLiveTilt()).toBeNull();
    expect(mergeDriveInput(1).steering).toBe(0);
  });
});

describe('who wins when two sources disagree', () => {
  it('a key beats the tilt', () => {
    setLiveTilt(0.6);
    liveKeys.add('ArrowLeft');
    expect(mergeDriveInput(1).steering).toBe(-1);
    liveKeys.clear();
    // ...and the tilt is still there when the key is released.
    expect(mergeDriveInput(1).steering).toBeCloseTo(0.6, 6);
  });

  it('a thumb on the stick beats the tilt', () => {
    setLiveTilt(0.6);
    setStickAxes({ steer: -0.4, active: true });
    expect(mergeDriveInput(1).steering).toBeCloseTo(-0.4, 6);
    clearStickAxes();
    expect(mergeDriveInput(1).steering).toBeCloseTo(0.6, 6);
  });

  it('a hands-off wait zeroes the tilt too, not just the sticks and keys', () => {
    setLiveTilt(0.8);
    setDriveInputLocked(true);
    expect(mergeDriveInput(1).steering).toBe(0);
    setDriveInputLocked(false);
    expect(mergeDriveInput(1).steering).toBeCloseTo(0.8, 6);
  });

  it('the tilt never touches the pedals', () => {
    setLiveTilt(0.9);
    const out = mergeDriveInput(1);
    expect(out.throttle).toBe(0);
    expect(out.brake).toBe(0);
    expect(out.emergencyBrake).toBe(false);
  });
});
