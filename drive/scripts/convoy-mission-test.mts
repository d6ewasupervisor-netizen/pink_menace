import assert from "node:assert/strict";
import { ConvoyRun } from "../src/quietroads/sim/convoy";
import { buildKentMap } from "../src/quietroads/sim/kentMap";
import type { VehicleSample } from "../src/quietroads/sim/vehicleObserver";

const map = buildKentMap(1);
const events: string[] = [];
const run = new ConvoyRun(map.ribbon, map.markers.stall_point, map.markers.issaquah, {
  fire: (e) => events.push(e),
});

function car(x: number, y: number, speedMs: number, steer = 0, throttle = 0.4): VehicleSample {
  return { pos: { x, y }, heading: Math.PI / 2, speedMs, throttle, brake: 0, steer, horn: false };
}

run.reset("mission_convoy_issaquah");
const onRamp = car(271.5, 210, 18, 0.6);
for (let i = 0; i < 32; i++) run.step(0.1, onRamp, 0);
assert.ok(events.includes("ramp.enter"));
assert.ok(events.includes("merge.gap_open"));
assert.equal(events.filter((e) => e === "merge.gap_open").length, 1);

const lane = car(266, 210, 18, 0);
for (let i = 0; i < 60; i++) run.step(0.1, lane, 0);
assert.ok(events.includes("merge.clean"), events.join(","));
assert.ok(!events.includes("merge.slow"));
assert.ok(events.includes("follow.green"), events.join(","));

const stall = car(265, 342, 18);
for (let i = 0; i < 50; i++) run.step(0.1, stall, 0);
assert.ok(events.includes("waypoint.reach:stall_point"));
assert.ok(events.includes("speed.limit_change:70"));
assert.ok(events.includes("follow.green"));

events.length = 0;
run.reset("mission_convoy_issaquah");
run.step(0.1, onRamp, 2);
for (let i = 0; i < 30; i++) run.step(0.1, onRamp, 2);
for (let i = 0; i < 40; i++) run.step(0.1, car(266, 210, 4, 0), 2);
assert.ok(events.includes("merge.loud"), events.join(","));

events.length = 0;
run.reset("convoy_continue_solo");
for (let i = 0; i < 5; i++) run.step(0.1, car(265, 400, 10), 0);
assert.ok(events.includes("waypoint.reach:issaquah"));

events.length = 0;
run.reset("convoy_tow_jonah");
run.step(0.2, car(265, 330, 2, 0, 0.95), 0);
assert.ok(events.includes("tow.start"));
assert.ok(events.includes("tow.jerk"));

console.log("convoy missions ok");
