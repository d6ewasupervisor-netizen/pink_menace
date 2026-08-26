"use strict";

const fs = require("fs");
const path = require("path");
const { resolveCard, assertCompileReady } = require("./resolve-refs");
const { assemblePrompt } = require("./compile-prompt");
const { validateGeometry } = require("./geometry");

const dir = path.join(__dirname, "..", "cards");
const only = process.argv.includes("--card")
  ? process.argv[process.argv.indexOf("--card") + 1]
  : null;

const files = fs
  .readdirSync(dir)
  .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
  .sort();

const errors = [];
const rows = [];

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (only && raw.card_id !== only) continue;
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
    aspect: (raw.image_brief && raw.image_brief.aspect) || "3:4",
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
