"use strict";

const PMFeel = (() => {
  const CPS = 40;
  const reduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function firstSentence(text) {
    const t = String(text || "").trim();
    const m = t.match(/^[\s\S]*?[.!?](?:\s|$)/);
    return m ? m[0] : t;
  }

  function splitDebrief(text) {
    const t = String(text || "").trim();
    const head = firstSentence(t).trim();
    const rest = t.slice(head.length).trim();
    return { head, rest };
  }

  function kenClass(camera) {
    switch (camera) {
      case "POV_COCKPIT":
        return "ken-cockpit";
      case "POV_MIRROR_REAR":
      case "POV_MIRROR_DOOR":
        return "ken-mirror";
      case "POV_CHASE":
        return "ken-chase";
      case "POV_DIAGRAM":
        return "ken-diagram";
      case "POV_ROADSIDE":
        return "ken-roadside";
      case "POV_PORTRAIT":
        return "ken-portrait";
      case "POV_OBJECT":
        return "ken-object";
      case "POV_TOPDOWN_PHOTO":
        return "ken-topdown";
      default:
        return "ken-chase";
    }
  }

  function isRain(weather) {
    return weather === "rain" || weather === "heavy_rain";
  }

  function meterPct(n) {
    return Math.max(0, Math.min(100, (Number(n) || 0) * 12));
  }

  function paintMeters(state) {
    const s = state || {};
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.style.width = meterPct(val) + "%";
    };
    set("m-noise", s.noise);
    set("m-light", s.light);
    set("m-yaw", s.yaw);
    const tag = document.getElementById("cooler-tag");
    const min = document.getElementById("cooler-min");
    const cold = Math.max(0, Math.round(Number(s.cold) || 0));
    const warming = Math.max(0, Math.round(Number(s.warming) || 0));
    const warmingLive = s.phase === "warming" || (cold <= 0 && (warming > 0 || Number(s.time_cost) >= 90));
    if (min) {
      min.textContent = warmingLive ? "0 · WARMING " + warming + " MIN" : cold + " MIN";
    }
    if (tag) {
      tag.classList.toggle("warming", warmingLive);
      tag.classList.toggle("low", warmingLive ? warming <= 8 : cold <= 15);
      tag.classList.toggle("dead", warmingLive && warming <= 0);
    }
  }

  function floatTimeCost(n) {
    const el = document.getElementById("cooler-float");
    if (!el) return;
    const cost = Math.max(0, Math.round(Number(n) || 0));
    if (!cost) {
      el.classList.add("hidden");
      return;
    }
    el.textContent = "−" + cost + " MIN";
    el.classList.remove("hidden");
    el.replaceWith(el.cloneNode(true));
  }

  function spikeMeters(prev, next) {
    const dash = document.getElementById("dash");
    if (dash) {
      dash.classList.remove("ease");
      dash.classList.add("spike");
    }
    paintMeters(next);
    window.setTimeout(() => {
      if (!dash) return;
      dash.classList.remove("spike");
      dash.classList.add("ease");
    }, 420);
  }

  function easeMeters(next) {
    const dash = document.getElementById("dash");
    if (dash) {
      dash.classList.remove("spike");
      dash.classList.add("ease");
    }
    paintMeters(next);
  }

  const audio = {
    ctx: null,
    idle: null,
    rain: null,
    wiper: null,
    enabled: false,
  };

  function ensureAudio() {
    if (audio.ctx) return audio.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    return audio.ctx;
  }

  function noiseBuffer(ctx, seconds) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function startBed(weather) {
    const ctx = ensureAudio();
    if (!ctx) return;
    audio.enabled = true;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    stopBed();
    const idleOsc = ctx.createOscillator();
    const idleGain = ctx.createGain();
    idleOsc.type = "sine";
    idleOsc.frequency.value = 68;
    idleGain.gain.value = 0.028;
    idleOsc.connect(idleGain);
    idleGain.connect(ctx.destination);
    idleOsc.start();
    audio.idle = { osc: idleOsc, gain: idleGain };

    if (isRain(weather)) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 1.4);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = weather === "heavy_rain" ? 0.045 : 0.028;
      src.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      src.start();
      audio.rain = { src, g };
      audio.wiper = window.setInterval(() => hitWiper(), 1400);
    }
  }

  function stopBed() {
    stopCrank();
    if (audio.idle) {
      try {
        audio.idle.osc.stop();
      } catch {
        // already stopped
      }
      audio.idle = null;
    }
    if (audio.rain) {
      try {
        audio.rain.src.stop();
      } catch {
        // already stopped
      }
      audio.rain = null;
    }
    if (audio.wiper) {
      window.clearInterval(audio.wiper);
      audio.wiper = null;
    }
  }

  function hitWiper() {
    const ctx = audio.ctx;
    if (!ctx || !audio.enabled) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 220;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  function hitWrong() {
    const ctx = ensureAudio();
    if (!ctx || !audio.enabled) {
      haptic([40, 40, 90]);
      return;
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(190, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.28);
    g.gain.setValueAtTime(0.09, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.34);
    haptic([40, 40, 90]);
  }

  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {
      // iOS Safari — silent
    }
  }

  function shake() {
    const run = document.getElementById("run");
    if (!run || reduced()) return;
    run.classList.remove("hit");
    void run.offsetWidth;
    run.classList.add("hit");
    window.setTimeout(() => run.classList.remove("hit"), 420);
  }

  function setWeather(weather) {
    const rain = document.getElementById("wx-rain");
    const fog = document.getElementById("wx-fog");
    if (rain) rain.classList.toggle("hidden", !isRain(weather));
    if (fog) fog.classList.toggle("hidden", weather !== "fog");
  }

  function setKen(camera) {
    const ken = document.getElementById("shot-ken");
    if (!ken) return;
    ken.className = "shot-ken " + kenClass(camera);
    ken.classList.toggle("still", reduced());
  }

  function setDriver(id) {
    document.documentElement.dataset.driver = id || "ali";
  }

  function applyGrade() {
    try {
      const on = new URLSearchParams(window.location.search).get("grade") === "1";
      document.documentElement.classList.toggle("grade-on", on);
    } catch {
      // ignore
    }
  }

  const BARKS = {
    ali_wrong: [
      "Yeah. Heard it too.",
      "That's the one that draws.",
      "Okay. We live with that.",
      "Noted. Keep rolling.",
      "Loud. They're going to like that.",
      "I felt that in the crates.",
    ],
    ali_hazard: [
      "Gracie. Sit.",
      "Off the cooler, Gracie.",
      "Quiet. That's the trick.",
      "Hold that line.",
      "Good. Don't advertise it.",
      "That's the gap. Take it.",
      "Soft on the lamps.",
    ],
    ali_ok: [
      "Copy.",
      "That's the one.",
      "Keep it boring.",
      "Still cold. Keep going.",
      "Paint's still paint.",
      "Don't get cute now.",
    ],
    deac_timeout: [
      "Schedule's still the schedule.",
      "The world didn't wait.",
      "Cadence, Kilo.",
      "You froze. It didn't.",
      "Time's a lane. You left it.",
      "Move or get moved.",
    ],
    yuna_noise: [
      "Okay, that was me. That one was me.",
      "I heard myself. Sorry.",
      "That one rang.",
      "I know. I heard it too.",
      "Won't do that twice.",
      "Yeah. That was loud.",
    ],
  };
  const usedBarks = {};

  function pickBark(kind) {
    const pool = BARKS[kind] || [];
    if (!pool.length) return "";
    if (!usedBarks[kind]) usedBarks[kind] = [];
    const left = pool.filter((l) => !usedBarks[kind].includes(l));
    const line = (left.length ? left : pool)[Math.floor(Math.random() * (left.length ? left.length : pool.length))];
    usedBarks[kind] = left.length ? usedBarks[kind].concat(line) : [line];
    return line;
  }

  function barkFor(opts) {
    const o = opts || {};
    if (o.timedOut) return { who: "deac", line: pickBark("deac_timeout"), tap: false };
    if (o.correct && o.hazard) return { who: "ali", line: pickBark("ali_hazard"), tap: false };
    if (o.correct) return { who: "deac", line: "", tap: true };
    if (Number(o.noise) > 0) return { who: "yuna", line: pickBark("yuna_noise"), tap: false };
    return { who: "ali", line: pickBark("ali_wrong"), tap: false };
  }

  let barkTimer = 0;
  function showBark(spec) {
    const el = document.getElementById("bark");
    const face = document.getElementById("bark-face");
    const line = document.getElementById("bark-line");
    if (!el) return;
    window.clearTimeout(barkTimer);
    const s = spec || {};
    if (face) {
      if (s.who === "ali" || s.who === "deac" || s.who === "reyna_solis") {
        face.src = "/api/run/cast/" + encodeURIComponent(s.who) + "?bark=1";
        face.classList.remove("hidden");
      } else {
        face.removeAttribute("src");
      }
    }
    if (line) line.textContent = s.line || (s.tap ? "" : "");
    el.className = "bark" + (s.tap ? " tap" : "");
    el.classList.remove("hidden");
    barkTimer = window.setTimeout(() => {
      el.classList.add("hidden");
    }, 1800);
  }

  function hideBark() {
    window.clearTimeout(barkTimer);
    const el = document.getElementById("bark");
    if (el) el.classList.add("hidden");
  }

  const REWARD_COUNT = 40;
  const CORRECT_MSGS = [
    "Nice call.",
    "Clean read.",
    "That's the move.",
    "You saw it.",
    "Good driving.",
  ];
  const WRONG_MSGS = [
    "Not quite — look again.",
    "Keep searching.",
    "The Grid still has rules.",
    "Try another read.",
    "Almost — one more look.",
  ];
  let rewardPick = 0;

  function pickRewardImage() {
    rewardPick = (rewardPick % REWARD_COUNT) + 1;
    return "/rewards/correct_answer__" + String(rewardPick).padStart(2, "0") + ".png";
  }

  function pickRewardMsg(correct) {
    const pool = correct ? CORRECT_MSGS : WRONG_MSGS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let rewardTimer = 0;
  function hideReward() {
    window.clearTimeout(rewardTimer);
    const el = document.getElementById("reward");
    if (el) {
      el.onclick = null;
      el.classList.add("hidden");
    }
    const img = document.getElementById("reward-img");
    if (img) {
      img.removeAttribute("src");
      img.classList.add("hidden");
    }
  }

  function showReward(correct, then) {
    const el = document.getElementById("reward");
    const img = document.getElementById("reward-img");
    const msg = document.getElementById("reward-msg");
    if (!el || !msg) {
      then && then();
      return;
    }
    hideReward();
    msg.textContent = pickRewardMsg(correct);
    el.className = "reward" + (correct ? "" : " wrong");
    if (correct && img) {
      img.src = pickRewardImage();
      img.classList.remove("hidden");
    } else if (img) {
      img.removeAttribute("src");
      img.classList.add("hidden");
    }
    el.classList.remove("hidden");
    const done = () => {
      hideReward();
      then && then();
    };
    el.onclick = done;
    rewardTimer = window.setTimeout(done, correct ? 2800 : 2200);
  }

  const SIGHT_KEY = "pm.driveBySight";
  const LEAD_MS = 1600;
  let hazardLeft = 1;
  let presenceAmt = 0;
  let cueTimer = 0;
  let crankNodes = null;
  let holdTimer = 0;

  function driveBySight() {
    try {
      return localStorage.getItem(SIGHT_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setDriveBySight(on) {
    try {
      if (on) localStorage.setItem(SIGHT_KEY, "1");
    } catch {
      // private mode
    }
  }

  function paintVignette() {
    const v = document.getElementById("vignette");
    if (!v) return;
    const fromHazard = 1 - Math.max(0, Math.min(1, hazardLeft));
    const t = Math.max(fromHazard, presenceAmt);
    v.style.setProperty("--vig", String(0.12 + t * 0.72));
  }

  function setVignette(t) {
    hazardLeft = Math.max(0, Math.min(1, t));
    paintVignette();
  }

  function paintFear(state) {
    const root = document.getElementById("fear-root");
    if (!root) return;
    const tier = Math.max(0, Math.min(4, Number(state && state.tier) || 0));
    const prints = Boolean(state && state.handprints) || tier >= 3;
    const night = Boolean(state && state.night);
    root.className =
      "fear-root tier-" +
      Math.min(tier, 3) +
      (prints ? " prints" : "") +
      (night ? " night" : "");
    presenceAmt = Math.min(1, (Number(state && state.presence) || 0) / 22);
    paintVignette();
  }

  function clearCues() {
    window.clearTimeout(cueTimer);
    cueTimer = 0;
    const root = document.getElementById("fear-root");
    if (root) root.classList.remove("cue-now");
  }

  function playCueAudio(kind) {
    const ctx = ensureAudio();
    if (!ctx || !audio.enabled) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    if (kind === "steps") {
      [0, 0.22, 0.48].forEach((at, i) => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, 0.12);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900 - i * 80;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now + at);
        g.gain.exponentialRampToValueAtTime(0.05, now + at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.11);
        src.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        src.start(now + at);
        src.stop(now + at + 0.12);
      });
      return;
    }
    if (kind === "horn") {
      [0, 0.28].forEach((at, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i ? 311 : 392;
        g.gain.setValueAtTime(0.0001, now + at);
        g.gain.exponentialRampToValueAtTime(0.06, now + at + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.22);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + at);
        osc.stop(now + at + 0.24);
      });
      return;
    }
    if (kind === "scrape") {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 0.4);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 240;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      src.connect(hp);
      hp.connect(g);
      g.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.4);
      return;
    }
    if (kind === "siren") {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.linearRampToValueAtTime(820, now + 0.35);
      osc.frequency.linearRampToValueAtTime(620, now + 0.7);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.74);
      return;
    }
    if (kind === "palm") {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 70;
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  function fireCue(kind) {
    clearCues();
    if (!kind) return;
    playCueAudio(kind);
    const root = document.getElementById("fear-root");
    const show = () => {
      if (root) root.classList.add("cue-now");
    };
    if (driveBySight() || reduced()) show();
    else cueTimer = window.setTimeout(show, LEAD_MS);
  }

  function cueFor(card) {
    if (!card || card.card_type !== "hazard") return null;
    const id = card.card_id;
    if (id === "II-005" || id === "II-026") return "steps";
    if (id === "II-014") return "horn";
    if (id === "II-019") return "scrape";
    if (id === "II-030") return "siren";
    if (isRain(card.weather)) return "steps";
    return "horn";
  }

  function stopCrank() {
    if (!crankNodes) return;
    try {
      crankNodes.osc.stop();
    } catch {
      // already stopped
    }
    try {
      crankNodes.src.stop();
    } catch {
      // already stopped
    }
    crankNodes = null;
  }

  function startCrank() {
    const ctx = ensureAudio();
    if (!ctx) return;
    audio.enabled = true;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    stopCrank();
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(88, ctx.currentTime + 1.4);
    og.gain.value = 0.05;
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.35);
    src.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.03;
    src.connect(ng);
    ng.connect(ctx.destination);
    src.start();
    crankNodes = { osc, src };
  }

  function catchEngine() {
    stopCrank();
    ["ignition-needle", "ignition-needle-2"].forEach((id) => {
      const n = document.getElementById(id);
      if (!n) return;
      n.classList.remove("spin");
      n.classList.add("held");
    });
    const ctx = audio.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(68, ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 0.45);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.46);
  }

  function showManifest(data, onSign) {
    const panel = document.getElementById("manifest");
    const btn = document.getElementById("manifest-sign");
    if (!panel || !btn) {
      onSign && onSign();
      return;
    }
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || "";
    };
    const row = data || {};
    set("man-run", row.run || "");
    set("man-cargo", row.cargo || "");
    set("man-cold", (row.cold != null ? row.cold : 90) + " MIN");
    set("man-for", row.for || "");
    set("manifest-sig", row.driver || "________");
    panel.classList.remove("hidden");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      btn.onclick = null;
      panel.classList.add("hidden");
      onSign && onSign();
    };
    btn.onclick = (ev) => {
      ev.preventDefault();
      finish();
    };
  }

  function showDelivery(copy, then) {
    const panel = document.getElementById("delivery");
    const line = document.getElementById("delivery-copy");
    const go = document.getElementById("delivery-continue");
    if (!panel) {
      then && then();
      return;
    }
    if (line) line.textContent = copy || "Delivered.";
    panel.classList.remove("hidden");
    const close = () => {
      panel.classList.add("hidden");
      if (go) go.onclick = null;
      panel.onclick = null;
      then && then();
    };
    if (go) go.onclick = (ev) => {
      ev.stopPropagation();
      close();
    };
    panel.onclick = close;
  }

  function showIgnition(onCatch) {
    const panel = document.getElementById("ignition");
    const btn = document.getElementById("ignition-catch");
    if (!panel || !btn) {
      onCatch && onCatch();
      return;
    }
    panel.classList.remove("hidden", "cranking", "caught");
    const needles = ["ignition-needle", "ignition-needle-2"].map((id) => document.getElementById(id));
    needles.forEach((n) => n && n.classList.remove("held", "spin"));
    let done = false;
    let downAt = 0;
    const CATCH_MS = 1100;
    const SIGHT_MS = 5000;
    const resetCrank = () => {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      stopCrank();
      panel.classList.remove("cranking");
      needles.forEach((n) => n && n.classList.remove("spin", "held"));
    };
    const finish = (sight) => {
      if (done) return;
      done = true;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      if (sight) setDriveBySight(true);
      panel.classList.remove("cranking");
      panel.classList.add("caught");
      catchEngine();
      window.setTimeout(() => {
        panel.classList.add("hidden");
        panel.classList.remove("caught", "cranking");
        btn.onpointerdown = null;
        btn.onpointerup = null;
        btn.onpointerleave = null;
        btn.onclick = null;
        onCatch && onCatch();
      }, 420);
    };
    btn.onclick = (ev) => ev.preventDefault();
    btn.onpointerdown = (ev) => {
      ev.preventDefault();
      downAt = Date.now();
      panel.classList.add("cranking");
      startCrank();
      needles.forEach((n) => n && n.classList.add("spin"));
      holdTimer = window.setTimeout(() => finish(true), SIGHT_MS);
    };
    btn.onpointerup = () => {
      if (done) return;
      const held = Date.now() - downAt;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      if (held >= SIGHT_MS) finish(true);
      else if (held >= CATCH_MS) finish(false);
      else resetCrank();
    };
    btn.onpointerleave = () => {
      if (done) return;
      resetCrank();
    };
  }

  function playCollapse(dispatch, then) {
    const panel = document.getElementById("collapse");
    const copy = document.getElementById("collapse-copy");
    const go = document.getElementById("collapse-continue");
    const dash = document.getElementById("dash");
    const root = document.getElementById("fear-root");
    let closed = false;
    if (copy) copy.textContent = dispatch || "";
    if (go) go.classList.add("hidden");
    if (root) root.classList.add("collapsing");
    if (dash) dash.classList.add("dead");
    playCueAudio("palm");
    window.setTimeout(() => {
      if (closed) return;
      if (panel) panel.classList.remove("hidden");
      stopBed();
    }, 900);
    const close = () => {
      if (closed) return;
      closed = true;
      if (panel) {
        panel.onclick = null;
        panel.classList.add("hidden");
      }
      if (go) {
        go.onclick = null;
        go.classList.add("hidden");
      }
      if (root) root.classList.remove("collapsing");
      if (dash) dash.classList.remove("dead");
      if (copy) copy.textContent = "";
      then && then();
    };
    window.setTimeout(() => {
      if (closed) return;
      if (panel) panel.onclick = close;
      if (go) {
        go.classList.remove("hidden");
        go.onclick = (ev) => {
          ev.stopPropagation();
          close();
        };
      }
    }, 1200);
  }

  function typeScene(full, onFirst, onDone) {
    const el = document.getElementById("scene");
    const first = firstSentence(full);
    let i = 0;
    let firstFired = false;
    let timer = 0;
    const tickMs = 1000 / CPS;
    function paint() {
      if (!el) return;
      el.textContent = full.slice(0, i);
    }
    function step() {
      if (i >= full.length) {
        onDone && onDone();
        return;
      }
      i += 1;
      paint();
      if (!firstFired && i >= first.length) {
        firstFired = true;
        onFirst && onFirst();
      }
      timer = window.setTimeout(step, tickMs);
    }
    if (reduced()) {
      if (el) el.textContent = full;
      onFirst && onFirst();
      onDone && onDone();
      return () => {};
    }
    paint();
    timer = window.setTimeout(step, tickMs);
    return (complete) => {
      window.clearTimeout(timer);
      if (complete) {
        i = full.length;
        paint();
        if (!firstFired) {
          firstFired = true;
          onFirst && onFirst();
        }
        onDone && onDone();
      }
    };
  }

  return {
    firstSentence,
    splitDebrief,
    kenClass,
    paintMeters,
    floatTimeCost,
    spikeMeters,
    easeMeters,
    startBed,
    stopBed,
    hitWrong,
    shake,
    setWeather,
    setKen,
    setDriver,
    applyGrade,
    setVignette,
    paintFear,
    fireCue,
    cueFor,
    clearCues,
    showManifest,
    showDelivery,
    showIgnition,
    playCollapse,
    driveBySight,
    sting: playCueAudio,
    typeScene,
    ensureAudio,
    barkFor,
    showBark,
    hideBark,
    showReward,
    hideReward,
  };
})();
