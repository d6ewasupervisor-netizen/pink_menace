"use strict";

const assert = require("assert");
const {
  CARGO_ROUGH,
  cargoRoughBand,
  cargoRoughFromState,
  daylightFail,
  radioChannel,
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
assert.strictEqual(radioChannel({ yaw: 9, time_cost: 20 }), "THINNED");
assert.strictEqual(radioChannel({ yaw: 9, time_cost: 130 }), "daylight_fail");

console.log("cargo_rough ok");
