import assert from "node:assert/strict";
import { buildKentMap } from "../src/quietroads/sim/kentMap";
import {
  SEGMENT_M,
  SEGMENTS_AHEAD,
  bridge,
  grade,
  gravel,
  night,
  nearCorridor,
  windowSlots,
} from "../src/quietroads/sim/corridors";

const map = buildKentMap(1);

function overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

for (const road of map.roads) {
  if (!road.strip) continue;
  assert.equal(overlap(map.bounds, road.rect), false, `${road.name} still sits on the city board`);
}

assert.ok(gravel.road.w >= 1500);
assert.ok(night.rest.x - night.start.x > 800);
assert.ok(bridge.mid.x - bridge.start.x > 500);
assert.ok(bridge.end.x - bridge.mid.x > 150);
assert.equal(map.corridors.length >= 5, true);

const start = windowSlots(gravel, gravel.start);
assert.ok(start.length >= SEGMENTS_AHEAD);
assert.equal(start[0].index, 0);
assert.ok(Math.abs(start[0].x - (gravel.road.x + SEGMENT_M / 2)) < 0.01);

const mid = windowSlots(gravel, { x: 800, y: 640 });
assert.ok(mid[0].index > start[0].index);
assert.ok(mid.some((s) => s.x > 800));

const count = Math.round(gravel.road.w / SEGMENT_M);
const end = windowSlots(gravel, { x: gravel.road.x + gravel.road.w - 5, y: 640 });
assert.equal(end[end.length - 1].index, count - 1);

assert.equal(nearCorridor(gravel, { x: 14, y: 0 }), false);
assert.equal(nearCorridor(gravel, gravel.start), true);

const onIce = windowSlots(grade, { x: 2300, y: 550 });
assert.ok(onIce.some((s) => s.ice));
const aboveIce = windowSlots(grade, { x: 2300, y: 1100 });
assert.equal(aboveIce.some((s) => s.ice), false);

console.log("continuous road ok");
