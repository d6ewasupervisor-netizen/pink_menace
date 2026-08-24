"use strict";

const DEFAULT_URL = "https://sms-outbox-production.up.railway.app";

const BLOCK_RULE_CODES = {
  OPT_OUT: "SMS_OUTBOX_OPTED_OUT",
  OPT_IN_REQUIRED: "SMS_OUTBOX_OPT_IN_REQUIRED",
  DAILY_CAP: "SMS_OUTBOX_DAILY_CAP",
  CONTENT: "SMS_OUTBOX_CONTENT_BLOCKED",
  INVITE_ONCE: "SMS_OUTBOX_INVITE_ONCE",
  PER_RECIPIENT_FLOOD: "SMS_OUTBOX_RECIPIENT_FLOOD",
};

const JOIN_MESSAGE =
  "If you would like to use the text feature, text JOIN to (509) 572-9212 first from that mobile number (one-time opt-in). Until then, texts cannot be delivered. Reply STOP anytime to opt out.";

const STOP_MESSAGE =
  "This number replied STOP and is opted out of texts. Only they can undo it, by texting START to (509) 572-9212.";

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
    err.code = "SMS_OUTBOX_NOT_CONFIGURED";
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

function mapOutboxStatus(status, rule) {
  if (status === 400) return "SMS_OUTBOX_BAD_REQUEST";
  if (status === 401) return "SMS_OUTBOX_UNAUTHORIZED";
  if (status === 403) return BLOCK_RULE_CODES[rule] || "SMS_OUTBOX_BLOCKED";
  if (status === 429) return "SMS_OUTBOX_RATE_LIMITED";
  if (status === 502) return "SMS_OUTBOX_TWILIO_FAILED";
  if (status === 503) return "SMS_OUTBOX_UNAVAILABLE";
  return "SMS_OUTBOX_FAILED";
}

function outboxError(path, res, data) {
  const rule = (data && data.rule) || null;
  const err = new Error((data && data.error) || `${path} ${res.status}`);
  err.code = mapOutboxStatus(res.status, rule);
  err.status = res.status;
  err.rule = rule;
  err.outbox = data || {};
  return err;
}

async function sendOtp(to) {
  const { res, data } = await outboxFetch("/otp/send", { to });
  if (!res.ok) throw outboxError("otp/send", res, data);
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

async function sendSms(to, body) {
  const { res, data } = await outboxFetch("/sms/send", { to, body });
  if (!res.ok) throw outboxError("sms/send", res, data);
  return data;
}

function userFacingSmsError(err) {
  const code = err && err.code;
  if (code === "SMS_OUTBOX_OPT_IN_REQUIRED") return JOIN_MESSAGE;
  if (code === "SMS_OUTBOX_OPTED_OUT") return STOP_MESSAGE;
  if (code === "SMS_OUTBOX_RECIPIENT_FLOOD") {
    return "This number already received the maximum of 5 texts in the last 24 hours. Try again later.";
  }
  if (code === "SMS_OUTBOX_DAILY_CAP") {
    return "The daily text limit has been reached. Texts resume tomorrow.";
  }
  if (code === "SMS_OUTBOX_CONTENT_BLOCKED") {
    return "The text was blocked by the message content rules.";
  }
  if (code === "SMS_OUTBOX_RATE_LIMITED") {
    return "Too many texts were requested. Wait a bit and try again.";
  }
  if (code === "SMS_OUTBOX_NOT_CONFIGURED" || code === "SMS_OUTBOX_UNAVAILABLE") {
    return "Text messaging is temporarily unavailable.";
  }
  if (code === "SMS_OUTBOX_UNAUTHORIZED") return "Incorrect PIN.";
  return (err && err.message) || "Could not send text message.";
}

function otpUserError(result) {
  const status = result && result.status;
  const rule = result && result.rule;
  const data = result || {};
  if (status === 403) {
    return userFacingSmsError({
      code: mapOutboxStatus(403, rule),
      rule,
      message: data.error,
    });
  }
  if (status === 429) return data.error || "Too many attempts. Wait a bit and try again.";
  if (status === 401) return "Incorrect PIN.";
  if (status === 400) return data.error || "Invalid phone or PIN.";
  return data.error || "Could not complete SMS login.";
}

module.exports = {
  smsOutboxConfigured,
  sendOtp,
  verifyOtp,
  sendSms,
  userFacingSmsError,
  otpUserError,
  JOIN_MESSAGE,
  STOP_MESSAGE,
};
