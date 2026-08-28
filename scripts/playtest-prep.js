"use strict";

const { Client } = require("pg");

const PARENT = process.env.PARENT_PHONE || "+15095727660";
const STUDENT = process.env.STUDENT_PHONE || "+15099199471";

async function main() {
  const c = new Client({
    connectionString: process.env.PM_PG || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  try {
    const { rows: parents } = await c.query(
      `SELECT id, display_name FROM users WHERE phone_e164 = $1 AND role = 'parent'`,
      [PARENT]
    );
    const { rows: students } = await c.query(
      `SELECT id, display_name FROM users WHERE phone_e164 = $1 AND role = 'student'`,
      [STUDENT]
    );
    if (!parents[0] || !students[0]) {
      throw new Error("parent or student user missing — run live-gate-test first");
    }
    const parentId = parents[0].id;
    const studentId = students[0].id;

    await c.query(`DELETE FROM run_answers a USING runs r WHERE a.run_id = r.id AND r.student_id = $1`, [
      studentId,
    ]);
    await c.query(`DELETE FROM runs WHERE student_id = $1`, [studentId]);
    await c.query(`DELETE FROM coverage_log WHERE student_id = $1`, [studentId]);

    const { rows: link } = await c.query(
      `SELECT 1 FROM parent_students WHERE parent_id = $1 AND student_id = $2`,
      [parentId, studentId]
    );
    if (!link.length) {
      await c.query(`INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`, [
        parentId,
        studentId,
      ]);
      console.log("restored parent link");
    }

    const { rows: run } = await c.query(
      `INSERT INTO runs (id, student_id, status, current_attempt_no, start_seq)
       VALUES (gen_random_uuid(), $1, 'active', 1, 0)
       RETURNING id`,
      [studentId]
    );
    const { rows: first } = await c.query(
      `SELECT card_id FROM cards ORDER BY seq ASC, card_id ASC LIMIT 1`
    );
    await c.query(`UPDATE runs SET current_card_id = $1, updated_at = now() WHERE id = $2`, [
      first[0].card_id,
      run[0].id,
    ]);

    console.log("playtest ready");
    console.log("student", students[0].display_name, STUDENT.slice(-4));
    console.log("parent", parents[0].display_name, PARENT.slice(-4));
    console.log("run", run[0].id.slice(0, 8));
    console.log("start", first[0].card_id);
    console.log("url", "https://ali.tactag.app");
  } finally {
    await c.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
