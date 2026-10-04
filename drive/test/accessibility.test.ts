/**
 * P12 — accessibility.
 *
 * Three contracts:
 *   1. the default bind table resolves to the CURRENT arrows/WASD/Space
 *      behaviour, so an unbound player is unaffected;
 *   2. a rebound steer key is actually honoured by mergeDriveInput;
 *   3. the pause menu can reset — one row and the whole table.
 *
 * Plus the three text-size steps, applied to type only.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINDS,
  DRIVE_ACTIONS,
  mergeDriveInput,
  rebind,
  resetBind,
  resetAllBinds,
  normalizeBinds,
  liveKeys,
  type BindMap,
} from '../src/input/driveInput';
import { TEXT_SIZES, TEXT_SCALE, nextTextSize, normalizeTextSize, textScaleStyle } from '../src/input/textSize';

function press(...keys: string[]) {
  liveKeys.clear();
  for (const k of keys) liveKeys.add(k);
}
function releaseAll() { liveKeys.clear(); }

describe('P12 — default binds resolve to the current behaviour', () => {
  it('carries the shipped arrows + WASD set', () => {
    expect(DEFAULT_BINDS.steerLeft).toEqual(['ArrowLeft', 'a']);
    expect(DEFAULT_BINDS.steerRight).toEqual(['ArrowRight', 'd']);
    expect(DEFAULT_BINDS.throttle).toEqual(['ArrowUp', 'w']);
    expect(DEFAULT_BINDS.brake).toEqual(['ArrowDown', 's']);
    expect(DEFAULT_BINDS.handbrake).toEqual([' ']);
    expect(DEFAULT_BINDS.horn).toEqual(['h']);
    expect(DEFAULT_BINDS.headlights).toEqual(['l']);
    expect(DEFAULT_BINDS.pause).toEqual(['Escape', 'p']);
  });

  it('steers with the arrow keys', () => {
    press('ArrowLeft');
    expect(mergeDriveInput(1).steering).toBe(-1);
    press('ArrowRight');
    expect(mergeDriveInput(1).steering).toBe(1);
    releaseAll();
    expect(mergeDriveInput(1).steering).toBe(0);
  });

  it('steers with WASD too, both cases', () => {
    press('a'); expect(mergeDriveInput(1).steering).toBe(-1);
    press('A'); expect(mergeDriveInput(1).steering).toBe(-1);
    press('d'); expect(mergeDriveInput(1).steering).toBe(1);
    press('D'); expect(mergeDriveInput(1).steering).toBe(1);
    releaseAll();
  });

  it('drives the pedals and the handbrake on the old keys', () => {
    press('ArrowUp'); expect(mergeDriveInput(1).throttle).toBe(1);
    press('w'); expect(mergeDriveInput(1).throttle).toBe(1);
    press('ArrowDown'); expect(mergeDriveInput(1).brake).toBe(1);
    press('s'); expect(mergeDriveInput(1).brake).toBe(1);
    press(' '); expect(mergeDriveInput(1).emergencyBrake).toBe(true);
    releaseAll();
    expect(mergeDriveInput(1)).toEqual({ steering: 0, throttle: 0, brake: 0, emergencyBrake: false });
  });
});

describe('P12 — a rebound key is honoured', () => {
  it('steers on the rebound key instead of the old one', () => {
    const binds = rebind(DEFAULT_BINDS, 'steerLeft', 'q');

    press('q');
    expect(mergeDriveInput(1, binds).steering).toBe(-1);

    // The old key no longer steers.
    press('ArrowLeft');
    expect(mergeDriveInput(1, binds).steering).toBe(0);
    press('a');
    expect(mergeDriveInput(1, binds).steering).toBe(0);
    releaseAll();
  });

  it('a rebound handbrake key works', () => {
    const binds = rebind(DEFAULT_BINDS, 'handbrake', 'x');
    press('x'); expect(mergeDriveInput(1, binds).emergencyBrake).toBe(true);
    press(' '); expect(mergeDriveInput(1, binds).emergencyBrake).toBe(false);
    releaseAll();
  });
});

describe('P12 — the pause menu can reset', () => {
  it('resets one row back to its default', () => {
    const rebound = rebind(rebind(DEFAULT_BINDS, 'steerLeft', 'q'), 'handbrake', 'x');
    const fixed = resetBind(rebound, 'steerLeft');
    expect(fixed.steerLeft).toEqual(['ArrowLeft', 'a']);
    expect(fixed.handbrake).toEqual(['x']); // the other row is untouched
  });

  it('resets the whole table', () => {
    let binds: BindMap = DEFAULT_BINDS;
    for (const action of DRIVE_ACTIONS) binds = rebind(binds, action, 'F13');
    expect(resetAllBinds()).toEqual(DEFAULT_BINDS);
  });

  it('normalizes a partial or stale saved map over the defaults', () => {
    // A save from before a new action existed still yields every action.
    const restored = normalizeBinds({ steerLeft: ['q'] });
    expect(restored.steerLeft).toEqual(['q']);
    expect(restored.brake).toEqual(DEFAULT_BINDS.brake);
    expect(resetAllBinds()).toEqual(DEFAULT_BINDS);
    // Junk falls back to the defaults rather than breaking input.
    expect(normalizeBinds(null)).toEqual(DEFAULT_BINDS);
    expect(normalizeBinds({ brake: [7, ''] }).brake).toEqual(DEFAULT_BINDS.brake);
  });
});

describe('P12 — text size', () => {
  it('has exactly three steps and standard is the current size', () => {
    expect(TEXT_SIZES).toEqual([0, 1, 2]);
    expect(TEXT_SCALE[0]).toBe(1);
  });

  it('cycles and clamps', () => {
    expect(nextTextSize(0)).toBe(1);
    expect(nextTextSize(1)).toBe(2);
    expect(nextTextSize(2)).toBe(0);
    expect(normalizeTextSize(9)).toBe(0);
    expect(normalizeTextSize(2)).toBe(2);
  });

  it('publishes a CSS variable for the overlay, not a world scale', () => {
    expect(textScaleStyle(2)).toEqual({ '--qr-text-scale': '1.3' });
    expect(textScaleStyle(0)).toEqual({ '--qr-text-scale': '1' });
  });
});