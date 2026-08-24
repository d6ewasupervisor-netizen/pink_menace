"use strict";

async function revokeDevice(id) {
  try {
    await PM.api("/api/parents/devices/" + id + "/revoke", { method: "POST", body: {} });
    await load();
  } catch {
    window.location.reload();
  }
}

function fmtWhen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderPending(items, gameUrl) {
  const root = document.getElementById("pending");
  root.replaceChildren();
  for (const p of items || []) {
    const card = el("article", "card");
    card.append(el("h2", null, p.name));
    card.append(el("p", "meta", "••• " + p.last4));
    card.append(el("p", "waiting", p.status));
    const name = el("input");
    name.value = p.name;
    name.maxLength = 80;
    const phone = el("input");
    phone.type = "tel";
    phone.placeholder = "••••" + p.last4;
    const save = el("button", null, "Save");
    const del = el("button", "danger", "Delete");
    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        const body = { name: name.value };
        if (phone.value.trim()) body.phone = phone.value;
        await PM.api("/api/parents/pending/" + p.id, { method: "PATCH", body });
        await load();
      } catch (err) {
        PM.setMsg(document.getElementById("add-msg"), err.message);
      } finally {
        save.disabled = false;
      }
    });
    del.addEventListener("click", async () => {
      del.disabled = true;
      try {
        await PM.api("/api/parents/pending/" + p.id, { method: "DELETE", body: {} });
        await load();
      } catch (err) {
        PM.setMsg(document.getElementById("add-msg"), err.message);
        del.disabled = false;
      }
    });
    const actions = el("div", "card-actions");
    actions.append(save, del);
    card.append(name, phone, actions);
    root.appendChild(card);
  }
}

function renderStudents(items) {
  const root = document.getElementById("students");
  root.replaceChildren();
  for (const st of items || []) {
    const card = el("article", "card");
    card.append(el("h2", null, st.name));
    if (st.last4) card.append(el("p", "meta", "••• " + st.last4));
    const cov = st.coverage || {};
    for (const act of cov.acts || []) {
      const zones = (act.zones || [])
        .map((z) => z.zone + (z.completed ? " done" : ""))
        .join(" · ");
      card.append(el("p", "meta", "Act " + act.act + " · " + zones));
    }
    const skills = el("ul", "stat");
    for (const s of cov.skills || []) {
      const li = el("li");
      const dates = (s.dates || []).join(", ");
      li.textContent = s.name + " · " + s.minutes + " min · " + s.band + (dates ? " · " + dates : "");
      skills.appendChild(li);
    }
    card.appendChild(skills);
    const dol = cov.dol || { covered: [], remaining: [] };
    card.append(el("p", "meta", "DOL covered: " + (dol.covered.join("; ") || "—")));
    card.append(el("p", "meta", "DOL remaining: " + (dol.remaining.join("; ") || "—")));
    const log = el("button", "ghost", "Print log");
    log.addEventListener("click", () => {
      window.open("/api/parents/students/" + st.id + "/log", "_blank");
    });
    card.appendChild(log);
    for (const d of st.devices || []) {
      const row = el("div", "url-row");
      row.append(el("p", "meta", d.label + (d.lastSeen ? " · " + fmtWhen(d.lastSeen) : "")));
      const rev = el("button", "ghost", "Revoke");
      rev.addEventListener("click", () => revokeDevice(d.id));
      row.appendChild(rev);
      card.appendChild(row);
    }
    root.appendChild(card);
  }
}

function renderDevices(items) {
  const root = document.getElementById("devices");
  root.replaceChildren();
  if (!items || !items.length) return;
  const card = el("article", "card");
  card.append(el("h2", null, "Devices"));
  for (const d of items) {
    const row = el("div", "url-row");
    row.append(el("p", "meta", (d.self ? "This device · " : "") + d.label));
    const rev = el("button", "ghost", "Revoke");
      rev.addEventListener("click", () => revokeDevice(d.id));
    row.appendChild(rev);
    card.appendChild(row);
  }
  root.appendChild(card);
}

async function load() {
  const data = await PM.api("/api/parents/students");
  document.getElementById("game-url").textContent = data.gameUrl || "";
  renderPending(data.pending, data.gameUrl);
  renderStudents(data.students);
  renderDevices(data.devices);
}

PM.bindGate({
  kind: "parents",
  onReady: async () => {
    PM.show(document.getElementById("app"), true);
    await load();
  },
});

document.getElementById("copy-url").addEventListener("click", async () => {
  const url = document.getElementById("game-url").textContent;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // ignore
  }
});

document.getElementById("add-student").addEventListener("click", async () => {
  const btn = document.getElementById("add-student");
  const msg = document.getElementById("add-msg");
  btn.disabled = true;
  PM.setMsg(msg, "");
  try {
    await PM.api("/api/parents/students", {
      method: "POST",
      body: {
        name: document.getElementById("student-name").value,
        phone: document.getElementById("student-phone").value,
      },
    });
    document.getElementById("student-name").value = "";
    document.getElementById("student-phone").value = "";
    await load();
  } catch (err) {
    PM.setMsg(msg, err.message);
  } finally {
    btn.disabled = false;
  }
});
