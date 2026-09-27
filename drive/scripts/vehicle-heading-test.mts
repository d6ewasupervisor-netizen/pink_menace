import assert from 'node:assert/strict';
import { headingFromRotation } from '../src/systems/vehicleHeading';

for (const yaw of [0, 0.25, -0.75, Math.PI / 2, -Math.PI / 2, Math.PI - 0.01]) {
  const heading = headingFromRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
  assert.ok(Math.abs(heading - yaw) < 1e-10, `heading ${heading} differs from yaw ${yaw}`);
}
console.log('vehicle headings ok');