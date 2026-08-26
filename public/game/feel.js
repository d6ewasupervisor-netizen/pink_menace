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

  function setVignette(t) {
    const v = document.getElementById("vignette");
    if (!v) return;
    const p = Math.max(0, Math.min(1, t));
    v.style.setProperty("--vig", String(0.15 + (1 - p) * 0.7));
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
    typeScene,
    ensureAudio,
  };
})();
