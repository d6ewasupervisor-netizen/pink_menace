"use strict";

// Player-facing swap-column words from pack/23_THE_SPOKEN_DICTIONARY.md.
// Titles, options, and decisions never get a keep-list nickname.

const PLAYER_FIELDS = ["title", "hook", "scene", "decision", "debrief"];
const fs = require("fs");
const path = require("path");

const HARD = [
  { re: /\bconvex(es)?\b/i, label: "convex" },
  { re: /\bflat glass\b/i, label: "flat glass" },
  { re: /\bmill-and-fill\b/i, label: "mill-and-fill" },
  { re: /\bmillings\b/i, label: "millings" },
  { re: /\bmill\b/i, label: "mill" },
  { re: /\bcollector\b/i, label: "collector" },
  { re: /\bartial\b/i, label: "arterial" },
  { re: /\bqueu(e|ed|ing)\b/i, label: "queue" },
  { re: /\bskirting\b/i, label: "skirting" },
  { re: /\bknobbies\b/i, label: "knobbies" },
  { re: /\bthe well\b/i, label: "the well" },
  { re: /\bpaddle\b/i, label: "paddle" },
  { re: /\bthe dual\b/i, label: "the dual" },
  { re: /\bthe Ejection\b/, label: "the Ejection" },
  { re: /\bSkill nine\b/i, label: "Skill nine" },
  { re: /\bthe hole\b/i, label: "the hole" },
  { re: /\bright-side room\b/i, label: "right-side room" },
  { re: /\bwest-coast glass\b/i, label: "west-coast glass" },
];

const TITLE_OPTION_ONLY = [
  { re: /\bthe room\b/i, label: "the room (title/option/decision)" },
];

// The Ledger is a cutaway with a plate-steel cargo box. No rear window,
// no interior mirror. Same ratchet as the swap column — Act V cannot
// put Deac back on a center rearview.
const LEDGER_REAR_GLASS = [
  { re: /\brear glass\b/i, label: "rear glass" },
  { re: /\brearview\b/i, label: "rearview" },
  { re: /\binterior mirror\b/i, label: "interior mirror" },
  { re: /\bthe center mirror\b/i, label: "the center mirror" },
  { re: /\bcenter mirror\b/i, label: "center mirror" },
  { re: /\binside mirror\b/i, label: "inside mirror" },
  // Bare sweep call — "Mirror left. Right. Center. Again." — same error as naming the glass.
  { re: /(?:^|[.!?]\s+)Center\.?(?:\s|$)/, label: "Center (as mirror)" },
];

const RIDE_ALONG_PACK = path.join(__dirname, "..", "pack", "22_III_001_RIDE_ALONG.md");

function walkPlayer(card) {
  const rows = [];
  for (const field of PLAYER_FIELDS) {
    if (card[field]) rows.push({ field, text: String(card[field]) });
  }
  for (const o of card.options || []) {
    if (o.text) rows.push({ field: "opt:" + o.id, text: String(o.text) });
    if (o.result) rows.push({ field: "res:" + o.id, text: String(o.result) });
  }
  const ride = Array.isArray(card.ride_along) ? card.ride_along : [];
  ride.forEach((line, i) => {
    if (line) rows.push({ field: "ride_along:" + (i + 1), text: String(line) });
  });
  const voices = card.lot_voice || {};
  for (const key of ["called", "correct", "slow"]) {
    const voice = voices[key];
    if (!voice) continue;
    if (voice.scene) rows.push({ field: "lot_voice." + key + ".scene", text: String(voice.scene) });
    if (voice.scene_append) rows.push({ field: "lot_voice." + key + ".scene_append", text: String(voice.scene_append) });
    if (voice.hook) rows.push({ field: "lot_voice." + key + ".hook", text: String(voice.hook) });
    if (voice.debrief) rows.push({ field: "lot_voice." + key + ".debrief", text: String(voice.debrief) });
    if (voice.ride_open) rows.push({ field: "lot_voice." + key + ".ride_open", text: String(voice.ride_open) });
    if (voice.bark && voice.bark.line) {
      rows.push({ field: "lot_voice." + key + ".bark", text: String(voice.bark.line) });
    }
  }
  return rows;
}

/** Numbered player-facing lines from pack/22 — same voice rules as the card. */
function rideAlongPackLines(filePath) {
  const p = filePath || RIDE_ALONG_PACK;
  if (!fs.existsSync(p)) return [];
  const lines = [];
  for (const raw of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
    if (!m) continue;
    lines.push({ n: Number(m[1]), text: m[2] });
  }
  return lines;
}

function checkRideAlongPack(filePath) {
  const lines = rideAlongPackLines(filePath);
  if (!lines.length) return [`pack/22: no numbered ride-along lines`];
  const pseudo = {
    card_id: "pack/22",
    driver: "deac",
    ride_along: lines.map((l) => l.text),
  };
  return checkSpoken(pseudo);
}

function checkSpoken(card) {
  const errors = [];
  const id = card.card_id;
  const ledgerGlass = card.driver === "deac";
  for (const row of walkPlayer(card)) {
    for (const { re, label } of HARD) {
      if (re.test(row.text)) errors.push(`${id}: ${row.field} uses "${label}"`);
    }
    if (ledgerGlass) {
      for (const { re, label } of LEDGER_REAR_GLASS) {
        if (re.test(row.text)) {
          errors.push(`${id}: ${row.field} uses "${label}" (Ledger has no rear window)`);
        }
      }
    }
    if (/^(title|decision|opt:)/.test(row.field)) {
      for (const { re, label } of TITLE_OPTION_ONLY) {
        if (re.test(row.text)) errors.push(`${id}: ${row.field} uses "${label}"`);
      }
    }
    if (
      row.field === "scene" ||
      row.field === "debrief" ||
      row.field.startsWith("res:") ||
      /\.(scene|scene_append|debrief)$/.test(row.field)
    ) {
      if (/\bthe room\b/i.test(row.text) && !/\bblind spot\b/i.test(row.text)) {
        errors.push(`${id}: ${row.field} uses "the room" without saying blind spot`);
      }
    }
    if (/\bdoghouse\b/i.test(row.text) && !/\bbetween the seats\b/i.test(row.text)) {
      errors.push(`${id}: ${row.field} uses bare doghouse`);
    }
    if (/\bwest-coast\b/i.test(row.text) && !/\bwest-coast mirror/i.test(row.text)) {
      errors.push(`${id}: ${row.field} uses west-coast without mirror`);
    }
  }
  for (const [k, v] of Object.entries(card.image_brief || {})) {
    const texts = Array.isArray(v) ? v : [v];
    for (const t of texts) {
      if (typeof t !== "string") continue;
      if (/\bconvex/i.test(t)) errors.push(`${id}: image_brief.${k} uses convex`);
      if (/\bmill-and-fill\b/i.test(t)) errors.push(`${id}: image_brief.${k} uses mill-and-fill`);
      if (/\bartial\b/i.test(t)) errors.push(`${id}: image_brief.${k} uses arterial`);
      if (/\bwest-coast\b/i.test(t)) errors.push(`${id}: image_brief.${k} uses west-coast`);
      if (ledgerGlass) {
        for (const { re, label } of LEDGER_REAR_GLASS) {
          if (re.test(t)) {
            errors.push(`${id}: image_brief.${k} uses "${label}" (Ledger has no rear window)`);
          }
        }
      }
    }
  }
  return errors;
}

function lastSentence(text) {
  const parts = String(text || "")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function closeShape(sentence) {
  const s = sentence.trim();
  if (/\bis not\b/i.test(s) || /\bare not\b/i.test(s)) return "aphorism";
  if (/^[A-Z][a-z]+ [a-z]/.test(s) && /\b(Ali|Deac|Yuna|Gracie|Mya|Reyna|Hollis|Marisol)\b/.test(s)) {
    return "named_person";
  }
  if (/^(Do |Don't |Hold |Stay |Wait |Check |Look |Take |Keep |Signal |Stop |Leave |Clip |Tug )/i.test(s)) {
    return "imperative";
  }
  if (/\b(you|your)\b/i.test(s) && /\b(lost|hit|missed|cost|gained|saved|took)\b/i.test(s)) {
    return "consequence";
  }
  return "image";
}

function checkClosers(cards) {
  const errors = [];
  const debriefs = cards.filter((c) => c.debrief);
  let aphorism = 0;
  const shapes = [];
  for (const c of debriefs) {
    const last = lastSentence(c.debrief);
    const shape = closeShape(last);
    if (shape === "aphorism") aphorism += 1;
    const prev = shapes.slice(-3);
    if (prev.includes(shape) && prev[prev.length - 1] === shape) {
      errors.push(`${c.card_id}: debrief close-shape "${shape}" repeats the previous card`);
    }
    shapes.push(shape);
  }
  const cap = Math.ceil(debriefs.length / 5);
  if (aphorism > cap) {
    errors.push(`aphoristic closers ${aphorism} exceed 1-in-5 cap ${cap}`);
  }
  return errors;
}

module.exports = {
  checkSpoken,
  checkClosers,
  checkRideAlongPack,
  rideAlongPackLines,
  walkPlayer,
  LEDGER_REAR_GLASS,
};
