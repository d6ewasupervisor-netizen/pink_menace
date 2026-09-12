"use strict";

const assert = require("assert");
const { pool } = require("../src/db");
const {
  tierOf,
  applyFear,
  loudDelta,
  COLLAPSE_AT,
  AFTER_COLLAPSE,
  WRONG_NOISE_FLOOR,
  PRESENCE_FLOOR,
  publicFear,
  actRevealCopy,
  actRevealTier,
  actBoundaryReveal,
  ACT_REVEAL,
} = require("../src/presence");
const { applyDelta, withActCargo } = require("../src/game");

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
assert.strictEqual(lit.state.presence, PRESENCE_FLOOR);

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

assert.strictEqual(PRESENCE_FLOOR, 3);
const floorStay = applyFear({ presence: 3 }, {}, { correct: true });
assert.strictEqual(floorStay.state.presence, PRESENCE_FLOOR, "V-004 correct path: decay cannot drop below 3");
const floorFromFour = applyFear({ presence: 4 }, {}, { correct: true });
assert.strictEqual(floorFromFour.state.presence, PRESENCE_FLOOR);
const floorFromFive = applyFear({ presence: 5 }, {}, { correct: true });
assert.strictEqual(floorFromFive.state.presence, PRESENCE_FLOOR);
assert.strictEqual(applyFear({ presence: 0 }, {}, { correct: true }).state.presence, PRESENCE_FLOOR);
assert.strictEqual(publicFear({}).presence, PRESENCE_FLOOR);
assert.strictEqual(publicFear({ presence: 1 }).tier, 0);
assert.strictEqual(applyDelta({}, { presence: 0 }).presence, PRESENCE_FLOOR);
assert.strictEqual(withActCargo({}, "II").presence, PRESENCE_FLOOR);
assert.strictEqual(withActCargo({ presence: 12, cargo_act: "II" }, "III").presence, 12);

assert.strictEqual(actRevealTier({ presence: 3 }), 0);
assert.strictEqual(actRevealTier({ presence: 6 }), 1);
assert.strictEqual(actRevealTier({ presence: 10 }), 2);
assert.strictEqual(actRevealTier({ presence: 18 }), 3);
assert.strictEqual(actRevealTier({ presence: 3, fail_kind: "cargo" }), 3);
assert.strictEqual(actRevealTier({ presence: 3, drew: 1 }), 3);
assert.strictEqual(actRevealCopy({ presence: 3 }), ACT_REVEAL[0]);
assert.strictEqual(actRevealCopy({ presence: 18 }), ACT_REVEAL[3]);
assert.ok(!/zombie/i.test(ACT_REVEAL.join(" ")));
assert.ok(ACT_REVEAL.every((line) => /The Quiet/.test(line)));
assert.ok(ACT_REVEAL.every((line) => !/safe/i.test(line)));
assert.strictEqual(actBoundaryReveal({ act: "I" }, 0, { presence: 8 }), null);
assert.strictEqual(actBoundaryReveal({ act: "II" }, 1, { presence: 8 }), null);
assert.strictEqual(actBoundaryReveal({ act: "III" }, 0, { presence: 8 }, { recap: true }), null);
assert.strictEqual(actBoundaryReveal({ act: "IV" }, 0, { presence: 3 }), ACT_REVEAL[0]);
assert.strictEqual(actBoundaryReveal({ act: "V" }, 0, { presence: 18 }), ACT_REVEAL[3]);

console.log("ok");
pool.end();
