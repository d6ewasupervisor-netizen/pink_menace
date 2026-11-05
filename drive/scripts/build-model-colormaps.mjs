/**
 * build-model-colormaps — the FALLBACK atlas generator.
 *
 * Every Kenney GLB in the drive references `Textures/colormap.png` beside it.
 * That file was never shipped: the network asked for it on every load and the
 * SPA fallback answered `index.html`, so the image could never decode and any
 * surface the runtime does not repaint itself (NPC cars, cones, signs, lamps)
 * rendered flat. `proceduralKenneyTextures.ts` worked around it for the road and
 * the buildings; cars had nothing.
 *
 * The real atlases are in the build now — one per kit, copied verbatim out of
 * the packs each GLB came from (see `public/models/CREDITS.md`). This script is
 * what to run when a texture is *missing*: it reads each GLB's own TEXCOORD_0
 * bounds, so every UV a model uses lands on a painted pixel, and writes a
 * deterministic 512×512 atlas next to the model. Pure Node (zlib only) — no
 * image dependency, no network.
 *
 * It will NOT overwrite an atlas that is already there, because overwriting the
 * kit's own colormap with a stand-in is exactly the regression this was written
 * to end. `--force` does it deliberately.
 *
 * Run: `npm run build:colormaps` (from `drive/`), or `… -- --force`.
 * `vite build` copies `public/models` into `public/game/drive/models`, so the
 * output gets it too.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS = path.join(ROOT, "public", "models");
const SIZE = 512;

/** ── GLB ─────────────────────────────────────────────────────────────────── */
function readGlb(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  // The BIN chunk starts after the JSON chunk's header (8 bytes) and padding.
  const binStart = 20 + jsonLen + 8;
  return { json, bin: binStart < buf.length ? buf.subarray(binStart) : Buffer.alloc(0) };
}

/** The u/v rectangle an accessor covers; min/max when present, else the data. */
function accessorRect(json, bin, index) {
  const a = json.accessors?.[index];
  if (!a) return null;
  if (Array.isArray(a.min) && Array.isArray(a.max) && a.min.length >= 2) {
    return { minU: a.min[0], maxU: a.max[0], minV: a.min[1], maxV: a.max[1] };
  }
  const bv = json.bufferViews?.[a.bufferView];
  if (!bv) return null;
  const comps = { VEC2: 2, VEC3: 3, VEC4: 4 }[a.type] ?? 2;
  const start = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride || comps * 4;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < a.count; i++) {
    const o = start + i * stride;
    const u = bin.readFloatLE(o);
    const v = bin.readFloatLE(o + 4);
    minU = Math.min(minU, u); maxU = Math.max(maxU, u);
    minV = Math.min(minV, v); maxV = Math.max(maxV, v);
  }
  return Number.isFinite(minU) ? { minU, maxU, minV, maxV } : null;
}

/** Every u/v rectangle the GLB's primitives sample. */
function uvRects(json, bin) {
  const out = [];
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      for (const [key, index] of Object.entries(prim.attributes ?? {})) {
        if (!key.startsWith("TEXCOORD_")) continue;
        const rect = accessorRect(json, bin, index);
        if (rect) out.push(rect);
      }
    }
  }
  return out;
}

/** ── PNG (RGBA, zlib) ────────────────────────────────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = width * 4;
  const raw = Buffer.alloc((row + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (row + 1)] = 0;
    rgba.copy(raw, y * (row + 1) + 1, y * row, (y + 1) * row);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ── raster ──────────────────────────────────────────────────────────────── */
function raster() {
  const data = Buffer.alloc(SIZE * SIZE * 4);
  const put = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  };
  const box = (x0, y0, x1, y1, r, g, b) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(SIZE, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(SIZE, Math.ceil(x1)); x++) put(x, y, r, g, b);
  };
  return { data, put, box };
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Paint every used rectangle. `family` decides the palette; the rectangle comes
 * from the GLB's own UVs so nothing samples an empty pixel.
 */
function paintRects(entries, seed) {
  const r = raster();
  // A neutral base, so a missed pixel is a colour, not a hole.
  r.box(0, 0, SIZE, SIZE, 0x8a, 0x8d, 0x92);
  for (const { rect, style } of entries) {
    const x0 = Math.floor(Math.min(rect.minU, rect.maxU) * SIZE);
    const x1 = Math.ceil(Math.max(rect.minU, rect.maxU) * SIZE);
    // glTF UVs are bottom-left; three's GLTFLoader sets flipY = false.
    const y0 = Math.floor((1 - Math.max(rect.minV, rect.maxV)) * SIZE);
    const y1 = Math.ceil((1 - Math.min(rect.minV, rect.maxV)) * SIZE);
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    if (style === "road") {
      r.box(x0, y0, x1, y1, 0x33, 0x35, 0x39);
      r.box(x0 + w * 0.06, y0, x0 + w * 0.1, y1, 0xd8, 0xd8, 0xd2);
      r.box(x0 + w * 0.9, y0, x0 + w * 0.94, y1, 0xd8, 0xd8, 0xd2);
      const dash = Math.max(3, Math.round(h * 0.12));
      for (let y = y0; y < y1 - dash; y += dash * 2) r.box(x0 + w * 0.49, y, x0 + w * 0.52, y + dash, 0xd4, 0xa0, 0x17);
    } else if (style === "cone") {
      r.box(x0, y0, x1, y1, 0xd9, 0x6a, 0x1e);
      r.box(x0, y0 + h * 0.34, x1, y0 + h * 0.46, 0xf2, 0xf2, 0xee);
    } else if (style === "sign") {
      r.box(x0, y0, x1, y1, 0x1f, 0x5c, 0x3a);
      r.box(x0 + w * 0.08, y0 + h * 0.08, x1 - w * 0.08, y1 - h * 0.08, 0x2c, 0x7a, 0x4d);
      r.box(x0 + w * 0.2, y0 + h * 0.42, x1 - w * 0.2, y0 + h * 0.58, 0xf0, 0xf0, 0xea);
    } else if (style === "light") {
      r.box(x0, y0, x1, y1, 0x5e, 0x62, 0x66);
      r.box(x0 + w * 0.3, y0 + h * 0.08, x0 + w * 0.7, y0 + h * 0.24, 0xff, 0xe2, 0x9a);
    } else if (style === "barrier") {
      r.box(x0, y0, x1, y1, 0xe4, 0xe4, 0xdf);
      for (let y = y0; y < y1; y += Math.max(4, Math.round(h / 6))) {
        r.box(x0, y, x1, y + Math.max(2, Math.round(h / 12)), 0xc2, 0x2a, 0x2a);
      }
    } else if (style === "car") {
      // Paint-friendly: tintNpcBody multiplies this, so keep it light and even.
      r.box(x0, y0, x1, y1, 0xc8, 0xc9, 0xcb);
      r.box(x0, y0 + h * 0.62, x1, y1, 0xb4, 0xb5, 0xb8);
    } else if (style === "building") {
      const hue = hash(`${seed}:${x0}:${y0}`);
      const wall = [
        [0x9a, 0x8f, 0x82], [0x8d, 0x8a, 0x86], [0xa8, 0x9a, 0x86],
        [0x7f, 0x88, 0x90], [0xa9, 0xa1, 0x93],
      ][Math.floor(hue * 5)];
      r.box(x0, y0, x1, y1, wall[0], wall[1], wall[2]);
      const floors = Math.max(2, Math.round(h / 42));
      for (let f = 0; f < floors; f++) {
        const fy = y0 + (h * f) / floors;
        r.box(x0, fy, x1, fy + Math.max(1, h * 0.012), 0x55, 0x55, 0x58);
        const cols = Math.max(2, Math.round(w / 34));
        for (let c = 0; c < cols; c++) {
          const cx = x0 + (w * (c + 0.25)) / cols;
          r.box(cx, fy + (h / floors) * 0.22, cx + (w / cols) * 0.5, fy + (h / floors) * 0.66, 0x2f, 0x3a, 0x46);
        }
      }
      r.box(x0, y0, x1, y0 + Math.max(2, h * 0.04), 0x4a, 0x4a, 0x4c);
    } else {
      r.box(x0, y0, x1, y1, 0x9a, 0x9c, 0xa0);
      r.box(x0, y0, x1, y0 + Math.max(1, h * 0.1), 0x6f, 0x72, 0x76);
    }
  }
  return r.data;
}

/** One palette per model, so the shared road atlas still reads per prop. */
function styleOf(file) {
  const p = file.replace(/\\/g, "/").toLowerCase();
  if (/road-straight/.test(p)) return "road";
  if (/construction-cone/.test(p)) return "cone";
  if (/sign-highway/.test(p)) return "sign";
  if (/light-curved/.test(p)) return "light";
  if (/barrier/.test(p)) return "barrier";
  if (/\/buildings\//.test(p)) return "building";
  if (/\/cars\//.test(p)) return "car";
  return "prop";
}

/** ── main ────────────────────────────────────────────────────────────────── */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.toLowerCase().endsWith(".glb")) out.push(p);
  }
  return out;
}

const groups = new Map(); // absolute atlas path -> { entries, style, seed, sources }
for (const glb of walk(MODELS)) {
  const { json, bin } = readGlb(glb);
  const external = (json.images ?? []).filter((i) => typeof i.uri === "string" && !i.uri.startsWith("data:"));
  if (external.length === 0) continue;
  const style = styleOf(glb);
  const rects = uvRects(json, bin);
  for (const image of external) {
    const out = path.resolve(path.dirname(glb), image.uri);
    const g = groups.get(out) ?? { entries: [], seed: path.basename(glb), sources: [] };
    for (const rect of rects) g.entries.push({ rect, style });
    g.sources.push(path.relative(ROOT, glb));
    groups.set(out, g);
  }
}

const FORCE = process.argv.includes("--force");
let written = 0;
let kept = 0;
for (const [out, g] of groups) {
  if (g.entries.length === 0) {
    console.warn(`! ${path.relative(ROOT, out)}: no TEXCOORD_0 in ${g.sources.join(", ")} — skipped`);
    continue;
  }
  // An atlas that is already there is the kit's own colormap. Leave it.
  if (!FORCE && fs.existsSync(out)) {
    kept++;
    console.log(`= ${path.relative(ROOT, out)} (present, kept)`);
    continue;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, png(SIZE, SIZE, paintRects(g.entries, g.seed)));
  written++;
  const styles = [...new Set(g.entries.map((e) => e.style))].join("+");
  console.log(`+ ${path.relative(ROOT, out)} (${styles}, ${g.entries.length} uv rects)`);
}
console.log(
  `\n${written} atlas${written === 1 ? "" : "es"} written, ${kept} kept` +
  ` — from ${groups.size} referenced path${groups.size === 1 ? "" : "s"}.` +
  (FORCE ? "" : " (pass --force to overwrite a present atlas)"),
);

