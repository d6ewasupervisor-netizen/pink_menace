"use strict";

const assert = require("assert");
const {
  CARGO_ROUGH,
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
  time_of_day: "afternoon",
  scene: "Overcast afternoon on I-90 east, still the valley floor.",
  dusk_force: {
    time_of_day: "dusk",
    card_type: "hazard",
    timeout_option_id: "b",
    timeout_ms: 10000,
    scene: "Dusk on I-90 east, still the valley floor. Light ran out.",
  },
};
const untouched = applyV013DuskForce(base, { time_cost: 20 });
assert.strictEqual(untouched.card_type, "scene");
assert.strictEqual(untouched.time_of_day, "afternoon");
const forced = applyV013DuskForce(base, { time_cost: 130, yaw: 9 });
assert.strictEqual(forced.card_type, "hazard");
assert.strictEqual(forced.time_of_day, "dusk");
assert.strictEqual(forced.dusk_forced, true);
assert.strictEqual(forced.timeout_option_id, "b");
assert.ok(/^Dusk/.test(forced.scene));

console.log("cargo_rough ok");
