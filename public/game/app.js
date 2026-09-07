"use strict";

const confirmEl = document.getElementById("confirm");
const confirmQ = document.getElementById("confirm-q");
const appEl = document.getElementById("app");
const homeEl = document.getElementById("home");
const runEl = document.getElementById("run");
const headerEl = document.getElementById("play-header");
const gateTop = document.getElementById("gate-top");
const LIVE_KEY = "pm.live";

let pendingQueue = [];
let shownAt = 0;
let outcomeAt = 0;
let currentCardId = null;
let previousCardId = null;
let nextCardId = null;
let mode = "home";
let homeData = null;
let playGen = 0;
let stopType = null;
let hazardTimer = 0;
let advanceTimer = 0;
let meters = { noise: 0, light: 0, yaw: 0, cargo: 140, time_cost: 0, cold: 130, warming: 0, phase: "cold" };
let liveCard = null;
let stopChoiceGate = null;
let answering = false;
let timedSubmit = false;
let runPointerDown = false;
let choicesLiveAt = 0;
let cancelTypeScene = null;
let recapTimer = 0;
let recapAdvancing = false;
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
  document.documentElement.classList.toggle("playing", on);
  if (!on) return;
  headerEl.classList.remove("hidden");
  gateTop.classList.add("hidden");
  homeEl.classList.toggle("hidden", name !== "home");
  runEl.classList.toggle("hidden", name === "home");
  runEl.classList.toggle("reviewing", name === "review");
  if (name === "home") {
    clearPlay();
    PMFeel.stopBed();
    PMFeel.paintFear({ tier: 0, presence: 0, handprints: false }, { camera: "", cardId: "" });
    const ign = document.getElementById("ignition");
    if (ign) ign.classList.add("hidden");
    const man = document.getElementById("manifest");
    if (man) man.classList.add("hidden");
    const del = document.getElementById("delivery");
    if (del) del.classList.add("hidden");
    const col = document.getElementById("collapse");
    if (col) col.classList.add("hidden");
    if (PMFeel.hideHold) PMFeel.hideHold();
  }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderHome(data, opts) {
  homeData = data;
  showScreen("home");
  setHeader({ title: "PINK MENACE", saved: data.saved, back: false });
  const focusId = opts && opts.focusCardId;
  const resume = document.getElementById("resume");
  const over = document.getElementById("start-over");
  const lockedDoor = document.getElementById("locked-door");
  const lockedTitle = document.getElementById("locked-door-title");
  if (data.locked_next && lockedDoor && lockedTitle) {
    lockedDoor.classList.remove("hidden");
    lockedTitle.textContent = "Act " + data.locked_next.act + " · " + data.locked_next.zone;
    resume.classList.add("hidden");
    resume.onclick = null;
    over.classList.add("hidden");
    over.onclick = null;
  } else {
    lockedDoor.classList.add("hidden");
  }
  if (!data.locked_next && data.done && data.restartable) {
    resume.textContent = "Start over";
    resume.classList.remove("hidden");
    resume.onclick = () => startOver();
    over.classList.add("hidden");
    over.onclick = null;
  } else if (!data.locked_next && data.resume && data.resume.label) {
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
    if (data.locked_next && a.act === data.locked_next.act) continue;
    const row = el(
      a.locked ? "article" : "button",
      "act-row" + (a.current ? " current" : "") + (a.locked ? " locked" : "") + (a.complete ? " complete" : "")
    );
    if (!a.locked) row.type = "button";
    const label = el("p", "act-name", "Act " + a.act + " · " + a.zone);
    row.append(label);
    if (a.locked) {
      row.append(el("p", "meta", "Locked"));
    } else if (a.current) {
      row.append(el("p", "meta", a.practiced + " of " + a.total));
    } else if (a.complete) {
      row.append(el("p", "meta", "Done"));
    }
    if (!a.locked) {
      row.addEventListener("click", () => openAct(a));
    }
    acts.append(row);
  }

  const log = document.getElementById("log");
  log.replaceChildren();
  if (!(data.log || []).length) {
    log.append(el("p", "meta", "Nothing resolved yet."));
  } else {
    const groups = new Map();
    for (const item of data.log) {
      const act = item.act || String(item.card_id || "").split("-")[0];
      if (!groups.has(act)) groups.set(act, []);
      groups.get(act).push(item);
    }
    const currentAct = ((data.acts || []).find((a) => a.current) || {}).act;
    const lastAct = [...groups.keys()].pop();
    for (const [act, items] of groups) {
      const zone = ((data.acts || []).find((a) => a.act === act) || {}).zone || items[0].zone || "";
      const details = el("details", "log-act");
      if (act === currentAct || (!currentAct && act === lastAct) || items.some((i) => i.card_id === focusId)) {
        details.open = true;
      }
      const sum = document.createElement("summary");
      sum.textContent = "Act " + act + (zone ? " · " + zone : "");
      details.append(sum);
      for (const item of items) {
        const row = el("button", "log-item" + (focusId === item.card_id ? " current" : ""), null);
        row.type = "button";
        row.dataset.cardId = item.card_id;
        row.append(el("strong", null, item.title));
        row.append(el("span", "meta", item.scene_fragment || ""));
        row.append(el("span", item.clean ? "mark clean" : "mark", item.clean ? "Clean" : "Debt"));
        row.addEventListener("click", () => openReview(item.card_id));
        details.append(row);
      }
      log.append(details);
    }
  }

  const cast = document.getElementById("cast");
  cast.replaceChildren();
  for (const c of data.cast || []) {
    const row = el("article", "cast-item" + (c.unlocked ? "" : " locked"));
    if (c.unlocked && c.portrait_url) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 56;
      img.height = 56;
      img.addEventListener("error", () => img.replaceWith(el("div", "cast-ph", "")));
      img.src = c.portrait_url;
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

  const focusRow = focusId && log.querySelector('[data-card-id="' + focusId + '"]');
  const resumeBtn = document.getElementById("resume");
  const focusTarget = focusRow || (focusId && resumeBtn && !resumeBtn.classList.contains("hidden") ? resumeBtn : null);
  if (focusTarget) {
    requestAnimationFrame(() => {
      focusTarget.scrollIntoView({ block: "center", inline: "nearest" });
    });
  } else {
    homeEl.scrollTop = 0;
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
  window.clearTimeout(recapTimer);
  hazardTimer = 0;
  advanceTimer = 0;
  recapTimer = 0;
  recapAdvancing = false;
  answering = false;
  timedSubmit = false;
  runPointerDown = false;
  choicesLiveAt = 0;
  if (cancelTypeScene) {
    cancelTypeScene(false);
    cancelTypeScene = null;
  }
  PMFeel.hideReward();
  PMFeel.clearCues();
  PMFeel.setVignette(1);
  PMFeel.hideBark();
  const wrap = document.getElementById("shot-wrap");
  if (wrap) wrap.classList.remove("arming", "fs");
  const clock = document.getElementById("hazard-clock");
  if (clock) clock.classList.add("hidden");
  runEl.classList.remove("recap-skip", "choices-ready", "holding");
  runEl.onclick = null;
  if (stopChoiceGate) {
    stopChoiceGate();
    stopChoiceGate = null;
  }
}

function applyMeters(state, how, extras) {
  const next = state || meters;
  const hadPrints = Boolean(meters.handprints);
  meters = {
    noise: Number(next.noise) || 0,
    light: Number(next.light) || 0,
    yaw: Number(next.yaw) || 0,
    cargo: next.cargo == null ? meters.cargo : next.cargo,
    time_cost: next.time_cost == null ? meters.time_cost : Number(next.time_cost) || 0,
    cold: next.cold == null ? meters.cold : Number(next.cold) || 0,
    warming: next.warming == null ? meters.warming : Number(next.warming) || 0,
    phase: next.phase || (Number(next.cold) > 0 ? "cold" : "warming"),
    presence: Number(next.presence) || 0,
    tier: Number(next.tier) || 0,
    handprints: Boolean(next.handprints),
    night: extras && extras.night != null ? Boolean(extras.night) : Boolean(meters.night),
    camera: extras && extras.camera != null ? extras.camera : meters.camera,
    cardId: extras && extras.cardId != null ? extras.cardId : meters.cardId,
  };
  if (how === "spike") PMFeel.spikeMeters(null, meters);
  else if (how === "ease") PMFeel.easeMeters(meters);
  else PMFeel.paintMeters(meters);
  PMFeel.paintFear(meters, { camera: meters.camera, cardId: meters.cardId });
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
    node.className = "opt" + (o.chosen ? " chosen" : "");
    if (tappable) {
      node.type = "button";
      node.addEventListener("click", () => submitAnswer(o.option_id));
    }
    node.textContent = o.option_text;
    box.appendChild(node);
  }
  return options.length;
}

function questionInView() {
  const decision = document.getElementById("decision");
  if (!decision || decision.classList.contains("hidden") || !decision.textContent.trim()) return true;
  if (!runEl) return true;
  const runBox = runEl.getBoundingClientRect();
  const box = decision.getBoundingClientRect();
  return box.bottom <= runBox.bottom + 16;
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

function scenarioReadMark() {
  const scene = document.getElementById("scene");
  const decision = document.getElementById("decision");
  const hook = document.getElementById("hook");
  if (scene && !scene.classList.contains("hidden") && scene.textContent.trim()) return scene;
  if (decision && !decision.classList.contains("hidden") && decision.textContent.trim()) return decision;
  if (hook && !hook.classList.contains("hidden")) return hook;
  return document.getElementById("title");
}

function sceneWaitingOnHook() {
  const scene = document.getElementById("scene");
  return Boolean(scene && scene.textContent.trim() && scene.classList.contains("hidden"));
}

function stillSettled() {
  const wrap = document.getElementById("shot-wrap");
  const shot = document.getElementById("shot");
  if (!wrap || wrap.classList.contains("hidden")) return true;
  if (!shot || !shot.getAttribute("src")) return false;
  return shot.complete;
}

function shotHasSize() {
  const wrap = document.getElementById("shot-wrap");
  if (!wrap || wrap.classList.contains("hidden")) return true;
  return wrap.getBoundingClientRect().height > 80;
}

function choiceDockInView() {
  const dock = document.getElementById("choice-dock");
  if (!dock || !runEl || !runEl.classList.contains("choices-ready")) return false;
  const runBox = runEl.getBoundingClientRect();
  const box = dock.getBoundingClientRect();
  return box.top < runBox.bottom - 8 && box.bottom > runBox.top + 8;
}

function scenarioIsRead() {
  if (runPointerDown) return false;
  if (sceneWaitingOnHook()) return false;
  if (!stillSettled()) return false;
  if (!shotHasSize()) return false;
  const mark = scenarioReadMark();
  if (!mark || !runEl) return true;
  const runBox = runEl.getBoundingClientRect();
  const markBox = mark.getBoundingClientRect();
  return markBox.bottom <= runBox.bottom + 16;
}

function showChoiceDock() {
  runEl.classList.add("choices-ready");
}

function armChoiceGate(card, opts) {
  if (stopChoiceGate) {
    stopChoiceGate();
    stopChoiceGate = null;
  }
  runEl.classList.remove("choices-ready");
  let phase = card.decision ? "scene" : "ready";
  let typing = false;
  let latched = false;
  const decision = document.getElementById("decision");
  const openChoices = () => {
    showChoiceDock();
    choicesLiveAt = Date.now() + 450;
    revealChoices(card, opts);
    if (!(card.options || []).length) {
      const cont = document.getElementById("continue");
      cont.classList.remove("hidden");
      cont.textContent = "Continue";
      cont.onclick = () => submitAnswer("continue");
    }
  };
  const startQuestion = () => {
    if (!decision || !card.decision) {
      phase = "ready";
      return;
    }
    phase = "question";
    decision.textContent = "";
    decision.classList.remove("hidden");
    typing = true;
    if (cancelTypeScene) cancelTypeScene(true);
    cancelTypeScene = PMFeel.typeText(decision, card.decision, () => {
      typing = false;
      cancelTypeScene = null;
      requestAnimationFrame(() => requestAnimationFrame(tryLatch));
    });
    decision.onclick = () => {
      if (cancelTypeScene) cancelTypeScene(true);
    };
  };
  const tryLatch = () => {
    if (latched || !liveCard || liveCard.card_id !== card.card_id) return;
    if (phase === "scene") {
      if (!scenarioIsRead()) return;
      startQuestion();
    }
    if (phase === "question") {
      if (typing || runPointerDown || !questionInView()) return;
      phase = "ready";
    }
    if (phase !== "ready") return;
    latched = true;
    if (stopChoiceGate) {
      stopChoiceGate();
      stopChoiceGate = null;
    }
    if (decision) decision.onclick = null;
    openChoices();
  };
  const onScroll = () => tryLatch();
  runEl.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  stopChoiceGate = () => {
    runEl.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    stopChoiceGate = null;
  };
  requestAnimationFrame(() => requestAnimationFrame(tryLatch));
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
  const ms = Number(card.timeout_ms) || 24000;
  let elapsed = 0;
  let last = Date.now();
  const gen = playGen;
  if (clock) clock.classList.remove("hidden");
  if (fill) fill.style.transform = "scaleX(1)";
  PMFeel.setVignette(0.72);
  hazardTimer = window.setInterval(() => {
    if (gen !== playGen || answering) return;
    const now = Date.now();
    if (choiceDockInView() && !runPointerDown) elapsed += now - last;
    last = now;
    const left = Math.max(0, 1 - elapsed / ms);
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
  nextCardId = card.next_card_id || null;
  answering = false;
  document.getElementById("title").textContent = card.title || "";
  const decision = document.getElementById("decision");
  decision.textContent = card.decision || "";
  decision.classList.add("hidden");
  const shot = document.getElementById("shot");
  const wrap = document.getElementById("shot-wrap");
  if (card.image_url) {
    shot.onload = null;
    shot.onerror = null;
    shot.removeAttribute("src");
    wrap.classList.remove("hidden", "fs");
    const rideLinesEarly = Array.isArray(card.ride_along) ? card.ride_along.filter(Boolean) : [];
    const rideOwnsShot = !opts.review && !opts.pending && rideLinesEarly.length;
    if (!rideOwnsShot) {
      PM.loadImage(shot, card.image_url).then(() => pinCardTop());
    }
  } else {
    shot.removeAttribute("src");
    wrap.classList.add("hidden");
  }
  PMFeel.setKen(card.camera);
  PMFeel.setWeather(card.weather);
  PMFeel.setDriver(card.driver);
  PMFeel.applyGrade();
  applyMeters(card.state || meters, "paint", {
    night: Boolean(card.night),
    camera: card.camera,
    cardId: card.card_id,
  });
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  result.classList.add("hidden");
  debrief.classList.add("hidden");
  debrief.onclick = null;
  const hookEl = document.getElementById("hook");
  const sceneEl = document.getElementById("scene");
  const cont = document.getElementById("continue");
  const playAgain = document.getElementById("play-again");
  const resumeLive = document.getElementById("resume-live");
  const hook = card.hook || PMFeel.firstSentence(card.scene);
  const isWatch = card.card_type === "dossier" || card.card_type === "ride-along";
  if (hookEl) {
    hookEl.textContent = hook;
    hookEl.classList.toggle("hidden", isWatch || !hook);
    hookEl.onclick = null;
  }
  if (sceneEl) {
    sceneEl.textContent = card.scene || "";
    sceneEl.classList.remove("hidden");
  }
  if (wrap) wrap.classList.remove("arming");
  PMFeel.hideBark();
  const coldFloat = document.getElementById("cooler-float");
  if (coldFloat) coldFloat.classList.add("hidden");
  document.getElementById("options").classList.add("hidden");
  document.getElementById("options").replaceChildren();

  if (opts.review) {
    showChoiceDock();
    if (sceneEl) sceneEl.classList.remove("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, opts);
    document.getElementById("options").classList.toggle("hidden", !(card.options || []).length);
    applyOutcome(card.outcome, { collapseDebrief: false });
    bindAlts(card.alts || [], card);
    cont.classList.add("hidden");
    cont.onclick = null;
    if (playAgain) {
      playAgain.classList.remove("hidden");
      playAgain.onclick = () => playAgainCard(card.card_id);
    }
    resumeLive.classList.remove("hidden");
    resumeLive.onclick = () => openLive();
    return;
  }

  if (playAgain) {
    playAgain.classList.add("hidden");
    playAgain.onclick = null;
  }

  if (opts.recap || card.recap) {
    showChoiceDock();
    if (sceneEl) sceneEl.classList.remove("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, { review: true, pending: false });
    document.getElementById("options").classList.toggle("hidden", !(card.options || []).length);
    applyOutcome(card.outcome, { collapseDebrief: false });
    runEl.classList.add("recap-skip");
    startRecapBeat(card);
    return;
  }

  if (card.hold) {
    runEl.classList.add("holding");
    showChoiceDock();
    if (hookEl) hookEl.classList.add("hidden");
    if (sceneEl) sceneEl.classList.add("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, { review: false, pending: false });
    document.getElementById("options").classList.toggle("hidden", !(card.options || []).length);
    resumeLive.classList.add("hidden");
    resumeLive.onclick = null;
    cont.classList.add("hidden");
    cont.onclick = null;
    choicesLiveAt = Date.now();
    PMFeel.showHold(card);
    pinCardTop();
    return;
  }

  const rideLines = Array.isArray(card.ride_along) ? card.ride_along.filter(Boolean) : [];
  if (!opts.review && !opts.pending && rideLines.length) {
    startRideAlong(card, rideLines);
    return;
  }

  resumeLive.classList.add("hidden");
  resumeLive.onclick = null;
  cont.classList.add("hidden");
  cont.onclick = null;

  if (opts.pending) {
    showChoiceDock();
    if (sceneEl) sceneEl.classList.remove("hidden");
    if (card.decision) decision.classList.remove("hidden");
    fillOptions(card, opts);
    document.getElementById("options").classList.add("hidden");
    playOutcome({ ...(card.outcome || {}), state: card.state, alts: card.alts }, card);
    return;
  }

  armChoiceGate(card, opts);
  pinCardTop();
}

function startRideAlong(card, lines) {
  const wrap = document.getElementById("shot-wrap");
  const ken = document.getElementById("shot-ken");
  const shot = document.getElementById("shot");
  const sceneEl = document.getElementById("scene");
  const hookEl = document.getElementById("hook");
  const cont = document.getElementById("continue");
  const decision = document.getElementById("decision");
  if (sceneEl) sceneEl.classList.add("hidden");
  if (hookEl) hookEl.classList.add("hidden");
  if (decision) decision.classList.add("hidden");
  document.getElementById("options").classList.add("hidden");
  cont.classList.add("hidden");
  cont.onclick = null;
  runEl.classList.add("choices-ready", "riding");

  const beats = Array.isArray(card.ride_beats) ? card.ride_beats : [];
  const liveUrl = card.image_url;
  const beatUrl = (name) =>
    "/ride/" + encodeURIComponent(card.card_id) + "/" + encodeURIComponent(name) + ".webp?v=r2";

  let spots = wrap && wrap.querySelector(".ride-spots");
  if (wrap && !spots) {
    spots = document.createElement("div");
    spots.className = "ride-spots";
    ["left", "right", "gap", "thermos", "wheel"].forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ride-spot";
      b.dataset.spot = id;
      b.setAttribute("aria-label", id);
      spots.appendChild(b);
    });
    wrap.appendChild(spots);
  }

  let i = 0;
  let seq = [];
  let seqAt = 0;
  let awaiting = "anywhere";

  const clearSpots = () => {
    if (!spots) return;
    spots.querySelectorAll(".ride-spot").forEach((el) => {
      el.classList.remove("armed", "done");
    });
  };

  const armSpot = (id) => {
    clearSpots();
    if (!spots || !id || id === "anywhere") return;
    const el = spots.querySelector('[data-spot="' + id + '"]');
    if (el) el.classList.add("armed");
  };

  const setLook = (look) => {
    if (!ken) return;
    ken.className = "shot-ken still ride-look-" + (look || "road");
  };

  const setStill = (name) => {
    if (!shot) return;
    const url = name ? beatUrl(name) : liveUrl;
    if (shot.getAttribute("src") === url) return;
    PM.loadImage(shot, url).catch(() => {
      if (name && liveUrl) PM.loadImage(shot, liveUrl).catch(() => {});
    });
  };

  const sequenceFor = (tap) => {
    if (tap === "sweep") return ["left", "right", "left"];
    if (tap === "eyes") return ["left", "right", "left", "road"];
    if (tap && tap !== "anywhere") return [tap];
    return [];
  };

  const show = () => {
    const beat = beats[i] || {};
    const look = beat.look || "road";
    const tap = beat.tap || "anywhere";
    setStill(beat.still || null);
    setLook(look);
    seq = sequenceFor(tap);
    seqAt = 0;
    awaiting = seq.length ? seq[0] : "anywhere";
    if (awaiting === "road") {
      // road has no hotspot — anywhere on the still completes that step
      clearSpots();
    } else {
      armSpot(awaiting === "anywhere" ? null : awaiting);
    }
    PMFeel.showBark({ who: "deac", line: lines[i], tap: true, persist: true });
    if (i >= lines.length - 1 && awaiting === "anywhere" && !seq.length) {
      cont.classList.remove("hidden");
      cont.textContent = "Continue";
      cont.onclick = () => {
        stop();
        submitAnswer("continue");
      };
    } else {
      cont.classList.add("hidden");
      cont.onclick = null;
    }
  };

  const advanceLine = () => {
    if (i >= lines.length - 1) {
      cont.classList.remove("hidden");
      cont.textContent = "Continue";
      cont.onclick = () => {
        stop();
        submitAnswer("continue");
      };
      clearSpots();
      awaiting = "done";
      return;
    }
    i += 1;
    show();
  };

  const onSpot = (spot) => {
    if (awaiting === "done") return;
    if (awaiting === "anywhere") {
      advanceLine();
      return;
    }
    if (awaiting === "road") {
      // completed via wrap click
      return;
    }
    if (spot !== awaiting) {
      if (spots) {
        const wrong = spots.querySelector('[data-spot="' + spot + '"]');
        if (wrong) {
          wrong.classList.add("miss");
          window.setTimeout(() => wrong.classList.remove("miss"), 280);
        }
      }
      return;
    }
    const el = spots && spots.querySelector('[data-spot="' + spot + '"]');
    if (el) el.classList.add("done");
    setLook(spot === "thermos" || spot === "wheel" || spot === "gap" ? spot : spot);
    seqAt += 1;
    if (seqAt >= seq.length) {
      advanceLine();
      return;
    }
    awaiting = seq[seqAt];
    if (awaiting === "road") {
      clearSpots();
      setLook("road");
    } else {
      armSpot(awaiting);
      setLook(awaiting);
    }
  };

  const onWrap = (ev) => {
    if (ev && ev.target && ev.target.closest && ev.target.closest("#continue")) return;
    if (ev && ev.target && ev.target.closest && ev.target.closest(".ride-spot")) return;
    if (awaiting === "done") return;
    if (awaiting === "anywhere" || awaiting === "road") {
      if (awaiting === "road") {
        seqAt += 1;
        if (seqAt >= seq.length) advanceLine();
        else {
          awaiting = seq[seqAt];
          armSpot(awaiting);
          setLook(awaiting);
        }
        return;
      }
      advanceLine();
    }
  };

  const stop = () => {
    if (wrap) wrap.onclick = null;
    if (spots) {
      spots.querySelectorAll(".ride-spot").forEach((el) => {
        el.onclick = null;
      });
      clearSpots();
    }
    if (ken) ken.className = "shot-ken " + (PMFeel.kenClass(card.camera) || "ken-cockpit");
    runEl.classList.remove("riding");
    PMFeel.hideBark();
  };

  if (spots) {
    spots.querySelectorAll(".ride-spot").forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        onSpot(el.dataset.spot);
      };
    });
  }
  if (wrap) wrap.onclick = onWrap;
  show();
  pinCardTop();
}

function pinCardTop() {
  runEl.scrollTop = 0;
  window.scrollTo(0, 0);
  if (stopChoiceGate) runEl.dispatchEvent(new Event("scroll"));
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
  showChoiceDock();
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
  PMFeel.floatTimeCost(opt.state_delta && opt.state_delta.time_cost);
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
  const quiet = Boolean(data && data.quiet) && !failed;
  const isDossier = liveCard && (liveCard.card_type === "dossier" || liveCard.card_type === "ride-along");
  const finish = () => {
    const cost = data.time_cost != null ? data.time_cost : data.state_delta && data.state_delta.time_cost;
    if (failed) {
      applyMeters(nextMeters, "paint");
      PMFeel.floatTimeCost(cost);
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
    if (quiet) {
      applyMeters(nextMeters, "spike");
      PMFeel.floatTimeCost(cost);
      applyOutcome(data, { collapseDebrief: true });
      bindAlts((data && data.alts) || [], card);
      PMFeel.playQuietBeat(() => holdContinue(card.card_id));
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
    PMFeel.floatTimeCost(cost);
    if (data.radio && data.radio.line) {
      PMFeel.showBark({ who: data.radio.who || "reyna_solis", line: data.radio.line, tap: false });
    }
    bindAlts((data && data.alts) || [], card);
    if (data.delivery) {
      holdContinue(card.card_id, () => {
        PMFeel.showDelivery(data.delivery, () => loadHome());
      });
      return;
    }
    holdContinue(card.card_id);
  };
  if (!isDossier && !failed && !quiet) {
    PMFeel.showReward(correct, finish);
    return;
  }
  finish();
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

async function advanceRecap(card) {
  if (recapAdvancing) return;
  recapAdvancing = true;
  window.clearTimeout(recapTimer);
  recapTimer = 0;
  runEl.classList.remove("recap-skip");
  try {
    const data = await PM.api("/api/run/recap-advance", {
      method: "POST",
      body: { card_id: card.card_id },
    });
    if (data.state) applyMeters(data.state, "paint");
    PMFeel.floatTimeCost(data.time_cost);
    if (data.radio && data.radio.line) {
      PMFeel.showBark({ who: data.radio.who || "reyna_solis", line: data.radio.line, tap: false });
    }
    const next = data.next || {};
    if (next.done || !next.card_id) {
      if (data.delivery) {
        PMFeel.showDelivery(data.delivery, () => loadHome());
        return;
      }
      await loadHome();
      return;
    }
    previousCardId = card.card_id;
    renderLive({ ...next, saved: card.saved, state: data.state || card.state, pending_outcome: false, review: false });
  } catch {
    recapAdvancing = false;
    startRecapBeat(card);
  }
}

function startRecapBeat(card) {
  recapAdvancing = false;
  window.clearTimeout(recapTimer);
  const ms = Number(card.auto_advance_ms) || 2000;
  const gen = playGen;
  const go = () => {
    if (gen !== playGen || recapAdvancing) return;
    advanceRecap(card);
  };
  recapTimer = window.setTimeout(go, ms);
  runEl.onclick = (ev) => {
    if (!runEl.classList.contains("recap-skip")) return;
    if (ev.target.closest("button, a, input, textarea, select")) return;
    go();
  };
}

function renderLive(card) {
  showScreen("live");
  setHeader({ title: card.title, saved: card.saved, back: true });
  const skipIntro = Boolean(card.hold || card.recap);
  if (!skipIntro) {
    runEl.classList.remove("slide-in");
    void runEl.offsetWidth;
    runEl.classList.add("slide-in");
  }
  const begin = () => {
    shownAt = Date.now();
    PMFeel.startBed(card.weather);
    fillCard(card, { pending: Boolean(card.pending_outcome), review: false });
    saveLive({
      card_id: card.card_id,
      phase: card.pending_outcome ? "result" : "live",
      scroll: 0,
    });
    pinCardTop();
  };
  if (card.hold) {
    begin();
    return;
  }
  const crankThen = () => {
    if (sessionCaught()) {
      begin();
      return;
    }
    PMFeel.showIgnition(() => {
      markCaught();
      begin();
    });
  };
  if (card.manifest && card.manifest.show) {
    PMFeel.showManifest(card.manifest, crankThen);
    return;
  }
  crankThen();
}

function renderReview(card) {
  showScreen("review");
  setHeader({ title: card.title, saved: card.saved, back: true });
  fillCard(card, { review: true, pending: false });
  pinCardTop();
}

async function loadHome(focusCardId) {
  const data = await PM.api("/api/run/home");
  renderHome(data, { focusCardId: focusCardId || null });
}

async function startOver() {
  clearLive();
  meters = { noise: 0, light: 0, yaw: 0, cargo: 140, time_cost: 0, cold: 130, warming: 0, phase: "cold", presence: 0, tier: 0, handprints: false, camera: "", cardId: "" };
  try {
    await PM.api("/api/run/restart", { method: "POST", body: {} });
  } catch {
    return;
  }
  await openLive();
}

async function playAgainCard(cardId) {
  if (!cardId) return;
  clearLive();
  meters = { noise: 0, light: 0, yaw: 0, cargo: 140, time_cost: 0, cold: 130, warming: 0, phase: "cold", presence: 0, tier: 0, handprints: false, camera: "", cardId: "" };
  try {
    await PM.api("/api/run/play-again", { method: "POST", body: { card_id: cardId } });
  } catch {
    return;
  }
  await openLive();
}

function openAct(a) {
  if (!a || a.locked) return;
  if (a.complete && a.first_card_id) {
    openReview(a.first_card_id);
    return;
  }
  if (a.current) {
    openLive();
    return;
  }
  if (a.open_card_id) openReview(a.open_card_id);
}

async function openLive() {
  const data = await PM.api("/api/run/current");
  if (data.done && !data.card_id) {
    await loadHome();
    return;
  }
  previousCardId = data.previous_card_id || null;
  nextCardId = data.next_card_id || null;
  renderLive(data);
}

async function openReview(cardId) {
  try {
    const data = await PM.api("/api/run/review/" + encodeURIComponent(cardId));
    previousCardId = data.previous_card_id || null;
    nextCardId = data.next_card_id || null;
    renderReview(data);
  } catch {
    // stay on home if a log card cannot load
  }
}

function canSwipeCards() {
  if (mode !== "review") return false;
  return Boolean(previousCardId || nextCardId);
}

function goNeighbor(dir) {
  const id = dir === "next" ? nextCardId : previousCardId;
  if (!id) return;
  openReview(id);
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

function playHoldOutcome(data, card) {
  const correct = Boolean(data && data.was_correct);
  applyMeters(data.state || meters, correct ? "ease" : "spike");
  if (correct) {
    PMFeel.floatHoldGain(data.banked);
    PMFeel.dropHold(data.hold_cleared);
  } else {
    PMFeel.shake();
    PMFeel.lungeHold();
  }
  const result = document.getElementById("result");
  if (result) {
    result.textContent = correct ? "" : (data.result || "");
    result.classList.toggle("hidden", !result.textContent);
  }
  document.getElementById("options").classList.add("hidden");
  const next = (data && data.next) || {};
  window.setTimeout(() => {
    answering = false;
    if (next.hold && next.card_id) {
      previousCardId = card.card_id;
      fillCard({ ...next, saved: card.saved, state: data.state || card.state }, { pending: false, review: false });
      return;
    }
    PMFeel.hideHold();
    runEl.classList.remove("holding");
    if (next.done || !next.card_id) {
      loadHome();
      return;
    }
    renderLive({ ...next, saved: card.saved, state: data.state || next.state, pending_outcome: false, review: false });
  }, correct ? 720 : 880);
}

async function submitHoldAnswer(optionId) {
  if (answering) return;
  answering = true;
  try {
    const data = await PM.api("/api/run/hold-answer", {
      method: "POST",
      body: { card_id: currentCardId, option_id: optionId },
    });
    playHoldOutcome(data, { card_id: currentCardId, saved: liveCard && liveCard.saved });
  } catch {
    answering = false;
  }
}

async function submitAnswer(optionId) {
  if (liveCard && liveCard.hold) {
    await submitHoldAnswer(optionId);
    return;
  }
  if (answering) return;
  if (!timedSubmit && Date.now() < choicesLiveAt) return;
  answering = true;
  window.clearInterval(hazardTimer);
  hazardTimer = 0;
  const clock = document.getElementById("hazard-clock");
  if (clock) clock.classList.add("hidden");
  const timed = timedSubmit;
  timedSubmit = false;
  try {
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
  } catch {
    answering = false;
  }
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
  runPointerDown = true;
  if (ev.target.closest("#ignition") || ev.target.closest("#collapse") || ev.target.closest("#manifest") || ev.target.closest("#delivery") || ev.target.closest("#hold")) return;
  PMFeel.ensureAudio();
});
window.addEventListener("pointerup", () => {
  runPointerDown = false;
  if (stopChoiceGate) runEl.dispatchEvent(new Event("scroll"));
});
window.addEventListener("pointercancel", () => {
  runPointerDown = false;
});

document.getElementById("hdr-home").addEventListener("click", () => {
  loadHome();
});

document.getElementById("hdr-back").addEventListener("click", () => {
  if (mode === "home") return;
  loadHome(currentCardId);
});

let swipeStart = null;
runEl.addEventListener("touchstart", (ev) => {
  if (!canSwipeCards() || ev.touches.length !== 1) {
    swipeStart = null;
    return;
  }
  if (ev.target.closest("button, a, input, textarea, select, #ignition, #collapse, #reward, #manifest, #delivery, #shot-wrap.fs")) {
    swipeStart = null;
    return;
  }
  swipeStart = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
}, { passive: true });
runEl.addEventListener("touchend", (ev) => {
  if (!swipeStart || !canSwipeCards()) {
    swipeStart = null;
    return;
  }
  const t = ev.changedTouches[0];
  const dx = t.clientX - swipeStart.x;
  const dy = t.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  goNeighbor(dx < 0 ? "next" : "prev");
}, { passive: true });

document.getElementById("shot-wrap").addEventListener("click", (ev) => {
  const wrap = ev.currentTarget;
  if (wrap.classList.contains("hidden")) return;
  if (runEl.classList.contains("holding")) return;
  if (runEl.classList.contains("riding")) return;
  if (ev.target.closest("button, a, #bark")) return;
  wrap.classList.toggle("fs");
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    const wrap = document.getElementById("shot-wrap");
    if (wrap) wrap.classList.remove("fs");
  }
  if (!canSwipeCards()) return;
  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    goNeighbor("prev");
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    goNeighbor("next");
  }
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
