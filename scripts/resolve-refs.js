"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REFS = path.join(ROOT, "refs");
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "pack", "09_REF_MAP.json"), "utf8"));

function isLocation(token) {
  return /^L-\d+/.test(token);
}

function resolveCard(raw) {
  const id = raw.card_id || "(missing card_id)";
  const tokens = [...((raw.image_brief && raw.image_brief.continuity) || [])];
  const cam = raw.image_brief && raw.image_brief.camera;
  if (cam === "POV_DIAGRAM" && !tokens.includes("pink_menace_exterior")) {
    tokens.push("pink_menace_exterior");
  }
  const errors = [];
  const attachments = [];
  const seen = new Set();

  if (cam === "POV_DIAGRAM") {
    const lockTokens = tokens.filter(
      (t) => t !== "diagram_style" && t !== "pink_menace_exterior" && !isLocation(t) && !MAP.no_file.includes(t)
    );
    if (lockTokens.length) {
      errors.push(
        `${id}: POV_DIAGRAM cannot attach character refs (${lockTokens.join(", ")})`
      );
    }
  }

  for (const token of tokens) {
    if (isLocation(token) || MAP.no_file.includes(token)) continue;
    const files = MAP.locks[token];
    if (!files) {
      errors.push(
        `${id}: continuity token ${JSON.stringify(token)} is not in pack/09_REF_MAP.json locks or no_file`
      );
      continue;
    }
    for (const file of files) {
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
