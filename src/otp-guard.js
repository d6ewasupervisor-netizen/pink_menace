"use strict";

const { query } = require("./db");

const PAD_MS = 400;
// Debt: pad waits on Twilio. Enqueue the send and return OTP_OK immediately.
const SENDS_PER_PHONE_MS = 15 * 60 * 1000;
const SENDS_PER_PHONE = 3;
const SENDS_PER_IP = 10;
const SENDS_PER_IP_MS = 60 * 60 * 1000;

const phoneHits = new Map();

function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return xf || req.ip || "0.0.0.0";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function padTo(started) {
  const left = PAD_MS - (Date.now() - started);
  if (left > 0) await sleep(left);
}

function phoneAllowed(phone) {
  const now = Date.now();
  const hits = (phoneHits.get(phone) || []).filter((t) => now - t < SENDS_PER_PHONE_MS);
  if (hits.length >= SENDS_PER_PHONE) return false;
  hits.push(now);
  phoneHits.set(phone, hits);
  return true;
}

async function ipAllowed(ip) {
  await query(`DELETE FROM otp_ip_hits WHERE hit_at < now() - interval '2 hours'`);
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM otp_ip_hits WHERE ip = $1 AND hit_at > now() - interval '1 hour'`,
    [ip]
  );
  if (rows[0].n >= SENDS_PER_IP) return false;
  await query(`INSERT INTO otp_ip_hits (ip) VALUES ($1)`, [ip]);
  return true;
}

const OTP_OK = { ok: true, expires_in_min: 10 };

module.exports = { clientIp, padTo, phoneAllowed, ipAllowed, OTP_OK };
