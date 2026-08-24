"use strict";

PM.bindGate({
  kind: "game",
  onReady: async (me) => {
    document.getElementById("who").textContent = me.person.name;
    try {
      const data = await PM.api("/api/game/progress");
      const p = data.progress || {};
      const bits = [p.act || "Act II"];
      if (p.current_card_id) bits.push(p.current_card_id);
      if (p.cards_completed) bits.push(p.cards_completed + " cards");
      document.getElementById("status").textContent = bits.join(" · ");
    } catch {
      document.getElementById("status").textContent = "Act II";
    }
  },
});
