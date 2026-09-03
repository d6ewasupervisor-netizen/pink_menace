"use strict";

const TAGS = [
  { id: "UNREVIEWED", bucket: "open", writerFirst: false },
  { id: "PASS", bucket: "pass", writerFirst: false },
  { id: "CARD_BROKEN", bucket: "rewrite", writerFirst: true },
  { id: "WRONG_CAMERA", bucket: "camera", writerFirst: true },
  { id: "READ_MISSING", bucket: "recompile", writerFirst: false },
  { id: "GEOMETRY_WRONG", bucket: "recompile", writerFirst: false },
  { id: "CANON_DRIFT", bucket: "recompile", writerFirst: false },
  { id: "INVENTED", bucket: "recompile", writerFirst: false },
  { id: "COPY", bucket: "copy", writerFirst: false },
  { id: "STYLE", bucket: "style", writerFirst: false },
];

const TAG_IDS = new Set(TAGS.map((t) => t.id));
const BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]));

function normalizeTag(raw) {
  if (!raw || raw === "open") return null;
  if (raw === "pass") return "PASS";
  if (raw === "fix") return null;
  const id = String(raw).toUpperCase();
  return TAG_IDS.has(id) ? id : null;
}

function bucketOf(tag) {
  const t = BY_ID[tag];
  return t ? t.bucket : "open";
}

function emptyCounts() {
  return { pass: 0, rewrite: 0, camera: 0, recompile: 0, copy: 0, style: 0, open: 0 };
}

function countBuckets(rows) {
  const counts = emptyCounts();
  for (const row of rows) {
    const b = row.tag ? bucketOf(row.tag) : "open";
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

function formatCounts(counts) {
  return (
    counts.pass +
    " pass · " +
    counts.rewrite +
    " rewrite · " +
    counts.camera +
    " camera · " +
    counts.recompile +
    " recompile · " +
    counts.copy +
    " copy · " +
    counts.style +
    " style · " +
    counts.open +
    " open"
  );
}

function writerFirst(tag) {
  return Boolean(BY_ID[tag] && BY_ID[tag].writerFirst);
}

module.exports = {
  TAGS,
  TAG_IDS,
  BY_ID,
  normalizeTag,
  bucketOf,
  emptyCounts,
  countBuckets,
  formatCounts,
  writerFirst,
};
