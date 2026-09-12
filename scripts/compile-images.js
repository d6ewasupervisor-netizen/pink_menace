"use strict";

const fs = require("fs");
const path = require("path");
const { resolveCard, assertCompileReady, CARD_JSON_RE } = require("./resolve-refs");
const { assemblePrompt } = require("./compile-prompt");
const { validateGeometry } = require("./geometry");
const { validateAuthoringSeat } = require("./authoring-seat");

const dir = path.join(__dirname, "..", "cards");
const only = process.argv.includes("--card")
  ? process.argv[process.argv.indexOf("--card") + 1]
  : null;

// Numbered cards plus named-spot stills (IV-001-brake). A silent skip here
// is the IV-006-class attach miss: compile.txt lists a plate, resolve-refs
// never sees the JSON, GenerateImage never consumes it.
let files;
if (only) {
  const direct = `${only}.json`;
  const abs = path.join(dir, direct);
  if (!fs.existsSync(abs)) {
    console.error(`COMPILE ABORT\n${only}: missing cards/${direct}`);
    process.exit(1);
  }
  files = [direct];
} else {
  files = fs.readdirSync(dir).filter((f) => CARD_JSON_RE.test(f)).sort();
}

const errors = [];
const rows = [];

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (only && raw.card_id !== only) continue;
  const seatErrs = validateAuthoringSeat(raw);
  if (seatErrs.length) {
    errors.push(...seatErrs);
    continue;
  }
  const resolved = resolveCard(raw);
  if (resolved.errors.length) {
    errors.push(...resolved.errors);
    continue;
  }
  try {
    assertCompileReady(raw);
  } catch (err) {
    errors.push(err.message);
    continue;
  }
  const geoErrs = validateGeometry(raw);
  if (geoErrs.length) {
    errors.push(...geoErrs);
    continue;
  }
  let prompt;
  try {
    prompt = assemblePrompt(raw);
  } catch (err) {
    errors.push(err.message);
    continue;
  }
  rows.push({
    card_id: raw.card_id,
    camera: raw.image_brief && raw.image_brief.camera,
    camera_is_the_lesson: Boolean(raw.image_brief && raw.image_brief.camera_is_the_lesson),
    aspect: (raw.image_brief && raw.image_brief.aspect) || "2:3",
    attachments: resolved.attachments.map((p) => path.basename(p)),
    ...(only ? { prompt } : {}),
  });
}

if (errors.length) {
  console.error("COMPILE ABORT\n" + errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(rows, null, 2));
console.log("compile-check ok", rows.length);
