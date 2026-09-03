"use strict";

/**
 * Hash every cards/*.png (encoded the same way seed writes WebP) against
 * Postgres cards.image_bytes. Lists mismatches — the live deck vs the repo.
 *
 *   DATABASE_URL=... node scripts/audit-stills.js [--act III]
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const { Pool } = require("pg");

const ROOT = path.join(__dirname, "..");
const CARDS = path.join(ROOT, "cards");
const ENCODE = path.join(__dirname, "encode-still.py");

function sslOption(url) {
  const u = String(url || "");
  if (!u) return false;
  if (u.includes("railway.internal") || u.includes("localhost") || u.includes("127.0.0.1")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function encodeStill(pngPath) {
  const dest = path.join(os.tmpdir(), path.basename(pngPath, ".png") + ".audit.webp");
  const run = spawnSync("python3", [ENCODE, pngPath, dest], { encoding: "utf8" });
  if (run.status !== 0 || !fs.existsSync(dest)) {
    const err = (run.stderr || run.stdout || "").trim();
    throw new Error(`webp encode failed for ${path.basename(pngPath)}${err ? ": " + err : ""}`);
  }
  const bytes = fs.readFileSync(dest);
  try {
    fs.unlinkSync(dest);
  } catch {
    /* tmp */
  }
  return bytes;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — cannot compare Postgres to repo.");
    process.exit(2);
  }
  const act = process.argv.includes("--act")
    ? process.argv[process.argv.indexOf("--act") + 1]
    : null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslOption(process.env.DATABASE_URL),
    max: 2,
  });
  try {
    const { rows } = await pool.query(
      act
        ? `SELECT card_id, length(image_bytes) AS bytes, md5(image_bytes) AS hash
             FROM cards WHERE act = $1 ORDER BY card_id`
        : `SELECT card_id, length(image_bytes) AS bytes, md5(image_bytes) AS hash
             FROM cards ORDER BY card_id`,
      act ? [act] : []
    );
    const db = new Map(rows.map((r) => [r.card_id, r]));
    const files = fs
      .readdirSync(CARDS)
      .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.png$/.test(f))
      .sort();
    const mismatch = [];
    const missingDb = [];
    const missingFile = [];
    const ok = [];
    for (const f of files) {
      const id = f.replace(/\.png$/i, "");
      if (act && !id.startsWith(act + "-")) continue;
      const row = db.get(id);
      if (!row || !row.hash) {
        missingDb.push(id);
        continue;
      }
      const webp = encodeStill(path.join(CARDS, f));
      const hash = md5(webp);
      if (hash !== row.hash) {
        mismatch.push({
          card_id: id,
          repo_webp_md5: hash,
          db_md5: row.hash,
          repo_bytes: webp.length,
          db_bytes: Number(row.bytes),
        });
      } else {
        ok.push(id);
      }
    }
    for (const id of db.keys()) {
      if (act && !id.startsWith(act + "-")) continue;
      if (!fs.existsSync(path.join(CARDS, id + ".png"))) missingFile.push(id);
    }
    const report = {
      compared: ok.length + mismatch.length,
      match: ok.length,
      mismatch: mismatch.length,
      in_repo_not_db: missingDb,
      in_db_not_repo: missingFile,
      mismatches: mismatch,
    };
    console.log(JSON.stringify(report, null, 2));
    if (mismatch.length || missingDb.length) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
