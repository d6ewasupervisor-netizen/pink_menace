"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { appKind, gameUrl } = require("./host");
const { normalizePhone, normalizeName, phoneHmac, last4, initials } = require("./phone");
const auth = require("./auth");
const { jsonError } = require("./routes-auth");
const { purgeExpiredPending, skillBand } = require("./game");

function deviceLabel(ua) {
  const s = String(ua || "").slice(0, 180);
  if (!s) return "Device";
  return s;
}

async function coverageFor(studentId) {
  const { rows: logs } = await query(
    `SELECT practiced_on, location, day_night, weather, psdp_skill, dol_section, act, zone, hours, duration_ms, initials
       FROM coverage_log
      WHERE student_id = $1
      ORDER BY practiced_on ASC, created_at ASC`,
    [studentId]
  );
  const { rows: catalog } = await query(
    `SELECT act, zone, dol_section, psdp_skill, card_id FROM cards`
  );

  const acts = {};
  for (const c of catalog) {
    if (!acts[c.act]) acts[c.act] = {};
    if (!acts[c.act][c.zone]) acts[c.act][c.zone] = { total: 0, done: 0 };
    acts[c.act][c.zone].total += 1;
  }
  const { rows: doneCards } = await query(
    `SELECT DISTINCT act, zone, card_id FROM coverage_log WHERE student_id = $1 AND card_id IS NOT NULL`,
    [studentId]
  );
  const doneCardSet = new Set(doneCards.map((r) => r.card_id));
  for (const c of catalog) {
    if (doneCardSet.has(c.card_id) && acts[c.act] && acts[c.act][c.zone]) {
      acts[c.act][c.zone].done += 1;
    }
  }

  const actList = Object.keys(acts).sort().map((act) => ({
    act,
    zones: Object.keys(acts[act]).sort().map((zone) => ({
      zone,
      completed: acts[act][zone].done >= acts[act][zone].total && acts[act][zone].total > 0,
      practiced: acts[act][zone].done,
      total: acts[act][zone].total,
    })),
  }));

  const skillMap = new Map();
  for (const row of logs) {
    const name = row.psdp_skill || "n/a";
    if (!skillMap.has(name)) skillMap.set(name, { name, dates: new Set(), duration_ms: 0 });
    const s = skillMap.get(name);
    if (row.practiced_on) s.dates.add(String(row.practiced_on).slice(0, 10));
    s.duration_ms += Number(row.duration_ms) || 0;
  }
  const catalogSkills = new Set(catalog.map((c) => c.psdp_skill).filter(Boolean));
  for (const name of catalogSkills) {
    if (!skillMap.has(name)) skillMap.set(name, { name, dates: new Set(), duration_ms: 0 });
  }
  const skills = [...skillMap.values()].map((s) => {
    const dates = [...s.dates].sort();
    return {
      name: s.name,
      dates,
      minutes: Math.round(s.duration_ms / 60000),
      band: skillBand(dates.length),
    };
  });

  const covered = [...new Set(logs.map((r) => r.dol_section).filter(Boolean))];
  const allDol = [...new Set(catalog.map((c) => c.dol_section).filter(Boolean))];
  const remaining = allDol.filter((d) => !covered.includes(d));

  const { rows: firstTry } = await query(
    `SELECT COUNT(*) FILTER (WHERE was_correct)::int AS clean,
            COUNT(*)::int AS n
       FROM (
         SELECT DISTINCT ON (a.card_id) a.was_correct
           FROM run_answers a
           JOIN runs r ON r.id = a.run_id
          WHERE r.student_id = $1
          ORDER BY a.card_id, a.created_at ASC
       ) t`,
    [studentId]
  );
  const ft = firstTry[0] || { clean: 0, n: 0 };

  return {
    acts: actList,
    skills,
    dol: { covered, remaining },
    first_try: { clean: ft.clean || 0, total: ft.n || 0 },
  };
}

function mountParents(app) {
  app.get("/api/parents/students", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    try {
      await purgeExpiredPending();
      const { rows: pending } = await query(
        `SELECT id, student_name, phone_last4, created_at
           FROM pending_links
          WHERE parent_id = $1
          ORDER BY created_at DESC`,
        [session.userId]
      );
      const { rows: linked } = await query(
        `SELECT u.id, u.display_name, u.phone_e164, ps.confirmed_at
           FROM parent_students ps
           JOIN users u ON u.id = ps.student_id
          WHERE ps.parent_id = $1
          ORDER BY u.display_name ASC`,
        [session.userId]
      );
      const students = [];
      for (const st of linked) {
        const coverage = await coverageFor(st.id);
        const { rows: devices } = await query(
          `SELECT id, user_agent, created_at, last_seen_at, expires_at
             FROM sessions
            WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
            ORDER BY last_seen_at DESC`,
          [st.id]
        );
        students.push({
          id: st.id,
          name: st.display_name,
          last4: st.phone_e164 ? last4(st.phone_e164) : null,
          coverage,
          devices: devices.map((d) => ({
            id: d.id,
            label: deviceLabel(d.user_agent),
            lastSeen: d.last_seen_at,
            createdAt: d.created_at,
          })),
        });
      }
      const { rows: myDevices } = await query(
        `SELECT id, user_agent, created_at, last_seen_at
           FROM sessions
          WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
          ORDER BY last_seen_at DESC`,
        [session.userId]
      );
      return res.json({
        ok: true,
        gameUrl: gameUrl(),
        pending: pending.map((p) => ({
          id: p.id,
          name: p.student_name,
          last4: p.phone_last4,
          status: `Waiting for ${p.student_name} to sign in.`,
        })),
        students,
        devices: myDevices.map((d) => ({
          id: d.id,
          label: deviceLabel(d.user_agent),
          lastSeen: d.last_seen_at,
          createdAt: d.created_at,
          self: d.id === session.sessionId,
        })),
      });
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
      const hmac = phoneHmac(phone);
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO pending_links (id, parent_id, student_name, phone_hmac, phone_last4)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (parent_id, phone_hmac) DO UPDATE
           SET student_name = EXCLUDED.student_name,
               phone_last4 = EXCLUDED.phone_last4,
               updated_at = now()`,
        [id, session.userId, name, hmac, last4(phone)]
      );
      return res.json({
        ok: true,
        gameUrl: gameUrl(),
        pending: { name, last4: last4(phone) },
      });
    } catch (err) {
      return jsonError(res, 500, "Could not add student.");
    }
  });

  app.patch("/api/parents/pending/:id", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    const name = normalizeName(req.body && req.body.name);
    const phoneRaw = req.body && req.body.phone;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    if (!name) return jsonError(res, 400, "Enter the student's name.");
    if (phoneRaw && !phone) return jsonError(res, 400, "Enter a valid US phone number.");
    try {
      let rows;
      if (phone) {
        const hmac = phoneHmac(phone);
        const updated = await query(
          `UPDATE pending_links
              SET student_name = $1, phone_hmac = $2, phone_last4 = $3, updated_at = now()
            WHERE id = $4 AND parent_id = $5
            RETURNING id, student_name, phone_last4`,
          [name, hmac, last4(phone), req.params.id, session.userId]
        );
        rows = updated.rows;
      } else {
        const updated = await query(
          `UPDATE pending_links
              SET student_name = $1, updated_at = now()
            WHERE id = $2 AND parent_id = $3
            RETURNING id, student_name, phone_last4`,
          [name, req.params.id, session.userId]
        );
        rows = updated.rows;
      }
      if (!rows[0]) return jsonError(res, 404, "Not found.");
      return res.json({
        ok: true,
        pending: { id: rows[0].id, name: rows[0].student_name, last4: rows[0].phone_last4 },
      });
    } catch (err) {
      if (err && err.code === "23505") return jsonError(res, 409, "That number is already on your list.");
      return jsonError(res, 500, "Could not update.");
    }
  });

  app.delete("/api/parents/pending/:id", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    try {
      const { rowCount } = await query(
        `DELETE FROM pending_links WHERE id = $1 AND parent_id = $2`,
        [req.params.id, session.userId]
      );
      if (!rowCount) return jsonError(res, 404, "Not found.");
      return res.json({ ok: true });
    } catch (err) {
      return jsonError(res, 500, "Could not delete.");
    }
  });

  app.post("/api/parents/devices/:id/revoke", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    const id = req.params.id;
    try {
      const { rows } = await query(
        `SELECT s.id, s.user_id
           FROM sessions s
          WHERE s.id = $1 AND s.revoked_at IS NULL`,
        [id]
      );
      const row = rows[0];
      if (!row) return jsonError(res, 404, "Not found.");
      const allowed =
        row.user_id === session.userId ||
        (
          await query(
            `SELECT 1 FROM parent_students WHERE parent_id = $1 AND student_id = $2`,
            [session.userId, row.user_id]
          )
        ).rowCount > 0;
      if (!allowed) return jsonError(res, 404, "Not found.");
      await query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [id]);
      if (row.id === session.sessionId) {
        auth.clearSessionCookie(res);
      }
      return res.json({ ok: true });
    } catch (err) {
      return jsonError(res, 500, "Could not revoke.");
    }
  });

  app.get("/api/parents/students/:id/log", async (req, res) => {
    if (appKind(req) !== "parents") return jsonError(res, 404, "Not found.");
    const session = await auth.requireRole(req, res, "parent");
    if (!session) return;
    try {
      const linked = await query(
        `SELECT u.id, u.display_name
           FROM parent_students ps
           JOIN users u ON u.id = ps.student_id
          WHERE ps.parent_id = $1 AND ps.student_id = $2`,
        [session.userId, req.params.id]
      );
      const student = linked.rows[0];
      if (!student) return jsonError(res, 404, "Not found.");
      const { rows } = await query(
        `SELECT practiced_on, location, day_night, weather, psdp_skill, hours, initials
           FROM coverage_log
          WHERE student_id = $1
          ORDER BY practiced_on ASC, created_at ASC`,
        [student.id]
      );
      const parentIni = initials(session.name);
      res.setHeader("content-type", "text/html; charset=utf-8");
      const body = rows
        .map((r) => {
          const d = String(r.practiced_on).slice(0, 10);
          return `<tr>
            <td>${escapeHtml(d)}</td>
            <td>${escapeHtml(r.location || "")}</td>
            <td>${escapeHtml(r.day_night || "")}</td>
            <td>${escapeHtml(r.weather || "")}</td>
            <td>${escapeHtml(r.psdp_skill || "")}</td>
            <td>${escapeHtml(String(r.hours ?? ""))}</td>
            <td>${escapeHtml(r.initials || parentIni)}</td>
          </tr>`;
        })
        .join("");
      res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Supervised driving log · ${escapeHtml(student.display_name)}</title>
  <style>
    body { font: 14px/1.4 Georgia, serif; color: #111; margin: 24px; }
    h1 { font-size: 18px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    th { background: #eee; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Print</button>
  <h1>Washington PSDP supervised driving log</h1>
  <p>${escapeHtml(student.display_name)}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Location</th><th>Day/Night</th><th>Weather</th>
        <th>Skills</th><th>Hours</th><th>Initials</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`);
    } catch (err) {
      return jsonError(res, 500, "Could not build log.");
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { mountParents };
