"use strict";

function fmtWhen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function renderStudents(payload) {
  const root = document.getElementById("students");
  root.replaceChildren();
  const students = payload.students || [];
  for (const st of students) {
    const card = document.createElement("article");
    card.className = "card";
    const h = document.createElement("h2");
    h.textContent = st.name;
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = st.phone;
    const stats = document.createElement("ul");
    stats.className = "stat";
    const items = [
      st.act || "Act II",
      st.current_card_id,
      (st.cards_completed || 0) + " cards",
      st.last_seen_at ? fmtWhen(st.last_seen_at) : null,
    ].filter(Boolean);
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      stats.appendChild(li);
    }
    const url = document.createElement("p");
    url.className = "url";
    url.textContent = payload.gameUrl || "";
    card.append(h, meta, stats, url);
    root.appendChild(card);
  }
}

async function loadStudents() {
  const data = await PM.api("/api/parents/students");
  renderStudents(data);
}

PM.bindGate({
  kind: "parents",
  onReady: async () => {
    await loadStudents();
  },
});

document.getElementById("add-student").addEventListener("click", async () => {
  const btn = document.getElementById("add-student");
  const msg = document.getElementById("add-msg");
  const inviteUrl = document.getElementById("invite-url");
  btn.disabled = true;
  PM.setMsg(msg, "");
  inviteUrl.classList.add("hidden");
  inviteUrl.textContent = "";
  try {
    const data = await PM.api("/api/parents/students", {
      method: "POST",
      body: {
        name: document.getElementById("student-name").value,
        phone: document.getElementById("student-phone").value,
      },
    });
    if (data.sms && data.sms.status === "blocked") {
      PM.setMsg(msg, data.sms.error || "Text was not delivered.");
      inviteUrl.textContent = data.gameUrl || "";
      inviteUrl.classList.remove("hidden");
    } else {
      document.getElementById("student-name").value = "";
      document.getElementById("student-phone").value = "";
    }
    await loadStudents();
  } catch (err) {
    PM.setMsg(msg, err.message);
  } finally {
    btn.disabled = false;
  }
});
