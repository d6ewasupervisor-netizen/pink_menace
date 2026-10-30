"use strict";

// Act VII — The Dark Hours: The Road Home (opened 2026-10-29).
//
// Cards only: every VII card ships a brief and must carry
// `variation.forced: "Act VII scaffold — no still; do not seed"`. No VII still
// exists. The seeder writes the text with a null image so /drive can grade it.
// The card game does not deal that sentence.
//
// Modeled on validate-act-v.js / validate-act-iii.js, minus the Act V ban on
// VII material (VII is where that material lives now). It adds three checks:
//   - the no-still / do-not-seed contract (forced string, no winner, no PNG)
//   - the herd's art law in the brief (no gore; figures do not fill the frame)
//   - callback integrity (a scheduled miss must have a later card that bills it)

const fs = require("fs");
const path = require("path");
const { loadTables, validateCard } = require("./validate-citations");
const { seqFromCard } = require("./card-seq");
const { validateGeometry, LEGAL_CAMERAS } = require("./geometry");
const { assemblePrompt } = require("./compile-prompt");
const { validateAuthoringSeat } = require("./authoring-seat");
const { checkSpoken, checkClosers } = require("./validate-spoken");

const dir = path.join(__dirname, "..", "cards");
const files = fs.readdirSync(dir).filter((f) => /^VII-\d{3}\.json$/.test(f)).sort();
const tables = loadTables();
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "pack", "04_card.schema.json"), "utf8"));
const locEnum = schema.properties.variation.properties.location_type.enum;
const weatherEnum = schema.properties.variation.properties.weather.enum;
const timeEnum = schema.properties.variation.properties.time_of_day.enum;
const toneEnum = schema.properties.variation.properties.tone.enum;
const failEnum = schema.properties.variation.properties.failure_mode.enum;
const typeEnum = schema.properties.card_type.enum;
const castEnum = schema.properties.cast.items.enum;
const camEnum = schema.properties.image_brief.properties.camera.enum;
const deltaProps = schema.properties.options.items.properties.state_delta.properties;

const NO_OPTIONS = new Set(["dossier", "ride-along", "ledger", "beat"]);
const GORE = /\b(gore|blood|bloody|wound|wounds|corpse|corpses|dismember|intestin\w*|brain\w*|bite|bites)\b/i;
const HERD = /\b(the herd|silhouettes)\b/i;
const FORCED = /no still/i;
const NO_SEED = /do not seed/i;

const cards = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .sort((a, b) => seqFromCard(a) - seqFromCard(b) || String(a.card_id).localeCompare(String(b.card_id)));

const errors = [];
function err(id, msg) {
  errors.push(`${id}: ${msg}`);
}

const answers = { a: 0, b: 0, c: 0, d: 0 };
const byId = new Map(cards.map((c) => [c.card_id, c]));


for (const c of cards) {
  const id = c.card_id;
  if (c.act !== "VII" || c.zone !== "The Dark Hours" || c.driver !== "ali") err(id, "act/zone/driver");
  if (!typeEnum.includes(c.card_type)) err(id, "card_type");
  if (!c.title || c.title.length < 3 || c.title.length > 40) err(id, `title len ${c.title && c.title.length}`);
  if (c.scene.length < 150 || c.scene.length > 700) err(id, `scene len ${c.scene.length}`);
  const hookWords = String(c.hook || "").trim().split(/\s+/).filter(Boolean);
  if (!c.hook || hookWords.length < 1 || hookWords.length > 12) err(id, `hook words ${hookWords.length}`);
  if (!c.debrief) err(id, "missing debrief");
  if (c.debrief && c.debrief.length > 400) err(id, `debrief len ${c.debrief.length}`);

  if (NO_OPTIONS.has(c.card_type)) {
    if (c.options) err(id, `${c.card_type} must not carry options`);
  } else {
    if (!c.decision || !c.options || !c.debrief) err(id, "missing decision/options/debrief");
    const correct = (c.options || []).filter((o) => o.correct);
    if (correct.length !== 1) err(id, `correct count ${correct.length}`);
    if (correct[0]) answers[correct[0].id] = (answers[correct[0].id] || 0) + 1;
  }
  if (c.card_type === "ledger") {
    if (!c.callback_of) err(id, "ledger must name callback_of");
    if (c.decision) err(id, "ledger must not carry a decision");
  }
  if (c.card_type === "hazard") {
    const tid = c.timeout_option_id;
    if (!tid || !(c.options || []).some((o) => o.id === tid)) err(id, "hazard missing timeout_option_id");
  }
  for (const o of c.options || []) {
    if (!/^[a-d]$/.test(o.id)) err(id, `option id ${o.id}`);
    if (o.text.length > 160) err(id, `option ${o.id} text`);
    if (o.result.length < 80 || o.result.length > 400) err(id, `option ${o.id} result ${o.result.length}`);
    for (const [k, v] of Object.entries(o.state_delta || {})) {
      const p = deltaProps[k];
      if (!p) err(id, `option ${o.id} delta key ${k}`);
      else if (typeof v === "number" && (v < p.minimum || v > p.maximum)) err(id, `option ${o.id} delta ${k}=${v}`);
    }
  }

  if (!locEnum.includes(c.variation.location_type)) err(id, "location");
  if (!weatherEnum.includes(c.variation.weather)) err(id, "weather");
  if (!timeEnum.includes(c.variation.time_of_day)) err(id, "time");
  if (!toneEnum.includes(c.variation.tone)) err(id, "tone");
  if (!failEnum.includes(c.variation.failure_mode)) err(id, "failure");
  if (!FORCED.test(String(c.variation.forced || ""))) err(id, "variation.forced must say 'no still'");
  if (!NO_SEED.test(String(c.variation.forced || ""))) err(id, "variation.forced must say 'do not seed'");
  if (c.variation.winner) err(id, "no winner — no VII still exists");
  if (fs.existsSync(path.join(dir, id + ".png")) || fs.existsSync(path.join(dir, id + ".jpg"))) {
    err(id, "a VII still exists on disk — VII stills are not produced");
  }
  const cam = c.image_brief && c.image_brief.camera;
  if (!camEnum.includes(cam) || !LEGAL_CAMERAS.includes(cam)) err(id, "camera");
  for (const e of validateGeometry(c)) err(id, e.replace(`${id}: `, ""));
  try {
    assemblePrompt(c);
  } catch (e) {
    err(id, e.message.replace(`${id}: `, ""));
  }
  for (const x of c.cast || []) if (!castEnum.includes(x)) err(id, `cast ${x}`);
  for (const e of validateCard(c, tables)) err(id, e.replace(`${id}: `, ""));
  for (const e of validateAuthoringSeat(c)) err(id, e.replace(`${id}: `, ""));
  for (const e of checkSpoken(c)) err(id, e.replace(`${id}: `, ""));
}

// The herd's art law: posture and stillness, never gore, never filling the frame.
for (const c of cards) {
  const id = c.card_id;
  const brief = c.image_brief || {};
  const briefText = [brief.subject, brief.foreground, brief.midground, brief.background, brief.read]
    .filter(Boolean)
    .join(" ");
  if (GORE.test(briefText)) err(id, "image_brief uses gore language — herd law: posture and stillness");
  if (HERD.test(briefText) || (brief.continuity || []).includes("the_quiet")) {
    if (!/do(?:es)? not fill the frame/i.test(briefText)) {
      err(id, "herd in frame must say the figures do not fill the frame");
    }
    if (!/no gore/i.test((brief.extra_negatives || []).join(" "))) {
      err(id, "herd in frame must carry a no-gore negative");
    }
  }
  if (c.callback_of && !byId.has(c.callback_of) && !fs.existsSync(path.join(dir, c.callback_of + ".json"))) {
    err(id, `callback_of ${c.callback_of} is not a card`);
  }
}

// A scheduled miss must have a later card that bills it.
for (const c of cards) {
  if (!c.schedules_callback) continue;
  const later = cards.filter((x) => x.callback_of === c.card_id);
  if (!later.length) err(c.card_id, "schedules_callback with no later card naming it as callback_of");
}

// Wiring: every VII card opens exactly once, in the drive's own dialogue, and
// every VII card node names a card that exists.
const dlgDir = path.join(__dirname, "..", "drive", "src", "quietroads", "data");
const placed = new Map();
for (const f of fs.readdirSync(dlgDir).filter((x) => /^dialogue_.*\.json$/.test(x))) {
  const d = JSON.parse(fs.readFileSync(path.join(dlgDir, f), "utf8"));
  for (const [sid, s] of Object.entries(d.scenes || {})) {
    for (const [nid, n] of Object.entries(s.nodes || {})) {
      if (n.type !== "card" || !/^VII-/.test(n.card || "")) continue;
      if (!placed.has(n.card)) placed.set(n.card, []);
      placed.get(n.card).push(`${f}:${sid}:${nid}`);
    }
  }
}
for (const c of cards) {
  const spots = placed.get(c.card_id) || [];
  if (spots.length !== 1) err(c.card_id, `placed ${spots.length} time(s) in dialogue (expected 1)`);
}
for (const [id, spots] of placed) {
  if (!byId.has(id)) errors.push(`${id}: card node with no card (${spots.join(", ")})`);
}

const decisionCards = cards.filter((c) => c.options && c.options.length);
const maxAnswer = Math.max(...Object.values(answers), 0);
if (decisionCards.length && maxAnswer / decisionCards.length > 0.35 + 1e-12) {
  errors.push(`answer position exceeds 35%: ${JSON.stringify(answers)}`);
}
for (const e of checkClosers(cards)) errors.push(e);

console.log("VII cards", cards.length, "decision", decisionCards.length);
console.log("answers", answers);
console.log("seq", cards.map((c) => `${c.card_id}=${seqFromCard(c)}`).join(" "));
console.log("placed", [...placed.entries()].map(([id, s]) => `${id}@${s[0]}`).join(" "));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
