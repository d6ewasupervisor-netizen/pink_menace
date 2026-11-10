/**
 * The bytes a phone pays for before it plays (item 2.3).
 *
 * A file size is the one part of "cheap and fast on phones" that no throttling can
 * argue with, so it is asserted here on the real build output rather than guessed at
 * from the graph. Three claims:
 *
 *   1. THE ENTRY CHUNK IS THE SHELL. `index.html` names the entry; it must stay under
 *      ENTRY_BUDGET_BUDGET_BYTES gzipped. It used to be the entire game — 1,326 kB
 *      gzip — because `App.tsx` imported drei's `useProgress` and the wrapper imported
 *      `Game3D` statically.
 *   2. FIRST-LOAD JS IS UNDER 1.5 MB GZIP: the shell plus the 3D chunk, and nothing
 *      that belongs to a later act or to the legacy highway world.
 *   3. THE SPLITS EXIST AS FILES. The 3D stack and the legacy world are separate
 *      chunks, and the legacy world's chunks are not reachable from the entry in one
 *      hop — if they were, lazy loading them would have bought nothing.
 *
 * The build output (`public/game/drive`) is gitignored — Vite writes it at deploy — so
 * this suite skips, with that reason, in a fresh checkout. Run `npm run build` to arm
 * it (`test/model-textures.test.ts` follows the same rule for the same reason).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, "..");
const BUILD = path.resolve(DRIVE, "..", "public", "game", "drive");
const present = fs.existsSync(path.join(BUILD, "index.html"));

/** The shell: auth, the boot screen, the store, the story bridge. */
const ENTRY_BUDGET_BYTES = 600 * 1024;
/** Everything JS-shaped that a first frame needs (shell + 3D stack). */
const FIRST_LOAD_JS_BUDGET_BYTES = 1_500 * 1024;

const gzipBytes = (file: string) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).byteLength;

/** `assets/…` file names named by index.html. */
function entryAssets(): string[] {
  const html = fs.readFileSync(path.join(BUILD, "index.html"), "utf8");
  return [...html.matchAll(/assets\/[^"')]+?\.js/g)].map((m) => m[0]);
}

function jsChunks(): { name: string; file: string; bytes: number }[] {
  const dir = path.join(BUILD, "assets");
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".js"))
    .map((name) => ({
      name,
      file: path.join(dir, name),
      // gzip on disk sizes is what a phone pays after the server compresses.
      bytes: gzipBytes(path.join(dir, name)),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

/** Chunks that are not part of the first load, by name. */
const DEFERRED = /^(dialogue_act|RoadChunks|TrafficRenderer|Collectibles|CollisionSystem)/;

describe.skipIf(!present)("first load, measured on the build output", () => {
  it("the entry chunk is the shell, not the game", () => {
    const entries = entryAssets();
    expect(entries.length, "index.html names a module entry").toBeGreaterThan(0);
    for (const rel of entries) {
      const bytes = gzipBytes(path.join(BUILD, rel));
      expect(bytes, `${rel} is gzip ${(bytes / 1024).toFixed(0)} kB`).toBeLessThan(ENTRY_BUDGET_BYTES);
    }
  });

  it(`everything a first frame needs is under ${FIRST_LOAD_JS_BUDGET_BYTES / 1024} kB gzip`, () => {
    const eager = jsChunks().filter((c) => !DEFERRED.test(c.name));
    const total = eager.reduce((s, c) => s + c.bytes, 0);
    expect(total, `first-load JS ${(total / 1024).toFixed(0)} kB gzip`).toBeLessThan(FIRST_LOAD_JS_BUDGET_BYTES);
    // The 3D stack is its own file, and it is most of that budget.
    const three = eager.find((c) => /^(ZombieRoadWarrior|index)-/.test(c.name) && c.name.startsWith("ZombieRoadWarrior"));
    expect(three, "the 3D stack is its own chunk").toBeTruthy();
  });

  it("the legacy highway world and the later acts are separate, deferred files", () => {
    const names = jsChunks().map((c) => c.name);
    for (const prefix of ["RoadChunks", "TrafficRenderer", "Collectibles", "CollisionSystem"]) {
      expect(names.some((n) => n.startsWith(prefix)), `${prefix} is its own chunk`).toBe(true);
    }
    // Act II's dialogue must be a file of its own too — it is what the debrief preloads.
    expect(names.some((n) => n.startsWith("dialogue_act2-")), "Act II is a chunk").toBe(true);
    // Nothing deferred may be pulled in by the entry chunk's static import list.
    const entry = [...entryAssets()].map((rel) => path.join(BUILD, rel)).map((f) => fs.readFileSync(f, "utf8")).join("\n");
    const staticImports = [...entry.matchAll(/from"\.\/([A-Za-z0-9_-]+)-[A-Za-z0-9_-]{8}\.js"/g)].map((m) => m[1]);
    for (const name of staticImports) {
      expect(DEFERRED.test(name), `the entry statically imports ${name}`).toBe(false);
    }
  });

  it("the Beetle a phone fetches is the twin", () => {
    const twin = path.join(BUILD, "models", "cars", "vw_beetle.mobile.glb");
    expect(fs.existsSync(twin), "vw_beetle.mobile.glb is copied into the build").toBe(true);
    const bytes = fs.statSync(twin).size;
    expect(bytes, `the mobile car is ${(bytes / 1024).toFixed(0)} kB`).toBeLessThan(2 * 1024 * 1024);
  });
});
