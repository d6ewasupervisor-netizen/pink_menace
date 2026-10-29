/**
 * The whole campaign, start to finish, on one runner (Phase 6, 2026-10-29).
 *
 * Every earlier chain test proved one link: that a `next_scene` has a
 * destination (`bundle.test.ts`), that the chain-up loop closes
 * (`chainup-loop.test.ts`), that 8.3 ends (`ending.test.ts`). None of them
 * walked the campaign. This one does — scene 0.1 to `game_complete` — and it
 * takes the branches, because the two places the story forks (1.3.C's wait/honk
 * and 3.3.C's keep-going/stop) end in different scenes (3.4a vs 3.4) that both
 * have to reach Spokane. It also runs the exam twice the way a real run can:
 * passed at the terminal, and failed once → the retest week (4.3) → the terminal
 * again (4.1 with `exam_attempts` > 0) → passed.
 *
 * How the walk works. The dialogue is only half the campaign; the sim owns the
 * other half and reports through events. So the walk:
 *   - fires a `wait`'s own `wait_for`,
 *   - answers choices from a policy (first available option unless the test names
 *     one),
 *   - resolves `card` nodes correct,
 *   - and when a gameplay scene idles at its `*.go` end node (no `next_scene`,
 *     by design: "resident end") it fires the one trigger event whose target can
 *     still reach an end node that *does* hand off — i.e. it walks the mission's
 *     own forward path without pretending to drive.
 * A scene with no such event is a dead end, and fails the walk. Run the file
 * with `DBG=1` to print the events the walk fired (and where it stalled).
 */
import { describe, expect, it } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import act01 from "../src/quietroads/data/dialogue_act0-1.json";
import act2 from "../src/quietroads/data/dialogue_act2.json";
import act2c from "../src/quietroads/data/dialogue_act2_central.json";
import act3 from "../src/quietroads/data/dialogue_act3.json";
import act4 from "../src/quietroads/data/dialogue_act4.json";
import act5 from "../src/quietroads/data/dialogue_act5.json";
import act5r from "../src/quietroads/data/dialogue_act5_ribbon.json";
import act6 from "../src/quietroads/data/dialogue_act6.json";
import act6b from "../src/quietroads/data/dialogue_act6_backcountry.json";
import act7 from "../src/quietroads/data/dialogue_act7.json";
import act8 from "../src/quietroads/data/dialogue_act8.json";

const FILES = [act01, act2, act2c, act3, act4, act5, act5r, act6, act6b, act7, act8];

/**
 * The campaign, in play order. 3.3 forks: keeping going ends at 3.4a, stopping
 * for the stall at 3.4 — both then rejoin at 3.5.
 */
const CHAIN = (third: "3.4" | "3.4a") => [
  "0.1", "0.2", "0.3", "1.1", "1.2", "1.3", "1.4", "1.4b",
  "2.1", "2.2", "2.3a", "2.3b", "2.3c", "2.3d", "2.4", "2.5",
  "3.1", "3.1b", "3.2", "3.3", third, "3.5",
  "4.1", "4.2", "6.1b", "5.1", "5.2", "5.3",
  "6.1", "6.2", "6.3", "7.1", "7.2", "7.3",
  "8.1", "8.2", "8.3",
];

type Ended = { scene: string; next: string };

type Opts = {
  choices?: Record<string, string>;
  examResults?: Record<string, string[]>;
  varsAfterEntry?: Record<string, Record<string, number>>;
  items?: string[];
};

type Harness = {
  runner: DialogueRunner;
  flags: Record<string, boolean>;
  vars: Record<string, number>;
  unlocks: string[];
  ended: Ended[];
  cards: { scene: string; card: string; node: string }[];
  lastChoice: { node: string; options: string[] } | null;
};

function boot(opts: Opts): Harness {
  const flags: Record<string, boolean> = {};
  const vars: Record<string, number> = {};
  const unlocks: string[] = [];
  const ended: Ended[] = [];
  const cards: { scene: string; card: string; node: string }[] = [];
  const items = new Set(opts.items ?? []);
  const h: Harness = { runner: null as unknown as DialogueRunner, flags, vars, unlocks, ended, cards, lastChoice: null };
  const host = {
    getVar: (n: string) => vars[n] ?? NaN,
    setVar: (n: string, v: number) => {
      vars[n] = v;
    },
    addVar: (n: string, d: number) => {
      vars[n] = (vars[n] || 0) + d;
    },
    getFlag: (n: string) => flags[n],
    setFlag: (n: string, v: boolean) => {
      flags[n] = v;
    },
    hasItem: (n: string) => items.has(n),
    giveItem: (n: string) => {
      items.add(n);
    },
    unlock: (id: string) => {
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
  h.runner = new DialogueRunner(host as never);
  for (const f of FILES) h.runner.load(structuredClone(f) as never);
  h.runner.on("scene_finished", (id, next) => ended.push({ scene: id, next: next ?? "" }));
  h.runner.on("choice_shown", (_node, options, id) => {
    h.lastChoice = { node: id, options: (options ?? []).map((o) => o.id) };
  });
  // Where a card opens is story, not bookkeeping (I-009, 2026-10-29): the
  // scene a card node plays in is the fact a card's own prose can contradict.
  let scene = "";
  h.runner.on("scene_started", (id) => {
    scene = id;
  });
  h.runner.on("card_shown", (card, node) => cards.push({ scene, card, node }));
  return h;
}

/** Can this node still reach an end node that hands off to the next scene? */
function leadsForward(scene: { nodes: Record<string, any> }, from: string): boolean {
  const seen = new Set<string>([from]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    const n = scene.nodes[id];
    if (!n) continue;
    if (n.type === "end") {
      if ((n.next_scene ?? "") !== "") return true;
      continue;
    }
    const nexts: string[] = [];
    if (n.next) nexts.push(n.next);
    for (const b of n.branches ?? []) if (b.next) nexts.push(b.next);
    for (const c of n.choices ?? []) if (c.next) nexts.push(c.next);
    for (const x of nexts) if (!seen.has(x)) {
      seen.add(x);
      queue.push(x);
    }
  }
  return false;
}

/** One scene, walked until it hands off — or until nothing can advance it. */
function runScene(h: Harness, sceneId: string, opts: Opts) {
  const before = h.ended.length;
  // Per-visit: the same event name can advance two different scenes
  // (park.parallel.clean finishes 2.3d *and* 8.1's last park).
  const fired = new Set<string>();
  h.runner.startScene(sceneId);
  const post = opts.varsAfterEntry?.[sceneId];
  if (post) Object.assign(h.vars, post);

  for (let i = 0; i < 4000; i++) {
    const scene = h.runner.scene as unknown as
      | { id: string; nodes: Record<string, any>; triggers?: any[] }
      | null;
    if (!scene || scene.id !== sceneId) {
      if (process.env.DBG) console.log("LEFT", sceneId, "->", scene?.id, "at", (h.runner as any).currentId);
      return; // a jump node took us elsewhere
    }

    const cur = h.runner.current as any;
    if (cur) {
      if (cur.type === "wait") {
        if (process.env.DBG) console.log("WAIT", sceneId, cur.wait_for);
        h.runner.onEvent(cur.wait_for);
        continue;
      }
      if (cur.type === "choice") {
        const opts_ = h.lastChoice?.options ?? [];
        const want = h.lastChoice ? opts.choices?.[h.lastChoice.node] : undefined;
        // Policy first, then the first option that still reaches a hand-off
        // (a shop detour jumps to another scene; the walk takes the road on).
        const forward = (cur.choices ?? [])
          .map((c: any) => c.id)
          .filter((id: string) => opts_.includes(id))
          .find((id: string) => {
            const target = (cur.choices ?? []).find((c: any) => c.id === id)?.next;
            return target ? leadsForward(scene, target) : false;
          });
        const pick = want && opts_.includes(want) ? want : forward ?? opts_[0];
        if (!pick) return;
        h.runner.chooseById(pick);
        continue;
      }
      if (cur.type === "card") {
        h.runner.resolveCard({ card: cur.card, option: "d", correct: true });
        continue;
      }
      h.runner.advanceFromUi();
      continue;
    }

    // Nothing on screen: the scene handed off, ended resident, or ran into a
    // bark leaf (an FX node with no `next` — the mission is still driving).
    const end = h.ended.length > before ? h.ended[h.ended.length - 1] : null;
    if (end && end.next) return;

    // Resident end: the mission resolves outside the dialogue. Fire the one
    // trigger whose target still leads to a hand-off.
    const queue = opts.examResults?.[sceneId];
    let event: string | undefined;
    if (queue && queue.length) event = queue.shift();
    if (!event) {
      for (const t of scene.triggers ?? []) {
        if (fired.has(t.event)) continue;
        // Retry/atmosphere events re-enter the scene instead of advancing it.
        if (/^(noise\.|mission\.fail\.|mission\.complete\.|shop\.cant_afford$)/.test(t.event)) continue;
        if (!leadsForward(scene, t.node)) continue;
        event = t.event;
        break;
      }
    }
    if (!event) {
      if (process.env.DBG) console.log("DEAD", sceneId, "fired:", [...fired].join(","));
      return;
    }
    if (process.env.DBG) console.log("FIRE", sceneId, event);
    fired.add(event);
    h.runner.onEvent(event);
  }
  if (process.env.DBG) console.log("GUARD", sceneId, "at", (h.runner as any).currentId);
}

/** 0.1 → the last card. Returns every scene the walk entered, in order. */
function walkCampaign(opts: Opts) {
  const h = boot(opts);
  const visited: string[] = [];
  let scene: string | null = "0.1";
  for (let guard = 0; scene && guard < 80; guard++) {
    visited.push(scene);
    const before = h.ended.length;
    runScene(h, scene, opts);
    const end = h.ended.length > before ? h.ended[h.ended.length - 1] : null;
    scene = end && end.next ? end.next : null;
  }
  return { h, visited };
}


describe("the whole campaign walks from 0.1 to game_complete", () => {
  it("first pass, one visit per scene: the exam passed, the shortest branches", () => {
    const { h, visited } = walkCampaign({ items: ["chains"] });

    expect(visited, visited.join(" -> ")).toEqual(CHAIN("3.4a"));
    expect(h.flags.game_complete).toBe(true);
    expect(h.unlocks).toContain("credits");
    // Passed at the terminal, not deferred: the retest week never runs.
    expect(visited).not.toContain("4.3");
    // 1.3's first option waits, and 3.3's first keeps going (3.3.A ends at 3.4a).
    expect(visited).toContain("3.4a");
    expect(visited).not.toContain("3.4");
  });

  it("the other fork: honk at the lot, stop for the stall, and Spokane still arrives", () => {
    const { h, visited } = walkCampaign({
      items: ["chains"],
      choices: { "1.3.C": "honk", "3.3.C": "stop" },
    });

    expect(visited, visited.join(" -> ")).toEqual(CHAIN("3.4"));
    expect(h.flags.game_complete).toBe(true);
    expect(visited).toContain("3.4");
    expect(visited).not.toContain("3.4a");
  });

  it("exam failed once: 4.2 -> the retest week 4.3 -> 4.1 again -> passed -> 6.1b", () => {
    const { h, visited } = walkCampaign({
      items: ["chains"],
      examResults: { "4.2": ["exam.fail", "exam.pass"] },
    });

    expect(h.flags.game_complete).toBe(true);
    expect(h.flags.exam_passed).toBe(true);
    expect(h.flags.exam_failed_once).toBe(true);

    // Two visits to the terminal, the week between them, in that order.
    const fourTwo = visited.reduce<number[]>((acc, s, i) => (s === "4.2" ? [...acc, i] : acc), []);
    expect(fourTwo.length).toBe(2);
    const fourThree = visited.indexOf("4.3");
    expect(fourThree).toBeGreaterThan(fourTwo[0]);
    expect(fourThree).toBeLessThan(fourTwo[1]);
    expect(visited.slice(fourTwo[1] + 1, fourTwo[1] + 2)).toEqual(["6.1b"]);
    expect(h.vars.exam_attempts).toBe(1);
  });

  it("every hand-off in the walk names a scene the runner can start", () => {
    const { h } = walkCampaign({ items: ["chains"] });
    for (const end of h.ended) {
      if (!end.next) continue;
      expect(h.runner.hasScene(end.next), `${end.scene} -> ${end.next}`).toBe(true);
    }
    // and the walk ends where 8.3 says it does
    expect(h.ended[h.ended.length - 1]).toEqual({ scene: "8.3", next: "" });
  });

  it("I-009 opens in the 1.4 aftermath, after Mya is lost — not over the 1.2 park", () => {
    const { h } = walkCampaign({ items: ["chains"] });
    // I-009's own scene says "The passenger seat beside you is empty"
    // (cards/I-009.json). Both cats are still aboard in 1.2, and 1.3 is where
    // the seat empties, so the card may only open in the carport aftermath.
    const opens = h.cards.filter((c) => c.card === "I-009");
    expect(opens).toEqual([{ scene: "1.4", card: "I-009", node: "1.4.card_I-009" }]);
    expect(h.cards.some((c) => c.scene === "1.2" && c.card === "I-009")).toBe(false);
    // 1.2 still shows its own card, parks (resident end), then hands off to 1.3.
    expect(h.cards.filter((c) => c.scene === "1.2").map((c) => c.card)).toEqual(["I-005"]);
    expect(h.ended.filter((e) => e.scene === "1.2").map((e) => e.next)).toEqual(["", "1.3"]);
  });
});

