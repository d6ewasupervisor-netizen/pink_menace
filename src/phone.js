"use strict";

const crypto = require("crypto");

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'-]{0,79}$/u;

function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (String(input || "").trim().startsWith("+") && digits.length >= 10) return "+" + digits;
  return null;
}

function normalizeName(input) {
  const name = String(input || "").trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) return null;
  if (!NAME_RE.test(name)) return null;
  return name;
}

function last4(e164) {
  const digits = String(e164 || "").replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "0");
}

function phonePepper() {
  const p = String(process.env.PHONE_PEPPER || "").trim();
  if (!p) {
    const err = new Error("PHONE_PEPPER is not set");
    err.status = 503;
    throw err;
  }
  return p;
}

function phoneHmac(e164) {
  return crypto.createHmac("sha256", phonePepper()).update(String(e164)).digest("hex");
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

module.exports = { normalizePhone, normalizeName, last4, phoneHmac, phonePepper, initials };
