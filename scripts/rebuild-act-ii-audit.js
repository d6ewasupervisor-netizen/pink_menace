"use strict";

const fs = require("fs");
const path = require("path");
const { seqFromCard } = require("./card-seq");

const dir = path.join(__dirname, "..", "cards");
const out = path.join(dir, "ACT_II_FOR_AUDIT.json");

const cards = fs
  .readdirSync(dir)
  .filter((f) => /^II-\d{3}\.json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .sort((a, b) => seqFromCard(a) - seqFromCard(b));

fs.writeFileSync(out, JSON.stringify(cards, null, 2) + "\n");
console.log("wrote", cards.length, "cards to", path.basename(out));
