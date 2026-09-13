"use strict";

const assert = require("assert");
const { actEntryLocked, ACT_ZONES, isBeatCard } = require("../src/game");

const ever = new Set(["II-001", "II-002"]);
const acts = {
  I: [{ card_id: "I-005" }, { card_id: "I-006" }],
  II: [{ card_id: "II-001" }, { card_id: "II-002" }, { card_id: "II-003" }],
  III: [{ card_id: "III-001" }],
};

assert.strictEqual(actEntryLocked("I", acts, ever), false, "Act I is enterable");
assert.strictEqual(actEntryLocked("II", acts, ever), false, "a live Grid run stays entered");
assert.strictEqual(actEntryLocked("III", acts, ever), true, "III waits on II");

const fresh = new Set();
assert.strictEqual(actEntryLocked("I", acts, fresh), false);
assert.strictEqual(actEntryLocked("II", acts, fresh), true, "II waits on Act I");
assert.strictEqual(actEntryLocked("III", acts, fresh), true);

const doneI = new Set(["I-005", "I-006"]);
assert.strictEqual(actEntryLocked("II", acts, doneI), false, "II opens when Act I is done");

const withIV = { ...acts, IV: [{ card_id: "IV-002" }, { card_id: "IV-003" }] };
assert.strictEqual(actEntryLocked("IV", withIV, fresh), false, "IV is playable without I–III");
assert.strictEqual(actEntryLocked("IV", withIV, ever), false, "IV stays enterable mid-Grid");
assert.strictEqual(actEntryLocked("V", { ...withIV, V: [{ card_id: "V-001" }] }, fresh), false, "V is playable without I–IV");

assert.strictEqual(isBeatCard("beat"), true);
assert.strictEqual(isBeatCard("hazard"), false);
assert.ok(ACT_ZONES[0].act === "I");

console.log("act gate ok");
