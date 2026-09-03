"use strict";

const assert = require("assert");
const { pool } = require("../src/db");
const { tierOf, applyFear, loudDelta, COLLAPSE_AT, AFTER_COLLAPSE, WRONG_NOISE_FLOOR } = require("../src/presence");

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

const lit = applyFear({}, { light: 4, yaw: 3 }, { correct: false, timedOut: true });
assert.strictEqual(lit.state.presence, 0);

const hit = applyFear({ presence: 20 }, { noise: 4 }, { correct: false });
assert.strictEqual(hit.quiet, true);
assert.strictEqual(hit.state.presence, AFTER_COLLAPSE);
assert.strictEqual(hit.state.handprints, true);
assert.ok(hit.state.presence < COLLAPSE_AT);

const clean = applyFear({ presence: 6 }, {}, { correct: true });
assert.strictEqual(clean.state.presence, 4);

const litWrong = loudDelta({ light: 3, time_cost: 6 }, { correct: false });
assert.strictEqual(litWrong.noise, WRONG_NOISE_FLOOR);
assert.strictEqual(litWrong.light, 3);
const litFear = applyFear({ noise: litWrong.noise, light: litWrong.light }, litWrong, { correct: false });
assert.strictEqual(litFear.state.presence, WRONG_NOISE_FLOOR);
assert.strictEqual(litFear.state.noise, WRONG_NOISE_FLOOR);

const alreadyLoud = loudDelta({ noise: 5, yaw: 2 }, { correct: false });
assert.strictEqual(alreadyLoud.noise, 5);

const keepQuiet = loudDelta({ noise: -1, time_cost: 4 }, { correct: true });
assert.strictEqual(keepQuiet.noise, -1);
assert.deepStrictEqual(loudDelta({ light: 2 }, { dossier: true }).noise, undefined);
assert.deepStrictEqual(loudDelta({ yaw: 2 }, { timedOut: true }).noise, undefined);

console.log("ok");
pool.end();
