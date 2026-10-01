/**
 * Act IV retest week: the missed chapter picks a real street grade, and the
 * week does not end until that grade happens.
 */
import { describe, expect, it } from "vitest";
import { Simulation, retestPlan, type VehicleSample } from "../src/quietroads";

function sample(pos: { x: number; y: number }, heading: number, speedMs: number, steer = 0): VehicleSample {
  return { pos, heading, speedMs, throttle: 0.2, brake: 0, steer, horn: false };
}

function harness() {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  return { sim, events };
}

describe("retest plan", () => {
  it("keeps a license miss on the book and grades the local stop", () => {
    const plan = retestPlan(1, ["DG 1.8", "DG 1.15"]);
    expect(plan.kind).toBe("stop");
    expect(plan.objective).toContain("book");
    expect(plan.objective).not.toMatch(/\d/);
  });

  it("picks the school zone when the misses are §4.17", () => {
    expect(retestPlan(2, ["DG 4.17"]).kind).toBe("school");
  });

  it("picks lane markings for a chapter 2 miss on §4.16", () => {
    expect(retestPlan(2, ["DG 4.16"]).kind).toBe("lanes");
  });

  it("picks the four-way from a right-of-way miss", () => {
    expect(retestPlan(3, ["DG 4.13"]).kind).toBe("fourway");
    expect(retestPlan(3, ["DG 4.13"]).objective).toContain("First in goes first");
  });

  it("picks the stall from a parking miss", () => {
    expect(retestPlan(4, ["DG 4.18"]).kind).toBe("backin");
  });

  it("picks the truck gap only for §5.2, and does not invent a §5.4 rule", () => {
    expect(retestPlan(5, ["DG 5.2"]).kind).toBe("gap");
    expect(retestPlan(5, ["DG 5.4", "DG 5.0"]).kind).toBe("speed");
    expect(retestPlan(5, ["DG 5.2"]).objective).toContain("twice the length");
  });
});

describe("retest week on the sim", () => {
  it("ends the week after a full stop and the line", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(1, []));
    expect(sim.startMission("local_loop_week")).toBe(true);
    sim.step(0.2, sample({ x: 250, y: 97 }, 0, 3));
    sim.step(0.2, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.5, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.2, sample({ x: 290, y: 97 }, 0, 3));
    expect(events).toContain("stop.full");
    expect(events).toContain("week.elapsed");
  });

  it("does not end the week when the stop is rolled", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(2, ["DG 4.12"]));
    sim.startMission("local_loop_week");
    sim.step(0.2, sample({ x: 250, y: 97 }, 0, 8));
    sim.step(0.05, sample({ x: 265, y: 97 }, 0, 8));
    sim.step(0.05, sample({ x: 290, y: 97 }, 0, 8));
    expect(events).toContain("stop.rolled");
    expect(events).not.toContain("week.elapsed");
  });

  it("ends the school week after a pass through the zone", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(2, ["DG 4.17"]));
    sim.startMission("local_loop_week");
    sim.step(0.2, sample({ x: 265, y: 150 }, Math.PI / 2, 6));
    sim.step(0.2, sample({ x: 265, y: 180 }, Math.PI / 2, 6));
    sim.step(0.2, sample({ x: 265, y: 255 }, Math.PI / 2, 6));
    expect(events).toContain("zone.school.enter");
    expect(events).toContain("week.elapsed");
  });

  it("ends the lane week in the right lane and not from the passing lane", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(2, ["DG 4.16"]));
    sim.startMission("local_loop_week");
    const lanes = sim.map.grid.lanes;
    const span = (lanes.x1 - lanes.x0) / lanes.count;
    const right = lanes.x0 + span / 2;
    const passing = lanes.x0 + span * 2.5;
    sim.step(0.2, sample({ x: passing, y: lanes.y1 - 1 }, Math.PI / 2, 6));
    expect(events).not.toContain("week.elapsed");
    sim.step(0.2, sample({ x: right, y: lanes.y0 + 1 }, Math.PI / 2, 6));
    sim.step(0.2, sample({ x: right, y: lanes.y1 - 1 }, Math.PI / 2, 6));
    expect(events).toContain("week.elapsed");
  });

  it("ends the stall week after a back-in", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(4, ["DG 4.18"]));
    sim.startMission("local_loop_week");
    const stall = sim.map.grid.beaStall;
    const center = { x: stall.x + stall.w / 2, y: stall.y + stall.h / 2 };
    sim.step(0.2, sample({ x: center.x, y: center.y + 6 }, Math.PI / 2, -1));
    sim.step(0.3, sample(center, Math.PI / 2, 0));
    sim.step(0.3, sample(center, Math.PI / 2, 0));
    expect(events).toContain("week.elapsed");
  });

  it("ends the gap week only while the space behind the truck holds", () => {
    const { sim, events } = harness();
    sim.armRetest(retestPlan(5, ["DG 5.2"]));
    sim.startMission("local_loop_week");
    for (let i = 0; i < 12; i++) {
      const lead = sim.ledger.leadPos;
      sim.step(0.2, sample({ x: lead.x, y: lead.y - 2 }, Math.PI / 2, 8));
    }
    expect(events).not.toContain("week.elapsed");
    for (let i = 0; i < 40; i++) {
      const lead = sim.ledger.leadPos;
      sim.step(0.2, sample({ x: lead.x, y: lead.y - 20 }, Math.PI / 2, 3));
    }
    expect(events).toContain("week.elapsed");
  });
});
