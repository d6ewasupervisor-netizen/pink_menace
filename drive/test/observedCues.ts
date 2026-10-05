/**
 * Card coverage channel 3, MEASURED by driving the missions.
 *
 * The old coverage test carried a hardcoded array of cued card ids. That proved
 * only that the strings were spelled correctly. It could not distinguish a card
 * that opens when the player performs the skill from one that opens because a
 * timer elapsed, and it silently counted cards the sim never emits — which is how
 * II-012, III-008, II-019, II-025, II-026 and VI-003 shipped with their cues still
 * on timers or bare coordinates.
 *
 * This module drives the real `Simulation` over each cue's beat and collects the
 * `card.cue:<id>` events that actually reach the event bus. If a cue is rewired to
 * a beat the grader never fires, the id simply does not appear and coverage fails
 * without anyone editing a list.
 *
 * `teaching.test.ts` holds the other half of the contract: for each id, that the
 * cue fires on the skill AND stays shut on a drive that never performs it.
 */
import { Simulation, rectCenter, type VehicleSample } from '../src/quietroads';

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

/** A Simulation whose card.cue events are collected into `out`. */
function bus(out: Set<string>) {
  return {
    fire: (e: string) => { if (e.startsWith('card.cue:')) out.add(e.slice('card.cue:'.length)); },
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  };
}

/** Start a mission and collect what its card cues produce over `steps`. */
function drive(
  mission: Parameters<Simulation['startMission']>[0],
  steps: Array<(sim: Simulation) => VehicleSample>,
): Set<string> {
  const out = new Set<string>();
  const sim = new Simulation(bus(out));
  if (!sim.startMission(mission)) return out;
  for (const step of steps) sim.step(1 / 60, step(sim));
  return out;
}

/** Repeat one sample for `n` fixed steps. */
const roll = (n: number, s: VehicleSample) => Array.from({ length: n }, () => () => s);

/** Lane centres for whichever lane set the mission drives. */
function laneCentres(sim: Simulation, mission: string): (i: number) => { x: number; y: number } {
  const lanes = mission === 'mission_central_ledger' ? sim.map.ledger.lanes : sim.map.grid.lanes;
  const span = (lanes.x1 - lanes.x0) / lanes.count;
  const y = (lanes.y0 + lanes.y1) / 2;
  return (i) => ({ x: lanes.x0 + span * i + span / 2, y });
}

export function observedCueIds(): ReadonlySet<string> {
  const all = new Set<string>();
  const add = (ids: Iterable<string>) => { for (const id of ids) all.add(id); };

  // ── Act II — the Grid ──────────────────────────────────────────────────────
  add(drive('mission_delivery_2_catfood', [
    (sim) => sample({ pos: rectCenter(sim.map.grid.beaStall), speedMs: -1 }),  // backing.start
    ...roll(2, sample({ pos: { x: 0, y: 0 }, speedMs: 12 })),                    // rolling
  ]));
  // Reverse into Bea's stall, hold, and walk to the door (II-026).
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('mission_delivery_2_catfood');
    const stall = rectCenter(sim.map.grid.beaStall);
    sim.step(1 / 60, sample({ pos: stall, speedMs: -1 }));
    for (let i = 0; i < 40; i++) sim.step(1 / 60, sample({ pos: stall, heading: Math.PI / 2, speedMs: -0.2 }));
    for (let i = 0; i < 40; i++) sim.step(1 / 60, sample({ pos: stall, heading: Math.PI / 2, speedMs: 0 }));
    add(out);
  }
  // Priya: through the stopped bus, a lane change with and without a signal,
  // a stop in the lanes, a long rolling stretch, then a hard stop.
  add(drive('mission_delivery_3_radio', (() => {
    const lanes = { x0: 260, x1: 270 };
    const span = (lanes.x1 - lanes.x0) / 3;
    const lane = (i: number, y: number) => ({ x: lanes.x0 + span * i + span / 2, y });
    const step = (pos: { x: number; y: number }, over: Partial<VehicleSample> = {}) =>
      sample({ pos, heading: Math.PI / 2, speedMs: 8, ...over });
    const out: Array<(sim: Simulation) => VehicleSample> = [];
    // The bus beat (II-007) and the lane change (II-016 / II-017 / II-022).
    out.push((sim) => step({ ...lane(0, 18) }, { speedMs: 13 }));
    out.push((sim) => step({ ...lane(0, 50) }, { speedMs: 13 }));
    out.push((sim) => step({ ...lane(1, 52) }, { speedMs: 13 }));
    // Hold in the lanes long enough for the work-zone stop card (II-023).
    for (let i = 0; i < 100; i++) out.push((sim) => step({ ...lane(1, 40) }, { speedMs: 0 }));
    // A long rolling stretch (II-008), then a hard stop (II-031).
    for (let i = 0; i < 700; i++) out.push((sim) => step({ ...lane(1, 6 + i * 0.05) }, { speedMs: 10 }));
    out.push((sim) => step({ ...lane(1, 50) }, { speedMs: 8, brake: 0.9 }));
    return out;
  })()));
  // The pharmacy walk is on foot, so it goes through stepWalker (II-011).
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('dropoff_pharmacy');
    sim.stepWalker(1 / 60, { x: 0, y: 0, run: false });
    sim.stepWalker(1 / 60, { x: 1, y: 0, run: false });
    add(out);
  }
  add(drive('mission_delivery_4_filters', [
    (sim) => sample({ pos: rectCenter(sim.map.grid.tunaStall), heading: 0, speedMs: 1 }),
  ]));
  add(drive('mission_jonah_intersection', [
    () => sample({ pos: { x: 265, y: 4 }, heading: Math.PI / 2, speedMs: 9 }),
    () => sample({ pos: { x: 265, y: 4 }, speedMs: -0.8 }),
  ]));
  add(drive('dropoff_pharmacy', [() => sample({ pos: { x: 0, y: 0 }, speedMs: 0 })]));
  // The night straight: rolling with the beams off (II-020), then a back-out (II-025).
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('straight_night_drive');
    for (let i = 0; i < 200; i++) {
      sim.step(1 / 60, sample({ pos: { x: 60 + i * 0.5, y: 880 }, heading: 0, speedMs: 12, beams: 'off' }));
    }
    sim.step(1 / 60, sample({ pos: { x: 200, y: 880 }, heading: 0, speedMs: -1 }));
    add(out);
  }
  add(drive('climb_snoqualmie', [
    (sim) => { const i = sim.map.ice; return sample({ pos: { x: i.x + i.w / 2, y: i.y + i.h / 2 }, heading: 0, speedMs: 6 }); },
  ]));

  // ── Act III — Central, the Ledger run ─────────────────────────────────────
  // follow → alongside → pass-clear → lane change → passing lane → wet → merge → home.
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('mission_central_ledger');
    const lanes = sim.map.ledger.lanes;
    const span = (lanes.x1 - lanes.x0) / lanes.count;
    const lane = (i: number) => ({ x: lanes.x0 + span * i + span / 2, y: lanes.y1 });
    const step = (pos: { x: number; y: number }, speedMs = 11) =>
      sim.step(1 / 60, sample({ pos, heading: Math.PI / 2, speedMs }));
    for (let i = 0; i < 10; i++) { const l = sim.ledger.leadPos; step({ x: l.x, y: l.y - 12 }); }
    for (let i = 0; i < 10; i++) { const l = sim.ledger.leadPos; step({ x: l.x, y: l.y - 3 }); }
    const lead = sim.ledger.leadPos;
    step({ x: lead.x + span * 1.6, y: lead.y });
    for (let i = 0; i < 20; i++) { const q = sim.ledger.leadPos; step({ x: q.x, y: q.y - 14 }); }
    step(lane(0), 10);
    step({ x: lane(0).x, y: 130 }, 10);
    step({ x: lanes.x0 + span * 1.5, y: 131 }, 10);
    // Loiter in the passing lane long enough to be a habit (III-015/023/029 need 2 s).
    // Kept north of y=150 so it does not enter the merge rect and consume it.
    for (let i = 0; i < 160; i++) step({ x: lanes.x0 + span * 2.5, y: 62 + i * 0.5 }, 10);
    for (let i = 0; i < 60; i++) step({ x: lanes.x0 + span / 2, y: 118 + i * 0.6 }, 10);
    for (let i = 0; i < 30; i++) step({ x: lanes.x0 + span * 0.5, y: 152 + i * 0.4 }, 2);
    for (let i = 0; i < 30; i++) step({ x: lanes.x0 + span * 1.5, y: 164 + i * 0.2 }, 2);
    for (let i = 0; i < 60; i++) step({ x: 265, y: 171 + i * 0.2 }, 10);
    add(out);
  }

  // ── Act III — riding behind Deac all the way to HIS late merge ──────────────
  // III-013 ("Twenty-Six, None Preventable") is a beat about something Deac does,
  // not something the player does: he takes one merge late, on purpose, and the
  // card is for having watched it. The run above exercises every player skill on
  // Central but it stops well short of the lane-drop taper — Deac is still around
  // y≈118 by the end of it — so it can never witness the merge.
  //
  // So drive it properly: sit in his lane the whole way down, at a following
  // distance, and let him take the lane. This is also the only thing that proves
  // the witness gate in LedgerRun.trackDeac actually lets a legitimately-present
  // player through.
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('mission_central_ledger');
    // 18 mph ≈ 8.05 m/s; from y=78 to the end of the taper (y≈170) is ~92 m,
    // so ~690 fixed steps at 1/60 covers it with room to spare.
    for (let i = 0; i < 700; i++) {
      const l = sim.ledger.leadPos;
      // Track his lateral position so the player stays in the lane he is in and
      // stays behind him — that is what "witnessed" means here.
      sim.step(1 / 60, sample({ pos: { x: l.x, y: l.y - 12 }, heading: Math.PI / 2, speedMs: 8 }));
    }
    add(out);
  }

  // ── Act V — the Ribbon: the on-ramp, rolling, then the merge itself ──────────
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('mission_ribbon_merge');
    const ramp = sim.map.ribbon.ramp;
    const lanes = sim.map.ribbon.lanes;
    const span = (lanes.x1 - lanes.x0) / lanes.count;
    const step = (pos: { x: number; y: number }, over: Partial<VehicleSample> = {}) =>
      sim.step(1 / 60, sample({ pos, heading: Math.PI / 2, speedMs: 16, ...over }));
    // Up the ramp — `ramp.enter`, and V-008 once the cone line has lasted 5 s.
    for (let i = 0; i < 420; i++) step({ x: ramp.x + ramp.w / 2, y: ramp.y + i * 0.8 }, { speedMs: 14, steer: 0.6 });
    // Left off the ramp into a lane: the merge itself (V-009 / V-011).
    for (let i = 0; i < 60; i++) {
      const from = ramp.x + ramp.w / 2;
      const to = lanes.x0 + span * 0.5;
      step({ x: from + (to - from) * (i / 60), y: ramp.y + 336 }, { speedMs: 20, steer: -0.4 });
    }
    add(out);
  }

  // ── Act VI — the Backcountry: edge → crest → four-way → crossbuck → home ──
  {
    const out = new Set<string>();
    const sim = new Simulation(bus(out));
    sim.startMission('mission_backcountry_run');
    const r = sim.map.rural;
    const mid = r.road.y + r.road.h / 2;
    const step = (x: number, y: number, speedMs: number) =>
      sim.step(1 / 60, sample({ pos: { x, y }, heading: 0, speedMs }));
    for (let i = 0; i < 400; i++) step(60 + i, r.road.y + 0.6, 18);
    for (let i = 0; i < 420; i++) step(460 + i, mid, 16);
    for (let i = 0; i < 360; i++) step(880 + i, mid, 3);
    for (let i = 0; i < 360; i++) step(1240 + i, mid, 3);
    for (let i = 0; i < 120; i++) step(1450 + i, mid, 5);
    add(out);
  }

  return all;
}