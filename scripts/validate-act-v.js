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
const { COLD_PACK, deliveryBeat, cargoFailDispatch, radioCheckin, manifestFor } = require("../src/manifest");

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
const INVENTED_LOAD = /\b(insulin|june|delridge|cooler|fuel drums?|single-axle|flatbed|load_state|sway[- ]load|tow hitch|towing a)\b/i;
const CAB_LEAK = /\b(deac|ledger|jump seat|cutaway shuttle|doghouse)\b/i;
const ALLOWED_CAST = new Set(["ali", "yuna", "hollis", "old_ninety"]);
const EXPECTED_IDS = Array.from({ length: 13 }, (_, i) => "V-" + String(i + 1).padStart(3, "0"));

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
  if (c.act !== "V" || c.zone !== "The Ribbon" || c.driver !== "ali") err(id, "act/zone/driver");
  if (c.card_type === "ride-along") err(id, "Act V is Ali alone / Yuna radio — III-001 stays the only ride-along");
  if (!Number.isInteger(c.presence) || c.presence < 0) {
    err(id, "presence must be a canonical integer >= 0 (do not invent a parallel live field)");
  }
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
  for (const x of c.cast || []) {
    if (!castEnum.includes(x)) err(id, `cast ${x}`);
    if (!ALLOWED_CAST.has(x)) err(id, `cast ${x} — Ali alone / Yuna radio (Hollis / Old Ninety ok)`);
  }
  const blob = [c.title, c.hook, c.scene, c.decision, c.debrief, JSON.stringify(c.options || [])].join(" ");
  if (CAB_LEAK.test(blob)) err(id, "Deac / Ledger / jump seat leaked into Ali-alone copy");
  if (DEFERRED_VII.test(blob)) {
    err(id, "Act VII material (chains / Snoqualmie / plow / night weather) leaked into a teaching card");
  }
  if (REPLAY.test(blob)) err(id, "replays Act I–III stage language");
  if (INVENTED_LOAD.test(blob)) {
    err(id, "retired or invented load (insulin / cooler / June / flatbed / drums / tow) — relay kit only");
  }
  if (i >= 2 && c.card_type === cards[i - 1].card_type && c.card_type === cards[i - 2].card_type) {
    err(id, "three same types in a row");
  }
  for (const e of validateCard(c, tables)) err(id, e.replace(`${id}: `, ""));
  for (const e of resolveCard(c).errors) err(id, e.replace(`${id}: `, ""));
  for (const e of validateAuthoringSeat(c)) err(id, e.replace(`${id}: `, ""));
  for (const e of checkSpoken(c)) err(id, e.replace(`${id}: `, ""));
}

const n = cards.filter((c) => c.card_type !== "dossier" && c.card_type !== "ride-along").length;
const ids = cards.map((c) => c.card_id);
if (ids.join(",") !== EXPECTED_IDS.join(",")) {
  errors.push("Act V must be V-001…V-013 plus the existing end-of-run beat, not a new V-014");
}
if (fs.existsSync(path.join(dir, "V-014.json"))) {
  errors.push("V-014.json must not exist — end-of-run is the existing delivery beat");
}
for (const e of checkClosers(cards)) errors.push(e);

const CLOSER_BANNED = /\b(insulin|june|delridge|cooler|warm(?:ed|ing)?)\b/i;
function assertRibbonCopy(label, text) {
  if (CLOSER_BANNED.test(String(text || ""))) {
    errors.push("closer " + label + " still uses insulin/cooler/June framing: " + JSON.stringify(text));
  }
}
const manV = manifestFor("V", "Test");
if (manV.act !== "V" || !/relay/i.test(manV.cargo) || !/repeater|antenna|clamps/i.test(manV.cargo)) {
  errors.push("MANIFESTS.V must name the relay kit (repeater / antenna / clamps)");
}
assertRibbonCopy("manifest cargo", manV.cargo);
assertRibbonCopy("manifest for", manV.for);
assertRibbonCopy("delivery spare", deliveryBeat({ time_cost: 0 }, "V"));
assertRibbonCopy("delivery tight", deliveryBeat({ time_cost: COLD_PACK - 3 }, "V"));
assertRibbonCopy("delivery late", deliveryBeat({ time_cost: COLD_PACK }, "V"));
assertRibbonCopy("fail empty", cargoFailDispatch([], "V"));
assertRibbonCopy("fail placed", cargoFailDispatch([{ card_id: "V-005", minutes: 6, place: "the ramp" }], "V"));
const radioLate = radioCheckin({ time_cost: COLD_PACK - 4 }, { time_cost: COLD_PACK }, "V");
const radioCheck = radioCheckin({ time_cost: 20 }, { time_cost: 110 }, "V");
assertRibbonCopy("radio late", radioLate && radioLate.line);
assertRibbonCopy("radio check", radioCheck && radioCheck.line);
if (!radioLate || radioLate.who !== "yuna") errors.push("Act V late radio must be Yuna");
if (!radioCheck || radioCheck.who !== "yuna") errors.push("Act V check radio must be Yuna");
const iiLate = deliveryBeat({ time_cost: COLD_PACK }, "II");
if (!/June/i.test(iiLate)) errors.push("Act II deliveryBeat must keep June copy");

console.log("cards", cards.length, "decision", n);
console.log("answers", answers);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
