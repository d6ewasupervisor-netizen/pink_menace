import assert from 'node:assert/strict';
import { ZoneField, segmentCrossesRect } from '../src/quietroads/sim/zones';

const box = { x: 4, y: -1, w: 2, h: 2 };
assert.equal(segmentCrossesRect({ x: 0, y: 0 }, { x: 10, y: 0 }, box), true);
assert.equal(segmentCrossesRect({ x: 0, y: 2 }, { x: 10, y: 2 }, box), false);
assert.equal(segmentCrossesRect({ x: 10, y: 0 }, { x: 0, y: 0 }, box), true);
assert.equal(segmentCrossesRect({ x: 0, y: 1 }, { x: 10, y: 1 }, box), true);

const events: Array<{ name: string; stop?: string; minMph?: number }> = [];
const zone = new ZoneField([
  { kind: 'waypoint', id: 'first', rect: box },
  { kind: 'stop', id: 'stop', rect: { x: 12, y: -1, w: 2, h: 2 } },
], {
  fire: (name, data) => events.push({ name, stop: data?.stop as string | undefined, minMph: data?.min_mph as number | undefined }),
  requestQuiz: () => {},
  setSpeedLimit: () => {},
});
zone.step(1 / 60, { x: 0, y: 0 }, 12);
zone.step(1 / 60, { x: 10, y: 0 }, 12);
zone.step(1 / 60, { x: 0, y: 0 }, 12);
assert.equal(events.filter((e) => e.name === 'waypoint.reach:first').length, 1);
zone.step(1 / 60, { x: 15, y: 0 }, 12);
assert.equal(events.at(-1)?.name, 'stop.rolled');
assert.equal(Number.isFinite(events.at(-1)?.minMph), true);
assert.equal(events.at(-1)?.minMph, Math.round(12 / 0.44704));
zone.step(1 / 60, { x: 13, y: 0 }, 0);
for (let i = 0; i < 30; i++) zone.step(1 / 60, { x: 13, y: 0 }, 0);
zone.step(1 / 60, { x: 15, y: 0 }, 0);
assert.equal(events.at(-1)?.name, 'stop.full');

zone.reset();
events.length = 0;
zone.step(1 / 60, { x: 0, y: 0 }, 0);
zone.step(1 / 60, { x: 100, y: 0 }, 0);
assert.equal(events.length, 0, 'teleport must not sweep through zones');
zone.place({ x: 13, y: 0 });
zone.step(1 / 60, { x: 13, y: 0 }, 0);
assert.equal(events.length, 0, 'placing inside a stop zone must not invent an approach');
console.log('zones ok');