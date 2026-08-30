"use strict";

// Player-facing swap-column words from pack/23_THE_SPOKEN_DICTIONARY.md.
// Titles, options, and decisions never get a keep-list nickname.

const PLAYER_FIELDS = ["title", "hook", "scene", "decision", "debrief"];

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

function walkPlayer(card) {
  const rows = [];
  for (const field of PLAYER_FIELDS) {
    if (card[field]) rows.push({ field, text: String(card[field]) });
  }
  for (const o of card.options || []) {
    if (o.text) rows.push({ field: "opt:" + o.id, text: String(o.text) });
    if (o.result) rows.push({ field: "res:" + o.id, text: String(o.result) });
  }
  return rows;
}

function checkSpoken(card) {
  const errors = [];
  const id = card.card_id;
  for (const row of walkPlayer(card)) {
    for (const { re, label } of HARD) {
      if (re.test(row.text)) errors.push(`${id}: ${row.field} uses "${label}"`);
    }
    if (/^(title|decision|opt:)/.test(row.field)) {
      for (const { re, label } of TITLE_OPTION_ONLY) {
        if (re.test(row.text)) errors.push(`${id}: ${row.field} uses "${label}"`);
      }
    }
    if (row.field === "scene" || row.field === "debrief" || row.field.startsWith("res:")) {
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

module.exports = { checkSpoken, checkClosers, walkPlayer };
