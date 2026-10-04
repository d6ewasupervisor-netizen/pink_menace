/**
 * P3 — dispose what the act you left created.
 *
 * Three.js geometries and materials are normally freed by R3F when a component
 * unmounts, but the drive creates some imperatively (procedural textures,
 * instanced buffers built outside the JSX tree). Those would survive an act
 * change and leak.
 *
 * So: components register the disposables they built FOR AN ACT, and on an act
 * change we dispose the previous act's registry. Anything tagged `shared` is
 * kept — the highway RoadChunks in particular are reused by later acts, and
 * disposing them would blank the road.
 */

export interface Disposable {
  dispose: () => void;
}

type Entry = { act: string; shared: boolean; item: Disposable };

const registry: Entry[] = [];

/**
 * Register a geometry/material/etc. that belongs to one act.
 * `shared: true` marks something later acts still use — it is never disposed on
 * an act change (the highway chunks are the real case).
 */
export function registerActResource(act: string, item: Disposable, shared = false): () => void {
  const entry: Entry = { act, shared, item };
  registry.push(entry);
  return () => {
    const i = registry.indexOf(entry);
    if (i >= 0) registry.splice(i, 1);
  };
}

/** Everything registered for an act, shared or not. Used by the tests. */
export function actResourceCount(act: string, shared?: boolean): number {
  return registry.filter((e) => e.act === act && (shared === undefined || e.shared === shared)).length;
}

/**
 * Dispose the resources created for `act`. Shared entries are skipped. Returns
 * how many were actually disposed, so the caller (and the tests) can see it.
 */
export function disposeActResources(act: string): number {
  let disposed = 0;
  for (let i = registry.length - 1; i >= 0; i--) {
    const e = registry[i];
    if (e.act !== act || e.shared) continue;
    e.item.dispose();
    registry.splice(i, 1);
    disposed++;
  }
  return disposed;
}

/** Test seam: empty the registry. */
export function resetActResources(): void {
  registry.length = 0;
}