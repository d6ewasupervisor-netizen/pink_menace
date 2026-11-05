/**
 * The last card of the campaign (Phase 5, 2026-10-29).
 *
 * `8.3.end` used to unlock two strings nobody implemented — `credits` and
 * `postgame.deacs_route` — and the player's final image was whatever the last
 * line happened to be. The one ending the campaign has now ends on a card that
 * toggles on the run's own verdict: if respect carried Deac's voice across the
 * pass (`respect >= 80` -> `8.3.12` sets `deac_answered`), the last card is his
 * "…Seatbelt."; if the mountains ate the radio, it is the room. `credits` still
 * fires; the promised postgame does not, because it never existed.
 *
 * Walks scene 8.3 end to end on a real DialogueRunner, both ways through the
 * gate, so the toggle is measured at the gate rather than assumed at the card.
 */
import { describe, expect, it } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import type { DialogueFile, DialogueHost } from "../src/quietroads/dialogue/types";
import act8 from "../src/quietroads/data/dialogue_act8.json";

type Harness = {
  runner: DialogueRunner;
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  unlocks: string[];
  shown: string[];
  finished: string[];
};

function boot(respect: number): Harness {
  const flags: Record<string, boolean> = {};
  const vars: Record<string, number> = { respect };
  const unlocks: string[] = [];
  const shown: string[] = [];
  const finished: string[] = [];
  const host: DialogueHost = {
    getVar: (n) => vars[n] ?? NaN,
    setVar: (n, v) => {
      vars[n] = v;
    },
    addVar: (n, d) => {
      vars[n] = (vars[n] || 0) + d;
    },
    getFlag: (n) => flags[n],
    setFlag: (n, v) => {
      flags[n] = v;
    },
    hasItem: () => false,
    giveItem: () => {},
    unlock: (id) => {
      unlocks.push(id);
    },
    emitNoise: () => {},
    playSfx: () => {},
    animCue: () => {},
    checkpoint: () => {},
    ledger: () => {},
    logEvent: () => {},
    logChoice: () => {},
    startGameplay: () => {},
    setTimer: () => 0,
    clearTimer: () => {},
    now: () => 0,
    random: () => 0,
  };
  const runner = new DialogueRunner(host);
  runner.load(structuredClone(act8) as unknown as DialogueFile);
  runner.on("scene_finished", (id, next) => finished.push(`${id}->${next}`));
  runner.on("line_shown", (l) => shown.push(l.node_id));
  runner.on("direction_shown", (_node, id) => shown.push(id));
  return { runner, flags, vars, unlocks, shown, finished };
}

/** Tap through everything on screen until the runner goes idle or the scene ends. */
function tapThrough(r: DialogueRunner) {
  const tap = r as unknown as { advance(): void };
  for (let i = 0; i < 200 && r.current; i++) tap.advance();
}

describe("the campaign's last card", () => {
  it("Deac answered: 8.3.12 fires at respect >= 80 and the last card is '…Seatbelt.'", () => {
    const h = boot(90);
    h.runner.startScene("8.3");
    tapThrough(h.runner);

    expect(h.flags.deac_answered).toBe(true);
    expect(h.shown).toContain("8.3.12");
    expect(h.shown).toContain("8.3.credits_deac");
    expect(h.shown).not.toContain("8.3.credits_static");
    expect(h.finished.length).toBe(1);
    expect(h.finished[0].startsWith("8.3->")).toBe(true);
    expect(h.flags.game_complete).toBe(true);
  });

  it("static: below the gate the mountains eat the radio and the last card is the room", () => {
    const h = boot(40);
    h.runner.startScene("8.3");
    tapThrough(h.runner);

    expect(h.flags.deac_answered).toBeFalsy();
    expect(h.shown).toContain("8.3.silence");
    expect(h.shown).toContain("8.3.credits_static");
    expect(h.shown).not.toContain("8.3.credits_deac");
    expect(h.flags.game_complete).toBe(true);
  });

  it("game_complete unlocks credits and nothing else — no postgame that does not exist", () => {
    for (const respect of [90, 40]) {
      const h = boot(respect);
      h.runner.startScene("8.3");
      tapThrough(h.runner);
      expect(h.unlocks).toContain("credits");
      expect(h.unlocks).not.toContain("postgame.deacs_route");
      expect(h.unlocks[h.unlocks.length - 1]).toBe("credits");
    }
  });

  it("no node in act 8 still promises postgame.deacs_route", () => {
    const file = structuredClone(act8) as unknown as DialogueFile;
    for (const [sceneId, scene] of Object.entries(file.scenes)) {
      for (const [nodeId, node] of Object.entries(scene.nodes)) {
        const unlock = (node.effects as { unlock?: string[] } | undefined)?.unlock ?? [];
        expect(unlock, `${sceneId}.${nodeId}`).not.toContain("postgame.deacs_route");
      }
    }
  });
});
