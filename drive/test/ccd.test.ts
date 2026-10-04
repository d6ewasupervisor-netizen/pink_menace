/**
 * P9 — CCD telemetry, no feel change.
 *
 * The car RigidBody already sets `ccd` (Vehicle.tsx). This locks the other half:
 * the named displacement threshold in quietroads/config.ts that reports a
 * contact-free step which moved further than a contact could have allowed.
 *
 * The contract these tests hold:
 *   1. the Beetle at top speed records ZERO tunnels on dry, gravel, wet and ice
 *      over a fixed step count — those laps are the baseline;
 *   2. the threshold does fire when a step really does jump (so it is not dead);
 *   3. stopping distances are untouched: no feel change came with the telemetry.
 */
import { describe, expect, it } from 'vitest';
import { Simulation, stoppingDistanceM, VEHICLE, CHASSIS_DECEL, type VehicleSample } from '../src/quietroads';
import { CCD } from '../src/quietroads/config';
import { VehicleObserver, type VehicleSample as Sample } from '../src/quietroads/sim/vehicleObserver';
import { NoiseSystem } from '../src/quietroads/sim/noise';

const MPH = 0.44704;
/** The Beetle's ceiling on the highway, from the controller's own top speed. */
const BEETLE_TOP_MS = 33;

function sample(pos: { x: number; y: number }, speedMs: number): VehicleSample {
  return { pos, heading: 0, speedMs, throttle: 1, brake: 0, steer: 0, horn: false, lateralSlip: 0 };
}

function makeSim() {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  return { sim, events };
}

describe('P9 — CCD threshold configuration', () => {
  it('is a named threshold in config, above anything the fixed step can produce', () => {
    expect(CCD.tunnelDisplacementM).toBeGreaterThan(0);
    expect(CCD.event).toBe('ccd.tunnel');
    // At 1/60 s, top speed covers well under a metre per step.
    expect(BEETLE_TOP_MS / 60).toBeLessThan(CCD.tunnelDisplacementM);
  });
});

describe('P9 — no tunnels on the baseline surfaces', () => {
  /** Run the beetle flat out on one surface for a fixed number of fixed steps. */
  function topSpeedLap(mission: Parameters<Simulation['startMission']>[0], steps: number) {
    const { sim, events } = makeSim();
    sim.startMission(mission);
    let x = 0;
    for (let i = 0; i < steps; i++) {
      // One step of travel at the top speed — the most displacement a lap can have.
      x += BEETLE_TOP_MS / 60;
      sim.step(1 / 60, sample({ x, y: 0 }, BEETLE_TOP_MS));
    }
    return events.filter((e) => e === CCD.event);
  }

  it('records zero tunnels at top speed on dry, gravel, wet and ice', () => {
    // The four surface configs the baseline names. Kent resolves dry and gravel
    // from the mission the car is on; wet is the Ledger south of solidY; ice is
    // the highway, where the controller's own top speed applies.
    const cases: [string, Parameters<Simulation['startMission']>[0]][] = [
      ['dry (Grid)', 'mission_delivery_1_insulin'],
      ['gravel (Backcountry)', 'mission_backcountry_run'],
      ['wet (Ledger)', 'mission_central_ledger'],
      ['ice (Ribbon)', 'mission_ribbon_merge'],
    ];
    const fired: Record<string, number> = {};
    for (const [label, mission] of cases) fired[label] = topSpeedLap(mission, 600).length;
    expect(fired).toEqual({ 'dry (Grid)': 0, 'gravel (Backcountry)': 0, 'wet (Ledger)': 0, 'ice (Ribbon)': 0 });
  });

  it('still reports a real jump — the check is not dead code', () => {
    const events: string[] = [];
    const obs = new VehicleObserver(new NoiseSystem(() => {}), (e) => events.push(e));
    // First step establishes the baseline position.
    obs.step(1 / 60, sample({ x: 0, y: 0 }, 10) as Sample);
    // A 4 m contact-free jump in one 1/60 s step is not something the car can do.
    obs.step(1 / 60, sample({ x: 4, y: 0 }, 10) as Sample);
    expect(events).toContain(CCD.event);
  });

  it('stays quiet on a contact-free jump that is within the threshold', () => {
    const events: string[] = [];
    const obs = new VehicleObserver(new NoiseSystem(() => {}), (e) => events.push(e));
    obs.step(1 / 60, sample({ x: 0, y: 0 }, 10) as Sample);
    obs.step(1 / 60, sample({ x: 0.5, y: 0 }, 10) as Sample);
    expect(events).not.toContain(CCD.event);
  });

  it('stands down for a step that had a contact', () => {
    const events: string[] = [];
    const obs = new VehicleObserver(new NoiseSystem(() => {}), (e) => events.push(e));
    obs.step(1 / 60, sample({ x: 0, y: 0 }, 10) as Sample);
    obs.noteContact();
    obs.step(1 / 60, sample({ x: 4, y: 0 }, 10) as Sample);
    expect(events).not.toContain(CCD.event);
  });
});

describe('P9 — the CCD telemetry changed no feel', () => {
  it('leaves every stopping distance exactly where it was', () => {
    const rows: Record<string, number> = {};
    for (const [label, mu, decel] of [
      ['beetle_dry', VEHICLE.MU.dry, CHASSIS_DECEL.beetle],
      ['beetle_gravel', VEHICLE.MU.gravel, CHASSIS_DECEL.beetle],
      ['beetle_wet', VEHICLE.MU.wet, CHASSIS_DECEL.beetle],
      ['highway_ice', VEHICLE.MU.ice, CHASSIS_DECEL.highway],
    ] as const) {
      rows[label] = Number(stoppingDistanceM(55 * MPH, mu, decel).toFixed(1));
    }
    expect(rows).toEqual({ beetle_dry: 74.7, beetle_gravel: 89.8, beetle_wet: 103.0, highway_ice: 264.4 });
  });

  it('leaves the surface friction coefficients alone', () => {
    expect(VEHICLE.MU).toEqual({ dry: 0.7, wet: 0.4, gravel: 0.5, ice: 0.15 });
  });
});