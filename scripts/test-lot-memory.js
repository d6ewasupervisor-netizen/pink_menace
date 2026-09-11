"use strict";

const assert = require("assert");
const { lotKeyFromOption, applyLotVoice, publicState } = require("../src/game");
const { checkSpoken } = require("./validate-spoken");

const open = require("../cards/II-001.json");
const marisol = require("../cards/II-005.json");
const windowA = require("../cards/II-011.json");
const windowB = require("../cards/II-025.json");
const deac = require("../cards/III-001.json");
const momI = require("../cards/I-011.json");

assert.strictEqual(lotKeyFromOption("a", false), "called");
assert.strictEqual(lotKeyFromOption("b", true), "correct");
assert.strictEqual(lotKeyFromOption("c", false), "slow");
assert.strictEqual(lotKeyFromOption("d", false), "slow");
assert.strictEqual(lotKeyFromOption("b", false), "correct");

function asksDriving(text) {
  return /how the driving is going/i.test(
    String(text || "").replace(/does(?: not|n't) ask how the driving is going/gi, "")
  );
}
for (const card of [momI, windowA, windowB]) {
  assert.ok(!asksDriving(card.scene), card.card_id + " asks how the driving is going");
  for (const key of ["called", "correct", "slow"]) {
    const scene = card.lot_voice && card.lot_voice[key] && card.lot_voice[key].scene;
    if (scene) assert.ok(!asksDriving(scene), card.card_id + " " + key + " asks how the driving is going");
  }
}
assert.ok(/does not ask how the driving is going/i.test(windowB.scene));

function clone(card) {
  return JSON.parse(JSON.stringify(card));
}

const calledOpen = applyLotVoice(clone(open), "called");
assert.ok(calledOpen.scene.endsWith("You have not used your voice since the lot."));
assert.ok(!calledOpen.bark, "opening card does not grade her on a bark");

const correctOpen = applyLotVoice(clone(open), "correct");
assert.ok(
  correctOpen.scene.endsWith(
    "You did everything right in that lot and it did not matter, and that is a thing you are still carrying."
  )
);

const slowOpen = applyLotVoice(clone(open), "slow");
assert.ok(slowOpen.scene.endsWith("You were not loud in that lot. You were slow, and slow cost the same."));

const calledMarisol = applyLotVoice(clone(marisol), "called");
assert.ok(/someone shouting in a lot the other day/.test(calledMarisol.scene));
assert.ok(/do not correct her/.test(calledMarisol.scene));

const correctMarisol = applyLotVoice(clone(marisol), "correct");
assert.strictEqual(correctMarisol.scene, marisol.scene, "correct has no Marisol line");

const slowMarisol = applyLotVoice(clone(marisol), "slow");
assert.ok(/later than she expected/.test(slowMarisol.scene));

const calledDeac = applyLotVoice(clone(deac), "called");
assert.strictEqual(calledDeac.ride_along[0], "You're quiet. That's new, or it isn't. Either way, keep it.");
assert.strictEqual(calledDeac.ride_along[1], deac.ride_along[0]);
assert.strictEqual(calledDeac.ride_along.length, deac.ride_along.length + 1);
assert.strictEqual(calledDeac.ride_beats.length, deac.ride_beats.length + 1);
assert.strictEqual(calledDeac.ride_beats[0].tap, "anywhere");
assert.strictEqual(calledDeac.ride_beats[1].tap, deac.ride_beats[0].tap);

const correctDeac = applyLotVoice(clone(deac), "correct");
assert.strictEqual(correctDeac.ride_along[0], "You check things. I noticed that before I noticed anything else.");

const slowDeac = applyLotVoice(clone(deac), "slow");
assert.strictEqual(
  slowDeac.ride_along[0],
  "You're careful. Careful and slow aren't the same animal. We'll work on the difference."
);

const calledMom = applyLotVoice(clone(windowA), "called");
assert.ok(/She says somebody said it got loud out there/.test(calledMom.scene));
const correctMom = applyLotVoice(clone(windowA), "correct");
assert.ok(/She says you sound tired/.test(correctMom.scene));
const slowMom = applyLotVoice(clone(windowA), "slow");
assert.ok(/She says you're not answering as fast as you used to/.test(slowMom.scene));

assert.ok(!windowB.lot_voice, "Window B has no lot_state line");

const pub = publicState({ lot_state: "called", noise: 1, light: 0, yaw: 0 });
assert.ok(!("lot_state" in pub), "lot_state is never shown");

for (const card of [open, marisol, windowA, windowB, deac, momI]) {
  assert.deepStrictEqual(checkSpoken(card), [], card.card_id + " spoken");
}

console.log("lot memory ok");
