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
const { cargoRoughBand, radioChannel } = require("../src/cargo-rough");

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
const TRUCK_TIRE_AXLE = /\b(truck (?:tire|tyre|axle)|trailer axle|drive axle|the duals?\b)\b/i;
const OTHER_EGO = /\b(the ledger|cutaway shuttle|encore|deac has the wheel)\b/i;
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
  if (c.variation.location_type !== "highway") {
    err(id, "Act V location_type must be highway");
  }
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
  if (["night", "deep_night"].includes(c.variation.time_of_day)) err(id, "night is Act VII");
  if (c.variation.time_of_day === "dusk" && id !== "V-013") {
    err(id, "dusk-as-dark is Act VII; only V-013 may be dusk (grade pass)");
  }
  if (id === "V-013") {
    if (c.variation.time_of_day !== "dusk" || c.card_type !== "scene") {
      err(id, "V-013 dusk is the grade-pass card path; daylight_fail ends the run and does not rewrite this card");
    }
    if (c.dusk_states || c.dusk_force) {
      err(id, "V-013 is one dusk card; do not attach daylight_fail as a continuing scene state");
    }
  }
  if (["snow", "ice", "fog"].includes(c.variation.weather)) err(id, "snow/ice/fog is Act VII");
  if (!locEnum.includes(c.variation.location_type)) err(id, "location");
  if (!weatherEnum.includes(c.variation.weather)) err(id, "weather");
  if (!timeEnum.includes(c.variation.time_of_day)) err(id, "time");
  if (!toneEnum.includes(c.variation.tone)) err(id, "tone");
  if (!failEnum.includes(c.variation.failure_mode)) err(id, "failure");
  if (!camEnum.includes(c.image_brief.camera) || !LEGAL_CAMERAS.includes(c.image_brief.camera)) {
    err(id, "camera");
  }
  const briefBlob = [
    c.image_brief.subject,
    c.image_brief.foreground,
    c.image_brief.midground,
    c.image_brief.background,
    c.image_brief.read,
    (c.image_brief.continuity || []).join(" "),
  ].join(" ");
  if (/\b(yuna|encore)\b/i.test(briefBlob)) {
    err(id, "Yuna is radio-only — do not put her or Encore in the still");
  }
  if (/\b(ledger_cockpit|the_ledger)\b/i.test((c.image_brief.continuity || []).join(" "))) {
    err(id, "Act V ego is the Menace — no Ledger lock");
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
  for (const x of c.cast || []) if (!castEnum.includes(x)) err(id, `cast ${x}`);
  const blob = [
    c.title,
    c.hook,
    c.scene,
    c.decision,
    c.debrief,
    JSON.stringify(c.options || []),
  ].join(" ");
  if (DEFERRED_VII.test(blob)) {
    err(id, "Act VII material (chains / Snoqualmie / plow / night weather) leaked into a teaching card");
  }
  if (REPLAY.test(blob)) err(id, "replays Act I–III stage language");
  if (INVENTED_LOAD.test(blob)) {
    err(id, "retired or invented load (insulin / cooler / June / flatbed / drums / tow) — relay kit only");
  }
  if (TRUCK_TIRE_AXLE.test(blob)) {
    err(id, "no truck tire/axle framing on the Ribbon");
  }
  if (OTHER_EGO.test(blob)) {
    err(id, "Ali alone — no Ledger / Encore / Deac-at-the-wheel in player copy");
  }
  if (i >= 2 && c.card_type === cards[i - 1].card_type && c.card_type === cards[i - 2].card_type) {
    err(id, "three same types in a row");
  }
  const dolRaw = c.source && c.source.dol_section;
  const dol = dolRaw == null || dolRaw === "" ? "n/a" : dolRaw;
  if (/Exiting/i.test(String(dolRaw || ""))) {
    err(id, "do not mint a DOL Exiting heading — PSDP Lesson four pairs existing 4.12 / 5.1 strings only");
  }
  if (id === "V-004" && dol !== "4.11 Traffic light signals (Freeway ramp meters)") {
    err(id, "V-004 must cite 4.11 Traffic light signals (Freeway ramp meters), not the parent");
  }
  if (id === "V-009" && dol !== "n/a") {
    err(id, "V-009 uses dol_section n/a — do not stretch a parent; DOL has no Exiting / steer-gently heading");
  }
  if (id === "V-010" && dol !== "n/a") {
    err(id, "V-010 is PSDP lane-change; no DOL lane-change heading — use n/a, not 5.3");
  }
  if (id === "V-003" && dol !== "5.3 Merging") {
    err(id, "V-003 on-ramp segments cite 5.3 Merging parent; do not mint an On-ramp child");
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
if (!/tower 4/i.test(manV.for)) {
  errors.push("MANIFESTS.V.for must name Tower 4");
}
if (/sat|tomorrow/i.test(cargoFailDispatch([], "V") + cargoFailDispatch([{ card_id: "V-005", minutes: 6, place: "the ramp" }], "V"))) {
  errors.push("Act V cargo fail must stay thin-net (late still delivers; no sat/tomorrow)");
}
const radioWho = radioCheckin({ time_cost: COLD_PACK - 4 }, { time_cost: COLD_PACK }, "V");
if (!radioWho || radioWho.who !== "yuna") {
  errors.push("Act V radio must be Yuna");
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
const iiLate = deliveryBeat({ time_cost: COLD_PACK }, "II");
if (!/June/i.test(iiLate)) errors.push("Act II deliveryBeat must keep June copy");
const RAMP_METER = "4.11 Traffic light signals (Freeway ramp meters)";
if (!tables.dol.has(RAMP_METER)) {
  errors.push("pack/07 must allowlist exact string " + JSON.stringify(RAMP_METER));
}
if (cargoRoughBand(0) !== "CLEAN" || cargoRoughBand(3) !== "CLEAN") {
  errors.push("cargo_rough CLEAN must be 0–3");
}
if (cargoRoughBand(4) !== "SCUFFED" || cargoRoughBand(8) !== "SCUFFED") {
  errors.push("cargo_rough SCUFFED must be 4–8");
}
if (cargoRoughBand(9) !== "THINNED") {
  errors.push("cargo_rough THINNED must start at 9");
}
if (radioChannel({ yaw: 9, time_cost: 20 }) !== "THINNED") {
  errors.push("cargo_rough THINNED must still band the channel when the clock is live");
}
if (radioChannel({ yaw: 1, time_cost: COLD_PACK }) !== "daylight_fail") {
  errors.push("daylight_fail wins the channel when both flags are set");
}
if (radioChannel({ yaw: 9, time_cost: COLD_PACK }) !== "daylight_fail") {
  errors.push("daylight_fail wins over THINNED and terminates — it does not continue as a band");
}

console.log("cards", cards.length, "decision", n);
console.log("answers", answers);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
