"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REFS = path.join(ROOT, "refs");
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "pack", "09_REF_MAP.json"), "utf8"));
const BANNED_REFS = new Set(MAP.banned || []);

const MENACE_LOCKS = new Set([
  "pink_menace_exterior",
  "pink_menace_interior",
  "ali",
  "ali_face",
  "gracie",
]);

function isLocation(token) {
  return /^L-\d+/.test(token);
}

function resolveCard(raw) {
  const id = raw.card_id || "(missing card_id)";
  const tokens = [...((raw.image_brief && raw.image_brief.continuity) || [])];
  const cam = raw.image_brief && raw.image_brief.camera;
  const diagramVehicle =
    raw.driver === "deac" ? "the_ledger" : raw.driver === "yuna" ? "encore" : "pink_menace_exterior";
  if (cam === "POV_DIAGRAM" && !tokens.includes(diagramVehicle)) {
    tokens.push(diagramVehicle);
  }
  const errors = [];
  const attachments = [];
  const seen = new Set();

  if (raw.driver === "deac") {
    for (const t of tokens) {
      if (MENACE_LOCKS.has(t)) {
        errors.push(`${id}: Deac card cannot attach Menace lock ${t}`);
      }
    }
  }

  if (cam === "POV_DIAGRAM") {
    const lockTokens = tokens.filter(
      (t) =>
        t !== "diagram_style" &&
        t !== "pink_menace_exterior" &&
        t !== "the_ledger" &&
        t !== "encore" &&
        !isLocation(t) &&
        !MAP.no_file.includes(t)
    );
    if (lockTokens.length) {
      errors.push(
        `${id}: POV_DIAGRAM cannot attach character refs (${lockTokens.join(", ")})`
      );
    }
  }

  const brief = raw.image_brief || {};
  const quietInFrame =
    tokens.includes("the_quiet") ||
    /\bthe Quiet\b/.test(
      [brief.subject, brief.foreground, brief.midground, brief.background, brief.read]
        .filter(Boolean)
        .join(" ")
    );
  if (quietInFrame && !tokens.includes("the_quiet")) tokens.push("the_quiet");

  for (const token of tokens) {
    if (isLocation(token) || MAP.no_file.includes(token)) continue;
    if (raw.driver === "deac" && MENACE_LOCKS.has(token)) continue;
    const files = MAP.locks[token];
    if (!files) {
      errors.push(
        `${id}: continuity token ${JSON.stringify(token)} is not in pack/09_REF_MAP.json locks or no_file`
      );
      continue;
    }
    for (const file of files) {
      if (BANNED_REFS.has(file)) {
        errors.push(`${id}: banned ref ${file} is out of the compile pool`);
        continue;
      }
      const abs = path.join(REFS, file);
      if (!fs.existsSync(abs)) {
        errors.push(`${id}: missing ref ${file} (continuity ${token})`);
        continue;
      }
      if (!seen.has(abs)) {
        seen.add(abs);
        attachments.push(abs);
      }
    }
  }

  return { id, tokens, attachments, errors };
}

function assertCompileReady(raw) {
  const resolved = resolveCard(raw);
  if (resolved.errors.length) {
    const err = new Error(resolved.errors.join("\n"));
    err.validation = resolved.errors;
    throw err;
  }
  const lockTokens = resolved.tokens.filter(
    (t) => !isLocation(t) && !MAP.no_file.includes(t)
  );
  if (lockTokens.length && resolved.attachments.length === 0) {
    throw new Error(
      `${resolved.id}: continuity names lock assets but compile would attach nothing — abort`
    );
  }
  return resolved;
}

module.exports = { resolveCard, assertCompileReady, REFS, MAP };
