/**
 * The road home's clock (2026-10-29).
 *
 * 6.2 is the only scene that used to stamp a time: parked before one, awake at
 * five. Everything after it was silent, and two scenes read as if the drive
 * happened in the dark — VII-008's "sky still black … past five" and 8.2's
 * "waiting all night". The order is:
 *
 *   6.2.morning  5:00 a.m. (still dark, the one-to-five is over)
 *   6.3          first light at the Vantage bridge
 *   7.1          Moses Lake at dawn → the escort → Ritzville, gray sky
 *   7.2 / 7.3    the barter and the radio, same morning
 *   8.1          the last two hours, gray going flat white
 *   8.2          Division Street around midday
 *   8.3          one week later (its "last night" is a week old)
 *
 * If a later edit puts night back on the last leg, this fails. The 1–5 a.m.
 * rule is still checked where it belongs (6.2, `straight.test.ts`); here the
 * arrival scenes may not name an hour inside it.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import act6 from "../src/quietroads/data/dialogue_act6.json";
import act7 from "../src/quietroads/data/dialogue_act7.json";
import act8 from "../src/quietroads/data/dialogue_act8.json";

const root = new URL("../../", import.meta.url);
const read = (p: string) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(p, root)), "utf8"));
const gameDeck = read("drive/src/quietroads/data/cards.json") as any[];
const inDrive = (id: string) => gameDeck.find((c) => c.card_id === id);

const scenes = {
  "6.2": (act6 as any).scenes["6.2"],
  "6.3": (act6 as any).scenes["6.3"],
  "7.1": (act7 as any).scenes["7.1"],
  "7.2": (act7 as any).scenes["7.2"],
  "7.3": (act7 as any).scenes["7.3"],
  "8.1": (act8 as any).scenes["8.1"],
  "8.2": (act8 as any).scenes["8.2"],
  "8.3": (act8 as any).scenes["8.3"],
} as Record<string, { nodes: Record<string, any> }>;

const node = (scene: string, id: string) => {
  const n = scenes[scene]?.nodes[id];
  if (!n) throw new Error(`${scene}: missing node ${id}`);
  return n;
};

/** Every authored line/prompt in a scene, with its node id. */
const lines = (scene: string) =>
  Object.entries(scenes[scene].nodes)
    .filter(([, n]) => typeof n.text === "string")
    .map(([id, n]) => ({ id, text: n.text as string }));

const ORDER = ["6.2", "6.3", "7.1", "7.2", "7.3", "8.1", "8.2", "8.3"];

describe("the road home runs in order after the five a.m. wake", () => {
  it("hands each scene to the next, 6.2 → 8.3", () => {
    for (let i = 0; i < ORDER.length - 1; i += 1) {
      const handoffs = Object.values(scenes[ORDER[i]].nodes)
        .map((n: any) => n.next_scene)
        .filter(Boolean);
      expect(handoffs, `${ORDER[i]} → ${ORDER[i + 1]}`).toContain(ORDER[i + 1]);
    }
  });

  it("keeps the only hour stamp at the five a.m. wake", () => {
    expect(node("6.2", "6.2.sleep").text).toContain("Parked before one");
    expect(node("6.2", "6.2.morning").text).toContain("Five a.m.");
    expect(node("6.2", "6.2.morning").text).toContain("Still dark");
    expect(node("7.1", "7.1.0").text).toContain("Dawn");
  });

  it("names no hour inside 1–5 a.m. from 6.3 to the arrival", () => {
    for (const scene of ["6.3", "7.1", "7.2", "7.3", "8.1", "8.2"]) {
      for (const { id, text } of lines(scene)) {
        for (const m of text.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)/gi)) {
          const h = Number(m[1]) % 12 + (/p\.m\./i.test(m[3]) ? 12 : 0);
          expect(h >= 1 && h < 5, `${scene}.${id} names ${m[0]}`).toBe(false);
        }
      }
    }
  });
});

describe("the last leg is daylight", () => {
  it("8.1 leaves Ritzville in the morning, not the black", () => {
    const t = node("8.1", "8.1.0").text;
    expect(t).toContain("flat white");
    expect(t).not.toMatch(/\bblack\b|\bnight\b|\bdark\b/i);
    expect(node("8.1", "8.1.lights_a").text).toContain("Snow in the air");
  });

  it("the Ritzville barter no longer sells a dark two hours", () => {
    for (const id of ["7.2.one3", "7.2.9", "7.2.close_no"]) {
      expect(node("7.2", id).text, id).not.toMatch(/\bdark\b/i);
    }
  });

  it("Division Street lands in daylight: no all-night wait, no tonight", () => {
    expect(node("8.2", "8.2.gm1").text).toContain("waiting since before the sun");
    expect(node("8.2", "8.2.gm1").text).not.toMatch(/all night/i);
    expect(node("8.2", "8.2.lights1").text).not.toMatch(/in the dark/i);
    expect(node("8.2", "8.2.stall_b7").text).not.toContain("tonight");
    for (const scene of ["8.1", "8.2"]) {
      for (const { id, text } of lines(scene)) {
        expect(text, `${scene}.${id}`).not.toMatch(/\bmidnight\b/i);
      }
    }
  });
});

describe("VII-008 and VII-009 agree with the arrival", () => {
  const eight = read("cards/VII-008.json");
  const nine = read("cards/VII-009.json");

  it("VII-008 is a midday park", () => {
    expect(eight.scene).toContain("noon");
    expect(eight.scene).not.toMatch(/still black|past five/i);
    expect(eight.variation.time_of_day).toBe("midday");
    expect(inDrive("VII-008").scene).toBe(eight.scene);
  });

  it("VII-009 is the same daylight arrival", () => {
    expect(nine.variation.time_of_day).toBe("midday");
    expect(inDrive("VII-009").variation.time_of_day).toBe("midday");
  });

  it("VII-008 teaches the park and the checkpoint speed as two clean rules", () => {
    expect(eight.debrief).toMatch(/twelve inches from the curb/i);
    expect(eight.debrief).toMatch(/hold the posted speed/i);
    expect(eight.debrief).not.toMatch(/not ideal/i);
    expect(inDrive("VII-008").debrief).toBe(eight.debrief);
  });
});
