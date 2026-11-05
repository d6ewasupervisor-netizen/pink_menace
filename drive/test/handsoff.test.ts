/**
 * The hands-off overlay: 6.3's sixty seconds, and everything that must stop
 * while it is up.
 *
 * Her HAR: the engine-off wait started the mission four times, `engine.start_early`
 * fired six times and `bridge_wait_restarts` reached three — because the scene
 * said "hands off" and the phone said "touch a stick". And the phone locked itself
 * mid-wait (83,910 ms `client.stall`), which is what a minute of not touching it
 * does.
 *
 * This file pins four things: the wait's catalogue against the scene data (so the
 * ring and the story cannot drift apart), the countdown being a pure function of
 * the *sim's* clock (so a pause or a locked phone holds it), the input lock (the
 * one rule that makes `engine.start_early` unreachable), and the wake lock.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import {
  BRIDGE_HANDS_OFF,
  BRIDGE_WAIT_S,
  HANDS_OFF_WAITS,
  handsOffFor,
  handsOffView,
} from "../src/quietroads/handsoff";
import { ScreenWakeKeeper, type WakeSentinelLike } from "../src/systems/screenWakeLock";
import type { DialogueFile } from "../src/quietroads";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, "..");
const ACT6 = path.join(DRIVE, "src", "quietroads", "data", "dialogue_act6.json");
const GAME3D = path.join(DRIVE, "src", "components", "Game3D");

const act6 = JSON.parse(fs.readFileSync(ACT6, "utf8")) as DialogueFile;
const scene63 = act6.scenes["6.3"];

describe("the wait is in the catalogue, and the data agrees with it", () => {
  it("only 6.3's engine-off minute is a hands-off wait", () => {
    expect(HANDS_OFF_WAITS.map((w) => w.mission)).toEqual(["bridge_engine_off_wait"]);
    expect(handsOffFor("bridge_engine_off_wait")).toBe(BRIDGE_HANDS_OFF);
    // The crossing itself is a driving mission: no overlay, the sticks stay.
    expect(handsOffFor("vantage_bridge_crossing")).toBeNull();
    expect(handsOffFor("")).toBeNull();
    expect(handsOffFor(null)).toBeNull();
  });

  it("the marks are the scene's own marks, in order", () => {
    const waited = Object.values(scene63.nodes)
      .filter((n) => n.type === "wait" && (n.wait_for ?? "").startsWith("bridge.wait:"))
      .map((n) => Number((n.wait_for ?? "").split(":")[1]))
      .sort((a, b) => a - b);
    expect(waited).toEqual([...BRIDGE_HANDS_OFF.marks]);
    expect(BRIDGE_HANDS_OFF.marks[BRIDGE_HANDS_OFF.marks.length - 1]).toBe(BRIDGE_WAIT_S);
  });

  it("the sim's wait is the overlay's wait — one number, two readers", () => {
    // beats.ts holds the park counter; if it used a different 60 the ring would
    // finish before the story's last mark (or after it).
    const beats = fs.readFileSync(path.join(DRIVE, "src", "quietroads", "sim", "beats.ts"), "utf8");
    expect(beats).toContain("BRIDGE_WAIT_S");
    expect(beats).not.toMatch(/park\s*<\s*60\b/);
    expect(beats).not.toMatch(/\[15,\s*30,\s*45,\s*60\]/);
  });
});

describe("the countdown is the sim's clock, not the wall clock", () => {
  it("runs the ring down across the wait", () => {
    expect(handsOffView(BRIDGE_HANDS_OFF, 0)).toMatchObject({ remainingS: 60, fraction: 1, mark: 0, spent: false, released: false });
    expect(handsOffView(BRIDGE_HANDS_OFF, 14.2)).toMatchObject({ remainingS: 46, mark: 0 });
    expect(handsOffView(BRIDGE_HANDS_OFF, 15)).toMatchObject({ mark: 15 });
    expect(handsOffView(BRIDGE_HANDS_OFF, 45.5)).toMatchObject({ remainingS: 15, mark: 45 });
    expect(handsOffView(BRIDGE_HANDS_OFF, 60)).toMatchObject({ remainingS: 0, fraction: 0, mark: 60, spent: true, released: false });
    expect(handsOffView(BRIDGE_HANDS_OFF, 63.9)).toMatchObject({ spent: true, released: false });
    expect(handsOffView(BRIDGE_HANDS_OFF, 64)).toMatchObject({ released: true });
  });

  it("the same elapsed time is the same ring, however much wall time passed", () => {
    // A held clock is indistinguishable from a slow one: that is what makes a
    // paused game or a locked phone hold the countdown instead of spending it.
    expect(handsOffView(BRIDGE_HANDS_OFF, 20)).toEqual(handsOffView(BRIDGE_HANDS_OFF, 20));
  });

  it("the overlay reads `sim.waitElapsedS` and never `performance.now()`", () => {
    const bridge = fs.readFileSync(path.join(DRIVE, "src", "systems", "QuietRoadsBridge.ts"), "utf8");
    const start = bridge.indexOf("private syncHandsOff(");
    expect(start).toBeGreaterThan(-1);
    const body = bridge.slice(start, bridge.indexOf("private releaseStale(", start));
    expect(body).toContain("this.sim.waitElapsedS");
    expect(body).not.toMatch(/performance\.now|Date\.now/);
  });
});

describe("every driving input is ignored while the overlay is up", () => {
  let input: typeof import('../src/input/driveInput');
  beforeEach(async () => {
    input = await import('../src/input/driveInput');
    input.setDriveInputLocked(false);
    input.clearStickAxes();
    input.liveKeys.clear();
    input.setLivePad(null);
  });

  it('the sticks a thumb is already on merge to nothing', () => {
    input.setStickAxes({ steer: 0.9, throttle: 1, brake: 0, active: true });
    input.setDriveInputLocked(true);
    expect(input.driveInputLocked()).toBe(true);
    expect(input.mergeDriveInput(1)).toEqual({ steering: 0, throttle: 0, brake: 0, emergencyBrake: false });
  });

  it('a stick event during the wait is refused, so it cannot be armed behind it', () => {
    input.setDriveInputLocked(true);
    input.setStickAxes({ steer: 1, throttle: 1, brake: 0, active: true });
    expect(input.getStickAxes()).toMatchObject({ throttle: 0, steer: 0, active: false });
    expect(input.mergeDriveInput(1).throttle).toBe(0);
  });

  it('keys and the handbrake are ignored too, and the car comes back after', () => {
    input.liveKeys.add('ArrowUp');
    input.liveKeys.add(' ');
    input.setDriveInputLocked(true);
    expect(input.mergeDriveInput(1)).toEqual({ steering: 0, throttle: 0, brake: 0, emergencyBrake: false });
    input.setDriveInputLocked(false);
    const after = input.mergeDriveInput(1);
    expect(after.throttle).toBe(1);
    expect(after.emergencyBrake).toBe(true);
  });
});

describe('the surfaces stand down while it is up', () => {
  const read = (file: string) => fs.readFileSync(path.join(GAME3D, file), 'utf8');

  it('the sticks are not rendered', () => {
    const src = read('TouchOverlay.tsx');
    expect(src).toContain('useQRHud((s) => s.handsOff)');
    expect(src).toMatch(/if \(handsOff\) return null;/);
    expect(src).toContain('data-layer="sticks"');
  });

  it('the dialogue box stands down — the overlay carries the line', () => {
    const src = read('DialogueBox.tsx');
    expect(src).toContain('useQRHud((s) => s.handsOff)');
    expect(src).toMatch(/if \(handsOff\) return null;/);
  });

  it('the overlay draws the title, the ring and the 15/30/45/60 marks', () => {
    const src = read('HandsOffOverlay.tsx');
    expect(src).toContain('data-layer="hands-off"');
    expect(src).toContain('data-hands-off-remaining');
    expect(src).toContain('data-hands-off-mark-tick');
    expect(src).toContain('wait.title');
    expect(src).toContain('wait.marks.map');
    // The line area is the overlay's, not the box's.
    expect(src).toContain('data-hands-off-text');
  });
});

/** A platform that hands out sentinels and lets a test drop one. */
function fakeHost() {
  const sentinels: { released: boolean; release(): Promise<void>; addEventListener?(t: 'release', fn: () => void): void }[] = [];
  let requests = 0;
  return {
    sentinels,
    get requests() { return requests; },
    host: {
      wakeLock: {
        request: async (type: 'screen') => {
          requests += 1;
          if (type !== 'screen') throw new Error('wrong type');
          const listeners: (() => void)[] = [];
          const sentinel = {
            released: false,
            async release() { sentinel.released = true; for (const fn of listeners) fn(); },
            addEventListener(_t: 'release', fn: () => void) { listeners.push(fn); },
          };
          sentinels.push(sentinel);
          return sentinel;
        },
      },
    },
  };
}

describe('the screen is held awake for the wait', () => {
  it('asks once, however many times the overlay mounts', async () => {
    const f = fakeHost();
    const keeper = new ScreenWakeKeeper(() => f.host);
    expect(await keeper.acquire()).toBe(true);
    expect(await keeper.acquire()).toBe(true);
    expect(f.requests).toBe(1);
    expect(keeper.active).toBe(true);
  });

  it('gives it back when the wait is over', async () => {
    const f = fakeHost();
    const keeper = new ScreenWakeKeeper(() => f.host);
    await keeper.acquire();
    await keeper.release();
    expect(f.sentinels[0].released).toBe(true);
    expect(keeper.releases).toBe(1);
    expect(keeper.active).toBe(false);
    // A second release is a no-op, not a second call.
    await keeper.release();
    expect(keeper.releases).toBe(1);
  });

  it('re-requests after the platform drops it, and only while it is still wanted', async () => {
    const f = fakeHost();
    const keeper = new ScreenWakeKeeper(() => f.host);
    await keeper.acquire();
    // The phone locks: the platform releases the sentinel on its own.
    const first = f.sentinels[0];
    (first as WakeSentinelLike).released = true;
    expect(await keeper.onVisible()).toBe(true);   // still wanted → a new request
    expect(f.requests).toBe(2);
    await keeper.release();
    (f.sentinels[1] as WakeSentinelLike).released = true;
    expect(await keeper.onVisible()).toBe(false);  // no longer wanted → nothing
    expect(f.requests).toBe(2);
  });

  it('fails silently where the API does not exist (older Safari, in-app webviews)', async () => {
    const keeper = new ScreenWakeKeeper(() => ({}));
    await expect(keeper.acquire()).resolves.toBe(false);
    await expect(keeper.release()).resolves.toBeUndefined();
    const noNav = new ScreenWakeKeeper(() => null);
    await expect(noNav.acquire()).resolves.toBe(false);
  });
});
