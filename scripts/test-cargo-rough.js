"use strict";

const assert = require("assert");
const {
  CARGO_ROUGH,
  V013_DUSK,
  cargoRoughBand,
  cargoRoughFromState,
  daylightFail,
  stampDaylightFail,
  radioChannel,
  applyV013DuskForce,
  mergeV013OverrunDelta,
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
  hook: "Dusk on schedule. His bumper fills the glass.",
  scene: "Dusk on I-90 east. You made the light — dusk on schedule.",
  dusk_force: {
    dusk_state: "overrun",
    time_of_day: "dusk",
    card_type: "hazard",
    timeout_option_id: "b",
    timeout_ms: 10000,
    cargo_rough: 6,
    hook: "Light ran out. His bumper fills the glass.",
    scene: "Dusk on I-90 east. Light ran out. You overran the daylight.",
    option_deltas: { b: { cargo_rough: 4 } },
  },
};
const scheduled = applyV013DuskForce(base, { time_cost: 20 });
assert.strictEqual(scheduled.card_type, "scene");
assert.strictEqual(scheduled.time_of_day, "dusk");
assert.strictEqual(scheduled.dusk_state, V013_DUSK.SCHEDULED);
assert.strictEqual(scheduled.dusk_forced, false);
assert.ok(/on schedule/i.test(scheduled.hook));

const forced = applyV013DuskForce(base, { time_cost: 130, yaw: 9 });
assert.strictEqual(forced.card_type, "hazard");
assert.strictEqual(forced.time_of_day, "dusk");
assert.strictEqual(forced.dusk_state, V013_DUSK.OVERRUN);
assert.strictEqual(forced.dusk_forced, true);
assert.strictEqual(forced.timeout_option_id, "b");
assert.ok(/Light ran out/i.test(forced.hook));

const schedDelta = mergeV013OverrunDelta({ time_cost: 3 }, base, { time_cost: 20 }, "a");
assert.strictEqual(schedDelta.cargo_rough || 0, 0);

const overrunA = mergeV013OverrunDelta({ time_cost: 3 }, base, { time_cost: 130 }, "a");
assert.strictEqual(overrunA.cargo_rough, 6);
assert.strictEqual(cargoRoughBand(overrunA.cargo_rough), "SCUFFED");

const overrunB = mergeV013OverrunDelta({ time_cost: 6 }, base, { time_cost: 130 }, "b");
assert.strictEqual(overrunB.cargo_rough, 10);
assert.strictEqual(cargoRoughBand(overrunB.cargo_rough), "THINNED");

console.log("cargo_rough ok");
