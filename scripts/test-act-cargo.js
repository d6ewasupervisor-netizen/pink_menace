"use strict";

const assert = require("assert");
const { pool } = require("../src/db");
const { actOfCardId, withActCargo, cargoDead, cargoFrom, publicState } = require("../src/game");
const { CARGO_BUDGET } = require("../src/manifest");

assert.strictEqual(actOfCardId("II-030"), "II");
assert.strictEqual(actOfCardId("III-002"), "III");
assert.strictEqual(actOfCardId("I-001"), "I");

const stamped = withActCargo({ time_cost: 40 }, "II");
assert.strictEqual(stamped.cargo_act, "II");
assert.strictEqual(stamped.time_cost, 40);

const intoIII = withActCargo({ time_cost: 140, noise: 4, cargo_act: "II" }, "III");
assert.strictEqual(intoIII.cargo_act, "III");
assert.strictEqual(intoIII.time_cost, 0);
assert.ok(cargoFrom(intoIII) > 0);

const stuck = withActCargo({ time_cost: 140, noise: 80, light: 40 }, "III");
assert.strictEqual(stuck.time_cost, 0);
assert.ok(cargoFrom(stuck) > 0, "inherited meters must not spawn a dead Act III pack");

assert.strictEqual(cargoDead({ time_cost: 140 }, {}), false, "dossier continue must not wipe an already-empty clock");
assert.strictEqual(cargoDead({ time_cost: 140 }, { time_cost: 4 }), true);
assert.strictEqual(cargoDead({ time_cost: 4 }, { time_cost: 4 }), false);
assert.strictEqual(cargoDead({ time_cost: CARGO_BUDGET }, { fatal: true }), true);
assert.strictEqual(cargoDead({ time_cost: 130 }, { time_cost: 4 }, "V"), true, "Act V daylight_fail ends the run");
assert.strictEqual(cargoDead({ time_cost: 130 }, {}, "V"), false, "Act V dossier continue does not fire daylight_fail");
assert.strictEqual(cargoDead({ time_cost: CARGO_BUDGET }, { fatal: true }, "V"), true);

const live = publicState(intoIII);
assert.ok(live.cold > 0);
assert.ok(!(live.cold <= 0 && live.warming <= 0));
assert.strictEqual(publicState({ time_cost: 20 }).daylight_fail, false);
assert.strictEqual(publicState({ time_cost: 130 }).daylight_fail, true);

console.log("ok");
pool.end();
