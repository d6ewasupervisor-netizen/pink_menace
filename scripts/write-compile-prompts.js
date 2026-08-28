"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("usage: write-compile-prompts.js II-009 II-026");
  process.exit(2);
}

for (const id of ids) {
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
    `# attachments: ${(row.attachments || []).join(", ") || "none"}`,
    `# camera: ${row.camera}`,
    "",
    row.prompt,
    "",
  ].join("\n");
  fs.writeFileSync(out, body);
  console.log("wrote", out);
}
