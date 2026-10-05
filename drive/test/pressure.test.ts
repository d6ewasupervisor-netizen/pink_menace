/**
 * A missed grade raises Quiet pressure (owner decision, 2026-10-05).
 *
 * The Quiet are the zombies — one herd (`QuietField`), spawned in `kentMap.ts`,
 * drawn by `QuietSwarm`. On a missed grade the herd near the car wakes and looks
 * at you; if nobody is close enough to see it, existing dormant Quiet step onto
 * the roadside ahead so the sprites are on screen. A pass raises nothing. Decay
 * still drains awareness.
 *
 * These tests are two-sided in the house style: the miss is produced by the real
 * grader (`ledger.follow.close`, `rural.shoulder.yank`), not by poking the hook,
 * so a rewired funnel fails here without anyone editing a list. The Quiet are
 * placed where the drive needs them (a herd spawn is random; the rule is not).
 */
import { describe, expect, it } from "vitest";
import { Simulation, type VehicleSample } from "../src/quietroads";
import { GRADE_MISSES, PRESSURE } from "../src/quietroads/sim/pressure";
import { QuietState, type Quiet } from "../src/quietroads/sim/quiet";

function sample(over: Partial<VehicleSample> = {}): VehicleSample {
  return {
    pos: { x: 0, y: 0 },
    heading: Math.PI / 2,
    speedMs: 8,
    throttle: 0.2,
    brake: 0,
    steer: 0,
    horn: false,
    ...over,
  };
}

function makeSim(mission: Parameters<Simulation["startMission"]>[0]) {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  // Mute the herd's hearing. Engine noise is pre-existing behaviour and it wakes
  // a Quiet parked beside the car on its own — with listeners attached, "a pass
  // wakes nobody" would measure the engine, not the grade. The miss rule calls
  // `addAwareness` directly, so it still runs; the channel under test is the
  // only one left.
  sim.noise.setListeners([]);
  sim.startMission(mission);
  return { sim, events };
}

/** Put a Quiet somewhere — the herd is seeded at random, the rule is not. */
function place(q: Quiet, pos: { x: number; y: number }) {
  q.pos = { ...pos };
  q.home = { ...pos };
}

const awake = (qs: Quiet[]) => qs.filter((q) => q.awareness > 0);

describe("a missed grade wakes the Quiet near the car", () => {
  it("raises awareness on the herd within sight — and only there", () => {
    const { sim, events } = makeSim("mission_central_ledger");
    const herd = sim.quiet.inZone("outdoor");
    expect(herd.length).toBeGreaterThan(2);

    // One Quiet where the car will be, one far up the corridor.
    const near = herd[0];
    const far = herd[1];
    place(near, { x: 264, y: 78 });
    place(far, { x: 265, y: 320 });

    // Roll 5 m behind Deac's truck at 8 m/s — the `ledger.follow.close` mistake.
    const lead = sim.ledger.leadPos;
    sim.step(1 / 60, sample({ pos: { x: lead.x, y: lead.y - 5 } }));

    expect(events).toContain("ledger.follow.close");
    expect(GRADE_MISSES.has("ledger.follow.close")).toBe(true);
    // The miss happened: the one who could see it woke up...
    expect(near.awareness).toBeGreaterThan(0);
    expect(near.state).toBeGreaterThanOrEqual(QuietState.CURIOUS);
    // ...the one who could not see it did not.
    expect(far.awareness).toBe(0);
  });

  it("never adds a second herd — only existing Quiet wake", () => {
    const { sim } = makeSim("mission_central_ledger");
    const before = sim.quiet.list.length;
    const lead = sim.ledger.leadPos;
    for (let i = 0; i < 300; i++) {
      sim.step(1 / 60, sample({ pos: { x: lead.x, y: lead.y - 5 } }));
    }
    expect(sim.quiet.list.length).toBe(before);
    // Sustained failure reinforces (awareness stacks) but never condemns the
    // cargo on its own: a mistake alone stops at ALERT (see PRESSURE.MISS_CAP).
    const maxAw = Math.max(...sim.quiet.list.map((q) => q.awareness));
    expect(maxAw).toBeGreaterThan(0);
    expect(maxAw).toBeLessThanOrEqual(PRESSURE.MISS_CAP);
  });
});

describe("a pass does not raise pressure", () => {
  it("a clean, signaled lane change wakes nobody", () => {
    const { sim, events } = makeSim("mission_central_ledger");
    const herd = sim.quiet.inZone("outdoor");
    // A Quiet beside the lane change (well clear of the car's footprint — a
    // plow is contact, not a grade), well north of the solid line.
    const near = herd[0];
    place(near, { x: 268, y: 103 });

    // Hold the signal (steer) for over half a second in lane 0, then change to
    // lane 1: `ledger.lanechange.clean` — the pass half of the lane-change grade.
    for (let i = 0; i < 40; i++) {
      sim.step(1 / 60, sample({ pos: { x: 261.67, y: 100 }, steer: 0.3 }));
    }
    for (let i = 0; i < 4; i++) {
      sim.step(1 / 60, sample({ pos: { x: 265, y: 101 }, steer: 0.3 }));
    }

    expect(events).toContain("ledger.lanechange.clean");
    // The pass is on the books, and not one fail event rode along with it...
    expect(events.filter((e) => GRADE_MISSES.has(e))).toEqual([]);
    // ...and not one Quiet in the world woke for it.
    expect(awake(sim.quiet.list)).toEqual([]);
  });
});

describe("with nobody in sight, existing dormant Quiet move to the roadside", () => {
  it("a yanked shoulder on the gravel run rallies the roadside ahead — no new Quiet", () => {
    // The Backcountry: the herd spawns in Kent, the car is a kilometre away.
    const { sim, events } = makeSim("mission_backcountry_run");
    const car = { x: 200, y: 633 }; // on the shoulder band, off the pavement
    const before = sim.quiet.list.length;
    expect(sim.quiet.list.filter((q) => Math.hypot(q.pos.x - car.x, q.pos.y - car.y) < PRESSURE.SIGHT_M)).toEqual([]);

    // Off the road edge with a yank — `rural.shoulder.yank`, the fail the
    // graders already fire for exactly this.
    for (let i = 0; i < 3; i++) {
      sim.step(1 / 60, sample({ pos: car, heading: 0, speedMs: 12, steer: 0.8 }));
    }
    expect(events).toContain("rural.shoulder.yank");

    // The herd is now ON SCREEN: within sight, ahead of the car, awake.
    const woken = awake(sim.quiet.list).filter(
      (q) => Math.hypot(q.pos.x - car.x, q.pos.y - car.y) < PRESSURE.SIGHT_M,
    );
    expect(woken.length).toBeGreaterThanOrEqual(1);
    expect(woken.length).toBeLessThanOrEqual(PRESSURE.RALLY_COUNT);
    for (const q of woken) {
      expect(q.pos.x).toBeGreaterThan(car.x); // ahead of the car, roadside
      expect(q.state).toBeGreaterThanOrEqual(QuietState.CURIOUS);
    }
    expect(sim.quiet.list.length).toBe(before); // existing Quiet, never a new herd
  });

  it("the pressure decays when the mistakes stop", () => {
    const { sim } = makeSim("mission_backcountry_run");
    const car = { x: 200, y: 633 };
    sim.step(1 / 60, sample({ pos: car, heading: 0, speedMs: 12, steer: 0.8 }));
    const woke = Math.max(...sim.quiet.list.map((q) => q.awareness));
    expect(woke).toBeGreaterThan(0);

    // Drive clean for 8 s: same shoulder line, no yank, no miss.
    for (let i = 0; i < 480; i++) {
      sim.step(1 / 60, sample({ pos: { x: car.x + i * 0.2, y: car.y }, heading: 0, speedMs: 12 }));
    }
    const after = Math.max(...sim.quiet.list.map((q) => q.awareness));
    expect(after).toBeLessThan(woke);
    expect(after).toBe(0); // QUIET.DECAY_PER_S still drains it to nothing
  });
});
