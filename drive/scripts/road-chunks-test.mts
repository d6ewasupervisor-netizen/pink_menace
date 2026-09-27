import assert from 'node:assert/strict';
import { CHUNK_LENGTH, initChunks, updateChunks } from '../src/systems/RoadChunkManager';

const initial = initChunks();
assert.equal(initial.length, 8);
assert.equal(updateChunks(initial, 0, 'city'), initial, 'no-op updates must retain the pool reference');

const recycled = updateChunks(initial, -CHUNK_LENGTH, 'highway');
assert.notEqual(recycled, initial);
assert.equal(initial.every((chunk) => chunk.gen === 0), true, 'recycling must not mutate existing React state');
assert.equal(recycled.filter((chunk) => chunk.gen === 1).length, 1);
assert.equal(recycled.find((chunk) => chunk.gen === 1)?.zPosition, -6 * CHUNK_LENGTH);
assert.equal(updateChunks(recycled, -CHUNK_LENGTH, 'highway'), recycled);
console.log('road chunks ok');