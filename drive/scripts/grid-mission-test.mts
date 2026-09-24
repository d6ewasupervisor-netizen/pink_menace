import assert from "node:assert/strict";
import { Simulation } from "../src/quietroads/sim/Simulation";
import { buildKentMap } from "../src/quietroads/sim/kentMap";
import type { VehicleSample } from "../src/quietroads/sim/vehicleObserver";

const events: string[] = [];
const sim = new Simulation({
  fire: (e) => { events.push(e); },
  requestQuiz: (t) => { events.push(`quiz:${t}`); },
  setObjective: () => {},
  toast: () => {},
  placeVehicle: () => {},
});

const map = buildKentMap();
assert.ok(map.buildings.some((b) => b.label === "SANCTUARY"));
assert.ok(map.buildings.some((b) => b.label === "RADIO"));
assert.ok(map.roads.some((r) => r.name === "BEA ALLEY"));
assert.ok(map.zones.some((z) => z.id === "priya_radio_shack"));
assert.ok(map.zones.some((z) => z.id === "warehouse"));
assert.ok(map.markers.bea_door && map.markers.priya && map.markers.tuna);

function sample(pos: { x: number; y: number }, heading: number, speedMs: number, steer = 0): VehicleSample {
  return { pos, heading, speedMs, throttle: 0.2, brake: 0, steer, horn: false, lateralSlip: 0 };
}

assert.equal(sim.startMission("mission_delivery_2_catfood"), true);
assert.equal(sim.navTarget()?.label, "BEA");
const stall = map.grid.beaStall;
const inStall = { x: stall.x + stall.w / 2, y: stall.y + stall.h / 2 };
for (let i = 0; i < 8; i++) sim.step(0.2, sample(inStall, Math.PI / 2, -0.8));
for (let i = 0; i < 8; i++) sim.step(0.2, sample(inStall, Math.PI / 2, 0));
assert.ok(events.includes("backing.start"));
assert.equal(sim.mode, "walker");
assert.equal(sim.navTarget()?.label, "DOOR");
assert.ok(events.includes("dropoff.walk"));

assert.equal(sim.startMission("mission_delivery_3_radio"), true);
assert.equal(sim.navTarget()?.label, "PRIYA");
const west = { x: 261.6, y: 30 };
const east = { x: 268.4, y: 30 };
for (let i = 0; i < 6; i++) sim.step(0.2, sample(west, Math.PI / 2, 4, 0.6));
sim.step(0.2, sample(east, Math.PI / 2, 4, 0.6));
assert.ok(events.includes("lanechange.start"));
assert.ok(events.includes("lanechange.clean") || events.includes("lanechange.no_signal"));

assert.equal(sim.startMission("mission_delivery_4_filters"), true);
assert.equal(sim.navTarget()?.label, "TUNA");
const tuna = { x: map.grid.tunaStall.x + 3, y: map.grid.tunaStall.y + map.grid.tunaStall.h / 2 };
for (let i = 0; i < 4; i++) sim.step(0.2, sample({ x: tuna.x + 4, y: tuna.y }, Math.PI, 1.2));
for (let i = 0; i < 6; i++) sim.step(0.2, sample(tuna, Math.PI, -0.6));
for (let i = 0; i < 8; i++) sim.step(0.2, sample(tuna, Math.PI, 0));
assert.ok(events.includes("park.parallel.start"));
assert.ok(events.includes("park.parallel.clean"));

assert.equal(sim.startMission("mission_jonah_intersection"), true);
assert.equal(sim.navTarget()?.label, "WAREHOUSE");
sim.onEvent("waypoint.reach:titus_fourway");
assert.ok(events.includes("jonah.blowthrough"));
for (let i = 0; i < 20; i++) sim.step(0.2, sample({ x: 200, y: 40 }, 0, 3));
assert.ok(events.includes("quiet.settle"));

assert.equal(sim.startMission("mission_delivery_1_insulin"), true);
assert.equal(sim.navTarget()?.label, "PHARMACY");

console.log("grid missions ok");
