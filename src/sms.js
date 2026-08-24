"use strict";

const DEFAULT_URL = "https://sms-outbox-production.up.railway.app";

function smsOutboxConfigured() {
  return Boolean(String(process.env.SMS_OUTBOX_KEY || "").trim());
}

function baseUrl() {
  return String(process.env.SMS_OUTBOX_URL || DEFAULT_URL).replace(/\/+$/, "");
}

function apiKey() {
  return String(process.env.SMS_OUTBOX_KEY || "").trim();
}

async function outboxFetch(path, body) {
  if (!smsOutboxConfigured()) {
    const err = new Error("SMS outbox is not configured (missing SMS_OUTBOX_KEY).");
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function sendOtp(to, autofillHost) {
  const payload = { to };
  if (autofillHost) payload.autofill_host = autofillHost;
  const { res, data } = await outboxFetch("/otp/send", payload);
  if (!res.ok) {
    const err = new Error((data && data.error) || `otp/send ${res.status}`);
    err.status = res.status;
    err.rule = data.rule || null;
    throw err;
  }
  return data;
}

async function verifyOtp(to, code) {
  const { res, data } = await outboxFetch("/otp/verify", {
    to,
    code: String(code || "").trim(),
  });
  return {
    ok: res.ok && data.ok === true,
    status: res.status,
    ...data,
  };
}

module.exports = { smsOutboxConfigured, sendOtp, verifyOtp };
