/**
 * The bridge's graders report a crossing, not a level.
 *
 * The 6.3 HAR, 23 s on Vantage Bridge at 52–59 in a 45: `speed.over:45` reached
 * the client 1,693 times (every frame she was over) and `steer.overcorrect`
 * fired the same way whenever the touch stick was pinned past 0.7 — and
 * `plow.used` fired 17 times in one instant on contact. Each of those is one
 * mistake; nothing in the story wants the frame count of it.
 *
 * These tests drive the real `Simulation` + `BeatRun` (no poking at the private
 * state), so a re-wired emitter fails here.
 */
import { describe, expect, it } from 'vitest';
import { PLOW_REARM_S, Simulation, type VehicleSample } from '../src/quietroads';
import { BRIDGE_HANDS_OFF, handsOffView } from '../src/quietroads/handsoff';
import { bridge } from '../src/quietroads/sim/corridors';

const HM = 0.44704; // mph → m/s

function sample(over: Partial<VehicleSample> = {}): VehicleSample {
  return {
    pos: { x: bridge.start.x, y: bridge.start.y },
    heading: 0,
    speedMs: 0,
    throttle: 0,
    brake: 0,
    steer: 0,
    horn: false,
    ...over,
  };
}

function makeSim(mission: Parameters<Simulation['startMission']>[0]) {
  const events: { event: string; data?: Record<string, unknown> }[] = [];
  const sim = new Simulation({
    fire: (event, data) => events.push({ event, data }),
    requestQuiz: () => {},
    setObjective: () => {},
    toast: () => {},
    placeVehicle: () => {},
  });
  sim.noise.setListeners([]);     // the herd's ears are not what this file measures
  sim.quiet.list.length = 0;      // a plow needs a Quiet under the car; place them per test
  sim.startMission(mission);
  events.length = 0;
  return { sim, events, count: (name: string) => events.filter((e) => e.event === name).length };
}

const step = (sim: Simulation, seconds: number, over: Partial<VehicleSample> = {}, hz = 60) => {
  for (let i = 0; i < Math.round(seconds * hz); i++) sim.step(1 / hz, sample(over));
};

describe('speed.over:45 is edge-triggered', () => {
  it('fires once when she crosses the limit, not once per frame', () => {
    const { sim, count } = makeSim('vantage_bridge_crossing');
    step(sim, 1, { speedMs: 40 * HM });          // under
    step(sim, 23, { speedMs: 56 * HM });         // 1,380 frames over the limit
    expect(count('speed.over:45')).toBe(1);
  });

  it('re-arms below the limit and reports the next crossing', () => {
    const { sim, count, events } = makeSim('vantage_bridge_crossing');
    step(sim, 1, { speedMs: 40 * HM });
    step(sim, 2, { speedMs: 56 * HM });          // over → one report
    step(sim, 2, { speedMs: 44 * HM });          // inside the 2 mph hysteresis: still armed
    expect(count('speed.over:45')).toBe(1);
    step(sim, 2, { speedMs: 42 * HM });          // 43 or below re-arms
    step(sim, 2, { speedMs: 50 * HM });          // crossing again → the second report
    expect(count('speed.over:45')).toBe(2);
    expect(events.find((e) => e.event === 'speed.over:45')?.data).toEqual({ mph: 56 });
  });
});

describe('steer.overcorrect is a held gesture, not a level', () => {
  it('a pinned stick reports once per 2 s cooldown, not once per frame', () => {
    const { sim, count } = makeSim('vantage_bridge_crossing');
    step(sim, 1, { speedMs: 20 * HM, steer: 1 });
    expect(count('steer.overcorrect')).toBe(1);
    step(sim, 9, { speedMs: 20 * HM, steer: 1 });
    // 10 s pinned at 60 Hz is 600 frames that used to be 600 events.
    expect(count('steer.overcorrect')).toBeGreaterThanOrEqual(5);
    expect(count('steer.overcorrect')).toBeLessThanOrEqual(6);
  });

  it('a small correction is not an overcorrection', () => {
    const { sim, count } = makeSim('vantage_bridge_crossing');
    step(sim, 6, { speedMs: 20 * HM, steer: 0.3 });
    expect(count('steer.overcorrect')).toBe(0);
    expect(count('steer.into_wind')).toBe(1);
  });
});

describe('plow.used is one report per contact episode', () => {
  it('a second of contact is one event, not one per frame', () => {
    const { sim, count } = makeSim('vantage_bridge_crossing');
    expect(sim.quiet.list.length).toBe(0);
    // One Quiet inside the nose's reach (halfLen + radius = 2.45 m): a plow is
    // head-on contact, not a grade.
    sim.quiet.spawn({ x: bridge.start.x + 2, y: bridge.start.y }, () => 0.5);
    step(sim, 1, { speedMs: 8 });
    expect(count('plow.used')).toBe(1);
    // Still in contact a moment later: no second report inside the same episode.
    step(sim, PLOW_REARM_S * 0.5, { speedMs: 8 });
    expect(count('plow.used')).toBe(1);
  });

  it('clear road ends the episode, so the next hit is its own report', () => {
    const { sim, count } = makeSim('vantage_bridge_crossing');
    sim.quiet.spawn({ x: bridge.start.x + 2, y: bridge.start.y }, () => 0.5);
    step(sim, 0.2, { speedMs: 8 });
    expect(count('plow.used')).toBe(1);
    // Clear road for longer than the re-arm window.
    const clear = { pos: { x: bridge.start.x + 200, y: bridge.start.y }, speedMs: 8 };
    step(sim, PLOW_REARM_S + 0.5, clear);
    expect(count('plow.used')).toBe(1);
    // Back onto the herd (a fresh Quiet in the nose's reach — the first one was
    // shoved off it): the second hit is reported.
    sim.quiet.spawn({ x: bridge.start.x + 2, y: bridge.start.y }, () => 0.5);
    step(sim, 0.2, { speedMs: 8 });
    expect(count('plow.used')).toBe(2);
  });

  it('the contact is still one row when it is counted in telemetry', () => {
    const { sim, events } = makeSim('vantage_bridge_crossing');
    sim.quiet.spawn({ x: bridge.start.x + 2, y: bridge.start.y }, () => 0.5);
    step(sim, 1, { speedMs: 8 });
    // The 6.3 HAR had 17 of these for one hit.
    expect(events.filter((e) => e.event === 'plow.used')).toHaveLength(1);
  });
});

describe('the engine-off wait hands the car back after the minute', () => {
  const parked = { pos: { x: bridge.mid.x, y: bridge.mid.y }, speedMs: 0 };

  it('keeps the restart path for a car that does start early', () => {
    const { sim, count } = makeSim('bridge_engine_off_wait');
    step(sim, 5, parked);
    // A thumb on the throttle five seconds in is the mistake the scene answers.
    step(sim, 0.2, { ...parked, throttle: 0.8, speedMs: 4 });
    expect(count('engine.start_early')).toBe(1);
  });

  it('a throttle press after the minute is "Okay. Key. Gentle. Go.", not a restart', () => {
    const { sim, count } = makeSim('bridge_engine_off_wait');
    step(sim, 61, parked);
    expect(count('bridge.wait:60')).toBe(1);
    expect(sim.waitElapsedS).toBeGreaterThanOrEqual(60);
    step(sim, 3, { ...parked, throttle: 0.8, speedMs: 6 });
    // Before the guard this fired `engine.start_early` → 6.3.restart → "Sixty.
    // From the top.", which is why her HAR shows the mission starting four times.
    expect(count('engine.start_early')).toBe(0);
  });

  it('the clock keeps running past the minute, so the overlay can let go', () => {
    const { sim } = makeSim('bridge_engine_off_wait');
    step(sim, 70, parked);
    // The overlay releases at 60 + its 4 s tail (quietroads/handsoff.ts). A clock
    // that stopped dead on 60 held the panel — and the input lock — for ever.
    expect(sim.waitElapsedS).toBeGreaterThan(64);
    expect(handsOffView(BRIDGE_HANDS_OFF, sim.waitElapsedS).released).toBe(true);
  });
});

describe('the engine-off wait clock', () => {
  it("is the sim's own, and it holds while the world is frozen", () => {
    const { sim, count } = makeSim('bridge_engine_off_wait');
    // Parked at the mid start: still and off the throttle.
    step(sim, 14, { pos: { x: bridge.mid.x, y: bridge.mid.y } });
    expect(sim.waitElapsedS).toBeGreaterThan(13.9);
    expect(count('bridge.wait:15')).toBe(0);

    sim.freeze('paused');
    step(sim, 10, { pos: { x: bridge.mid.x, y: bridge.mid.y } });
    expect(sim.waitElapsedS).toBeGreaterThan(13.9);
    expect(sim.waitElapsedS).toBeLessThan(14.1);  // ten frozen seconds spent nothing

    sim.unfreeze('paused');
    step(sim, 2, { pos: { x: bridge.mid.x, y: bridge.mid.y } });
    expect(sim.waitElapsedS).toBeGreaterThan(15.8);
    expect(count('bridge.wait:15')).toBe(1);
  });
});
