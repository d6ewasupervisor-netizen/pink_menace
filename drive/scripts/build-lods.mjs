#!/usr/bin/env node
/**
 * build-lods — the mobile twin of every heavy model.
 *
 * `vw_beetle.glb` is 10.55 MB: 17 1024x1024 PNGs (8.2 MB of the 10.55) and 64,188
 * triangles. A phone on a 4G connection downloads all of it before the first frame
 * of the drive. The fix is not one trick — it is a pipeline, and this file is the
 * pipeline so it can be re-run instead of re-done by hand:
 *
 *   dedup        → one copy of each texture
 *   prune        → drop what no material references
 *   texture plan → what each material actually needs (see TEXTURE_PLAN below)
 *   resize       → 1024 is the ceiling, per slot it is much lower
 *   webp         → the same picture in a third of the bytes
 *   weld         → one vertex per position instead of one per face
 *   simplify     → meshoptimizer's error-bounded collapse, 0.5 of the triangles
 *   quantize     → KHR_mesh_quantization, 16-bit positions / 8-bit normals + UVs
 *
 * WHAT SURVIVES AND WHY. `Vehicle.tsx` overwrites some of the Beetle's materials at
 * runtime, so a texture it overwrites is downloaded and never seen:
 *
 *   Chassi      baseColor → replaced by the procedural paint atlas (faded pink,
 *                           rust, roughness), so the model's own paint goes
 *   Chassi      normal/occlusion → KEPT at 512: the body keeps its panel lines
 *   Details_02  everything → the trim is forced to flat chrome, so nothing goes
 *   Details_01  baseColor/emissive → KEPT at 256: the taillight lens shapes
 *   Details_03  baseColor/emissive → KEPT at 256: the headlight lens shapes
 *   WheelF_*    all → KEPT at 512: the tyre and rim read at arm's length
 *
 * The material names and every node name are preserved exactly — `Vehicle.tsx`
 * finds its materials by name and `wheelRig.ts` finds the four wheels by name, so a
 * renamed LOD would silently lose the paint job or the rolling wheels.
 *
 * Usage:  node scripts/build-lods.mjs [--only cars/vw_beetle.glb] [--check]
 *   --check  generate into memory and print the numbers, write nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, quantize, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, '..');
const MODELS = path.join(DRIVE, 'public', 'models');

/** Models over this size get a twin. Every other model in the pack is ≤ 0.2 MB. */
export const LOD_THRESHOLD_BYTES = 500 * 1024;
/** The budget the phase asks for: a mobile Beetle at or under 1.5 MB. */
export const LOD_BUDGET_BYTES = 1_500_000;
/** The triangle ratio kept by `simplify`. */
export const SIMPLIFY_RATIO = 0.5;

/**
 * Per-slot texture sizes. `null` means "drop this slot": the runtime overwrites it,
 * so the bytes would be downloaded and never drawn. A number is the size the
 * texture is resized to (never up-scaled — `textureResize` only shrinks).
 */
const DEFAULT_PLAN = { baseColor: 1024, normal: 1024, metallicRoughness: 1024, emissive: 512, occlusion: 1024 };
const TEXTURE_PLAN = {
  'cars/vw_beetle.glb': {
    Chassi: { baseColor: null, normal: 512, metallicRoughness: 512, emissive: null, occlusion: 512 },
    Details_02: { baseColor: null, normal: null, metallicRoughness: null, emissive: null, occlusion: null },
    Details_01: { baseColor: 256, normal: 256, metallicRoughness: 256, emissive: 256, occlusion: null },
    Details_03: { baseColor: 256, normal: 256, metallicRoughness: 256, emissive: 256, occlusion: null },
    WheelF_Left__0: { baseColor: 512, normal: 512, metallicRoughness: 512, emissive: 512, occlusion: 512 },
  },
};

const SLOT_SETTERS = {
  baseColor: ['getBaseColorTexture', 'setBaseColorTexture'],
  normal: ['getNormalTexture', 'setNormalTexture'],
  metallicRoughness: ['getMetallicRoughnessTexture', 'setMetallicRoughnessTexture'],
  emissive: ['getEmissiveTexture', 'setEmissiveTexture'],
  occlusion: ['getOcclusionTexture', 'setOcclusionTexture'],
};

/** Every GLB under public/models with its size in bytes, largest first. */
export function listModels(dir = MODELS) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.toLowerCase().endsWith('.glb') && !entry.name.endsWith('.mobile.glb')) {
        out.push({ abs: p, rel: path.relative(MODELS, p).split(path.sep).join('/'), bytes: fs.statSync(p).size });
      }
    }
  };
  walk(dir);
  return out.sort((a, b) => b.bytes - a.bytes);
}

/** Aggregate triangle count of every mesh primitive in a document. */
export function triangleCount(doc) {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      const position = prim.getAttribute('POSITION');
      const count = indices ? indices.getCount() : position ? position.getCount() : 0;
      tris += Math.floor(count / 3);
    }
  }
  return tris;
}

/**
 * The mobile document for one model. Pure given the file: no network, no clock, no
 * randomness — `simplify` is deterministic for a fixed ratio and error.
 */
export async function buildLod(io, rel) {
  const doc = await io.read(path.join(MODELS, rel));
  const plan = TEXTURE_PLAN[rel] ?? {};

  // 1. One copy of each texture, and nothing no material points at.
  await doc.transform(dedup({ textures: true }), prune());

  // 2. Drop the slots the runtime overwrites, and cap the rest.
  const sizes = new Map(); // texture → the largest size any slot asked for
  for (const material of doc.getRoot().listMaterials()) {
    const slotPlan = plan[material.getName()] ?? DEFAULT_PLAN;
    for (const slot of Object.keys(SLOT_SETTERS)) {
      const [getter, setter] = SLOT_SETTERS[slot];
      const texture = material[getter]();
      if (!texture) continue;
      const size = slotPlan[slot];
      if (size === null) {
        material[setter](null);
        continue;
      }
      sizes.set(texture, Math.max(sizes.get(texture) ?? 0, size));
    }
  }
  await doc.transform(prune());

  // 3. Resize with sharp, one texture at a time (a shared texture is one file).
  for (const [texture, size] of sizes) {
    const image = texture.getImage();
    if (!image) continue;
    const meta = await sharp(Buffer.from(image)).metadata();
    if (!meta.width || !meta.height) continue;
    const largest = Math.max(meta.width, meta.height);
    const target = Math.min(size, largest);
    if (target >= largest) continue; // never up-scale
    const resized = await sharp(Buffer.from(image))
      .resize(target, null, { fit: 'inside' })
      .png()
      .toBuffer();
    texture.setImage(new Uint8Array(resized)).setMimeType('image/png');
  }

  // 4. WebP: the same picture, a third of the bytes.
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80 }));

  // 5. Geometry: weld duplicate vertices, then collapse half the triangles.
  await doc.transform(
    weld({ tolerance: 0 }),
    simplify({ simplifier: MeshoptSimplifier, ratio: SIMPLIFY_RATIO, error: 0.001 }),
  );

  // 6. Quantization last: it rewrites POSITION/NORMAL/UV into integer attributes,
  //    which only works once the geometry has stopped moving.
  await doc.transform(quantize());

  return doc;
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const check = args.includes('--check');

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  await MeshoptSimplifier.ready;

  const heavy = listModels().filter((m) => m.bytes > LOD_THRESHOLD_BYTES && (!only || m.rel === only));
  if (heavy.length === 0) {
    console.log(`No model over ${LOD_THRESHOLD_BYTES} bytes${only ? ` matching ${only}` : ''}.`);
    return;
  }

  console.log('model'.padEnd(30), 'before'.padStart(10), 'after'.padStart(9), 'triangles'.padStart(14), 'materials');
  for (const model of heavy) {
    const source = await io.read(path.join(MODELS, model.rel));
    const doc = await buildLod(io, model.rel);
    const glb = await io.writeBinary(doc);
    const out = model.abs.replace(/\.glb$/i, '.mobile.glb');
    if (!check) fs.writeFileSync(out, Buffer.from(glb));
    const ratio = ((glb.byteLength / model.bytes) * 100).toFixed(1);
    console.log(
      model.rel.padEnd(30),
      `${(model.bytes / 1024 / 1024).toFixed(2)} MB`.padStart(10),
      `${(glb.byteLength / 1024).toFixed(0)} kB`.padStart(9),
      `${triangleCount(source)} → ${triangleCount(doc)}`.padStart(14),
      `${ratio} % · ${doc.getRoot().listMaterials().map((m) => m.getName()).join(',')}`,
    );
    if (glb.byteLength > LOD_BUDGET_BYTES) {
      console.error(`  OVER BUDGET: ${glb.byteLength} > ${LOD_BUDGET_BYTES} bytes`);
      process.exitCode = 1;
    }
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invoked) await main();
