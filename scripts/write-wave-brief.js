"use strict";

/**
 * Emit an IDs-only wave brief. Frame description stays in card JSON.
 *   node scripts/write-wave-brief.js V-013 V-011 V-006
 *   node scripts/write-wave-brief.js --out WAVE_BRIEF.md V-013 V-011
 */

const fs = require("fs");
const path = require("path");
const { loadCardJson, CARD_ID_RE } = require("./card-json");

const RULE =
  "**Wave briefs list card IDs only.** A wave brief, stills batch brief, or parallel stills prompt lists card IDs and nothing else. It is not a source of frame descriptions. `image_brief` and the frame description are always read from the card JSON at compile time. Card JSON is the sole brief authority. Stale parallel briefs must not override the locked card.";

function parseArgs(argv) {
  const ids = [];
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      out = argv[++i];
      continue;
    }
    ids.push(argv[i]);
  }
  return { ids, out };
}

function renderWaveBrief(ids, root) {
  if (!ids.length) {
    throw new Error("usage: write-wave-brief.js [--out WAVE_BRIEF.md] V-013 V-011");
  }
  const lines = ["# Wave brief", "", RULE, ""];
  for (const id of ids) {
    if (!CARD_ID_RE.test(id)) {
      throw new Error(`not a card id: ${JSON.stringify(id)} — wave briefs list card IDs only`);
    }
    loadCardJson(id, root);
    lines.push(`- ${id}`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const { ids, out } = parseArgs(process.argv.slice(2));
  const body = renderWaveBrief(ids);
  if (out) {
    const dest = path.resolve(out);
    fs.writeFileSync(dest, body);
    console.log("wrote", dest);
  } else {
    process.stdout.write(body);
  }
}

if (require.main === module) main();

module.exports = { renderWaveBrief, RULE };
