"use strict";

const TIER = [
  { max: 3, tier: 0 },
  { max: 8, tier: 1 },
  { max: 14, tier: 2 },
  { max: 22, tier: 3 },
];

const COLLAPSE_AT = 23;
const AFTER_COLLAPSE = 16;
const TIMED_WEIGHT = 3;
const CLEAN_DECAY = 2;

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

function addedFrom(delta, timedOut) {
  const d = delta || {};
  return (
    Math.max(0, num(d.noise)) +
    Math.max(0, num(d.light)) +
    Math.max(0, num(d.yaw)) +
    (timedOut ? TIMED_WEIGHT : 0)
  );
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

function applyFear(state, delta, opts) {
  const next = { ...(state || {}) };
  const timedOut = Boolean(opts && opts.timedOut);
  const correct = Boolean(opts && opts.correct);
  const add = addedFrom(delta, timedOut);
  let presence = num(next.presence) + add;
  if (correct && add === 0) presence = Math.max(0, presence - CLEAN_DECAY);
  next.presence = presence;
  if (tierOf(presence) >= 3) next.handprints = true;
  let collapse = false;
  let dispatch = null;
  if (presence >= COLLAPSE_AT) {
    collapse = true;
    dispatch = dispatchFor(delta, timedOut);
    next.presence = AFTER_COLLAPSE;
    next.handprints = true;
    next.drew = num(next.drew) + 1;
  }
  return { state: next, collapse, dispatch, add };
}

function publicFear(state) {
  const s = state || {};
  const presence = num(s.presence);
  return {
    presence,
    tier: tierOf(presence),
    handprints: Boolean(s.handprints),
  };
}

module.exports = {
  COLLAPSE_AT,
  AFTER_COLLAPSE,
  TIMED_WEIGHT,
  CLEAN_DECAY,
  tierOf,
  addedFrom,
  dispatchFor,
  applyFear,
  publicFear,
};
