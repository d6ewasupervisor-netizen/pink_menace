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
import act01 from "../src/quietroads/data/dialogue_act0-1.json";
import act2 from "../src/quietroads/data/dialogue_act2.json";
import act2central from "../src/quietroads/data/dialogue_act2_central.json";
import act3 from "../src/quietroads/data/dialogue_act3.json";
import act4 from "../src/quietroads/data/dialogue_act4.json";
import act7 from "../src/quietroads/data/dialogue_act7.json";

const fourTwo = (act4 as any).scenes["4.2"].nodes;
const sevenOne = (act7 as any).scenes["7.1"].nodes;
const twoTwo = (act2 as any).scenes["2.2"].nodes;

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

describe("2.2 — Deac names the 1.1 violation and the supervision rule", () => {
  it("runs the exchange between the permit line and the cat", () => {
    expect(chain("2.2.12", twoTwo, 7)).toEqual([
      "2.2.12",
      "2.2.super1",
      "2.2.super2",
      "2.2.super3",
      "2.2.super4",
      "2.2.super5",
      "2.2.13",
    ]);
  });

  it("names permit, licensed adult, alone — as the first failure", () => {
    const t = twoTwo["2.2.super1"].text + " " + twoTwo["2.2.super2"].text;
    expect(t).toContain("licensing office");
    expect(t).toContain("No permit");
    expect(t).toContain("no licensed adult in the seat");
    expect(t).toContain("Alone");
    expect(t).toContain("first thing I'd have failed you on");
  });

  it("lets Ali stay flat and lets Deac call it what it was", () => {
    expect(twoTwo["2.2.super3"].speaker).toBe("ALI");
    expect(twoTwo["2.2.super3"].text).toBe("It was four miles.");
    expect(twoTwo["2.2.super4"].speaker).toBe("DEAC");
    expect(twoTwo["2.2.super4"].text).toBe("It was a violation.");
  });

  it("states the guide's rule and labels the Authority's as the Authority's", () => {
    const t = twoTwo["2.2.super5"].text;
    expect(t).toContain("licensed adult with three years in the seat");
    expect(t).toContain("That's the guide's");
    expect(t).toContain("Mine's the Authority's");
    expect(t).toContain("not the same rule");
    expect(t).toContain("radio open");
    expect(t).toContain("licensed driver on the net");
    expect(t).toContain("In the car for the first one");
    expect(t).toContain("On the radio after");
  });
});

describe("pre-4.2 driving — nobody solo is left unaccounted for", () => {
  it("1.1 is the one deliberate violation: no adult, and no permit yet", () => {
    const oneOne = (act01 as any).scenes["1.1"].nodes;
    expect(Object.values(oneOne).some((n: any) => n.speaker === "DEAC")).toBe(false);
    expect(oneOne["1.1.11"].text).toContain("get a permit");
    expect(Object.keys(oneOne)).not.toContain("1.1.supervisor");
  });

  it("0.2 and 1.2 are the private carport and the DOL lot", () => {
    expect((act01 as any).scenes["0.2"].location).toBe("grandma_carport");
    expect((act01 as any).scenes["1.2"].location).toBe("kent_dol_lot");
  });

  it("delivery one puts Deac in the car, as 2.2.super5 promises", () => {
    const d1 = (act2 as any).scenes["2.3a"];
    expect(d1.title).toContain("Deac rides along");
    expect(d1.nodes["2.3a.brief"].text).toContain("I'm riding");
    expect(twoTwo["2.2.super5"].text).toContain("In the car for the first one");
  });

  it("the later deliveries and the convoy run on the open radio", () => {
    for (const id of ["2.3b", "2.3c", "2.3d", "2.4"]) {
      const s = (act2 as any).scenes[id];
      expect(s, id).toBeDefined();
      const riders = Object.values(s.nodes).filter(
        (n: any) => n.speaker === "DEAC" && n.delivery === "S" && /riding|passenger seat/i.test(String(n.text || "")),
      );
      expect(riders, `${id} has no stated in-car supervisor`).toEqual([]);
    }
    expect((act2central as any).scenes["2.5"].nodes["2.5.0"].speaker).toBe("DEAC");
    expect((act2central as any).scenes["2.5"].nodes["2.5.0"].delivery).toBe("S");
    // 2.5's correction barks are the radio (delivery "G"), not a passenger.
    expect((act2central as any).scenes["2.5"].nodes["2.5.close"].delivery).toBe("G");
    // The convoy's lead talks to her on the radio for the whole freeway leg.
    const threeTwo = (act3 as any).scenes["3.2"].nodes;
    expect(threeTwo["3.2.1"].speaker).toBe("DEAC");
    expect(threeTwo["3.2.1"].delivery).toBe("R");
    expect(twoTwo["2.2.super5"].text).toContain("On the radio after");
  });
});

describe("7.1 — Hank names the guide's exception without running her at night", () => {
  it("says agricultural, grain, any hour — and then refuses the dark hours", () => {
    const t = sevenOne["7.1.chat8"].text + " " + sevenOne["7.1.chat9"].text;
    expect(t).toMatch(/agricultural/i);
    expect(t).toContain("Grain counts");
    expect(t).toMatch(/One to five in the morning is still one to five/);
    expect(t).toContain("Not midnight");
    // Wheat country, not a pass: the county, not the mountain.
    expect(t).toContain("The county calls it harvest");
    expect(t).not.toMatch(/mountain calls it a harvest/);
    expect(sevenOne["7.1.chat7"].next).toBe("7.1.chat8");
    expect(sevenOne["7.1.chat9"].next).toBeUndefined();
  });
});
