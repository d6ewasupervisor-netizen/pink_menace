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
const note = document.getElementById("note");
const strip = document.getElementById("strip");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const passBtn = document.getElementById("pass");
const fixBtn = document.getElementById("fix");

const params = new URLSearchParams(location.search);
let act = params.get("act") || "III";
let currentId = (params.get("card") || "III-010").toUpperCase();
let deck = [];
let card = null;
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
    b.title = row.card_id + " " + row.title;
    b.className = [row.card_id === currentId ? "on" : "", row.status].filter(Boolean).join(" ");
    b.addEventListener("click", () => show(row.card_id));
    strip.appendChild(b);
  }
  const pass = deck.filter((c) => c.status === "pass").length;
  const fix = deck.filter((c) => c.status === "fix").length;
  const open = deck.filter((c) => c.status === "open").length;
  countsEl.textContent = pass + " pass · " + fix + " fix · " + open + " open · " + deck.length;
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
    deck.find((c) => c.status !== "pass") ||
    deck[0];
  if (!start) return;
  await show(start.card_id);
}

async function saveVerdict(status) {
  if (!card) return;
  await api("/api/verdict", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ card_id: currentId, status, note: note.value }),
  });
  if (status === "pass" && card.next) await show(card.next);
  else await show(currentId);
}

stillWrap.addEventListener("click", () => {
  stillWrap.classList.toggle("fs");
});

prevBtn.addEventListener("click", () => {
  if (card && card.prev) show(card.prev);
});
nextBtn.addEventListener("click", () => {
  if (card && card.next) show(card.next);
});
passBtn.addEventListener("click", () => saveVerdict("pass"));
fixBtn.addEventListener("click", () => saveVerdict("fix"));

note.addEventListener("input", () => {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    if (!card) return;
    api("/api/verdict", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        card_id: currentId,
        status: card.status === "pass" ? "fix" : card.status || "open",
        note: note.value,
      }),
    }).catch(() => {});
  }, 400);
});

document.addEventListener("keydown", (e) => {
  if (e.target === note) return;
  if (e.key === "ArrowLeft" && card && card.prev) show(card.prev);
  if (e.key === "ArrowRight" && card && card.next) show(card.next);
  if (e.key === "p" || e.key === "P") saveVerdict("pass");
  if (e.key === "f" || e.key === "F") saveVerdict("fix");
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentId) show(currentId);
});

(async function boot() {
  const meta = await api("/api/meta");
  window._acts = meta.acts || [];
  if (!params.get("card") && meta.cursor) currentId = meta.cursor;
  if (!params.get("act") && meta.act) act = meta.act;
  await show(currentId);
})().catch((err) => {
  title.textContent = err.message || "Could not load";
});
