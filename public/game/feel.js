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
    const cargo = document.getElementById("cargo-fill");
    if (cargo) cargo.style.width = Math.max(0, Math.min(100, Number(s.cargo) || 0)) + "%";
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
    root.className = "fear-root tier-" + Math.min(tier, 3) + (prints ? " prints" : "");
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
    const needle = document.getElementById("ignition-needle");
    if (needle) needle.classList.add("spin");
  }

  function catchEngine() {
    stopCrank();
    const needle = document.getElementById("ignition-needle");
    if (needle) {
      needle.classList.remove("spin");
      needle.classList.add("held");
    }
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

  function showIgnition(onCatch) {
    const panel = document.getElementById("ignition");
    const btn = document.getElementById("ignition-catch");
    if (!panel || !btn) {
      onCatch && onCatch();
      return;
    }
    panel.classList.remove("hidden");
    const needle = document.getElementById("ignition-needle");
    if (needle) needle.classList.remove("held", "spin");
    startCrank();
    let done = false;
    const finish = (sight) => {
      if (done) return;
      done = true;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      if (sight) setDriveBySight(true);
      catchEngine();
      panel.classList.add("hidden");
      btn.onpointerdown = null;
      btn.onpointerup = null;
      btn.onpointerleave = null;
      btn.onclick = null;
      onCatch && onCatch();
    };
    btn.onclick = (ev) => {
      ev.preventDefault();
    };
    btn.onpointerdown = (ev) => {
      ev.preventDefault();
      startCrank();
      holdTimer = window.setTimeout(() => finish(true), 900);
    };
    btn.onpointerup = () => {
      if (done) return;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      finish(false);
    };
    btn.onpointerleave = () => {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    };
  }

  function playCollapse(dispatch, then) {
    const panel = document.getElementById("collapse");
    const copy = document.getElementById("collapse-copy");
    const dash = document.getElementById("dash");
    const root = document.getElementById("fear-root");
    let closed = false;
    if (copy) copy.textContent = dispatch || "";
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
      if (root) root.classList.remove("collapsing");
      if (dash) dash.classList.remove("dead");
      if (copy) copy.textContent = "";
      then && then();
    };
    window.setTimeout(() => {
      if (panel) panel.onclick = close;
    }, 1400);
    window.setTimeout(close, 7000);
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
    spikeMeters,
    easeMeters,
    startBed,
    stopBed,
    hitWrong,
    shake,
    setWeather,
    setKen,
    setVignette,
    paintFear,
    fireCue,
    cueFor,
    clearCues,
    showIgnition,
    playCollapse,
    driveBySight,
    sting: playCueAudio,
    typeScene,
    ensureAudio,
  };
})();
