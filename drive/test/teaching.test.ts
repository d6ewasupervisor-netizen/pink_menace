import { describe, expect, it } from "vitest";
import { CardCues, type CueProbe } from "../src/quietroads/sim/cardCues";
import { followFullGapM } from "../src/quietroads/config";
import { Simulation, rectCenter, type VehicleSample } from "../src/quietroads";

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
    "II-007", "II-008", "II-009", "II-011", "II-013", "II-014", "II-015", "II-016", "II-017",
    "II-018", "II-019", "II-020", "II-021", "II-022", "II-023", "II-025", "II-026", "II-028",
    "II-029", "II-031",
    "III-001", "III-005", "III-008", "III-009", "III-010", "III-011", "III-012", "III-013",
    "III-014", "III-015", "III-017", "III-018", "III-019", "III-021", "III-022", "III-023",
    "III-024", "III-025", "III-026", "III-027", "III-028", "III-029", "III-030",
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
    see(book.step(probe({
      missionId: "mission_jonah_intersection",
      dt: 5,
      s: sample({ pos: { x: 265, y: 2 }, speedMs: 8 }),
    })));
    see(book.step(probe({
      missionId: "mission_jonah_intersection",
      s: sample({ pos: { x: 265, y: 2 }, speedMs: -1 }),
    })));
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
    see(book.onEvent("mission_central_ledger", "ledger.follow.close"));
    see(book.onEvent("mission_central_ledger", "ledger.follow.close"));
    see(book.onEvent("mission_central_ledger", "ledger.merge.approach"));
    see(book.onEvent("mission_central_ledger", "ledger.lanechange.start"));
    see(book.onEvent("mission_central_ledger", "ledger.lanechange.clean"));
    see(book.onEvent("mission_central_ledger", "waypoint.reach:ledger_end"));

    see(book.onEvent("mission_ribbon_merge", "ramp.enter"));
    see(book.onEvent("mission_ribbon_merge", "ribbon.merge"));
    see(book.step(probe({ missionId: "mission_ribbon_merge", dt: 6 })));

    see(book.onEvent("mission_backcountry_run", "rural.shoulder"));
    see(book.onEvent("mission_backcountry_run", "rural.crest.clean"));
    see(book.onEvent("mission_backcountry_run", "rural.uncontrolled.yield"));
    see(book.onEvent("mission_backcountry_run", "rural.crossbuck.clean"));
    see(book.onEvent("mission_backcountry_run", "waypoint.reach:rural_end"));

    const missing = WANTED.filter((id) => !got.has(id));
    expect(missing).toEqual([]);
    expect(book.step(probe({ missionId: "mission_delivery_3_radio", inBus: true }))).toEqual([]);
  });
});

describe("grid cues go through the sim bus", () => {
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

  it("opens the back-in card when Bea's dock starts", () => {
    const { sim, events } = harness();
    sim.startMission("mission_delivery_2_catfood");
    const stall = rectCenter(sim.map.grid.beaStall);
    sim.step(1 / 60, sample({ pos: stall, speedMs: -1 }));
    expect(events).toContain("backing.start");
    expect(events).toContain("card.cue:II-015");
  });

  it("opens the lane-change cards when Priya's lanes change", () => {
    const { sim, events } = harness();
    sim.startMission("mission_delivery_3_radio");
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

  it("opens the parallel-park card at Tuna’s stall", () => {
    const { sim, events } = harness();
    sim.startMission("mission_delivery_4_filters");
    const stall = rectCenter(sim.map.grid.tunaStall);
    sim.step(1 / 60, sample({ pos: stall, heading: 0, speedMs: 1 }));
    expect(events).toContain("park.parallel.start");
    expect(events).toContain("card.cue:II-021");
  });
});
