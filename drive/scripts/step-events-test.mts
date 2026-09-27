import assert from 'node:assert/strict';
import { StepEventQueue } from '../src/systems/StepEventQueue';

const queue = new StepEventQueue<string>();
const seen: string[] = [];
const deliver = (event: string) => {
  seen.push(event);
  if (event === 'first') queue.dispatch('nested', deliver);
};
queue.dispatch('outside', deliver);
assert.deepEqual(seen, ['outside']);
queue.dispatch('first', deliver);
assert.deepEqual(seen, ['outside', 'first', 'nested'], 'outside-step nested events must drain without re-entry');
seen.length = 0;
queue.begin();
queue.dispatch('first', deliver);
queue.dispatch('second', deliver);
assert.deepEqual(seen, []);
queue.end(deliver);
assert.deepEqual(seen, ['first', 'second', 'nested']);
queue.begin();
queue.dispatch('third', deliver);
queue.end(deliver);
assert.equal(seen.at(-1), 'third');
console.log('step events ok');