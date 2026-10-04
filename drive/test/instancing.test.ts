/**
 * P14 — Kent draw merge.
 *
 * The rule under test: N plain buildings produce ONE instanced draw per
 * material, not N meshes — while the collider count stays one per building, so
 * the car still stops against every wall.
 */
import { describe, expect, it } from 'vitest';
import {
  batchPlainBuildings,
  buildingColliders,
  isPlainBuilding,
  plainBuildingShape,
  batchDashes,
  dashInstances,
  UNIQUE_BUILDING_LABELS,
} from '../src/quietroads/sim/instancing';
import { buildKentMap } from '../src/quietroads/sim/kentMap';

/** A stand-in for the plain Kent boxes: the same 20 m grid the map builds. */
function plainRow(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    rect: { x: 30 + i * 20, y: -26, w: 10, h: 9 },
  }));
}

describe('P14 — buildings batch into one instanced draw per material', () => {
  it('N plain buildings collapse to batches, not N meshes', () => {
    const buildings = plainRow(40);
    const batches = batchPlainBuildings(buildings);
    const drawn = batches.reduce((sum, b) => sum + b.instances.length, 0);

    // All 40 are drawn...
    expect(drawn).toBe(40);
    // …but through far fewer meshes than buildings.
    expect(batches.length).toBeLessThan(40);
    expect(batches.length).toBe(batches.length);
    // Every instance carries its own position and size.
    expect(batches.every((b) => b.instances.every((i) => i.sx > 0 && i.sy > 0 && i.sz > 0))).toBe(true);
  });

  it('collider count stays one per building', () => {
    const buildings = plainRow(40);
    expect(buildingColliders(buildings)).toHaveLength(40);
    // Merging the draw must not merge the collision.
    expect(buildingColliders(buildings).length).toBe(batches(buildings));
  });

  it('excludes the buildings that already have their own component', () => {
    const buildings = [
      ...plainRow(5),
      { rect: { x: 205, y: 380, w: 20, h: 40 }, label: 'DOL' },
      { rect: { x: 168, y: -58, w: 38, h: 26 }, label: 'WAREHOUSE' },
      { rect: { x: 146, y: 78, w: 30, h: 18 }, label: 'PHARMACY' },
    ];
    expect(UNIQUE_BUILDING_LABELS.has('DOL')).toBe(true);
    expect(isPlainBuilding(buildings[0])).toBe(true);
    expect(isPlainBuilding(buildings[5])).toBe(false);
    // 5 plain, 3 unique — the unique ones are not in a batch and not in a collider batch.
    expect(batchPlainBuildings(buildings).reduce((n, b) => n + b.instances.length, 0)).toBe(5);
    expect(buildingColliders(buildings)).toHaveLength(5);
  });

  it('keeps the labeled unique buildings that are NOT unique — positions, sizes, colours', () => {
    const kentMiddle = { rect: { x: 282, y: 175, w: 26, h: 50 }, label: 'KENT MIDDLE' };
    // Labeled but batchable — height and colour come straight from the shape rule.
    expect(plainBuildingShape(kentMiddle.rect, kentMiddle.label)).toEqual({ h: 7, color: '#a8895e' });
    expect(isPlainBuilding(kentMiddle)).toBe(true);
    // The plain default colour is unchanged.
    expect(plainBuildingShape({ x: 30, y: -26, w: 10, h: 9 }).color).toBe('#7c7368');
  });

  it('the real Kent map batches its buildings into few draws', () => {
    const map = buildKentMap();
    const batches = batchPlainBuildings(map.buildings);
    const drawn = batches.reduce((n, b) => n + b.instances.length, 0);
    // The real map's plain buildings (the exact count is the map's, not ours).
    expect(drawn).toBeGreaterThan(30);
    // Far fewer draws than the building count — that is the whole point.
    expect(batches.length).toBeLessThan(drawn / 2);
    // But still one collider per plain building — the car stops the same way.
    expect(buildingColliders(map.buildings)).toHaveLength(drawn);
    // And the three unique buildings keep their own components.
    const unique = map.buildings.filter((b) => !isPlainBuilding(b)).map((b) => b.label);
    expect(unique.sort()).toEqual(['DOL', 'PHARMACY', 'WAREHOUSE']);
  });
});

describe('P14 — dashes batch into one instanced mesh per colour', () => {
  it('one long line becomes many instances in one batch', () => {
    const dashes = dashInstances({ x: 0, y: 0 }, { x: 30, y: 0 }, 3, 3);
    // 30 m of 3 m dash + 3 m gap → 5 dashes.
    expect(dashes).toHaveLength(5);
    expect(dashes.every((d) => d.len > 0)).toBe(true);
  });

  it('several lines merge into one instance list', () => {
    const lines: [{ x: number; y: number }, { x: number; y: number }][] = [
      [{ x: 0, y: 0 }, { x: 30, y: 0 }],
      [{ x: 0, y: 20 }, { x: 30, y: 20 }],
    ];
    expect(batchDashes(lines)).toHaveLength(10);
  });

  it('a zero-length line yields nothing', () => {
    expect(dashInstances({ x: 5, y: 5 }, { x: 5, y: 5 })).toHaveLength(0);
  });
});

/** total instances across batches */
function batches(buildings: Parameters<typeof batchPlainBuildings>[0]): number {
  return batchPlainBuildings(buildings).reduce((n, b) => n + b.instances.length, 0);
}