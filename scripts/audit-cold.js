"use strict";

const fs = require("fs");
const path = require("path");
const { seqFromCard } = require("./card-seq");
const { COLD_PACK, coldFrom, warmingFrom } = require("../src/manifest");

const dir = path.join(__dirname, "..", "cards");
const cards = fs
  .readdirSync(dir)
  .filter((f) => /^II-\d{3}\.json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .filter((c) => !c.callback_of)
  .sort((a, b) => seqFromCard(a) - seqFromCard(b));

let state = {};
for (const c of cards) {
  const remaining = coldFrom(state);
  const time = Number(state.time_cost) || 0;
  const noise = Math.max(0, Number(state.noise) || 0);
  const light = Math.max(0, Number(state.light) || 0);
  const cargo = Math.max(0, Math.min(100, 100 - time - noise - Math.round(light / 2)));
  const warming = warmingFrom(state, cargo);
  const tag = remaining > 0 ? "COLD " + remaining : "WARMING " + warming;
  const correct = (c.options || []).find((o) => o.correct);
  const cost = correct && correct.state_delta ? Number(correct.state_delta.time_cost) || 0 : 0;
  console.log(c.card_id + "\t" + tag + "\t+" + cost);
  if (correct && correct.state_delta) {
    const d = correct.state_delta;
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "number") state[k] = (Number(state[k]) || 0) + v;
    }
  }
}
console.log("pack", COLD_PACK);
