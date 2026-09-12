"use strict";

// cargo_rough bands the successful end-of-run beat (CLEAN / SCUFFED / THINNED).
// daylight_fail is the Act V fail state: clock-out ends the run.
// It does not force V-013 dusk as a continuing card.
// When both flags are set, daylight_fail wins and terminates.

const CARGO_ROUGH = {
  CLEAN_MAX: 3,
  SCUFFED_MAX: 8,
};

const DAYLIGHT_FAIL_AT = 130; // same budget as COLD_PACK

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
  if (daylightFail(state)) return "daylight_fail";
  return cargoRoughBand(cargoRoughFromState(state));
}

module.exports = {
  CARGO_ROUGH,
  DAYLIGHT_FAIL_AT,
  cargoRoughFromState,
  cargoRoughBand,
  daylightFail,
  stampDaylightFail,
  radioChannel,
};
