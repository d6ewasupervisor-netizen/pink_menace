"use strict";

/**
 * The one list of fields the /drive deck copy carries.
 *
 * `drive/src/quietroads/data/cards.json` is a *projection* of `cards/*.json`, not a
 * second copy of the deck. `scripts/export-drive-cards.js` writes it and
 * `drive/test/deck-parity.test.ts` checks it field by field; both read this module,
 * so a field the drive reads cannot quietly fall out of the bundle again — that is
 * exactly what happened to `timeout_option_id` / `timeout_ms` on 17 cards, and the
 * cockpit ran without a clock until AUDIT §21.
 *
 * What is deliberately NOT copied:
 *   - `options[].correct`, `options[].result`, `options[].state_delta` — the answer
 *     key never ships; `POST /api/drive/card-answers` grades from `card_options`
 *     (`src/routes-drive.js`).
 *   - `image_brief` — art direction, tens of kB per card, read by nobody in the
 *     client.
 *   - `ride_along` / `ride_beats` / `lot_states` / `lot_voice` / `presence` — the
 *     card game's own surfaces, not the drive's.
 *
 * Every other field of a card is copied. `image` is not in the source at all: it is
 * the drive's route for the card's still, and it is null when there is no still on
 * disk (II-031), which is the same rule `src/routes-drive.js:187` applies to the
 * row's `image_url`.
 */

/**
 * Top-level fields, in the order the bundle has always written them. Order is not
 * part of parity — it is kept so a re-export diffs only what actually changed.
 */
const CARD_FIELDS = [
  "act",
  "zone",
  "driver",
  "card_type",
  "title",
  "hook",
  "scene",
  "decision",
  "options",
  "debrief",
  "source",
  "cast",
  "antagonist",
  "callback_of",
  "schedules_callback",
  "variation",
  "card_id",
  "timeout_option_id",
  "timeout_ms",
  "image",
];

/** An option ships as its id and its text. The grade stays on the server. */
const OPTION_FIELDS = ["id", "text"];

/** `source` is the card's citation; all of it is copied. */
const SOURCE_FIELDS = ["psdp_skill", "dol_section", "teaching_target", "stat_cited"];

/** Where the client asks for a card's still (`GET /api/drive/image/:id`). */
const imagePathFor = (cardId) => `/api/drive/image/${cardId}`;

/** Copy `fields` off `raw`, dropping the ones the card does not have. */
function project(raw, fields) {
  const out = {};
  for (const field of fields) if (raw[field] !== undefined) out[field] = raw[field];
  return out;
}

/**
 * One card of `cards/*.json`, as the drive's bundle carries it.
 *
 * `hasStill` is the caller's file-system answer (a `.png` or `.jpg` next to the
 * card json); it only decides the `image` path.
 *
 * `decision` / `options` are absent on dossiers and beats, and
 * `timeout_option_id` / `timeout_ms` are absent on every card that does not run a
 * clock — "no timeout id, no clock" is the drive's rule (`cardTimeout.ts`), and
 * writing the fields as null everywhere would only add 228 lines of noise.
 */
function bundleCard(raw, { hasStill = true } = {}) {
  const card = {};
  for (const field of CARD_FIELDS) {
    switch (field) {
      case "options": {
        const options = Array.isArray(raw.options) ? raw.options : [];
        if (options.length) card.options = options.map((o) => project(o, OPTION_FIELDS));
        continue;
      }
      case "source":
        card.source = project(raw.source || {}, SOURCE_FIELDS);
        continue;
      case "image":
        card.image = hasStill ? imagePathFor(raw.card_id) : null;
        continue;
      case "timeout_option_id":
      case "timeout_ms":
        if (!raw.timeout_option_id) continue; // no id, no clock, no fields
        card[field] = raw[field] === undefined ? null : raw[field];
        continue;
      case "decision":
        if (raw.decision) card.decision = raw.decision;
        continue;
      default:
        card[field] = raw[field] === undefined ? null : raw[field];
    }
  }
  return card;
}

module.exports = {
  CARD_FIELDS,
  OPTION_FIELDS,
  SOURCE_FIELDS,
  imagePathFor,
  bundleCard,
};
