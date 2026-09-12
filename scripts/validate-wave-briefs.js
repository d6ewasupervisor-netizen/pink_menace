"use strict";

/**
 * Wave briefs list card IDs only. Frame description comes from card JSON.
 * See pack/39_WAVE_BRIEFS.md.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const WAVE_FILE_RE =
  /(?:^|\/)(?:WAVE_BRIEF[^/]*|.*wave-brief.*|.*wave_brief.*|.*stills-batch.*|.*parallel-stills.*|WAVE(?!_?ONE_MAP)[^/]*)\.md$/i;

const BRIEF_DUMP_RE =
  /^\s{0,3}(?:[-*]|\d+\.)?\s*\*?(?:subject|foreground|midground|background|camera_pose|extra_negatives)\*?\s*:/im;

const READ_DUMP_RE = /^\s{0,3}(?:[-*]|\d+\.)?\s*\*?(?:the read|read)\*?\s*:/im;

const FROM_THE_BRIEF_RE =
  /(?:subject|foreground|midground|background|camera pose|the read) from the brief/i;

const BRIEF_LINES_RE = /brief lines followed/i;

const JSON_BRIEF_RE = /"image_brief"\s*:\s*\{/;

const CARD_ITEM_RE =
  /^\s{0,3}(?:[-*]|\d+\.)\s+`?(?:cards\/)?((?:I|II|III|IV|V|VI|VII)-\d{3}(?:-[a-z][a-z0-9-]*)?)(?:\.json)?`?\s*$/i;

const ALLOWED_LINE_RE =
  /^\s*$|^#{1,6}\s|^---\s*$|^```|^>|^[-*]\s+(?:I|II|III|IV|V|VI|VII)-\d{3}|card JSON is the sole brief authority|lists card IDs only|image_brief.*card JSON|frame description.*card JSON|wave briefs list card IDs|do not seed|no art|no regen|stale parallel/i;

function isWaveBriefPath(relPath) {
  const norm = String(relPath || "").replace(/\\/g, "/");
  if (/\/pack\/39_WAVE_BRIEFS\.md$/i.test(norm) || /^pack\/39_WAVE_BRIEFS\.md$/i.test(norm)) {
    return false;
  }
  if (/_MAP\.md$/i.test(norm)) return false;
  return WAVE_FILE_RE.test(norm);
}

function lintWaveBriefMarkdown(text, opts) {
  const errors = [];
  const src = String(text || "");
  const strict = Boolean(opts && opts.strictIdsOnly);

  if (BRIEF_DUMP_RE.test(src)) {
    errors.push("wave brief dumps image_brief fields (subject/foreground/midground/background) — card JSON is sole authority");
  }
  if (READ_DUMP_RE.test(src)) {
    errors.push("wave brief dumps a read/frame line — compile reads image_brief from card JSON");
  }
  if (FROM_THE_BRIEF_RE.test(src)) {
    errors.push("wave brief restates a frame description 'from the brief'");
  }
  if (BRIEF_LINES_RE.test(src)) {
    errors.push("wave brief contains 'brief lines followed' — stale parallel copy");
  }
  if (JSON_BRIEF_RE.test(src)) {
    errors.push("wave brief embeds an image_brief JSON object");
  }

  if (strict) {
    for (const line of src.split(/\n/)) {
      if (ALLOWED_LINE_RE.test(line)) continue;
      if (CARD_ITEM_RE.test(line)) continue;
      errors.push(`strict wave brief is IDs only; extra line: ${JSON.stringify(line.slice(0, 80))}`);
    }
  }

  return errors;
}

function walkMarkdown(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === "node_modules" || ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMarkdown(full, acc);
    else if (ent.isFile() && /\.md$/i.test(ent.name)) acc.push(full);
  }
  return acc;
}

function validateRepo(root) {
  const base = root || ROOT;
  const errors = [];
  const files = walkMarkdown(base, []);
  for (const full of files) {
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (!isWaveBriefPath(rel)) continue;
    const text = fs.readFileSync(full, "utf8");
    const strict = /WAVE_BRIEF/i.test(path.basename(rel));
    for (const err of lintWaveBriefMarkdown(text, { strictIdsOnly: strict })) {
      errors.push(`${rel}: ${err}`);
    }
  }
  return errors;
}

function main() {
  const errors = validateRepo(ROOT);
  if (errors.length) {
    console.error("WAVE BRIEF ABORT\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log("wave-brief-check ok");
}

if (require.main === module) main();

module.exports = {
  isWaveBriefPath,
  lintWaveBriefMarkdown,
  validateRepo,
};
