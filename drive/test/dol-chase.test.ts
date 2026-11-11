/**
 * 1.3's chase, on the real sim: Gracie goes out the DOL door and stops near the
 * Beetle, Ali follows her outside, catching her is its own beat, and the car is
 * still a walk away after the catch.
 *
 * The card order rides on this. I-007 opens on `chase.gracie_caught` and I-008
 * on `waypoint.reach:beetle_driver_seat` (fullchain.test.ts), so the catch has
 * to happen outdoors and short of the car, or the two cards land on one spot.
 */
import { describe, expect, it } from "vitest";
import { Simulation, WALKER, type Vec2 } from "../src/quietroads";
import { rectHas } from "../src/quietroads/sim/math";

function makeSim() {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (event) => events.push(event),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  sim.noise.setListeners([]);
  sim.quiet.list.length = 0;
  sim.startMission("stealth_dol_interior");
  return { sim, events };
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

/** Walk the latch beat in: stand on the terminal, then start the chase the way 1.3.chase does. */
function toChase() {
  const made = makeSim();
  const { sim } = made;
  sim.interior.pos = { ...sim.map.dol.terminal };
  sim.stepWalker(1 / 60, { x: 0, y: 0, run: false });
  expect(sim.interior.phase).toBe("latch");
  sim.startMission("chase_dol_gracie");
  expect(sim.interior.phase).toBe("chase");
  return made;
}

/** Head for a point, one frame at a time. */
function walkTo(sim: Simulation, target: () => Vec2, until: () => boolean, seconds = 40) {
  for (let i = 0; i < seconds * 60 && !until(); i++) {
    const p = sim.interior.pos;
    const t = target();
    const d = Math.max(1e-6, dist(p, t));
    sim.stepWalker(1 / 60, { x: (t.x - p.x) / d, y: (t.y - p.y) / d, run: true });
  }
}

describe("1.3 chase — Gracie is out by the car", () => {
  it("she leaves through the door and stops near the Beetle, not inside", () => {
    const { sim } = toChase();
    for (let i = 0; i < 20 * 60; i++) sim.stepWalker(1 / 60, { x: 0, y: 0, run: false });

    const g = sim.interior.gracie.pos;
    expect(rectHas(sim.map.dol.floor, g, 0)).toBe(false);
    expect(dist(g, sim.map.dol.gracieRunTarget)).toBeLessThan(0.3);
    const car = sim.map.starts.dol_stall.pos;
    expect(dist(g, car)).toBeLessThan(12);
    expect(dist(g, car)).toBeGreaterThan(WALKER.SEAT_RADIUS_M + WALKER.CATCH_RADIUS_M);
  });

  it("she is not caught on the frame she bolts from under Ali's hands", () => {
    const { sim, events } = toChase();
    for (let i = 0; i < 60; i++) sim.stepWalker(1 / 60, { x: 0, y: 0, run: false });
    expect(events).not.toContain("chase.gracie_caught");
    expect(sim.interior.phase).toBe("chase");
    expect(sim.interior.gracie.loose).toBe(true);
  });

  it("Ali can step outside during the chase, and not before it", () => {
    const { sim } = makeSim();
    const lot = { x: 232, y: 400 };
    expect(sim.interior.walkable(lot)).toBe(false);
    const chase = toChase().sim;
    expect(chase.interior.walkable(lot)).toBe(true);
  });

  it("the catch is outdoors, and the car is still a walk away after it", () => {
    const { sim, events } = toChase();
    const door = { x: sim.map.dol.door.x + 1.5, y: sim.map.dol.door.y };
    sim.interior.pos = { x: sim.map.dol.door.x - 1, y: sim.map.dol.door.y };
    walkTo(sim, () => door, () => dist(sim.interior.pos, door) < 0.4);
    walkTo(sim, () => sim.interior.gracie.pos, () => events.includes("chase.gracie_caught"));

    expect(events).toContain("chase.gracie_caught");
    expect(events).not.toContain("waypoint.reach:beetle_driver_seat");
    expect(sim.interior.phase).toBe("to_car");
    expect(sim.interior.indoors).toBe(false);

    const car = sim.map.starts.dol_stall.pos;
    walkTo(sim, () => car, () => events.includes("waypoint.reach:beetle_driver_seat"));
    expect(events.indexOf("waypoint.reach:beetle_driver_seat")).toBeGreaterThan(events.indexOf("chase.gracie_caught"));
  });
});
