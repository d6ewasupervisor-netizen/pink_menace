/**
 * Deterministic sim bench — the headless half of the benchmark harness.
 *
 * Replays a scripted input lap through each act's mission grader on a fixed
 * 1/60 s timestep and records step count, per-step CPU cost (µs), and which
 * grade events fired, plus the stopping-distance contract. GPU metrics need the
 * `?profileDrive` browser (see bench/README.md). Writes bench/baseline.json.
 * Run: npx vitest run bench
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect, it } from 'vitest';
import { Simulation, stoppingDistanceM, VEHICLE, CHASSIS_DECEL, type VehicleSample } from '../src/quietroads';

const MPH = 0.44704;

type Row = { mission: string; act: string; steps: number; events: string[]; stepMs: { p50: number; p95: number; max: number } };

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

function sample(pos: { x: number; y: number }, heading: number, speedMs: number, steer = 0): VehicleSample {
  return { pos, heading, speedMs, throttle: 0.3, brake: 0, steer, horn: false, lateralSlip: 0 };
}

function pct(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
}

it('replays scripted laps per act and writes baseline.json', () => {
  const rows: Row[] = [];

  const run = (mission: string, act: string, stepsPer: number, drive: (sim: Simulation, i: number) => { x: number; y: number; heading: number; speed: number; steer?: number }) => {
    const { sim, events } = makeSim();
    if (!sim.startMission(mission as Parameters<Simulation['startMission']>[0])) throw new Error(`mission ${mission} did not start`);
    const times: number[] = [];
    for (let i = 0; i < stepsPer; i++) {
      const d = drive(sim, i);
      const s = process.hrtime.bigint();
      sim.step(1 / 60, sample({ x: d.x, y: d.y }, d.heading, d.speed, d.steer ?? 0));
      times.push(Number(process.hrtime.bigint() - s) / 1000); // µs
    }
    const sorted = [...times].sort((a, b) => a - b);
    rows.push({ mission, act, steps: stepsPer, events: [...new Set(events)], stepMs: { p50: +pct(sorted, 0.5).toFixed(2), p95: +pct(sorted, 0.95).toFixed(2), max: +(sorted[sorted.length - 1] ?? 0).toFixed(2) } });
  };

  run('mission_delivery_1_insulin', 'II', 1200, (_s, i) => ({ x: 190 + i * 0.1, y: -20, heading: 0, speed: 8 }));
  run('mission_central_ledger', 'III', 1200, (sim, i) => ({ x: sim.ledger.leadPos.x, y: sim.ledger.leadPos.y - 14, heading: Math.PI / 2, speed: 13 }));
  run('mission_ribbon_merge', 'V', 1200, (_s, i) => ({ x: 2710, y: 40 + i * 1.2, heading: Math.PI / 2, speed: 24, steer: 0.6 }));
  run('mission_backcountry_run', 'VI', 2000, (_s, i) => ({ x: 50 + i * 0.75, y: 640, heading: 0, speed: 18 }));

  const stop: Record<string, number> = {};
  for (const [label, mu, decel] of [
    ['beetle_dry', VEHICLE.MU.dry, CHASSIS_DECEL.beetle],
    ['highway_dry', VEHICLE.MU.dry, CHASSIS_DECEL.highway],
    ['truck_dry', VEHICLE.MU.dry, CHASSIS_DECEL.truck],
    ['beetle_gravel', VEHICLE.MU.gravel, CHASSIS_DECEL.beetle],
    ['beetle_wet', VEHICLE.MU.wet, CHASSIS_DECEL.beetle],
    ['highway_ice', VEHICLE.MU.ice, CHASSIS_DECEL.highway],
  ] as const) {
    stop[label] = Number(stoppingDistanceM(55 * MPH, mu, decel).toFixed(1));
  }

  const out = { generated_at: new Date().toISOString(), rows, stopping_distance_m_at_55mph: stop };
  writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'baseline.json'), JSON.stringify(out, null, 2));

  // Invariants so a regression fails loudly.
  expect(stop['truck_dry']).toBeGreaterThan(stop['beetle_dry']);
  expect(stop['beetle_gravel']).toBeGreaterThan(stop['beetle_dry']);
  expect(stop['highway_ice']).toBeGreaterThan(stop['truck_dry']);
  expect(rows.every((r) => r.steps > 0)).toBe(true);
});