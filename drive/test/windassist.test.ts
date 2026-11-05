/**
 * The Vantage Bridge assist: help a thumb can actually use.
 *
 * 6.3 asks for "under 45, two hands, small corrections". On glass, her HAR is
 * 52–59 in the 45 and a skid in the 25, because a touch stick's travel is 54 px
 * and a full push is full lock. `quietroads/assist.ts` is the answer: on touch
 * and keyboard (never on an analog pad) the car holds 40 itself, steering is
 * scaled to 55 %, and a gust announces which side it comes from 0.9 s before the
 * story's `wind.gust`.
 *
 * Measured here: the hold's numbers, the gain's numbers, both grading windows
 * still being reachable by a thumb, the pedal curve the stick now has, and the
 * warning actually preceding the gust through the real `Simulation`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  WIND,
  WIND_MISSION,
  cruiseSpeedMps,
  gustSide,
  gustSideAt,
  gustWarnings,
  gustsCrossed,
  steerWindows,
  steerWithAssist,
  windAssistFor,
} from '../src/quietroads/assist';
import { Simulation, type VehicleSample } from '../src/quietroads';
import {
  PEDAL_CURVE,
  PEDAL_DEAD_ZONE,
  STEER_CURVE,
  STEER_DEAD_ZONE,
  shapeStickAxis,
} from '../src/input/driveInput';
import { bridge } from '../src/quietroads/sim/corridors';

const HM = 0.44704;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, '..');

describe('who gets the assist', () => {
  it('the span, on touch or keyboard — never on an analog pad', () => {
    expect(windAssistFor(WIND_MISSION, 'touch')).toMatchObject({ holdMph: 40, label: 'WIND ASSIST · 40' });
    expect(windAssistFor(WIND_MISSION, 'gamepad')).toBeNull();
    // Every other mission is untouched, on every input.
    expect(windAssistFor('bridge_after_sign_moth', 'touch')).toBeNull();
    expect(windAssistFor('mission_central_ledger', 'touch')).toBeNull();
    expect(windAssistFor('', 'touch')).toBeNull();
  });

  it('the label is on the HUD, in the cockpit, with the hold in it', () => {
    const hud = fs.readFileSync(path.join(DRIVE, 'src', 'components', 'Game3D', 'WindAssistHUD.tsx'), 'utf8');
    expect(hud).toContain('data-layer="wind-assist"');
    expect(hud).toContain('data-wind-assist-label');
    expect(hud).toContain('data-gust-side');
    expect(WIND.label).toBe(`WIND ASSIST · ${WIND.holdMph}`);
  });
});

describe('the speed hold', () => {
  const target = WIND.holdMph * HM;

  it('finds 40 mph on its own and cannot be pushed past it', () => {
    let v = 0;
    const dt = 1 / 60;
    let over = 0;
    for (let i = 0; i < 60 * 30; i++) {
      // A thumb pinned at full throttle the whole way: the hold still wins.
      const wanted = v + 1.96 * dt;
      v = cruiseSpeedMps(wanted, target, false, dt);
      if (v > target + 1e-9) over += 1;
    }
    expect(over).toBe(0);
    expect(v).toBeCloseTo(target, 6);
    expect(v / HM).toBeLessThan(45);        // under the posted limit, by design
  });

  it('the brake still works, and the hold comes back after it', () => {
    let v = target;
    for (let i = 0; i < 60 * 3; i++) v = Math.max(0, cruiseSpeedMps(v - 8 * (1 / 60), target, true, 1 / 60));
    expect(v).toBe(0);                       // a panic stop is still a stop
    for (let i = 0; i < 60 * 25; i++) v = cruiseSpeedMps(v, target, false, 1 / 60);
    expect(v).toBeCloseTo(target, 6);        // ...and the hold finds 40 again
  });

  it('never shortcuts: above the target it clamps, below it it accelerates at the hold rate', () => {
    expect(cruiseSpeedMps(30, target, false, 1 / 60)).toBe(target);
    expect(cruiseSpeedMps(0, target, false, 1 / 60)).toBeCloseTo(WIND.cruiseAccelMps2 / 60, 6);
  });
});

describe('steering a thumb can aim', () => {
  const assist = windAssistFor(WIND_MISSION, 'touch')!;

  it('full stick is 55 %, not 100 %, with a small dead zone', () => {
    expect(steerWithAssist(1, 1, assist)).toBeCloseTo(WIND.steerGain, 6);
    expect(steerWithAssist(-1, 1, assist)).toBeCloseTo(-WIND.steerGain, 6);
    expect(steerWithAssist(1, 1, null)).toBe(1);                        // no assist: full lock
    expect(steerWithAssist(WIND.steerDeadZone / 2, 1, assist)).toBe(0);  // the dead zone
    expect(steerWithAssist(0.2, 1, assist)).toBeCloseTo(0.11, 6);        // a third of a stick
  });

  it('both grades are reachable by a thumb — the pass and the mistake', () => {
    const win = steerWindows(true);
    // A modest correction (two thirds of the stick) lands inside into_wind...
    const small = steerWithAssist(0.4, 1, assist);
    expect(small).toBeGreaterThan(win.intoWind.min);
    expect(small).toBeLessThan(win.intoWind.max);
    // ...and a pinned stick is still an overcorrection.
    expect(steerWithAssist(1, 1, assist)).toBeGreaterThan(win.overcorrect.threshold);
    // Without the assist (a pad) the old windows still apply.
    expect(steerWindows(false).intoWind).toEqual({ min: 0.12, max: 0.45, holdS: 0.8 });
  });
});

describe('the pedal curve, everywhere', () => {
  it('half the travel is about a third of the throttle', () => {
    const at = (raw: number) => shapeStickAxis(raw, PEDAL_DEAD_ZONE, PEDAL_CURVE);
    expect(at(0)).toBe(0);
    expect(at(0.05)).toBe(0);                             // inside the dead zone
    expect(at(0.25)).toBeCloseTo(0.067, 2);
    expect(at(0.5)).toBeCloseTo(0.285, 2);
    expect(at(0.75)).toBeCloseTo(0.602, 2);
    expect(at(1)).toBe(1);
    // The curve, stated as the thing it fixes: half travel is well under half throttle.
    expect(at(0.5)).toBeLessThan(0.35);
    // Steering keeps its old shape.
    expect(shapeStickAxis(1, STEER_DEAD_ZONE, STEER_CURVE)).toBe(1);
    expect(shapeStickAxis(0.05, STEER_DEAD_ZONE, STEER_CURVE)).toBe(0);
  });

  it('the stick actually uses it', () => {
    const stick = fs.readFileSync(path.join(DRIVE, 'src', 'components', 'Game3D', 'TouchOverlay.tsx'), 'utf8');
    expect(stick).toContain('shapeStickAxis(-dy / radius, PEDAL_DEAD_ZONE, PEDAL_CURVE)');
  });
});

describe('the gust announces itself before it lands', () => {
  it("the arrow's side alternates, and warnings sit 0.9 s ahead of gusts", () => {
    expect(gustSide(1)).toBe('right');
    expect(gustSide(2)).toBe('left');
    expect(gustSideAt(8)).toBe('right');
    expect(gustSideAt(16)).toBe('left');
    expect(gustsCrossed(0, 20)).toEqual([8, 16]);
    expect(gustWarnings(0, 20).map((w) => w.atS)).toEqual([7.1, 15.1]);
    expect(gustWarnings(0, 20).every((w) => w.inS === WIND.gustLeadS)).toBe(true);
    // A long frame cannot skip one: the crossing test is closed on both ends.
    expect(gustsCrossed(7.9, 8.4)).toEqual([8]);
    expect(gustWarnings(6.9, 7.3).map((w) => w.atS)).toEqual([7.1]);
  });

  it('through the real sim: every gust has a warning 0.8-1 s earlier, same side', () => {
    const marks: { event: string; t: number; side?: unknown }[] = [];
    let t = 0;
    const sim = new Simulation({
      fire: (event, data) => marks.push({ event, t, side: data?.side }),
      requestQuiz: () => {},
      setObjective: () => {},
      toast: () => {},
      placeVehicle: () => {},
    });
    sim.noise.setListeners([]);
    sim.startMission('vantage_bridge_crossing');
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 20; i++) {
      t += dt;
      sim.step(dt, {
        pos: { x: bridge.start.x + i * 0.3, y: bridge.start.y },
        heading: 0, speedMs: 18, throttle: 0.5, brake: 0, steer: 0, horn: false,
      } as VehicleSample);
    }
    const warns = marks.filter((m) => m.event === 'wind.gust.warn');
    const gusts = marks.filter((m) => m.event === 'wind.gust');
    expect(gusts.length).toBeGreaterThanOrEqual(2);
    expect(warns.length).toBe(gusts.length);
    for (const gust of gusts) {
      const warn = warns.find((w) => Math.abs(w.t - gust.t) < 2 && w.side === gust.side);
      expect(warn, `a warning for the gust at ${gust.t.toFixed(2)}s`).toBeTruthy();
      const lead = gust.t - warn!.t;
      expect(lead).toBeGreaterThan(0.8);
      expect(lead).toBeLessThan(1.0);
    }
  });
});
