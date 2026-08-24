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
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
}

module.exports = { pool, query, migrate };
