"use strict";

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function sslOption(url) {
  const u = String(url || "");
  if (!u) return false;
  if (u.includes("railway.internal") || u.includes("localhost") || u.includes("127.0.0.1")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslOption(process.env.DATABASE_URL),
  max: 8,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  await pool.query(`
    DROP TABLE IF EXISTS card_events CASCADE;
    DROP TABLE IF EXISTS student_progress CASCADE;
    DROP TABLE IF EXISTS pending_logins CASCADE;
  `);
  const oldSessions = await pool.query(`
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'person_id'
  `);
  if (oldSessions.rowCount) {
    await pool.query(`DROP TABLE IF EXISTS sessions CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS parent_students CASCADE`);
  }
  const oldLinks = await pool.query(`
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'parent_students' AND column_name = 'invite_sms_status'
  `);
  if (oldLinks.rowCount) {
    await pool.query(`DROP TABLE IF EXISTS parent_students CASCADE`);
  }
  await pool.query(`DROP TABLE IF EXISTS people CASCADE`);
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  await pool.query(`
    ALTER TABLE runs ADD COLUMN IF NOT EXISTS callback_debts JSONB NOT NULL DEFAULT '[]'::jsonb
  `);
  await pool.query(`
    ALTER TABLE run_answers ADD COLUMN IF NOT EXISTS ms_on_outcome INTEGER
  `);
  await pool.query(`DELETE FROM pending_links WHERE created_at < now() - interval '30 days'`);
}

module.exports = { pool, query, migrate };
