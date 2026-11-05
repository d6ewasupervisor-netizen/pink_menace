/**
 * emitInventory — the measured side of the deadlock guard.
 *
 * A story wait is invisible: if nothing in the game ever emits its event the
 * runner stops and the player has no surface to act on. 5.3 did exactly that
 * (`cutscene.summit_clear`), and the static guard has to be able to see it
 * without a hand-kept list of event names — the codebase has been burned by
 * hand-kept lists before (`test/coverage.test.ts`).
 *
 * So the emitter set is read from the source: every event-shaped string literal
 * in `drive/src` counts, because events flow through helpers and ternaries
 * (`next("tutorial.step.throttle")`, `ev.fire(input.run ? "door.slam" : …)`,
 * `once(\`bridge.wait:${mark}\`)`), and a call-argument scan misses most of them.
 * Two prefixes are added by rule:
 *
 *  - `cutscene.` — quietroads/waitWatch.ts answers any cutscene mark when no
 *    mission owns the wait (the fix for 5.3 and 3.4's `cutscene.gracie_yell`);
 *  - the names inside `SpokaneRun.onStoryWait`'s owned set, which the sim fires
 *    through a variable, so no literal sits at a `fire(...)` call site.
 *
 * Template literals are cut at `${`, so `` `waypoint.reach:${id}` `` becomes the
 * prefix `waypoint.reach:` and matches every concrete zone id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CUTSCENE_EVENT_PREFIX } from "../src/quietroads/waitWatch";

export interface DialogueFileData {
  file: string;
  /** Parsed JSON. */
  data: {
    scenes?: Record<string, {
      nodes?: Record<string, { type?: string; wait_for?: string }>;
      triggers?: { event: string; node: string }[];
    }>;
  };
}

export interface Emitter {
  name: string;
  /** Which source file carries the literal. */
  where: string;
}

export interface Orphan {
  kind: "wait" | "trigger";
  scene: string;
  node: string;
  event: string;
}

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const DATA = path.join(SRC, "quietroads", "data");

/** `merge.`, `shop.buy:`, `bridge.wait:15`, `cutscene.summit_clear`, … */
const EVENT_NAME = /^[a-z][a-z0-9_]*[.:][a-zA-Z0-9_\-.:]*$/;
const LITERAL = /'([^'\\\n]+)'|"([^"\\\n]+)"|`([^`\\\n]+)`/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

/** Comments are prose; a name mentioned in one is not an emitter. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ");
}

export function emittedEvents(): Emitter[] {
  const out = new Map<string, string>();
  for (const file of walk(SRC)) {
    const text = stripComments(fs.readFileSync(file, "utf8"));
    LITERAL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LITERAL.exec(text))) {
      let name = m[1] ?? m[2] ?? m[3];
      const cut = name.indexOf("${");
      if (cut >= 0) name = name.slice(0, cut);
      if (!EVENT_NAME.test(name)) continue;
      if (!out.has(name)) out.set(name, path.relative(SRC, file));
    }
  }

  // The rule that answers cutscene marks with no mission behind them.
  out.set(CUTSCENE_EVENT_PREFIX, "quietroads/waitWatch.ts");

  // onStoryWait fires names held in a Set, so read the Set itself. If the shape
  // ever changes this throws instead of silently reporting false orphans.
  const spokane = fs.readFileSync(path.join(SRC, "quietroads", "sim", "spokane.ts"), "utf8");
  const owned = /const owned = new Set\(\[([\s\S]*?)\]\)/.exec(spokane);
  if (!owned) throw new Error("emitInventory: could not read SpokaneRun.onStoryWait's owned set");
  for (const m of owned[1].matchAll(/"([^"]+)"/g)) {
    if (!out.has(m[1])) out.set(m[1], "quietroads/sim/spokane.ts (onStoryWait)");
  }

  return [...out].map(([name, where]) => ({ name, where })).sort((a, b) => a.name.localeCompare(b.name));
}

/** DialogueRunner.eventMatches, verbatim: a pattern ending in `.`/`:` is a prefix. */
export function eventMatches(pattern: string, name: string): boolean {
  return pattern === name || (pattern.endsWith(":") || pattern.endsWith(".") ? name.startsWith(pattern) : false);
}

/**
 * The emitter that answers `required`, if any. Both directions of the prefix
 * rule matter: a wait may be written as a prefix (`merge.`) and an emitter may
 * be one (`waypoint.reach:` from a template literal).
 */
export function emitterFor(required: string, emitters: Emitter[] = emittedEvents()): string | null {
  for (const e of emitters) {
    if (eventMatches(required, e.name)) return e.name;
    if ((e.name.endsWith(":") || e.name.endsWith(".")) && required.startsWith(e.name)) return e.name;
  }
  return null;
}

export function dialogueFiles(): DialogueFileData[] {
  return fs
    .readdirSync(DATA)
    .filter((f) => f.startsWith("dialogue_act") && f.endsWith(".json"))
    .sort()
    .map((file) => ({ file, data: JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) }));
}

/** Every `wait_for` and every `triggers[].event` whose event nothing emits. */
export function orphans(emitters: Emitter[] = emittedEvents()): Orphan[] {
  const out: Orphan[] = [];
  for (const { data } of dialogueFiles()) {
    for (const [scene, sc] of Object.entries(data.scenes ?? {})) {
      for (const [node, n] of Object.entries(sc.nodes ?? {})) {
        if (n.wait_for && !emitterFor(n.wait_for, emitters)) out.push({ kind: "wait", scene, node, event: n.wait_for });
      }
      for (const t of sc.triggers ?? []) {
        if (!emitterFor(t.event, emitters)) out.push({ kind: "trigger", scene, node: t.node, event: t.event });
      }
    }
  }
  return out;
}

/**
 * Events that are deliberately not wired, with the surface they belong to.
 *
 * The shop counter used to be here. It was not "off the forward path" as this
 * list claimed: 5.2.block sends the player to 2.8, and with no way to buy the
 * chains the only exit was 2.8.end_reblocked -> 5.1 -> 5.2.block again, forever.
 * The counter is ported now (`quietroads/shop.ts` + `ShopCounter.tsx`), so
 * `shop.buy:*`, `shop.cant_afford`, `shop.front:chains` and `shop.close` are
 * emitted by the bridge and are no longer allow-listed.
 *
 * What is left is the tow-strap gesture (3.3), which really is off the path:
 * 3.3's tow branch does not wait on it. Listed so the guard fails on anything
 * NEW and so the gap stays visible (AUDIT §27).
 */
export const UNWIRED: { pattern: string; reason: string }[] = [
  { pattern: "qte.strap.", reason: "the tow-strap gesture is not ported; 3.3's tow path does not wait on it" },
];

/** The allow-listed reason for an orphaned event, or null. */
export function unwiredReason(event: string): string | null {
  const hit = UNWIRED.find((u) => event.startsWith(u.pattern));
  return hit ? hit.reason : null;
}
