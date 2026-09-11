"use strict";

const fs = require("fs");
const path = require("path");
const { loadTables, validateCard } = require("./validate-citations");
const { resolveCard } = require("./resolve-refs");
const { checkCameraLedger } = require("./camera-ledger");
const { validateGeometry, LEGAL_CAMERAS } = require("./geometry");
const { assemblePrompt } = require("./compile-prompt");
const { validateAuthoringSeat } = require("./authoring-seat");
const { checkSpoken, checkClosers } = require("./validate-spoken");

const ROLE_RELATIVE_RE = /\b(?:driver['’]?s[ -](?:side|window|door)|driver-(?:side|window|door)|driver (?:side|window|door)|passenger['’]?s?[ -]side|passenger-side|near[ -]side|off[ -]side)\b/i;

const dir = path.join(__dirname, "..", "cards");
const files = fs.readdirSync(dir).filter((f) => /^IV-\d{3}\.json$/.test(f)).sort();
const tables = loadTables();
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "pack", "04_card.schema.json"), "utf8"));
const locEnum = schema.properties.variation.properties.location_type.enum;
const weatherEnum = schema.properties.variation.properties.weather.enum;
const timeEnum = schema.properties.variation.properties.time_of_day.enum;
const camEnum = schema.properties.image_brief.properties.camera.enum;
const toneEnum = schema.properties.variation.properties.tone.enum;
const failEnum = schema.properties.variation.properties.failure_mode.enum;
const typeEnum = schema.properties.card_type.enum;
const castEnum = schema.properties.cast.items.enum;
const driverEnum = schema.properties.driver.enum;

const cards = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .sort((a, b) => String(a.card_id).localeCompare(String(b.card_id), undefined, { numeric: true }));
const errors = [];
function err(id, msg) { errors.push(`${id}: ${msg}`); }

const answers = { a: 0, b: 0, c: 0, d: 0 };
const openings = [];
const recast = ["yuna", "deac", "mya", "gracie", "officer_dunn", "marisol"];

function forcedCastOk(name, cur, prev) {
  const cluster = new Set(["IV-016", "IV-017", "IV-018"]);
  if ((name === "deac" || name === "mya" || name === "ali") && cluster.has(cur.card_id) && cluster.has(prev.card_id)) {
    return true;
  }
  if (name === "yuna" && ((cur.card_id === "IV-010" && prev.card_id === "IV-009") || (cur.card_id === "IV-009" && prev.card_id === "IV-010"))) {
    return true;
  }
  if (name === "gracie" && cluster.has(cur.card_id) && cluster.has(prev.card_id)) return true;
  if (name === "mya" && ((cur.card_id === "IV-028" && prev.card_id === "IV-018") || false)) return false;
  return false;
}

function forcedTripleOk(prev, cur) {
  return Boolean(cur.variation && cur.variation.forced && (
    (prev.card_id === "IV-005" && cur.card_id === "IV-012") ||
    (prev.card_id === "IV-014" && cur.card_id === "IV-025") ||
    (prev.card_id === "IV-021" && cur.card_id === "IV-022") ||
    (["IV-016", "IV-017", "IV-018"].includes(prev.card_id) && ["IV-016", "IV-017", "IV-018"].includes(cur.card_id))
  ));
}

function forcedTypeTripleOk(prev2, prev1, cur) {
  const close = new Set(["IV-028", "IV-029", "IV-030"]);
  return close.has(prev2.card_id) && close.has(prev1.card_id) && close.has(cur.card_id);
}

for (let i = 0; i < cards.length; i++) {
  const c = cards[i];
  const id = c.card_id;
  if (c.act !== "IV" || c.zone !== "The Core") err(id, "act/zone");
  if (!driverEnum.includes(c.driver)) err(id, "driver");
  if (!typeEnum.includes(c.card_type)) err(id, "card_type");
  if (c.title.length < 3 || c.title.length > 40) err(id, `title len ${c.title.length}`);
  if (c.scene.length < 150 || c.scene.length > 700) err(id, `scene len ${c.scene.length}`);
  const hookWords = String(c.hook || "").trim().split(/\s+/).filter(Boolean);
  if (!c.hook || hookWords.length < 1 || hookWords.length > 12) {
    err(id, `hook words ${hookWords.length}`);
  }
  if (c.card_type !== "dossier" && c.card_type !== "ride-along") {
    if (!c.decision || !c.options || !c.debrief) err(id, "missing decision/options/debrief");
    const correct = (c.options || []).filter((o) => o.correct);
    if (correct.length !== 1) err(id, `correct count ${correct.length}`);
    for (const o of c.options || []) {
      if (o.text.length > 160) err(id, `option ${o.id} text ${o.text.length}`);
      if (o.result.length < 80 || o.result.length > 400) err(id, `option ${o.id} result ${o.result.length}`);
    }
    const cid = correct[0] && correct[0].id;
    if (cid) answers[cid] = (answers[cid] || 0) + 1;
  } else if (!c.debrief) {
    err(id, "dossier missing debrief");
  }
  if (!locEnum.includes(c.variation.location_type)) err(id, "location");
  if (!weatherEnum.includes(c.variation.weather)) err(id, "weather");
  if (!timeEnum.includes(c.variation.time_of_day)) err(id, "time");
  if (!toneEnum.includes(c.variation.tone)) err(id, "tone");
  if (!failEnum.includes(c.variation.failure_mode)) err(id, "failure");
  if (!camEnum.includes(c.image_brief.camera) || !LEGAL_CAMERAS.includes(c.image_brief.camera)) {
    err(id, "camera");
  }
  for (const e of validateGeometry(c)) err(id, e.replace(`${id}: `, ""));
  try {
    assemblePrompt(c);
  } catch (e) {
    err(id, `compile: ${e.message.replace(`${id}: `, "")}`);
  }
  for (const [k, v] of Object.entries(c.image_brief || {})) {
    const texts = Array.isArray(v) ? v : [v];
    for (const t of texts) {
      if (typeof t === "string" && ROLE_RELATIVE_RE.test(t)) {
        err(id, `image_brief.${k} uses a role-relative spatial term`);
      }
    }
  }
  if (c.card_type === "hazard") {
    const tid = c.timeout_option_id;
    if (!tid || !(c.options || []).some((o) => o.id === tid)) {
      err(id, "hazard missing timeout_option_id");
    }
    const timeoutOpt = (c.options || []).find((o) => o.id === tid);
    if (timeoutOpt && timeoutOpt.correct) err(id, "timeout_option_id is the correct option");
  }
  for (const x of c.cast || []) if (!castEnum.includes(x)) err(id, `cast ${x}`);
  openings.push(c.scene.trim().split(/\s+/).slice(0, 3).join(" "));
  if (i > 0 && openings[i] === openings[i - 1]) err(id, "opening repeat");
  const triple = `${c.variation.location_type}|${c.variation.weather}|${c.variation.time_of_day}`;
  for (let j = Math.max(0, i - 5); j < i; j++) {
    const p = cards[j];
    const pt = `${p.variation.location_type}|${p.variation.weather}|${p.variation.time_of_day}`;
    if (pt === triple && !forcedTripleOk(p, c)) {
      err(id, `triple repeat vs ${p.card_id}`);
    }
  }
  for (const name of recast) {
    if (!(c.cast || []).includes(name)) continue;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if ((cards[j].cast || []).includes(name) && !forcedCastOk(name, c, cards[j])) {
        err(id, `cast ${name} within 4 of ${cards[j].card_id}`);
      }
    }
  }
  if (i >= 2 && c.card_type === cards[i - 1].card_type && c.card_type === cards[i - 2].card_type) {
    if (!forcedTypeTripleOk(cards[i - 2], cards[i - 1], c)) {
      err(id, "three same types in a row");
    }
  }
  for (const e of validateCard(c, tables)) {
    err(id, e.replace(`${id}: `, ""));
  }
  for (const e of resolveCard(c).errors) err(id, e.replace(`${id}: `, ""));
  for (const e of validateAuthoringSeat(c)) err(id, e.replace(`${id}: `, ""));
  for (const e of checkSpoken(c)) err(id, e.replace(`${id}: `, ""));
}

const n = cards.filter((c) => c.card_type !== "dossier" && c.card_type !== "ride-along").length;
const cameraLedger = checkCameraLedger(cards);
for (const e of cameraLedger.errors) errors.push(e);
for (const e of checkClosers(cards)) errors.push(e);
const portraits = cards.filter((c) => c.image_brief && c.image_brief.camera === "POV_PORTRAIT").length;
const faceBudget = Math.ceil(cards.length * 0.1);
const decision = cards.filter((c) => c.card_type !== "dossier" && c.card_type !== "ride-along");
const maxAns = Math.max(...Object.values(answers), 0);
if (decision.length && maxAns / decision.length > 0.35 + 1e-12) {
  errors.push(`answer position exceeds 35%: ${JSON.stringify(answers)}`);
}

const types = {};
for (const c of cards) types[c.card_type] = (types[c.card_type] || 0) + 1;

console.log("cards", cards.length, "decision", n);
console.log("types", types);
console.log("drivers", cards.map((c) => `${c.card_id}:${c.driver}`).join(" "));
console.log("answers", answers);
console.log("cameras", cameraLedger.cameras);
console.log(
  "camera cap (non-exempt)",
  cameraLedger.nonExemptCounts,
  `denom ${cameraLedger.nonExemptDenom}`,
  "exempt",
  cameraLedger.exemptIds
);
console.log("face-critical portraits", portraits, "budget ≤", faceBudget);
console.log("openings", openings.join(" | "));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
