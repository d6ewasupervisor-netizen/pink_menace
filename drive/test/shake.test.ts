/**
 * shake — the camera's one reaction, as arithmetic (item 5.1).
 *
 * The failure this file exists for: steady cam is on and a wreck still throws the
 * frame around. The second failure: the shake never stops, so a single scrape
 * leaves the camera jittering for the rest of the drive. Both are decidable
 * without a WebGL context, which is why the maths moved out of `GameCamera.tsx`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  resetShake,
  shakeIntensity,
  shakeLevel,
  triggerScreenShake,
} from '../src/quietroads/shake';

beforeEach(() => resetShake());

describe('a hit shakes the frame', () => {
  it('takes a normal wreck and gives the frame a level to offset by', () => {
    expect(triggerScreenShake(0.5, 0.3)).toBe(true);
    expect(shakeLevel(0.016)).toBeCloseTo(0.5, 5);
    expect(shakeIntensity()).toBeLessThan(0.5);
  });

  it('never lowers a shake that is already running', () => {
    triggerScreenShake(0.9, 0.3);
    triggerScreenShake(0.2, 0.3);
    expect(shakeLevel(0.001)).toBeCloseTo(0.9, 3);
  });

  it('runs out: the full duration takes the level to zero and keeps it there', () => {
    triggerScreenShake(0.4, 0.2);
    expect(shakeLevel(0.2)).toBeCloseTo(0.4, 5);
    expect(shakeLevel(0.016)).toBe(0);
    expect(shakeIntensity()).toBe(0);
  });

  it('a longer delta decays further, and a clock jump backwards does not add shake', () => {
    triggerScreenShake(0.8, 0.4);          // decay 2 / s
    const afterBigStep = shakeLevel(0.1);  // 0.8, then 0.8 - 0.2 = 0.6
    expect(afterBigStep).toBeCloseTo(0.8, 5);
    expect(shakeIntensity()).toBeCloseTo(0.6, 5);
    // A negative delta is a clock going backwards, not time to un-decay.
    shakeLevel(-5);
    expect(shakeIntensity()).toBeCloseTo(0.6, 5);
  });
});

describe('reduced motion is a refusal, not a quieter shake', () => {
  it('refuses the trigger and leaves the camera still', () => {
    expect(triggerScreenShake(0.9, 0.4, { reducedMotion: true })).toBe(false);
    expect(shakeIntensity()).toBe(0);
    expect(shakeLevel(0.016)).toBe(0);
  });

  it('neither starts nor extends a shake while steady cam is on', () => {
    triggerScreenShake(0.7, 0.4);
    expect(shakeLevel(0.001)).toBeGreaterThan(0);
    const before = shakeIntensity();
    // A wreck arrives after the player turned steady cam on: the refusal must not
    // add to the level that is already decaying (the camera clears that itself).
    expect(triggerScreenShake(0.9, 0.4, { reducedMotion: true })).toBe(false);
    expect(shakeIntensity()).toBe(before);
  });
});

describe('inputs the frame could not defend against', () => {
  it('refuses zero, negative and non-finite requests instead of dividing by them', () => {
    expect(triggerScreenShake(0, 0.3)).toBe(false);
    expect(triggerScreenShake(-1, 0.3)).toBe(false);
    expect(triggerScreenShake(0.5, 0)).toBe(false);
    expect(triggerScreenShake(0.5, -0.2)).toBe(false);
    expect(triggerScreenShake(Number.NaN, 0.3)).toBe(false);
    expect(triggerScreenShake(0.5, Number.NaN)).toBe(false);
    expect(triggerScreenShake(0.5, Number.POSITIVE_INFINITY)).toBe(false);
    expect(shakeIntensity()).toBe(0);
  });
});
