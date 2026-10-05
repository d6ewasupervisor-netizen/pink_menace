import { describe, expect, it } from "vitest";
import { CardCues, type CueProbe } from "../src/quietroads/sim/cardCues";
import { followFullGapM } from "../src/quietroads/config";
import { Simulation, rectCenter, type VehicleSample } from "../src/quietroads";
import act3 from "../src/quietroads/data/dialogue_act3.json";
import type { DialogueFile } from "../src/quietroads/dialogue/types";

function sample(over: Partial<VehicleSample> = {}): VehicleSample {
  return {
    pos: { x: 0, y: 0 },
    heading: 0,
    speedMs: 8,
    throttle: 0.2,
    brake: 0,
    steer: 0,
    horn: false,
    ...over,
  };
}

function probe(over: Partial<CueProbe> = {}): CueProbe {
  return {
    missionId: "",
    s: sample(),
    dt: 0.5,
    skidding: false,
    onIce: false,
    parkReady: false,
    inBus: false,
    inLanes: false,
    lead: null,
    ...over,
  };
}

/** A Simulation with its event bus captured — a cue that never reached the bus
 *  never opened, which is what made the old id list worthless as proof. */
function simBus(mission: Parameters<Simulation['startMission']>[0]) {
  const events: string[] = [];
  const sim = new Simulation({
    fire: (e) => events.push(e),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  sim.startMission(mission);
  return {
    sim,
    events,
    cued: (id: string) => events.includes(`card.cue:${id}`),
    grade: (e: string) => events.filter((x) => x === e).length,
  };
}

describe("following gap (BD-1)", () => {
  it("keeps the seconds feel by default: 3s dry, 4s behind a truck", () => {
    expect(followFullGapM(10, "dry")).toBe(30);
    expect(followFullGapM(10, "truck")).toBe(40);
  });

  it("can grade the guide's twice-the-vehicle length instead", () => {
    expect(followFullGapM(10, "dry", "vehicle_lengths")).toBe(8);
    expect(followFullGapM(10, "truck", "vehicle_lengths")).toBe(14);
  });
});

describe("in-scene card cues", () => {
  const WANTED = [
    "II-006", "II-007", "II-008", "II-009", "II-011", "II-012", "II-013", "II-014", "II-015",
    "II-016", "II-017", "II-018", "II-019", "II-020", "II-021", "II-022", "II-023", "II-025",
    "II-026", "II-028", "II-029", "II-031",
    "III-001", "III-005", "III-007", "III-008", "III-009", "III-010", "III-011", "III-012",
    "III-013", "III-014", "III-015", "III-017", "III-018", "III-019", "III-021", "III-022",
    "III-023", "III-024", "III-025", "III-026", "III-027", "III-028", "III-029", "III-030",
    "V-002", "V-004", "V-008", "V-009", "V-011",
    "VI-003", "VI-005", "VI-009", "VI-011", "VI-013",
  ];

  it("offers every previously unwired card once, on its mission", () => {
    const book = new CardCues();
    const got = new Set<string>();
    const see = (ids: string[]) => { for (const id of ids) got.add(id); };

    see(book.step(probe({ missionId: "mission_delivery_3_radio", inBus: true, inLanes: true, s: sample({ speedMs: 13 }) })));
    see(book.step(probe({ missionId: "mission_delivery_3_radio", dt: 9, inLanes: true, s: sample({ speedMs: 1 }) })));
    see(book.step(probe({ missionId: "mission_delivery_3_radio", dt: 2, inLanes: true, s: sample({ speedMs: 0 }) })));
    see(book.onEvent("mission_delivery_3_radio", "lanechange.start"));
    see(book.onEvent("mission_delivery_2_catfood", "backing.start"));
    see(book.onEvent("mission_delivery_2_catfood", "input.hard_brake"));
    see(book.step(probe({ missionId: "mission_delivery_2_catfood", parkReady: true })));
    see(book.onEvent("mission_delivery_4_filters", "park.parallel.start"));
    // II-019 is the ice card: it comes from the climb's ice beat, not from Jonah's
    // dry four-way. See the "cues fire on the skill" suite below.
    see(book.step(probe({
      missionId: "mission_jonah_intersection",
      dt: 5,
      s: sample({ pos: { x: 265, y: 2 }, speedMs: 8 }),
    })));
    see(book.step(probe({
      missionId: "mission_jonah_intersection",
      s: sample({ pos: { x: 265, y: 2 }, speedMs: -1 }),
    })));
    // II-019 (ice), II-025 (the back-out) and II-026 (the door zone) are driven by
    // beats that a raw probe cannot express — on ice, in reverse, at the door.
    // The "cues fire on the skill" suite at the bottom steps the real Simulation
    // for each of them rather than asserting them here.
    see(book.step(probe({ missionId: "climb_snoqualmie", onIce: true })));
    see(book.step(probe({ missionId: "straight_night_drive", s: sample({ speedMs: -1 }) })));
    see(book.onEvent("mission_delivery_2_catfood", "dropoff.walk"));
    see(book.step(probe({ missionId: "dropoff_pharmacy", s: sample({ speedMs: 0 }) })));
    see(book.step(probe({ missionId: "straight_night_drive", dt: 3, s: sample({ beams: "off" }) })));

    const lead = { x: 262, y: 80 };
    see(book.step(probe({
      missionId: "mission_central_ledger",
      dt: 3,
      lead,
      s: sample({ pos: { x: 262, y: 70 }, speedMs: 8 }),
    })));
    see(book.step(probe({
      missionId: "mission_central_ledger",
      dt: 5,
      lead: { x: 262, y: 160 },
      s: sample({ pos: { x: 262, y: 150 }, speedMs: 8 }),
    })));
    see(book.onEvent("mission_central_ledger", "ledger.follow.start"));
    see(book.onEvent("mission_central_ledger", "ledger.follow.close"));
    see(book.onEvent("mission_central_ledger", "ledger.alongside"));
    see(book.onEvent("mission_central_ledger", "ledger.pass.clear"));
    see(book.onEvent("mission_central_ledger", "ledger.wet.enter"));
    see(book.onEvent("mission_central_ledger", "ledger.rumble.ride"));
    see(book.onEvent("mission_central_ledger", "ledger.crossed_solid"));
    see(book.onEvent("mission_central_ledger", "ledger.wrong_lane"));
    see(book.onEvent("mission_central_ledger", "ledger.merge.approach"));
    // III-013 opens on DEAC's late merge, which is the beat its own comment named.
    // It used to be cued off `ledger.merge.slow` (the player's slow merge) instead —
    // see the note in cardCues.ts. `deac.merge.late` is the only event that opens it.
    see(book.onEvent("mission_central_ledger", "deac.merge.late"));
    see(book.onEvent("mission_central_ledger", "ledger.lanechange.start"));
    see(book.onEvent("mission_central_ledger", "ledger.lanechange.clean"));
    see(book.onEvent("mission_central_ledger", "waypoint.reach:ledger_end"));

    see(book.onEvent("mission_ribbon_merge", "ramp.enter"));
    see(book.onEvent("mission_ribbon_merge", "ribbon.merge"));
    see(book.step(probe({ missionId: "mission_ribbon_merge", dt: 6 })));

    see(book.onEvent("mission_backcountry_run", "rural.edge"));
    see(book.onEvent("mission_backcountry_run", "rural.crest.clean"));
    see(book.onEvent("mission_backcountry_run", "rural.uncontrolled.yield"));
    see(book.onEvent("mission_backcountry_run", "rural.crossbuck.clean"));
    see(book.onEvent("mission_backcountry_run", "waypoint.reach:rural_end"));

    const missing = WANTED.filter((id) => !got.has(id));
    expect(missing).toEqual([]);
    expect(book.step(probe({ missionId: "mission_delivery_3_radio", inBus: true }))).toEqual([]);
  });
});

describe("P15 — II-006 and II-012 open on the Ledger drive", () => {
  it("are no longer card nodes in the Act V briefing still", () => {
    const scene = (act3 as DialogueFile).scenes!["3.1"];
    const ids = Object.keys(scene.nodes);
    expect(ids).not.toContain("3.1.card_II-006");
    expect(ids).not.toContain("3.1.card_II-012");
    // …and the briefing does not dead-end: 3.1.1 → 3.1.2, 3.1.4 → 3.1.5.
    expect(scene.nodes["3.1.1"].next).toBe("3.1.2");
    expect(scene.nodes["3.1.4"].next).toBe("3.1.5");
  });

  it("cue II-012 on the follow beat and II-006 on the signal beat", () => {
    const book = new CardCues();
    const got = new Set<string>();
    const see = (ids: string[]) => { for (const id of ids) got.add(id); };

    see(book.onEvent("mission_central_ledger", "ledger.follow.start"));
    see(book.onEvent("mission_central_ledger", "ledger.lanechange.no_signal"));

    expect(got.has("II-012")).toBe(true);
    expect(got.has("II-006")).toBe(true);
  });

  it("keeps the III cards those same events already took", () => {
    const book = new CardCues();
    const follow = book.onEvent("mission_central_ledger", "ledger.follow.start");
    expect(follow).toContain("II-012");
    expect(follow).toContain("III-005");
    expect(follow).toContain("III-009");

    const signal = book.onEvent("mission_central_ledger", "ledger.lanechange.clean");
    expect(signal).toContain("II-006");
    expect(signal).toContain("III-019");
  });

  it("are once per run, like every other take", () => {
    const book = new CardCues();
    book.onEvent("mission_central_ledger", "ledger.follow.start");
    book.onEvent("mission_central_ledger", "ledger.follow.start");
    expect(book.onEvent("mission_central_ledger", "ledger.follow.start")).not.toContain("II-012");

    const signal = new CardCues();
    signal.onEvent("mission_central_ledger", "ledger.lanechange.clean");
    expect(signal.onEvent("mission_central_ledger", "ledger.lanechange.no_signal")).not.toContain("II-006");
  });

  it("reach the sim bus — the Ledger mission emits card.cue for both", () => {
    const { sim, cued, grade } = simBus("mission_central_ledger");
    const lanes = sim.map.ledger.lanes;
    const span = (lanes.x1 - lanes.x0) / lanes.count;
    const y = (lanes.y0 + lanes.y1) / 2;
    const inLane = (i: number) => ({ x: lanes.x0 + span * i + span / 2, y });

    // Follow beat: sit 2 m behind Deac's truck — inside the 3-second gap.
    for (let i = 0; i < 12; i++) {
      const lead = sim.ledger.leadPos;
      sim.step(0.2, sample({ pos: { x: lead.x, y: lead.y - 2 }, heading: Math.PI / 2, speedMs: 11 }));
    }
    // Signal beat: change lane with no steer hold, so it is no_signal.
    sim.step(0.1, sample({ pos: inLane(0), heading: Math.PI / 2, speedMs: 11 }));
    sim.step(0.1, sample({ pos: inLane(1), heading: Math.PI / 2, speedMs: 11 }));

    // The grader fired, and both new cues rode the bus.
    expect(grade("ledger.follow.start")).toBeGreaterThan(0);
    expect(grade("ledger.follow.close")).toBeGreaterThan(0);
    expect(cued("II-012")).toBe(true);
    expect(cued("II-006")).toBe(true);
  });
});

describe("grid cues go through the sim bus", () => {
  it("opens the back-in card when Bea's dock starts", () => {
    const { sim, events } = simBus("mission_delivery_2_catfood");
    const stall = rectCenter(sim.map.grid.beaStall);
    sim.step(1 / 60, sample({ pos: stall, speedMs: -1 }));
    expect(events).toContain("backing.start");
    expect(events).toContain("card.cue:II-015");
  });

  it("opens the lane-change cards when Priya's lanes change", () => {
    const { sim, events } = simBus("mission_delivery_3_radio");
    const lanes = sim.map.grid.lanes;
    const span = (lanes.x1 - lanes.x0) / lanes.count;
    const y = (lanes.y0 + lanes.y1) / 2;
    const at = (index: number) => ({ x: lanes.x0 + span * index + span / 2, y });
    sim.step(1 / 60, sample({ pos: at(0), speedMs: 8 }));
    sim.step(1 / 60, sample({ pos: at(1), speedMs: 8 }));
    expect(events).toContain("lanechange.start");
    expect(events).toContain("card.cue:II-016");
    expect(events).toContain("card.cue:II-017");
    expect(events).toContain("card.cue:II-022");
  });

  it("opens the parallel-park card at Tuna's stall", () => {
    const { sim, events } = simBus("mission_delivery_4_filters");
    const stall = rectCenter(sim.map.grid.tunaStall);
    sim.step(1 / 60, sample({ pos: stall, heading: 0, speedMs: 1 }));
    expect(events).toContain("park.parallel.start");
    expect(events).toContain("card.cue:II-021");
  });
});

/**
 * Every cue opens on the SKILL, and only on the skill.
 *
 * Each case steps the real Simulation and reads the real event bus. The contract
 * is two-sided: a drive that performs the beat fires `card.cue:<id>`, and a drive
 * that never performs it does not. That second half is what the old hardcoded id
 * list could not express — it only ever proved the id was spelled correctly.
 */
describe("cues fire on the skill and not on a timer", () => {
  /** Drive the Ledger mission with one sample per entry. */
  function ledgerRun(at: (lead: { x: number; y: number }, i: number) => Partial<VehicleSample>, steps: number) {
    const { sim, cued, grade } = simBus("mission_central_ledger");
    for (let i = 0; i < steps; i++) {
      const lead = sim.ledger.leadPos;
      sim.step(1 / 60, sample({ pos: { x: lead.x, y: lead.y }, heading: Math.PI / 2, speedMs: 11, ...at(lead, i) }));
    }
    return { sim, cued, grade };
  }

  describe("II-012 / III-005 / III-009 — the follow beat", () => {
    it("fire when she rolls behind Deac's truck holding the gap", () => {
      const { cued, grade } = ledgerRun((lead) => ({ pos: { x: lead.x, y: lead.y - 12 }, speedMs: 11 }), 20);
      expect(grade("ledger.follow.start")).toBeGreaterThan(0);
      expect(cued("II-012")).toBe(true);
      expect(cued("III-005")).toBe(true);
      expect(cued("III-009")).toBe(true);
    });

    it("never fire on a drive that keeps well clear of the truck", () => {
      const { cued, grade } = ledgerRun((lead) => ({ pos: { x: lead.x, y: lead.y - 90 }, speedMs: 11 }), 60);
      expect(grade("ledger.follow.start")).toBe(0);
      expect(cued("II-012")).toBe(false);
      expect(cued("III-005")).toBe(false);
      expect(cued("III-009")).toBe(false);
    });
  });

  describe("III-010 — the too-close result", () => {
    it("stays on the grade event and not on the follow start", () => {
      const book = new CardCues();
      expect(book.onEvent("mission_central_ledger", "ledger.follow.start")).not.toContain("III-010");
      expect(book.onEvent("mission_central_ledger", "ledger.follow.close")).toContain("III-010");
    });
  });

  describe("II-019 — the ice card (§5.6)", () => {
    it("does NOT open on 4 s of dry motion at Jonah's four-way", () => {
      const book = new CardCues();
      for (let i = 0; i < 10; i++) {
        book.step(probe({ missionId: "mission_jonah_intersection", dt: 0.5, s: sample({ pos: { x: 265, y: 2 }, speedMs: 8 }) }));
      }
      expect(book.usedIds.has("II-019")).toBe(false);
    });

    it("opens when the car is actually on ice", () => {
      const book = new CardCues();
      expect(book.step(probe({ missionId: "climb_snoqualmie", onIce: true }))).toContain("II-019");
    });

    it("opens on the climb mission's ice.enter through the sim bus", () => {
      const { sim, cued, grade } = simBus("climb_snoqualmie");
      const ice = sim.map.ice;
      sim.step(1 / 60, sample({ pos: { x: ice.x + ice.w / 2, y: ice.y + ice.h / 2 }, heading: 0, speedMs: 6 }));
      expect(grade("ice.enter")).toBeGreaterThan(0);
      expect(cued("II-019")).toBe(true);
    });
  });

  describe("II-026 — the door-zone card", () => {
    it("does NOT open the moment the back-in grades", () => {
      const book = new CardCues();
      book.step(probe({ missionId: "mission_delivery_2_catfood", parkReady: true }));
      expect(book.usedIds.has("II-026")).toBe(false);
    });

    it("opens on the walk to the door — where a door meets traffic", () => {
      const { sim, cued, grade } = simBus("mission_delivery_2_catfood");
      const stall = rectCenter(sim.map.grid.beaStall);
      sim.step(1 / 60, sample({ pos: stall, speedMs: -1 }));
      // Reverse into the stall, then hold still long enough to grade the back-in.
      for (let i = 0; i < 40; i++) sim.step(1 / 60, sample({ pos: stall, heading: Math.PI / 2, speedMs: -0.2 }));
      for (let i = 0; i < 40; i++) sim.step(1 / 60, sample({ pos: stall, heading: Math.PI / 2, speedMs: 0 }));
      expect(grade("dropoff.walk")).toBeGreaterThan(0);
      expect(cued("II-026")).toBe(true);
    });
  });

  describe("II-025 — the back-out", () => {
    it("does NOT open after 2 s of straight night driving", () => {
      const book = new CardCues();
      book.step(probe({ missionId: "straight_night_drive", dt: 3, s: sample({ speedMs: 12 }) }));
      expect(book.usedIds.has("II-025")).toBe(false);
    });

    it("opens when she selects reverse", () => {
      const book = new CardCues();
      expect(book.step(probe({ missionId: "straight_night_drive", s: sample({ speedMs: -1 }) }))).toContain("II-025");
    });
  });

  describe("III-008 — the solid white", () => {
    it("does NOT open just from being south of y=120", () => {
      const book = new CardCues();
      for (let i = 0; i < 12; i++) {
        book.step(probe({ missionId: "mission_central_ledger", dt: 0.5, s: sample({ pos: { x: 265, y: 150 }, speedMs: 10 }) }));
      }
      expect(book.usedIds.has("III-008")).toBe(false);
    });

    it("opens only when the car actually crosses the solid line", () => {
      const { sim, cued, grade } = simBus("mission_central_ledger");
      const lanes = sim.map.ledger.lanes;
      const span = (lanes.x1 - lanes.x0) / lanes.count;
      const right = lanes.x0 + span / 2;
      sim.step(1 / 60, sample({ pos: { x: right, y: 100 }, heading: Math.PI / 2, speedMs: 10 }));
      sim.step(1 / 60, sample({ pos: { x: right, y: 130 }, heading: Math.PI / 2, speedMs: 10 }));
      sim.step(1 / 60, sample({ pos: { x: lanes.x0 + span * 1.5, y: 131 }, heading: Math.PI / 2, speedMs: 10 }));
      expect(grade("ledger.crossed_solid")).toBeGreaterThan(0);
      expect(cued("III-008")).toBe(true);
    });
  });

  describe("VI-003 — the pile at the edge", () => {
    it("does NOT open on a drive down the middle of the gravel", () => {
      const { sim, cued, grade } = simBus("mission_backcountry_run");
      const road = sim.map.rural.road;
      const mid = road.y + road.h / 2;
      for (let i = 0; i < 40; i++) {
        sim.step(1 / 60, sample({ pos: { x: road.x + 20 + i, y: mid }, heading: 0, speedMs: 18 }));
      }
      expect(grade("rural.edge")).toBe(0);
      expect(cued("VI-003")).toBe(false);
    });

    it("opens while the car is still ON the road, at the gravel edge", () => {
      const { sim, cued, grade } = simBus("mission_backcountry_run");
      const road = sim.map.rural.road;
      const onRoadAtEdge = road.y + 0.6;
      for (let i = 0; i < 20; i++) {
        sim.step(1 / 60, sample({ pos: { x: road.x + 20 + i, y: onRoadAtEdge }, heading: 0, speedMs: 18 }));
      }
      expect(grade("rural.edge")).toBeGreaterThan(0);
      // The sample is inside the road rect, so the hazard fired before the mistake.
      expect(onRoadAtEdge).toBeGreaterThanOrEqual(road.y);
      expect(onRoadAtEdge).toBeLessThan(road.y + road.h);
      expect(cued("VI-003")).toBe(true);
    });
  });

  describe("the Act III sharing cluster", () => {
    it("opens alongside / pass-clear / wet cards on those beats, not on y", () => {
      const { sim, cued, grade } = simBus("mission_central_ledger");
      const lanes = sim.map.ledger.lanes;
      const span = (lanes.x1 - lanes.x0) / lanes.count;

      // Roll behind the truck with room (follow.start).
      for (let i = 0; i < 10; i++) {
        const lead = sim.ledger.leadPos;
        sim.step(1 / 60, sample({ pos: { x: lead.x, y: lead.y - 12 }, heading: Math.PI / 2, speedMs: 11 }));
      }
      expect(cued("II-012")).toBe(true);

      // Move into the left lane while abreast of the lead (alongside).
      const lead = sim.ledger.leadPos;
      sim.step(1 / 60, sample({ pos: { x: lead.x + span * 1.6, y: lead.y }, heading: Math.PI / 2, speedMs: 11 }));
      expect(grade("ledger.alongside")).toBeGreaterThan(0);
      expect(cued("III-011")).toBe(true);
      expect(cued("III-012")).toBe(true);

      // Drop back behind him (pass.clear).
      for (let i = 0; i < 20; i++) {
        const l = sim.ledger.leadPos;
        sim.step(1 / 60, sample({ pos: { x: l.x, y: l.y - 14 }, heading: Math.PI / 2, speedMs: 11 }));
      }
      expect(grade("ledger.pass.clear")).toBeGreaterThan(0);
      expect(cued("III-018")).toBe(true);

      // Run south past the solid white onto the wet paint.
      for (let i = 0; i < 90; i++) {
        sim.step(1 / 60, sample({ pos: { x: lanes.x0 + span / 2, y: 118 + i * 0.5 }, heading: Math.PI / 2, speedMs: 10 }));
      }
      expect(grade("ledger.wet.enter")).toBeGreaterThan(0);
      expect(cued("III-024")).toBe(true);
      expect(cued("III-025")).toBe(true);
    });

    it("opens the rumble card on the line-riding beat, and nothing on a bare event", () => {
      const book = new CardCues();
      expect(book.onEvent("mission_central_ledger", "ledger.rumble.ride")).toContain("III-028");
      // No Act III card is reachable from a bare coordinate any more.
      expect(book.usedIds.has("III-001")).toBe(false);
      expect(book.usedIds.has("III-013")).toBe(false);
    });
  });
});
