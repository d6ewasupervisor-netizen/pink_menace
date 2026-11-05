/**
 * No silent deadlocks (2026-11-03).
 *
 * Scene 5.3 waited on `cutscene.summit_clear`, an event nothing in the game
 * emits. The runner stopped, no mission was running, so the cockpit rule
 * (correctly) hid the dashboard, and the phone sat on a parked car in a
 * placeholder world. Every reload resumed into the same trap because the save
 * pointed at 5.3.
 *
 * This guard is the static half of the fix: every `wait_for` and every
 * `triggers[].event` in every act must name an event something in `drive/src`
 * really emits (or a rule — the cutscene fallback in quietroads/waitWatch.ts).
 * `test/fullchain.test.ts` is the walk: it may only advance through events this
 * inventory can produce, so a scene that waits on a ghost fails there too.
 *
 * The inventory is measured from the source (`test/emitInventory.ts`), not
 * hand-listed: add an emitter and it appears. The one allow-list is for UI the
 * web port has not built (the shop counter, the tow-strap gesture) and is
 * pinned below so it cannot silently grow.
 */
import { describe, expect, it } from "vitest";
import {
  UNWIRED,
  dialogueFiles,
  emittedEvents,
  emitterFor,
  eventMatches,
  orphans,
  unwiredReason,
  type Emitter,
} from "./emitInventory";

/** The literal fix for the reported bug, checked on its own. */
const SUMMIT_WAIT = { scene: "5.3", node: "5.3.hold", event: "cutscene.summit_clear" };

describe("every story wait can be answered", () => {
  const emitters = emittedEvents();

  it("has the cutscene rule in the emitter set", () => {
    expect(emitterFor("cutscene.summit_clear", emitters)).toBe("cutscene.");
    expect(emitterFor("cutscene.gracie_yell", emitters)).toBe("cutscene.");
  });

  it("names the emitter for 5.3's summit wait", () => {
    const byScene = orphans(emitters).filter((o) => o.scene === SUMMIT_WAIT.scene);
    expect(byScene, JSON.stringify(byScene)).toEqual([]);
    const files = dialogueFiles();
    const node = files
      .flatMap((f) => Object.entries(f.data.scenes ?? {}))
      .find(([id]) => id === SUMMIT_WAIT.scene)![1].nodes![SUMMIT_WAIT.node];
    expect(node.wait_for).toBe(SUMMIT_WAIT.event);
  });

  it("has no orphaned wait_for in any act", () => {
    const bad = orphans(emitters).filter((o) => o.kind === "wait");
    expect(
      bad.map((o) => `${o.scene}/${o.node} waits for "${o.event}" — nothing emits it`),
      "every wait must name an event the game really emits",
    ).toEqual([]);
  });
});

describe("every trigger can fire", () => {
  const emitters = emittedEvents();

  it("has no orphaned trigger outside the documented unported surfaces", () => {
    const bad = orphans(emitters).filter((o) => o.kind === "trigger" && !unwiredReason(o.event));
    expect(
      bad.map((o) => `${o.scene}/${o.node} listens for "${o.event}" — nothing emits it`),
      "every trigger must name an event the game really emits",
    ).toEqual([]);
  });

  it("keeps the unported-surface allow-list honest and small", () => {
    const all = orphans(emitters);
    for (const u of UNWIRED) {
      const covered = all.filter((o) => o.event.startsWith(u.pattern));
      expect(covered.length, `allow-list entry "${u.pattern}" covers no orphan — delete it`).toBeGreaterThan(0);
    }
    const allowed = all.filter((o) => unwiredReason(o.event));
    // Pinned: 3.3's strap gesture, nothing else. The shop counter used to be
    // here and is ported (quietroads/shop.ts); its events are emitted now.
    expect(new Set(allowed.map((o) => o.event.split(":")[0]))).toEqual(
      new Set(["qte.strap.start", "qte.strap.success", "qte.strap.fail"]),
    );
  });
});

describe("the emitter matcher", () => {
  const emitters: Emitter[] = [
    { name: "merge.gap_open", where: "test" },
    { name: "waypoint.reach:", where: "test" },
    { name: "shop.buy:chains", where: "test" },
    { name: "cutscene.", where: "test" },
  ];

  it("matches exact names", () => {
    expect(emitterFor("merge.gap_open", emitters)).toBe("merge.gap_open");
  });

  it("matches a wait written as a prefix", () => {
    // 3.2 waits for `merge.`; any merge.* event answers it.
    expect(emitterFor("merge.", emitters)).toBe("merge.gap_open");
  });

  it("matches an emitter built from a template literal", () => {
    expect(emitterFor("waypoint.reach:warehouse", emitters)).toBe("waypoint.reach:");
  });

  it("does not match a name nothing emits", () => {
    expect(emitterFor("cutscene.summit_clear", [{ name: "cutscene.other", where: "test" }])).toBeNull();
    expect(emitterFor("merge.", emitters.filter((e) => !e.name.startsWith("merge.")))).toBeNull();
  });

  it("uses the runner's own prefix rule", () => {
    expect(eventMatches("merge.", "merge.clean")).toBe(true);
    expect(eventMatches("shop.buy:", "shop.buy:chains")).toBe(true);
    expect(eventMatches("shop.close", "shop.close:cats")).toBe(false);
  });
});
