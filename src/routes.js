"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { appKind, gameUrl, parentsUrl, sessionDays } = require("./host");
const { normalizePhone, normalizeName } = require("./phone");
const sms = require("./sms");
const auth = require("./auth");

function jsonError(res, status, error, extra) {
  return res.status(status).json({ ok: false, error, ...(extra || {}) });
}

async function upsertPending(phone, name, role) {
  await query(
    `INSERT INTO pending_logins (phone, name, intended_role, created_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, intended_role = EXCLUDED.intended_role, created_at = now()`,
    [phone, name || "", role]
  );
}

async function takePending(phone) {
  const { rows } = await query(`DELETE FROM pending_logins WHERE phone = $1 RETURNING name, intended_role`, [phone]);
  return rows[0] || null;
}

async function findPersonByPhone(phone) {
  const { rows } = await query(`SELECT id, role, name, phone FROM people WHERE phone = $1`, [phone]);
  return rows[0] || null;
}

async function createPerson(role, name, phone) {
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO people (id, role, name, phone) VALUES ($1, $2, $3, $4)
     RETURNING id, role, name, phone`,
    [id, role, name, phone]
  );
  return rows[0];
}

function inviteBody(parentName, studentName) {
  const parent = String(parentName || "A parent").slice(0, 40);
  const student = String(studentName || "you").slice(0, 40);
  const url = gameUrl();
  return `TACTAG: ${parent} added ${student} to PINK MENACE. Open ${url} and sign in with this phone. You'll get a PIN by text. Reply STOP to opt out.`;
}

function mountRoutes(app) {
  app.get("/api/config", (req, res) => {
    const kind = appKind(req);
    res.json({
      ok: true,
      kind,
      gameUrl: gameUrl(),
      parentsUrl: parentsUrl(),
      sessionDays: sessionDays(),
    });
  });

  app.get("/api/me", async (req, res) => {
    try {
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
          role: session.role,
          redirect: session.role === "parent" ? parentsUrl() : gameUrl(),
        });
      }
      return res.json({
        ok: true,
        signedIn: true,
        kind,
        person: {
          id: session.personId,
          role: session.role,
          name: session.name,
          phone: session.phone,
        },
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      return jsonError(res, 500, "Could not read session.");
    }
  });

  app.post("/api/auth/otp/send", async (req, res) => {
    try {
      const kind = appKind(req);
      const phone = normalizePhone(req.body && req.body.phone);
      if (!phone) return jsonError(res, 400, "Enter a valid US phone number.");

      if (kind === "parents") {
        const name = normalizeName(req.body && req.body.name);
        if (!name) return jsonError(res, 400, "Enter your name.");
        const existing = await findPersonByPhone(phone);
        if (existing && existing.role !== "parent") {
          return jsonError(res, 403, "This number is registered as a student. Use the game login.");
        }
        await upsertPending(phone, name, "parent");
      } else {
        const existing = await findPersonByPhone(phone);
        if (!existing) {
          return jsonError(res, 403, "Ask a parent to add this number first.");
        }
        if (existing.role !== "student") {
          return jsonError(res, 403, "This number is a parent account. Use the parents page.");
        }
        await upsertPending(phone, existing.name, "student");
      }

      const data = await sms.sendOtp(phone);
      return res.json({ ok: true, phone, expires_in_min: data.expires_in_min || 10 });
    } catch (err) {
      return jsonError(res, err.status || 502, sms.userFacingSmsError(err), { rule: err.rule || null });
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
        return jsonError(res, result.status === 200 ? 401 : result.status || 401, sms.otpUserError(result), {
          rule: result.rule || null,
        });
      }

      const pending = await takePending(phone);
      let person = await findPersonByPhone(phone);
      const expectedRole = kind === "parents" ? "parent" : "student";

      if (!person) {
        if (expectedRole === "student") {
          return jsonError(res, 403, "Ask a parent to add this number first.");
        }
        const name = normalizeName((req.body && req.body.name) || (pending && pending.name));
        if (!name) return jsonError(res, 400, "Enter your name.");
        person = await createPerson("parent", name, phone);
      } else if (person.role !== expectedRole) {
        return jsonError(res, 403, "Wrong portal for this account.");
      } else if (expectedRole === "parent") {
        const name = normalizeName((req.body && req.body.name) || (pending && pending.name));
        if (name && name !== person.name) {
          await query(`UPDATE people SET name = $1, updated_at = now() WHERE id = $2`, [name, person.id]);
          person.name = name;
        }
      }

      const token = await auth.createSession(person.id, req.get("user-agent"));
      auth.setSessionCookie(res, token);
      return res.json({
        ok: true,
        person: { id: person.id, role: person.role, name: person.name, phone: person.phone },
        sessionDays: sessionDays(),
      });
    } catch (err) {
      return jsonError(res, err.status || 502, sms.userFacingSmsError(err), { rule: err.rule || null });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await auth.destroySession(auth.getToken(req));
      auth.clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (err) {
      auth.clearSessionCookie(res);
      return res.json({ ok: true });
    }
  });

  app.get("/api/parents/students", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    try {
      const { rows } = await query(
        `SELECT st.id, st.name, st.phone,
                ps.invited_at, ps.invite_sms_status, ps.invite_sms_rule,
                sp.act, sp.current_card_id, sp.cards_completed, sp.hours_logged, sp.updated_at AS progress_at,
                (SELECT MAX(last_seen_at) FROM sessions WHERE person_id = st.id) AS last_seen_at
           FROM parent_students ps
           JOIN people st ON st.id = ps.student_id
           LEFT JOIN student_progress sp ON sp.student_id = st.id
          WHERE ps.parent_id = $1
          ORDER BY st.name ASC`,
        [session.personId]
      );
      return res.json({ ok: true, students: rows, gameUrl: gameUrl() });
    } catch (err) {
      return jsonError(res, 500, "Could not load students.");
    }
  });

  app.post("/api/parents/students", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    const name = normalizeName(req.body && req.body.name);
    const phone = normalizePhone(req.body && req.body.phone);
    if (!name) return jsonError(res, 400, "Enter the student's name.");
    if (!phone) return jsonError(res, 400, "Enter a valid US phone number.");
    if (phone === session.phone) return jsonError(res, 400, "Use the student's phone number.");

    try {
      let student = await findPersonByPhone(phone);
      if (student && student.role !== "student") {
        return jsonError(res, 409, "That number already belongs to a parent account.");
      }
      if (!student) {
        student = await createPerson("student", name, phone);
        await query(
          `INSERT INTO student_progress (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING`,
          [student.id]
        );
      }

      const existing = await query(
        `SELECT 1 FROM parent_students WHERE parent_id = $1 AND student_id = $2`,
        [session.personId, student.id]
      );
      const alreadyLinked = existing.rowCount > 0;
      if (!alreadyLinked) {
        await query(
          `INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`,
          [session.personId, student.id]
        );
      }

      let smsStatus = "skipped";
      let smsRule = null;
      let smsError = null;
      if (!alreadyLinked) {
        try {
          await sms.sendSms(phone, inviteBody(session.name, student.name));
          smsStatus = "sent";
        } catch (err) {
          smsStatus = "blocked";
          smsRule = err.rule || null;
          smsError = sms.userFacingSmsError(err);
        }
        await query(
          `UPDATE parent_students SET invite_sms_status = $1, invite_sms_rule = $2 WHERE parent_id = $3 AND student_id = $4`,
          [smsStatus, smsRule, session.personId, student.id]
        );
      }

      return res.json({
        ok: true,
        alreadyLinked,
        student: { id: student.id, name: student.name, phone: student.phone },
        gameUrl: gameUrl(),
        sms: { status: smsStatus, rule: smsRule, error: smsError },
      });
    } catch (err) {
      return jsonError(res, 500, "Could not add student.");
    }
  });

  app.get("/api/game/progress", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    try {
      const { rows } = await query(
        `SELECT act, current_card_id, cards_completed, hours_logged, payload, updated_at
           FROM student_progress WHERE student_id = $1`,
        [session.personId]
      );
      const progress = rows[0] || {
        act: null,
        current_card_id: null,
        cards_completed: 0,
        hours_logged: 0,
        payload: {},
        updated_at: null,
      };
      return res.json({ ok: true, progress });
    } catch (err) {
      return jsonError(res, 500, "Could not load progress.");
    }
  });

  app.put("/api/game/progress", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const body = req.body || {};
    const act = body.act == null ? null : String(body.act).slice(0, 40);
    const currentCardId = body.current_card_id == null ? null : String(body.current_card_id).slice(0, 40);
    const cardsCompleted = Number.isFinite(Number(body.cards_completed))
      ? Math.max(0, Math.min(100000, Math.floor(Number(body.cards_completed))))
      : 0;
    const hoursLogged = Number.isFinite(Number(body.hours_logged))
      ? Math.max(0, Math.min(9999, Number(body.hours_logged)))
      : 0;
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    try {
      const { rows } = await query(
        `INSERT INTO student_progress (student_id, act, current_card_id, cards_completed, hours_logged, payload, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
         ON CONFLICT (student_id) DO UPDATE SET
           act = EXCLUDED.act,
           current_card_id = EXCLUDED.current_card_id,
           cards_completed = EXCLUDED.cards_completed,
           hours_logged = EXCLUDED.hours_logged,
           payload = EXCLUDED.payload,
           updated_at = now()
         RETURNING act, current_card_id, cards_completed, hours_logged, payload, updated_at`,
        [session.personId, act, currentCardId, cardsCompleted, hoursLogged, JSON.stringify(payload)]
      );
      return res.json({ ok: true, progress: rows[0] });
    } catch (err) {
      return jsonError(res, 500, "Could not save progress.");
    }
  });

  app.post("/api/game/events", async (req, res) => {
    if (appKind(req) !== "game") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "student");
    if (!session) return;
    const body = req.body || {};
    const cardId = String(body.card_id || "").trim().slice(0, 40);
    if (!cardId) return jsonError(res, 400, "Missing card.");
    const choice = body.choice == null ? null : String(body.choice).slice(0, 80);
    const correct = typeof body.correct === "boolean" ? body.correct : null;
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    try {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO card_events (id, student_id, card_id, choice, correct, payload)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [id, session.personId, cardId, choice, correct, JSON.stringify(payload)]
      );
      return res.json({ ok: true, id });
    } catch (err) {
      return jsonError(res, 500, "Could not save choice.");
    }
  });
}

module.exports = { mountRoutes };
