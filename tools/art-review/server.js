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
const TAKES_DIR = path.join(CARDS, "takes");
const STATE_PATH = path.join(CARDS, "art-review-state.json");
const PUBLIC = path.join(__dirname, "public");
const ID_RE = /^(I|II|III|IV|V|VI|VII)-\d{3}$/;
const TAKE_FILE_RE = /^((?:I|II|III|IV|V|VI|VII)-\d{3})(?:-([a-z]+))?-take-(\d+)\.png$/i;
const PICK_RE = /^(live|(?:[a-z]+-)?take-\d+)$/;

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

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(file, data) {
  const body = JSON.stringify(data, null, 2) + "\n";
  const tmp = file + ".tmp";
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      fs.writeFileSync(tmp, body);
      try {
        fs.renameSync(tmp, file);
      } catch {
        fs.copyFileSync(tmp, file);
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* OneDrive may hold the temp file */
        }
      }
      return;
    } catch (err) {
      last = err;
      const code = err && err.code;
      if (code !== "UNKNOWN" && code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") {
        throw err;
      }
      sleepMs(50 * (i + 1));
    }
  }
  throw last;
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

function takeLabel(batch, n) {
  if (!batch) return String(n);
  return batch.toUpperCase() + n;
}

function listTakes(id) {
  const takes = [];
  const live = imageMeta(id);
  if (live.has_image) {
    takes.push({
      id: "live",
      label: "Live",
      batch: null,
      n: 0,
      image_url: live.image_url,
      mtime: live.mtime,
    });
  }
  if (!fs.existsSync(TAKES_DIR)) return takes;
  for (const f of fs.readdirSync(TAKES_DIR)) {
    const m = f.match(TAKE_FILE_RE);
    if (!m) continue;
    if (m[1].toUpperCase() !== id) continue;
    const batch = m[2] ? m[2].toLowerCase() : "";
    const n = Number(m[3]);
    const key = (batch ? batch + "-take-" : "take-") + n;
    const p = path.join(TAKES_DIR, f);
    const st = fs.statSync(p);
    takes.push({
      id: key,
      label: takeLabel(batch, n),
      batch: batch || null,
      n,
      file: f,
      image_url: "/take/" + encodeURIComponent(f) + "?v=" + st.mtimeMs,
      mtime: st.mtimeMs,
    });
  }
  takes.sort((a, b) => {
    if (a.id === "live") return -1;
    if (b.id === "live") return 1;
    const ba = a.batch || "";
    const bb = b.batch || "";
    if (ba !== bb) return ba.localeCompare(bb);
    return a.n - b.n;
  });
  return takes;
}

function optionRows(card) {
  if (!Array.isArray(card.options)) return [];
  return card.options.map((o) => ({
    id: o.id,
    text: o.text || "",
    correct: Boolean(o.correct),
  }));
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
  if (!v || typeof v !== "object") {
    return { tag: null, note: "", pick: "", writer_first: false };
  }
  const tag = normalizeTag(v.tag || v.status);
  const pick = typeof v.pick === "string" && PICK_RE.test(v.pick) ? v.pick : "";
  return {
    tag,
    note: typeof v.note === "string" ? v.note : "",
    caveat: typeof v.caveat === "string" ? v.caveat : "",
    pick,
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
    options: optionRows(card),
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
      take_count: listTakes(id).length,
      tag: v.tag,
      pick: v.pick || "",
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
app.use((req, res, next) => {
  if (/\.(?:js|css|html)$/i.test(req.path) || req.path === "/") {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});
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
    picks: Object.fromEntries(cards.filter((c) => c.pick).map((c) => [c.card_id, c.pick])),
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
  const takes = listTakes(id);
  const pick = takes.some((t) => t.id === v.pick) ? v.pick : "";
  const deck = listAct(card.act);
  const idx = deck.findIndex((c) => c.card_id === id);
  res.json({
    ok: true,
    ...summarize(card),
    ...img,
    takes,
    pick,
    tag: v.tag,
    note: v.note,
    caveat: v.caveat,
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

app.get("/take/:file", (req, res) => {
  const file = path.basename(String(req.params.file || ""));
  if (!TAKE_FILE_RE.test(file)) return res.status(400).end();
  const p = path.join(TAKES_DIR, file);
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
  let pick = prev.pick || "";
  if (body.pick != null) {
    const raw = String(body.pick);
    if (raw === "") pick = "";
    else if (!PICK_RE.test(raw)) return res.status(400).json({ ok: false, error: "bad pick" });
    else pick = raw;
  }
  state.verdicts[id] = {
    tag: nextTag,
    note: body.note != null ? String(body.note) : prev.note,
    pick,
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
