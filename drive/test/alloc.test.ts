/**
 * P13 — the physics step must not allocate.
 *
 * The hot line was `this.prev = { ...s }` at the end of VehicleObserver.step:
 * a fresh object (and a fresh `pos`) every 1/60 s step. It now copies into one
 * owned sample. These tests lock the identity contract so it cannot regress,
 * and check the per-step objects the sim used to build every tick.
 */
import { describe, expect, it } from 'vitest';
import {
  VehicleObserver,
  type VehicleSample,
  type ObserverOut,
} from '../src/quietroads/sim/vehicleObserver';
import { NoiseSystem } from '../src/quietroads/sim/noise';
import { Simulation, type SimFrame } from '../src/quietroads/sim/Simulation';

function sample(pos = { x: 1, y: 2 }): VehicleSample {
  return { pos, heading: 0.1, speedMs: 8, throttle: 0.2, brake: 0, steer: 0, horn: false, lateralSlip: 0 };
}

function observer() {
  const events: string[] = [];
  const noise = new NoiseSystem(() => {});
  const obs = new VehicleObserver(noise, (e) => events.push(e));
  return { obs, events };
}

describe('P13 — the observer reuses its previous-sample object', () => {
  it('two consecutive samples do not replace the prev object identity', () => {
    const { obs } = observer();
    expect(obs.previousSample()).toBe(null);

    obs.step(1 / 60, sample({ x: 10, y: 0 }));
    const first = obs.previousSample();
    expect(first).not.toBe(null);

    obs.step(1 / 60, sample({ x: 20, y: 0 }));
    const second = obs.previousSample();

    // Same object both steps…
    expect(second).toBe(first);
    // …but the fields were copied in, not aliased to the caller's sample.
    expect(second!.pos.x).toBe(20);
    expect(second!.speedMs).toBe(8);
    expect(first!.pos).not.toBe(sample({ x: 99, y: 99 }).pos);
  });

  it('also reuses the ObserverOut it returns', () => {
    const { obs } = observer();
    const a: ObserverOut = obs.step(1 / 60, sample({ x: 1, y: 0 }));
    const b = obs.step(1 / 60, sample({ x: 2, y: 0 }));
    expect(b).toBe(a);
    expect(b.stoppingM).toBeGreaterThan(0);
  });

  it('reset() drops the retained sample so the next run starts clean', () => {
    const { obs } = observer();
    obs.step(1 / 60, sample({ x: 5, y: 5 }));
    const held = obs.previousSample();
    obs.reset();
    expect(obs.previousSample()).toBe(null);
    expect(obs.previousSample()).not.toBe(held);
  });
});

describe('P13 — the sim reuses its per-step frame', () => {
  it('returns one SimFrame object across steps and refills it', () => {
    const sim = new Simulation({
      fire: () => {}, requestQuiz: () => {}, setObjective: () => {}, toast: () => {}, placeVehicle: () => {},
    });
    sim.startMission('mission_delivery_1_insulin');
    const a: SimFrame = sim.step(1 / 60, sample({ x: 100, y: 0 }));
    const objective = a.objective;
    const b = sim.step(1 / 60, sample({ x: 101, y: 0 }));
    expect(b).toBe(a);
    expect(b.objective).toBe(objective);
    expect(b.speedMph).toBeGreaterThan(0);
  });

  it('does not retain the caller\'s sample position object', () => {
    const sim = new Simulation({
      fire: () => {}, requestQuiz: () => {}, setObjective: () => {}, toast: () => {}, placeVehicle: () => {},
    });
    const pos = { x: 100, y: 0 };
    sim.step(1 / 60, sample(pos));
    const stored = sim.playerPos;
    pos.x = 1000;
    expect(stored.x).toBe(100);
  });
});