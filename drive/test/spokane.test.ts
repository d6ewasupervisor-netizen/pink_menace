import { describe, expect, it } from "vitest";
import { Simulation, rectCenter, type VehicleSample } from "../src/quietroads";
import { buildKentMap } from "../src/quietroads/sim/kentMap";

/**
 * spokane_home emits every wait/trigger event in scenes 8.1–8.3.
 *
 * The inventory (see drive/src/quietroads/sim/spokane.ts header) is asserted
 * here by driving the real Simulation: the trigger set across graded runs, and
 * the wait set through the story-wait channel the bridge pumps (ticks that fire
 * even while the 8.2 video scene freezes the world).
 */
const TRIGGERS = [
  "city.enter", "shadow.inside_lights", "shadow.exceeds_lights",
  "stop.full", "stop.rolled", "zone.school.enter", "zone.rail.enter",
  "intersection.fourway.approach", "intersection.uncontrolled.approach",
  "lanechange.clean", "lanechange.no_signal",
  "quiet.pass_cluster", "mya.wake",
  "checkpoint.approach:on_speed", "checkpoint.approach:over",
  "park.parallel.start", "park.parallel.adjust", "park.parallel.curb",
  "park.parallel.over_line", "park.parallel.clean",
  "qte.gracie.start", "qte.gracie.success", "qte.gracie.fail",
  "noise.yellow", "noise.red", "mission.fail.swarm",
] as const;

const WAITS = [
  "quiet.reason_passed",
  "cutscene.beetle_stops", "cutscene.ali_out",
  "cutscene.mom_arrives", "cutscene.ray_blanket",
] as const;

function sample(over: Partial<VehicleSample> = {}): VehicleSample {
  return {
    pos: { x: 265, y: 145 }, heading: Math.PI / 2, speedMs: 8,
    throttle: 0.2, brake: 0, steer: 0, horn: false, beams: "high",
    ...over,
  };
}

function bus() {
  const out = new Set<string>();
  const sim = new Simulation({
    fire: (e) => out.add(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
    setVar: (n, v) => { vars[n] = v; },
  });
  return { sim, out };
}

const vars: Record<string, number> = {};

/** Drive one synthetic pass and collect the event names it produced. */
function drive(steps: Array<(sim: Simulation) => VehicleSample>): { sim: Simulation; out: Set<string> } {
  const b = bus();
  b.sim.startMission("spokane_home");
  for (const s of steps) b.sim.step(1 / 60, s(b.sim));
  return b;
}

const hold = (n: number, s: VehicleSample) =>
  Array.from({ length: n }, () => () => s);

describe("spokane_home — every 8.1–8.3 trigger is emitted", () => {
  it("covers the full inventory across the graded runs", () => {
    const seen = new Set<string>();
    const map = buildKentMap(7);
    const stall = rectCenter(map.grid.tunaStall);
    const cluster = map.quietSpawns[0];

    // Run A: the quiet night run — school, rail, four-way, uncontrolled, park.
    const a = drive([
      ...hold(60, sample({ pos: { x: 265, y: 145 }, speedMs: 8 })),          // city.enter, shadow
      ...hold(40, sample({ pos: { x: 259, y: 5 }, speedMs: 0 })),            // stop.full
      ...hold(30, sample({ pos: { x: 258, y: 105 }, speedMs: 2 })),          // stop.rolled
      ...hold(60, sample({ pos: { x: 265, y: 200 }, speedMs: 6 })),          // zone.school.enter
      ...hold(60, sample({ pos: { x: 263, y: 292 }, speedMs: 6 })),          // zone.rail.enter
      ...hold(60, sample({ pos: { x: 265, y: 0 }, speedMs: 6 })),            // four-way
      ...hold(60, sample({ pos: { x: 200, y: 110 }, speedMs: 6 })),          // uncontrolled
      // lane change with the signal held — hold the wheel first, then cross
      ...hold(30, sample({ pos: { x: 261, y: 30 }, speedMs: 6, steer: 0.3 })),
      ...Array.from({ length: 10 }, (_, i) => () => sample({
        pos: { x: 261 + (i / 10) * 4, y: 30 }, speedMs: 6, steer: 0.3,
      })),
      // quiet cluster passed clean, then Mya wakes
      ...hold(60, sample({ pos: cluster, speedMs: 5 })),
      // checkpoint at exactly 25
      ...Array.from({ length: 40 }, (_, i) => () => sample({
        pos: { x: map.grid.lanes.x0 - 4 + (1 - i / 40) * 25 - 5, y: 20 }, speedMs: 25 * 0.44704,
      })),
      // Gracie bolts; steer long enough to trip her, then settle her at low speed
      ...hold(90, sample({ pos: { x: stall.x - 8, y: stall.y }, speedMs: 2, steer: 0.7 })),
      ...hold(30, sample({ pos: { x: stall.x - 8, y: stall.y }, speedMs: 1, steer: 0 })),
      // the park: approach, back in, settle a foot off the line
      ...hold(20, sample({ pos: { x: stall.x - 6, y: stall.y }, speedMs: 2, heading: 0 })),
      ...hold(20, sample({ pos: { x: stall.x - 3, y: stall.y }, speedMs: -1, heading: 0 })),
      ...hold(60, sample({ pos: { x: stall.x, y: stall.y + 1.15 }, speedMs: 0, heading: 0 })),
    ]);
    for (const e of a.out) seen.add(e);

    // Run B: the loud cluster — the street wakes (noise + swarm retry).
    const b2 = drive([
      ...hold(30, sample({ pos: cluster, speedMs: 5 })),
      ...hold(60, sample({ pos: cluster, speedMs: 5, horn: true, throttle: 1, steer: 1 })),
    ]);
    for (const e of b2.out) seen.add(e);

    // Run C: overspeed checkpoint (checkpoint.approach:over).
    const c = drive([
      ...hold(30, sample({ pos: { x: 280, y: 20 }, speedMs: 20 })),
      ...Array.from({ length: 40 }, (_, i) => () => sample({
        pos: { x: map.grid.lanes.x0 - 4 + (1 - i / 40) * 25 - 5, y: 20 }, speedMs: 20,
      })),
    ]);
    for (const e of c.out) seen.add(e);

    // Run D: shadow.exceeds_lights (70+ mph).
    const d = drive([...hold(40, sample({ speedMs: 33 }))]);
    for (const e of d.out) seen.add(e);

    // Run E: rolled through, no-signal change, over the line, curb, Gracie escapes.
    const e5 = drive([
      ...hold(30, sample({ pos: { x: 258, y: 105 }, speedMs: 2 })),
      ...hold(30, sample({ pos: { x: 261, y: 30 }, speedMs: 6, steer: 0.05 })),
      ...Array.from({ length: 10 }, (_, i) => () => sample({
        pos: { x: 261 + (i / 10) * 4, y: 30 }, speedMs: 6, steer: 0.05,
      })),
      ...hold(90, sample({ pos: { x: 200, y: 100 }, speedMs: 12, steer: 0.7 })),
      ...hold(20, sample({ pos: { x: stall.x, y: stall.y + 1.6 }, speedMs: 1, heading: 0 })),
      ...hold(20, sample({ pos: { x: stall.x, y: stall.y - 1.6 }, speedMs: 1, heading: 0 })),
    ]);
    for (const e of e5.out) seen.add(e);

    const missing = TRIGGERS.filter((name) => !seen.has(name));
    expect(missing).toEqual([]);
  });

  it("writes park_gap_in at the park grade", () => {
    const map = buildKentMap(7);
    const stall = rectCenter(map.grid.tunaStall);
    drive([
      ...hold(20, sample({ pos: { x: stall.x - 6, y: stall.y }, speedMs: 2, heading: 0 })),
      ...hold(20, sample({ pos: { x: stall.x - 3, y: stall.y }, speedMs: -1, heading: 0 })),
      ...hold(60, sample({ pos: { x: stall.x, y: stall.y + 1.15 }, speedMs: 0, heading: 0 })),
    ]);
    expect(vars.park_gap_in).toBeGreaterThanOrEqual(0);
    expect(vars.park_gap_in).toBeLessThan(37);
  });
});

describe("spokane_home — 8.1's two branches are reachable", () => {
  it("reaches the lights branch on entry and the muffler branch on quiet.pass_cluster", async () => {
    const { DialogueRunner } = await import("../src/quietroads/dialogue/DialogueRunner");
    const act8 = (await import("../src/quietroads/data/dialogue_act8.json")).default as never;
    const host = {
      getVar: (n: string) => (n === "park_gap_in" ? 12 : NaN),
      setVar: () => {}, addVar: () => {}, getFlag: () => false, setFlag: () => {},
      hasItem: (n: string) => n === "muffler" || n === "led_lights", giveItem: () => {},
      unlock: () => {}, emitNoise: () => {}, playSfx: () => {}, animCue: () => {},
      checkpoint: () => {}, ledger: () => {}, logEvent: () => {}, logChoice: () => {},
      startGameplay: () => {}, setTimer: () => 0, clearTimer: () => {}, now: () => 0,
      random: () => 0,
    };
    const r = new DialogueRunner(host as never);
    r.load(structuredClone(act8));
    r.startScene("8.1");
    // Entry chain: 8.1.entry → 8.1.0 → 8.1.lights_branch forks to lights_a/b/c.
    // Branches auto-continue, so land on the fork target (led_lights held → 8.1.lights_a).
    while (r.current && r.currentId !== "8.1.lights_a") r.advance();
    expect(r.currentId).toBe("8.1.lights_a");
    // The muffler fork hangs off the quiet cluster — reachable when the pass fires.
    // muffler held → 8.1.cluster_src → 8.1.5 (Tuna's muffler line).
    r.onEvent("quiet.pass_cluster");
    while (r.current && r.currentId !== "8.1.5") r.advance();
    expect(r.currentId).toBe("8.1.5");
  });
});

describe("spokane_home — every 8.x wait is answered by the mission", () => {
  it("fires each story-wait beat when the runner asks", () => {
    const b = bus();
    b.sim.startMission("spokane_home");
    // Passing the cluster first is what wakes Mya — the wait beat depends on it.
    const cluster = buildKentMap(7).quietSpawns[0];
    for (let i = 0; i < 30; i++) b.sim.step(1 / 60, sample({ pos: cluster, speedMs: 5 }));
    for (const name of WAITS) {
      const before = b.out.size;
      expect(b.sim.onStoryWait(name)).toBe(true);
      expect([...b.out].slice(before)).toContain(name);
    }
  });
});

