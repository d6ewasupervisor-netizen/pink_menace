"use strict";

const ACT = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };

/** Play order. II-000 opens Act II (seq 2000). II-029 and II-030 sit between II-020 and II-021 without renaming seeded IDs. */
function seqFromCard(raw) {
  if (raw && Number.isInteger(raw.seq)) return raw.seq;
  const id = typeof raw === "string" ? raw : raw && raw.card_id;
  const [act, num] = String(id || "").split("-");
  const actN = ACT[act] || 0;
  const n = Number(num || 0);
  if (act === "II") {
    if (n === 29) return 2021;
    if (n === 30) return 2022;
    if (n >= 21 && n <= 28) return 2000 + n + 2;
  }
  return actN * 1000 + n;
}

module.exports = { seqFromCard };
