import type { Rect, Vec2 } from "./math";

/**
 * Scene roads live off the Kent city board. Each one is a continuous run of
 * fixed segments (see ContinuousRoad), long enough to drive the scene.
 * Lengths are multiples of SEGMENT_M so the window tiles cleanly.
 */
export const SEGMENT_M = 50;
export const SEGMENTS_AHEAD = 8;
export const SEGMENTS_BEHIND = 2;

export type CorridorAxis = "east" | "south";

export interface Corridor {
  id: string;
  name: string;
  axis: CorridorAxis;
  road: Rect;
  roadColor: string;
  shoulderColor: string;
  /** Metres of shoulder (or water, on a deck) each side of the driveable road. */
  shoulder: number;
  deck: boolean;
  ice?: Rect;
  pad?: Rect;
  padColor?: string;
}

export interface SegmentSlot {
  index: number;
  x: number;
  y: number;
  ice: boolean;
}

const east = (x: number, y: number, length: number, width: number): Rect =>
  ({ x, y: y - width / 2, w: length, h: width });
const south = (x: number, y: number, length: number, width: number): Rect =>
  ({ x: x - width / 2, y, w: width, h: length });

/** Gravel lesson and the Ritzville escort. Eastbound, south of the city. */
export const gravel = {
  id: "gravel",
  name: "GRAVEL RD",
  axis: "east" as const,
  road: east(0, 640, 1600, 9),
  roadColor: "#6a5e4e",
  shoulderColor: "#4a5538",
  shoulder: 8,
  deck: false,
  crestX: 400,
  uncontrolledX: 800,
  crossbuckX: 1150,
  roundabout: { x: 1450, y: 640, r: 16 },
  end: { x: 1550, y: 640 },
  start: { x: 50, y: 640 },
  hank: { x: 220, y: 640 },
  hankTo: { x: 1480, y: 640 },
};

/** Night straight. Its own road, so the rest area is a drive, not a pad on the gravel. */
export const night = {
  id: "night",
  name: "NIGHT STRAIGHT",
  axis: "east" as const,
  road: east(0, 880, 1900, 9),
  roadColor: "#2c3138",
  shoulderColor: "#243028",
  shoulder: 8,
  deck: false,
  start: { x: 50, y: 880 },
  rest: { x: 1300, y: 880 },
  restStall: { x: 1282, y: 872, w: 36, h: 16 } as Rect,
  pad: { x: 1282, y: 872, w: 36, h: 16 } as Rect,
  padColor: "#5c5348",
};

/** Vantage span. Deck on water, not a sticker beside the DOL. */
export const bridge = {
  id: "bridge",
  name: "VANTAGE BRIDGE",
  axis: "east" as const,
  road: east(0, 1140, 1100, 16),
  roadColor: "#7d868f",
  shoulderColor: "#1a3340",
  shoulder: 22,
  deck: true,
  start: { x: 50, y: 1140 },
  mid: { x: 800, y: 1140 },
  end: { x: 1050, y: 1140 },
};

/** The grade up to the chain-up. East of the city, its own strip. */
export const grade = {
  id: "grade",
  name: "SNOQUALMIE",
  axis: "south" as const,
  road: south(2300, 0, 1200, 12),
  roadColor: "#3c4250",
  shoulderColor: "#3a4634",
  shoulder: 8,
  deck: false,
  ice: { x: 2294, y: 400, w: 12, h: 400 } as Rect,
  foot: { x: 2300, y: 50 },
  below: { x: 2300, y: 260 },
  chain: { x: 2300, y: 1050 },
  chainPad: { x: 2286, y: 1028, w: 28, h: 44 } as Rect,
  pad: { x: 2286, y: 1028, w: 28, h: 44 } as Rect,
  padColor: "#4e535c",
};

/** I-90. Three lanes, southbound, not the south end of Central Ave. */
export const ribbon = {
  id: "ribbon",
  name: "I-90",
  axis: "south" as const,
  road: south(2700, 0, 1700, 15),
  roadColor: "#3a3d42",
  shoulderColor: "#3e463c",
  shoulder: 6,
  deck: false,
  lanes: { x0: 2692.5, x1: 2707.5, y0: 0, y1: 1700, count: 3 },
  ramp: { x: 2707.5, y: 40, w: 6, h: 400 } as Rect,
  leadFrom: { x: 2695, y: 160 },
  leadTo: { x: 2695, y: 1580 },
  end: { x: 2700, y: 900 },
  stall: { x: 2700, y: 1280 },
  issaquah: { x: 2700, y: 1620 },
  rampStart: { x: 2710.5, y: 80 },
  convoyStart: { x: 2710.5, y: 28 },
};

export const ramp: Corridor = {
  id: "ramp",
  name: "I-90 ON-RAMP",
  axis: "south",
  road: { x: 2707.5, y: 40, w: 6, h: 400 },
  roadColor: "#3a3d42",
  shoulderColor: "#3e463c",
  shoulder: 2,
  deck: false,
};

export const CORRIDORS: Corridor[] = [gravel, night, bridge, grade, ribbon, ramp];

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function segmentRect(c: Corridor, index: number): Rect {
  if (c.axis === "east") {
    return { x: c.road.x + index * SEGMENT_M, y: c.road.y, w: SEGMENT_M, h: c.road.h };
  }
  return { x: c.road.x, y: c.road.y + index * SEGMENT_M, w: c.road.w, h: SEGMENT_M };
}

export function nearCorridor(c: Corridor, p: Vec2, pad = 70): boolean {
  const r = c.road;
  return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
}

/** The moving window of segments around the car, clamped to this road. */
export function windowSlots(c: Corridor, player: Vec2): SegmentSlot[] {
  const len = c.axis === "east" ? c.road.w : c.road.h;
  const origin = c.axis === "east" ? c.road.x : c.road.y;
  const along = c.axis === "east" ? player.x : player.y;
  const count = Math.round(len / SEGMENT_M);
  let here = Math.floor((along - origin) / SEGMENT_M);
  if (here < 0) here = 0;
  if (here > count - 1) here = count - 1;
  const from = Math.max(0, here - SEGMENTS_BEHIND);
  const to = Math.min(count - 1, here + SEGMENTS_AHEAD);
  const cross = c.axis === "east" ? c.road.y + c.road.h / 2 : c.road.x + c.road.w / 2;
  const slots: SegmentSlot[] = [];
  for (let i = from; i <= to; i++) {
    const mid = origin + (i + 0.5) * SEGMENT_M;
    const slice = segmentRect(c, i);
    slots.push({
      index: i,
      x: c.axis === "east" ? mid : cross,
      y: c.axis === "east" ? cross : mid,
      ice: c.ice ? overlaps(slice, c.ice) : false,
    });
  }
  return slots;
}
