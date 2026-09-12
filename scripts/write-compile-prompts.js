"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { CARD_ID_RE } = require("./card-json");

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("usage: write-compile-prompts.js II-009 II-026");
  process.exit(2);
}

for (const id of ids) {
  if (/\.md$/i.test(id) || (/wave/i.test(id) && !CARD_ID_RE.test(id))) {
    console.error("card JSON is the sole brief authority — pass card IDs, not a wave brief");
    process.exit(2);
  }
  if (!CARD_ID_RE.test(id)) {
    console.error(`not a card id: ${id} — wave briefs list card IDs only`);
    process.exit(2);
  }
  const run = spawnSync("node", ["scripts/compile-images.js", "--card", id], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
  });
  const text = run.stdout || "";
  const jsonEnd = text.indexOf("\n]\n");
  if (jsonEnd === -1) {
    console.error(id, "compile failed:\n", run.stderr || text);
    process.exit(1);
  }
  const rows = JSON.parse(text.slice(0, jsonEnd + 2));
  const row = rows[0];
  const out = path.join(__dirname, "..", "cards", `${id}.compile.txt`);
  const body = [
    `# ${id} — GPT Image 2 compile prompt`,
    `# image_brief authority: cards/${id}.json`,
    `# wave briefs list card IDs only — do not compile from a parallel brief`,
    `# attachments: ${(row.attachments || []).join(", ") || "none"}`,
    `# camera: ${row.camera}`,
    "",
    row.prompt,
    "",
  ].join("\n");
  fs.writeFileSync(out, body);
  console.log("wrote", out);
}
