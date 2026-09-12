"use strict";

const crypto = require("crypto");
const { query, pool } = require("./db");
const { publicFear } = require("./presence");
const { coldFrom, warmingFrom, cargoFailDispatch, CARGO_BUDGET, timeCostOf } = require("./manifest");

async function purgeExpiredPending() {
  await query(`DELETE FROM pending_links WHERE created_at < now() - interval '30 days'`);
}

async function pendingForPhone(hmac) {
  const { rows } = await query(
    `SELECT pl.id, pl.parent_id, pl.student_name, u.display_name AS parent_name
       FROM pending_links pl
       JOIN users u ON u.id = pl.parent_id
      WHERE pl.phone_hmac = $1
      ORDER BY pl.created_at ASC`,
    [hmac]
  );
  return rows;
}

async function nextUnansweredCard(runId) {
  const { rows } = await query(
    `SELECT c.card_id, c.seq, c.callback_of
       FROM cards c
      WHERE c.callback_of IS NULL
        AND NOT EXISTS (
              SELECT 1 FROM run_answers a
               WHERE a.run_id = $1 AND a.card_id = c.card_id
            )
      ORDER BY c.seq ASC, c.card_id ASC
      LIMIT 1`,
    [runId]
  );
  return rows[0] || null;
}

const CALLBACK_GAP = 2;

function asDebts(raw) {
  return Array.isArray(raw) ? raw.map((d) => ({ ...d })) : [];
}

async function ledgerForOrigin(client, runId, fromCard) {
  const { rows } = await client.query(
    `SELECT c.card_id
       FROM cards c
      WHERE c.callback_of = $1
        AND NOT EXISTS (
              SELECT 1 FROM run_answers a
               WHERE a.run_id = $2 AND a.card_id = c.card_id
            )
      ORDER BY c.seq ASC, c.card_id ASC
      LIMIT 1`,
    [fromCard, runId]
  );
  return rows[0] ? rows[0].card_id : null;
}

const QUIET_IN_FRAME = new Set(["I-005", "I-006", "I-007", "I-008"]);

function isBeatCard(type) {
  return type === "beat";
}

function actEntryLocked(act, actCards, everSet) {
  const cards = (actCards && actCards[act]) || [];
  if (!cards.length) return true;
  if (cards.some((c) => everSet.has(c.card_id))) return false;
  // Act IV is playable now without replaying I–III. Art grind is paused.
  if (act === "IV") return false;
  const idx = ACT_ZONES.findIndex((z) => z.act === act);
  if (idx <= 0) return false;
  for (let i = idx - 1; i >= 0; i--) {
    const prev = (actCards && actCards[ACT_ZONES[i].act]) || [];
    if (!prev.length) continue;
    return !prev.every((c) => everSet.has(c.card_id));
  }
  return false;
}

async function actBoundForRun(client, run, hintAct) {
  const hint = hintAct || actOfCardId(run && run.current_card_id);
  if (hint) return hint;
  if (run && run.id) {
    const { rows } = await client.query(
      `SELECT c.act
         FROM run_answers a
         JOIN cards c ON c.card_id = a.card_id
        WHERE a.run_id = $1
        ORDER BY a.created_at DESC
        LIMIT 1`,
      [run.id]
    );
    if (rows[0] && rows[0].act) return rows[0].act;
  }
  const { rows: seeded } = await client.query(`SELECT DISTINCT act FROM cards`);
  const have = new Set(seeded.map((r) => r.act));
  for (const z of ACT_ZONES) {
    if (have.has(z.act)) return z.act;
  }
  return "II";
}

async function pickNextCard(client, runId, debts, startSeq, act) {
  const list = asDebts(debts);
  const skip = Number(startSeq) || 0;
  const bound = String(act || "");
  for (const d of list) {
    if (Number(d.remaining) > 0) continue;
    const id = await ledgerForOrigin(client, runId, d.from_card);
    if (!id) continue;
    if (bound && actOfCardId(id) !== bound) continue;
    return { cardId: id, debts: list };
  }
  const params = [runId, skip];
  let actClause = "";
  if (bound) {
    params.push(bound);
    actClause = " AND c.act = $3";
  }
  const { rows: main } = await client.query(
    `SELECT c.card_id
       FROM cards c
      WHERE c.callback_of IS NULL
        AND c.seq > $2
        ${actClause}
        AND NOT EXISTS (
              SELECT 1 FROM run_answers a
               WHERE a.run_id = $1 AND a.card_id = c.card_id
            )
      ORDER BY c.seq ASC, c.card_id ASC
      LIMIT 1`,
    params
  );
  if (main[0]) return { cardId: main[0].card_id, debts: list };
  for (const d of list) {
    const id = await ledgerForOrigin(client, runId, d.from_card);
    if (!id) continue;
    if (bound && actOfCardId(id) !== bound) continue;
    return { cardId: id, debts: list };
  }
  return { cardId: null, debts: list };
}

/** Misses that share a later ledger. III-020 is the 167 straight for both. */
const LEDGER_ORIGIN = {
  "III-027": "III-016",
};

function ledgerOrigin(fromCard) {
  return LEDGER_ORIGIN[fromCard] || fromCard;
}

function queueCallback(debts, fromCard) {
  const list = asDebts(debts);
  const origin = ledgerOrigin(fromCard);
  if (list.some((d) => d.from_card === origin)) return list;
  list.push({ from_card: origin, remaining: CALLBACK_GAP });
  return list;
}

function onMainAnswered(debts) {
  return asDebts(debts).map((d) => ({
    from_card: d.from_card,
    remaining: Math.max(0, Number(d.remaining) - 1),
  }));
}

function clearCallback(debts, fromCard) {
  return asDebts(debts).filter((d) => d.from_card !== fromCard);
}

const ACT_ZONES = [
  { act: "I", zone: "The Lot" },
  { act: "II", zone: "The Grid" },
  { act: "III", zone: "Central" },
  { act: "IV", zone: "The Core" },
  { act: "V", zone: "The Ribbon" },
  { act: "VI", zone: "The Backcountry" },
  { act: "VII", zone: "The Dark Hours" },
];

const CAST = [
  { id: "ali", name: "Ali", line: "Cranberry braid. The Menace. The Grid is hers." },
  { id: "deac", name: "Deac", line: "The Ledger. He still counts cadence." },
  { id: "yuna", name: "Yuna", line: "Encore. She talks with the horns." },
  { id: "gracie", name: "Gracie", line: "Orange tabby. Ali's. She comes back." },
  { id: "mya", name: "Mya", line: "Ali's. Deac has her. The collar has a name and no person." },
  { id: "reyna_solis", name: "Reyna", line: "Bus 12. The bent arm." },
  { id: "marisol", name: "Marisol", line: "The bike. The door zone." },
  { id: "hollis", name: "Hollis", line: "The truck in the glass." },
];

const CAST_CARDS = {
  ali: "II-001",
  deac: "II-006",
  gracie: "II-018",
  reyna_solis: "II-010",
  marisol: "II-005",
  hollis: "II-014",
};

function portraitCardId(castId, catalog) {
  if (CAST_CARDS[castId]) return CAST_CARDS[castId];
  const hit = (catalog || []).find((c) => ((c.extra || {}).cast || []).includes(castId));
  return hit ? hit.card_id : null;
}

function sceneFragment(scene) {
  const t = String(scene || "").replace(/\s+/g, " ").trim();
  const sentence = t.split(/(?<=\.)\s/)[0] || t;
  if (sentence.length <= 96) return sentence;
  const cut = sentence.slice(0, 96);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut).trim() + "…";
}

function imageUrl(cardId) {
  return "/api/run/image/" + encodeURIComponent(cardId) + "?v=a73";
}

function cargoUsed(state) {
  const s = state || {};
  const time = Number(s.time_cost) || 0;
  const noise = Math.max(0, Number(s.noise) || 0);
  const light = Math.max(0, Number(s.light) || 0);
  return time + noise + Math.round(light / 2);
}

function cargoFrom(state) {
  return Math.max(0, Math.min(CARGO_BUDGET, CARGO_BUDGET - cargoUsed(state)));
}

function actOfCardId(cardId) {
  const id = String(cardId || "");
  let hit = null;
  for (const z of ACT_ZONES) {
    const prefix = z.act + "-";
    if (id.startsWith(prefix) && (!hit || z.act.length > hit.length)) hit = z.act;
  }
  return hit;
}

function withActCargo(state, act) {
  const s = { ...(state || {}) };
  if (!act) return s;
  if (s.cargo_act === act) return s;
  if (!s.cargo_act && act === "II") {
    s.cargo_act = "II";
    return s;
  }
  s.time_cost = 0;
  s.cargo_act = act;
  if (cargoFrom(s) <= 0) {
    s.noise = 0;
    s.light = 0;
  }
  return s;
}

function cargoDead(state, delta) {
  if (delta && delta.fatal) return true;
  if (cargoFrom(state) > 0) return false;
  const d = delta || {};
  return timeCostOf(d) > 0 || (Number(d.noise) || 0) > 0 || (Number(d.light) || 0) > 0;
}

function statesEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

async function persistActCargo(db, run) {
  if (!run || !run.id || !run.current_card_id) return run;
  if (reviewStep(run)) {
    run.state = run.state || {};
    return run;
  }
  const act = actOfCardId(run.current_card_id);
  if (!act) return run;
  const next = withActCargo(run.state, act);
  if (statesEqual(run.state, next)) {
    run.state = next;
    return run;
  }
  await db.query(`UPDATE runs SET state = $1::jsonb, updated_at = now() WHERE id = $2`, [
    JSON.stringify(next),
    run.id,
  ]);
  run.state = next;
  return run;
}

function checkpointKeep(answersBefore) {
  return Math.floor(Math.max(0, Number(answersBefore) || 0) / 5) * 5;
}

function checkpointStartSeq(keepSeq, floorSeq, keep) {
  const floor = Math.max(0, Number(floorSeq) || 0);
  if ((Number(keep) || 0) <= 0) return floor;
  return Math.max(floor, Number(keepSeq) || 0);
}

function replayWindowAnswers(answers, keep) {
  const list = Array.isArray(answers) ? answers : [];
  const k = Math.max(0, Number(keep) || 0);
  if (list.length <= 1) return [];
  const end = list.length - 1;
  if (k >= end) return [];
  return list.slice(k, end);
}

function planFromWindow(window) {
  return (window || [])
    .map((ans) => {
      const cardId = ans && ans.card_id;
      if (!cardId) return null;
      if (ans.was_correct) {
        return {
          card_id: String(cardId),
          mode: "recap",
          option_id: ans.option_id ? String(ans.option_id) : null,
          was_correct: true,
        };
      }
      return { card_id: String(cardId), mode: "retry" };
    })
    .filter(Boolean);
}

const REVIEW_N = 10;
const REVIEW_MIN = 4;
const HOLD_CUTOUTS = ["52", "56", "57", "58", "59", "60"];

function isWatchCard(type) {
  return type === "dossier" || type === "ride-along";
}

function gradesCard(type) {
  return !isWatchCard(type) && !isBeatCard(type);
}

function quizableAnswer(ans) {
  if (!ans || !ans.card_id) return false;
  if (isWatchCard(ans.card_type)) return false;
  if (isBeatCard(ans.card_type)) return false;
  return true;
}

function reviewIdsFromAnswers(answers) {
  const list = Array.isArray(answers) ? answers : [];
  const before = list.slice(0, Math.max(0, list.length - 1)).filter(quizableAnswer);
  const ordered = [...before.filter((a) => !a.was_correct), ...before.filter((a) => a.was_correct)];
  const ids = [];
  const seen = new Set();
  for (const a of ordered) {
    const id = String(a.card_id);
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= REVIEW_N) break;
  }
  return ids;
}

function asReviewPlan(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((step) => String((step && step.card_id) || step || "")).filter(Boolean);
}

function reviewStep(run) {
  const plan = asReviewPlan(run && run.review_plan);
  const idx = Number(run && run.review_index) || 0;
  return plan[idx] || null;
}

function bankHoldMinutes(state, correct) {
  const next = { ...(state || {}) };
  if (!correct) return next;
  next.time_cost = Math.max(0, (Number(next.time_cost) || 0) - REVIEW_MIN);
  next.hold_cleared = (Number(next.hold_cleared) || 0) + 1;
  return next;
}

function clearHoldState(state) {
  const next = { ...(state || {}) };
  delete next.hold_cleared;
  return next;
}

function applyDelta(state, delta) {
  const next = { ...(state || {}) };
  const d = delta || {};
  for (const [k, v] of Object.entries(d)) {
    if (k === "presence" || k === "handprints" || k === "drew" || k === "fatal") {
      next[k] = v;
      continue;
    }
    if (typeof v === "number") next[k] = (Number(next[k]) || 0) + v;
    else next[k] = v;
  }
  return next;
}

async function mainAnswersForRun(client, failedRunId) {
  const { rows } = await client.query(
    `SELECT a.card_id, a.option_id, a.was_correct, o.state_delta, c.act, c.seq, c.card_type
       FROM run_answers a
       JOIN cards c ON c.card_id = a.card_id
       LEFT JOIN card_options o ON o.card_id = a.card_id AND o.option_id = a.option_id
      WHERE a.run_id = $1 AND c.callback_of IS NULL
      ORDER BY c.seq ASC, c.card_id ASC`,
    [failedRunId]
  );
  return rows;
}

async function fillReviewFromStudent(client, studentId, have, need, skipIds) {
  const ids = Array.isArray(have) ? [...have] : [];
  if (!studentId || ids.length >= need) return ids;
  const skip = new Set([...(skipIds || []), ...ids]);
  const { rows } = await client.query(
    `SELECT c.card_id
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
       JOIN cards c ON c.card_id = a.card_id
      WHERE r.student_id = $1
        AND c.callback_of IS NULL
        AND c.card_type IS DISTINCT FROM 'dossier'
        AND c.card_type IS DISTINCT FROM 'ride-along'
        AND EXISTS (
              SELECT 1 FROM card_options o
               WHERE o.card_id = c.card_id AND o.option_id <> 'continue'
            )
      ORDER BY a.created_at DESC`,
    [studentId]
  );
  for (const r of rows) {
    if (skip.has(r.card_id)) continue;
    skip.add(r.card_id);
    ids.push(r.card_id);
    if (ids.length >= need) break;
  }
  return ids;
}

async function failRestart(client, failedRunId, floorSeq, studentId) {
  const answers = await mainAnswersForRun(client, failedRunId);
  const keep = checkpointKeep(Math.max(0, answers.length - 1));
  const kept = keep > 0 ? answers[keep - 1] : null;
  const startSeq = checkpointStartSeq(kept && kept.seq, floorSeq, keep);
  const replayPlan = planFromWindow(replayWindowAnswers(answers, keep));
  let restartState = {};
  let cargoAct = null;
  for (const r of answers.slice(0, keep)) {
    if (r.act !== cargoAct) {
      cargoAct = r.act;
      restartState = withActCargo(restartState, cargoAct);
    }
    restartState = applyDelta(restartState, r.state_delta);
  }
  let reviewPlan = reviewIdsFromAnswers(answers);
  const failId = answers.length ? answers[answers.length - 1].card_id : null;
  if (studentId && reviewPlan.length < REVIEW_N) {
    reviewPlan = await fillReviewFromStudent(client, studentId, reviewPlan, REVIEW_N, failId ? [failId] : []);
  }
  return { startSeq, replayPlan, restartState, keep, reviewPlan };
}

/** Rebuild cargo + ledger debts for a play-again that lands on a chosen card. */
function rebuildPlayAgain(answersBefore, floorSeq) {
  const list = Array.isArray(answersBefore) ? answersBefore : [];
  let restartState = {};
  let cargoAct = null;
  let debts = [];
  const queued = [];
  let lastMainSeq = null;
  for (const r of list) {
    if (r.callback_of) {
      debts = clearCallback(debts, r.callback_of);
      continue;
    }
    if (r.act !== cargoAct) {
      cargoAct = r.act;
      restartState = withActCargo(restartState, cargoAct);
    }
    restartState = applyDelta(restartState, r.state_delta);
    debts = onMainAnswered(debts);
    if (r.schedules_callback && !r.was_correct) {
      debts = queueCallback(debts, r.card_id);
      if (!queued.includes(r.card_id)) queued.push(r.card_id);
    }
    lastMainSeq = r.seq;
  }
  const startSeq =
    lastMainSeq != null ? Number(lastMainSeq) : Math.max(0, Number(floorSeq) || 0);
  return { startSeq, restartState, debts, queued };
}

/**
 * Abandon the active run and open a fresh active run whose next card is cardId.
 * Keeps economy from answers before that card on the source run.
 */
async function playAgainFrom(client, studentId, cardId) {
  const id = String(cardId || "");
  if (!id) return { error: 400, message: "Missing card." };
  const { rows: cardRows } = await client.query(
    `SELECT card_id, seq, act, callback_of, card_type FROM cards WHERE card_id = $1`,
    [id]
  );
  const target = cardRows[0];
  if (!target) return { error: 404, message: "Unknown card." };
  if (isBeatCard(target.card_type)) return { error: 409, message: "No retry." };

  const { rows: activeRows } = await client.query(
    `SELECT id, student_id, status, current_card_id, start_seq
       FROM runs
      WHERE student_id = $1 AND status = 'active'
      FOR UPDATE`,
    [studentId]
  );
  const active = activeRows[0] || null;
  const isCurrent = Boolean(active && active.current_card_id === id);

  let sourceRunId = null;
  let floorSeq = 0;
  if (active) {
    const { rows: onActive } = await client.query(
      `SELECT 1 FROM run_answers WHERE run_id = $1 AND card_id = $2 LIMIT 1`,
      [active.id, id]
    );
    if (isCurrent || onActive.length) {
      sourceRunId = active.id;
      floorSeq = Number(active.start_seq) || 0;
    }
  }
  if (!sourceRunId) {
    const { rows: prior } = await client.query(
      `SELECT a.run_id, r.start_seq
         FROM run_answers a
         JOIN runs r ON r.id = a.run_id
        WHERE r.student_id = $1 AND a.card_id = $2
        ORDER BY a.created_at DESC
        LIMIT 1`,
      [studentId, id]
    );
    if (!prior[0]) return { error: 404, message: "Not resolved." };
    sourceRunId = prior[0].run_id;
    floorSeq = Number(prior[0].start_seq) || 0;
  }

  const { rows: before } = await client.query(
    `SELECT a.card_id, a.option_id, a.was_correct, o.state_delta, c.act, c.seq, c.card_type,
            c.callback_of, c.schedules_callback
       FROM run_answers a
       JOIN cards c ON c.card_id = a.card_id
       LEFT JOIN card_options o ON o.card_id = a.card_id AND o.option_id = a.option_id
      WHERE a.run_id = $1 AND c.seq < $2
      ORDER BY c.seq ASC, c.card_id ASC`,
    [sourceRunId, target.seq]
  );

  const rebuilt = rebuildPlayAgain(before, floorSeq);
  if (active) {
    await client.query(
      `UPDATE runs
          SET status = 'abandoned', current_card_id = NULL, updated_at = now()
        WHERE id = $1`,
      [active.id]
    );
  }

  const freshId = crypto.randomUUID();
  await client.query(
    `INSERT INTO runs (
       id, student_id, status, current_attempt_no, start_seq,
       queued_callbacks, callback_debts, state, replay_plan, replay_index, review_plan, review_index
     ) VALUES ($1, $2, 'active', 1, $3, $4, $5::jsonb, $6::jsonb, '[]'::jsonb, 0, '[]'::jsonb, 0)`,
    [
      freshId,
      studentId,
      rebuilt.startSeq,
      rebuilt.queued,
      JSON.stringify(rebuilt.debts),
      JSON.stringify(rebuilt.restartState),
    ]
  );

  await client.query(
    `UPDATE runs
        SET current_card_id = $1, callback_debts = $2::jsonb, state = $3::jsonb, updated_at = now()
      WHERE id = $4`,
    [
      id,
      JSON.stringify(rebuilt.debts),
      JSON.stringify(withActCargo(rebuilt.restartState, actOfCardId(id))),
      freshId,
    ]
  );

  return {
    ok: true,
    run_id: freshId,
    card_id: id,
    start_seq: rebuilt.startSeq,
  };
}

/**
 * Abandon the active run and open a fresh run on the first card of an act.
 * Used so Act IV can start without replaying I–III (and without a prior answer).
 */
async function startActFrom(client, studentId, act) {
  const bound = String(act || "");
  if (!bound) return { error: 400, message: "Missing act." };
  const { rows: cards } = await client.query(
    `SELECT card_id, seq, act FROM cards WHERE act = $1 ORDER BY seq ASC, card_id ASC`,
    [bound]
  );
  if (!cards.length) return { error: 404, message: "Act not seeded." };

  const { rows: catalog } = await client.query(`SELECT card_id, act FROM cards`);
  const { rows: ever } = await client.query(
    `SELECT DISTINCT a.card_id
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1`,
    [studentId]
  );
  const actCards = {};
  for (const c of catalog) {
    if (!actCards[c.act]) actCards[c.act] = [];
    actCards[c.act].push(c);
  }
  const everSet = new Set(ever.map((r) => r.card_id));
  if (actEntryLocked(bound, actCards, everSet)) {
    return { error: 409, message: "Act locked." };
  }

  const first = cards[0];
  const startSeq = Math.max(0, Number(first.seq) - 1);

  await client.query(
    `UPDATE runs
        SET status = 'abandoned', current_card_id = NULL, updated_at = now()
      WHERE student_id = $1 AND status = 'active'`,
    [studentId]
  );

  const freshId = crypto.randomUUID();
  await client.query(
    `INSERT INTO runs (
       id, student_id, status, current_attempt_no, start_seq,
       queued_callbacks, callback_debts, state, replay_plan, replay_index, review_plan, review_index
     ) VALUES ($1, $2, 'active', 1, $3, $4, $5::jsonb, $6::jsonb, '[]'::jsonb, 0, '[]'::jsonb, 0)`,
    [
      freshId,
      studentId,
      startSeq,
      [],
      JSON.stringify([]),
      JSON.stringify(withActCargo({}, bound)),
    ]
  );
  await client.query(
    `UPDATE runs
        SET current_card_id = $1, updated_at = now()
      WHERE id = $2`,
    [first.card_id, freshId]
  );

  return {
    ok: true,
    run_id: freshId,
    card_id: first.card_id,
    start_seq: startSeq,
  };
}

async function checkpointState(client, failedRunId) {
  const restart = await failRestart(client, failedRunId, 0);
  return restart.restartState;
}

function asReplayPlan(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step) => ({
      card_id: String(step.card_id || ""),
      mode: step.mode === "recap" ? "recap" : "retry",
      option_id: step.option_id ? String(step.option_id) : null,
      was_correct: Boolean(step.was_correct),
    }))
    .filter((step) => step.card_id);
}

function replayStep(run) {
  const plan = asReplayPlan(run && run.replay_plan);
  const idx = Number(run && run.replay_index) || 0;
  return plan[idx] || null;
}

async function buildReplayPlan(client, failedRunId) {
  const restart = await failRestart(client, failedRunId, 0);
  return restart.replayPlan;
}

async function recapBeat(cardId, optionId) {
  const live = await publicCard(cardId);
  if (!live) return null;
  const { rows: fullOpts } = await query(
    `SELECT option_id, option_text, result, is_correct
       FROM card_options
      WHERE card_id = $1
      ORDER BY option_id ASC`,
    [cardId]
  );
  const chosen = optionId || null;
  const picked = fullOpts.find((o) => o.option_id === chosen) || {};
  return {
    ...live,
    recap: true,
    auto_advance_ms: 2000,
    tappable: false,
    options: fullOpts.map((o) => ({
      option_id: o.option_id,
      option_text: o.option_text,
      chosen: o.option_id === chosen,
    })),
    outcome: {
      option_id: chosen,
      was_correct: true,
      result: picked.result || "",
    },
  };
}

async function holdBeat(cardId, run) {
  const live = await publicCard(cardId);
  if (!live) return null;
  const plan = asReviewPlan(run && run.review_plan);
  const idx = Number(run && run.review_index) || 0;
  const cleared = Number(run && run.state && run.state.hold_cleared) || 0;
  return {
    ...live,
    hold: true,
    timeout_option_id: null,
    timeout_ms: 0,
    scene: "",
    hold_index: idx,
    hold_total: plan.length,
    hold_cleared: cleared,
    hold_cutouts: HOLD_CUTOUTS,
    bank_min: REVIEW_MIN,
  };
}

function lockedNextAct(catalog, run, answeredIds) {
  if (!run || run.status !== "completed") return null;
  const actCards = {};
  for (const c of catalog) {
    if (!actCards[c.act]) actCards[c.act] = [];
    actCards[c.act].push(c);
  }
  const seen = new Set(answeredIds || []);
  let lastDone = null;
  for (const z of ACT_ZONES) {
    const cards = actCards[z.act] || [];
    if (!cards.length) {
      return lastDone ? { act: z.act, zone: z.zone } : null;
    }
    const finished = cards.every((c) => seen.has(c.card_id));
    if (finished) lastDone = z;
    else break;
  }
  if (!lastDone) return null;
  const idx = ACT_ZONES.findIndex((z) => z.act === lastDone.act);
  if (idx < 0 || idx >= ACT_ZONES.length - 1) return null;
  const next = ACT_ZONES[idx + 1];
  if ((actCards[next.act] || []).length > 0) return null;
  return { act: next.act, zone: next.zone };
}

async function reopenIfMoreCards(run) {
  if (!run || run.status !== "completed") return run;
  const act = await actBoundForRun(pool, run);
  const picked = await pickNextCard(pool, run.id, run.callback_debts, run.start_seq, act);
  if (!picked.cardId) return run;
  await query(
    `UPDATE runs
        SET status = 'active', current_card_id = $1, current_attempt_no = 1, updated_at = now()
      WHERE id = $2`,
    [picked.cardId, run.id]
  );
  run.status = "active";
  run.current_card_id = picked.cardId;
  run.current_attempt_no = 1;
  return persistActCargo(pool, run);
}

async function advanceReplayPlan(client, runId, run) {
  const plan = asReplayPlan(run.replay_plan);
  const nextIndex = (Number(run.replay_index) || 0) + 1;
  if (nextIndex < plan.length) {
    const step = plan[nextIndex];
    await client.query(
      `UPDATE runs
          SET replay_index = $1, current_card_id = $2, current_attempt_no = 1, updated_at = now()
        WHERE id = $3`,
      [nextIndex, step.card_id, runId]
    );
    return { cardId: step.card_id, done: false, cleared: false };
  }
  await client.query(
    `UPDATE runs
        SET replay_plan = '[]'::jsonb, replay_index = 0, updated_at = now()
      WHERE id = $1`,
    [runId]
  );
  const cleared = { ...run, replay_plan: [], replay_index: 0 };
  const act = await actBoundForRun(client, cleared);
  const picked = await pickNextCard(client, runId, cleared.callback_debts, cleared.start_seq, act);
  if (picked.cardId) {
    await client.query(
      `UPDATE runs SET current_card_id = $1, current_attempt_no = 1, updated_at = now() WHERE id = $2`,
      [picked.cardId, runId]
    );
    return { cardId: picked.cardId, done: false, cleared: true, debts: picked.debts };
  }
  await client.query(
    `UPDATE runs SET status = 'completed', current_card_id = NULL, updated_at = now() WHERE id = $1`,
    [runId]
  );
  return { cardId: null, done: true, cleared: true };
}

async function advanceHold(client, run) {
  const plan = asReviewPlan(run.review_plan);
  const nextIndex = (Number(run.review_index) || 0) + 1;
  if (nextIndex < plan.length) {
    await client.query(
      `UPDATE runs
          SET review_index = $1, current_card_id = $2, current_attempt_no = 1, updated_at = now()
        WHERE id = $3`,
      [nextIndex, plan[nextIndex], run.id]
    );
    return { cardId: plan[nextIndex], holding: true };
  }
  const clearedState = clearHoldState(run.state);
  await client.query(
    `UPDATE runs
        SET review_plan = '[]'::jsonb, review_index = 0, state = $1::jsonb, updated_at = now()
      WHERE id = $2`,
    [JSON.stringify(clearedState), run.id]
  );
  const replay = asReplayPlan(run.replay_plan);
  if (replay.length) {
    await client.query(
      `UPDATE runs SET current_card_id = $1, replay_index = 0, current_attempt_no = 1, updated_at = now() WHERE id = $2`,
      [replay[0].card_id, run.id]
    );
    return { cardId: replay[0].card_id, holding: false, replay: true };
  }
  const act = await actBoundForRun(client, run);
  const picked = await pickNextCard(client, run.id, run.callback_debts, run.start_seq, act);
  if (picked.cardId) {
    await client.query(
      `UPDATE runs SET current_card_id = $1, callback_debts = $2::jsonb, current_attempt_no = 1, updated_at = now() WHERE id = $3`,
      [picked.cardId, JSON.stringify(picked.debts), run.id]
    );
    return { cardId: picked.cardId, holding: false, debts: picked.debts };
  }
  await client.query(
    `UPDATE runs SET status = 'completed', current_card_id = NULL, updated_at = now() WHERE id = $1`,
    [run.id]
  );
  return { cardId: null, holding: false, done: true };
}

async function skipSeqFor(client, failedRunId, floorSeq) {
  const restart = await failRestart(client, failedRunId, floorSeq);
  return restart.startSeq;
}

function nightOf(timeOfDay) {
  return timeOfDay === "dusk" || timeOfDay === "night" || timeOfDay === "deep_night";
}

function hookOf(card) {
  const extra = (card && card.extra) || {};
  const authored = extra.hook || (card && card.hook);
  if (authored) return String(authored).trim();
  const t = String((card && card.scene) || "").trim();
  const sentence = (t.match(/^[\s\S]*?[.!?](?:\s|$)/) || [t])[0].trim();
  const words = sentence.split(/\s+/).filter(Boolean);
  return words.slice(0, 12).join(" ");
}

function publicState(state) {
  const s = state || {};
  const cargo = cargoFrom(s);
  const cold = coldFrom(s);
  const warming = warmingFrom(s, cargo);
  return {
    noise: Number(s.noise) || 0,
    light: Number(s.light) || 0,
    yaw: Number(s.yaw) || 0,
    cargo,
    time_cost: Number(s.time_cost) || 0,
    cold,
    warming,
    phase: cold > 0 ? "cold" : "warming",
    ...publicFear(s),
  };
}

async function publicCard(cardId) {
  const { rows: cards } = await query(
    `SELECT card_id, title, scene, decision, debrief, card_type, act, zone, seq, weather, extra, driver, time_of_day,
            (image_bytes IS NOT NULL) AS has_image
       FROM cards
      WHERE card_id = $1`,
    [cardId]
  );
  const card = cards[0];
  if (!card) return null;
  const { rows: options } = await query(
    `SELECT option_id, option_text
       FROM card_options
      WHERE card_id = $1
      ORDER BY option_id ASC`,
    [cardId]
  );
  const extra = card.extra || {};
  const brief = extra.image_brief || {};
  const variation = extra.variation || {};
  const timeOfDay = card.time_of_day || variation.time_of_day || null;
  return {
    card_id: card.card_id,
    card_type: card.card_type,
    title: card.title,
    hook: hookOf(card),
    scene: card.scene,
    debrief: card.debrief || "",
    decision: card.decision,
    act: card.act,
    zone: card.zone,
    driver: card.driver || extra.driver || "ali",
    weather: card.weather || variation.weather || null,
    time_of_day: timeOfDay,
    night: nightOf(timeOfDay),
    camera: brief.camera || null,
    timeout_option_id: extra.timeout_option_id || null,
    timeout_ms: Number(extra.timeout_ms) || 24000,
    show_cold: card.act !== "I",
    suppress_presence: QUIET_IN_FRAME.has(card.card_id),
    lot_states: extra.lot_states || null,
    lot_voice: extra.lot_voice || null,
    ride_along: Array.isArray(extra.ride_along) ? extra.ride_along : null,
    ride_beats: Array.isArray(extra.ride_beats) ? extra.ride_beats : null,
    image_url: card.has_image ? imageUrl(card.card_id) : null,
    options: options.map((o) => ({ option_id: o.option_id, option_text: o.option_text })),
    tappable: true,
  };
}

function lotKeyFromOption(optionId, wasCorrect) {
  if (optionId === "b" || wasCorrect) return "correct";
  if (optionId === "c" || optionId === "d") return "slow";
  return "called";
}

function applyLotState(card, key) {
  const states = card && card.lot_states;
  const row = states && states[key];
  if (!row) return card;
  if (row.stop && card.scene) {
    card.scene = card.scene.replace("calling is what started this", row.stop);
  }
  if (row.debrief) {
    card.debrief = row.debrief;
    if (card.outcome) card.outcome.debrief = row.debrief;
  }
  return card;
}

function applyLotVoice(card, lotState) {
  if (!card || !lotState) return card;
  const voice = card.lot_voice && card.lot_voice[lotState];
  if (!voice) return card;
  if (voice.scene) card.scene = voice.scene;
  if (voice.hook) card.hook = voice.hook;
  if (voice.debrief) card.debrief = voice.debrief;
  if (voice.ride_open && Array.isArray(card.ride_along) && card.ride_along.length) {
    card.ride_along = [voice.ride_open, ...card.ride_along.slice(1)];
  }
  if (voice.bark) card.bark = voice.bark;
  return card;
}

async function applySequenceTone(card, runId) {
  if (!card || !runId) return card;
  const { rows: runRows } = await query(`SELECT lot_state FROM runs WHERE id = $1`, [runId]);
  const lotState = runRows[0] && runRows[0].lot_state;
  if (lotState) applyLotVoice(card, lotState);
  if (card.card_id !== "I-008") return card;
  const { rows } = await query(
    `SELECT option_id, was_correct
       FROM run_answers
      WHERE run_id = $1 AND card_id = 'I-006'
      ORDER BY created_at DESC
      LIMIT 1`,
    [runId]
  );
  const hit = rows[0];
  if (!hit) return card;
  return applyLotState(card, lotKeyFromOption(hit.option_id, hit.was_correct));
}

async function reviewCard(cardId, attempt) {
  const live = await publicCard(cardId);
  if (!live) return null;
  const { rows: fullOpts } = await query(
    `SELECT option_id, option_text, result, is_correct, state_delta
       FROM card_options
      WHERE card_id = $1
      ORDER BY option_id ASC`,
    [cardId]
  );
  const { rows: cards } = await query(`SELECT debrief FROM cards WHERE card_id = $1`, [cardId]);
  const chosen = attempt && attempt.option_id;
  const full = fullOpts.length ? fullOpts : live.options;
  return {
    ...live,
    tappable: false,
    options: full.map((o) => ({
      option_id: o.option_id,
      option_text: o.option_text,
      chosen: o.option_id === chosen,
    })),
    alts: full
      .filter((o) => o.option_id && o.option_id !== chosen && o.result)
      .map((o) => ({
        option_id: o.option_id,
        option_text: o.option_text,
        result: o.result,
        state_delta: o.state_delta || {},
      })),
    outcome: {
      option_id: chosen || null,
      was_correct: Boolean(attempt && attempt.was_correct),
      result: (fullOpts.find((o) => o.option_id === chosen) || {}).result || "",
      debrief: (cards[0] && cards[0].debrief) || "",
    },
  };
}

async function pendingOutcome(runId) {
  const { rows } = await query(
    `SELECT card_id, option_id, was_correct, created_at
       FROM run_answers
      WHERE run_id = $1 AND ms_on_outcome IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [runId]
  );
  return rows[0] || null;
}

async function progressFor(run) {
  const studentId = run && run.student_id;
  if (!studentId) throw new Error("progressFor requires run.student_id");
  const { rows: catalog } = await query(
    `SELECT card_id, act, zone, title, scene, seq, extra
       FROM cards
      ORDER BY seq ASC, card_id ASC`
  );
  const { rows: answers } = await query(
    `SELECT card_id, option_id, was_correct, created_at
       FROM run_answers
      WHERE run_id = $1
      ORDER BY created_at ASC`,
    [run.id]
  );
  const { rows: ever } = await query(
    `SELECT DISTINCT ON (a.card_id) a.card_id, a.was_correct
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1
      ORDER BY a.card_id, a.created_at DESC`,
    [studentId]
  );
  const byCard = new Map();
  for (const a of answers) {
    if (!byCard.has(a.card_id)) byCard.set(a.card_id, a);
  }
  const byEver = new Map(ever.map((r) => [r.card_id, r]));
  const everSet = new Set(ever.map((r) => r.card_id));
  const actCards = {};
  for (const c of catalog) {
    if (!actCards[c.act]) actCards[c.act] = [];
    actCards[c.act].push(c);
  }
  const seededActs = ACT_ZONES.filter((z) => (actCards[z.act] || []).length > 0);
  const lastSeededAct = seededActs.length ? seededActs[seededActs.length - 1].act : "II";
  const runFinished = run.status === "completed";
  const current = catalog.find((c) => c.card_id === run.current_card_id) || null;
  const currentAct = current ? current.act : runFinished ? lastSeededAct : lastSeededAct;
  const list = actCards[currentAct] || [];
  const idx = current ? list.findIndex((c) => c.card_id === current.card_id) + 1 : list.length;
  const total = list.length;
  const zone = (current && current.zone) || (list[0] && list[0].zone) || "The Grid";
  const done = !run.current_card_id || run.status === "completed";
  const saved = done
    ? `Saved · Act ${currentAct}, complete`
    : `Saved · Act ${currentAct}, card ${idx} of ${total}`;
  const resumeLabel = done
    ? null
    : `Resume — ${zone}, card ${idx}`;

  const unlocked = new Set();
  for (const c of catalog) {
    if (!everSet.has(c.card_id)) continue;
    const extra = c.extra || {};
    for (const id of extra.cast || []) unlocked.add(id);
  }

  const log = catalog
    .filter((c) => byEver.has(c.card_id))
    .map((c) => {
      const a = byEver.get(c.card_id);
      return {
        card_id: c.card_id,
        act: c.act,
        zone: c.zone,
        title: c.title,
        scene_fragment: sceneFragment(c.scene),
        clean: Boolean(a.was_correct),
      };
    });

  const acts = ACT_ZONES.map((row) => {
    const cards = actCards[row.act] || [];
    const practiced = cards.filter((c) => everSet.has(c.card_id)).length;
    const isCurrent = row.act === currentAct && !done && run.status === "active";
    const complete = cards.length > 0 && practiced >= cards.length;
    const firstId = cards[0] && cards[0].card_id;
    const leftover = cards.find((c) => !everSet.has(c.card_id));
    return {
      act: row.act,
      zone: row.zone,
      total: cards.length,
      practiced,
      current: isCurrent,
      locked: actEntryLocked(row.act, actCards, everSet),
      complete,
      first_card_id: firstId || null,
      open_card_id: isCurrent && !complete && run.current_card_id
        ? run.current_card_id
        : leftover
          ? leftover.card_id
          : firstId || null,
    };
  });

  const lockedNext = lockedNextAct(
    catalog,
    run,
    answers.map((a) => a.card_id)
  );

  return {
    saved,
    resume: done
      ? null
      : {
          card_id: run.current_card_id,
          title: current ? current.title : "",
          zone,
          index: idx,
          total,
          label: resumeLabel,
        },
    acts,
    log,
    cast: CAST.map((c) => ({
      ...c,
      unlocked: unlocked.has(c.id),
      portrait_url: unlocked.has(c.id) && portraitCardId(c.id, catalog)
        ? "/api/run/cast/" + encodeURIComponent(c.id)
        : null,
    })),
    done,
    locked_next: lockedNext,
    restartable: (answers.length > 0 || done) && !lockedNext,
  };
}

async function previousAnswered(runId, fromCardId) {
  const { rows } = await query(
    `SELECT a.card_id
       FROM run_answers a
       JOIN cards c ON c.card_id = a.card_id
      WHERE a.run_id = $1
      ORDER BY c.seq ASC, c.card_id ASC`,
    [runId]
  );
  const ids = [...new Set(rows.map((r) => r.card_id))];
  if (!fromCardId) return ids.length ? ids[ids.length - 1] : null;
  const i = ids.indexOf(fromCardId);
  if (i > 0) return ids[i - 1];
  if (i === -1 && ids.length) return ids[ids.length - 1];
  return null;
}

async function answeredIdsForStudent(studentId) {
  const { rows: catalog } = await query(
    `SELECT card_id FROM cards ORDER BY seq ASC, card_id ASC`
  );
  const { rows: answered } = await query(
    `SELECT DISTINCT a.card_id
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1`,
    [studentId]
  );
  const seen = new Set(answered.map((r) => r.card_id));
  return catalog.filter((c) => seen.has(c.card_id)).map((c) => c.card_id);
}

async function neighborsAnsweredForStudent(studentId, fromCardId) {
  const ids = await answeredIdsForStudent(studentId);
  if (!ids.length) return { previous_card_id: null, next_card_id: null };
  const i = fromCardId ? ids.indexOf(fromCardId) : -1;
  return {
    previous_card_id: i > 0 ? ids[i - 1] : i === -1 ? ids[ids.length - 1] : null,
    next_card_id: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null,
  };
}

async function previousAnsweredForStudent(studentId, fromCardId) {
  const { previous_card_id } = await neighborsAnsweredForStudent(studentId, fromCardId);
  return previous_card_id;
}

async function firstAnswerForStudent(studentId, cardId) {
  const { rows } = await query(
    `SELECT a.card_id, a.option_id, a.was_correct
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1 AND a.card_id = $2
      ORDER BY a.created_at ASC
      LIMIT 1`,
    [studentId, cardId]
  );
  return rows[0] || null;
}

async function canViewImage(run, cardId, studentId) {
  if (!cardId) return false;
  if (run.current_card_id === cardId) return true;
  const sid = studentId || run.student_id;
  const { rows } = await query(
    `SELECT 1
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1 AND a.card_id = $2
      LIMIT 1`,
    [sid, cardId]
  );
  return rows.length > 0;
}

function dayNight(timeOfDay) {
  if (timeOfDay === "dusk" || timeOfDay === "night" || timeOfDay === "deep_night") return "night";
  return "day";
}

function skillBand(distinctDates) {
  if (distinctDates <= 0) return "Needs road time";
  if (distinctDates < 3) return "Practicing";
  return "Solid";
}

module.exports = {
  purgeExpiredPending,
  pendingForPhone,
  nextUnansweredCard,
  publicCard,
  applySequenceTone,
  lotKeyFromOption,
  reviewCard,
  pendingOutcome,
  progressFor,
  previousAnswered,
  previousAnsweredForStudent,
  neighborsAnsweredForStudent,
  firstAnswerForStudent,
  canViewImage,
  pickNextCard,
  actBoundForRun,
  actEntryLocked,
  isBeatCard,
  QUIET_IN_FRAME,
  queueCallback,
  onMainAnswered,
  clearCallback,
  CALLBACK_GAP,
  dayNight,
  skillBand,
  CAST,
  CAST_CARDS,
  portraitCardId,
  ACT_ZONES,
  cargoFrom,
  ledgerOrigin,
  actOfCardId,
  withActCargo,
  persistActCargo,
  cargoDead,
  cargoFailDispatch,
  checkpointKeep,
  checkpointStartSeq,
  replayWindowAnswers,
  planFromWindow,
  reviewIdsFromAnswers,
  bankHoldMinutes,
  REVIEW_N,
  REVIEW_MIN,
  skipSeqFor,
  checkpointState,
  failRestart,
  rebuildPlayAgain,
  playAgainFrom,
  startActFrom,
  applyDelta,
  buildReplayPlan,
  recapBeat,
  holdBeat,
  replayStep,
  reviewStep,
  asReplayPlan,
  asReviewPlan,
  advanceReplayPlan,
  advanceHold,
  lockedNextAct,
  reopenIfMoreCards,
  publicState,
  hookOf,
  isWatchCard,
  quizableAnswer,
  nightOf,
};
