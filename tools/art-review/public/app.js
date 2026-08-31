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
const read = document.getElementById("read");
const geo = document.getElementById("geo");
const tagsEl = document.getElementById("tags");
const routeEl = document.getElementById("route");
const note = document.getElementById("note");
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
    b.title = row.card_id + " " + (row.tag || "open") + " " + row.title;
    b.className = [row.card_id === currentId ? "on" : "", row.bucket || "open"]
      .filter(Boolean)
      .join(" ");
    b.addEventListener("click", () => show(row.card_id));
    strip.appendChild(b);
  }
}

function renderCard() {
  if (!card) return;
  document.documentElement.dataset.driver = card.driver || "";
  document.title = card.card_id + " · Art review";
  kicker.textContent = [card.card_id, card.zone, card.camera, card.index + 1 + "/" + card.total]
    .filter(Boolean)
    .join(" · ");
  title.textContent = card.title || "";
  hook.textContent = card.hook || "";
  scene.textContent = card.scene || "";
  decision.textContent = card.decision || "";
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
  renderTags();
  if (card.has_image && card.image_url) {
    still.src = card.image_url;
    still.alt = card.card_id;
    still.classList.remove("hidden");
    missing.classList.add("hidden");
  } else {
    still.removeAttribute("src");
    still.classList.add("hidden");
    missing.classList.remove("hidden");
  }
}

async function loadDeck() {
  const data = await api("/api/deck?act=" + encodeURIComponent(act));
  deck = data.cards || [];
  countsEl.textContent = data.counts_label || "";
  renderDeck();
}

async function show(id) {
  currentId = id;
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

async function saveVerdict(tag) {
  if (!card) return;
  await api("/api/verdict", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ card_id: currentId, tag, note: note.value }),
  });
  if (card.next) await show(card.next);
  else await show(currentId);
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
      body: JSON.stringify({
        card_id: currentId,
        tag: card.tag || "",
        note: note.value,
      }),
    }).catch(() => {});
  }, 400);
});

document.addEventListener("keydown", (e) => {
  if (e.target === note) return;
  if (e.key === "ArrowLeft" && card && card.prev) show(card.prev);
  if (e.key === "ArrowRight" && card && card.next) show(card.next);
  if (e.key === "p" || e.key === "P") saveVerdict("PASS");
  if (e.key === "3") {
    phoneBtn.click();
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
