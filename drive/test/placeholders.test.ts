/**
 * The canon names are code, not saved state (2026-11-03).
 *
 * A real save carried `GRANDMA_INITIALS: "G.J."` and `GRANDMA_NAME: "June"`.
 * The bridge applied the save over the defaults at boot, so the corrected
 * `— G.` never reached an existing player, and "June" collided with June, the
 * Act II insulin neighbour. `quietroads/placeholders.ts` is the canon set; the
 * store no longer persists placeholders and folds an old save under canon.
 *
 * There was a second way the stale value could win, and this file is why it is
 * gone: every act file carries `meta.placeholders` defaults, four of them still
 * said `GRANDMA_INITIALS: "Grandma"`, and `DialogueRunner.load` merged a file
 * *over* the host's values — so loading Act II undid the canon set for every
 * scene in it. The runner now only seeds a placeholder the host does not
 * already hold (the same rule it uses for vars and flags), and the four act
 * files were corrected.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import { CANON_PLACEHOLDERS, withCanonPlaceholders } from "../src/quietroads/placeholders";

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "quietroads", "data");
const dialogueFiles = () =>
  fs.readdirSync(DATA).filter((f) => f.startsWith("dialogue_act") && f.endsWith(".json")).sort();
const read = (f: string) => fs.readFileSync(path.join(DATA, f), "utf8");

describe("the canon names", () => {
  it("signs the note — G. and calls her Grandma, never June", () => {
    expect(CANON_PLACEHOLDERS.GRANDMA_INITIALS).toBe("— G.");
    expect(CANON_PLACEHOLDERS.GRANDMA_NAME).toBe("Grandma");
    expect(CANON_PLACEHOLDERS.GRANDMA_NAME).not.toBe("June");
    expect(Object.keys(CANON_PLACEHOLDERS).sort()).toEqual([
      "GRANDMA",
      "GRANDMA_INITIALS",
      "GRANDMA_NAME",
      "MOM",
      "PLAYER",
      "PLAYER_FULL",
      "RAY",
    ]);
  });

  it("wins over a save that carries the old values, and keeps non-canon ones", () => {
    const merged = withCanonPlaceholders({
      GRANDMA_INITIALS: "G.J.",
      GRANDMA_NAME: "June",
      PLAYER: "Somebody",
      GRANDMA: "Nana",
      NICKNAME: "Al",
    });
    expect(merged.GRANDMA_INITIALS).toBe("— G.");
    expect(merged.GRANDMA_NAME).toBe("Grandma");
    expect(merged.PLAYER).toBe("Ali");
    expect(merged.GRANDMA).toBe("Grandma");
    expect(merged.NICKNAME, "a name the canon set does not own is not dropped").toBe("Al");
  });

  it("is the default set when there is no save at all", () => {
    expect(withCanonPlaceholders(null)).toEqual({ ...CANON_PLACEHOLDERS });
    expect(withCanonPlaceholders(undefined)).toEqual({ ...CANON_PLACEHOLDERS });
  });
});

describe("the dialogue files agree with the canon", () => {
  it("defines every canon token it names with the canon value", () => {
    const bad: string[] = [];
    for (const file of dialogueFiles()) {
      const meta = (JSON.parse(read(file)) as { meta?: { placeholders?: Record<string, string> } }).meta;
      for (const [k, v] of Object.entries(meta?.placeholders ?? {})) {
        if (k in CANON_PLACEHOLDERS && v !== CANON_PLACEHOLDERS[k]) {
          bad.push(`${file}: meta.placeholders.${k} = "${v}", canon is "${CANON_PLACEHOLDERS[k]}"`);
        }
      }
    }
    expect(bad, "an act file's default must not disagree with the canon set").toEqual([]);
  });

  it("reports every place GRANDMA_NAME is spoken", () => {
    // The inventory the task asked for, pinned: Act II asks after her four times,
    // Act IV's exam-result line once. A new line is fine — update this list and
    // make sure it reads as a person's name, not June the neighbour.
    const uses = dialogueFiles()
      .map((f) => ({ f, n: (read(f).match(/\{GRANDMA_NAME\}/g) ?? []).length }))
      .filter((u) => u.n > 0)
      .map((u) => `${u.f} x${u.n}`);
    expect(uses).toEqual(["dialogue_act2.json x4", "dialogue_act4.json x1"]);
  });

  it("signs the note in exactly one act, with the canon initials", () => {
    const uses = dialogueFiles()
      .map((f) => ({ f, n: (read(f).match(/\{GRANDMA_INITIALS\}/g) ?? []).length }))
      .filter((u) => u.n > 0)
      .map((u) => `${u.f} x${u.n}`);
    expect(uses).toEqual(["dialogue_act0-1.json x1"]);
  });
});


/** The host the runner needs; only placeholders and vars matter here. */
function host() {
  const vars: Record<string, number> = {};
  return {
    getVar: (n: string) => vars[n] ?? NaN,
    setVar: (n: string, v: number) => void (vars[n] = v),
    addVar: (n: string, d: number) => void (vars[n] = (vars[n] || 0) + d),
    getFlag: () => undefined,
    setFlag: () => {},
    hasItem: () => false,
    giveItem: () => {},
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
}

/** An act file whose own defaults still carry the pre-fix names. */
const STALE_FILE = {
  meta: {
    schema_version: "1.0.0",
    acts: [2],
    locale: "en-US",
    placeholders: { GRANDMA_INITIALS: "G.J.", GRANDMA_NAME: "June" },
  },
  characters: {},
  scenes: {
    "9.9": {
      id: "9.9",
      entry: "9.9.line",
      nodes: { "9.9.line": { id: "9.9.line", type: "line", text: "{GRANDMA_NAME} — {GRANDMA_INITIALS}" } },
    },
  },
  pools: {},
};

describe("the runner lets the host's placeholders win", () => {
  it("keeps a canon name set before the file loads (the bridge's order)", () => {
    const runner = new DialogueRunner(host() as never);
    for (const [k, v] of Object.entries(CANON_PLACEHOLDERS)) runner.setPlaceholder(k, v);
    runner.load(structuredClone(STALE_FILE) as never);
    expect(runner.substitute("{GRANDMA_NAME} — {GRANDMA_INITIALS}")).toBe("Grandma — — G.");
  });

  it("keeps a canon name set after the file loads", () => {
    const runner = new DialogueRunner(host() as never);
    runner.load(structuredClone(STALE_FILE) as never);
    expect(runner.substitute("{GRANDMA_NAME}"), "the file's default is the fallback").toBe("June");
    for (const [k, v] of Object.entries(CANON_PLACEHOLDERS)) runner.setPlaceholder(k, v);
    expect(runner.substitute("{GRANDMA_NAME} — {GRANDMA_INITIALS}")).toBe("Grandma — — G.");
  });

  it("still fills a placeholder nothing has set yet", () => {
    const runner = new DialogueRunner(host() as never);
    runner.load(structuredClone(STALE_FILE) as never);
    expect(runner.substitute("{PLAYER}")).toBe("{PLAYER}");
    runner.load({
      meta: { schema_version: "1.0.0", acts: [3], locale: "en-US", placeholders: { PLAYER: "Ali" } },
      characters: {},
      scenes: {},
      pools: {},
    } as never);
    expect(runner.substitute("{PLAYER}")).toBe("Ali");
  });
});

describe("the save does not carry the canon names", () => {
  let store: typeof import("../src/stores/qrStore").useQRStore;
  const mem = new Map<string, string>();

  beforeAll(async () => {
    // An older save: placeholders persisted (version 1) with the pre-fix names.
    mem.set(
      "quiet-roads-save",
      JSON.stringify({
        state: {
          sceneId: "5.3",
          checkpoint: "chains_on",
          flags: { chains_mounted: true },
          placeholders: { GRANDMA_INITIALS: "G.J.", GRANDMA_NAME: "June", NICKNAME: "Al" },
        },
        version: 1,
      }),
    );
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    } as Storage;
    // zustand/persist defaults to `window.localStorage`, which node does not have;
    // the store only hydrates when that getter resolves.
    const shim = (globalThis as unknown as { localStorage: Storage }).localStorage;
    vi.stubGlobal("localStorage", shim);
    vi.stubGlobal("window", { localStorage: shim });
    store = (await import("../src/stores/qrStore")).useQRStore;
  });

  afterAll(() => vi.unstubAllGlobals());

  it("folds an old save's placeholders under canon on load", () => {
    const s = store.getState();
    expect(s.sceneId, "the rest of the save still loads").toBe("5.3");
    expect(s.checkpoint).toBe("chains_on");
    expect(s.placeholders.GRANDMA_INITIALS).toBe("— G.");
    expect(s.placeholders.GRANDMA_NAME).toBe("Grandma");
    expect(s.placeholders.NICKNAME).toBe("Al");
  });

  it("writes no placeholders back to storage", () => {
    store.getState().setFlag("chains_mounted", true);
    const written = JSON.parse(mem.get("quiet-roads-save") as string) as { state: Record<string, unknown> };
    expect(Object.keys(written.state)).not.toContain("placeholders");
    expect(written.state.flags).toEqual({ chains_mounted: true });
  });

  it("keeps canon through a reset", () => {
    store.getState().resetQuietRoads();
    const s = store.getState();
    expect(s.sceneId).toBeNull();
    expect(s.placeholders.GRANDMA_INITIALS).toBe("— G.");
    expect(s.placeholders.GRANDMA_NAME).toBe("Grandma");
  });
});

