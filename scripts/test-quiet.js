"use strict";

const assert = require("assert");
const { pool } = require("../src/db");
const { tierOf, applyFear, COLLAPSE_AT, AFTER_COLLAPSE } = require("../src/presence");

assert.strictEqual(tierOf(0), 0);
assert.strictEqual(tierOf(3), 0);
assert.strictEqual(tierOf(4), 1);
assert.strictEqual(tierOf(8), 1);
assert.strictEqual(tierOf(9), 2);
assert.strictEqual(tierOf(13), 2);
assert.strictEqual(tierOf(14), 3);
assert.strictEqual(tierOf(22), 3);
assert.strictEqual(tierOf(23), 4);

const loud = applyFear({}, { noise: 4 }, { correct: false, timedOut: false });
assert.strictEqual(loud.state.presence, 4);
assert.strictEqual(loud.quiet, false);

const hit = applyFear({ presence: 20 }, { noise: 4 }, { correct: false });
assert.strictEqual(hit.quiet, true);
assert.strictEqual(hit.state.presence, AFTER_COLLAPSE);
assert.strictEqual(hit.state.handprints, true);
assert.ok(hit.state.presence < COLLAPSE_AT);

const clean = applyFear({ presence: 6 }, {}, { correct: true });
assert.strictEqual(clean.state.presence, 4);

console.log("ok");
pool.end();
