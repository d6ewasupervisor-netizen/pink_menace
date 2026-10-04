/**
 * P14 — draw merging for Kent. Pure data → instancing batches.
 *
 * KentWorld used to mount one <mesh> per building and one <mesh> per dash.
 * These helpers turn those into batches: N plain buildings collapse to one
 * InstancedMesh per material instead of N meshes.
 *
 * Two rules this file never breaks:
 *   - nothing about a building's position, size or colour changes;
 *   - colliders are NOT merged. Every building still gets its own fixed
 *     CuboidCollider (see buildingColliders), so the car stops exactly as before.
 */

export interface Rect { x: number; y: number; w: number; h: number }
export interface BuildingDef { rect: Rect; label?: string }

/** Labels that already have their own component and must not be batched. */
export const UNIQUE_BUILDING_LABELS = new Set(['DOL', 'PHARMACY', 'WAREHOUSE']);

/** Height + colour for a plain building — copied verbatim from KentWorld. */
export function plainBuildingShape(r: Rect, label?: string): { h: number; color: string } {
  const h = label === 'KENT MIDDLE' ? 7 : label === 'SANCTUARY' ? 3.6 : label === 'RADIO' ? 3.2 : 4 + ((r.x * 7 + r.y * 3) % 3);
  const color = label === 'KENT MIDDLE' ? '#a8895e' : label === 'SANCTUARY' ? '#6e5a68' : label === 'RADIO' ? '#3d5166' : '#7c7368';
  return { h, color };
}

/** True when this building draws from a batch rather than its own component. */
export function isPlainBuilding(b: BuildingDef): boolean {
  return !b.label || !UNIQUE_BUILDING_LABELS.has(b.label);
}

/** One instance: a box at the building's own position and size. */
export interface BuildingInstance {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
}

/** One InstancedMesh's worth of buildings — one material, N instances. */
export interface BuildingBatch {
  color: string;
  instances: BuildingInstance[];
}

/**
 * Group the repeated plain buildings into one batch per material.
 * Unique buildings (DOL / PHARMACY / WAREHOUSE) are excluded — they keep their
 * own component.
 */
export function batchPlainBuildings(buildings: BuildingDef[]): BuildingBatch[] {
  const byColor = new Map<string, BuildingInstance[]>();
  for (const b of buildings) {
    if (!isPlainBuilding(b)) continue;
    const { h, color } = plainBuildingShape(b.rect, b.label);
    const list = byColor.get(color);
    const instance: BuildingInstance = {
      x: b.rect.x + b.rect.w / 2, y: h / 2, z: b.rect.y + b.rect.h / 2,
      sx: b.rect.w, sy: h, sz: b.rect.h,
    };
    if (list) list.push(instance); else byColor.set(color, [instance]);
  }
  return [...byColor.entries()].map(([color, instances]) => ({ color, instances }));
}

/**
 * Colliders for the batched buildings — one fixed CuboidCollider per building,
 * in the same order as the batches, so the car still stops against every wall.
 * These are deliberately NOT merged into one body.
 */
export function buildingColliders(buildings: BuildingDef[]): { x: number; y: number; z: number; hx: number; hy: number; hz: number }[] {
  const out: { x: number; y: number; z: number; hx: number; hy: number; hz: number }[] = [];
  for (const b of buildings) {
    if (!isPlainBuilding(b)) continue;
    const { h } = plainBuildingShape(b.rect, b.label);
    out.push({
      x: b.rect.x + b.rect.w / 2, y: h / 2, z: b.rect.y + b.rect.h / 2,
      hx: b.rect.w / 2, hy: h / 2, hz: b.rect.h / 2,
    });
  }
  return out;
}

/** One dash mark lying on the road. */
export interface DashInstance {
  x: number; z: number; len: number; rot: number;
}

/**
 * Lay dashes along a line — the same maths Dashes() used, but as data so the
 * caller can put them in one InstancedMesh instead of one mesh each.
 */
export function dashInstances(
  a: { x: number; y: number },
  b: { x: number; y: number },
  dash = 3, gap = 3,
): DashInstance[] {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L <= 0) return [];
  const ux = dx / L, uy = dy / L;
  const rot = Math.atan2(dy, dx);
  const out: DashInstance[] = [];
  for (let d = 0; d < L; d += dash + gap) {
    const len = Math.min(dash, L - d);
    out.push({ x: a.x + ux * (d + len / 2), z: a.y + uy * (d + len / 2), len, rot });
  }
  return out;
}

/** Concatenate several lines' dashes into one batch for a single colour. */
export function batchDashes(lines: [ { x: number; y: number }, { x: number; y: number } ][]): DashInstance[] {
  const out: DashInstance[] = [];
  for (const [a, b] of lines) out.push(...dashInstances(a, b));
  return out;
}

/**
 * The thin parapet each plain building used to draw on top of itself. Same rule
 * as before: 0.6 m wider than the building, 0.3 m thick, `#3a352f`. One batch,
 * because every roof shares that one colour.
 */
export function batchBuildingRoofs(buildings: BuildingDef[]): BuildingInstance[] {
  const out: BuildingInstance[] = [];
  for (const b of buildings) {
    if (!isPlainBuilding(b)) continue;
    const { h } = plainBuildingShape(b.rect, b.label);
    out.push({
      x: b.rect.x + b.rect.w / 2, y: h / 2 + 0.15, z: b.rect.y + b.rect.h / 2,
      sx: b.rect.w + 0.6, sy: 0.3, sz: b.rect.h + 0.6,
    });
  }
  return out;
}

/** The parapet colour — shared by every roof. */
export const ROOF_COLOR = '#3a352f';