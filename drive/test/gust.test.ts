/**
 * The Vantage Bridge gust, as a force — measured, not read.
 *
 * The bug this pins: 6.3 says "When the wind pushes, steer into it — small", and
 * nothing pushed. The arrow pointed at a gust that had no force, so a player who
 * obeyed it steered into nothing and left the lane. `quietroads/wind.ts` is the
 * shape; `VehicleController` puts the push on the car body; `sim/beats.ts` grades
 * the drift the push actually makes.
 *
 * These tests run the **real** controller (`tickVehicle`, arcade chassis and all)
 * against a stub Rapier body that integrates its own pose, with the real
 * `Simulation` beside it, so the story's own `wind.gust` is what starts the push —
 * the wiring `QuietRoadsBridge.deliver` performs. They measure lateral
 * displacement on the span (which runs east, so +y is the car's right).
 *
 * The numbers are the design targets, and they are what the files were tuned to:
 * no input drifts ~1.35 m (assist) / ~1.8 m (pad); a small into-wind correction
 * held for half a second leaves ~0.1 m; the same correction in still air drifts
 * the car over two metres.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const HM = 0.44704;          // mph → m/s
const DT = 1 / 60;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, '..');

type V = { x: number; y: number; z: number };
type Q = { x: number; y: number; z: number; w: number };

/** The smallest Rapier body `tickVehicle` touches. It integrates its own pose. */
class StubBody {
  pos: V = { x: 0, y: 0.5, z: 0 };
  quat: Q = { x: 0, y: 0, z: 0, w: 1 };
  lin: V = { x: 0, y: 0, z: 0 };
  ang: V = { x: 0, y: 0, z: 0 };
  translation() { return { ...this.pos }; }
  rotation() { return { ...this.quat }; }
  linvel() { return { ...this.lin }; }
  angvel() { return { ...this.ang }; }
  setTranslation(v: V) { this.pos = { ...v }; }
  setRotation(q: Q) { this.quat = { ...q }; }
  setLinvel(v: V) { this.lin = { ...v }; }
  setAngvel(v: V) { this.ang = { ...v }; }
  /** Rapier's half of the step: velocity → pose, and angular velocity → heading. */
  integrate(dt: number) {
    this.pos.x += this.lin.x * dt;
    this.pos.z += this.lin.z * dt;
    const half = (this.ang.y * dt) / 2;
    const c = Math.cos(half), s = Math.sin(half);
    const q = this.quat;
    this.quat = { x: 0, y: q.y * c + q.w * s, z: 0, w: q.w * c - q.y * s };
  }
}

type Mods = {
  vc: typeof import('../src/systems/VehicleController');
  wind: typeof import('../src/quietroads/wind');
  sim: typeof import('../src/quietroads');
  heading: typeof import('../src/systems/vehicleHeading').headingFromRotation;
  game: typeof import('../src/stores/gameStore').useGameStore;
  bridge: typeof import('../src/quietroads/sim/corridors').bridge;
};
let m: Mods;

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
  m = {
    vc: await import('../src/systems/VehicleController'),
    wind: await import('../src/quietroads/wind'),
    sim: await import('../src/quietroads'),
    heading: (await import('../src/systems/vehicleHeading')).headingFromRotation,
    game: (await import('../src/stores/gameStore')).useGameStore,
    bridge: (await import('../src/quietroads/sim/corridors')).bridge,
  };
});

/** The span's first gust lands 8 s into the mission (assist.WIND.gustPeriodS). */
const GUST_AT_S = 8;

interface Run {
  /** Lateral displacement over the push, metres. Negative = the car's left. */
  drift: number;
  /** Speed at the end of the push, mph (the hold, not the gust, sets it). */
  speedMph: number;
  /** Heading change over the push, degrees (the nose kick comes back to 0). */
  headingDeg: number;
  count: (name: string) => number;
  events: { event: string; t: number; data?: Record<string, unknown> }[];
}

/**
 * Roll to the 40 mph hold, then drive the span with the real sim beside the car.
 * With `gust: true` the story's own `wind.gust` starts the push, which is exactly
 * how the bridge does it; with `gust: false` it is the same drive in still air.
 */
function drive(opts: {
  assist: boolean;
  gust: boolean;
  /** Sim seconds since the span began → steering, 0..1 (already post-assist). */
  steer?: (t: number) => number;
}): Run {
  const { vc, game } = m;
  vc.resetVehicleController();
  const body = new StubBody();
  vc.registerVehicleBody(body as never);
  game.setState({ worldMode: 'kent', phase: 'driving', throttle: 0.6, brake: 0, steering: 0, emergencyBrake: false });
  vc.teleportVehicle(m.bridge.start.x, m.bridge.start.y, 0);   // bridge west, facing east
  vc.setCruiseTargetMph(40);                                    // the assist's hold

  // The car arrives at 40 mph; the sim's clock (and its gust cadence) starts here.
  for (let i = 0; i < 60 * 60 && vc.getCurrentSpeedMs() < 17.85; i++) {
    vc.tickVehicle(body as never, DT);
    body.integrate(DT);
  }

  const events: Run['events'] = [];
  let t = 0;
  const sim = new m.sim.Simulation({
    fire: (event, data) => {
      events.push({ event, t, data });
      // What `QuietRoadsBridge.deliver` does with the story's cue: the push.
      if (event === 'wind.gust') {
        vc.startGust(data?.side === 'right' ? 'right' : 'left', { assist: opts.assist });
      }
    },
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  sim.noise.setListeners([]);
  if (opts.gust) sim.startMission('vantage_bridge_crossing');

  const pushEnd = GUST_AT_S + m.wind.GUST_TOTAL_S;
  let yAtGust = 0;
  let yAtEnd = 0;
  let hAtGust = 0;
  let hAtEnd = 0;
  let speedAtEnd = 0;
  const total = pushEnd + 0.6;
  for (let i = 0; i < Math.round(total / DT); i++) {
    const steer = opts.steer ? opts.steer(t) : 0;
    game.setState({ steering: steer });
    vc.tickVehicle(body as never, DT);
    body.integrate(DT);
    const heading = m.heading(body.quat);
    sim.step(DT, {
      pos: { x: body.pos.x, y: body.pos.z },
      heading,
      speedMs: vc.getCurrentSpeedMs(),
      throttle: 0.6,
      brake: 0,
      steer,
      horn: false,
    });
    t += DT;
    if (Math.abs(t - GUST_AT_S) <= DT / 2) { yAtGust = body.pos.z; hAtGust = heading; }
    if (Math.abs(t - pushEnd) <= DT / 2) {
      yAtEnd = body.pos.z;
      hAtEnd = heading;
      speedAtEnd = vc.getCurrentSpeedMs();
    }
  }
  return {
    drift: yAtEnd - yAtGust,
    speedMph: speedAtEnd / HM,
    headingDeg: ((hAtEnd - hAtGust) * 180) / Math.PI,
    events,
    count: (name: string) => events.filter((e) => e.event === name).length,
  };
}

describe('the gust has a shape, and the shape is the design', () => {
  it('warns 0.9 s ahead, ramps in 0.3, holds 1.2, ramps out 0.4', () => {
    const { GUST, gustEnvelope, GUST_TOTAL_S } = m.wind;
    expect(GUST.leadS).toBeGreaterThanOrEqual(0.8);
    expect(GUST.leadS).toBeLessThanOrEqual(1.0);
    expect(GUST.rampInS).toBeCloseTo(0.3, 6);
    expect(GUST.holdS).toBeCloseTo(1.2, 6);
    expect(GUST.rampOutS).toBeCloseTo(0.4, 6);
    expect(GUST_TOTAL_S).toBeCloseTo(1.9, 6);
    expect(gustEnvelope(0)).toBe(0);
    expect(gustEnvelope(0.15)).toBeCloseTo(0.5, 6);      // half way up the ramp
    expect(gustEnvelope(0.3)).toBe(1);
    expect(gustEnvelope(1.4)).toBe(1);                    // still holding
    expect(gustEnvelope(1.7)).toBeCloseTo(0.5, 6);        // half way out
    expect(gustEnvelope(GUST_TOTAL_S)).toBe(0);
    expect(gustEnvelope(5)).toBe(0);
    expect(gustEnvelope(-1)).toBe(0);
  });

  it('the side is where the wind comes FROM, and the push goes the other way', () => {
    const { gustPushDir, gustLatMps, gustActionLabel, gustSteerWord } = m.wind;
    expect(gustPushDir('left')).toBe(1);      // from the left → pushes right
    expect(gustPushDir('right')).toBe(-1);    // from the right → pushes left
    expect(gustLatMps(1, 'right', true)).toBeLessThan(0);
    expect(gustLatMps(1, 'left', true)).toBeGreaterThan(0);
    // The label names the action, and the action is toward the wind.
    expect(gustSteerWord('right')).toBe('right');
    expect(gustActionLabel('right')).toBe('GUST · steer right');
    expect(gustActionLabel('left')).toBe('GUST · steer left');
  });

  it('a phone buzzes where it can, and says nothing where it cannot', () => {
    const { buzzGust, GUST_VIBRATION } = m.wind;
    const calls: (number | number[])[] = [];
    const phone = { vibrate: (p: number | number[]) => { calls.push(p); return true; } } as Pick<Navigator, 'vibrate'>;
    expect(buzzGust(phone)).toBe(true);
    expect(calls[0]).toEqual([...GUST_VIBRATION]);
    expect(buzzGust(null)).toBe(false);                     // iOS: no API at all
    expect(buzzGust({} as Pick<Navigator, 'vibrate'>)).toBe(false);
    const refuses = { vibrate: () => { throw new Error('nope'); } } as unknown as Pick<Navigator, 'vibrate'>;
    expect(buzzGust(refuses)).toBe(false);                  // present but refusing is not a crash
  });
});

describe('the push, on the real car (assist: touch and keyboard)', () => {
  it('a gust with no input drifts the car 1.0–1.5 m downwind, and recovers', () => {
    const run = drive({ assist: true, gust: true });
    // From the right, so the car goes to its left: negative on the span's y axis.
    expect(run.drift).toBeLessThan(0);
    expect(Math.abs(run.drift)).toBeGreaterThanOrEqual(1.0);
    expect(Math.abs(run.drift)).toBeLessThanOrEqual(1.5);
    // Never a crash on its own: the deck is 16 m wide and the car started centred.
    expect(Math.abs(run.drift)).toBeLessThan(m.bridge.road.h / 2);
    // The nose kick is an offset, not a heading change: it comes back with the gust.
    expect(Math.abs(run.headingDeg)).toBeLessThan(1);
    expect(run.speedMph).toBeGreaterThan(38);               // the hold is not what moved
    expect(run.speedMph).toBeLessThan(41);
  });

  it('a small correction held through the push leaves under 0.4 m, and grades as into_wind', () => {
    // Half a second of a small into-wind correction: the whole gesture the scene
    // asks for. 0.08 is about a fifth of the stick after the assist's 0.55 gain.
    const run = drive({ assist: true, gust: true, steer: (t) => (t >= GUST_AT_S && t < GUST_AT_S + 0.5 ? 0.08 : 0) });
    expect(Math.abs(run.drift)).toBeLessThanOrEqual(0.4);
    expect(run.count('steer.into_wind'), 'steering into the wind is the pass').toBe(1);
    expect(run.count('steer.overcorrect'), 'and it is not the mistake').toBe(0);
  });

  it('the same correction in still air drifts the car clearly further', () => {
    const script = (t: number) => (t >= GUST_AT_S && t < GUST_AT_S + 0.5 ? 0.08 : 0);
    const withGust = drive({ assist: true, gust: true, steer: script });
    const still = drive({ assist: true, gust: false, steer: script });
    // Same input, no force: the car goes where the wheel points, and stays there.
    expect(Math.abs(still.drift)).toBeGreaterThan(1.0);
    expect(Math.abs(still.drift)).toBeGreaterThan(Math.abs(withGust.drift) * 5);
    // Which is the point: it is the gust the correction cancels, not the wheel.
    expect(withGust.count('steer.into_wind')).toBeGreaterThan(still.count('steer.into_wind'));
  });

  it('an oversized correction carries the car past centre and grades as overcorrect', () => {
    const run = drive({ assist: true, gust: true, steer: (t) => (t >= GUST_AT_S && t < GUST_AT_S + 1.2 ? 0.5 : 0) });
    expect(run.drift, 'past centre, toward the wind side').toBeGreaterThan(m.wind.GUST.bandM);
    expect(run.count('steer.overcorrect')).toBe(1);
    expect(run.count('steer.into_wind'), 'that is not the pass').toBe(0);
  });
});

describe('the push, on a gamepad (no assist)', () => {
  it('keeps full strength, and still visibly pushes', () => {
    const pad = drive({ assist: false, gust: true });
    const thumb = drive({ assist: true, gust: true });
    expect(Math.abs(pad.drift)).toBeGreaterThan(1.5);
    expect(Math.abs(pad.drift)).toBeGreaterThan(Math.abs(thumb.drift));
    // The difference is the assist's third off the push, not a different shape.
    const ratio = Math.abs(thumb.drift) / Math.abs(pad.drift);
    expect(ratio).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(1);
  });
});

describe('the 40 mph hold, on the real car', () => {
  it('pulls away from rest with no throttle, and stops at the hold', () => {
    const { vc, game } = m;
    vc.resetVehicleController();
    const body = new StubBody();
    vc.registerVehicleBody(body as never);
    game.setState({ worldMode: 'kent', phase: 'driving', throttle: 0, brake: 0, steering: 0, emergencyBrake: false });
    vc.teleportVehicle(m.bridge.start.x, m.bridge.start.y, 0);
    vc.setCruiseTargetMph(40);
    for (let i = 0; i < 60 * 30; i++) {
      vc.tickVehicle(body as never, DT);
      body.integrate(DT);
    }
    // Nobody touched a pedal: the hold drove the span.
    expect(body.pos.x).toBeGreaterThan(200);
    expect(vc.getCurrentSpeedMs() / HM).toBeGreaterThan(38);
    expect(vc.getCurrentSpeedMs() / HM).toBeLessThan(41);
    // ...and the brake still wins over it.
    game.setState({ brake: 1 });
    for (let i = 0; i < 60 * 6; i++) {
      vc.tickVehicle(body as never, DT);
      body.integrate(DT);
    }
    expect(vc.getCurrentSpeedMs()).toBeLessThan(0.5);
  });
});
describe('the cue and the force are the same event', () => {
  it('the bridge starts the push on the story wind.gust, at the assist strength', () => {
    const src = fs.readFileSync(path.join(DRIVE, 'src', 'systems', 'QuietRoadsBridge.ts'), 'utf8');
    expect(src).toMatch(/startGust\(side, \{ assist: this\.windAssistOn \}\)/);
    expect(src).toContain('buzzGust(');
    expect(src, 'the push ends with the span').toMatch(/clearGust\(\)/);
  });

  it('the warning is the arrow and the gust is the push', () => {
    const src = fs.readFileSync(path.join(DRIVE, 'src', 'systems', 'QuietRoadsBridge.ts'), 'utf8');
    const warn = src.indexOf("event === 'wind.gust.warn'");
    const gust = src.indexOf("event === 'wind.gust'");
    expect(warn, 'the warning is handled').toBeGreaterThan(-1);
    expect(gust, 'the gust is handled').toBeGreaterThan(warn);
    // The indicator stays up for the whole push, not a fixed 1.2 s.
    expect(src).toContain('GUST_TOTAL_S * 1000');
  });

  it('the car has no gust of its own: a reset clears it', () => {
    const vc = m.vc;
    vc.startGust('left', { assist: true });
    expect(vc.gustNow()).not.toBeNull();
    vc.resetVehicleController();
    expect(vc.gustNow()).toBeNull();
  });
});

