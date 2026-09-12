"use strict";

const fs = require("fs");
const path = require("path");
const { loadTables, validateCard } = require("./validate-citations");
const { seqFromCard } = require("./card-seq");
const { resolveCard } = require("./resolve-refs");
const { validateGeometry, LEGAL_CAMERAS } = require("./geometry");
const { assemblePrompt } = require("./compile-prompt");
const { validateAuthoringSeat } = require("./authoring-seat");
const { checkSpoken, checkClosers } = require("./validate-spoken");

const dir = path.join(__dirname, "..", "cards");
const files = fs.readdirSync(dir).filter((f) => /^V-\d{3}\.json$/.test(f)).sort();
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

const DEFERRED_VII = /\b(snoqualmie|chain-?up|\bchains\b|gravy|snowplow|deep[_ ]night|\bfog\b|\bice\b|mountain pass)\b/i;
const REPLAY = /\b(fred meyer|two-way left|hov diamond|the lot\b|quiet street)\b/i;

const cards = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .sort((a, b) => seqFromCard(a) - seqFromCard(b) || String(a.card_id).localeCompare(String(b.card_id)));
const errors = [];
function err(id, msg) {
  errors.push(`${id}: ${msg}`);
}

const answers = { a: 0, b: 0, c: 0, d: 0 };

for (let i = 0; i < cards.length; i++) {
  const c = cards[i];
  const id = c.card_id;
  if (c.act !== "V" || c.zone !== "The Ribbon" || c.driver !== "deac") err(id, "act/zone/driver");
  if (!typeEnum.includes(c.card_type)) err(id, "card_type");
  if (!c.title || c.title.length < 3 || c.title.length > 40) err(id, `title len ${c.title && c.title.length}`);
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
      if (o.text.length > 160) err(id, `option ${o.id} text`);
      if (o.result.length < 80 || o.result.length > 400) err(id, `option ${o.id} result ${o.result.length}`);
    }
    const cid = correct[0] && correct[0].id;
    if (cid) answers[cid] = (answers[cid] || 0) + 1;
  }
  if (c.variation.location_type === "mountain_pass") err(id, "mountain_pass is Act VII");
  if (["night", "deep_night", "dusk"].includes(c.variation.time_of_day)) err(id, "dusk/night is Act VII");
  if (["snow", "ice", "fog"].includes(c.variation.weather)) err(id, "snow/ice/fog is Act VII");
  if (!locEnum.includes(c.variation.location_type)) err(id, "location");
  if (!weatherEnum.includes(c.variation.weather)) err(id, "weather");
  if (!timeEnum.includes(c.variation.time_of_day)) err(id, "time");
  if (!toneEnum.includes(c.variation.tone)) err(id, "tone");
  if (!failEnum.includes(c.variation.failure_mode)) err(id, "failure");
  if (!camEnum.includes(c.image_brief.camera) || !LEGAL_CAMERAS.includes(c.image_brief.camera)) {
    err(id, "camera");
  }
  if (c.image_brief.camera === "POV_MIRROR_REAR") err(id, "POV_MIRROR_REAR illegal on Ledger");
  for (const e of validateGeometry(c)) err(id, e.replace(`${id}: `, ""));
  try {
    assemblePrompt(c);
  } catch (e) {
    err(id, e.message.replace(`${id}: `, ""));
  }
  if (c.card_type === "ride-along") {
    const lines = c.ride_along || [];
    if (lines.length < 12 || lines.length > 15) err(id, `ride_along length ${lines.length}`);
    const beats = c.ride_beats || [];
    if (beats.length && beats.length !== lines.length) {
      err(id, `ride_beats length ${beats.length} vs ride_along ${lines.length}`);
    }
  }
  if (c.card_type === "hazard") {
    const tid = c.timeout_option_id;
    if (!tid || !(c.options || []).some((o) => o.id === tid)) {
      err(id, "hazard missing timeout_option_id");
    }
  }
  for (const x of c.cast || []) if (!castEnum.includes(x)) err(id, `cast ${x}`);
  const blob = [c.title, c.hook, c.scene, c.decision, c.debrief, JSON.stringify(c.options || [])].join(" ");
  if (DEFERRED_VII.test(blob) && id !== "V-014") {
    err(id, "Act VII material (chains / Snoqualmie / plow / night weather) leaked into a teaching card");
  }
  if (REPLAY.test(blob)) err(id, "replays Act I–III stage language");
  if (i >= 2 && c.card_type === cards[i - 1].card_type && c.card_type === cards[i - 2].card_type) {
    err(id, "three same types in a row");
  }
  for (const e of validateCard(c, tables)) err(id, e.replace(`${id}: `, ""));
  for (const e of resolveCard(c).errors) err(id, e.replace(`${id}: `, ""));
  for (const e of validateAuthoringSeat(c)) err(id, e.replace(`${id}: `, ""));
  for (const e of checkSpoken(c)) err(id, e.replace(`${id}: `, ""));
}

const n = cards.filter((c) => c.card_type !== "dossier" && c.card_type !== "ride-along").length;
for (const e of checkClosers(cards)) errors.push(e);

console.log("cards", cards.length, "decision", n);
console.log("answers", answers);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
