"use strict";

const crypto = require("crypto");
const { query, pool } = require("./db");
const { appKind } = require("./host");
const { initials } = require("./phone");
const auth = require("./auth");
const { jsonError } = require("./routes-auth");
const { publicCard, dayNight, pickNextCard, queueCallback, onMainAnswered, clearCallback, pendingOutcome, reviewCard, progressFor, neighborsAnsweredForStudent, firstAnswerForStudent, canViewImage, CAST, portraitCardId, publicState, cargoDead, cargoFailDispatch, skipSeqFor, buildReplayPlan, recapBeat, replayStep, advanceReplayPlan } = require("./game");
const { applyFear } = require("./presence");

// Cookie expiry mid-run: new OTP, same user, same active row. current_card_id stays.
// A completed run starts a new one. We never rewind an in-progress run to card one.
async function assignCurrent(run) {
  if (run.current_card_id) return run;
  const picked = await pickNextCard(pool, run.id, run.callback_debts, run.start_seq);
  if (picked.cardId) {
    await query(
      `UPDATE runs SET current_card_id = $1, current_attempt_no = 1, updated_at = now() WHERE id = $2`,
      [picked.cardId, run.id]
    );
    run.current_card_id = picked.cardId;
    run.current_attempt_no = 1;
  }
  return run;
}

async function cardForRun(run) {
  const step = replayStep(run);
  if (step && step.mode === "recap" && step.card_id === run.current_card_id) {
    return recapBeat(step.card_id, step.option_id);
  }
  return publicCard(run.current_card_id);
}

async function getOrCreateRun(studentId) {
  const { rows } = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
       FROM runs
      WHERE student_id = $1 AND status = 'active'`,
    [studentId]
  );
  if (rows[0]) return assignCurrent(rows[0]);
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO runs (id, student_id, status, current_attempt_no)
     VALUES ($1, $2, 'active', 1)`,
    [id, studentId]
  );
  const created = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
       FROM runs WHERE id = $1`,
    [id]
  );
  return assignCurrent(created.rows[0]);
}

async function getRunForHome(studentId) {
  const { rows: active } = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
       FROM runs
      WHERE student_id = $1 AND status = 'active'`,
    [studentId]
  );
  if (active[0]) return assignCurrent(active[0]);
  const { rows: last } = await query(
    `SELECT id, student_id, status, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
       FROM runs
      WHERE student_id = $1
      ORDER BY updated_at DESC
      LIMIT 1`,
    [studentId]
  );
  if (last[0]) return last[0];
  return getOrCreateRun(studentId);
}

function mountRun(app) {
  app.get("/api/run/home", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const run = await getRunForHome(session.userId);
      const progress = await progressFor(run);
      return res.json({ ok: true, run_id: run.id, ...progress });
    } catch (err) {
      return jsonError(res, 500, "Could not load home.");
    }
  });

  app.get("/api/run/current", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const home = await getRunForHome(session.userId);
      if (home && home.status === "completed") {
        return res.json({ ok: true, done: true, next: { done: true } });
      }
      const run = await getOrCreateRun(session.userId);
      const pending = await pendingOutcome(run.id);
      if (pending) {
        const card = await reviewCard(pending.card_id, pending);
        if (!card) return jsonError(res, 500, "Could not load card.");
        const progress = await progressFor(run);
        const neighbors = await neighborsAnsweredForStudent(session.userId, pending.card_id);
        return res.json({
          ok: true,
          run_id: run.id,
          pending_outcome: true,
          review: false,
          saved: progress.saved,
          previous_card_id: neighbors.previous_card_id,
          next_card_id: neighbors.next_card_id,
          state: publicState(run.state),
          ...card,
        });
      }
      if (!run.current_card_id) {
        return res.json({ ok: true, done: true, next: { done: true } });
      }
      const card = await cardForRun(run);
      if (!card) return res.json({ ok: true, done: true, next: { done: true } });
      const progress = await progressFor(run);
      const neighbors = await neighborsAnsweredForStudent(session.userId, run.current_card_id);
      return res.json({
        ok: true,
        run_id: run.id,
        attempt_no: run.current_attempt_no,
        pending_outcome: false,
        review: false,
        saved: progress.saved,
        previous_card_id: neighbors.previous_card_id,
        next_card_id: neighbors.next_card_id,
        state: publicState(run.state),
        ...card,
      });
    } catch (err) {
      return jsonError(res, 500, "Could not load card.");
    }
  });

  app.get("/api/run/review/:cardId", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String(req.params.cardId || "");
    try {
      const run = await getRunForHome(session.userId);
      const attempt = await firstAnswerForStudent(session.userId, cardId);
      if (!attempt) return jsonError(res, 404, "Not resolved.");
      const card = await reviewCard(cardId, attempt);
      if (!card) return jsonError(res, 404, "Unknown card.");
      let saved = "";
      let resume = null;
      try {
        const progress = await progressFor(run);
        saved = progress.saved;
        resume = progress.resume;
      } catch (progErr) {
        console.error("review progressFor", progErr);
      }
      const neighbors = await neighborsAnsweredForStudent(session.userId, cardId);
      return res.json({
        ok: true,
        run_id: run.id,
        review: true,
        pending_outcome: false,
        saved,
        resume,
        previous_card_id: neighbors.previous_card_id,
        next_card_id: neighbors.next_card_id,
        state: publicState(run.state),
        ...card,
      });
    } catch (err) {
      console.error("review failed", cardId, err);
      return jsonError(res, 500, "Could not load review.");
    }
  });

  async function sendRunImage(req, res, requestedRaw) {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const run = await getRunForHome(session.userId);
      const requested = String(requestedRaw || "").replace(/\.(png|jpe?g|webp)$/i, "");
      const pending = await pendingOutcome(run.id);
      let cardId = requested || (pending && pending.card_id) || run.current_card_id;
      if (!cardId) return res.status(404).end();
      if (requested && !(await canViewImage(run, requested, session.userId)) && !(pending && pending.card_id === requested)) {
        return res.status(404).end();
      }
      const { rows } = await query(
        `SELECT image_bytes, image_mime FROM cards WHERE card_id = $1`,
        [cardId]
      );
      const row = rows[0];
      if (!row || !row.image_bytes) return res.status(404).end();
      res.setHeader("content-type", row.image_mime || "image/webp");
      res.setHeader("cache-control", "private, max-age=604800");
      return res.send(row.image_bytes);
    } catch (err) {
      return jsonError(res, 500, "Could not load image.");
    }
  }

  app.get("/api/run/image/:cardId", async (req, res) => {
    return sendRunImage(req, res, req.params.cardId);
  });

  app.get("/api/run/image", async (req, res) => {
    return sendRunImage(req, res, req.query.card_id);
  });

  app.get("/api/run/cast/:id", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const id = String(req.params.id || "");
    if (!CAST.some((c) => c.id === id)) return res.status(404).end();
    try {
      const run = await getRunForHome(session.userId);
      const progress = await progressFor(run);
      const member = progress.cast.find((c) => c.id === id);
      if ((!member || !member.unlocked) && req.query.bark !== "1") return res.status(404).end();
      const cardId = portraitCardId(id);
      if (!cardId) return res.status(404).end();
      const { rows } = await query(
        `SELECT image_bytes, image_mime FROM cards WHERE card_id = $1`,
        [cardId]
      );
      const row = rows[0];
      if (!row || !row.image_bytes) return res.status(404).end();
      res.setHeader("content-type", row.image_mime || "image/webp");
      res.setHeader("cache-control", "private, max-age=604800");
      return res.send(row.image_bytes);
    } catch (err) {
      return jsonError(res, 500, "Could not load portrait.");
    }
  });

  app.post("/api/run/answer", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String((req.body && req.body.card_id) || "");
    let optionId = String((req.body && req.body.option_id) || "");
    const ms = Number(req.body && req.body.ms_to_answer);
    const msToAnswer = Number.isFinite(ms) ? Math.max(0, Math.min(ms, 3_600_000)) : null;
    if (!cardId) return jsonError(res, 400, "Missing answer.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const runRes = await client.query(
        `SELECT id, student_id, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
           FROM runs
          WHERE student_id = $1 AND status = 'active'
          FOR UPDATE`,
        [session.userId]
      );
      const run = runRes.rows[0];
      if (!run) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "This is not the current card.");
      }
      const already = await client.query(
        `SELECT 1 FROM run_answers WHERE run_id = $1 AND card_id = $2 LIMIT 1`,
        [run.id, cardId]
      );
      if (already.rowCount) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "Already answered.");
      }
      if (run.current_card_id !== cardId) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "This is not the current card.");
      }
      const replay = replayStep(run);
      if (replay && replay.mode === "recap" && replay.card_id === cardId) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "Recap beat — tap to continue.");
      }
      const cardRes = await client.query(
        `SELECT card_id, card_type, debrief, schedules_callback, callback_of, psdp_skill, dol_section,
                act, zone, location_type, weather, time_of_day, driver
           FROM cards
          WHERE card_id = $1`,
        [cardId]
      );
      const card = cardRes.rows[0];
      if (!card) {
        await client.query("ROLLBACK");
        return jsonError(res, 400, "Unknown card.");
      }
      if (card.card_type === "dossier" && (!optionId || optionId === "continue")) {
        optionId = "continue";
      }
      if (!optionId) {
        await client.query("ROLLBACK");
        return jsonError(res, 400, "Missing answer.");
      }
      let option = null;
      if (card.card_type === "dossier" && optionId === "continue") {
        option = { option_id: "continue", is_correct: true, result: "", state_delta: {} };
      } else {
        const optRes = await client.query(
          `SELECT option_id, is_correct, result, state_delta
             FROM card_options
            WHERE card_id = $1 AND option_id = $2`,
          [cardId, optionId]
        );
        option = optRes.rows[0];
      }
      if (!option) {
        await client.query("ROLLBACK");
        return jsonError(res, 400, "Unknown option.");
      }
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
      const timedOut = Boolean(req.body && req.body.timed_out) && optionId !== "continue";
      let state = { ...(run.state || {}) };
      for (const [k, v] of Object.entries(delta)) {
        if (k === "presence" || k === "handprints" || k === "drew") continue;
        if (typeof v === "number") state[k] = (Number(state[k]) || 0) + v;
        else state[k] = v;
      }
      const fear = applyFear(state, delta, {
        correct: option.is_correct && card.card_type !== "dossier",
        timedOut,
      });
      state = fear.state;

      let queued = Array.isArray(run.queued_callbacks) ? [...run.queued_callbacks] : [];
      let debts = run.callback_debts;
      if (card.callback_of) {
        debts = clearCallback(debts, card.callback_of);
      } else {
        debts = onMainAnswered(debts);
      }
      if (card.schedules_callback && !option.is_correct) {
        debts = queueCallback(debts, cardId);
        if (!queued.includes(cardId)) queued.push(cardId);
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

      const { rows: allOpts } = await client.query(
        `SELECT option_id, option_text, result, state_delta
           FROM card_options WHERE card_id = $1 ORDER BY option_id ASC`,
        [cardId]
      );
      const alts = allOpts
        .filter((o) => o.option_id !== optionId)
        .map((o) => ({
          option_id: o.option_id,
          option_text: o.option_text,
          result: o.result,
          state_delta: o.state_delta || {},
        }));

      const failed = cargoDead(state, delta);
      const inReplay = Boolean(replayStep(run));
      let nextCardId = null;
      if (failed) {
        const counted = await client.query(
          `SELECT COUNT(*)::int AS n FROM run_answers WHERE run_id = $1`,
          [run.id]
        );
        const answersBefore = (counted.rows[0] && counted.rows[0].n) - 1;
        const startSeq = await skipSeqFor(client, answersBefore);
        const replayPlan = await buildReplayPlan(client, run.id, answersBefore);
        await client.query(
          `UPDATE runs
              SET status = 'failed', current_card_id = NULL, queued_callbacks = $1,
                  callback_debts = $2::jsonb, state = $3::jsonb, updated_at = now()
            WHERE id = $4`,
          [queued, JSON.stringify(debts), JSON.stringify(state), run.id]
        );
        const freshId = crypto.randomUUID();
        await client.query(
          `INSERT INTO runs (
             id, student_id, status, current_attempt_no, start_seq,
             queued_callbacks, callback_debts, state, replay_plan, replay_index
           ) VALUES ($1, $2, 'active', 1, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, 0)`,
          [
            freshId,
            session.userId,
            startSeq,
            queued,
            JSON.stringify(debts),
            JSON.stringify(state),
            JSON.stringify(replayPlan),
          ]
        );
        if (replayPlan.length) {
          nextCardId = replayPlan[0].card_id;
          await client.query(
            `UPDATE runs SET current_card_id = $1, updated_at = now() WHERE id = $2`,
            [nextCardId, freshId]
          );
        } else {
          const picked = await pickNextCard(client, freshId, debts, startSeq);
          nextCardId = picked.cardId;
          if (nextCardId) {
            await client.query(
              `UPDATE runs SET current_card_id = $1, callback_debts = $2::jsonb, updated_at = now() WHERE id = $3`,
              [nextCardId, JSON.stringify(picked.debts), freshId]
            );
          }
        }
      } else if (inReplay) {
        await client.query(
          `UPDATE runs
              SET queued_callbacks = $1, callback_debts = $2::jsonb, state = $3::jsonb, updated_at = now()
            WHERE id = $4`,
          [queued, JSON.stringify(debts), JSON.stringify(state), run.id]
        );
        const advanced = await advanceReplayPlan(client, run.id, {
          ...run,
          callback_debts: debts,
          start_seq: run.start_seq,
        });
        nextCardId = advanced.cardId;
        if (advanced.debts) {
          await client.query(
            `UPDATE runs SET callback_debts = $1::jsonb, updated_at = now() WHERE id = $2`,
            [JSON.stringify(advanced.debts), run.id]
          );
        }
      } else {
        const picked = await pickNextCard(client, run.id, debts, run.start_seq);
        nextCardId = picked.cardId;
        if (nextCardId) {
          await client.query(
            `UPDATE runs
                SET current_card_id = $1, current_attempt_no = 1, queued_callbacks = $2,
                    callback_debts = $3::jsonb, state = $4::jsonb, updated_at = now()
              WHERE id = $5`,
            [nextCardId, queued, JSON.stringify(picked.debts), JSON.stringify(state), run.id]
          );
        } else {
          await client.query(
            `UPDATE runs
                SET status = 'completed', current_card_id = NULL, queued_callbacks = $1,
                    callback_debts = $2::jsonb, state = $3::jsonb, updated_at = now()
              WHERE id = $4`,
            [queued, JSON.stringify(picked.debts), JSON.stringify(state), run.id]
          );
        }
      }

      await client.query("COMMIT");

      let next = nextCardId ? { card_id: nextCardId } : { done: true };
      if (nextCardId) {
        const activeRes = await query(
          `SELECT id, current_card_id, replay_plan, replay_index, callback_debts, start_seq
             FROM runs
            WHERE student_id = $1 AND status = 'active'
            ORDER BY updated_at DESC
            LIMIT 1`,
          [session.userId]
        );
        const active = activeRes.rows[0];
        if (active && active.current_card_id === nextCardId) {
          next = (await cardForRun(active)) || { done: true };
        } else {
          next = (await publicCard(nextCardId)) || { done: true };
        }
      }
      return res.json({
        ok: true,
        was_correct: option.is_correct,
        result: option.result,
        state_delta: delta,
        state: publicState(state),
        collapse: Boolean(fear.collapse) || failed,
        failed,
        dispatch: failed ? cargoFailDispatch() : fear.dispatch || null,
        debrief: card.debrief,
        driver: card.driver || "ali",
        alts,
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

  app.post("/api/run/continue", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String((req.body && req.body.card_id) || "");
    const ms = Number(req.body && req.body.ms_on_outcome);
    const msOnOutcome = Number.isFinite(ms) ? Math.max(0, Math.min(ms, 3_600_000)) : null;
    if (!cardId) return jsonError(res, 400, "Missing card.");
    try {
      const runRes = await query(
        `SELECT id FROM runs WHERE student_id = $1
         ORDER BY updated_at DESC LIMIT 1`,
        [session.userId]
      );
      const run = runRes.rows[0];
      if (!run) return jsonError(res, 409, "No run.");
      await query(
        `UPDATE run_answers a
            SET ms_on_outcome = $1
          WHERE a.id = (
            SELECT a2.id FROM run_answers a2
              JOIN runs r ON r.id = a2.run_id
             WHERE r.student_id = $2 AND a2.card_id = $3 AND a2.ms_on_outcome IS NULL
             ORDER BY a2.created_at DESC
             LIMIT 1
          )`,
        [msOnOutcome, session.userId, cardId]
      );
      return res.json({ ok: true });
    } catch (err) {
      return jsonError(res, 500, "Could not save continue.");
    }
  });

  app.post("/api/run/peek", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String((req.body && req.body.card_id) || "");
    const optionId = String((req.body && req.body.option_id) || "");
    if (!cardId || !optionId) return jsonError(res, 400, "Missing peek.");
    try {
      const run = await getRunForHome(session.userId);
      const { rows: resolved } = await query(
        `SELECT 1 FROM run_answers a
           JOIN runs r ON r.id = a.run_id
          WHERE r.student_id = $1 AND a.card_id = $2
          LIMIT 1`,
        [session.userId, cardId]
      );
      if (!resolved[0]) return jsonError(res, 409, "Not resolved.");
      await query(
        `INSERT INTO run_peeks (id, run_id, card_id, option_id) VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), run.id, cardId, optionId]
      );
      return res.json({ ok: true });
    } catch (err) {
      return jsonError(res, 500, "Could not save peek.");
    }
  });

  app.post("/api/run/recap-advance", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const cardId = String((req.body && req.body.card_id) || "");
    if (!cardId) return jsonError(res, 400, "Missing card.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const runRes = await client.query(
        `SELECT id, student_id, current_card_id, current_attempt_no, queued_callbacks, callback_debts, state, start_seq, replay_plan, replay_index
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
      const step = replayStep(run);
      if (!step || step.mode !== "recap" || step.card_id !== cardId) {
        await client.query("ROLLBACK");
        return jsonError(res, 409, "Not a recap beat.");
      }
      const dup = await client.query(
        `SELECT 1 FROM run_answers WHERE run_id = $1 AND card_id = $2 LIMIT 1`,
        [run.id, cardId]
      );
      if (!dup.rowCount) {
        await client.query(
          `INSERT INTO run_answers (id, run_id, card_id, attempt_no, option_id, was_correct, ms_to_answer)
           VALUES ($1, $2, $3, $4, $5, true, 0)`,
          [crypto.randomUUID(), run.id, cardId, run.current_attempt_no, step.option_id || "continue"]
        );
      }
      const advanced = await advanceReplayPlan(client, run.id, run);
      await client.query("COMMIT");
      let next = { done: true };
      if (advanced.cardId) {
        const activeRes = await query(
          `SELECT id, current_card_id, replay_plan, replay_index, callback_debts, start_seq, state
             FROM runs WHERE id = $1`,
          [run.id]
        );
        const active = activeRes.rows[0];
        next = (await cardForRun(active)) || (await publicCard(advanced.cardId)) || { done: true };
        return res.json({ ok: true, next, state: publicState(active && active.state) });
      }
      return res.json({ ok: true, next, state: publicState(run.state) });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore
      }
      return jsonError(res, 500, "Could not advance recap.");
    } finally {
      client.release();
    }
  });

  app.post("/api/run/restart", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      await query(
        `UPDATE runs
            SET status = 'abandoned', current_card_id = NULL, updated_at = now()
          WHERE student_id = $1 AND status = 'active'`,
        [session.userId]
      );
      const run = await getOrCreateRun(session.userId);
      return res.json({ ok: true, run_id: run.id });
    } catch (err) {
      return jsonError(res, 500, "Could not start over.");
    }
  });
}

module.exports = { mountRun };
