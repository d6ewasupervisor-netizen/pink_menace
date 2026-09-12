"use strict";

const assert = require("assert");
const {
  CARGO_ROUGH,
  V013_DUSK,
  V013_CLAUSE,
  cargoRoughBand,
  cargoRoughFromState,
  daylightFail,
  stampDaylightFail,
  radioChannel,
  applyV013DuskForce,
} = require("../src/cargo-rough");

assert.strictEqual(CARGO_ROUGH.CLEAN_MAX, 3);
assert.strictEqual(CARGO_ROUGH.SCUFFED_MAX, 8);

assert.strictEqual(cargoRoughBand(0), "CLEAN");
assert.strictEqual(cargoRoughBand(3), "CLEAN");
assert.strictEqual(cargoRoughBand(4), "SCUFFED");
assert.strictEqual(cargoRoughBand(8), "SCUFFED");
assert.strictEqual(cargoRoughBand(9), "THINNED");
assert.strictEqual(cargoRoughBand(23), "THINNED");

assert.strictEqual(cargoRoughFromState({ yaw: 4 }), 4);
assert.strictEqual(cargoRoughFromState({ cargo_rough: 9, yaw: 1 }), 9);

assert.strictEqual(daylightFail({ time_cost: 129 }), false);
assert.strictEqual(daylightFail({ time_cost: 130 }), true);
assert.strictEqual(stampDaylightFail({ time_cost: 130 }).daylight_fail, true);
assert.strictEqual(radioChannel({ yaw: 9, time_cost: 20 }), "THINNED");
assert.strictEqual(radioChannel({ yaw: 9, time_cost: 130 }), "THINNED");
assert.strictEqual(radioChannel({ yaw: 1, time_cost: 130 }), "CLEAN");

const base = {
  card_id: "V-013",
  card_type: "scene",
  time_of_day: "dusk",
  hook: "His bumper is in the glass. Again.",
  decision: "Hollis is on your tail in the center. The right is empty. What do you do?",
  debrief: "Watch the glass for tailgaters and move to another lane so they can pass.",
  scene: "Dusk on I-90 east. " + V013_CLAUSE.scheduled + " Three lanes.",
  dusk_states: {
    scheduled: { clause: V013_CLAUSE.scheduled },
    overrun: { clause: V013_CLAUSE.overrun },
  },
};

const scheduled = applyV013DuskForce(base, { time_cost: 20 });
assert.strictEqual(scheduled.card_type, "scene");
assert.strictEqual(scheduled.dusk_state, V013_DUSK.SCHEDULED);
assert.ok(scheduled.scene.includes(V013_CLAUSE.scheduled));
assert.ok(!scheduled.scene.includes("not where you meant to be"));
assert.strictEqual(scheduled.hook, base.hook);
assert.strictEqual(scheduled.decision, base.decision);

const forced = applyV013DuskForce(base, { time_cost: 130, yaw: 9 });
assert.strictEqual(forced.card_type, "scene");
assert.strictEqual(forced.dusk_state, V013_DUSK.OVERRUN);
assert.ok(forced.scene.includes(V013_CLAUSE.overrun));
assert.ok(!forced.scene.includes(V013_CLAUSE.scheduled));
assert.strictEqual(forced.hook, base.hook);
assert.strictEqual(forced.decision, base.decision);
assert.strictEqual(forced.debrief, base.debrief);

console.log("cargo_rough ok");
