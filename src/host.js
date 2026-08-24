"use strict";

function hostname(req) {
  const raw = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return raw.split(":")[0];
}

function appKind(req) {
  const host = hostname(req);
  if (host === "parents.tactag.app" || host.startsWith("parents.")) return "parents";
  if (host === "ali.tactag.app" || host.startsWith("ali.")) return "game";
  if (String(process.env.APP_KIND || "").trim().toLowerCase() === "parents") return "parents";
  return "game";
}

function gameUrl() {
  return String(process.env.GAME_URL || "https://ali.tactag.app").replace(/\/+$/, "");
}

function parentsUrl() {
  return String(process.env.PARENTS_URL || "https://parents.tactag.app").replace(/\/+$/, "");
}

function sessionDays() {
  const n = Number(process.env.SESSION_DAYS || 45);
  return Number.isFinite(n) && n > 0 ? n : 45;
}

function autofillHost(req) {
  return appKind(req) === "parents" ? "parents.tactag.app" : "ali.tactag.app";
}

module.exports = { hostname, appKind, gameUrl, parentsUrl, sessionDays, autofillHost };
