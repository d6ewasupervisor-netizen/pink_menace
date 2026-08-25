"use strict";

const { query } = require("./db");

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

async function pickNextCard(client, runId, debts) {
  const list = asDebts(debts);
  for (const d of list) {
    if (Number(d.remaining) > 0) continue;
    const id = await ledgerForOrigin(client, runId, d.from_card);
    if (id) return { cardId: id, debts: list };
  }
  const { rows: main } = await client.query(
    `SELECT c.card_id
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

async function publicCard(cardId) {
  const { rows: cards } = await query(
    `SELECT card_id, title, scene, decision, card_type
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
  return {
    card_id: card.card_id,
    card_type: card.card_type,
    title: card.title,
    scene: card.scene,
    decision: card.decision,
    image_url: "/api/run/image",
    options: options.map((o) => ({ option_id: o.option_id, option_text: o.option_text })),
  };
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
  pickNextCard,
  queueCallback,
  onMainAnswered,
  clearCallback,
  CALLBACK_GAP,
  dayNight,
  skillBand,
};
