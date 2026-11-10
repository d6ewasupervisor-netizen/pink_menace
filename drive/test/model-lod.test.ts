/**
 * The mobile twin of the Beetle is real, small, and still the same car.
 *
 * `vw_beetle.glb` is 10.55 MB — 17 1024x1024 PNGs and 64,188 triangles, downloaded
 * before the first frame of a phone drive. `scripts/build-lods.mjs` writes
 * `vw_beetle.mobile.glb` beside it (1.01 MB, 36,658 triangles) and the tier picks
 * between them (`utils/modelLod.ts`). This file is the guard on that pipeline, and
 * it checks the part that would fail silently:
 *
 *   - the file exists and is inside the 1.5 MB budget;
 *   - every MATERIAL name and every NODE name survived, because `Vehicle.tsx`
 *     finds the paint job by material name and `wheelRig.ts` finds the four wheels
 *     by node name — a renamed LOD loses the paint or the rolling wheels and looks
 *     fine in a screenshot;
 *   - the extensions it uses are ones three.js's GLTFLoader reads (webp, quantize);
 *   - it is the same car: the triangle count fell, but not to a blob;
 *   - `lodUrl` sends high to the original and low/mid to the twin.
 *
 * The ratio (≤ 40 %) is the honest "this saved something worth a second file" line.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MOBILE_LOD_MODELS, hasMobileLod, lodUrl } from "../src/utils/modelLod";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, "..");
const MODELS = path.join(DRIVE, "public", "models");

const BUDGET_BYTES = 1_500_000;
const MAX_RATIO = 0.4;

const twinPath = (url: string) => path.join(MODELS, url.replace(/^\/models\//, "").replace(/\.glb$/i, ".mobile.glb"));
const sourcePath = (url: string) => path.join(MODELS, url.replace(/^\/models\//, ""));

function triangles(doc: { getRoot: () => { listMeshes: () => { listPrimitives: () => { getIndices: () => { getCount: () => number } | null; getAttribute: (n: string) => { getCount: () => number } | null }[] }[] } }): number {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      const position = prim.getAttribute("POSITION");
      tris += Math.floor((indices ? indices.getCount() : position ? position.getCount() : 0) / 3);
    }
  }
  return tris;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

describe("every model that ships a mobile twin", () => {
  it("is over the 500 kB line the build script uses", () => {
    expect(MOBILE_LOD_MODELS.length).toBeGreaterThan(0);
    for (const url of MOBILE_LOD_MODELS) {
      const bytes = fs.statSync(sourcePath(url)).size;
      expect(bytes, `${url} is worth a twin`).toBeGreaterThan(500 * 1024);
    }
  });

  for (const url of MOBILE_LOD_MODELS) {
    describe(url, () => {
      const twin = twinPath(url);
      const original = sourcePath(url);

      it("exists, and the build script is committed beside it", () => {
        expect(fs.existsSync(twin), `${twin} exists (run node scripts/build-lods.mjs)`).toBe(true);
        expect(fs.existsSync(path.join(DRIVE, "scripts", "build-lods.mjs"))).toBe(true);
      });

      it(`is at or under ${BUDGET_BYTES / 1000} kB and at most ${MAX_RATIO * 100} % of the original`, () => {
        const bytes = fs.statSync(twin).size;
        expect(bytes).toBeLessThanOrEqual(BUDGET_BYTES);
        expect(bytes / fs.statSync(original).size).toBeLessThanOrEqual(MAX_RATIO);
      });

      it("keeps every material and node name the runtime looks up", async () => {
        const [a, b] = await Promise.all([io.read(original), io.read(twin)]);
        expect(b.getRoot().listMaterials().map((m) => m.getName()).sort()).toEqual(
          a.getRoot().listMaterials().map((m) => m.getName()).sort(),
        );
        expect(b.getRoot().listNodes().map((n) => n.getName()).sort()).toEqual(
          a.getRoot().listNodes().map((n) => n.getName()).sort(),
        );
        // The two names that would break something visible, spelled out.
        for (const name of ["Chassi", "Details_01", "Details_02", "Details_03", "WheelF_Left__0"]) {
          expect(b.getRoot().listMaterials().map((m) => m.getName())).toContain(name);
        }
        for (const name of ["WheelF_Left", "WheelF_Right", "WheelR_Left", "WheelR_Right"]) {
          expect(b.getRoot().listNodes().map((n) => n.getName())).toContain(name);
        }
      });

      it("uses only extensions three's GLTFLoader reads", async () => {
        const doc = await io.read(twin);
        const used = doc.getRoot().listExtensionsUsed().map((e) => e.extensionName);
        for (const ext of used) {
          expect(["EXT_texture_webp", "KHR_mesh_quantization"], `${ext} is a GLTFLoader extension`).toContain(ext);
        }
      });

      it("is the same car: fewer triangles, not a blob", async () => {
        const [a, b] = await Promise.all([io.read(original), io.read(twin)]);
        const before = triangles(a);
        const after = triangles(b);
        expect(after).toBeLessThan(before * 0.8);
        expect(after).toBeGreaterThan(before * 0.25);
        expect(b.getRoot().listMeshes().length).toBe(a.getRoot().listMeshes().length);
      });
    });
  }
});

describe("lodUrl", () => {
  it("gives high the original and low/mid the twin", () => {
    expect(lodUrl("/models/cars/vw_beetle.glb", "high")).toBe("/models/cars/vw_beetle.glb");
    expect(lodUrl("/models/cars/vw_beetle.glb", "mid")).toBe("/models/cars/vw_beetle.mobile.glb");
    expect(lodUrl("/models/cars/vw_beetle.glb", "low")).toBe("/models/cars/vw_beetle.mobile.glb");
  });

  it("leaves a model with no twin alone on every tier", () => {
    for (const tier of ["low", "mid", "high"] as const) {
      expect(lodUrl("/models/cars/truck.glb", tier)).toBe("/models/cars/truck.glb");
    }
    expect(hasMobileLod("/models/cars/truck.glb")).toBe(false);
    expect(hasMobileLod("/models/cars/vw_beetle.glb")).toBe(true);
  });

  it("tolerates a cache-busting query and a different case in the extension", () => {
    expect(hasMobileLod("/models/cars/vw_beetle.glb?v=2")).toBe(true);
    expect(lodUrl("/models/cars/vw_beetle.GLB", "low")).toBe("/models/cars/vw_beetle.mobile.glb");
  });
});
