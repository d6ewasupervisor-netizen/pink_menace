"use strict";

let waits = 0;
let showTimer = 0;

function bufferRoot() {
  let el = document.getElementById("buffer");
  if (el) return el;
  el = document.createElement("div");
  el.id = "buffer";
  el.className = "buffer hidden";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-busy", "false");
  const img = document.createElement("img");
  img.src = "/shared/buffering.webp";
  img.alt = "";
  img.width = 128;
  img.height = 128;
  img.decoding = "async";
  const label = document.createElement("p");
  label.textContent = "Buffering";
  el.append(img, label);
  document.body.append(el);
  return el;
}

function paintBuffer() {
  const el = bufferRoot();
  const on = waits > 0;
  el.classList.toggle("hidden", !on);
  el.setAttribute("aria-busy", on ? "true" : "false");
}

function waitBegin() {
  waits += 1;
  bufferRoot();
  if (waits === 1 && !showTimer) {
    showTimer = window.setTimeout(() => {
      showTimer = 0;
      paintBuffer();
    }, 140);
  }
}

function waitEnd() {
  waits = Math.max(0, waits - 1);
  if (waits === 0) {
    if (showTimer) {
      window.clearTimeout(showTimer);
      showTimer = 0;
    }
    paintBuffer();
  }
}

async function waitFor(job) {
  waitBegin();
  try {
    return await job;
  } finally {
    waitEnd();
  }
}

async function api(path, options) {
  const opts = options || {};
  return waitFor((async () => {
    const res = await fetch(path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json", ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed.");
      err.status = res.status;
      err.rule = data.rule || null;
      err.data = data;
      throw err;
    }
    return data;
  })());
}

function $(id) {
  return document.getElementById(id);
}

function show(el, on) {
  el.classList.toggle("hidden", !on);
}

function setMsg(el, text, ok) {
  el.textContent = text || "";
  el.classList.toggle("ok", Boolean(ok) && Boolean(text));
}

function bindGate({ kind, onReady }) {
  const gate = $("gate");
  const app = $("app");
  const name = $("name");
  const phone = $("phone");
  const pin = $("pin");
  const sendBtn = $("send-pin");
  const enterBtn = $("enter");
  const msg = $("gate-msg");
  const pinWrap = $("pin-wrap");
  const signOut = $("sign-out");

  async function refresh() {
    const me = await api("/api/me");
    if (me.wrongPortal && me.redirect) {
      window.location.replace(me.redirect);
      return null;
    }
    if (signOut) signOut.classList.toggle("hidden", !me.signedIn);
    const confirm = $("confirm");
    if (me.signedIn) {
      show(gate, false);
      await onReady(me);
      return me;
    }
    if (confirm) show(confirm, false);
    show(app, false);
    show(gate, true);
    return me;
  }

  const pinForm = $("pin-form");
  if (pinForm) {
    pinForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      enterBtn.click();
    });
  }

  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    setMsg(msg, "");
    try {
      const body = { phone: phone.value };
      if (kind === "parents") body.name = name.value;
      await api("/api/auth/otp/send", { method: "POST", body });
      if (pinForm) show(pinForm, true);
      show(pinWrap, true);
      pin.focus();
    } catch (err) {
      setMsg(msg, err.message);
    } finally {
      sendBtn.disabled = false;
    }
  });

  enterBtn.addEventListener("click", async () => {
    enterBtn.disabled = true;
    setMsg(msg, "");
    try {
      const body = { phone: phone.value, code: pin.value };
      if (kind === "parents") body.name = name.value;
      await api("/api/auth/otp/verify", { method: "POST", body });
      pin.value = "";
      await refresh();
    } catch (err) {
      setMsg(msg, err.message);
    } finally {
      enterBtn.disabled = false;
    }
  });

  $("sign-out").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    await refresh();
  });

  const params = new URLSearchParams(window.location.search);
  const prefill = params.get("p") || params.get("phone");
  if (prefill && phone) phone.value = prefill;

  function onEnter(el, btn) {
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        btn.click();
      }
    });
  }
  onEnter(phone, sendBtn);
  if (name) onEnter(name, sendBtn);
  onEnter(pin, enterBtn);

  return refresh();
}

function loadImage(img, url) {
  return waitFor(new Promise((resolve) => {
    if (!img || !url) {
      resolve();
      return;
    }
    const done = () => {
      img.onload = null;
      img.onerror = null;
      resolve();
    };
    img.decoding = "async";
    img.onload = done;
    img.onerror = done;
    img.src = url;
  }));
}

window.PM = { api, $, show, setMsg, bindGate, waitBegin, waitEnd, waitFor, loadImage };
