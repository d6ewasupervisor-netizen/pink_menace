"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { sessionDays } = require("./host");

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "0") return false;
  return process.env.NODE_ENV !== "development";
}

function cookieName() {
  return cookieSecure() ? "__Host-pm_session" : "pm_session";
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function cookieOptions() {
  const days = sessionDays();
  const opts = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
    path: "/",
  };
  return opts;
}

async function createSession(userId, userAgent) {
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("hex");
  const days = sessionDays();
  await query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent)
     VALUES ($1, $2, $3, now() + make_interval(days => $4::int), $5)`,
    [id, userId, hashToken(token), days, String(userAgent || "").slice(0, 300)]
  );
  return token;
}

async function readSession(token) {
  if (!token || typeof token !== "string") return null;
  const { rows } = await query(
    `SELECT s.id, s.user_id, s.expires_at, s.user_agent, u.role, u.display_name, u.phone_e164
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
        AND s.revoked_at IS NULL`,
    [hashToken(token)]
  );
  const row = rows[0];
  if (!row) return null;
  await query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [row.id]);
  return {
    sessionId: row.id,
    userId: row.user_id,
    role: row.role,
    name: row.display_name,
    phone: row.phone_e164,
    expiresAt: row.expires_at,
    userAgent: row.user_agent,
  };
}

async function destroySession(token) {
  if (!token) return;
  await query(`UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [
    hashToken(token),
  ]);
}

async function revokeSession(sessionId, userId) {
  await query(
    `UPDATE sessions SET revoked_at = now()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
}

function setSessionCookie(res, token) {
  res.cookie(cookieName(), token, cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(cookieName(), { ...cookieOptions(), maxAge: 0 });
  res.clearCookie("pm_session", { ...cookieOptions(), maxAge: 0 });
}

function getToken(req) {
  const cookies = req.cookies || {};
  return cookies["__Host-pm_session"] || cookies.pm_session || null;
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
  cookieName,
  createSession,
  readSession,
  destroySession,
  revokeSession,
  setSessionCookie,
  clearSessionCookie,
  getToken,
  requireRole,
  cookieOptions,
};
