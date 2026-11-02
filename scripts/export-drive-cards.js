"use strict";

/**
 * Re-export the card deck into the drive's bundle.
 *
 *   node scripts/export-drive-cards.js        (npm run export-drive-cards)
 *
 * `cards/*.json` is the source of truth (seeded to Postgres by
 * `scripts/seed-cards.js`); `drive/src/quietroads/data/cards.json` is the copy the
 * client ships. The field list lives in `scripts/drive-card-fields.js` — one list,
 * used by this exporter and by `drive/test/deck-parity.test.ts`, so the bundle can
 * never again drift from the deck the way it did with the card clocks (AUDIT §21).
 *
 * Never hand-edit the bundle: run this.
 */

const fs = require("fs");
const path = require("path");
const { bundleCard } = require("./drive-card-fields");

const ROOT = path.join(__dirname, "..");
const CARDS_DIR = path.join(ROOT, "cards");
const OUT = path.join(ROOT, "drive", "src", "quietroads", "data", "cards.json");
// The seed's own filter: a card file is `<act>-<nnn>.json`, never a bundle.
const CARD_FILE = /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/;

/** The still the drive will request, if there is one on disk. */
function hasStill(cardId) {
  return [".png", ".jpg"].some((ext) => fs.existsSync(path.join(CARDS_DIR, cardId + ext)));
}

function main() {
  const files = fs.readdirSync(CARDS_DIR).filter((f) => CARD_FILE.test(f)).sort();
  if (!files.length) throw new Error("no card json in cards/");

  const seen = new Set();
  const cards = files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(CARDS_DIR, file), "utf8"));
    const id = raw.card_id;
    if (!id) throw new Error(`${file}: missing card_id`);
    if (`${id}.json` !== file) throw new Error(`${file}: card_id is ${id}`);
    if (seen.has(id)) throw new Error(`${file}: duplicate card_id ${id}`);
    seen.add(id);
    return bundleCard(raw, { hasStill: hasStill(id) });
  });

  // The bundle has always been 1-space indented, CRLF, no trailing newline.
  const body = JSON.stringify(cards, null, 1).replace(/\n/g, "\r\n");
  fs.writeFileSync(OUT, body);
  console.log(`wrote ${cards.length} cards to ${path.relative(ROOT, OUT)}`);
}

if (require.main === module) main();

module.exports = { main };
