"use strict";

const { Client } = require("pg");

const STUDENT = process.env.STUDENT_PHONE || "+15099199471";

async function main() {
  const c = new Client({
    connectionString: process.env.PM_PG,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const users = await c.query(
    `SELECT role, display_name, right(phone_e164, 4) AS last4 FROM users ORDER BY created_at`
  );
  console.log("users", JSON.stringify(users.rows));
  const links = await c.query(`SELECT count(*)::int AS n FROM parent_students`);
  console.log("links", links.rows[0].n);
  const cards = await c.query(`SELECT card_id FROM cards ORDER BY seq`);
  console.log("cards", cards.rows.map((r) => r.card_id).join(","));
  await c.query(
    `DELETE FROM run_answers a
      USING runs r, users u
      WHERE a.run_id = r.id AND r.student_id = u.id AND u.phone_e164 = $1`,
    [STUDENT]
  );
  await c.query(`DELETE FROM runs r USING users u WHERE r.student_id = u.id AND u.phone_e164 = $1`, [
    STUDENT,
  ]);
  await c.query(
    `DELETE FROM coverage_log cl USING users u WHERE cl.student_id = u.id AND u.phone_e164 = $1`,
    [STUDENT]
  );
  console.log("reset student runs (parent link kept — use playtest-prep.js for fresh II-001)");
  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
