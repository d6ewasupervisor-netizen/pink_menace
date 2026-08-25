"use strict";

const confirmEl = document.getElementById("confirm");
const confirmQ = document.getElementById("confirm-q");
const appEl = document.getElementById("app");
let pendingQueue = [];
let shownAt = 0;
let outcomeAt = 0;
let currentCardId = null;

function showConfirm() {
  const next = pendingQueue[0];
  if (!next) {
    confirmEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    loadCurrent();
    return;
  }
  confirmEl.classList.remove("hidden");
  appEl.classList.add("hidden");
  confirmQ.textContent = "Is " + next.parentName + " your parent or guardian?";
}

async function answerLink(accept) {
  const next = pendingQueue[0];
  if (!next) return;
  const data = await PM.api("/api/links/confirm", {
    method: "POST",
    body: { pending_id: next.id, accept },
  });
  pendingQueue = data.pendingGuardians || [];
  showConfirm();
}

function renderCard(card) {
  currentCardId = card.card_id;
  shownAt = Date.now();
  document.getElementById("title").textContent = card.title || "";
  document.getElementById("scene").textContent = card.scene || "";
  document.getElementById("decision").textContent = card.decision || "";
  const shot = document.getElementById("shot");
  if (card.image_url) {
    shot.src = card.image_url + "?t=" + encodeURIComponent(card.card_id);
    shot.classList.remove("hidden");
  } else {
    shot.removeAttribute("src");
    shot.classList.add("hidden");
  }
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  const cont = document.getElementById("continue");
  result.classList.add("hidden");
  debrief.classList.add("hidden");
  cont.classList.add("hidden");
  const opts = document.getElementById("options");
  opts.replaceChildren();
  opts.classList.remove("hidden");
  for (const o of card.options || []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = o.option_text;
    btn.addEventListener("click", () => submitAnswer(o.option_id));
    opts.appendChild(btn);
  }
}

function showOutcome(data) {
  outcomeAt = Date.now();
  document.getElementById("options").classList.add("hidden");
  const result = document.getElementById("result");
  const debrief = document.getElementById("debrief");
  result.textContent = data.result || "";
  debrief.textContent = data.debrief || "";
  result.classList.remove("hidden");
  debrief.classList.remove("hidden");
  const cont = document.getElementById("continue");
  cont.classList.remove("hidden");
  const answeredId = currentCardId;
  cont.onclick = async () => {
    try {
      await PM.api("/api/run/continue", {
        method: "POST",
        body: {
          card_id: answeredId,
          ms_on_outcome: Date.now() - outcomeAt,
        },
      });
    } catch {
      // dwell is optional; never block the next card
    }
    if (data.next && data.next.done) {
      document.getElementById("title").textContent = "";
      document.getElementById("scene").textContent = "";
      document.getElementById("decision").textContent = "";
      document.getElementById("options").replaceChildren();
      document.getElementById("shot").classList.add("hidden");
      result.classList.add("hidden");
      debrief.classList.add("hidden");
      cont.classList.add("hidden");
      return;
    }
    if (data.next && data.next.card_id) renderCard(data.next);
    else loadCurrent();
  };
}

async function submitAnswer(optionId) {
  const data = await PM.api("/api/run/answer", {
    method: "POST",
    body: {
      // Scene + decision + options dwell. Median under ~6s means the scene was not read.
      card_id: currentCardId,
      option_id: optionId,
      ms_to_answer: Date.now() - shownAt,
    },
  });
  showOutcome(data);
}

async function loadCurrent() {
  const data = await PM.api("/api/run/current");
  if (data.done || (data.next && data.next.done && !data.card_id)) {
    document.getElementById("title").textContent = "";
    document.getElementById("scene").textContent = "";
    document.getElementById("decision").textContent = "";
    document.getElementById("options").replaceChildren();
    return;
  }
  renderCard(data);
}

document.getElementById("confirm-yes").addEventListener("click", () => answerLink(true));
document.getElementById("confirm-no").addEventListener("click", () => answerLink(false));

PM.bindGate({
  kind: "game",
  onReady: async (me) => {
    pendingQueue = me.pendingGuardians || [];
    if (pendingQueue.length) showConfirm();
    else {
      confirmEl.classList.add("hidden");
      appEl.classList.remove("hidden");
      await loadCurrent();
    }
  },
});
