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
import crypto from "node:crypto";
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


/**
 * The atlases are the KITS' own colormaps, copied verbatim out of the packs the
 * GLBs came from — not the generated stand-ins. The generator painted every UV
 * rectangle a placeholder colour, which is why the world read as a texture-less
 * kit bash; the moment a `npm run build:colormaps` overwrote one of these the
 * look would quietly come back without a single test noticing.
 *
 * Each entry is the file, the SHA-256 of the pack's own `Textures/colormap.png`,
 * and the pack + version it came from (the version is the one on the pack's own
 * `License.txt`). `public/models/CREDITS.md` carries the same table and the
 * download URLs.
 */
const PACKED_COLORMAPS = [
  {
    file: "cars/Textures/colormap.png",
    sha256: "2AB4AAD26098BBF8258BE9A884527F9F61438F35F40ED9DBF1A195BAD9F793FE",
    bytes: 11988,
    pack: "Car Kit",
    version: "3.0",
  },
  {
    file: "road/Textures/colormap.png",
    sha256: "EBBDAADF298F684EE534D0E63E2BDB223F7501DA9FC13EB7BCDC94489162ACA5",
    bytes: 8658,
    pack: "City Kit (Roads)",
    version: "2.0",
  },
  {
    file: "buildings/Textures/colormap.png",
    sha256: "9B5DE86078C25EF02351A80D35FF3C978693A1044565B73EEDD9AE9B5B80665D",
    bytes: 11784,
    pack: "City Kit (Suburban)",
    version: "2.0",
  },
  {
    file: "buildings-modular/Textures/colormap.png",
    sha256: "66FD49BE148F32E88F6C8CACE67120250D1943A7856601158AD0FF24651DB0B0",
    bytes: 7529,
    pack: "Modular Buildings",
    version: "2.1",
  },
] as const;

describe("the atlas beside each kit is the kit's own", () => {
  const root = path.join(DRIVE, "public", "models");

  for (const c of PACKED_COLORMAPS) {
    it(`${c.file} is ${c.pack} ${c.version}`, () => {
      const file = path.join(root, c.file);
      expect(fs.existsSync(file), `${c.file} is missing`).toBe(true);
      const bytes = fs.readFileSync(file);
      expect(bytes.length, `${c.file} size`).toBe(c.bytes);
      expect(crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase()).toBe(c.sha256);
    });
  }

  /**
   * The split exists because two packs ship two different colormaps and one
   * folder can only carry one. A modular sample dropped back into `buildings/`
   * would sample the suburban palette, so pin which GLB lives where.
   */
  it("keeps the two building kits in their own folders", () => {
    const list = (dir: string) =>
      fs.readdirSync(path.join(root, dir)).filter((f) => f.toLowerCase().endsWith(".glb")).sort();
    expect(list("buildings")).toEqual([
      "building-type-a.glb",
      "building-type-b.glb",
      "building-type-c.glb",
      "building-type-d.glb",
      "building-type-e.glb",
    ]);
    expect(list("buildings-modular")).toEqual([
      "building-sample-house-a.glb",
      "building-sample-tower-a.glb",
      "building-sample-tower-b.glb",
    ]);
  });

  it("no GLB sits in a folder that has no atlas beside it", () => {
    const missing: string[] = [];
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      const glbs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".glb"));
      if (glbs.length === 0) continue;
      const refs = glbs.flatMap((g) => externalImages(path.join(dir, g)));
      if (refs.length === 0) continue;
      for (const uri of refs) {
        if (!fs.existsSync(path.resolve(dir, uri))) missing.push(`${entry.name}/${uri}`);
      }
    }
    expect(missing, "every referenced atlas is present").toEqual([]);
  });
});

describe("a missing texture is a 404, not the SPA", () => {
  it("registers the /drive/models + /drive/assets 404 before the SPA fallback", () => {
    // The network tab looked fine while the world rendered flat: the SPA fallback
    // answered a missing `Textures/colormap.png` with index.html and a 200. Order
    // is the whole fix — a 404 registered after the fallback never runs.
    const server = fs.readFileSync(path.resolve(DRIVE, "..", "server.js"), "utf8");
    const notFound = server.search(/app\.use\(\s*\[[^\]]*"\/drive\/models"[^\]]*"\/drive\/assets"[^\]]*\]/);
    expect(notFound, "server.js must 404 a missing model/asset").toBeGreaterThan(-1);
    expect(server.slice(notFound, notFound + 260)).toMatch(/status\(404\)/);

    const spaFallback = server.search(/app\.get\(\s*\[\s*"\/drive"/);
    expect(spaFallback, "server.js must still serve the drive's index.html").toBeGreaterThan(-1);
    expect(notFound, "the 404 must be registered before the SPA fallback").toBeLessThan(spaFallback);
  });
});
