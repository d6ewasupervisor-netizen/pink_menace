"use strict";

/**
 * Re-tag cards/art-review-state.json from the seeded deck.
 * With DATABASE_URL: query Postgres for Act III cards that have image_bytes.
 * Without: use the manifest below (last reconciled against seed commits on main).
 *
 *   node tools/art-review/sync-seeded-state.js [--act III] [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const STATE_PATH = path.join(ROOT, "cards", "art-review-state.json");

/** Seeded deck = live in Postgres. pick must match cards/<id>.png or named take. */
const MANIFEST = {
  "III-002": { pick: "live", note: "Parked cab: Mya on dash, clipboard by thermos, cluster at 0." },
  "III-003": { pick: "take-4", note: "Keep-right pass. Seeded." },
  "III-004": { pick: "take-3", note: "Left door mirror, cone lane. Seeded." },
  "III-005": { pick: "live", note: "Van sliver at right window edge; door mirror empty. Seeded." },
  "III-006": { pick: "live", note: "Sign switch / stalk cockpit. Seeded." },
  "III-007": { pick: "live", note: "Gap between pickup and SUV. Seeded." },
  "III-008": { pick: "live", note: "HOV diamond in leftmost lane. Live still is take-1 geometry (note reconciled)." },
  "III-009": { pick: "live", note: "Left door mirror. Seeded." },
  "III-010": { pick: "e-take-1", note: "Street profile, van curb-side. Seeded." },
  "III-011": { pick: "d-take-1", note: "Overhead diagram beside semi trailer. Seeded." },
  "III-012": { pick: "c-take-2", note: "Pass-lane profile. Seeded." },
  "III-013": { pick: "c-take-2", note: "Box truck flank. Seeded." },
  "III-014": { pick: "live", note: "Arrow signal cockpit. Seeded." },
  "III-015": { pick: "live", note: "Two-way left-turn pocket. Seeded." },
  "III-016": { pick: "live", note: "Rumble / lane line. Seeded." },
  "III-017": { pick: "b-take-2", note: "Right mirror sky look. Seeded." },
  "III-018": { pick: "live", note: "Unfinished overlap diagram. Seeded pending art pass." },
  "III-019": { pick: "live", note: "Volunteer in door glass. Seeded." },
  "III-020": { pick: "c-take-1", note: "Rumble straight. Seeded." },
  "III-021": { pick: "e-take-1", note: "Coach blinker across skip-dash. Seeded." },
  "III-022": { pick: "live", note: "Remnant in door glass. Seeded." },
  "III-023": { pick: "b-take-2", note: "Diamond + dump, D4 cab. Seeded." },
  "III-024": { pick: "live", note: "Pickup ahead, night rain. Seeded." },
  "III-025": { pick: "c-take-1", note: "Face-critical portrait; four takes accepted — see pack/27 §3." },
  "III-026": { pick: "b-take-1", note: "Seeded." },
  "III-027": { pick: "live", note: "Tablet on doghouse. Seeded." },
  "III-028": { pick: "b-take-2", note: "Seeded." },
  "III-029": { pick: "live", note: "Chase, right lane empty. Seeded." },
  "III-030": { pick: "b-take-2", note: "Stopped bus, dark skyline. Seeded." },
};

const OPEN = {
  "III-001": {
    tag: "COPY",
    note: "Ride-along script exists (22); watch layer not wired. Opener still unreviewed on this pass.",
    pick: "live",
  },
  "III-018": {
    tag: "READ_MISSING",
    note: "Diagram overlap still weak at 390px. Seeded for playtest; art pass remains open.",
    pick: "live",
  },
};

function sslOption(url) {
  const u = String(url || "");
  if (!u) return false;
  if (u.includes("railway.internal") || u.includes("localhost") || u.includes("127.0.0.1")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

async function seededFromDb(act) {
  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch {
    throw new Error("DATABASE_URL set but pg is not installed — run npm install");
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslOption(process.env.DATABASE_URL),
    max: 2,
  });
  try {
    const { rows } = await pool.query(
      `SELECT card_id FROM cards
        WHERE act = $1 AND image_bytes IS NOT NULL
        ORDER BY card_id`,
      [act]
    );
    return rows.map((r) => r.card_id);
  } finally {
    await pool.end();
  }
}

async function main() {
  const act = process.argv.includes("--act")
    ? process.argv[process.argv.indexOf("--act") + 1]
    : "III";
  const dry = process.argv.includes("--dry-run");
  const now = new Date().toISOString();
  let seededIds = Object.keys(MANIFEST);
  if (process.env.DATABASE_URL) {
    const dbIds = await seededFromDb(act);
    const missing = dbIds.filter((id) => !MANIFEST[id]);
    const extra = seededIds.filter((id) => !dbIds.includes(id));
    if (missing.length) {
      console.warn("manifest missing seeded cards:", missing.join(", "));
    }
    if (extra.length) {
      console.warn("manifest lists unseeded cards:", extra.join(", "));
    }
    seededIds = dbIds.filter((id) => MANIFEST[id] || id.startsWith(act + "-"));
  }
  const verdicts = {};
  for (const card_id of seededIds) {
    const row = MANIFEST[card_id];
    if (!row) continue;
    verdicts[card_id] = {
      tag: "PASS",
      note: row.note,
      pick: row.pick,
      updated_at: now,
    };
  }
  for (const [card_id, row] of Object.entries(OPEN)) {
    if (card_id.startsWith(act + "-")) {
      verdicts[card_id] = { ...row, updated_at: now };
    }
  }
  const body = { act, cursor: "III-030", verdicts };
  if (dry) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(body, null, 2) + "\n");
  console.log("wrote", STATE_PATH, Object.keys(verdicts).length, "verdicts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
