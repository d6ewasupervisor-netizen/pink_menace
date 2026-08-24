"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { sessionDays } = require("./host");

const COOKIE = "pm_session";

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function cookieOptions() {
  const days = sessionDays();
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "0" ? false : process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

async function createSession(personId, userAgent) {
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("hex");
  const days = sessionDays();
  await query(
    `INSERT INTO sessions (id, person_id, token_hash, expires_at, user_agent)
     VALUES ($1, $2, $3, now() + make_interval(days => $4::int), $5)`,
    [id, personId, hashToken(token), days, String(userAgent || "").slice(0, 300)]
  );
  return token;
}

async function readSession(token) {
  if (!token || typeof token !== "string") return null;
  const { rows } = await query(
    `SELECT s.id, s.person_id, s.expires_at, p.role, p.name, p.phone
       FROM sessions s
       JOIN people p ON p.id = s.person_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)]
  );
  const row = rows[0];
  if (!row) return null;
  await query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [row.id]);
  return {
    sessionId: row.id,
    personId: row.person_id,
    role: row.role,
    name: row.name,
    phone: row.phone,
    expiresAt: row.expires_at,
  };
}

async function destroySession(token) {
  if (!token) return;
  await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE, token, cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: 0 });
}

function getToken(req) {
  return req.cookies && req.cookies[COOKIE];
}

async function requireRole(req, res, role) {
  const session = await readSession(getToken(req));
  if (!session) {
    res.status(401).json({ ok: false, error: "Sign in again." });
    return null;
  }
  if (role && session.role !== role) {
    res.status(403).json({ ok: false, error: "Wrong portal for this account." });
    return null;
  }
  return session;
}

module.exports = {
  COOKIE,
  createSession,
  readSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  getToken,
  requireRole,
  cookieOptions,
};
