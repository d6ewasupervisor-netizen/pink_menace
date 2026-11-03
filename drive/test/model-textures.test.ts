/**
 * Every texture a GLB references must exist in the build.
 *
 * The Kenney GLBs reference `Textures/colormap.png` relative to themselves. That
 * file was never bundled, so each load asked the server for it, the SPA fallback
 * answered `index.html` with a 200, and the image could never decode — the world
 * rendered flat and the network tab looked fine. `scripts/build-model-colormaps.mjs`
 * generates the atlas from each GLB's own UV bounds; this test is the guard that
 * the generated file is present in both the source tree and the build output.
 *
 * It also checks the PNG signature, because "the file exists" is exactly the kind
 * of thing the old fallback made true while nothing usable was being served.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, "..");
const TREES = [
  { label: "source (drive/public/models)", root: path.join(DRIVE, "public", "models"), required: true },
  // Build output is gitignored (Vite writes it at deploy), so this half only runs
  // where a build exists. `vite` copies `public/` verbatim; the source check is
  // the one that can fail in a fresh checkout.
  { label: "build (public/game/drive/models)", root: path.resolve(DRIVE, "..", "public", "game", "drive", "models"), required: false },
];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.toLowerCase().endsWith(".glb")) out.push(p);
  }
  return out;
}

/** The external image URIs a GLB names (embedded images have no uri). */
function externalImages(glb: string): string[] {
  const buf = fs.readFileSync(glb);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${glb}: not a GLB`);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8")) as {
    images?: { uri?: string; bufferView?: number }[];
  };
  return (json.images ?? [])
    .map((i) => i.uri)
    .filter((uri): uri is string => typeof uri === "string" && !uri.startsWith("data:"))
    .map((uri) => uri.replace(/\\/g, "/"));
}

describe("every GLB texture exists", () => {
  for (const tree of TREES) {
    const present = fs.existsSync(tree.root);
    it.skipIf(!tree.required && !present)(`${tree.label}: references resolve to real images`, () => {
      const glbs = walk(tree.root);
      expect(glbs.length, `${tree.label}: no GLBs found under ${tree.root}`).toBeGreaterThan(0);

      const missing: string[] = [];
      let referenced = 0;
      for (const glb of glbs) {
        for (const uri of externalImages(glb)) {
          referenced++;
          const file = path.resolve(path.dirname(glb), uri);
          if (!fs.existsSync(file)) {
            missing.push(`${path.relative(tree.root, glb)} -> ${uri}`);
            continue;
          }
          const head = fs.readFileSync(file).subarray(0, 8);
          if (uri.toLowerCase().endsWith(".png") && !head.equals(PNG_SIGNATURE)) {
            missing.push(`${path.relative(tree.root, glb)} -> ${uri} (not a PNG)`);
          }
        }
      }
      expect(missing, `missing textures under ${tree.root}`).toEqual([]);
      expect(referenced, `${tree.label}: no external texture reference is being checked`).toBeGreaterThan(0);
    });
  }
});
