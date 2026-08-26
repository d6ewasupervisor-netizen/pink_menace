"use strict";

const confirmEl = document.getElementById("confirm");
const confirmQ = document.getElementById("confirm-q");
const appEl = document.getElementById("app");
const homeEl = document.getElementById("home");
const runEl = document.getElementById("run");
const headerEl = document.getElementById("play-header");
const gateTop = document.getElementById("gate-top");
const HOUR = 60 * 60 * 1000;
const LIVE_KEY = "pm.live";

let pendingQueue = [];
let shownAt = 0;
let outcomeAt = 0;
let currentCardId = null;
let previousCardId = null;
let mode = "home";
let homeData = null;

function liveState() {
  try {
    return JSON.parse(sessionStorage.getItem(LIVE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveLive(patch) {
  const prev = liveState() || {};
  const next = { ...prev, ...patch, t: Date.now() };
  sessionStorage.setItem(LIVE_KEY, JSON.stringify(next));
}

function clearLive() {
  sessionStorage.removeItem(LIVE_KEY);
}

function hourAway(state) {
  return Boolean(state && state.t && Date.now() - state.t > HOUR);
}

function setHeader({ title, saved, back }) {
  document.getElementById("hdr-title").textContent = title || "PINK MENACE";
  document.getElementById("hdr-saved").textContent = saved || "";
  const backBtn = document.getElementById("hdr-back");
  backBtn.disabled = !back;
  backBtn.classList.toggle("off", !back);
}

function showScreen(name) {
  mode = name;
  const on = Boolean(appEl && !appEl.classList.contains("hidden"));
  if (!on) return;
  headerEl.classList.remove("hidden");
  gateTop.classList.add("hidden");
  homeEl.classList.toggle("hidden", name !== "home");
  runEl.classList.toggle("hidden", name === "home");
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderHome(data) {
  homeData = data;
  showScreen("home");
  setHeader({ title: "PINK MENACE", saved: data.saved, back: false });
  const resume = document.getElementById("resume");
  if (data.resume && data.resume.label) {
    resume.textContent = data.resume.label;
    resume.classList.remove("hidden");
    resume.onclick = () => openLive();
  } else {
    resume.classList.add("hidden");
    resume.onclick = null;
  }

  const acts = document.getElementById("acts");
  acts.replaceChildren();
  for (const a of data.acts || []) {
    const row = el("article", "act-row" + (a.current ? " current" : "") + (a.locked ? " locked" : ""));
    const label = el("p", "act-name", "Act " + a.act + " · " + a.zone);
    row.append(label);
    if (a.locked) {
      row.append(el("p", "meta", "Locked"));
    } else if (a.current) {
      row.append(el("p", "meta", a.practiced + " of " + a.total));
    } else if (a.complete) {
      row.append(el("p", "meta", "Done"));
    }
    acts.append(row);
  }

  const log = document.getElementById("log");
  log.replaceChildren();
  if (!(data.log || []).length) {
    log.append(el("p", "meta", "Nothing resolved yet."));
  }
  for (const item of data.log || []) {
    const row = el("button", "log-item", null);
    row.type = "button";
    row.append(el("strong", null, item.title));
    row.append(el("span", "meta", item.scene_fragment || ""));
    row.append(el("span", item.clean ? "mark clean" : "mark", item.clean ? "Clean" : "Debt"));
    row.addEventListener("click", () => openReview(item.card_id));
    log.append(row);
  }

  const cast = document.getElementById("cast");
  cast.replaceChildren();
  for (const c of data.cast || []) {
    const row = el("article", "cast-item" + (c.unlocked ? "" : " locked"));
    if (c.unlocked && c.portrait_url) {
      const img = document.createElement("img");
      img.src = c.portrait_url;
      img.alt = "";
      row.append(img);
    } else {
      row.append(el("div", "cast-ph", ""));
    }
    const col = el("div", "cast-copy");
    col.append(el("strong", null, c.name));
    col.append(el("p", "meta", c.unlocked ? c.line : "Locked"));
    row.append(col);
    cast.append(row);
  }
}

function applyOutcome(card, outcome) {
  document.getElementById("options").classList.add("hidden");
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  result.textContent = (outcome && outcome.result) || "";
  debrief.textContent = (outcome && outcome.debrief) || "";
  result.classList.toggle("hidden", !result.textContent);
  debrief.classList.toggle("hidden", !debrief.textContent);
}

function fillCard(card, opts) {
  currentCardId = card.card_id;
  previousCardId = card.previous_card_id || null;
  document.getElementById("title").textContent = card.title || "";
  document.getElementById("scene").textContent = card.scene || "";
  const decision = document.getElementById("decision");
  decision.textContent = card.decision || "";
  decision.classList.toggle("hidden", !card.decision);
  const shot = document.getElementById("shot");
  if (card.image_url) {
    shot.src = card.image_url + "&t=" + encodeURIComponent(card.card_id);
    shot.classList.remove("hidden");
  } else {
    shot.removeAttribute("src");
    shot.classList.add("hidden");
  }
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  result.classList.add("hidden");
  debrief.classList.add("hidden");
  const cont = document.getElementById("continue");
  const resumeLive = document.getElementById("resume-live");
  const options = card.options || [];
  const box = document.getElementById("options");
  box.replaceChildren();
  box.classList.toggle("hidden", !options.length);
  const tappable = card.tappable !== false && !opts.review && !opts.pending;
  for (const o of options) {
    const node = document.createElement(tappable ? "button" : "div");
    if (tappable) {
      node.type = "button";
      node.addEventListener("click", () => submitAnswer(o.option_id));
    } else {
      node.className = "opt" + (o.chosen ? " chosen" : "");
    }
    node.textContent = o.option_text;
    box.appendChild(node);
  }
  if (opts.review) {
    applyOutcome(card, card.outcome);
    cont.classList.add("hidden");
    cont.onclick = null;
    resumeLive.classList.remove("hidden");
    resumeLive.onclick = () => openLive();
  } else if (opts.pending) {
    applyOutcome(card, card.outcome);
    resumeLive.classList.add("hidden");
    resumeLive.onclick = null;
    cont.classList.remove("hidden");
    bindContinue(card);
  } else if (!options.length) {
    cont.classList.remove("hidden");
    resumeLive.classList.add("hidden");
    cont.onclick = () => submitAnswer("continue");
  } else {
    cont.classList.add("hidden");
    resumeLive.classList.add("hidden");
    cont.onclick = null;
  }
}

function restoreScroll(cardId) {
  const st = liveState();
  if (!st || st.card_id !== cardId) {
    runEl.scrollTop = 0;
    return;
  }
  if (hourAway(st)) {
    runEl.scrollTop = 0;
    return;
  }
  runEl.scrollTop = Number(st.scroll) || 0;
}

function bindContinue(card) {
  const cont = document.getElementById("continue");
  const answeredId = card.card_id;
  outcomeAt = Date.now();
  cont.onclick = async () => {
    try {
      await PM.api("/api/run/continue", {
        method: "POST",
        body: { card_id: answeredId, ms_on_outcome: Date.now() - outcomeAt },
      });
    } catch {
      // dwell is optional
    }
    clearLive();
    await openLive();
  };
}

function renderLive(card) {
  showScreen("live");
  setHeader({ title: card.title, saved: card.saved, back: Boolean(card.previous_card_id) });
  shownAt = Date.now();
  fillCard(card, { pending: Boolean(card.pending_outcome), review: false });
  saveLive({
    card_id: card.card_id,
    phase: card.pending_outcome ? "result" : "live",
    scroll: 0,
  });
  restoreScroll(card.card_id);
}

function renderReview(card) {
  showScreen("review");
  setHeader({ title: card.title, saved: card.saved, back: Boolean(card.previous_card_id) });
  fillCard(card, { review: true, pending: false });
  runEl.scrollTop = 0;
}

async function loadHome() {
  const data = await PM.api("/api/run/home");
  renderHome(data);
}

async function openLive() {
  const data = await PM.api("/api/run/current");
  if (data.done && !data.card_id) {
    await loadHome();
    return;
  }
  previousCardId = data.previous_card_id || null;
  renderLive(data);
}

async function openReview(cardId) {
  const data = await PM.api("/api/run/review/" + encodeURIComponent(cardId));
  previousCardId = data.previous_card_id || null;
  renderReview(data);
}

function showConfirm() {
  const next = pendingQueue[0];
  if (!next) {
    confirmEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    bootApp();
    return;
  }
  confirmEl.classList.remove("hidden");
  appEl.classList.add("hidden");
  confirmQ.textContent = "Is " + next.parentName + " your parent or guardian?";
}

async function answerLink(accept) {
  const next = pendingQueue[0];
  if (!next) return;
  const data = await PM.api("/api/links/confirm", {
    method: "POST",
    body: { pending_id: next.id, accept },
  });
  pendingQueue = data.pendingGuardians || [];
  showConfirm();
}

function showOutcome(data) {
  outcomeAt = Date.now();
  saveLive({ card_id: currentCardId, phase: "result", scroll: runEl.scrollTop });
  applyOutcome({ card_id: currentCardId }, data);
  document.getElementById("options").classList.add("hidden");
  const cont = document.getElementById("continue");
  cont.classList.remove("hidden");
  bindContinue({ card_id: currentCardId });
}

async function submitAnswer(optionId) {
  const data = await PM.api("/api/run/answer", {
    method: "POST",
    body: {
      card_id: currentCardId,
      option_id: optionId,
      ms_to_answer: Date.now() - shownAt,
    },
  });
  showOutcome(data);
}

async function bootApp() {
  headerEl.classList.remove("hidden");
  gateTop.classList.add("hidden");
  const st = liveState();
  if (st && (st.phase === "live" || st.phase === "result") && st.card_id) {
    await openLive();
    return;
  }
  await loadHome();
}

runEl.addEventListener("scroll", () => {
  if (mode === "live" && currentCardId) {
    saveLive({ card_id: currentCardId, scroll: runEl.scrollTop, phase: (liveState() || {}).phase || "live" });
  }
});

document.getElementById("hdr-home").addEventListener("click", () => {
  loadHome();
});

document.getElementById("hdr-back").addEventListener("click", () => {
  if (!previousCardId) return;
  openReview(previousCardId);
});

document.getElementById("sign-out").addEventListener("click", () => {
  headerEl.classList.add("hidden");
  gateTop.classList.remove("hidden");
});
document.getElementById("confirm-yes").addEventListener("click", () => answerLink(true));
document.getElementById("confirm-no").addEventListener("click", () => answerLink(false));

PM.bindGate({
  kind: "game",
  onReady: async (me) => {
    pendingQueue = me.pendingGuardians || [];
    if (pendingQueue.length) showConfirm();
    else {
      confirmEl.classList.add("hidden");
      appEl.classList.remove("hidden");
      await bootApp();
    }
  },
});
