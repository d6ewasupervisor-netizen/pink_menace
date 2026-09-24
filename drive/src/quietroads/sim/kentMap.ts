import { type Rect, type Vec2, rng } from "./math";
import type { ZoneDef } from "./zones";

/**
 * Kent: Titus (Grandma), Central south to the DOL, Meeker west to the pharmacy
 * safehouse, Valley Rd north to Tuna's warehouse. Metres. +x = east, +y = south.
 * Heading 0 = east. R3F maps (x, y) → (X, Z).
 */
export interface RoadSeg { rect: Rect; name?: string }
export interface SignDef { pos: Vec2; kind: "stop" | "school" | "rail" | "warning" | "speed"; text?: string }
export interface Building { rect: Rect; label?: string }

export interface ParkingLot {
  stalls: Rect[];          // painted stalls, all facing +y (south); head curb at y = stall.y + stall.h
  target: number;          // index into stalls — the one she's told to use
  driveway: Rect;          // connects Central Ave to the lot
}

/** The DOL interior, entered on foot. Everything in world metres (same frame as outside). */
export interface DolInterior {
  floor: Rect;             // inside face of the walls
  door: Vec2;              // on the east wall; walker starts just outside it
  doorWidth: number;
  blocked: Rect[];         // counters, chair rows, the number board's stand
  terminal: Vec2;          // knowledge-test terminal, still lit
  terminalRadius: number;
  gracieRunTarget: Vec2;   // where Gracie bolts to after the latch pops
  quietSpawns: Vec2[];     // the ones still waiting for their number
  labels: { pos: Vec2; text: string }[];
}

/** Act II grid sites. Metres, same frame as the rest of Kent. */
export interface GridSites {
  beaStall: Rect;       // back-in dock, nose toward the sanctuary (north)
  beaDockY: number;     // building face; crossing it while moving is a bump
  beaDoor: Vec2;
  tunaStall: Rect;      // parallel stall on the north edge of Valley Rd
  tunaCurbY: number;
  lanes: { x0: number; x1: number; y0: number; y1: number; count: number };
  priya: Vec2;          // east-lane pin in front of the radio shack
  bus: Rect;            // stopped-bus beat on the way to Priya
}

/** Act III Central corridor. Metres, same frame. */
export interface LedgerSites {
  lanes: { x0: number; x1: number; y0: number; y1: number; count: number };
  solidY: number;       // southbound: leaving the right lane below this y is crossing solid white
  merge: Rect;          // lane-drop zone: the right lane ends, merge left here
  lead: { from: Vec2; to: Vec2; speedMph: number };  // Deac's box truck path, right lane, ahead
  end: Vec2;            // mission end waypoint
}

/** Act V highway corridor (I-90 Eastbound, the Ribbon). Metres, same frame. */
export interface RibbonSites {
  lanes: { x0: number; x1: number; y0: number; y1: number; count: number };
  ramp: Rect;          // on-ramp lane; it ends (merges into the right lane) at its south edge
  flowMph: number;     // highway flow speed to match before the paint
  lead: { from: Vec2; to: Vec2; speedMph: number };  // traffic ahead to gap behind
  end: Vec2;           // mission end waypoint
}

/** Act VI gravel road (the Backcountry). Metres, same frame. */
export interface RuralSites {
  road: Rect;
  shoulder: number;
  crestX: number;
  uncontrolledX: number;
  crossbuckX: number;
  /** Circle on the gravel, after the crossbuck. VI-007 / VI-008. */
  roundabout: { x: number; y: number; r: number };
  end: Vec2;
}

export interface WorldMap {
  bounds: Rect;
  parking: ParkingLot;
  dol: DolInterior;
  grid: GridSites;
  ledger: LedgerSites;
  ribbon: RibbonSites;
  rural: RuralSites;
  roads: RoadSeg[];
  centerLines: [Vec2, Vec2][];
  stopLines: [Vec2, Vec2][];
  rail?: { from: Vec2; to: Vec2 };
  schoolZone?: Rect;
  buildings: Building[];
  signs: SignDef[];
  zones: ZoneDef[];
  markers: Record<string, Vec2>;
  quietSpawns: Vec2[];
  starts: Record<string, { pos: Vec2; heading: number }>;
}

export function buildKentMap(seed = 7): WorldMap {
  const buildings: Building[] = [];
  for (let x = 30; x < 240; x += 20) { buildings.push({ rect: { x: x - 5, y: -26, w: 10, h: 9 } }); buildings.push({ rect: { x: x - 5, y: 17, w: 10, h: 9 } }); }
  buildings.push({ rect: { x: 3, y: -26, w: 10, h: 9 }, label: "GRANDMA" });
  for (const y of [30, 50, 70, 90, 130, 250, 270, 320, 340, 360]) {
    buildings.push({ rect: { x: 240, y: y - 4, w: 10, h: 8 } });
    if (y < 160 || y > 240) buildings.push({ rect: { x: 280, y: y - 4, w: 10, h: 8 } });
  }
  buildings.push({ rect: { x: 282, y: 175, w: 26, h: 50 }, label: "KENT MIDDLE" });
  buildings.push({ rect: { x: 205, y: 380, w: 20, h: 40 }, label: "DOL" });
  buildings.push({ rect: { x: 168, y: -58, w: 38, h: 26 }, label: "WAREHOUSE" });
  buildings.push({ rect: { x: 146, y: 78, w: 30, h: 18 }, label: "PHARMACY" });
  buildings.push({ rect: { x: 108, y: 68, w: 26, h: 16 }, label: "SANCTUARY" });
  buildings.push({ rect: { x: 272, y: 36, w: 8, h: 8 }, label: "RADIO" });

  // Titus houses are a 20 m grid. Valley Rd is cut through the north row, so those
  // boxes land on the pavement. Drop anything that actually covers a road — the
  // insulin run starts on Valley, and a car spawned inside a house cannot leave.
  const roads: RoadSeg[] = [
    { rect: { x: -10, y: -4, w: 279, h: 8 }, name: "TITUS ST" },
    { rect: { x: 260, y: -50, w: 10, h: 490 }, name: "CENTRAL AVE" },
    { rect: { x: 270, y: 200, w: 3.5, h: 100 }, name: "I-90 ON-RAMP" },
    { rect: { x: 0, y: 435, w: 320, h: 6 }, name: "GRAVEL RD" },
    { rect: { x: 276, y: 368, w: 18, h: 12 }, name: "CHAIN-UP" },
    { rect: { x: 20, y: 400, w: 150, h: 8 }, name: "VANTAGE BRIDGE" },
    { rect: { x: 140, y: 106, w: 180, h: 8 }, name: "MEEKER ST" },
    { rect: { x: 170, y: -28, w: 96, h: 8 }, name: "VALLEY RD" },
    { rect: { x: 196, y: 70, w: 8, h: 70 }, name: "WILLIS ST" },
    { rect: { x: 146, y: 96, w: 30, h: 10 }, name: "PHARMACY LOT" },
    { rect: { x: 225, y: 380, w: 30, h: 40 }, name: "DOL LOT" },
    { rect: { x: 255, y: 382, w: 5, h: 10 }, name: "DOL DRIVEWAY" },
    { rect: { x: 116, y: 84, w: 8, h: 26 }, name: "BEA ALLEY" },
  ];
  for (let i = buildings.length - 1; i >= 0; i--) {
    if (roads.some((road) => rectsOverlap(buildings[i].rect, road.rect))) buildings.splice(i, 1);
  }

  const zones: ZoneDef[] = [
    { kind: "waypoint", id: "block_end", rect: c(250, 0, 6, 8) },
    { kind: "waypoint", id: "titus_fourway", rect: c(265, 0, 18, 18) },
    { kind: "sign", id: "warning", rect: c(226, 0, 4, 8), quiz: "sign.prompt:warning" },
    { kind: "stop", id: "titus_central", rect: c(250.5, 0, 17, 8), quiz: "sign.prompt:regulatory", quizDelayS: 0.4 },
    { kind: "stop", id: "meeker", rect: c(265, 97, 10, 16), quiz: "stop.approach", quizDelayS: 0.4 },
    { kind: "waypoint", id: "willis_uncontrolled", rect: c(200, 110, 12, 12) },
    { kind: "waypoint", id: "pharmacy", rect: { x: 146, y: 96, w: 30, h: 10 } },
    { kind: "waypoint", id: "priya_radio_shack", rect: { x: 266.6, y: 32, w: 3.4, h: 16 } },
    { kind: "waypoint", id: "warehouse", rect: { x: 168, y: -32, w: 14, h: 14 } },
    { kind: "sign", id: "school", rect: c(265, 150, 10, 4), quiz: "sign.prompt:school", quizDelayS: 2.6 },
    { kind: "school", id: "central", rect: c(265, 200, 10, 80) },
    { kind: "sign", id: "rail_advance", rect: c(265, 285, 10, 4) },
    { kind: "rail", id: "central", rect: c(265, 300, 10, 14), quiz: "zone.rail.enter", quizDelayS: 2.8 },
    { kind: "waypoint", id: "dol_approach", rect: c(265, 372, 10, 8) },
    { kind: "waypoint", id: "dol_lot_exit", rect: { x: 255, y: 382, w: 5, h: 10 }, once: false },
  ];

  // Parking: six stalls along the south edge of the lot, pull in heading south. Target is #3.
  const stalls: Rect[] = [];
  for (let i = 0; i < 6; i++) stalls.push({ x: 235 + i * 2.9, y: 413.5, w: 2.6, h: 5.5 });
  const parking: ParkingLot = { stalls, target: 2, driveway: { x: 255, y: 382, w: 5, h: 10 } };

  // DOL interior: building box is x 205–225, y 380–420. Walls 0.5 m thick.
  const dolRng = rng(seed + 7);
  const dolQuiet: Vec2[] = [];
  for (let i = 0; i < 9; i++) dolQuiet.push({ x: 212.5 + (dolRng() - 0.5) * 1.2, y: 388 + i * 2.6 });   // the line, still holding numbers
  dolQuiet.push({ x: 219.5, y: 396.5 }); dolQuiet.push({ x: 218.5, y: 403.5 }); dolQuiet.push({ x: 221, y: 409 }); // in the chairs
  const dol: DolInterior = {
    floor: { x: 205.5, y: 380.5, w: 19, h: 39 },
    door: { x: 225, y: 386 },
    doorWidth: 2.4,
    blocked: [
      { x: 205.5, y: 383, w: 6, h: 1.2 },            // service counter (north-west)
      { x: 215, y: 392, w: 7, h: 0.8 },              // chair rows
      { x: 215, y: 398, w: 7, h: 0.8 },
      { x: 215, y: 404, w: 7, h: 0.8 },
      { x: 215, y: 410, w: 7, h: 0.8 },
      { x: 209.5, y: 414.5, w: 1.2, h: 1.2 },        // pamphlet rack by the terminal (the one that goes over)
      { x: 205.5, y: 416.5, w: 4, h: 1 },            // terminal desk
    ],
    terminal: { x: 208, y: 415.5 },
    terminalRadius: 1.6,
    gracieRunTarget: { x: 223, y: 401 },
    quietSpawns: dolQuiet,
    labels: [{ pos: { x: 206.5, y: 382.5 }, text: "NOW SERVING 47" }],
  };

  const r = rng(seed);
  const spawns: Vec2[] = [];
  const blocked = (p: Vec2) => buildings.some((b) => p.x >= b.rect.x - 1.5 && p.x <= b.rect.x + b.rect.w + 1.5 && p.y >= b.rect.y - 1.5 && p.y <= b.rect.y + b.rect.h + 1.5);
  const push = (p: Vec2) => { if (!blocked(p)) spawns.push(p); };
  for (let i = 0; i < 20; i++) { const x = 22 + r() * 223; const side = r() < 0.5 ? 1 : -1; push({ x, y: side * (6 + r() * 9) }); }          // Titus yards
  for (let i = 0; i < 16; i++) { const y = 20 + r() * 345; const side = r() < 0.5 ? 1 : -1; push({ x: 265 + side * (7 + r() * 9), y }); }   // Central yards
  for (let i = 0; i < 12; i++) push({ x: 228 + (r() * 6 - 3), y: 384 + i * 3 });                                                             // the DOL queue
  for (let i = 0; i < 6; i++) push({ x: 178 + r() * 22, y: 96 + r() * 10 });                                                                  // pharmacy lot edge
  for (let i = 0; i < 3; i++) push({ x: 198 + (r() * 6 - 3), y: 84 + r() * 18 });                                                             // Willis yards

  const grid: GridSites = {
    beaStall: { x: 118.7, y: 84.8, w: 2.6, h: 6.4 },
    beaDockY: 84.15,
    beaDoor: { x: 120, y: 85.3 },
    tunaStall: { x: 176, y: -27.5, w: 7.2, h: 2.4 },
    tunaCurbY: -28.05,
    lanes: { x0: 260, x1: 270, y0: 6, y1: 56, count: 3 },
    priya: { x: 268.3, y: 40 },
    bus: { x: 260, y: 14, w: 10, h: 8 },
  };

  // Central south of the Grid: the Act III Ledger run. Three southbound lanes;
  // the right lane is the travel lane and it ends in a merge near the south.
  const ledger: LedgerSites = {
    lanes: { x0: 260, x1: 270, y0: 60, y1: 170, count: 3 },
    solidY: 120,
    merge: { x: 260, y: 150, w: 10, h: 20 },
    lead: { from: { x: 261.67, y: 78 }, to: { x: 261.67, y: 170 }, speedMph: 18 },
    end: { x: 265, y: 172 },
  };

  // I-90 Eastbound south of the Central corridor: the Act V on-ramp merge.
  // Three highway lanes plus a right-side ramp that dies into the right lane.
  const ribbon: RibbonSites = {
    lanes: { x0: 260, x1: 270, y0: 200, y1: 360, count: 3 },
    ramp: { x: 270, y: 200, w: 3.5, h: 100 },
    flowMph: 40,
    lead: { from: { x: 261.67, y: 220 }, to: { x: 261.67, y: 358 }, speedMph: 40 },
    end: { x: 265, y: 342 },
  };

  const rural: RuralSites = {
    road: { x: 0, y: 435, w: 320, h: 6 },
    shoulder: 3,
    crestX: 120,
    uncontrolledX: 200,
    crossbuckX: 260,
    roundabout: { x: 285, y: 438, r: 10 },
    end: { x: 310, y: 438 },
  };

  return {
    bounds: { x: -30, y: -70, w: 360, h: 530 },
    parking,
    dol,
    grid,
    ledger,
    ribbon,
    rural,
    roads,
    centerLines: [
      [{ x: -10, y: 0 }, { x: 258, y: 0 }],
      [{ x: 265, y: -50 }, { x: 265, y: 440 }],
      [{ x: 140, y: 110 }, { x: 320, y: 110 }],
      [{ x: 170, y: -24 }, { x: 260, y: -24 }],
      [{ x: 200, y: 70 }, { x: 200, y: 140 }],
      [{ x: 263.33, y: 6 }, { x: 263.33, y: 56 }],
      [{ x: 266.67, y: 6 }, { x: 266.67, y: 56 }],
    ],
    stopLines: [[{ x: 259, y: -4 }, { x: 259, y: 4 }], [{ x: 260, y: 105 }, { x: 270, y: 105 }], [{ x: 260, y: 293 }, { x: 270, y: 293 }]],
    rail: { from: { x: 200, y: 300 }, to: { x: 330, y: 300 } },
    schoolZone: { x: 260, y: 160, w: 10, h: 80 },
    buildings,
    signs: [
      { pos: { x: 226, y: 5.5 }, kind: "warning", text: "T" },
      { pos: { x: 259.5, y: 5.5 }, kind: "stop" },
      { pos: { x: 258.5, y: 105 }, kind: "stop" },
      { pos: { x: 258.5, y: 150 }, kind: "school", text: "20" },
      { pos: { x: 258.5, y: 285 }, kind: "rail" },
    ],
    zones,
    markers: {
      carport: { x: 14, y: -14 },
      dol_lot: { x: 240, y: 400 },
      warehouse: { x: 190, y: -24 },
      pharmacy: { x: 161, y: 101 },
      clipboard: { x: 161, y: 97.2 },
      bea: { x: 120, y: 88 },
      bea_door: { x: 120, y: 85.3 },
      priya: { x: 268.3, y: 40 },
      tuna: { x: 179.6, y: -26.3 },
      warehouse_dock: { x: 174, y: -24 },
      ledger_end: { x: 265, y: 172 },
      ribbon_end: { x: 265, y: 342 },
      stall_point: { x: 265, y: 342 },
      issaquah: { x: 265, y: 400 },
      rural_end: { x: 310, y: 438 },
      chainup: { x: 285, y: 374 },
      rest_area: { x: 78, y: 438 },
      bridge_mid: { x: 95, y: 404 },
      bridge_end: { x: 160, y: 404 },
    },
    quietSpawns: spawns,
    starts: {
      carport: { pos: { x: 14, y: 0 }, heading: 0 },
      warehouse: { pos: { x: 190, y: -24 }, heading: 0 },                       // Valley Rd, facing east to Central
      bea_alley: { pos: { x: 120, y: 104 }, heading: -Math.PI / 2 },           // alley mouth, nose north toward Bea
      priya_west: { pos: { x: 261.6, y: 8 }, heading: Math.PI / 2 },           // west lane, heading south
      tuna_approach: { pos: { x: 214, y: -24 }, heading: Math.PI },            // Valley Rd, facing the dock
      jonah_meeker: { pos: { x: 210, y: 110 }, heading: 0 },                   // Meeker, east toward Central
      ledger_south: { pos: { x: 261.67, y: 66 }, heading: Math.PI / 2 },       // Central, right lane, heading south
      ribbon_ramp: { pos: { x: 271.75, y: 206 }, heading: Math.PI / 2 },       // I-90 on-ramp, heading south into the merge
      rural_start: { pos: { x: 16, y: 438 }, heading: 0 },
      chainup_pullout: { pos: { x: 285, y: 374 }, heading: Math.PI / 2 },
      rest_stall: { pos: { x: 78, y: 438 }, heading: 0 },
      bridge_west: { pos: { x: 28, y: 404 }, heading: 0 },
      bridge_mid_start: { pos: { x: 95, y: 404 }, heading: 0 },
      roundabout_approach: { pos: { x: 268, y: 438 }, heading: 0 },
      convoy_ramp: { pos: { x: 271.75, y: 196 }, heading: Math.PI / 2 },      // just north of the ramp, so entering it counts
      convoy_stall: { pos: { x: 265, y: 330 }, heading: Math.PI / 2 },
      dol_lot_entry: { pos: { x: 257.5, y: 387 }, heading: Math.PI },            // just inside the driveway, facing west
      dol_stall: { pos: { x: stalls[2].x + stalls[2].w / 2, y: 416.5 }, heading: Math.PI / 2 }, // parked, nose south
    },
  };
}

/** True when two rects share area. Edge contact (a wall flush with a lot) does not count. */
function rectsOverlap(a: Rect, b: Rect, pad = 0.05): boolean {
  return a.x < b.x + b.w - pad && a.x + a.w > b.x + pad && a.y < b.y + b.h - pad && a.y + a.h > b.y + pad;
}

/** centre + size → Rect */
function c(cx: number, cy: number, w: number, h: number): Rect { return { x: cx - w / 2, y: cy - h / 2, w, h }; }
