import assert from "node:assert/strict";
import { Simulation } from "../src/quietroads/sim/Simulation";
import { buildKentMap } from "../src/quietroads/sim/kentMap";
import { PharmacyDropoff } from "../src/quietroads/sim/pharmacy";

const events: string[] = [];
const placed: { x: number; y: number }[] = [];
const sim = new Simulation({
  fire: (e) => { events.push(e); },
  requestQuiz: () => {},
  setObjective: () => {},
  toast: () => {},
  placeVehicle: (p) => { placed.push({ x: p.x, y: p.y }); },
});

assert.equal(sim.startMission("mission_delivery_1_insulin"), true);
assert.equal(sim.missionId, "mission_delivery_1_insulin");
assert.equal(sim.mode, "vehicle");
assert.deepEqual(sim.navTarget(), { pos: sim.map.markers.pharmacy, label: "PHARMACY" });
const last = placed[placed.length - 1];
assert.ok(last);
assert.ok(Math.abs(last.x - sim.map.starts.warehouse.pos.x) < 0.01);

const map = buildKentMap();
assert.ok(map.buildings.some((b) => b.label === "PHARMACY"));
assert.ok(map.buildings.some((b) => b.label === "WAREHOUSE"));
assert.ok(map.roads.some((r) => r.name === "MEEKER ST" && r.rect.x <= 146));
assert.ok(map.zones.some((z) => z.kind === "waypoint" && z.id === "pharmacy"));
assert.ok(map.markers.clipboard);

sim.onEvent("waypoint.reach:titus_fourway");
sim.onEvent("waypoint.reach:willis_uncontrolled");
assert.ok(events.includes("intersection.fourway.approach"));
assert.ok(events.includes("intersection.uncontrolled.approach"));

assert.equal(sim.startMission("dropoff_pharmacy"), true);
assert.equal(sim.mode, "walker");
assert.deepEqual(sim.navTarget(), { pos: sim.map.markers.clipboard, label: "CLIPBOARD" });

const drop = new PharmacyDropoff();
const fired: string[] = [];
drop.reset({ x: 161, y: 101 }, Math.PI);
drop.step(0.2, { x: 0, y: -1, run: false }, () => false, { x: 161, y: 97.2 }, { fire: (e) => fired.push(e) });
assert.ok(fired.includes("door.close.soft"));
for (let i = 0; i < 40 && !drop.done; i++) {
  drop.step(0.2, { x: 0, y: -1, run: false }, () => false, { x: 161, y: 97.2 }, { fire: (e) => fired.push(e) });
}
assert.ok(drop.done);
assert.ok(fired.includes("delivery.complete"));

assert.equal(sim.startMission("mission_dol_drive"), true);
assert.equal(sim.navTarget()?.label, "DOL");

console.log("pharmacy mission ok");
