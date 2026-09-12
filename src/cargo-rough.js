"use strict";

// Act V radio-channel bands. Separate from presence. Do not rename.
// Cut points reuse presence T0 / T1 edges (src/presence.js, pack/26 §2)
// so a sloppy run scuffs the kit on the same cadence the Quiet appear.
// T4 collapse (23) is Quiet, not cargo-fail (pack/26 §3).

const CARGO_ROUGH = {
  CLEAN_MAX: 3,
  SCUFFED_MAX: 8,
};

const DAYLIGHT_FAIL_AT = 130; // same budget as COLD_PACK in src/manifest.js

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function cargoRoughFromState(state) {
  const s = state || {};
  if (s.cargo_rough != null) return Math.max(0, num(s.cargo_rough));
  // yaw is the Ribbon "rough" meter (bible §2). Light / noise stay on presence.
  return Math.max(0, num(s.yaw));
}

function cargoRoughBand(rough) {
  const n = Math.max(0, num(rough));
  if (n <= CARGO_ROUGH.CLEAN_MAX) return "CLEAN";
  if (n <= CARGO_ROUGH.SCUFFED_MAX) return "SCUFFED";
  return "THINNED";
}

function daylightFail(state) {
  return num(state && state.time_cost) >= DAYLIGHT_FAIL_AT;
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
  radioChannel,
};
