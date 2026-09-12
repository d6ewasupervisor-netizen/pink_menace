"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  resolveCard,
  assertCompileReady,
  CARD_JSON_RE,
} = require("./resolve-refs");
const {
  assemblePrompt,
  YUNA_STYLE,
  ENCORE_FOOTWELL_CLAUSE,
  SWITCHGEAR_POSITIVE,
} = require("./compile-prompt");

const ROOT = path.join(__dirname, "..");
const brake = JSON.parse(
  fs.readFileSync(path.join(ROOT, "cards", "IV-001-brake.json"), "utf8")
);

assert.ok(CARD_JSON_RE.test("IV-001-brake.json"), "named-spot JSON must be in the compile scan");
assert.ok(CARD_JSON_RE.test("IV-006.json"), "numbered cards stay in the compile scan");
assert.ok(!CARD_JSON_RE.test("ACT_II_FOR_AUDIT.json"), "audit dumps stay out");
assert.ok(!CARD_JSON_RE.test("art-review-state.json"), "board state stays out");

const resolved = resolveCard(brake);
assert.deepStrictEqual(resolved.errors, [], resolved.errors.join("\n"));
assert.ok(resolved.tokens.includes("encore_footwell"), "continuity must name encore_footwell");
const names = resolved.attachments.map((p) => path.basename(p));
assert.ok(
  names.includes("ref_encore_footwell.png"),
  "IV-001-brake must attach the two-pedal footwell plate, got: " + names.join(", ")
);
assert.ok(
  names.includes("ref_encore_cockpit.png"),
  "IV-001-brake must attach the cockpit plate for cabin language, got: " + names.join(", ")
);
assertCompileReady(brake);

const prompt = assemblePrompt(brake);
assert.ok(prompt.startsWith(YUNA_STYLE), "Yuna compiles use silver-white, not Ali cranberry");
assert.ok(prompt.includes(ENCORE_FOOTWELL_CLAUSE), "prompt must consume the attached footwell lock");
assert.ok(prompt.includes("EXACTLY TWO pedals"), "positive two-pedal rule");
assert.ok(prompt.includes(SWITCHGEAR_POSITIVE), "switch covers are a positive grade, not only a ban");
assert.ok(/faded oxidized plastic/.test(prompt), "switch-cover hue is named");

const run = spawnSync("node", ["scripts/compile-images.js", "--card", "IV-001-brake"], {
  cwd: ROOT,
  encoding: "utf8",
});
assert.strictEqual(run.status, 0, run.stderr || run.stdout);
const jsonEnd = run.stdout.indexOf("\n]\n");
assert.ok(jsonEnd !== -1, "compile-images --card IV-001-brake must emit a row");
const rows = JSON.parse(run.stdout.slice(0, jsonEnd + 2));
assert.strictEqual(rows.length, 1);
assert.strictEqual(rows[0].card_id, "IV-001-brake");
assert.ok(
  rows[0].attachments.includes("ref_encore_footwell.png"),
  "official compile row must list ref_encore_footwell.png (not a /tmp copy)"
);
assert.ok(rows[0].attachments.includes("ref_encore_cockpit.png"));

const orphan = JSON.parse(JSON.stringify(brake));
orphan.image_brief.continuity = ["encore_cockpit", "encore_footwell", "not_a_lock"];
const bad = resolveCard(orphan);
assert.ok(
  bad.errors.some((e) => /not_a_lock/.test(e)),
  "unknown continuity tokens must abort, not silently skip"
);

console.log("test-encore-footwell-attach ok");
