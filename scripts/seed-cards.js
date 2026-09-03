"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { pool } = require("../src/db");
const { loadTables, assertCard } = require("./validate-citations");
const { seqFromCard } = require("./card-seq");

const ENCODE_STILL = path.join(__dirname, "encode-still.py");

function encodeStill(pngPath) {
  const dest = path.join(os.tmpdir(), path.basename(pngPath, path.extname(pngPath)) + ".webp");
  try {
    fs.unlinkSync(dest);
  } catch {
    /* ok */
  }
  const run = spawnSync("python3", [ENCODE_STILL, path.resolve(pngPath), dest], {
    windowsHide: true,
    encoding: "utf8",
  });
  if (run.status !== 0 || !fs.existsSync(dest)) {
    const err = (run.stderr || run.stdout || (run.error && run.error.message) || "").trim();
    throw new Error(
      `webp encode failed for ${path.basename(pngPath)} status=${run.status}${err ? ": " + err : ""}`
    );
  }
  const bytes = fs.readFileSync(dest);
  try {
    fs.unlinkSync(dest);
  } catch {
    // tmp
  }
  return bytes;
}

async function seedFile(filePath, tables) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!raw.card_id) {
    throw new Error(`${path.basename(filePath)}: missing card_id (skip bundles)`);
  }
  assertCard(raw, tables);
  const pngPath = filePath.replace(/\.json$/i, ".png");
  const jpgPath = filePath.replace(/\.json$/i, ".jpg");
  let imageBytes = null;
  let imageMime = null;
  if (fs.existsSync(pngPath)) {
    imageBytes = encodeStill(pngPath);
    imageMime = "image/webp";
  } else if (fs.existsSync(jpgPath)) {
    imageBytes = fs.readFileSync(jpgPath);
    imageMime = "image/jpeg";
  }

  await pool.query(
    `INSERT INTO cards (
       card_id, act, zone, driver, card_type, title, scene, decision, debrief,
       image_bytes, image_mime, psdp_skill, dol_section, teaching_target,
       callback_of, schedules_callback, location_type, weather, time_of_day, seq, extra
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb
     )
     ON CONFLICT (card_id) DO UPDATE SET
       act = EXCLUDED.act, zone = EXCLUDED.zone, driver = EXCLUDED.driver,
       card_type = EXCLUDED.card_type, title = EXCLUDED.title, scene = EXCLUDED.scene,
       decision = EXCLUDED.decision, debrief = EXCLUDED.debrief,
       image_bytes = COALESCE(EXCLUDED.image_bytes, cards.image_bytes),
       image_mime = COALESCE(EXCLUDED.image_mime, cards.image_mime),
       psdp_skill = EXCLUDED.psdp_skill, dol_section = EXCLUDED.dol_section,
       teaching_target = EXCLUDED.teaching_target, callback_of = EXCLUDED.callback_of,
       schedules_callback = EXCLUDED.schedules_callback, location_type = EXCLUDED.location_type,
       weather = EXCLUDED.weather, time_of_day = EXCLUDED.time_of_day, seq = EXCLUDED.seq,
       extra = EXCLUDED.extra`,
    [
      raw.card_id,
      raw.act,
      raw.zone,
      raw.driver,
      raw.card_type,
      raw.title,
      raw.scene,
      raw.decision || null,
      raw.debrief || null,
      imageBytes,
      imageMime,
      raw.source && raw.source.psdp_skill,
      raw.source && raw.source.dol_section,
      raw.source && raw.source.teaching_target,
      raw.callback_of || null,
      Boolean(raw.schedules_callback),
      raw.variation && raw.variation.location_type,
      raw.variation && raw.variation.weather,
      raw.variation && raw.variation.time_of_day,
      seqFromCard(raw),
      JSON.stringify({
        cast: raw.cast || [],
        antagonist: raw.antagonist || null,
        image_brief: raw.image_brief || null,
        source: raw.source || null,
        variation: raw.variation || null,
        timeout_option_id: raw.timeout_option_id || null,
        timeout_ms: raw.timeout_ms || null,
        hook: raw.hook || null,
        ride_along: raw.ride_along || null,
      }),
    ]
  );

  await pool.query(`DELETE FROM card_options WHERE card_id = $1`, [raw.card_id]);
  for (const opt of raw.options || []) {
    await pool.query(
      `INSERT INTO card_options (card_id, option_id, option_text, is_correct, result, state_delta)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        raw.card_id,
        opt.id,
        opt.text,
        Boolean(opt.correct),
        opt.result,
        JSON.stringify(opt.state_delta || {}),
      ]
    );
  }
  return raw.card_id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const dir = path.join(__dirname, "..", "cards");
  const tables = loadTables();
  const wanted = new Set(
    process.argv.slice(2).map((id) => id.replace(/\.json$/i, "").toUpperCase())
  );
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
    .filter((f) => !wanted.size || wanted.has(f.replace(/\.json$/i, "").toUpperCase()))
    .sort();
  if (wanted.size && files.length !== wanted.size) {
    const got = new Set(files.map((f) => f.replace(/\.json$/i, "").toUpperCase()));
    const missing = [...wanted].filter((id) => !got.has(id));
    throw new Error(`unknown card id(s): ${missing.join(", ")}`);
  }
  if (!files.length) throw new Error("no card json in cards/");
  const ids = [];
  for (const f of files) {
    ids.push(await seedFile(path.join(dir, f), tables));
  }
  console.log("seeded", ids.join(", "));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
