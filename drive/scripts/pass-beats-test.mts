import assert from "node:assert/strict";
import { ChainupRun } from "../src/quietroads/sim/chainup";
import { BeatRun } from "../src/quietroads/sim/beats";
import { RuralRun } from "../src/quietroads/sim/rural";
import { buildKentMap } from "../src/quietroads/sim/kentMap";
import type { VehicleSample } from "../src/quietroads/sim/vehicleObserver";

function car(x: number, y: number, speedMs = 0, brake = 0, throttle = 0, steer = 0): VehicleSample {
  return { pos: { x, y }, heading: 0, speedMs, throttle, brake, steer, horn: false };
}

const map = buildKentMap(1);
const chainEvents: string[] = [];
const chain = new ChainupRun({ x: 276, y: 368, w: 18, h: 12 }, { fire: (e) => chainEvents.push(e) });
chain.reset();
const tighten = car(285, 374, 0, 0.4);
for (let i = 0; i < 40; i++) chain.step(0.1, tighten);
assert.ok(chainEvents.includes("chainup.qte.success"), chainEvents.join(","));

chainEvents.length = 0;
chain.reset();
chain.step(0.1, car(285, 374, 0, 0, 0.9));
assert.ok(chainEvents.includes("chainup.qte.drop"));

const beatEvents: string[] = [];
const beats = new BeatRun(
  { x: 70, y: 432, w: 16, h: 12 },
  map.markers.rest_area,
  { mid: map.markers.bridge_mid, end: map.markers.bridge_end },
  { fire: (e) => beatEvents.push(e) },
);
beats.reset("straight_night_drive");
const night = car(map.markers.rest_area.x, map.markers.rest_area.y, 12);
for (let i = 0; i < 30; i++) beats.step(0.1, night);
assert.ok(beatEvents.includes("night.fall"));
assert.ok(beatEvents.includes("headlight.highbeam.on"));
assert.ok(beatEvents.includes("waypoint.reach:rest_area"), beatEvents.join(","));

beatEvents.length = 0;
beats.reset("rest_area_pullin");
const parked = car(78, 438, 0, 0.5);
for (let i = 0; i < 20; i++) beats.step(0.1, parked);
assert.ok(beatEvents.includes("park.clean"), beatEvents.join(","));

beatEvents.length = 0;
beats.reset("vantage_bridge_crossing");
const gust = car(map.markers.bridge_mid.x, map.markers.bridge_mid.y, 10, 0, 0.3, 0.25);
for (let i = 0; i < 20; i++) beats.step(0.1, gust);
assert.ok(beatEvents.includes("steer.into_wind"), beatEvents.join(","));
assert.ok(beatEvents.includes("waypoint.reach:bridge_mid"));

beatEvents.length = 0;
beats.reset("bridge_engine_off_wait");
const still = car(map.markers.bridge_end.x, map.markers.bridge_end.y, 0, 0.1);
for (let i = 0; i < 160; i++) beats.step(0.1, still);
assert.ok(beatEvents.includes("bridge.wait:15"), beatEvents.join(","));
assert.ok(beatEvents.includes("waypoint.reach:bridge_end"));

const ruralEvents: string[] = [];
const rural = new RuralRun(map.rural, { fire: (e) => ruralEvents.push(e) });
rural.reset();
const circle = map.rural.roundabout;
rural.step(0.1, car(circle.x - circle.r - 2, circle.y, 2));
assert.ok(ruralEvents.includes("roundabout.yield"), ruralEvents.join(","));

console.log("pass beats ok");
