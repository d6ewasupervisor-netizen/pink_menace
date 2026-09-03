"use strict";

const assert = require("assert");
const { isWatchCard, quizableAnswer } = require("../src/game");

assert.strictEqual(isWatchCard("dossier"), true);
assert.strictEqual(isWatchCard("ride-along"), true);
assert.strictEqual(isWatchCard("scene"), false);
assert.ok(!quizableAnswer({ card_id: "III-001", card_type: "ride-along", was_correct: true }));
assert.ok(!quizableAnswer({ card_id: "III-001", card_type: "dossier", was_correct: true }));
assert.ok(quizableAnswer({ card_id: "III-003", card_type: "scene", was_correct: true }));
const card = require("../cards/III-001.json");
assert.strictEqual(card.card_type, "ride-along");
assert.strictEqual(card.ride_along.length, 12);
assert.strictEqual(card.ride_beats.length, 12);
assert.strictEqual(card.ride_beats[0].tap, "sweep");
assert.strictEqual(card.ride_beats[11].tap, "wheel");
assert.strictEqual(card.ride_beats[5].still, "horn");
assert.strictEqual(
  card.ride_along[0],
  "Left mirror. Right mirror. Left again. Every time. That's the sweep. The Ledger has rooms you cannot see."
);
assert.ok(!/center/i.test(card.ride_along.join(" ")));
assert.strictEqual(card.ride_along[11], "Your wheel.");
assert.ok(!card.options);
const { checkSpoken, checkRideAlongPack } = require("./validate-spoken");
assert.deepStrictEqual(checkSpoken(card), []);
assert.deepStrictEqual(checkRideAlongPack(), []);
console.log("ok");
