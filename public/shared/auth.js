"use strict";

async function api(path, options) {
  const opts = options || {};
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
    if (me.signedIn) {
      show(gate, false);
      show(app, true);
      await onReady(me);
      return me;
    }
    show(app, false);
    show(gate, true);
    return me;
  }

  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    setMsg(msg, "");
    try {
      const body = { phone: phone.value };
      if (kind === "parents") body.name = name.value;
      await api("/api/auth/otp/send", { method: "POST", body });
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

window.PM = { api, $, show, setMsg, bindGate };
