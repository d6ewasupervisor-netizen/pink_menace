"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const { seqFromCard } = require("../../scripts/card-seq");
const {
  TAGS,
  TAG_IDS,
  normalizeTag,
  bucketOf,
  countBuckets,
  formatCounts,
  writerFirst,
} = require("./tags");

const ROOT = path.join(__dirname, "..", "..");
const CARDS = path.join(ROOT, "cards");
const STATE_PATH = path.join(CARDS, "art-review-state.json");
const PUBLIC = path.join(__dirname, "public");
const ID_RE = /^(I|II|III|IV|V|VI|VII)-\d{3}$/;

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const PORT = Number(flag("--port", process.env.ART_REVIEW_PORT || 3847));
const BOOT_ACT = flag("--act", "III");
const BOOT_CARD = flag("--card", "III-010");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function cardFiles() {
  return fs
    .readdirSync(CARDS)
    .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
    .sort();
}

function pngPath(id) {
  return path.join(CARDS, id + ".png");
}

function imageMeta(id) {
  const p = pngPath(id);
  if (!fs.existsSync(p)) return { has_image: false, image_url: null, mtime: 0 };
  const st = fs.statSync(p);
  return {
    has_image: true,
    image_url: "/still/" + encodeURIComponent(id) + ".png?v=" + st.mtimeMs,
    mtime: st.mtimeMs,
  };
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { act: BOOT_ACT, cursor: BOOT_CARD, verdicts: {} };
  }
  try {
    const raw = readJson(STATE_PATH);
    return {
      act: String(raw.act || BOOT_ACT),
      cursor: String(raw.cursor || BOOT_CARD),
      verdicts: raw.verdicts && typeof raw.verdicts === "object" ? raw.verdicts : {},
    };
  } catch {
    return { act: BOOT_ACT, cursor: BOOT_CARD, verdicts: {} };
  }
}

function saveState(state) {
  writeJson(STATE_PATH, {
    act: state.act,
    cursor: state.cursor,
    verdicts: state.verdicts || {},
  });
}

function verdictOf(state, id) {
  const v = state.verdicts[id];
  if (!v || typeof v !== "object") return { tag: null, note: "", writer_first: false };
  const tag = normalizeTag(v.tag || v.status);
  return {
    tag,
    note: typeof v.note === "string" ? v.note : "",
    writer_first: writerFirst(tag),
  };
}

function summarize(card) {
  const brief = card.image_brief || {};
  const geo = brief.geometry || null;
  return {
    card_id: card.card_id,
    act: card.act,
    zone: card.zone,
    driver: card.driver,
    card_type: card.card_type,
    title: card.title,
    hook: card.hook || "",
    scene: card.scene || "",
    decision: card.decision || "",
    debrief: card.debrief || "",
    camera: brief.camera || "",
    read: brief.read || "",
    subject: brief.subject || "",
    geometry: geo,
  };
}

function listAct(act) {
  const state = loadState();
  const rows = [];
  for (const f of cardFiles()) {
    const card = readJson(path.join(CARDS, f));
    if (String(card.act) !== String(act)) continue;
    const id = card.card_id;
    const v = verdictOf(state, id);
    rows.push({
      card_id: id,
      title: card.title,
      driver: card.driver,
      seq: seqFromCard(card),
      has_image: imageMeta(id).has_image,
      tag: v.tag,
      bucket: v.tag ? bucketOf(v.tag) : "open",
      writer_first: v.writer_first,
    });
  }
  rows.sort((a, b) => a.seq - b.seq || a.card_id.localeCompare(b.card_id));
  return rows;
}

function actsPresent() {
  const set = new Set();
  for (const f of cardFiles()) {
    const card = readJson(path.join(CARDS, f));
    if (card.act) set.add(String(card.act));
  }
  return ["II", "III", "IV", "V", "VI", "VII", "I"].filter((a) => set.has(a));
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(PUBLIC, { index: false, maxAge: 0 }));

app.get("/api/meta", (_req, res) => {
  const state = loadState();
  res.json({
    ok: true,
    acts: actsPresent(),
    act: state.act,
    cursor: state.cursor,
    port: PORT,
    tags: TAGS,
  });
});

app.get("/api/deck", (req, res) => {
  const state = loadState();
  const act = String(req.query.act || state.act || BOOT_ACT);
  const cards = listAct(act);
  const counts = countBuckets(cards);
  res.json({
    ok: true,
    act,
    cards,
    counts,
    counts_label: formatCounts(counts),
    cursor: state.cursor,
  });
});

app.get("/api/queue", (req, res) => {
  const state = loadState();
  const act = String(req.query.act || state.act || BOOT_ACT);
  const cards = listAct(act);
  const byTag = {};
  for (const t of TAGS) byTag[t.id] = [];
  const open = [];
  for (const c of cards) {
    if (!c.tag) open.push(c.card_id);
    else byTag[c.tag].push(c.card_id);
  }
  res.json({
    ok: true,
    act,
    counts: countBuckets(cards),
    counts_label: formatCounts(countBuckets(cards)),
    by_tag: byTag,
    open,
    writer_first: cards.filter((c) => c.writer_first).map((c) => c.card_id),
    recompile: cards.filter((c) => c.bucket === "recompile" && !c.writer_first).map((c) => c.card_id),
  });
});

app.get("/api/card/:id", (req, res) => {
  const id = String(req.params.id || "").toUpperCase();
  if (!ID_RE.test(id)) return res.status(400).json({ ok: false, error: "bad id" });
  const file = path.join(CARDS, id + ".json");
  if (!fs.existsSync(file)) return res.status(404).json({ ok: false, error: "missing" });
  const card = readJson(file);
  const state = loadState();
  const v = verdictOf(state, id);
  const img = imageMeta(id);
  const deck = listAct(card.act);
  const idx = deck.findIndex((c) => c.card_id === id);
  res.json({
    ok: true,
    ...summarize(card),
    ...img,
    tag: v.tag,
    note: v.note,
    writer_first: v.writer_first,
    bucket: v.tag ? bucketOf(v.tag) : "open",
    index: idx,
    total: deck.length,
    prev: idx > 0 ? deck[idx - 1].card_id : null,
    next: idx >= 0 && idx < deck.length - 1 ? deck[idx + 1].card_id : null,
  });
});

app.get("/still/:id.png", (req, res) => {
  const id = String(req.params.id || "").replace(/\.png$/i, "").toUpperCase();
  if (!ID_RE.test(id)) return res.status(400).end();
  const p = pngPath(id);
  if (!fs.existsSync(p)) return res.status(404).end();
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(p);
});

app.get("/api/state", (_req, res) => {
  res.json({ ok: true, ...loadState() });
});

app.put("/api/cursor", (req, res) => {
  const body = req.body || {};
  const state = loadState();
  if (body.act) state.act = String(body.act);
  if (body.cursor) {
    const id = String(body.cursor).toUpperCase();
    if (!ID_RE.test(id)) return res.status(400).json({ ok: false, error: "bad id" });
    state.cursor = id;
  }
  saveState(state);
  res.json({ ok: true, ...state });
});

app.put("/api/verdict", (req, res) => {
  const body = req.body || {};
  const id = String(body.card_id || "").toUpperCase();
  if (!ID_RE.test(id)) return res.status(400).json({ ok: false, error: "bad id" });
  const tag = normalizeTag(body.tag || body.status);
  if (body.tag != null && body.tag !== "" && body.tag !== "open" && !TAG_IDS.has(tag)) {
    return res.status(400).json({ ok: false, error: "bad tag" });
  }
  const state = loadState();
  const prev = verdictOf(state, id);
  const nextTag = body.tag === "" || body.tag === "open" ? null : tag || prev.tag;
  state.verdicts[id] = {
    tag: nextTag,
    note: body.note != null ? String(body.note) : prev.note,
    updated_at: new Date().toISOString(),
  };
  state.cursor = id;
  const file = path.join(CARDS, id + ".json");
  if (fs.existsSync(file)) state.act = readJson(file).act || state.act;
  saveState(state);
  res.json({
    ok: true,
    card_id: id,
    ...state.verdicts[id],
    writer_first: writerFirst(nextTag),
    bucket: nextTag ? bucketOf(nextTag) : "open",
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, "127.0.0.1", () => {
  const state = loadState();
  if (!state.cursor) {
    state.act = BOOT_ACT;
    state.cursor = BOOT_CARD;
    saveState(state);
  }
  console.log(`art-review http://127.0.0.1:${PORT}/?act=${BOOT_ACT}&card=${BOOT_CARD}`);
});
