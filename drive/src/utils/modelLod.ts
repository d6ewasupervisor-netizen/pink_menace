/**
 * modelLod — which copy of a model a tier should fetch.
 *
 * Item 2.2: `scripts/build-lods.mjs` writes a `*.mobile.glb` twin beside every model
 * over 500 KB. The twins are not decoration — the Beetle goes from 10.55 MB to
 * 1.01 MB (9.3 %) and 64,188 triangles to 36,658 — and only the high tier pays for
 * the original. The list below is the contract: a file named here must exist, and
 * `test/model-lod.test.ts` fails if it does not (or if it drifted over budget).
 *
 * Paths are the public URL paths the loader uses (`asset()` adds the deploy base).
 */
export const MOBILE_LOD_MODELS = ['/models/cars/vw_beetle.glb'] as const;

/** Does this model ship a mobile twin? Case- and query-tolerant. */
export function hasMobileLod(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return (MOBILE_LOD_MODELS as readonly string[]).map((u) => u.toLowerCase()).includes(clean);
}

/**
 * The URL to load. `high` always gets the original; `low` and `mid` get the twin
 * where one exists and the original otherwise (every other model is ≤ 0.2 MB, so a
 * twin would save nothing worth a second file).
 */
export function lodUrl(url: string, tier: 'low' | 'mid' | 'high'): string {
  if (tier === 'high' || !hasMobileLod(url)) return url;
  return url.replace(/\.glb$/i, '.mobile.glb');
}
