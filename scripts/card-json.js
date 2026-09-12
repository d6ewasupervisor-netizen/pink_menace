"use strict";

const fs = require("fs");
const path = require("path");

const CARD_ID_RE = /^(I|II|III|IV|V|VI|VII)-\d{3}(?:-[a-z][a-z0-9-]*)?$/;
const ROOT = path.join(__dirname, "..");

function loadCardJson(id, root) {
  const base = root || ROOT;
  if (!CARD_ID_RE.test(id)) {
    throw new Error(`not a card id: ${JSON.stringify(id)} — wave briefs list card IDs only`);
  }
  const file = path.join(base, "cards", `${id}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`card JSON missing: cards/${id}.json (sole brief authority)`);
  }
  const card = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!card.image_brief) {
    throw new Error(`${id}: missing image_brief in card JSON`);
  }
  return card;
}

module.exports = { loadCardJson, CARD_ID_RE, ROOT };
