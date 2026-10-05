/**
 * Deac's on-road behaviour — the ROADMAP P3 item "Deac's on-road behaviour
 * matches the story".
 *
 * III-001 ("Your Wheel") is hand-written, not generated. Its scene text promises
 * the player one specific thing: "He will sweep the glass, hold the lane, then
 * take one merge late on purpose so you can watch what that costs." Its debrief:
 * "You saw the merge you do not take. He spent another man's margin to keep his."
 * III-013 is the same act seen from his side — twenty-six years, not one
 * preventable.
 *
 * He used to be a straight line at constant speed. None of that happened on the
 * road, so both cards were describing a merge that did not exist. These tests
 * are two-sided on purpose: each asserts that the behaviour DOES happen on the
 * drive that should produce it, and stays SHUT on the drive that should not — a
 * test that only proves "it fires" would pass just as happily against a cue
 * wired to a timer, which is the exact failure AUDIT.md §"cues fire on the
 * skill, not a timer" exists to prevent.
 */
import { describe, expect, it } from "vitest";
import { Simulation, type VehicleSample } from "../src/quietroads";
import { DEAC } from "../src/quietroads/sim/ledger";

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

function makeSim() {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  sim.startMission("mission_central_ledger");
  return { sim, events, fired: (e: string) => events.filter((x) => x === e).length };
}

/**
 * Sit in Deac's lane `gapM` behind him for `steps`, tracking his lateral
 * position — i.e. actually follow him, which is what a player watching him does.
 */
function follow(sim: Simulation, steps: number, gapM = 12, speedMs = 8) {
  for (let i = 0; i < steps; i++) {
    const l = sim.ledger.leadPos;
    sim.step(1 / 60, sample({ pos: { x: l.x, y: l.y - gapM }, speedMs }));
  }
}

/** Ride behind him, stopping at the step where `beat` first fires. Returns his y. */
function rideUntil(sim: Simulation, events: string[], beat: string, max = 900): number {
  for (let i = 0; i < max; i++) {
    const before = events.length;
    follow(sim, 1);
    if (events.slice(before).includes(beat)) return sim.ledger.leadPos.y;
  }
  return -1;
}

describe("Deac drives the line III-001 describes", () => {
  it("holds his lane, then takes ONE merge late — he is not a straight line", () => {
    const { sim, events } = makeSim();
    const g = sim.map.ledger;
    const laneW = (g.lanes.x1 - g.lanes.x0) / g.lanes.count;

    // Start: squarely in the right travel lane, where the mission spawns him.
    expect(sim.ledger.leadPos.x).toBeCloseTo(g.lead.from.x, 3);

    const startX = sim.ledger.leadPos.x;
    follow(sim, 240);                       // ~4 s, well north of the taper
    // Still in his lane. This is the "hold the lane" half of the card.
    expect(Math.abs(sim.ledger.leadPos.x - startX)).toBeLessThan(0.01);
    expect(events).not.toContain("deac.merge.late");

    follow(sim, 460);                       // ride all the way through the taper
    // ...and then he is a full lane over. That is the merge the cards describe.
    expect(sim.ledger.leadPos.x - startX).toBeGreaterThan(laneW * 0.9);
    expect(events).toContain("deac.merge.late");
  });

  it("takes it LATE — well into the taper, not at the start of it", () => {
    const { sim, events } = makeSim();
    const g = sim.map.ledger;
    const taperLen = g.merge.h;
    const atMerge = rideUntil(sim, events, "deac.merge.late");
    expect(atMerge).toBeGreaterThan(0);
    // He starts moving over at mergeStartFrac INTO the taper...
    expect(atMerge).toBeGreaterThan(g.merge.y + taperLen * DEAC.mergeStartFrac - 1);
    // ...and not merely at its first metre, which is what "late" rules out.
    expect(atMerge).toBeGreaterThan(g.merge.y + 5);
    // He is still within the taper when it happens; he does not dawdle past it.
    expect(atMerge).toBeLessThan(g.merge.y + taperLen);
  });

  it("merges exactly once", () => {
    const { sim, fired } = makeSim();
    follow(sim, 900);
    expect(fired("deac.merge.late")).toBe(1);
    expect(fired("deac.signal")).toBe(1);
  });

  it("turns his nose through the merge rather than sliding sideways", () => {
    const { sim } = makeSim();
    const straight = sim.ledger.leadHeading;
    let min = straight, max = straight;
    for (let i = 0; i < 900; i++) {
      follow(sim, 1);
      min = Math.min(min, sim.ledger.leadHeading);
      max = Math.max(max, sim.ledger.leadHeading);
    }
    // Heading is now derived from real displacement. Were it still hardcoded to
    // PI/2 the model would crab sideways down the road with its nose pointed south.
    expect(max - min).toBeGreaterThan(0.02);
  });

  it("arms out before he merges, not after", () => {
    const { sim, events } = makeSim();
    const signalAt = rideUntil(sim, events, "deac.signal");
    const mergeAt = rideUntil(sim, events, "deac.merge.late");
    expect(signalAt).toBeGreaterThan(0);
    // He signals first. The lateness is in the merge, not in the signal.
    expect(signalAt).toBeLessThan(mergeAt);
  });
});

describe("the merge is something you can witness, not a coordinate", () => {
  /** Sit still at the north end, 100 m behind him. He merges. Nobody saw it. */
  function rideFromTheFarEnd(sim: Simulation, steps = 900) {
    const g = sim.map.ledger;
    for (let i = 0; i < steps; i++) {
      sim.step(1 / 60, sample({ pos: { x: g.lead.from.x, y: 62 }, speedMs: 0 }));
    }
  }

  it("stays shut for a player parked at the far end of the corridor", () => {
    const { sim, events } = makeSim();
    const g = sim.map.ledger;
    rideFromTheFarEnd(sim);
    // The merge genuinely happened down the road...
    expect(sim.ledger.leadPos.y).toBeGreaterThan(g.merge.y);
    // ...and the beats stayed shut, because the player was never there to see them.
    expect(events).not.toContain("deac.merge.late");
    expect(events).not.toContain("deac.signal");
  });

  it("stays shut for a player who has overtaken him", () => {
    const { sim, events } = makeSim();
    // Sit AHEAD of him the whole way. Also not a thing you watched happen.
    for (let i = 0; i < 900; i++) {
      const l = sim.ledger.leadPos;
      sim.step(1 / 60, sample({ pos: { x: l.x, y: l.y + 12 }, speedMs: 12 }));
    }
    expect(events).not.toContain("deac.merge.late");
  });

  it("opens III-013 for a player who follows him through the merge", () => {
    const { sim, events } = makeSim();
    follow(sim, 900);
    expect(events).toContain("card.cue:III-013");
  });

  it("does NOT open III-013 for a player who never witnesses it", () => {
    const { sim, events } = makeSim();
    rideFromTheFarEnd(sim);
    expect(events).not.toContain("card.cue:III-013");
  });
});

describe("alongside / pass.clear survive him changing lanes", () => {
  it("does not grade a player in the right lane BEHIND him as riding alongside", () => {
    // The regression this guards: alongside/pass.clear used to measure a raw
    // world-axis dy, which only worked while Deac drove perfectly straight. Once
    // he merges, a player sitting in lane 0 well behind him reads as |dy| < 8
    // against his lateral travel and would be told they were alongside his trailer.
    const { sim, events } = makeSim();
    for (let i = 0; i < 900; i++) {
      const l = sim.ledger.leadPos;
      sim.step(1 / 60, sample({ pos: { x: l.x, y: l.y - 3 }, speedMs: 8 }));
    }
    // He definitely merged during that run.
    expect(events).toContain("deac.merge.late");
    // ...and a car in his lane behind him was never alongside his trailer.
    expect(events).not.toContain("ledger.alongside");
    expect(events).not.toContain("ledger.pass.clear");
  });

  it("still fires alongside for a player genuinely abreast of him", () => {
    // The other half: the heading-frame projection must not break the real beat.
    const { sim, events } = makeSim();
    const span = (sim.map.ledger.lanes.x1 - sim.map.ledger.lanes.x0) / 3;
    for (let i = 0; i < 60; i++) {
      const l = sim.ledger.leadPos;
      // Sit a lane over and level with him: out of his mirrors (§4.4).
      sim.step(1 / 60, sample({ pos: { x: l.x + span, y: l.y }, speedMs: 8 }));
    }
    expect(events).toContain("ledger.alongside");
  });
});

describe("determinism", () => {
  it("takes the merge in the same place on a re-run", () => {
    const at = () => {
      const { sim, events } = makeSim();
      return rideUntil(sim, events, "deac.merge.late");
    };
    // observedCues.ts and the bench both script fixed laps that depend on this.
    expect(at()).toBeGreaterThan(0);
    expect(at()).toBeCloseTo(at(), 5);
  });
});
