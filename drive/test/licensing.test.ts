/**
 * The licensing exchange at 4.2 and Hank's agricultural line at 7.1 (2026-10-29).
 *
 * The numbers here are the guide's, not the fiction's: DG 1.8 gives the permit
 * hold (6 months), the supervised hours (40 day / 10 night, licensed driver with
 * 3+ years), the intermediate night rule (1–5 a.m. needs a parent, guardian, or
 * licensed driver 25+) and the passenger limits (no under-20 non-family for the
 * first 6 months, three after). 6.2's clock is written against the night rule, so
 * if this scene drifts, the drive and the exam stop agreeing.
 */
import { describe, expect, it } from "vitest";
import act4 from "../src/quietroads/data/dialogue_act4.json";
import act7 from "../src/quietroads/data/dialogue_act7.json";

const fourTwo = (act4 as any).scenes["4.2"].nodes;
const sevenOne = (act7 as any).scenes["7.1"].nodes;

function chain(from: string, nodes: Record<string, any>, max = 12): string[] {
  const out: string[] = [];
  let id: string | undefined = from;
  while (id && out.length < max) {
    out.push(id);
    id = nodes[id]?.next;
  }
  return out;
}

describe("4.2 — the licensing exchange", () => {
  it("runs straight after the stamp, five lines, then the Mya branch", () => {
    expect(chain("4.2.4", fourTwo, 8)).toEqual([
      "4.2.4",
      "4.2.lic1",
      "4.2.lic2",
      "4.2.lic3",
      "4.2.lic4",
      "4.2.lic5",
      "4.2.mya_branch",
    ]);
  });

  it("states the permit hold, the supervised hours and that they are logged", () => {
    const t = fourTwo["4.2.lic1"].text + " " + fourTwo["4.2.lic2"].text;
    expect(t).toContain("Six months");
    expect(t).toContain("Forty hours daylight, ten after dark");
    expect(t).toContain("three years");
    expect(t).toContain("logged");
    expect(t).toMatch(/clipboard/);
  });

  it("states the intermediate night rule and the passenger limits", () => {
    const t = fourTwo["4.2.lic4"].text;
    expect(t).toMatch(/One to five/);
    expect(t).toContain("twenty-five or older");
    expect(t).toMatch(/No passengers under twenty/);
    expect(t).toContain("Three after that");
  });

  it("names the in-fiction Authority waiver and what it does not waive", () => {
    const t = fourTwo["4.2.lic5"].text;
    expect(t).toMatch(/Authority/);
    expect(t).toContain("waives the waiting period");
    expect(t).toContain("not the night");
    expect(t).toMatch(/One to five is still one to five/);
  });
});

describe("7.1 — Hank names the guide's exception without running her at night", () => {
  it("says agricultural, grain, any hour — and then refuses the dark hours", () => {
    const t = sevenOne["7.1.chat8"].text + " " + sevenOne["7.1.chat9"].text;
    expect(t).toMatch(/agricultural/i);
    expect(t).toContain("Grain counts");
    expect(t).toMatch(/One to five in the morning is still one to five/);
    expect(t).toContain("Not midnight");
    expect(sevenOne["7.1.chat7"].next).toBe("7.1.chat8");
    expect(sevenOne["7.1.chat9"].next).toBeUndefined();
  });
});
