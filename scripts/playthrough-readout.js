"use strict";

const { pool } = require("../src/db");

const SKIM_MS = 6000;

function median(nums) {
  const a = nums.filter((n) => Number.isFinite(n)).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

function words(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const { rows: runs } = await pool.query(
    `SELECT r.id, r.status, r.created_at, r.updated_at, u.display_name, right(u.phone_e164, 4) AS last4
       FROM runs r
       JOIN users u ON u.id = r.student_id
      ORDER BY r.updated_at DESC
      LIMIT 8`
  );
  if (!runs.length) {
    console.log("no runs");
    await pool.end();
    return;
  }
  console.log("recent runs");
  for (const r of runs) {
    console.log(
      `  ${r.id.slice(0, 8)}  ${r.status}  last4=${r.last4}  ${r.display_name}  ${r.updated_at.toISOString()}`
    );
  }
  const runId = process.env.RUN_ID || runs[0].id;
  const { rows } = await pool.query(
    `SELECT a.card_id, a.attempt_no, a.option_id, a.was_correct, a.ms_to_answer, a.ms_on_outcome, a.created_at,
            c.seq, c.title, c.scene, c.debrief, c.callback_of, c.schedules_callback, length(c.scene) AS scene_chars
       FROM run_answers a
       JOIN cards c ON c.card_id = a.card_id
      WHERE a.run_id = $1
      ORDER BY a.created_at, a.attempt_no`,
    [runId]
  );
  console.log("\nattempts", rows.length, "run", runId);
  const ms = rows.map((r) => r.ms_to_answer).filter((n) => n != null);
  const dwell = rows.map((r) => r.ms_on_outcome).filter((n) => n != null);
  const med = median(ms);
  console.log("median ms_to_answer", med, med != null && med < SKIM_MS ? "SKIM (under 6s)" : "ok or empty");
  console.log("median ms_on_outcome", median(dwell), `(${dwell.length}/${rows.length} continued)`);
  console.log(
    [
      "card".padEnd(8),
      "ms".padStart(6),
      "dwell".padStart(6),
      "ok".padStart(3),
      "words".padStart(5),
      "title",
    ].join(" ")
  );
  for (const r of rows) {
    const w = words(r.scene);
    const skim = r.ms_to_answer != null && r.ms_to_answer < SKIM_MS ? " skim" : "";
    console.log(
      [
        String(r.card_id).padEnd(8),
        String(r.ms_to_answer ?? "-").padStart(6),
        String(r.ms_on_outcome ?? "-").padStart(6),
        r.was_correct ? "  y" : "  n",
        String(w).padStart(5),
        `${r.title}${r.callback_of ? `  [callback of ${r.callback_of}]` : ""}${skim}`,
      ].join(" ")
    );
  }
  const c007 = rows.filter((r) => r.card_id === "II-007");
  const c010 = rows.filter((r) => r.card_id === "II-010");
  console.log("\ncallback path");
  if (!c007.length) console.log("  II-007 not answered");
  else {
    const miss = c007.some((r) => !r.was_correct);
    console.log("  II-007", miss ? "missed (should queue II-010)" : "correct (II-010 should not appear)");
  }
  console.log("  II-010", c010.length ? "appeared" : "did not appear");
  console.log("\ncallback feeling is not in this table. Ask afterward without naming it:");
  console.log('  "Did anything in it feel like it remembered you?"');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
