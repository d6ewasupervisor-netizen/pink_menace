/**
 * The chain-up loop — the campaign's one scripted turn-around.
 *
 * Without chains, the sign at the chain-up turns the Beetle around and sends it
 * to Tuna's shop (5.2.block -> 2.8). The loop used to dead-end in four places:
 * the shop `end` nodes had no `next_scene` (2.6/2.7/2.8 all stranded the
 * runner); `chainup_return` — the flag `5.1.entry` reads for "Chains in the
 * trunk this time?" — was never set by anything; `2.8.buy_chains` set a
 * `has_chains` flag nothing reads while `5.2.entry`/`4.2.chains_branch` gate on
 * the `chains` item; and `5.1`'s `waypoint.reach:chainup` and `5.2`'s
 * `chainup.qte.success` continuation triggers were `once`, spent on the first
 * pass, so the re-climb and the post-swarm retry could never finish the scene.
 *
 * These walk the loop on a real DialogueRunner. The loop is *scripted*: the
 * shop UI and the sim have no emitters for these beats, so the events are fired
 * by hand (`shop.buy:chains`, `shop.close`, `waypoint.reach:chainup`,
 * `chainup.qte.success`, `mission.fail.swarm`).
 *
 * The last test covers the same `once`-on-continuation strand at 8.1, whose
 * only completion path (`park.parallel.clean` -> `8.1.clean_fx`) was spent for
 * good the first time it fired — stranding a swarm retry whose first attempt
 * got interrupted between the park and `8.1.end`.
 */
import { describe, expect, it } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import type { DialogueFile, DialogueHost } from "../src/quietroads/dialogue/types";
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

type Harness = {
  runner: DialogueRunner;
  flags: Record<string, boolean>;
  items: Set<string>;
  gameplay: string[];
  finished: string[]; // "from->to"
  shown: string[]; // node ids in play order
};

function boot(...files: unknown[]): Harness {
  const flags: Record<string, boolean> = {};
  const items = new Set<string>();
  const vars: Record<string, number> = {};
  const gameplay: string[] = [];
  const finished: string[] = [];
  const shown: string[] = [];
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
    hasItem: (n) => items.has(n),
    giveItem: (n) => {
      items.add(n);
    },
    unlock: () => {},
    emitNoise: () => {},
    playSfx: () => {},
    animCue: () => {},
    checkpoint: () => {},
    ledger: () => {},
    logEvent: () => {},
    logChoice: () => {},
    startGameplay: (id) => {
      gameplay.push(id);
    },
    setTimer: () => 0,
    clearTimer: () => {},
    now: () => 0,
    random: () => 0,
  };
  const runner = new DialogueRunner(host);
  for (const f of files) runner.load(structuredClone(f) as unknown as DialogueFile);
  runner.on("scene_finished", (id, next) => finished.push(`${id}->${next}`));
  runner.on("line_shown", (l) => shown.push(l.node_id));
  runner.on("direction_shown", (_node, id) => shown.push(id));
  return { runner, flags, items, gameplay, finished, shown };
}

/** Tap through everything on screen until the runner goes idle or the scene ends. */
function tapThrough(r: DialogueRunner) {
  for (let i = 0; i < 100 && r.current; i++) r.advance();
}

describe("the chain-up loop", () => {
  it("runs the whole loop: blocked -> Tuna's -> chains -> return -> chain-up -> 5.3", () => {
    const h = boot(act2, act5);

    // 1. First climb. Reaching the chain-up hands the scene to 5.2.
    h.runner.startScene("5.1");
    tapThrough(h.runner);
    expect(h.gameplay).toContain("climb_snoqualmie");
    h.runner.onEvent("waypoint.reach:chainup");
    expect(h.finished).toEqual(["5.1->5.2"]);

    // 2. No chains: the sign turns her around to Tuna's.
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    expect(h.flags.chainup_blocked).toBe(true);
    expect(h.finished).toEqual(["5.1->5.2", "5.2->2.8"]);

    // 3. Tuna's: buy the chains, close the shop. The close must know it came
    //    from the chain-up and hand the climb back with chainup_return set —
    //    and the buy must grant the `chains` item, not just a flag.
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.buy:chains");
    expect(h.items.has("chains")).toBe(true);
    expect(h.flags.has_chains).toBe(true);
    tapThrough(h.runner);
    h.runner.onEvent("shop.close");
    expect(h.finished.slice(-1)).toEqual(["2.8->5.1"]);
    expect(h.flags.chainup_return).toBe(true);

    // 4. The return climb plays the trunk line, and the chain-up must fire
    //    AGAIN — its trigger was once-per-run, stranding the re-climb at 5.1.
    h.runner.startScene("5.1");
    tapThrough(h.runner);
    expect(h.shown).toContain("5.1.ret");
    expect(h.gameplay[h.gameplay.length - 1]).toBe("climb_snoqualmie_from_below_chainup");
    h.runner.onEvent("waypoint.reach:chainup");
    expect(h.finished.slice(-1)).toEqual(["5.1->5.2"]);
    expect(h.flags.chainup_return).toBe(false); // ret_fx clears it

    // 5. Chains held: 5.2 takes the QTE path and the loop closes at 5.3.
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    expect(h.shown).toContain("5.2.0");
    expect(h.gameplay[h.gameplay.length - 1]).toBe("chainup_qte");
    h.runner.onEvent("chainup.qte.success");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["5.2->5.3"]);
  });

  it("re-arms the QTE beat after a mid-scene swarm fail (5.2 re-entry)", () => {
    const h = boot(act2, act5);
    h.items.add("chains");
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    h.runner.onEvent("chainup.qte.success");

    // The swarm takes her mid-scene; the retry comes back through 5.1.
    h.runner.onEvent("mission.fail.swarm");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["5.2->5.1"]);

    h.runner.startScene("5.1");
    tapThrough(h.runner);
    h.runner.onEvent("waypoint.reach:chainup");
    expect(h.finished.slice(-1)).toEqual(["5.1->5.2"]);

    // Second QTE success must reach 5.2.3 again (was `once`, strand).
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    h.runner.onEvent("chainup.qte.success");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["5.2->5.3"]);
  });

  it("shop closes continue the campaign: 2.6->2.3c, 2.7->2.3d, 2.8->2.4", () => {
    for (const [shop, next] of [
      ["2.6", "2.3c"],
      ["2.7", "2.3d"],
      ["2.8", "2.4"],
    ] as const) {
      const h = boot(act2);
      h.runner.startScene(shop);
      tapThrough(h.runner);
      h.runner.onEvent("shop.close");
      expect(h.finished).toEqual([`${shop}->${next}`]);
    }
  });

  it("closing Tuna's empty-handed still returns to the pass", () => {
    const h = boot(act2, act5);
    h.runner.startScene("5.2"); // blocked -> 2.8
    tapThrough(h.runner);
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.close");
    expect(h.finished.slice(-1)).toEqual(["2.8->5.1"]);
    // Trunk empty: no "Chains in the trunk this time?" lie.
    expect(h.flags.chainup_return).toBeFalsy();
  });

  it("audit: every shop close continues the campaign (no bare end nodes)", () => {
    const files = [act01, act2, act2c, act3, act4, act5, act5r, act6, act6b, act7, act8] as unknown as DialogueFile[];
    const shops: string[] = [];
    for (const f of files) {
      for (const [sid, scene] of Object.entries(f.scenes)) {
        if (scene.type !== "shop") continue;
        shops.push(sid);
        for (const [nid, node] of Object.entries(scene.nodes)) {
          if (node.type !== "end") continue;
          expect(node.next_scene, `${sid}.${nid} must continue`).toBeTruthy();
        }
      }
    }
    expect(shops).toContain("2.8");
  });
});

describe("completion triggers re-arm across re-entry (8.1)", () => {
  it("a swarm that interrupts the gap-reveal tail does not strand the retry", () => {
    const h = boot(act8);
    h.runner.startScene("8.1");
    tapThrough(h.runner); // entry -> 8.1.go -> idle

    // The park lands clean — but the swarm interrupts the tail before 8.1.end,
    // so the scene's only completion trigger has fired without completing.
    h.runner.onEvent("park.parallel.clean");
    h.runner.onEvent("mission.fail.swarm");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["8.1->8.1"]);

    // The retry must be able to complete the scene (was `once`, stranded).
    h.runner.startScene("8.1");
    tapThrough(h.runner); // spokane_retry -> 8.1.retry -> 8.1.go -> idle
    h.runner.onEvent("park.parallel.clean");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["8.1->8.2"]);
  });
});
