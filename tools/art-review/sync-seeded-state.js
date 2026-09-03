"use strict";

/**
 * Reconcile take names and clear impossible board states.
 * Does NOT issue PASS. Human tags stay. Cards with no human tag → UNREVIEWED.
 *
 *   node tools/art-review/sync-seeded-state.js [--act III] [--dry-run]
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..", "..");
const CARDS = path.join(ROOT, "cards");
const TAKES_DIR = path.join(CARDS, "takes");
const STATE_PATH = path.join(CARDS, "art-review-state.json");
const TAKE_FILE_RE = /^((?:I|II|III|IV|V|VI|VII)-\d{3})(?:-([a-z]+))?-take-(\d+)\.png$/i;

const IMPOSSIBLE = [
  /\s*Waiting muted 390px\.?\s*Do not seed until a human pass\.?/gi,
  /\s*Do not seed until a human pass\.?/gi,
  /\bungenerated\b/gi,
];

const HUMAN_TAGS = new Set([
  "PASS",
  "CARD_BROKEN",
  "WRONG_CAMERA",
  "READ_MISSING",
  "GEOMETRY_WRONG",
  "CANON_DRIFT",
  "INVENTED",
  "COPY",
  "STYLE",
]);

function humanTag(raw) {
  const t = String(raw || "").trim().toUpperCase();
  return HUMAN_TAGS.has(t) ? t : null;
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return sha256(fs.readFileSync(p));
}

function listTakeKeys(id) {
  const keys = [];
  if (!fs.existsSync(TAKES_DIR)) return keys;
  for (const f of fs.readdirSync(TAKES_DIR)) {
    const m = f.match(TAKE_FILE_RE);
    if (!m) continue;
    if (m[1].toUpperCase() !== id) continue;
    const batch = m[2] ? m[2].toLowerCase() : "";
    const n = Number(m[3]);
    const key = (batch ? batch + "-take-" : "take-") + n;
    keys.push({ key, file: path.join(TAKES_DIR, f) });
  }
  return keys;
}

function reconcilePick(id, prevPick) {
  const live = path.join(CARDS, id + ".png");
  const liveHash = fileHash(live);
  const takes = listTakeKeys(id);
  if (liveHash) {
    for (const t of takes) {
      if (fileHash(t.file) === liveHash) return t.key;
    }
    if (prevPick === "live") return "live";
    const named = takes.find((t) => t.key === prevPick);
    if (named) return "live";
    return "live";
  }
  if (prevPick && takes.some((t) => t.key === prevPick)) return prevPick;
  return prevPick || "";
}

function clearImpossibleNote(note) {
  let n = String(note || "");
  for (const re of IMPOSSIBLE) n = n.replace(re, "");
  return n.replace(/\s{2,}/g, " ").trim();
}

function cardIds(act) {
  return fs
    .readdirSync(CARDS)
    .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CARDS, f), "utf8")))
    .filter((c) => String(c.act) === String(act))
    .map((c) => c.card_id)
    .sort();
}

function main() {
  const act = process.argv.includes("--act")
    ? process.argv[process.argv.indexOf("--act") + 1]
    : "III";
  const dry = process.argv.includes("--dry-run");
  const now = new Date().toISOString();
  const prev = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const prevV = prev.verdicts || {};
  const ids = cardIds(act);
  const verdicts = {};
  const changes = [];
  for (const card_id of ids) {
    const old = prevV[card_id] || {};
    const tag = humanTag(old.tag);
    const note = clearImpossibleNote(old.note);
    const pick = reconcilePick(card_id, old.pick);
    const next = {
      tag: tag || "UNREVIEWED",
      note,
      pick,
      updated_at: old.updated_at || now,
    };
    if (old.caveat) next.caveat = old.caveat;
    if (card_id === "III-025" && !next.caveat) {
      next.caveat = "Accepted with logged caveat: four face-critical takes vs pack/12 eight-take policy (pack/27).";
    }
    const prevTag = humanTag(old.tag) || "UNREVIEWED";
    if (next.tag !== prevTag || pick !== (old.pick || "") || note !== (old.note || "").trim()) {
      changes.push({
        card_id,
        tag: [old.tag, next.tag],
        pick: [old.pick, pick],
      });
    }
    verdicts[card_id] = next;
  }
  const body = {
    act,
    cursor: prev.cursor || ids[0] || "",
    verdicts,
  };
  if (dry) {
    console.log(JSON.stringify({ changes, counts: count(verdicts) }, null, 2));
    return;
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(body, null, 2) + "\n");
  console.log("wrote", STATE_PATH);
  console.log("counts", count(verdicts));
  if (changes.length) {
    console.log("reconciled", changes.length);
    for (const c of changes) {
      console.log(
        " ",
        c.card_id,
        "tag",
        c.tag[0],
        "→",
        c.tag[1],
        "pick",
        c.pick[0] || "(none)",
        "→",
        c.pick[1] || "(none)"
      );
    }
  }
}

function count(verdicts) {
  const c = {};
  for (const v of Object.values(verdicts)) {
    const t = v.tag || "UNREVIEWED";
    c[t] = (c[t] || 0) + 1;
  }
  return c;
}

main();
