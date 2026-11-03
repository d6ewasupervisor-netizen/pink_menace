/**
 * waitWatch — the two clocks that stop a wait from stranding the player.
 * See quietroads/waitWatch.ts and test/deadlock.test.ts for the story.
 */
import { describe, expect, it } from "vitest";
import {
  CUTSCENE_WAIT_S,
  STRANDED_WAIT_S,
  WaitWatch,
  isCutsceneWait,
  type WaitWatchContext,
} from "../src/quietroads/waitWatch";

const frame = 1 / 60;

function run(watch: WaitWatch, seconds: number, ctx: WaitWatchContext) {
  const signals = [];
  for (let t = 0; t < seconds; t += frame) {
    const s = watch.tick(frame, ctx);
    if (s) signals.push(s);
  }
  return signals;
}

const base: WaitWatchContext = {
  waitFor: "cutscene.summit_clear",
  missionActive: false,
  compoundOpen: false,
  paused: false,
};

describe("the cutscene rule", () => {
  it("knows which waits are cutscene marks", () => {
    expect(isCutsceneWait("cutscene.summit_clear")).toBe(true);
    expect(isCutsceneWait("cutscene.")).toBe(true);
    expect(isCutsceneWait("quiet.reason_passed")).toBe(false);
    expect(isCutsceneWait(null)).toBe(false);
  });

  it("answers 5.3's summit wait after the beat, once", () => {
    const w = new WaitWatch();
    const signals = run(w, CUTSCENE_WAIT_S + 1, base);
    expect(signals).toEqual([{ kind: "cutscene", event: "cutscene.summit_clear", waitedS: expect.any(Number) }]);
  });

  it("does not answer a cutscene mark a mission owns (8.2's Spokane waits)", () => {
    const w = new WaitWatch();
    const signals = run(w, CUTSCENE_WAIT_S + 4, { ...base, waitFor: "cutscene.grandma_blanket", missionActive: true });
    expect(signals).toEqual([]);
  });

  it("holds the beat while paused or hidden, then carries on", () => {
    const w = new WaitWatch();
    const held = run(w, CUTSCENE_WAIT_S * 3, { ...base, paused: true });
    expect(held).toEqual([]);
    // Two seconds happened before the pause: only the remaining 0.5 s is spent.
    run(w, CUTSCENE_WAIT_S - 0.5, base);
    expect(run(w, 0.2, base)).toEqual([]);
    expect(run(w, 0.5, base)).toHaveLength(1);
  });

  it("holds while a card is open", () => {
    const w = new WaitWatch();
    expect(run(w, CUTSCENE_WAIT_S * 2, { ...base, compoundOpen: true })).toEqual([]);
    expect(run(w, CUTSCENE_WAIT_S, base)).toHaveLength(1);
  });

  it("starts the clock over when the wait changes", () => {
    const w = new WaitWatch();
    run(w, CUTSCENE_WAIT_S - 0.2, base);
    const other = { ...base, waitFor: "cutscene.ali_out" };
    expect(run(w, 0.5, other)).toEqual([]);
    const s = run(w, CUTSCENE_WAIT_S, other);
    expect(s).toEqual([{ kind: "cutscene", event: "cutscene.ali_out", waitedS: expect.any(Number) }]);
  });
});

describe("the stranded safety net", () => {
  it("names a non-cutscene wait after 8 s with no mission", () => {
    const w = new WaitWatch();
    const ctx = { ...base, waitFor: "summit.typo" };
    expect(run(w, STRANDED_WAIT_S - 1, ctx)).toEqual([]);
    expect(run(w, 2, ctx)).toEqual([{ kind: "stranded", event: "summit.typo", waitedS: expect.any(Number) }]);
  });

  it("says nothing while a mission is running", () => {
    const w = new WaitWatch();
    expect(run(w, STRANDED_WAIT_S * 2, { ...base, waitFor: "tow.start", missionActive: true })).toEqual([]);
  });

  it("resets when the runner stops waiting", () => {
    const w = new WaitWatch();
    run(w, 4, { ...base, waitFor: "tow.start" });
    expect(run(w, 0.2, { ...base, waitFor: null })).toEqual([]);
    expect(w.waitedS).toBe(0);
    expect(w.event).toBeNull();
  });
});
