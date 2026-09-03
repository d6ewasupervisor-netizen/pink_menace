"use strict";

const assert = require("assert");
const {
  checkpointKeep,
  checkpointStartSeq,
  replayWindowAnswers,
  planFromWindow,
} = require("../src/game");
const { pool } = require("../src/db");

function ids(window) {
  return window.map((a) => a.card_id);
}

const actIII = [
  { card_id: "III-001", option_id: "a", was_correct: true, seq: 3001 },
  { card_id: "III-002", option_id: "continue", was_correct: true, seq: 3002 },
  { card_id: "III-003", option_id: "b", was_correct: true, seq: 3003 },
  { card_id: "III-004", option_id: "a", was_correct: false, seq: 3004 },
  { card_id: "III-005", option_id: "c", was_correct: true, seq: 3005 },
  { card_id: "III-006", option_id: "a", was_correct: true, seq: 3006 },
  { card_id: "III-007", option_id: "b", was_correct: false, seq: 3007 },
  { card_id: "III-008", option_id: "d", was_correct: false, seq: 3008 },
];

assert.strictEqual(checkpointKeep(0), 0);
assert.strictEqual(checkpointKeep(4), 0);
assert.strictEqual(checkpointKeep(5), 5);
assert.strictEqual(checkpointKeep(7), 5);
assert.strictEqual(checkpointKeep(8), 5);
assert.strictEqual(checkpointKeep(10), 10);

const keep = checkpointKeep(actIII.length - 1);
assert.strictEqual(keep, 5);

const window = replayWindowAnswers(actIII, keep);
assert.deepStrictEqual(ids(window), ["III-006", "III-007"], "window is this run, not catalog[5]");
assert.ok(!ids(window).includes("III-008"), "failing card is not recapped");
assert.ok(!ids(window).some((id) => id.startsWith("II-")), "must not rewind into Act II");

const plan = planFromWindow(window);
assert.strictEqual(plan[0].mode, "recap");
assert.strictEqual(plan[0].card_id, "III-006");
assert.strictEqual(plan[1].mode, "retry");
assert.strictEqual(plan[1].card_id, "III-007");

const actIIFloor = 2030;
assert.strictEqual(checkpointStartSeq(3005, actIIFloor, 5), 3005);
assert.strictEqual(
  checkpointStartSeq(0, actIIFloor, 0),
  actIIFloor,
  "keep 0 must not rewind start_seq to the start of the game"
);
assert.strictEqual(checkpointStartSeq(2005, 0, 5), 2005);

const earlyFail = actIII.slice(0, 3);
assert.deepStrictEqual(ids(replayWindowAnswers(earlyFail, checkpointKeep(2))), ["III-001", "III-002"]);
assert.deepStrictEqual(replayWindowAnswers(actIII.slice(0, 6), 5), []);

console.log("ok");
pool.end();
