import assert from "node:assert/strict";
import { ClimbRun } from "../src/quietroads/sim/climb";
import { EscortRun } from "../src/quietroads/sim/escort";
import type { VehicleSample } from "../src/quietroads/sim/vehicleObserver";

function car(x: number, y: number, speedMs: number, brake = 0, throttle = 0.3, steer = 0): VehicleSample {
  return { pos: { x, y }, heading: Math.PI / 2, speedMs, throttle, brake, steer, horn: false };
}

const climbEvents: string[] = [];
const climb = new ClimbRun({ x: 278, y: 320, w: 8, h: 40 }, { x: 285, y: 374 }, { fire: (e) => climbEvents.push(e) });
climb.reset();
const ice = car(282, 340, 12, 0.2, 0.3, 0.1);
for (let i = 0; i < 40; i++) climb.step(0.1, ice);
assert.ok(climbEvents.includes("ice.enter"), climbEvents.join(","));
assert.ok(climbEvents.includes("input.gentle_streak"), climbEvents.join(","));
climb.step(0.2, car(282, 340, 20, 0.8));
assert.ok(climbEvents.includes("speed.over:35"));
assert.ok(climbEvents.includes("skid.worsening"));
for (let i = 0; i < 25; i++) climb.step(0.1, car(285, 374, 4, 0.4));
assert.ok(climbEvents.includes("waypoint.reach:chainup"), climbEvents.join(","));
assert.ok(climbEvents.includes("quiet.settle"));

const escortEvents: string[] = [];
const escort = new EscortRun({ fire: (e) => escortEvents.push(e) });
escort.reset({ x: 40, y: 438 }, { x: 300, y: 438 }, { x: 300, y: 438 });
const behind = car(20, 438, 13);
for (let i = 0; i < 80; i++) escort.step(0.1, behind);
assert.ok(escortEvents.includes("follow.green.truck") || escortEvents.includes("nozone.enter:rear"), escortEvents.join(","));
escort.step(0.1, car(300, 438, 10));
assert.ok(escortEvents.includes("waypoint.reach:ritzville"), escortEvents.join(","));

console.log("climb and escort ok");
