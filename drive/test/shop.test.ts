/**
 * The shop counter — the surface the web drive never ported.
 *
 * The deadlock guard allow-listed `shop.buy:*` and `shop.cant_afford` as
 * "not on any forward path". That was wrong. 5.2 without chains ends at
 * `5.2.block`, whose `next_scene` is 2.8; with no counter the only exit from
 * 2.8 was `2.8.end_reblocked` -> 5.1 -> 5.2.block, forever. 7.2's muffler and
 * LED lights were unreachable too, so `8.1.lights_branch` could never take
 * `lights_a`, `8.1.cluster` could never take `cluster_src`, and 7.2's own
 * "you've already got both" branch was dead.
 *
 * These tests are the data half of the fix: the catalogue in
 * `quietroads/shop.ts` must name a real trigger and a real node, the node must
 * grant what the catalogue says it grants, and every `has_item` check in the
 * campaign must be satisfiable by something the game actually gives. The
 * browser half is `e2e/shop.spec.ts`.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import type { DialogueFile, DialogueHost } from "../src/quietroads/dialogue/types";
import { SHOPS, canFrontChains, shopForGameplay, shopForScene } from "../src/quietroads/shop";
import { settleDebt } from "../src/quietroads/debt";
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

const FILES = [act01, act2, act2c, act3, act4, act5, act5r, act6, act6b, act7, act8] as unknown as DialogueFile[];

type Scene = DialogueFile["scenes"][string];

function sceneOf(id: string): Scene {
  for (const f of FILES) if (f.scenes[id]) return f.scenes[id];
  throw new Error(`no scene ${id}`);
}

/** Every `has_item` value the campaign branches on. */
function hasItemChecks(): { scene: string; node: string; item: string }[] {
  const out: { scene: string; node: string; item: string }[] = [];
  const walk = (scene: string, node: string, value: unknown) => {
    if (Array.isArray(value)) { for (const v of value) walk(scene, node, v); return; }
    if (!value || typeof value !== "object") return;
    const rec = value as Record<string, unknown>;
    if (typeof rec.has_item === "string") out.push({ scene, node, item: rec.has_item });
    for (const v of Object.values(rec)) walk(scene, node, v);
  };
  for (const f of FILES) {
    for (const [sid, sc] of Object.entries(f.scenes)) {
      for (const [nid, node] of Object.entries(sc.nodes)) walk(sid, nid, node);
      for (const t of sc.triggers ?? []) walk(sid, t.node, t.condition);
    }
  }
  return out;
}

/** Every item the dialogue data grants. */
function grantedItems(): Set<string> {
  const out = new Set<string>();
  for (const f of FILES) {
    for (const sc of Object.values(f.scenes)) {
      for (const node of Object.values(sc.nodes)) {
        for (const i of node.effects?.give_items ?? []) out.add(i);
        for (const c of node.choices ?? []) for (const i of c.effects?.give_items ?? []) out.add(i);
      }
    }
  }
  return out;
}

type Harness = {
  runner: DialogueRunner;
  flags: Record<string, boolean>;
  items: Set<string>;
  vars: Record<string, number>;
  finished: string[];
  /** Node ids in the order the runner showed them. */
  shown: string[];
};

function boot(...files: unknown[]): Harness {
  const flags: Record<string, boolean> = {};
  const items = new Set<string>();
  const vars: Record<string, number> = {};
  const finished: string[] = [];
  const shown: string[] = [];
  const host: DialogueHost = {
    getVar: (n) => vars[n] ?? NaN,
    setVar: (n, v) => { vars[n] = v; },
    addVar: (n, d) => { vars[n] = (vars[n] || 0) + d; },
    getFlag: (n) => flags[n],
    setFlag: (n, v) => { flags[n] = v; },
    hasItem: (n) => items.has(n),
    giveItem: (n) => { items.add(n); },
    unlock: () => {},
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
  for (const f of files) runner.load(structuredClone(f) as unknown as DialogueFile);
  runner.on("scene_finished", (id, next) => finished.push(`${id}->${next}`));
  runner.on("line_shown", (l) => shown.push(l.node_id));
  return { runner, flags, items, vars, finished, shown };
}

/** Tap through whatever is on screen until the runner goes idle. */
function tapThrough(runner: DialogueRunner) {
  for (let i = 0; i < 200; i++) {
    if (!runner.current) return;
    if (runner.current.type === "wait" || runner.current.type === "card") return;
    runner.advanceFromUi();
  }
  throw new Error("tapThrough did not settle");
}

describe("the shop catalogue is wired to the story", () => {
  it("names a real trigger and a real node for every item", () => {
    for (const shop of SHOPS) {
      const scene = sceneOf(shop.scene);
      expect(scene.type, `${shop.scene} is a shop scene`).toBe("shop");
      for (const item of shop.items) {
        const event = `shop.buy:${item.id}`;
        const trigger = (scene.triggers ?? []).find((t) => t.event === event);
        expect(trigger, `${shop.scene} listens for ${event}`).toBeTruthy();
        expect(scene.nodes[trigger!.node], `${shop.scene}.${trigger!.node} exists`).toBeTruthy();
      }
    }
  });

  it("grants the item and sets the flag the catalogue promises", () => {
    for (const shop of SHOPS) {
      const scene = sceneOf(shop.scene);
      for (const item of shop.items) {
        const trigger = (scene.triggers ?? []).find((t) => t.event === `shop.buy:${item.id}`)!;
        const node = scene.nodes[trigger.node];
        if (item.item) {
          expect(node.effects?.give_items ?? [], `${shop.scene}.${trigger.node} grants ${item.item}`).toContain(item.item);
        }
        if (item.flag) {
          expect(node.effects?.set_flags?.[item.flag], `${shop.scene}.${trigger.node} sets ${item.flag}`).toBe(true);
        }
      }
    }
  });

  it("every has_item branch in the campaign can be satisfied", () => {
    // The bug this catches: 2.8.buy_muffler set `has_quiet_muffler` but never
    // granted the `muffler` item, so 7.2.owned_branch and 8.1.cluster could
    // never see it even with the counter ported.
    const granted = grantedItems();
    const missing = hasItemChecks().filter((c) => !granted.has(c.item));
    expect(
      missing.map((c) => `${c.scene}/${c.node} checks has_item "${c.item}" — nothing grants it`),
      "every has_item check must be reachable",
    ).toEqual([]);
  });

  it("the counter's prices agree with the 7.2 tier gate", () => {
    const ritzville = shopForScene("7.2")!;
    const total = ritzville.items.reduce((n, i) => n + i.price, 0);
    // 7.2.tp_branch: >= 400 "you can do both", >= 180 "you can do one".
    expect(total, "400 buys both").toBeLessThanOrEqual(400);
    expect(Math.min(...ritzville.items.map((i) => i.price)), "180 buys one").toBeLessThanOrEqual(180);
  });

  it("looks a counter up by gameplay id and by scene", () => {
    expect(shopForGameplay("shop_upgrades")?.scene).toBe("2.8");
    expect(shopForScene("2.8")?.gameplay).toBe("shop_upgrades");
    expect(shopForGameplay("climb_snoqualmie")).toBeNull();
    expect(shopForScene("5.2")).toBeNull();
  });
});

describe("Tuna fronts the chains when the loop would otherwise close on itself", () => {
  const tuna = shopForScene("2.8")!;
  const chains = tuna.items.find((i) => i.id === "chains")!;

  it("offers the tab only in the blocked loop, only when short, only without the set", () => {
    const base = { shop: tuna, tradePoints: chains.price - 1, ownsChains: false, chainupBlocked: true };
    expect(canFrontChains(base)).toBe(true);
    expect(canFrontChains({ ...base, tradePoints: chains.price }), "affordable: buy it").toBe(false);
    expect(canFrontChains({ ...base, ownsChains: true }), "already has the set").toBe(false);
    expect(canFrontChains({ ...base, chainupBlocked: false }), "not the chain-up loop").toBe(false);
    expect(canFrontChains({ ...base, shop: shopForScene("2.6")! }), "only Tuna's bay").toBe(false);
  });

  it("the fronted set is the same set the climb reads", () => {
    const h = boot(act2, act5);
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.front:chains");
    tapThrough(h.runner);
    expect(h.items.has("chains"), "the item 5.2.entry branches on").toBe(true);
    expect(h.flags.has_chains).toBe(true);
    expect(h.flags.tuna_fronted_chains).toBe(true);
  });
});

describe("the chain-up loop closes through the counter", () => {
  it("5.2 without chains -> 2.8 -> buy -> 5.1 -> 5.2 -> 5.3", () => {
    const h = boot(act2, act5);

    // 1. The sign turns her around.
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["5.2->2.8"]);
    expect(h.flags.chainup_blocked).toBe(true);

    // 2. Tuna's counter: the buy the counter fires.
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.buy:chains");
    tapThrough(h.runner);
    expect(h.items.has("chains")).toBe(true);
    expect(h.flags.has_chains).toBe(true);

    // 3. Leave: the close branch sees the set and returns to the pass.
    h.runner.onEvent("shop.close");
    expect(h.finished.slice(-1)).toEqual(["2.8->5.1"]);
    expect(h.flags.chainup_return).toBe(true);
    expect(h.flags.chainup_blocked).toBe(false);

    // 4. 5.1 reads chainup_return and starts the climb from below the pull-out.
    h.runner.startScene("5.1");
    tapThrough(h.runner);
    h.runner.onEvent("waypoint.reach:chainup");
    expect(h.finished.slice(-1)).toEqual(["5.1->5.2"]);

    // 5. 5.2 now takes the chain-up path and the summit follows.
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    h.runner.onEvent("chainup.qte.success");
    tapThrough(h.runner);
    expect(h.finished.slice(-1)).toEqual(["5.2->5.3"]);
  });

  it("closing Tuna's empty-handed still returns to the pass, without the lie", () => {
    const h = boot(act2, act5);
    h.runner.startScene("5.2");
    tapThrough(h.runner);
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.close");
    expect(h.finished.slice(-1)).toEqual(["2.8->5.1"]);
    expect(h.flags.chainup_return).toBeFalsy();
  });
});

describe("Tuna's front is a debt, not a gift", () => {
  const tuna = shopForScene("2.8")!;
  const chainsPrice = tuna.items.find((i) => i.id === "chains")!.price;

  it("records the set's price as a debt, and says so out loud", () => {
    const front = sceneOf("2.8").nodes["2.8.front_chains"];
    expect(front.effects?.set_vars?.tuna_debt, "the tab is the catalogue's price").toBe(chainsPrice);
    expect(front.next, "the owe line follows the front").toBe("2.8.front_chains_owe");
    const owe = sceneOf("2.8").nodes["2.8.front_chains_owe"];
    expect(owe.speaker).toBe("TUNA");
    expect(owe.text).toBe("You'll owe me. Deac'll know.");
  });

  it("takes the debt out of one award and clears it", () => {
    // A short pay clears the tab (the set is worth more than the pay) and a
    // long one leaves the rest of the pay alone. Neither carries a balance.
    expect(settleDebt(30, 150)).toEqual({ award: 30, net: 0, paid: 30, settled: true });
    expect(settleDebt(150, 150)).toEqual({ award: 150, net: 0, paid: 150, settled: true });
    expect(settleDebt(500, 150)).toEqual({ award: 500, net: 350, paid: 150, settled: true });
    expect(settleDebt(30, 0), "nothing owed").toEqual({ award: 30, net: 30, paid: 0, settled: false });
    expect(settleDebt(0, 150), "a zero award is not a pay").toEqual({ award: 0, net: 0, paid: 0, settled: false });
    expect(settleDebt(-150, 150), "a spend is not a pay").toEqual({ award: -150, net: -150, paid: 0, settled: false });
  });

  it("still hands over the chains, so the soft-lock fix survives the debt", () => {
    const h = boot(act2, act5);
    h.runner.startScene("2.8");
    tapThrough(h.runner);
    h.runner.onEvent("shop.front:chains");
    tapThrough(h.runner);
    expect(h.items.has("chains"), "she leaves with the set").toBe(true);
    expect(h.flags.has_chains).toBe(true);
    expect(h.vars.tuna_debt, "and with the tab").toBe(chainsPrice);
    expect(h.shown, "both Tuna lines played").toContain("2.8.front_chains_owe");
  });

  it("Deac names it at the pay that settles it, and only when there is one", () => {
    // Settled: 5.2.3 pays, then Deac says where it went.
    const paid = boot(act2, act5);
    paid.runner.startScene("5.2");
    tapThrough(paid.runner);
    paid.vars.tuna_debt_paid = 150;
    paid.runner.onEvent("chainup.qte.success");
    tapThrough(paid.runner);
    expect(paid.shown, "the dispatch line is on the path").toContain("5.2.debt_line");
    expect(paid.shown.indexOf("5.2.debt_line"), "after the pay").toBeGreaterThan(paid.shown.indexOf("5.2.3"));
    expect(paid.vars.tuna_debt_paid, "cleared after he has said it").toBe(0);
    expect(paid.finished.slice(-1)).toEqual(["5.2->5.3"]);

    // Nothing owed: the same walk goes straight from the pay to the brief.
    const clean = boot(act2, act5);
    clean.runner.startScene("5.2");
    tapThrough(clean.runner);
    clean.runner.onEvent("chainup.qte.success");
    tapThrough(clean.runner);
    expect(clean.shown, "no debt, no line").not.toContain("5.2.debt_line");
    expect(clean.finished.slice(-1)).toEqual(["5.2->5.3"]);
  });
});

/**
 * The store is the one writer of a Trade Point, so it is the one place the tab
 * can be taken. `qrStore` is imported after a localStorage shim because
 * zustand/persist reads `window.localStorage` when the module initialises.
 */
describe("the store takes the tab out of the next pay", () => {
  let store: typeof import("../src/stores/qrStore").useQRStore;

  beforeAll(async () => {
    const shim = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;
    vi.stubGlobal("localStorage", shim);
    vi.stubGlobal("window", { localStorage: shim });
    store = (await import("../src/stores/qrStore")).useQRStore;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const seed = (vars: Record<string, number>) => store.setState({ vars });

  it("eats a short pay whole and clears the debt", () => {
    seed({ trade_points: 100, tuna_debt: 150, tuna_debt_paid: 0 });
    store.getState().addVar("trade_points", 30);
    const v = store.getState().vars;
    expect(v.trade_points, "the 30 went to Tuna").toBe(100);
    expect(v.tuna_debt, "the tab is closed").toBe(0);
    expect(v.tuna_debt_paid, "what came out is on the record").toBe(30);
  });

  it("leaves the rest of a long pay alone", () => {
    seed({ trade_points: 0, tuna_debt: 150, tuna_debt_paid: 0 });
    store.getState().addVar("trade_points", 500);
    const v = store.getState().vars;
    expect(v.trade_points).toBe(350);
    expect(v.tuna_debt).toBe(0);
    expect(v.tuna_debt_paid).toBe(150);
  });

  it("pays the next award in full once the tab is closed", () => {
    seed({ trade_points: 0, tuna_debt: 0, tuna_debt_paid: 150 });
    store.getState().addVar("trade_points", 30);
    expect(store.getState().vars.trade_points).toBe(30);
  });

  it("never touches a spend, or a different var", () => {
    seed({ trade_points: 100, tuna_debt: 150, respect: 0 });
    store.getState().addVar("trade_points", -150);
    expect(store.getState().vars).toMatchObject({ trade_points: -50, tuna_debt: 150 });
    store.getState().addVar("respect", 3);
    const v = store.getState().vars;
    expect(v).toMatchObject({ respect: 3, tuna_debt: 150 });
    expect("tuna_debt_paid" in v, "no settlement was recorded").toBe(false);
  });
});
