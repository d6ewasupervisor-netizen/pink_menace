"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const PARENT = process.env.PARENT_PHONE || "+15095727660";
const STUDENT = process.env.STUDENT_PHONE || "+15099199471";
const GHOST = process.env.GHOST_PHONE || "+12025550100";
const SMS_PG = process.env.SMS_PG;
const PARENT_NAME = "Tyson";
const STUDENT_NAME = "Reed";

const report = [];
function log(k, v) {
  report.push({ k, v });
  const shown = typeof v === "object" ? JSON.stringify(v) : String(v);
  console.log(k + ": " + shown);
}

function extractCode(body) {
  const m = String(body || "").match(/login code is (\d{6})/i);
  return m ? m[1] : null;
}

async function latestCode(phone) {
  const client = new Client({
    connectionString: SMS_PG,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    for (let i = 0; i < 8; i++) {
      const { rows } = await client.query(
        `SELECT body, created_at FROM messages
          WHERE to_phone = $1 AND kind = 'otp'
          ORDER BY created_at DESC LIMIT 1`,
        [phone]
      );
      if (rows[0] && Date.now() - new Date(rows[0].created_at).getTime() < 90_000) {
        const code = extractCode(rows[0].body);
        if (code) return code;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error("no otp body for " + phone.slice(-4));
  } finally {
    await client.end();
  }
}

async function call(url, { method, body, jar, headers } = {}) {
  const started = Date.now();
  const res = await fetch(url, {
    method: method || "GET",
    headers: {
      "content-type": "application/json",
      cookie: jarToHeader(jar),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const ms = Date.now() - started;
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  applySetCookie(jar, setCookie);
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, ms, json, headers: Object.fromEntries(res.headers) };
}

function jarToHeader(jar) {
  if (!jar) return "";
  return Object.entries(jar)
    .map(([k, v]) => k + "=" + v)
    .join("; ");
}

function applySetCookie(jar, list) {
  if (!jar || !list) return;
  for (const raw of list) {
    const part = String(raw).split(";")[0];
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    jar[part.slice(0, eq)] = part.slice(eq + 1);
  }
}

async function main() {
  if (!SMS_PG) throw new Error("SMS_PG required");
  const parentJar = {};
  const studentJar = {};

  const sendP = await call("https://parents.tactag.app/api/auth/otp/send", {
    method: "POST",
    jar: parentJar,
    body: { phone: PARENT, name: PARENT_NAME },
  });
  log("1_parent_send", { status: sendP.status, body: sendP.json, ms: sendP.ms });
  const pCode = await latestCode(PARENT);
  log("1_parent_pin_len", pCode ? pCode.length : 0);
  const verP = await call("https://parents.tactag.app/api/auth/otp/verify", {
    method: "POST",
    jar: parentJar,
    body: { phone: PARENT, name: PARENT_NAME, code: pCode },
  });
  log("1_parent_verify", {
    status: verP.status,
    signed: Boolean(verP.json.person),
    role: verP.json.person && verP.json.person.role,
    cookie: Object.keys(parentJar),
  });

  const add = await call("https://parents.tactag.app/api/parents/students", {
    method: "POST",
    jar: parentJar,
    body: { name: STUDENT_NAME, phone: STUDENT },
  });
  log("1_add_student", { status: add.status, pending: add.json.pending });

  const dash1 = await call("https://parents.tactag.app/api/parents/students", { jar: parentJar });
  const pending = (dash1.json.pending || dash1.json.students && dash1.json) || dash1.json;
  log("1_dashboard_pending", {
    status: dash1.status,
    pending: dash1.json.pending,
    last4_ok: (dash1.json.pending || []).some((p) => p.last4 === "9471" || p.phone_last4 === "9471"),
  });

  const sendS = await call("https://ali.tactag.app/api/auth/otp/send", {
    method: "POST",
    jar: studentJar,
    body: { phone: STUDENT },
  });
  log("2_student_send", { status: sendS.status, body: sendS.json, ms: sendS.ms });
  const sCode = await latestCode(STUDENT);
  const verS = await call("https://ali.tactag.app/api/auth/otp/verify", {
    method: "POST",
    jar: studentJar,
    body: { phone: STUDENT, code: sCode },
  });
  const guardians = verS.json.pendingGuardians || [];
  log("2_student_verify", {
    status: verS.status,
    pendingGuardians: guardians.map((g) => ({ id: Boolean(g.id), parentName: g.parentName })),
    prompt: guardians.some((g) => /tyson/i.test(g.parentName || "")),
  });

  if (guardians[0]) {
    const conf = await call("https://ali.tactag.app/api/links/confirm", {
      method: "POST",
      jar: studentJar,
      body: { pending_id: guardians[0].id, accept: true },
    });
    log("2_confirm_yes", { status: conf.status, accepted: conf.json.accepted });
  }

  const dash2 = await call("https://parents.tactag.app/api/parents/students", { jar: parentJar });
  log("3_linked", {
    status: dash2.status,
    students: (dash2.json.students || []).map((s) => ({ name: s.name, last4: s.last4, devices: (s.devices || []).length })),
  });

  const cur = await call("https://ali.tactag.app/api/run/current", { jar: studentJar });
  const curStr = JSON.stringify(cur.json);
  log("3_get_current", {
    status: cur.status,
    card_id: cur.json.card_id,
    option_keys: ((cur.json.options || [])[0] && Object.keys(cur.json.options[0])) || [],
    has_is_correct: /is_correct/.test(curStr),
    top_keys: Object.keys(cur.json),
  });

  const firstOpt = (cur.json.options || [])[0];
  const wrong = (cur.json.options || []).find((o) => o.option_id !== "b") || firstOpt;
  const ans = await call("https://ali.tactag.app/api/run/answer", {
    method: "POST",
    jar: studentJar,
    body: { card_id: cur.json.card_id, option_id: wrong && wrong.option_id, ms_to_answer: 2500 },
  });
  const ansStr = JSON.stringify(ans.json);
  log("3_wrong_answer", {
    status: ans.status,
    has_result: Boolean(ans.json.result),
    has_debrief: Boolean(ans.json.debrief),
    was_correct: ans.json.was_correct,
    next_id: ans.json.next && ans.json.next.card_id,
    next_done: ans.json.next && ans.json.next.done,
    has_is_correct: /is_correct/.test(ansStr),
  });

  const ghostA = await call("https://parents.tactag.app/api/auth/otp/send", {
    method: "POST",
    body: { phone: GHOST, name: PARENT_NAME },
  });
  log("4_oracle_body", {
    ghost: ghostA.json,
    parent_first: sendP.json,
    body_match: JSON.stringify(ghostA.json) === JSON.stringify(sendP.json),
    ghost_ms: ghostA.ms,
    parent_ms: sendP.ms,
    status_match: ghostA.status === sendP.status,
  });

  const lockSend = await call("https://ali.tactag.app/api/auth/otp/send", {
    method: "POST",
    body: { phone: STUDENT },
  });
  log("4_lock_send", { status: lockSend.status, body: lockSend.json });
  let lockCode = null;
  try {
    lockCode = await latestCode(STUDENT);
  } catch (e) {
    log("4_lock_code", e.message);
  }
  const wrongs = [];
  for (let i = 0; i < 5; i++) {
    const w = await call("https://ali.tactag.app/api/auth/otp/verify", {
      method: "POST",
      body: { phone: STUDENT, code: `11111${i}` },
    });
    wrongs.push({ i: i + 1, status: w.status, error: w.json.error });
  }
  let sixth = null;
  if (lockCode) {
    sixth = await call("https://ali.tactag.app/api/auth/otp/verify", {
      method: "POST",
      body: { phone: STUDENT, code: lockCode },
    });
  }
  log("4_wrong_pins", { wrongs, sixth: sixth && { status: sixth.status, error: sixth.json.error, ok: sixth.json.ok } });

  const throttlePhone = "+12025550101";
  const sends = [];
  for (let i = 0; i < 4; i++) {
    const s = await call("https://ali.tactag.app/api/auth/otp/send", {
      method: "POST",
      body: { phone: throttlePhone },
    });
    sends.push({ i: i + 1, status: s.status, body: s.json, ms: s.ms });
  }
  log("4_throttle_four_sends", sends);

  const me1 = await call("https://parents.tactag.app/api/me", { jar: parentJar });
  const freshJar = { ...parentJar };
  const me2 = await call("https://parents.tactag.app/api/me", { jar: freshJar });
  log("5_cookie_persist", {
    cookie_name: Object.keys(parentJar)[0],
    signed1: me1.json.signedIn,
    signed2: me2.json.signedIn,
  });

  const dash3 = await call("https://parents.tactag.app/api/parents/students", { jar: parentJar });
  const device = ((dash3.json.students || [])[0] && (dash3.json.students || [])[0].devices || [])[0];
  log("7_device_before", device && { id: Boolean(device.id), ua: device.user_agent });
  if (device) {
    const rev = await call("https://parents.tactag.app/api/parents/devices/" + device.id + "/revoke", {
      method: "POST",
      jar: parentJar,
      body: {},
    });
    log("7_revoke", { status: rev.status, ok: rev.json.ok });
    const meS = await call("https://ali.tactag.app/api/me", { jar: studentJar });
    log("7_student_after_revoke", { status: meS.status, signedIn: meS.json.signedIn });
  }

  fs.writeFileSync(path.join(__dirname, "live-gate-report.json"), JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("FAIL", err.message);
  process.exit(1);
});
