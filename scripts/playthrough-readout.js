"use strict";

const { pool } = require("../src/db");

const SKIM_MS = 6000;
const LOT_SKIM_MS = 4000;
const LOT_IDS = ["I-005", "I-006", "I-007", "I-008"];

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
    `SELECT a.card_id, a.attempt_no, a.option_id, a.was_correct, a.ms_to_answer, a.ms_on_scene, a.ms_on_outcome, a.created_at,
            c.seq, c.title, c.scene, c.debrief, c.card_type, c.callback_of, c.schedules_callback, length(c.scene) AS scene_chars
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
  const sceneMs = rows.map((r) => r.ms_on_scene).filter((n) => n != null);
  console.log("median ms_to_answer", med, med != null && med < SKIM_MS ? "SKIM (under 6s)" : "ok or empty");
  console.log("median ms_on_scene", median(sceneMs), `(${sceneMs.length}/${rows.length} with scene dwell)`);
  console.log("median ms_on_outcome", median(dwell), `(${dwell.length}/${rows.length} continued)`);
  console.log(
    [
      "card".padEnd(8),
      "scene".padStart(6),
      "cardms".padStart(6),
      "out".padStart(6),
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
        String(r.ms_on_scene ?? "-").padStart(6),
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

  const lot = LOT_IDS.map((id) => rows.find((r) => r.card_id === id)).filter(Boolean);
  console.log("\nDOL lot — scene dwell is the number. Under 4s a card means she did not see it.");
  if (!lot.length) {
    console.log("  I-005 through I-008 not on this run");
  } else {
    const { rows: priorMyaRows } = await pool.query(
      `SELECT 1
         FROM run_answers a
         JOIN runs r ON r.id = a.run_id
        WHERE r.student_id = (SELECT student_id FROM runs WHERE id = $1)
          AND a.card_id = 'III-002'
          AND a.created_at <= $2
        LIMIT 1`,
      [runId, lot[lot.length - 1].created_at]
    );
    const priorMya = priorMyaRows.length > 0;
    console.log(priorMya ? "  reveal: backward — she already saw Mya on the dash" : "  reveal: forward");
    for (const r of lot) {
      const scene = r.ms_on_scene;
      const cardMs = r.ms_to_answer;
      const skim = (scene != null && scene < LOT_SKIM_MS) || (cardMs != null && cardMs < LOT_SKIM_MS);
      const opt = r.card_id === "I-007" ? `  option ${r.option_id}` : r.option_id && r.option_id !== "continue" ? `  option ${r.option_id}` : "";
      console.log(
        `  ${r.card_id}  scene ${scene == null ? "-" : Math.round(scene / 1000) + "s"}  card ${cardMs == null ? "-" : Math.round(cardMs / 1000) + "s"}${opt}${skim ? "  SKIM" : ""}`
      );
    }
  }
  const { rows: runRows } = await pool.query(
    `SELECT id, status, state
       FROM runs
      WHERE id = $1 OR student_id = (SELECT student_id FROM runs WHERE id = $1)
      ORDER BY updated_at DESC`,
    [runId]
  );
  const live = runRows.find((r) => r.id === runId) || runRows[0];
  const failed = runRows.find((r) => r.state && r.state.fail_reason);
  const maxPresence = live && live.state ? Number(live.state.max_presence) : null;
  const failReason = (failed && failed.state && failed.state.fail_reason) || null;
  const { rows: lines } = await pool.query(
    `SELECT card_id, line_index, ms_at
       FROM run_line_advances
      WHERE run_id = $1
      ORDER BY created_at, line_index`,
    [runId]
  );
  console.log("\ncolumns");
  console.log("  scene dwell     ", sceneMs.length ? "on the answer" : "none yet");
  console.log("  max presence    ", maxPresence == null ? "-" : maxPresence);
  console.log("  cargo-fail      ", failReason || "none");
  if (!lines.length) console.log("  line advances   none");
  else {
    console.log("  line advances");
    for (const line of lines) {
      console.log(`    ${line.card_id}  line ${line.line_index}  ${Math.round(line.ms_at / 1000)}s`);
    }
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
