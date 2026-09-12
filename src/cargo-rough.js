"use strict";

// Act V degrade — not a hard fail. Nothing on the Ribbon is instantly fatal.
// cargo_rough bands the end-of-run beat. daylight_fail forces V-013 dusk/hazard.
// Both may be set. They stack. Do not collapse them into one cliff.

const CARGO_ROUGH = {
  CLEAN_MAX: 3,
  SCUFFED_MAX: 8,
};

const DAYLIGHT_FAIL_AT = 130; // same budget as COLD_PACK — clock out, still playable

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

function applyV013DuskForce(card, state) {
  if (!card || card.card_id !== "V-013") return card;
  if (!daylightFail(state)) return card;
  const force = card.dusk_force || {};
  const next = { ...card };
  next.time_of_day = force.time_of_day || "dusk";
  next.night = true;
  next.card_type = force.card_type || "hazard";
  next.timeout_option_id = force.timeout_option_id || next.timeout_option_id || "b";
  next.timeout_ms = Number(force.timeout_ms) || next.timeout_ms || 10000;
  next.dusk_forced = true;
  if (force.scene) next.scene = force.scene;
  else if (next.scene && !/^Dusk\b/i.test(next.scene)) {
    next.scene = next.scene.replace(/^(Overcast afternoon|Afternoon)/i, "Dusk");
  }
  if (force.hook) next.hook = force.hook;
  return next;
}

module.exports = {
  CARGO_ROUGH,
  DAYLIGHT_FAIL_AT,
  cargoRoughFromState,
  cargoRoughBand,
  daylightFail,
  stampDaylightFail,
  radioChannel,
  applyV013DuskForce,
};
