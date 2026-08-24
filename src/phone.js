"use strict";

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

module.exports = { normalizePhone, normalizeName };
