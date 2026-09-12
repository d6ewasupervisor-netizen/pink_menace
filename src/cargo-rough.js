"use strict";

// Act V degrade — not a hard fail. Prefer thin-net.
// cargo_rough bands the end-of-run beat (CLEAN / SCUFFED / THINNED).
// No fail-beyond-THINNED exists. Do not invent one.
// daylight_fail does not end the run. It swaps one V-013 scene clause (like I-008 lot_states).
// That clause is the only place the overrun registers.

const CARGO_ROUGH = {
  CLEAN_MAX: 3,
  SCUFFED_MAX: 8,
};

const DAYLIGHT_FAIL_AT = 130; // same budget as COLD_PACK — clock out, still playable

const V013_DUSK = {
  SCHEDULED: "scheduled",
  OVERRUN: "overrun",
};

const V013_CLAUSE = {
  scheduled: "The light is going and you are where you meant to be.",
  overrun: "The light is going and you are not where you meant to be, and the reason is the last two hours.",
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function cargoRoughFromState(state) {
  const s = state || {};
  if (s.cargo_rough != null) return Math.max(0, num(s.cargo_rough));
  return Math.max(0, num(s.yaw));
}

function cargoRoughBand(rough) {
  const n = Math.max(0, num(rough));
  if (n <= CARGO_ROUGH.CLEAN_MAX) return "CLEAN";
  if (n <= CARGO_ROUGH.SCUFFED_MAX) return "SCUFFED";
  return "THINNED";
}

function daylightFail(state) {
  const s = state || {};
  if (s.daylight_fail === true) return true;
  return num(s.time_cost) >= DAYLIGHT_FAIL_AT;
}

function stampDaylightFail(state) {
  const next = { ...(state || {}) };
  if (num(next.time_cost) >= DAYLIGHT_FAIL_AT) next.daylight_fail = true;
  return next;
}

function radioChannel(state) {
  return cargoRoughBand(cargoRoughFromState(state));
}

function duskClause(card, key) {
  const states = (card && card.dusk_states) || {};
  const row = states[key] || {};
  return row.clause || V013_CLAUSE[key];
}

function applyV013DuskForce(card, state) {
  if (!card || card.card_id !== "V-013") return card;
  const next = { ...card };
  next.time_of_day = next.time_of_day || "dusk";
  const scheduled = duskClause(card, V013_DUSK.SCHEDULED);
  const overrun = duskClause(card, V013_DUSK.OVERRUN);
  if (!daylightFail(state)) {
    next.dusk_state = V013_DUSK.SCHEDULED;
    next.dusk_forced = false;
    return next;
  }
  next.dusk_state = V013_DUSK.OVERRUN;
  next.dusk_forced = true;
  if (next.scene && scheduled && overrun && next.scene.includes(scheduled)) {
    next.scene = next.scene.replace(scheduled, overrun);
  }
  return next;
}

module.exports = {
  CARGO_ROUGH,
  DAYLIGHT_FAIL_AT,
  V013_DUSK,
  V013_CLAUSE,
  cargoRoughFromState,
  cargoRoughBand,
  daylightFail,
  stampDaylightFail,
  radioChannel,
  applyV013DuskForce,
};
