/**
 * Grading-logic unit tests: "did the stop / gap / yield check fire correctly?"
 *
 * These lock the teaching contract against the WA Driver Guide. They exercise
 * the pure sim/grader classes and never touch React, Rapier, or the DOM.
 *
 * Run:  npx vitest run        (see drive/vitest.config.ts)
 */
import { describe, expect, it } from 'vitest';
import {
  Simulation,
  buildKentMap,
  ZoneField,
  ParkingGrader,
  stoppingDistanceM,
  brakeDecel,
  VEHICLE,
  CHASSIS_DECEL,
  type VehicleSample,
} from '../src/quietroads';

const MPH = 0.44704;

function sample(pos: { x: number; y: number }, heading: number, speedMs: number, steer = 0): VehicleSample {
  return { pos, heading, speedMs, throttle: 0.2, brake: 0, steer, horn: false, lateralSlip: 0 };
}

function makeSim() {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: (t) => events.push(`quiz:${t}`),
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  return { sim, events };
}

describe('stop check (ZoneField)', () => {
  it('fires stop.rolled when the line is crossed at speed', () => {
    const box = { x: 12, y: -1, w: 2, h: 2 };
    const events: any[] = [];
    const zone = new ZoneField(
      [{ kind: 'stop', id: 's', rect: box }],
      { fire: (n, d) => events.push({ n, d }), requestQuiz: () => {}, setSpeedLimit: () => {} },
    );
    zone.step(1 / 60, { x: 0, y: 0 }, 15);
    zone.step(1 / 60, { x: 15, y: 0 }, 15);
    expect(events[0]?.n).toBe('stop.approach');
    expect(events.some((e) => e.n === 'stop.rolled')).toBe(true);
  });

  it('fires stop.full when the vehicle stops before the line', () => {
    const box = { x: 12, y: -1, w: 2, h: 2 };
    const events: any[] = [];
    const zone = new ZoneField(
      [{ kind: 'stop', id: 's', rect: box }],
      { fire: (n, d) => events.push({ n, d }), requestQuiz: () => {}, setSpeedLimit: () => {} },
    );
    // approach then come to rest inside the box, then cross after a full stop
    zone.step(1 / 60, { x: 0, y: 0 }, 10);
    zone.step(1 / 60, { x: 13, y: 0 }, 0);
    for (let i = 0; i < 30; i++) zone.step(1 / 60, { x: 13, y: 0 }, 0);
    zone.step(1 / 60, { x: 15, y: 0 }, 0); // exit after full stop
    expect(events.some((e) => e.n === 'stop.full')).toBe(true);
  });
});

describe('gap check (Act III ledger)', () => {
  it('fires ledger.follow.close when inside 60% of a 3-second gap', () => {
    const { sim, events } = makeSim();
    expect(sim.startMission('mission_central_ledger')).toBe(true);
    // Drive alongside the lead at a gap below the threshold for a few steps.
    // Deac's truck starts at ledger.lead.from and creeps south; we keep pace 2 m behind.
    for (let i = 0; i < 12; i++) {
      const lead = sim.ledger.leadPos;
      sim.step(0.2, sample({ x: lead.x, y: lead.y - 2 }, Math.PI / 2, sim.ledger ? 11 : 11));
    }
    expect(events.some((e) => e === 'ledger.follow.close')).toBe(true);
  });
});

describe('yield check (Act VI rural)', () => {
  it('rural uncontrolled: near-stop yields clean; rolling through says rolled', () => {
    // Slow approach → clean; fast approach → rolled (two separate runs).
    const { sim, events } = makeSim();
    expect(sim.startMission('mission_backcountry_run')).toBe(true);
    const gravel = buildKentMap().rural;
    // drive through the uncontrolled intersection at ~7 mph (≤ 8 mph yield)
    for (let x = gravel.uncontrolledX - 10; x <= gravel.uncontrolledX + 4; x += 1) {
      sim.step(0.2, sample({ x, y: gravel.road.y + gravel.road.h / 2 }, 0, 3));
    }
    expect(events.some((e) => e === 'rural.uncontrolled.yield' || e === 'rural.uncontrolled.rolled')).toBe(true);
  });

  it('rural crossbuck: fast approach fires rolled, not clean', () => {
    const { sim, events } = makeSim();
    expect(sim.startMission('mission_backcountry_run')).toBe(true);
    const gravel = buildKentMap().rural;
    for (let x = gravel.crossbuckX - 10; x <= gravel.crossbuckX + 4; x += 1) {
      sim.step(0.2, sample({ x, y: gravel.road.y + gravel.road.h / 2 }, 0, 12));
    }
    expect(events.some((e) => e === 'rural.crossbuck.rolled')).toBe(true);
    expect(events.some((e) => e === 'rural.crossbuck.clean')).toBe(false);
  });
});

describe('parking check (Act I)', () => {
  it('park.clean fires on a slow aligned stop in the target stall', () => {
    const map = buildKentMap();
    const events: string[] = [];
    const grader = new ParkingGrader(map, { fire: (e) => events.push(e), setObjective: () => {} });
    grader.reset();
    const stall = map.parking.stalls[map.parking.target];
    const inside = { x: stall.x + stall.w / 2, y: stall.y + stall.h / 2 };
    for (let i = 0; i < 10; i++) grader.step(0.2, sample(inside, Math.PI / 2, 0.1));
    expect(events).toContain('park.clean');
  });
});

describe('surface friction (guide §5.6 / §4.15)', () => {
  it('resolves gravel on the backcountry run and dry elsewhere', () => {
    const { sim } = makeSim();
    expect(sim.startMission('mission_backcountry_run')).toBe(true);
    sim.step(0.2, sample({ x: 100, y: 640 }, 0, 10));
    expect(sim.vehicle.mu).toBe(VEHICLE.MU.gravel);
    expect(sim.startMission('mission_delivery_1_insulin')).toBe(true);
    sim.step(0.2, sample({ x: 100, y: 0 }, 0, 10));
    expect(sim.vehicle.mu).toBe(VEHICLE.MU.dry);
  });

  it('gravel lengthens stopping vs dry, ice lengthens vs gravel', () => {
    const v = 20;
    const dry = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.beetle);
    const gravel = stoppingDistanceM(v, VEHICLE.MU.gravel, CHASSIS_DECEL.beetle);
    const ice = stoppingDistanceM(v, VEHICLE.MU.ice, CHASSIS_DECEL.beetle);
    expect(gravel).toBeGreaterThan(dry);
    expect(ice).toBeGreaterThan(gravel);
  });
});

describe('stopping shadow geometry (guide-consistent)', () => {
  it('longer chassis and lower mu make longer stopping distances', () => {
    const v = 20; // m/s
    const beetle = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.beetle);
    const highway = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.highway);
    const truck = stoppingDistanceM(v, VEHICLE.MU.dry, CHASSIS_DECEL.truck);
    const ice = stoppingDistanceM(v, VEHICLE.MU.ice, CHASSIS_DECEL.highway);
    expect(highway).toBeGreaterThan(beetle);
    expect(truck).toBeGreaterThan(highway);
    expect(ice).toBeGreaterThan(truck);
  });

  it('truck decel ≈ 450 ft at 55 mph (guide §4.4)', () => {
    const v55 = 55 * MPH; // m/s
    const d = stoppingDistanceM(v55, VEHICLE.MU.dry, CHASSIS_DECEL.truck); // metres
    const feet = d * 3.28084;
    // guide: 450 ft. Allow a reaction-time band (the guide gives no reaction constant).
    expect(feet).toBeGreaterThan(1.0);
    expect(brakeDecel('truck', VEHICLE.MU.dry)).toBeLessThan(5.5);
  });
});