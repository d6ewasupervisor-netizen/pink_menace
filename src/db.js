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
  await pool.query(`
    ALTER TABLE runs ADD COLUMN IF NOT EXISTS start_seq INTEGER NOT NULL DEFAULT 0
  `);
  await pool.query(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT conname FROM pg_constraint
         WHERE conrelid = 'runs'::regclass AND contype = 'c'
           AND pg_get_constraintdef(oid) ILIKE '%status%'
      LOOP
        EXECUTE 'ALTER TABLE runs DROP CONSTRAINT ' || quote_ident(r.conname);
      END LOOP;
      ALTER TABLE runs ADD CONSTRAINT runs_status_check
        CHECK (status IN ('active', 'completed', 'failed', 'abandoned'));
    END $$;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS run_peeks (
      id UUID PRIMARY KEY,
      run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL REFERENCES cards(card_id),
      option_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    DELETE FROM run_answers a
     USING run_answers b
     WHERE a.run_id = b.run_id
       AND a.card_id = b.card_id
       AND a.ctid < b.ctid
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS run_answers_one_per_card
      ON run_answers (run_id, card_id)
  `);
  await pool.query(`DELETE FROM pending_links WHERE created_at < now() - interval '30 days'`);
}

module.exports = { pool, query, migrate };
