/**
 * 5.2's chain-up, measured by driving it.
 *
 * The scene's whole completion path is `chainup.qte.success` -> `5.2.3` ->
 * `5.2.end` -> `5.3`. That event came from `ChainupRun`, whose success window
 * was `brake > 0.2 && brake < 0.85` for 3.5 s while `brake > 0.92` fired
 * `chainup.qte.drop` — but the pedal ramps to 1.0 in 0.6 s and keys/pads are
 * binary, so the only brake a player can make was outside the success window and
 * inside the fail window. Stopping the car fired "the tensioner hits the ice"
 * every 4 s and the scene could not be finished at all. There was no prompt and
 * the objective ("Tighten. Don't drop it.") named no place and no gesture.
 *
 * These tests drive the real `Simulation` into the real `DialogueRunner`, so the
 * chain is proven end to end: arrival geometry -> QTE -> trigger -> 5.2.3 ->
 * 5.3, plus the no-chains route to Tuna's (2.8).
 */
import { describe, expect, it } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import type { DialogueFile, DialogueHost } from "../src/quietroads/dialogue/types";
import { Simulation } from "../src/quietroads/sim/Simulation";
import type { VehicleSample } from "../src/quietroads/sim/vehicleObserver";
import type { Vec2 } from "../src/quietroads/sim/math";
import { CHAIN_ARRIVE_M, CHAIN_TIGHTEN_S } from "../src/quietroads/sim/chainup";
import act2 from "../src/quietroads/data/dialogue_act2.json";
import act5 from "../src/quietroads/data/dialogue_act5.json";

const STEP = 1 / 60;

function car(pos: Vec2, over: Partial<VehicleSample> = {}): VehicleSample {
  return { pos, heading: Math.PI / 2, speedMs: 0, throttle: 0, brake: 0, steer: 0, horn: false, ...over };
}

function boot(withChains: boolean) {
  const flags: Record<string, boolean> = {};
  const items = new Set<string>(withChains ? ["chains"] : []);
  const vars: Record<string, number> = {};
  const gameplay: string[] = [];
  const finished: string[] = [];
  const host: DialogueHost = {
    getVar: (n) => vars[n] ?? NaN,
    setVar: (n, v) => { vars[n] = v; },
    addVar: (n, d) => { vars[n] = (vars[n] || 0) + d; },
    getFlag: (n) => flags[n],
    setFlag: (n, v) => { flags[n] = v; },
    hasItem: (n) => items.has(n),
    giveItem: (n) => { items.add(n); },
    unlock: () => {},
    emitNoise: () => {},
    playSfx: () => {},
    animCue: () => {},
    checkpoint: () => {},
    ledger: () => {},
    logEvent: () => {},
    logChoice: () => {},
    startGameplay: (id) => { gameplay.push(id); },
    setTimer: () => 0,
    clearTimer: () => {},
    now: () => 0,
    random: () => 0,
  };
  const runner = new DialogueRunner(host);
  runner.load(structuredClone(act2) as unknown as DialogueFile);
  runner.load(structuredClone(act5) as unknown as DialogueFile);
  runner.on("scene_finished", (id, next) => finished.push(`${id}->${next}`));

  const events: string[] = [];
  const objectives: string[] = [];
  const prompts: Array<{ label: string; hint: string; progress: number } | null> = [];
  const sim = new Simulation({
    fire: (e) => { events.push(e); runner.onEvent(e); },
    requestQuiz: () => {},
    setObjective: (t) => objectives.push(t),
    toast: () => {},
    placeVehicle: () => {},
    setQte: (q) => prompts.push(q),
  });
  return { runner, sim, flags, gameplay, finished, events, objectives, prompts };
}

/** Tap through everything on screen until the runner goes idle or the scene ends. */
function tapThrough(r: DialogueRunner) {
  for (let i = 0; i < 100 && r.current; i++) r.advance();
}

/** Enter 5.2 (with or without the chains) and walk the dialogue to `start_gameplay`. */
function enterChainup(withChains = true) {
  const h = boot(withChains);
  h.runner.startScene("5.2");
  tapThrough(h.runner);
  return h;
}


describe("5.2 chain-up: the QTE can be finished by stopping the car", () => {
  it("drives in, stops, holds the brake, and 5.2 walks to 5.3", () => {
    const h = enterChainup(true);
    expect(h.gameplay).toContain("chainup_qte");
    expect(h.sim.startMission("chainup_qte")).toBe(true);
    const pin = h.sim.chainup.pin;

    // 40 m short of the pull-out: the objective carries the distance.
    h.sim.step(STEP, car({ x: pin.x, y: pin.y - 40 }, { speedMs: 6 }));
    expect(h.objectives.at(-1)).toMatch(/Chain-up is 40 m up the grade/);
    expect(h.prompts.at(-1)).toBeNull();

    // Rolling into the bay: it asks for a stop, not a gesture yet.
    h.sim.step(STEP, car(pin, { speedMs: 3 }));
    expect(h.objectives.at(-1)).toMatch(/You're in the pull-out\. Stop it/);

    // Stopped, holding a keyboard brake — 1.0, the value arrows/S and pads make.
    const steps = Math.ceil(CHAIN_TIGHTEN_S / STEP) + 6;
    for (let i = 0; i < steps; i++) h.sim.step(STEP, car(pin, { brake: 1 }));

    expect(h.events).toContain("chainup.qte.success");
    expect(h.events).not.toContain("chainup.qte.drop");
    expect(h.objectives.at(-1)).toMatch(/Brake down and hold\. Drape, hook, tighten/);
    expect(h.prompts.some((p) => p && p.label === "HOLD THE BRAKE")).toBe(true);
    expect(h.prompts.at(-1)).toBeNull();

    tapThrough(h.runner);
    expect(h.flags.chains_mounted).toBe(true);
    expect(h.finished).toEqual(["5.2->5.3"]);
  });

  it("arrival is generous: the whole bay, any heading", () => {
    const h = enterChainup(true);
    h.sim.startMission("chainup_qte");
    const pin = h.sim.chainup.pin;
    // 20 m short of the pin, nose pointing back down the grade, brake held.
    const at = { x: pin.x, y: pin.y - 20 };
    expect(20).toBeLessThan(CHAIN_ARRIVE_M);
    const steps = Math.ceil(CHAIN_TIGHTEN_S / STEP) + 6;
    for (let i = 0; i < steps; i++) h.sim.step(STEP, car(at, { heading: -Math.PI / 2, brake: 1 }));

    expect(h.events).toContain("chainup.qte.success");
    expect(h.events).not.toContain("chainup.qte.drop");
  });

  it("a stab at speed still drops the tensioner, and nothing succeeds", () => {
    const h = enterChainup(true);
    h.sim.startMission("chainup_qte");
    const pin = h.sim.chainup.pin;
    for (let i = 0; i < 12; i++) h.sim.step(STEP, car(pin, { speedMs: 8, brake: 0.95 }));

    expect(h.events).toContain("chainup.qte.drop");
    expect(h.events).not.toContain("chainup.qte.success");
  });

  it("revving it drops the tensioner too", () => {
    const h = enterChainup(true);
    h.sim.startMission("chainup_qte");
    const pin = h.sim.chainup.pin;
    for (let i = 0; i < 12; i++) h.sim.step(STEP, car(pin, { throttle: 0.9 }));

    expect(h.events).toContain("chainup.qte.drop");
    expect(h.events).not.toContain("chainup.qte.success");
  });

  it("no chains: the sign turns her around to Tuna's (5.2 -> 2.8)", () => {
    const h = enterChainup(false);
    expect(h.gameplay).not.toContain("chainup_qte");
    expect(h.flags.chainup_blocked).toBe(true);
    expect(h.finished).toEqual(["5.2->2.8"]);
  });
});
