"use strict";

const crypto = require("crypto");
const { query, pool } = require("./db");
const { appKind } = require("./host");
const { initials } = require("./phone");
const auth = require("./auth");
const { jsonError } = require("./routes-auth");
const { publicCard, nextUnansweredCard, dayNight } = require("./game");

async function getOrCreateRun(studentId) {
  const { rows } = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, state
       FROM runs
      WHERE student_id = $1 AND status = 'active'`,
    [studentId]
  );
  if (rows[0]) {
    if (!rows[0].current_card_id) {
      const next = await nextUnansweredCard(rows[0].id);
      if (next) {
        await query(
          `UPDATE runs SET current_card_id = $1, current_attempt_no = 1, updated_at = now() WHERE id = $2`,
          [next.card_id, rows[0].id]
        );
        rows[0].current_card_id = next.card_id;
        rows[0].current_attempt_no = 1;
      }
    }
    return rows[0];
  }
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO runs (id, student_id, status, current_attempt_no)
     VALUES ($1, $2, 'active', 1)`,
    [id, studentId]
  );
  const next = await nextUnansweredCard(id);
  if (next) {
    await query(
      `UPDATE runs SET current_card_id = $1, updated_at = now() WHERE id = $2`,
      [next.card_id, id]
    );
  }
  const created = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, state
       FROM runs WHERE id = $1`,
    [id]
  );
  return created.rows[0];
}

function mountRun(app) {
  app.get("/api/run/current", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const run = await getOrCreateRun(session.userId);
      if (!run.current_card_id) {
        return res.json({ ok: true, done: true, next: { done: true } });
      }
      const card = await publicCard(run.current_card_id);
      if (!card) return res.json({ ok: true, done: true, next: { done: true } });
      return res.json({ ok: true, run_id: run.id, attempt_no: run.current_attempt_no, ...card });
    } catch (err) {
      return jsonError(res, 500, "Could not load card.");
    }
  });

  app.get("/api/run/image", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const run = await getOrCreateRun(session.userId);
      if (!run.current_card_id) return res.status(404).end();
      const { rows } = await query(
        `SELECT image_bytes, image_mime FROM cards WHERE card_id = $1`,
        [run.current_card_id]
      );
      const row = rows[0];
      if (!row || !row.image_bytes) return res.status(404).end();
      res.setHeader("content-type", row.image_mime || "image/jpeg");
      res.setHeader("cache-control", "private, no-store");
      return res.send(row.image_bytes);
    } catch (err) {
      return jsonError(res, 500, "Could not load image.");
    }
  });

  app.post("/api/run/answer", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String((req.body && req.body.card_id) || "");
    const optionId = String((req.body && req.body.option_id) || "");
    const ms = Number(req.body && req.body.ms_to_answer);
    const msToAnswer = Number.isFinite(ms) ? Math.max(0, Math.min(ms, 3_600_000)) : null;
    if (!cardId || !optionId) return jsonError(res, 400, "Missing answer.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const runRes = await client.query(
        `SELECT id, student_id, current_card_id, current_attempt_no, queued_callbacks, state
           FROM runs
          WHERE student_id = $1 AND status = 'active'
          FOR UPDATE`,
        [session.userId]
      );
      const run = runRes.rows[0];
      if (!run || run.current_card_id !== cardId) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "This is not the current card.");
      }
      const optRes = await client.query(
        `SELECT option_id, is_correct, result, state_delta
           FROM card_options
          WHERE card_id = $1 AND option_id = $2`,
        [cardId, optionId]
      );
      const option = optRes.rows[0];
      if (!option) {
        await client.query("ROLLBACK");
        return jsonError(res, 400, "Unknown option.");
      }
      const cardRes = await client.query(
        `SELECT card_id, debrief, schedules_callback, callback_of, psdp_skill, dol_section,
                act, zone, location_type, weather, time_of_day
           FROM cards
          WHERE card_id = $1`,
        [cardId]
      );
      const card = cardRes.rows[0];
      const answerId = crypto.randomUUID();
      try {
        await client.query(
          `INSERT INTO run_answers (id, run_id, card_id, attempt_no, option_id, was_correct, ms_to_answer)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [answerId, run.id, cardId, run.current_attempt_no, optionId, option.is_correct, msToAnswer]
        );
      } catch (err) {
        await client.query("ROLLBACK");
        if (err && err.code === "23505") return jsonError(res, 409, "Already answered.");
        throw err;
      }

      const delta = option.state_delta || {};
      const state = { ...(run.state || {}) };
      for (const [k, v] of Object.entries(delta)) {
        if (typeof v === "number") state[k] = (Number(state[k]) || 0) + v;
        else state[k] = v;
      }

      let queued = Array.isArray(run.queued_callbacks) ? [...run.queued_callbacks] : [];
      if (card.schedules_callback && !option.is_correct) {
        const cb = await client.query(
          `SELECT card_id FROM cards WHERE callback_of = $1 ORDER BY seq ASC LIMIT 1`,
          [cardId]
        );
        if (cb.rows[0]) queued.push(cb.rows[0].card_id);
      }

      const { rows: parents } = await client.query(
        `SELECT u.display_name FROM parent_students ps JOIN users u ON u.id = ps.parent_id
          WHERE ps.student_id = $1`,
        [session.userId]
      );
      const ini = [initials(session.name), ...parents.map((p) => initials(p.display_name))]
        .filter(Boolean)
        .join("/");
      const hours = Number(((msToAnswer || 0) / 3_600_000).toFixed(2));
      await client.query(
        `INSERT INTO coverage_log (
           id, student_id, card_id, practiced_on, location, day_night, weather,
           psdp_skill, dol_section, act, zone, hours, duration_ms, initials
         ) VALUES ($1,$2,$3, (now() AT TIME ZONE 'America/Los_Angeles')::date, $4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          crypto.randomUUID(),
          session.userId,
          cardId,
          card.location_type,
          dayNight(card.time_of_day),
          card.weather,
          card.psdp_skill,
          card.dol_section,
          card.act,
          card.zone,
          hours,
          msToAnswer || 0,
          ini,
        ]
      );

      let nextCardId = null;
      if (queued.length) {
        nextCardId = queued.shift();
      } else {
        const nxt = await client.query(
          `SELECT c.card_id
             FROM cards c
            WHERE NOT EXISTS (
                    SELECT 1 FROM run_answers a
                     WHERE a.run_id = $1 AND a.card_id = c.card_id
                  )
            ORDER BY c.seq ASC, c.card_id ASC
            LIMIT 1`,
          [run.id]
        );
        nextCardId = nxt.rows[0] ? nxt.rows[0].card_id : null;
      }

      if (nextCardId) {
        await client.query(
          `UPDATE runs
              SET current_card_id = $1, current_attempt_no = 1, queued_callbacks = $2,
                  state = $3::jsonb, updated_at = now()
            WHERE id = $4`,
          [nextCardId, queued, JSON.stringify(state), run.id]
        );
      } else {
        await client.query(
          `UPDATE runs
              SET status = 'completed', current_card_id = NULL, queued_callbacks = $1,
                  state = $2::jsonb, updated_at = now()
            WHERE id = $3`,
          [queued, JSON.stringify(state), run.id]
        );
      }

      await client.query("COMMIT");

      const next = nextCardId ? await publicCard(nextCardId) : { done: true };
      return res.json({
        ok: true,
        was_correct: option.is_correct,
        result: option.result,
        state_delta: delta,
        debrief: card.debrief,
        next: next || { done: true },
      });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore
      }
      return jsonError(res, 500, "Could not save answer.");
    } finally {
      client.release();
    }
  });
}

module.exports = { mountRun };
