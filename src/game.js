"use strict";

const { query } = require("./db");
const { publicFear } = require("./presence");

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

async function pickNextCard(client, runId, debts, startSeq) {
  const list = asDebts(debts);
  const skip = Number(startSeq) || 0;
  for (const d of list) {
    if (Number(d.remaining) > 0) continue;
    const id = await ledgerForOrigin(client, runId, d.from_card);
    if (id) return { cardId: id, debts: list };
  }
  const { rows: main } = await client.query(
    `SELECT c.card_id
       FROM cards c
      WHERE c.callback_of IS NULL
        AND c.seq > $2
        AND NOT EXISTS (
              SELECT 1 FROM run_answers a
               WHERE a.run_id = $1 AND a.card_id = c.card_id
            )
      ORDER BY c.seq ASC, c.card_id ASC
      LIMIT 1`,
    [runId, skip]
  );
  if (main[0]) return { cardId: main[0].card_id, debts: list };
  for (const d of list) {
    const id = await ledgerForOrigin(client, runId, d.from_card);
    if (id) return { cardId: id, debts: list };
  }
  return { cardId: null, debts: list };
}

function queueCallback(debts, fromCard) {
  const list = asDebts(debts);
  if (list.some((d) => d.from_card === fromCard)) return list;
  list.push({ from_card: fromCard, remaining: CALLBACK_GAP });
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
  { act: "III", zone: "The Arterial" },
  { act: "IV", zone: "The Core" },
  { act: "V", zone: "The Ribbon" },
  { act: "VI", zone: "The Backcountry" },
  { act: "VII", zone: "The Dark Hours" },
];

const CAST = [
  { id: "ali", name: "Ali", line: "Cranberry braid. The Menace. The Grid is hers." },
  { id: "deac", name: "Deac", line: "The Ledger. He still counts cadence." },
  { id: "yuna", name: "Yuna", line: "Encore. The horns, not the lights." },
  { id: "gracie", name: "Gracie", line: "Orange tabby. Dash. Cream chest." },
  { id: "mya", name: "Mya", line: "Mackerel tabby. Heavy. Green eyes." },
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
  return "/api/run/image/" + encodeURIComponent(cardId);
}

function cargoFrom(state) {
  const s = state || {};
  const time = Number(s.time_cost) || 0;
  const noise = Math.max(0, Number(s.noise) || 0);
  const light = Math.max(0, Number(s.light) || 0);
  return Math.max(0, Math.min(100, 100 - time - noise - Math.round(light / 2)));
}

function cargoDead(state, delta) {
  return cargoFrom(state) <= 0 || Boolean(delta && delta.fatal);
}

function checkpointKeep(answersBefore) {
  return Math.floor(Math.max(0, Number(answersBefore) || 0) / 5) * 5;
}

async function skipSeqFor(client, answersBefore) {
  const keep = checkpointKeep(answersBefore);
  if (keep <= 0) return 0;
  const { rows } = await client.query(
    `SELECT seq FROM cards ORDER BY seq ASC, card_id ASC OFFSET $1 LIMIT 1`,
    [keep - 1]
  );
  return rows[0] ? Number(rows[0].seq) : 0;
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

function cargoFailDispatch() {
  return "KILO. Ledger. The cold ran out. They're on you. You are dark. Copy.";
}

function publicState(state) {
  const s = state || {};
  return {
    noise: Number(s.noise) || 0,
    light: Number(s.light) || 0,
    yaw: Number(s.yaw) || 0,
    cargo: cargoFrom(s),
    ...publicFear(s),
  };
}

async function publicCard(cardId) {
  const { rows: cards } = await query(
    `SELECT card_id, title, scene, decision, card_type, act, zone, seq, weather, extra, driver, time_of_day
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
    decision: card.decision,
    act: card.act,
    zone: card.zone,
    driver: card.driver || extra.driver || "ali",
    weather: card.weather || variation.weather || null,
    time_of_day: timeOfDay,
    night: nightOf(timeOfDay),
    camera: brief.camera || null,
    timeout_option_id: extra.timeout_option_id || null,
    timeout_ms: Number(extra.timeout_ms) || 8000,
    image_url: imageUrl(card.card_id),
    options: options.map((o) => ({ option_id: o.option_id, option_text: o.option_text })),
    tappable: true,
  };
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
    `SELECT DISTINCT a.card_id
       FROM run_answers a
       JOIN runs r ON r.id = a.run_id
      WHERE r.student_id = $1`,
    [run.student_id]
  );
  const byCard = new Map();
  for (const a of answers) {
    if (!byCard.has(a.card_id)) byCard.set(a.card_id, a);
  }
  const everSet = new Set(ever.map((r) => r.card_id));
  const actCards = {};
  for (const c of catalog) {
    if (!actCards[c.act]) actCards[c.act] = [];
    actCards[c.act].push(c);
  }
  const current = catalog.find((c) => c.card_id === run.current_card_id) || null;
  const currentAct = (current && current.act) || (catalog[catalog.length - 1] && catalog[catalog.length - 1].act) || "II";
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
    .filter((c) => byCard.has(c.card_id))
    .map((c) => {
      const a = byCard.get(c.card_id);
      return {
        card_id: c.card_id,
        title: c.title,
        scene_fragment: sceneFragment(c.scene),
        clean: Boolean(a.was_correct),
      };
    });

  const acts = ACT_ZONES.map((row) => {
    const cards = actCards[row.act] || [];
    const practiced = cards.filter((c) => byCard.has(c.card_id)).length;
    const isCurrent = row.act === currentAct && !done;
    return {
      act: row.act,
      zone: row.zone,
      total: cards.length,
      practiced,
      current: isCurrent,
      locked: cards.length === 0 || (row.act !== currentAct && practiced === 0),
      complete: cards.length > 0 && practiced >= cards.length,
    };
  });

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
    restartable: answers.length > 0 || done,
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

async function canViewImage(run, cardId) {
  if (!cardId) return false;
  if (run.current_card_id === cardId) return true;
  const { rows } = await query(
    `SELECT 1 FROM run_answers WHERE run_id = $1 AND card_id = $2 LIMIT 1`,
    [run.id, cardId]
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
  reviewCard,
  pendingOutcome,
  progressFor,
  previousAnswered,
  canViewImage,
  pickNextCard,
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
  cargoDead,
  cargoFailDispatch,
  checkpointKeep,
  skipSeqFor,
  publicState,
  hookOf,
  nightOf,
};
