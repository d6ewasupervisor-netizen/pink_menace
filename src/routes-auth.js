"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { appKind, gameUrl, parentsUrl, sessionDays, autofillHost } = require("./host");
const { normalizePhone, normalizeName, phoneHmac, last4 } = require("./phone");
const sms = require("./sms");
const auth = require("./auth");
const otpGuard = require("./otp-guard");
const { purgeExpiredPending, pendingForPhone } = require("./game");

function jsonError(res, status, error, extra) {
  return res.status(status).json({ ok: false, error, ...(extra || {}) });
}

async function findUserByPhone(phone) {
  const { rows } = await query(
    `SELECT id, role, display_name, phone_e164 FROM users WHERE phone_e164 = $1`,
    [phone]
  );
  return rows[0] || null;
}

async function createUser(role, displayName, phone) {
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO users (id, role, display_name, phone_e164)
     VALUES ($1, $2, $3, $4)
     RETURNING id, role, display_name, phone_e164`,
    [id, role, displayName, phone]
  );
  return rows[0];
}

async function pendingGuardians(userId, phone) {
  if (!phone) return [];
  let hmac;
  try {
    hmac = phoneHmac(phone);
  } catch {
    return [];
  }
  const rows = await pendingForPhone(hmac);
  const { rows: linked } = await query(
    `SELECT parent_id FROM parent_students WHERE student_id = $1`,
    [userId]
  );
  const linkedIds = new Set(linked.map((r) => r.parent_id));
  return rows
    .filter((r) => !linkedIds.has(r.parent_id))
    .map((r) => ({ id: r.id, parentName: r.parent_name }));
}

function mountAuth(app) {
  app.get("/api/config", (req, res) => {
    res.json({
      ok: true,
      kind: appKind(req),
      driveEnabled: /^(1|true|yes)$/i.test(String(process.env.DRIVE_ENABLED || "").trim()),
      gameUrl: gameUrl(),
      parentsUrl: parentsUrl(),
      sessionDays: sessionDays(),
    });
  });

  app.get("/api/me", async (req, res) => {
    try {
      await purgeExpiredPending();
      const kind = appKind(req);
      const session = await auth.readSession(auth.getToken(req));
      if (!session) return res.json({ ok: true, signedIn: false, kind });
      const expected = kind === "parents" ? "parent" : "student";
      if (session.role !== expected) {
        return res.json({
          ok: true,
          signedIn: false,
          kind,
          wrongPortal: true,
          redirect: session.role === "parent" ? parentsUrl() : gameUrl(),
        });
      }
      const pending =
        session.role === "student" ? await pendingGuardians(session.userId, session.phone) : [];
      return res.json({
        ok: true,
        signedIn: true,
        kind,
        person: {
          id: session.userId,
          role: session.role,
          name: session.name,
          last4: session.phone ? last4(session.phone) : null,
        },
        expiresAt: session.expiresAt,
        pendingGuardians: pending,
      });
    } catch (err) {
      return jsonError(res, 500, "Could not read session.");
    }
  });

  app.post("/api/auth/otp/send", async (req, res) => {
    const started = Date.now();
    try {
      const kind = appKind(req);
      const phone = normalizePhone(req.body && req.body.phone);
      if (!phone) {
        await otpGuard.padTo(started);
        return jsonError(res, 400, "Enter a valid US phone number.");
      }
      if (kind === "parents") {
        const name = normalizeName(req.body && req.body.name);
        if (!name) {
          await otpGuard.padTo(started);
          return jsonError(res, 400, "Enter your name.");
        }
      }

      const ip = otpGuard.clientIp(req);
      const allowIp = await otpGuard.ipAllowed(ip);
      const allowPhone = otpGuard.phoneAllowed(phone);
      if (allowIp && allowPhone) {
        try {
          await sms.sendOtp(phone, autofillHost(req));
        } catch {
          // Swallow send failures so this endpoint cannot oracle enrollment or opt-out.
        }
      }
      await otpGuard.padTo(started);
      return res.json(otpGuard.OTP_OK);
    } catch (err) {
      await otpGuard.padTo(started);
      return res.json(otpGuard.OTP_OK);
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const kind = appKind(req);
      const phone = normalizePhone(req.body && req.body.phone);
      const code = String((req.body && req.body.code) || "").trim();
      if (!phone) return jsonError(res, 400, "Enter a valid US phone number.");
      if (!/^\d{6}$/.test(code)) return jsonError(res, 400, "Enter the 6-digit PIN.");

      const result = await sms.verifyOtp(phone, code);
      if (!result.ok) {
        return jsonError(res, 401, "Incorrect PIN.");
      }

      const expectedRole = kind === "parents" ? "parent" : "student";
      let user = await findUserByPhone(phone);

      if (user && user.role !== expectedRole) {
        return jsonError(res, 403, "Wrong portal for this account.");
      }

      if (!user) {
        let displayName;
        if (expectedRole === "parent") {
          displayName = normalizeName(req.body && req.body.name);
          if (!displayName) return jsonError(res, 400, "Enter your name.");
        } else {
          let hmac;
          try {
            hmac = phoneHmac(phone);
          } catch (err) {
            return jsonError(res, err.status || 503, "Could not complete sign-in.");
          }
          const pending = await pendingForPhone(hmac);
          displayName = (pending[0] && pending[0].student_name) || "Student";
        }
        user = await createUser(expectedRole, displayName, phone);
      } else if (expectedRole === "parent") {
        const name = normalizeName(req.body && req.body.name);
        if (name && name !== user.display_name) {
          await query(`UPDATE users SET display_name = $1, updated_at = now() WHERE id = $2`, [
            name,
            user.id,
          ]);
          user.display_name = name;
        }
      }

      const token = await auth.createSession(user.id, req.get("user-agent"));
      auth.setSessionCookie(res, token);
      const pending =
        expectedRole === "student" ? await pendingGuardians(user.id, phone) : [];
      return res.json({
        ok: true,
        person: {
          id: user.id,
          role: user.role || expectedRole,
          name: user.display_name,
          last4: last4(phone),
        },
        sessionDays: sessionDays(),
        pendingGuardians: pending,
      });
    } catch (err) {
      return jsonError(res, 500, "Could not complete sign-in.");
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await auth.destroySession(auth.getToken(req));
    } catch {
      // still clear cookie
    }
    auth.clearSessionCookie(res);
    return res.json({ ok: true });
  });

  app.post("/api/links/confirm", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const pendingId = String((req.body && req.body.pending_id) || "");
    const accept = Boolean(req.body && req.body.accept);
    if (!pendingId) return jsonError(res, 400, "Missing link.");
    try {
      const hmac = phoneHmac(session.phone);
      const { rows } = await query(
        `SELECT id, parent_id, student_name
           FROM pending_links
          WHERE id = $1 AND phone_hmac = $2`,
        [pendingId, hmac]
      );
      const row = rows[0];
      if (!row) return jsonError(res, 404, "Link not found.");
      if (accept) {
        await query(
          `INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [row.parent_id, session.userId]
        );
        await query(`DELETE FROM pending_links WHERE id = $1`, [row.id]);
        if (session.name === "Student" && row.student_name) {
          await query(`UPDATE users SET display_name = $1, updated_at = now() WHERE id = $2`, [
            row.student_name,
            session.userId,
          ]);
        }
      }
      const remaining = await pendingGuardians(session.userId, session.phone);
      return res.json({ ok: true, accepted: accept, pendingGuardians: remaining });
    } catch (err) {
      return jsonError(res, 500, "Could not update link.");
    }
  });
}

module.exports = { mountAuth, findUserByPhone, jsonError };
