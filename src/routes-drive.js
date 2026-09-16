"use strict";

/**
 * Quiet Roads — the 3D drive at /drive.
 * Same session cookie as the card game; its own tables. Card answers made in the
 * drive are recorded in drive_card_answers and mirrored into coverage_log with
 * hours = 0 so they show on the parent log. Nothing here writes runs or run_answers.
 */

const express = require("express");
const crypto = require("crypto");
const { query } = require("./db");
const { appKind } = require("./host");
const auth = require("./auth");
const { jsonError } = require("./routes-auth");
const { publicCard, dayNight } = require("./game");

const EVENT_BATCH_MAX = 50;
const ATTEMPT_BATCH_MAX = 50;

function driveEnabled() {
  return /^(1|true|yes)$/i.test(String(process.env.DRIVE_ENABLED || "").trim());
}

async function student(req, res) {
  if (appKind(req) !== "game") { jsonError(res, 404, "Not found."); return null; }
  if (!driveEnabled()) { jsonError(res, 404, "Not found."); return null; }
  return auth.requireRole(req, res, "student");
}

function clampInt(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function tsOf(v) {
  const n = Number(v);
  if (Number.isFinite(n) && n > 1e12 && n < 4e12) return new Date(n);
  const d = new Date(String(v || ""));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function mountDrive(app) {
  // The save can exceed the global 64 kb JSON limit (351 mastery rows); this one route gets more.
  const bigJson = express.json({ limit: "512kb" });

  // ---------------------------------------------------------------- progress
  app.get("/api/drive/progress", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    try {
      const { rows } = await query(`SELECT * FROM drive_progress WHERE student_id = $1`, [session.userId]);
      const p = rows[0];
      if (!p) return res.json({ ok: true, progress: null });
      return res.json({
        ok: true,
        progress: {
          sceneId: p.scene_id,
          checkpoint: p.checkpoint,
          vars: p.vars,
          flags: p.flags,
          items: p.items,
          unlocks: p.unlocks,
          mastery: p.mastery,
          runnerState: p.runner_state,
          placeholders: p.placeholders,
          clientUpdatedAt: p.client_updated_at ? p.client_updated_at.getTime() : null,
          updatedAt: p.updated_at.getTime(),
        },
      });
    } catch (err) {
      console.error("drive progress read", err);
      return jsonError(res, 500, "Could not read progress.");
    }
  });

  app.put("/api/drive/progress", bigJson, async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const b = req.body || {};
    const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
    const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 500) : []);
    try {
      await query(
        `INSERT INTO drive_progress
           (student_id, scene_id, checkpoint, vars, flags, items, unlocks, mastery, runner_state, placeholders, client_updated_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
         ON CONFLICT (student_id) DO UPDATE SET
           scene_id = EXCLUDED.scene_id, checkpoint = EXCLUDED.checkpoint, vars = EXCLUDED.vars,
           flags = EXCLUDED.flags, items = EXCLUDED.items, unlocks = EXCLUDED.unlocks,
           mastery = EXCLUDED.mastery, runner_state = EXCLUDED.runner_state,
           placeholders = EXCLUDED.placeholders, client_updated_at = EXCLUDED.client_updated_at, updated_at = now()`,
        [
          session.userId,
          b.sceneId ? String(b.sceneId).slice(0, 32) : null,
          b.checkpoint ? String(b.checkpoint).slice(0, 64) : null,
          JSON.stringify(obj(b.vars)),
          JSON.stringify(obj(b.flags)),
          JSON.stringify(arr(b.items)),
          JSON.stringify(arr(b.unlocks)),
          JSON.stringify(obj(b.mastery)),
          b.runnerState ? JSON.stringify(b.runnerState) : null,
          JSON.stringify(obj(b.placeholders)),
          b.clientUpdatedAt ? tsOf(b.clientUpdatedAt) : new Date(),
        ]
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("drive progress write", err);
      return jsonError(res, 500, "Could not save progress.");
    }
  });

  app.post("/api/drive/reset", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    try {
      await query(`DELETE FROM drive_progress WHERE student_id = $1`, [session.userId]);
      return res.json({ ok: true });
    } catch (err) {
      return jsonError(res, 500, "Could not reset.");
    }
  });

  // ---------------------------------------------------------------- telemetry
  app.post("/api/drive/events", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const rows = Array.isArray(req.body && req.body.events) ? req.body.events.slice(0, EVENT_BATCH_MAX) : [];
    if (!rows.length) return res.json({ ok: true, accepted: 0 });
    try {
      const values = [];
      const params = [];
      rows.forEach((e, i) => {
        const base = i * 4;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
        params.push(session.userId, tsOf(e.ts), String(e.event || "").slice(0, 96), e.data ? JSON.stringify(e.data).slice(0, 2000) : null);
      });
      await query(`INSERT INTO drive_events (student_id, ts, event, data) VALUES ${values.join(",")}`, params);
      return res.json({ ok: true, accepted: rows.length });
    } catch (err) {
      console.error("drive events", err);
      return jsonError(res, 500, "Could not record events.");
    }
  });

  app.post("/api/drive/attempts", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const rows = Array.isArray(req.body && req.body.attempts) ? req.body.attempts.slice(0, ATTEMPT_BATCH_MAX) : [];
    if (!rows.length) return res.json({ ok: true, accepted: 0 });
    try {
      const values = [];
      const params = [];
      rows.forEach((a, i) => {
        const base = i * 7;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`);
        params.push(session.userId, tsOf(a.ts), String(a.question_id || "").slice(0, 32), clampInt(a.chapter, 1, 8), !!a.correct, clampInt(a.chosen, 0, 9), clampInt(a.response_ms, 0, 600000));
      });
      await query(`INSERT INTO drive_attempts (student_id, ts, question_id, chapter, correct, chosen, response_ms) VALUES ${values.join(",")}`, params);
      return res.json({ ok: true, accepted: rows.length });
    } catch (err) {
      console.error("drive attempts", err);
      return jsonError(res, 500, "Could not record attempts.");
    }
  });

  // ---------------------------------------------------------------- cards
  app.get("/api/drive/card/:cardId", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const cardId = String(req.params.cardId || "").slice(0, 16);
    try {
      const card = await publicCard(cardId);
      if (!card) return jsonError(res, 404, "No such card.");
      // Text and options only. Grading lives in POST /api/drive/card-answers; the key never leaves the server.
      const { rows: options } = await query(
        `SELECT option_id, option_text FROM card_options WHERE card_id = $1 ORDER BY option_id ASC`,
        [cardId]
      );
      const { rows: src } = await query(`SELECT psdp_skill, dol_section, teaching_target FROM cards WHERE card_id = $1`, [cardId]);
      return res.json({
        ok: true,
        card: {
          ...card,
          image_url: card.image_url ? `/api/drive/image/${encodeURIComponent(cardId)}` : null,
          options: options.map((o) => ({ id: o.option_id, text: o.option_text })),
          source: src[0] || null,
        },
      });
    } catch (err) {
      console.error("drive card", cardId, err);
      return jsonError(res, 500, "Could not load card.");
    }
  });

  // Any card's image for a signed-in student. The run-gated /api/run/image stays as is.
  app.get("/api/drive/image/:cardId", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const cardId = String(req.params.cardId || "").replace(/\.(png|jpe?g|webp)$/i, "").slice(0, 16);
    try {
      const { rows } = await query(`SELECT image_bytes, image_mime FROM cards WHERE card_id = $1`, [cardId]);
      const row = rows[0];
      if (!row || !row.image_bytes) return res.status(404).end();
      res.setHeader("content-type", row.image_mime || "image/webp");
      res.setHeader("cache-control", "private, max-age=604800");
      return res.send(row.image_bytes);
    } catch (err) {
      return jsonError(res, 500, "Could not load image.");
    }
  });

  /**
   * The client sends its pick; the server grades it. Response carries was_correct, result,
   * state_delta and the debrief so the client can show the outcome without ever holding the key.
   * Dossiers/beats (no option_id) are recorded as seen and not graded.
   */
  app.post("/api/drive/card-answers", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    const a = req.body || {};
    const cardId = String(a.card_id || "").slice(0, 16);
    if (!cardId) return jsonError(res, 400, "card_id required.");
    try {
      const { rows: cards } = await query(
        `SELECT card_id, act, zone, psdp_skill, dol_section, location_type, weather, time_of_day, debrief FROM cards WHERE card_id = $1`,
        [cardId]
      );
      const card = cards[0];
      if (!card) return jsonError(res, 404, "No such card.");
      const ts = tsOf(a.ts);
      const optionId = a.option_id ? String(a.option_id).slice(0, 8) : null;
      let wasCorrect = null;
      let graded = null;
      if (optionId) {
        const { rows: opts } = await query(
          `SELECT option_id, is_correct, result, state_delta FROM card_options WHERE card_id = $1 AND option_id = $2`,
          [cardId, optionId]
        );
        const o = opts[0];
        if (!o) return jsonError(res, 400, "No such option.");
        wasCorrect = !!o.is_correct;
        graded = { option_id: o.option_id, was_correct: wasCorrect, result: o.result, state_delta: o.state_delta || {}, debrief: card.debrief || "" };
      }
      await query(
        `INSERT INTO drive_card_answers (student_id, ts, card_id, option_id, was_correct, source, scene_id, ms_to_answer)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [session.userId, ts, cardId, optionId, wasCorrect, a.source === "world" ? "world" : "story", a.scene_id ? String(a.scene_id).slice(0, 32) : null, clampInt(a.ms_to_answer, 0, 600000)]
      );
      // Parent log row: knowledge only, never hours. Simulated driving is not PSDP practice.
      if (wasCorrect !== null) {
        await query(
          `INSERT INTO coverage_log (id, student_id, card_id, practiced_on, location, day_night, weather, psdp_skill, dol_section, act, zone, hours, duration_ms, initials)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,$12,NULL)`,
          [
            crypto.randomUUID(), session.userId, cardId, ts, "drive", dayNight ? dayNight(card.time_of_day) : null,
            card.weather || null, card.psdp_skill || null, card.dol_section || null, card.act, card.zone,
            clampInt(a.ms_to_answer, 0, 600000) || 0,
          ]
        );
      }
      return res.json({ ok: true, graded });
    } catch (err) {
      console.error("drive card answer", err);
      return jsonError(res, 500, "Could not record answer.");
    }
  });

  // ---------------------------------------------------------------- summary (student home tile + parents)
  async function summaryFor(studentId) {
    const { rows: p } = await query(`SELECT scene_id, checkpoint, vars, mastery, updated_at FROM drive_progress WHERE student_id = $1`, [studentId]);
    const prog = p[0];
    const { rows: c } = await query(
      `SELECT count(*)::int AS answered, count(*) FILTER (WHERE was_correct) ::int AS correct FROM drive_card_answers WHERE student_id = $1 AND was_correct IS NOT NULL`,
      [studentId]
    );
    const { rows: q } = await query(
      `SELECT count(*)::int AS attempts, count(*) FILTER (WHERE correct)::int AS correct FROM drive_attempts WHERE student_id = $1`,
      [studentId]
    );
    const { rows: n } = await query(
      `SELECT count(*) FILTER (WHERE event = 'noise.red')::int AS red, count(*) FILTER (WHERE event = 'stop.full')::int AS full_stops,
              count(*) FILTER (WHERE event = 'stop.rolled')::int AS rolled_stops, count(*) FILTER (WHERE event = 'mission.fail.swarm')::int AS swarmed,
              max(ts) AS last_seen
         FROM drive_events WHERE student_id = $1`,
      [studentId]
    );
    const vars = (prog && prog.vars) || {};
    return {
      started: !!prog,
      sceneId: prog ? prog.scene_id : null,
      checkpoint: prog ? prog.checkpoint : null,
      act: prog && prog.scene_id ? Number(String(prog.scene_id).split(".")[0]) : null,
      respect: Number(vars.respect) || 0,
      tradePoints: Number(vars.trade_points) || 0,
      cards: c[0],
      questions: q[0],
      driving: { redNoise: n[0].red, fullStops: n[0].full_stops, rolledStops: n[0].rolled_stops, swarmed: n[0].swarmed, lastSeen: n[0].last_seen },
      updatedAt: prog ? prog.updated_at : null,
    };
  }

  app.get("/api/drive/summary", async (req, res) => {
    const session = await student(req, res);
    if (!session) return;
    try { return res.json({ ok: true, summary: await summaryFor(session.userId) }); }
    catch (err) { console.error("drive summary", err); return jsonError(res, 500, "Could not load summary."); }
  });

  // Parent view of a linked student's drive.
  app.get("/api/parents/students/:id/drive", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    try {
      const { rows } = await query(`SELECT 1 FROM parent_students WHERE parent_id = $1 AND student_id = $2`, [session.userId, req.params.id]);
      if (!rows.length) return jsonError(res, 404, "Not found.");
      const summary = await summaryFor(req.params.id);
      const { rows: recent } = await query(
        `SELECT a.ts, a.card_id, c.title, a.was_correct, a.source FROM drive_card_answers a JOIN cards c ON c.card_id = a.card_id
          WHERE a.student_id = $1 ORDER BY a.ts DESC LIMIT 25`,
        [req.params.id]
      );
      return res.json({ ok: true, summary, recentCards: recent });
    } catch (err) {
      console.error("parent drive", err);
      return jsonError(res, 500, "Could not load drive.");
    }
  });
}

module.exports = { mountDrive, driveEnabled };
