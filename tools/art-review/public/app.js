"use strict";

const actsEl = document.getElementById("acts");
const countsEl = document.getElementById("counts");
const stillWrap = document.getElementById("still-wrap");
const still = document.getElementById("still");
const missing = document.getElementById("missing");
const kicker = document.getElementById("kicker");
const title = document.getElementById("title");
const hook = document.getElementById("hook");
const scene = document.getElementById("scene");
const decision = document.getElementById("decision");
const optionsEl = document.getElementById("options");
const read = document.getElementById("read");
const geo = document.getElementById("geo");
const tagsEl = document.getElementById("tags");
const routeEl = document.getElementById("route");
const caveatEl = document.getElementById("caveat");
const note = document.getElementById("note");
const takesEl = document.getElementById("takes");
const strip = document.getElementById("strip");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const phoneBtn = document.getElementById("phone");

const params = new URLSearchParams(location.search);
let act = params.get("act") || "III";
let currentId = (params.get("card") || "III-010").toUpperCase();
let deck = [];
let card = null;
let tags = [];
let noteTimer = 0;
let viewedId = "";

function setQuery() {
  const q = new URLSearchParams({ act, card: currentId });
  history.replaceState(null, "", "/?" + q.toString());
}

async function api(url, opt) {
  const res = await fetch(url, opt);
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || res.statusText);
  return data;
}

function geoLine(g) {
  if (!g) return "";
  return [g.ego_heading, g.ego_lane_side, g.ego_nose_in_frame, g.hazard_position]
    .filter(Boolean)
    .join(" · ");
}

function renderTags() {
  tagsEl.innerHTML = "";
  for (const t of tags) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t.id;
    b.className = [t.bucket, card && card.tag === t.id ? "on" : ""].filter(Boolean).join(" ");
    b.addEventListener("click", () => saveVerdict(t.id));
    tagsEl.appendChild(b);
  }
}

function renderDeck() {
  actsEl.innerHTML = "";
  strip.innerHTML = "";
  for (const a of window._acts || []) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Act " + a;
    b.className = a === act ? "on" : "";
    b.addEventListener("click", () => switchAct(a));
    actsEl.appendChild(b);
  }
  for (const row of deck) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = row.card_id.replace(/^[IVX]+-/, "");
    const takeBit = row.take_count ? " · " + row.take_count + " takes" : "";
    const pickBit = row.pick ? " · closest " + row.pick : "";
    b.title = row.card_id + " " + (row.tag || "open") + takeBit + pickBit + " " + row.title;
    b.className = [row.card_id === currentId ? "on" : "", row.bucket || "open"]
      .filter(Boolean)
      .join(" ");
    b.addEventListener("click", () => show(row.card_id));
    strip.appendChild(b);
  }
}

function viewedTake() {
  const takes = (card && card.takes) || [];
  return (
    takes.find((t) => t.id === viewedId) ||
    takes.find((t) => t.id === (card && card.pick)) ||
    takes[0] ||
    null
  );
}

function renderOptions() {
  optionsEl.innerHTML = "";
  const rows = (card && card.options) || [];
  if (!rows.length) {
    optionsEl.hidden = true;
    return;
  }
  optionsEl.hidden = false;
  for (const o of rows) {
    const li = document.createElement("li");
    if (o.correct) li.className = "correct";
    const id = document.createElement("span");
    id.className = "oid";
    id.textContent = o.id;
    li.appendChild(id);
    li.appendChild(document.createTextNode(o.text || ""));
    optionsEl.appendChild(li);
  }
}

function renderTakes() {
  takesEl.innerHTML = "";
  const takes = (card && card.takes) || [];
  if (!takes.length) {
    takesEl.hidden = true;
    return;
  }
  takesEl.hidden = false;
  const current = viewedTake();
  for (const t of takes) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = [t.id === (current && current.id) ? "on" : "", t.id === card.pick ? "pick" : ""]
      .filter(Boolean)
      .join(" ");
    b.title = t.id === card.pick ? t.label + " closest" : t.label;
    const img = document.createElement("img");
    img.src = t.image_url;
    img.alt = t.label;
    const lab = document.createElement("span");
    lab.className = "tlab";
    lab.textContent = t.label;
    b.appendChild(img);
    b.appendChild(lab);
    b.addEventListener("click", () => pickTake(t.id));
    takesEl.appendChild(b);
  }
}

function showStill(take) {
  if (take && take.image_url) {
    still.src = take.image_url;
    still.alt = card.card_id + " " + take.label;
    still.classList.remove("hidden");
    missing.classList.add("hidden");
  } else {
    still.removeAttribute("src");
    still.classList.add("hidden");
    missing.classList.remove("hidden");
  }
}

function renderCard() {
  if (!card) return;
  document.documentElement.dataset.driver = card.driver || "";
  document.title = card.card_id + " · Art review";
  const takeN = (card.takes || []).length;
  kicker.textContent = [
    card.card_id,
    card.zone,
    card.camera,
    card.index + 1 + "/" + card.total,
    takeN ? takeN + " takes" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  title.textContent = card.title || "";
  hook.textContent = card.hook || "";
  scene.textContent = card.scene || "";
  decision.textContent = card.decision || "";
  decision.hidden = !card.decision;
  read.textContent = card.read || "";
  geo.textContent = geoLine(card.geometry);
  note.value = card.note || "";
  prevBtn.disabled = !card.prev;
  nextBtn.disabled = !card.next;
  if (card.writer_first) {
    routeEl.textContent = "Writer first — do not generate";
    routeEl.classList.remove("hidden");
  } else {
    routeEl.textContent = "";
    routeEl.classList.add("hidden");
  }
  if (caveatEl) {
    if (card.caveat) {
      caveatEl.textContent = card.caveat;
      caveatEl.classList.remove("hidden");
    } else {
      caveatEl.textContent = "";
      caveatEl.classList.add("hidden");
    }
  }
  renderTags();
  renderOptions();
  if (!viewedId || !(card.takes || []).some((t) => t.id === viewedId)) {
    viewedId = card.pick || ((card.takes || [])[0] && card.takes[0].id) || "";
  }
  renderTakes();
  showStill(viewedTake());
}

async function loadDeck() {
  const data = await api("/api/deck?act=" + encodeURIComponent(act));
  deck = data.cards || [];
  countsEl.textContent = data.counts_label || "";
  renderDeck();
}

async function show(id) {
  currentId = id;
  viewedId = "";
  setQuery();
  card = await api("/api/card/" + encodeURIComponent(id));
  act = card.act || act;
  await api("/api/cursor", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ act, cursor: currentId }),
  });
  renderCard();
  await loadDeck();
}

async function switchAct(nextAct) {
  act = nextAct;
  const data = await api("/api/deck?act=" + encodeURIComponent(act));
  deck = data.cards || [];
  const start =
    deck.find((c) => c.card_id === currentId) ||
    deck.find((c) => !c.tag) ||
    deck[0];
  if (!start) return;
  await show(start.card_id);
}

function verdictBody(extra) {
  return JSON.stringify({
    card_id: currentId,
    tag: card.tag || "",
    note: note.value,
    pick: card.pick || viewedId || "",
    ...extra,
  });
}

async function saveVerdict(tag) {
  if (!card) return;
  await api("/api/verdict", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: verdictBody({ tag }),
  });
  if (card.next) await show(card.next);
  else await show(currentId);
}

async function pickTake(id) {
  if (!card) return;
  viewedId = id;
  card.pick = id;
  renderTakes();
  showStill(viewedTake());
  try {
    await api("/api/verdict", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: verdictBody({ pick: id }),
    });
    await loadDeck();
  } catch {
    /* keep local pick even if state write fails */
  }
}

stillWrap.addEventListener("click", () => {
  if (document.body.classList.contains("phone-view")) return;
  stillWrap.classList.toggle("fs");
});

phoneBtn.addEventListener("click", () => {
  stillWrap.classList.remove("fs");
  document.body.classList.toggle("phone-view");
  phoneBtn.classList.toggle("on", document.body.classList.contains("phone-view"));
});

prevBtn.addEventListener("click", () => {
  if (card && card.prev) show(card.prev);
});
nextBtn.addEventListener("click", () => {
  if (card && card.next) show(card.next);
});

note.addEventListener("input", () => {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    if (!card) return;
    api("/api/verdict", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: verdictBody(),
    }).catch(() => {});
  }, 400);
});

document.addEventListener("keydown", (e) => {
  if (e.target === note) return;
  if (e.key === "ArrowLeft" && card && card.prev) show(card.prev);
  if (e.key === "ArrowRight" && card && card.next) show(card.next);
  if (e.key === "p" || e.key === "P") saveVerdict("PASS");
  if (/^[1-9]$/.test(e.key) && card && card.takes && card.takes[Number(e.key) - 1]) {
    pickTake(card.takes[Number(e.key) - 1].id);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentId) show(currentId);
});

(async function boot() {
  const meta = await api("/api/meta");
  window._acts = meta.acts || [];
  tags = meta.tags || [];
  if (!params.get("card") && meta.cursor) currentId = meta.cursor;
  if (!params.get("act") && meta.act) act = meta.act;
  await show(currentId);
})().catch((err) => {
  title.textContent = err.message || "Could not load";
});
