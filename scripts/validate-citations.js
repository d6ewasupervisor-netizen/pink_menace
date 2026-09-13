"use strict";

const fs = require("fs");
const path = require("path");

const PAGE_RE = /\bp\.?\s*\d+\b/i;

function loadTables() {
  const pack = path.join(__dirname, "..", "pack");
  const dol = JSON.parse(fs.readFileSync(path.join(pack, "07_DOL_SECTIONS.json"), "utf8"));
  const psdp = JSON.parse(fs.readFileSync(path.join(pack, "08_PSDP_SKILLS.json"), "utf8"));
  return {
    dol: new Set(dol.sections),
    psdp: new Set(psdp.skills),
  };
}

function validateCard(raw, tables) {
  const id = raw.card_id || "(missing card_id)";
  const errors = [];
  const dolRaw = raw.source && raw.source.dol_section;
  const dol = dolRaw == null || dolRaw === "" ? "n/a" : dolRaw;
  const psdp = raw.source && raw.source.psdp_skill;
  if (!tables.dol.has(dol)) {
    errors.push(`${id}: dol_section ${JSON.stringify(dolRaw)} is not in pack/07_DOL_SECTIONS.json`);
  }
  if (!psdp || !tables.psdp.has(psdp)) {
    errors.push(`${id}: psdp_skill ${JSON.stringify(psdp)} is not in pack/08_PSDP_SKILLS.json`);
  }
  const stat = raw.source && raw.source.stat_cited;
  if (stat && !PAGE_RE.test(stat)) {
    errors.push(`${id}: stat_cited must include a page number or the field must be omitted`);
  }
  return errors;
}

function assertCard(raw, tables) {
  const errors = validateCard(raw, tables);
  if (errors.length) {
    const err = new Error(errors.join("\n"));
    err.validation = errors;
    throw err;
  }
}

module.exports = { loadTables, validateCard, assertCard, PAGE_RE };

if (require.main === module) {
  const tables = loadTables();
  const dir = path.join(__dirname, "..", "cards");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
    .sort();
  const all = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    all.push(...validateCard(raw, tables));
  }
  if (all.length) {
    console.error(all.join("\n"));
    process.exit(1);
  }
  console.log("citations ok", files.length);
}
