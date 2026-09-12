"use strict";

const TIER = [
  { max: 3, tier: 0 },
  { max: 8, tier: 1 },
  { max: 13, tier: 2 },
  { max: 22, tier: 3 },
];

const COLLAPSE_AT = 23;
const AFTER_COLLAPSE = 16;
const TIMED_WEIGHT = 3;
const CLEAN_DECAY = 2;
const WRONG_NOISE_FLOOR = 3;
const PRESENCE_FLOOR = 3;

// QP-002 — act-boundary text only. T0–T3 are the daylight presence bands.
// Cargo-fail in daylight uses the closest tier. Never "you're safe." Never "zombies."
const ACT_REVEAL = [
  "The Quiet are still out there. Farther now. Not gone.",
  "The Quiet are still out there. They didn't leave the streets.",
  "The Quiet are closer. The next road already has them.",
  "Daylight didn't hide you. The Quiet closed in. They're closer still.",
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function tierOf(presence) {
  const p = num(presence);
  if (p >= COLLAPSE_AT) return 4;
  for (const row of TIER) {
    if (p <= row.max) return row.tier;
  }
  return 3;
}

function loudDelta(delta, opts) {
  const d = { ...(delta || {}) };
  if (opts && (opts.correct || opts.timedOut || opts.dossier)) return d;
  if (num(d.noise) < WRONG_NOISE_FLOOR) d.noise = WRONG_NOISE_FLOOR;
  return d;
}

function addedFrom(delta, _timedOut) {
  const d = delta || {};
  // The Quiet only notice noise. Light and yaw still cost cargo. Timeout is not loud.
  return Math.max(0, num(d.noise));
}

function dispatchFor(delta, timedOut) {
  if (timedOut) return "KILO. Ledger. You froze. The world didn't. You are dark. Copy.";
  const d = delta || {};
  const noise = Math.max(0, num(d.noise));
  const light = Math.max(0, num(d.light));
  const yaw = Math.max(0, num(d.yaw));
  if (light >= noise && light >= yaw && light > 0) {
    return "KILO. Ledger. You lit them. Glass is marked. You are dark. Copy.";
  }
  if (yaw >= noise && yaw > 0) {
    return "KILO. Ledger. You broke the line. They're on you. You are dark. Copy.";
  }
  return "KILO. Ledger. You went loud. They're on the glass. You are dark. Copy.";
}

function floorPresence(presence) {
  return Math.max(PRESENCE_FLOOR, num(presence));
}

function applyFear(state, delta, opts) {
  const next = { ...(state || {}) };
  const timedOut = Boolean(opts && opts.timedOut);
  const correct = Boolean(opts && opts.correct);
  const add = addedFrom(delta, timedOut);
  let presence = num(next.presence) + add;
  if (correct && add === 0) presence -= CLEAN_DECAY;
  const peaked = presence;
  let quiet = false;
  if (presence >= COLLAPSE_AT) {
    quiet = true;
    presence = AFTER_COLLAPSE;
    next.handprints = true;
    next.drew = num(next.drew) + 1;
  }
  presence = floorPresence(presence);
  next.presence = presence;
  next.max_presence = Math.max(num(next.max_presence), peaked, presence);
  if (tierOf(presence) >= 3) next.handprints = true;
  return { state: next, quiet, add };
}

function publicFear(state) {
  const s = state || {};
  const presence = floorPresence(s.presence);
  return {
    presence,
    tier: tierOf(presence),
    handprints: Boolean(s.handprints),
  };
}

function daylightFail(state) {
  const s = state || {};
  return Boolean(s.fail_kind === "cargo" || s.cargo_fail_reason || num(s.drew) > 0);
}

function actRevealTier(state) {
  if (daylightFail(state)) return 3;
  return Math.min(3, tierOf(state && state.presence));
}

function actRevealCopy(state) {
  return ACT_REVEAL[actRevealTier(state)] || ACT_REVEAL[0];
}

// First card of an act after I. Text-only; caller shows once. No new cards.
function actBoundaryReveal(card, answersInAct, fearState, opts) {
  if (!card || card.act === "I") return null;
  if (opts && (opts.pending || opts.recap || opts.hold || opts.review)) return null;
  if ((Number(answersInAct) || 0) > 0) return null;
  return actRevealCopy(fearState);
}

module.exports = {
  COLLAPSE_AT,
  AFTER_COLLAPSE,
  TIMED_WEIGHT,
  CLEAN_DECAY,
  WRONG_NOISE_FLOOR,
  PRESENCE_FLOOR,
  ACT_REVEAL,
  tierOf,
  addedFrom,
  loudDelta,
  dispatchFor,
  applyFear,
  publicFear,
  floorPresence,
  actRevealTier,
  actRevealCopy,
  actBoundaryReveal,
};
