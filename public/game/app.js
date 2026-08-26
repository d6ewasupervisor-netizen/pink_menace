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
let playGen = 0;
let stopType = null;
let hazardTimer = 0;
let advanceTimer = 0;
let meters = { noise: 0, light: 0, yaw: 0, cargo: 100 };
let liveCard = null;
let answering = false;
let timedSubmit = false;
const CAUGHT_KEY = "pm.caught";

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
  if (name === "home") {
    clearPlay();
    PMFeel.stopBed();
    PMFeel.paintFear({ tier: 0, presence: 0, handprints: false });
    const ign = document.getElementById("ignition");
    if (ign) ign.classList.add("hidden");
    const col = document.getElementById("collapse");
    if (col) col.classList.add("hidden");
  }
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
  const over = document.getElementById("start-over");
  if (data.done && data.restartable) {
    resume.textContent = "Start over";
    resume.classList.remove("hidden");
    resume.onclick = () => startOver();
    over.classList.add("hidden");
    over.onclick = null;
  } else if (data.resume && data.resume.label) {
    resume.textContent = data.resume.label;
    resume.classList.remove("hidden");
    resume.onclick = () => openLive();
    if (data.restartable) {
      over.classList.remove("hidden");
      over.onclick = () => startOver();
    } else {
      over.classList.add("hidden");
      over.onclick = null;
    }
  } else {
    resume.classList.add("hidden");
    resume.onclick = null;
    over.classList.add("hidden");
    over.onclick = null;
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
      img.addEventListener("error", () => img.replaceWith(el("div", "cast-ph", "")));
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

function clearPlay() {
  playGen += 1;
  if (stopType) {
    stopType(false);
    stopType = null;
  }
  window.clearInterval(hazardTimer);
  window.clearTimeout(advanceTimer);
  hazardTimer = 0;
  advanceTimer = 0;
  answering = false;
  timedSubmit = false;
  PMFeel.clearCues();
  PMFeel.setVignette(1);
  PMFeel.hideBark();
  const wrap = document.getElementById("shot-wrap");
  if (wrap) wrap.classList.remove("arming");
  const clock = document.getElementById("hazard-clock");
  if (clock) clock.classList.add("hidden");
}

function applyMeters(state, how, extras) {
  const next = state || meters;
  const hadPrints = Boolean(meters.handprints);
  meters = {
    noise: Number(next.noise) || 0,
    light: Number(next.light) || 0,
    yaw: Number(next.yaw) || 0,
    cargo: next.cargo == null ? meters.cargo : next.cargo,
    presence: Number(next.presence) || 0,
    tier: Number(next.tier) || 0,
    handprints: Boolean(next.handprints),
    night: extras && extras.night != null ? Boolean(extras.night) : Boolean(meters.night),
  };
  if (how === "spike") PMFeel.spikeMeters(null, meters);
  else if (how === "ease") PMFeel.easeMeters(meters);
  else PMFeel.paintMeters(meters);
  PMFeel.paintFear(meters);
  if (meters.handprints && !hadPrints) PMFeel.sting("palm");
}

function setDebrief(text, collapsed) {
  const debrief = document.getElementById("debrief");
  const { head, rest } = PMFeel.splitDebrief(text);
  debrief.replaceChildren();
  if (!head) {
    debrief.classList.add("hidden");
    return;
  }
  debrief.append(el("span", "debrief-head", head));
  if (rest && collapsed) {
    debrief.append(el("span", "debrief-rest", " " + rest));
    debrief.classList.add("closed");
    debrief.onclick = () => debrief.classList.remove("closed");
  } else if (rest) {
    debrief.append(el("span", "debrief-rest", " " + rest));
    debrief.classList.remove("closed");
    debrief.onclick = null;
  } else {
    debrief.classList.remove("closed");
    debrief.onclick = null;
  }
  debrief.classList.remove("hidden");
}

function applyOutcome(outcome, opts) {
  document.getElementById("options").classList.add("hidden");
  const result = document.getElementById("result");
  result.textContent = (outcome && outcome.result) || "";
  result.classList.toggle("hidden", !result.textContent);
  setDebrief((outcome && outcome.debrief) || "", Boolean(opts && opts.collapseDebrief));
}

function fillOptions(card, opts) {
  const options = card.options || [];
  const box = document.getElementById("options");
  box.replaceChildren();
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
  return options.length;
}

function revealChoices(card, opts) {
  const decision = document.getElementById("decision");
  if (card.decision) decision.classList.remove("hidden");
  const n = fillOptions(card, opts);
  document.getElementById("options").classList.toggle("hidden", !n);
  if (!opts.review && !opts.pending && card.card_type === "hazard") {
    PMFeel.fireCue(PMFeel.cueFor(card));
  }
  if (!opts.review && !opts.pending && card.card_type === "hazard" && card.timeout_option_id && n) {
    armHazardWindow(card);
  }
}

function armHazardWindow(card) {
  window.clearInterval(hazardTimer);
  window.clearTimeout(advanceTimer);
  const wrap = document.getElementById("shot-wrap");
  const clock = document.getElementById("hazard-clock");
  const fill = document.getElementById("hazard-fill");
  const gen = playGen;
  const grace = 1750;
  const wind = 800;
  PMFeel.setVignette(1);
  if (clock) {
    clock.classList.add("hidden");
    clock.classList.remove("arming");
  }
  if (fill) fill.style.transform = "scaleX(1)";
  advanceTimer = window.setTimeout(() => {
    if (gen !== playGen || answering) return;
    if (wrap) wrap.classList.add("arming");
    if (clock) {
      clock.classList.remove("hidden");
      clock.classList.add("arming");
    }
    if (fill) fill.style.transform = "scaleX(0)";
    PMFeel.setVignette(0.72);
    advanceTimer = window.setTimeout(() => {
      if (gen !== playGen || answering) return;
      if (wrap) wrap.classList.remove("arming");
      if (clock) clock.classList.remove("arming");
      startHazardWindow(card);
    }, wind);
  }, grace);
}

function startHazardWindow(card) {
  window.clearInterval(hazardTimer);
  const clock = document.getElementById("hazard-clock");
  const fill = document.getElementById("hazard-fill");
  const ms = Number(card.timeout_ms) || 8000;
  const started = Date.now();
  const gen = playGen;
  if (clock) clock.classList.remove("hidden");
  if (fill) fill.style.transform = "scaleX(1)";
  PMFeel.setVignette(0.72);
  hazardTimer = window.setInterval(() => {
    if (gen !== playGen || answering) return;
    const left = Math.max(0, 1 - (Date.now() - started) / ms);
    if (fill) fill.style.transform = "scaleX(" + left + ")";
    PMFeel.setVignette(left * 0.72);
    if (left <= 0) {
      window.clearInterval(hazardTimer);
      hazardTimer = 0;
      timedSubmit = true;
      submitAnswer(card.timeout_option_id);
    }
  }, 50);
}

function fillCard(card, opts) {
  clearPlay();
  liveCard = card;
  currentCardId = card.card_id;
  previousCardId = card.previous_card_id || null;
  answering = false;
  document.getElementById("title").textContent = card.title || "";
  const decision = document.getElementById("decision");
  decision.textContent = card.decision || "";
  decision.classList.add("hidden");
  const shot = document.getElementById("shot");
  const wrap = document.getElementById("shot-wrap");
  if (card.image_url) {
    shot.src = card.image_url + "&t=" + encodeURIComponent(card.card_id);
    wrap.classList.remove("hidden");
  } else {
    shot.removeAttribute("src");
    wrap.classList.add("hidden");
  }
  PMFeel.setKen(card.camera);
  PMFeel.setWeather(card.weather);
  PMFeel.setDriver(card.driver);
  PMFeel.applyGrade();
  applyMeters(card.state || meters, "paint", { night: Boolean(card.night) });
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  result.classList.add("hidden");
  debrief.classList.add("hidden");
  debrief.onclick = null;
  const hookEl = document.getElementById("hook");
  const sceneEl = document.getElementById("scene");
  const hook = card.hook || PMFeel.firstSentence(card.scene);
  if (hookEl) {
    hookEl.textContent = hook;
    hookEl.classList.toggle("hidden", !hook);
    hookEl.onclick = () => {
      if (!sceneEl) return;
      sceneEl.classList.toggle("hidden");
    };
  }
  if (sceneEl) {
    sceneEl.textContent = card.scene || "";
    sceneEl.classList.add("hidden");
  }
  if (wrap) wrap.classList.remove("arming");
  PMFeel.hideBark();
  const cont = document.getElementById("continue");
  const resumeLive = document.getElementById("resume-live");
  document.getElementById("options").classList.add("hidden");
  document.getElementById("options").replaceChildren();

  if (opts.review) {
    if (sceneEl) sceneEl.classList.remove("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, opts);
    document.getElementById("options").classList.toggle("hidden", !(card.options || []).length);
    applyOutcome(card.outcome, { collapseDebrief: false });
    bindAlts(card.alts || [], card);
    cont.classList.add("hidden");
    cont.onclick = null;
    resumeLive.classList.remove("hidden");
    resumeLive.onclick = () => openLive();
    return;
  }

  resumeLive.classList.add("hidden");
  resumeLive.onclick = null;
  cont.classList.add("hidden");
  cont.onclick = null;

  if (opts.pending) {
    if (sceneEl) sceneEl.classList.remove("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, opts);
    document.getElementById("options").classList.add("hidden");
    playOutcome({ ...(card.outcome || {}), state: card.state, alts: card.alts }, card);
    return;
  }

  revealChoices(card, opts);
  if (!(card.options || []).length) {
    cont.classList.remove("hidden");
    cont.textContent = "Continue";
    cont.onclick = () => submitAnswer("continue");
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

async function finishContinue(cardId) {
  try {
    await PM.api("/api/run/continue", {
      method: "POST",
      body: { card_id: cardId, ms_on_outcome: Date.now() - outcomeAt },
    });
  } catch {
    // dwell is optional
  }
  clearLive();
  await openLive();
}

function holdContinue(cardId, after) {
  const cont = document.getElementById("continue");
  cont.classList.remove("hidden");
  cont.textContent = "Continue";
  cont.onclick = async () => {
    cont.onclick = null;
    cont.classList.add("hidden");
    if (after) {
      after();
      return;
    }
    try {
      await finishContinue(cardId);
    } catch {
      cont.classList.remove("hidden");
      cont.onclick = () => finishContinue(cardId);
    }
  };
}

function bindAlts(alts, card) {
  const box = document.getElementById("options");
  if (!box) return;
  box.replaceChildren();
  if (!(alts || []).length) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  for (const o of alts) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "opt peek";
    node.textContent = o.option_text;
    node.addEventListener("click", () => playAlt(o, card));
    box.appendChild(node);
  }
}

function playAlt(opt, card) {
  const result = document.getElementById("result");
  if (result) {
    result.textContent = opt.result || "";
    result.classList.remove("hidden");
  }
  PMFeel.shake();
  PMFeel.hitWrong();
  applyMeters(
    {
      ...meters,
      noise: meters.noise + (Number(opt.state_delta && opt.state_delta.noise) || 0),
      light: meters.light + (Number(opt.state_delta && opt.state_delta.light) || 0),
      yaw: meters.yaw + (Number(opt.state_delta && opt.state_delta.yaw) || 0),
    },
    "spike"
  );
  PM.api("/api/run/peek", {
    method: "POST",
    body: { card_id: card.card_id, option_id: opt.option_id },
  }).catch(() => {});
}

function playOutcome(data, card) {
  outcomeAt = Date.now();
  const correct = Boolean(data && data.was_correct);
  const nextMeters = data.state || meters;
  const failed = Boolean(data && data.failed);
  const collapse = Boolean(data && data.collapse) || failed;
  if (collapse) {
    applyMeters(nextMeters, "paint");
    document.getElementById("options").classList.add("hidden");
    applyOutcome(data, { collapseDebrief: true });
    PMFeel.showBark(
      PMFeel.barkFor({
        correct,
        timedOut: Boolean(data && data.timed_out),
        hazard: liveCard && liveCard.card_type === "hazard",
        noise: data.state_delta && data.state_delta.noise,
      })
    );
    PMFeel.playCollapse(data.dispatch, () => holdContinue(card.card_id));
    return;
  }
  if (correct) {
    applyMeters(nextMeters, "ease");
    applyOutcome(data, { collapseDebrief: true });
  } else {
    PMFeel.shake();
    PMFeel.hitWrong();
    applyMeters(nextMeters, "spike");
    applyOutcome(data, { collapseDebrief: true });
  }
  PMFeel.showBark(
    PMFeel.barkFor({
      correct,
      timedOut: Boolean(data && data.timed_out),
      hazard: liveCard && liveCard.card_type === "hazard",
      noise: data.state_delta && data.state_delta.noise,
    })
  );
  bindAlts((data && data.alts) || [], card);
  holdContinue(card.card_id);
}

function sessionCaught() {
  try {
    return sessionStorage.getItem(CAUGHT_KEY) === "1";
  } catch {
    return false;
  }
}

function markCaught() {
  try {
    sessionStorage.setItem(CAUGHT_KEY, "1");
  } catch {
    // private mode
  }
}

function renderLive(card) {
  showScreen("live");
  setHeader({ title: card.title, saved: card.saved, back: Boolean(card.previous_card_id) });
  runEl.classList.remove("slide-in");
  void runEl.offsetWidth;
  runEl.classList.add("slide-in");
  const begin = () => {
    shownAt = Date.now();
    PMFeel.startBed(card.weather);
    fillCard(card, { pending: Boolean(card.pending_outcome), review: false });
    saveLive({
      card_id: card.card_id,
      phase: card.pending_outcome ? "result" : "live",
      scroll: 0,
    });
    restoreScroll(card.card_id);
  };
  if (sessionCaught()) {
    begin();
    return;
  }
  PMFeel.showIgnition(() => {
    markCaught();
    begin();
  });
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

async function startOver() {
  clearLive();
  meters = { noise: 0, light: 0, yaw: 0, cargo: 100, presence: 0, tier: 0, handprints: false };
  try {
    await PM.api("/api/run/restart", { method: "POST", body: {} });
  } catch {
    return;
  }
  await openLive();
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

async function submitAnswer(optionId) {
  if (answering) return;
  answering = true;
  window.clearInterval(hazardTimer);
  hazardTimer = 0;
  const clock = document.getElementById("hazard-clock");
  if (clock) clock.classList.add("hidden");
  const timed = timedSubmit;
  timedSubmit = false;
  const data = await PM.api("/api/run/answer", {
    method: "POST",
    body: {
      card_id: currentCardId,
      option_id: optionId,
      ms_to_answer: Date.now() - shownAt,
      timed_out: timed,
    },
  });
  saveLive({ card_id: currentCardId, phase: "result", scroll: runEl.scrollTop });
  playOutcome({ ...data, timed_out: timed }, { card_id: currentCardId });
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

runEl.addEventListener("pointerdown", (ev) => {
  if (ev.target.closest("#ignition") || ev.target.closest("#collapse")) return;
  PMFeel.ensureAudio();
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

PMFeel.applyGrade();

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
