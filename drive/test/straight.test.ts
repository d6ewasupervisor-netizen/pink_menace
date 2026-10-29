/**
 * 6.2 "The Straight" — the clock (2026-10-29).
 *
 * The exam teaches the rule this scene can break: questions_v1 `c1_008` — on a
 * first-year intermediate license you may not drive between 1 and 5 a.m. without
 * a 25+ supervisor, and Ali drives the road home alone. So 6.2 has to put every
 * driving leg outside that window, on both of its paths:
 *
 *   stop at the rest area:  dusk → night → pull in → park → radio → sleep
 *   push through:           dusk → night → past the ramp → microsleep → rumble
 *                           strip → forced stop → park → radio → sleep
 *
 * The clock is stamped twice and only twice: `6.2.sleep` ("Parked before one.")
 * and `6.2.morning` ("Five a.m. … The one-to-five is over and so is the sleep.").
 * This file walks both paths and holds that: the driving nodes all precede the
 * "parked before one" stamp, those two are the only clock in the scene, and
 * neither lands inside 1:00–5:00 a.m.
 *
 * If a later edit puts a time on a driving line, or moves the drive-on → rumble
 * → forced-stop leg after the park, this fails.
 */
import { describe, expect, it } from "vitest";
import act6 from "../src/quietroads/data/dialogue_act6.json";

type Node = {
  type: string;
  next?: string;
  next_scene?: string;
  choices?: { id: string; next: string; effects?: any }[];
  branches?: { condition?: { flag?: string; is?: boolean }; next?: string }[];
  text?: string;
  card?: string;
  effects?: any;
};

const scene = (act6 as any).scenes["6.2"] as { nodes: Record<string, Node>; entry: string };
const nodes = scene.nodes;

/** Follow the graph from `from`, taking named choices and skipping waits/cards. */
function walk(from: string, picks: Record<string, string> = {}, flags: Record<string, boolean> = {}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let id: string | undefined = from;
  while (id && !seen.has(id)) {
    seen.add(id);
    const n = nodes[id];
    if (!n) throw new Error(`6.2: missing node ${id}`);
    out.push(id);
    if (n.type === "branch") {
      const hit = (n.branches ?? []).find((b) => {
        const c = b.condition;
        if (!c || !c.flag) return true;
        return (flags[c.flag] ?? false) === c.is;
      });
      id = hit?.next;
      continue;
    }
    if (n.type === "choice") {
      const want = picks[id];
      const pick = want ? n.choices?.find((c) => c.id === want) : n.choices?.[0];
      id = pick?.next;
      continue;
    }
    if (n.type === "end") {
      id = n.next; // resident ends (6.2.go, 6.2.forced) have no `next`
      continue;
    }
    id = n.next;
  }
  return out;
}

/** Every clock stamp in the scene: node id + the text. */
function clockStamps(): { id: string; text: string }[] {
  return Object.entries(nodes)
    .filter(([, n]) => typeof n.text === "string")
    .map(([id, n]) => ({ id, text: n.text as string }))
    .filter((n) => /\b(a\.m\.|p\.m\.)\b|\bbefore one\b|\bone-to-five\b|\bmidnight\b|\bnoon\b/i.test(n.text));
}

/** Times named in a line, as decimal hours on a 24h clock. */
function hoursIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)/gi)) {
    let h = Number(m[1]) % 12;
    if (/p\.m\./i.test(m[3])) h += 12;
    out.push(h + (m[2] ? Number(m[2]) / 60 : 0));
  }
  return out;
}

const DRIVING = ["6.2.drive_on", "6.2.drift", "6.2.6", "6.2.7", "6.2.8", "6.2.forced"];

describe("6.2 — the clock stays outside 1:00–5:00 a.m. on both paths", () => {
  it("stamps the clock twice and only twice", () => {
    const stamps = clockStamps().map((s) => s.id);
    expect(stamps.sort()).toEqual(["6.2.morning", "6.2.sleep"]);
    expect(nodes["6.2.sleep"].text).toContain("Parked before one");
    expect(nodes["6.2.morning"].text).toContain("Five a.m.");
    expect(nodes["6.2.morning"].text).toContain("one-to-five is over");
  });

  it("names no hour inside 1–5 a.m. anywhere in the scene", () => {
    for (const { id, text } of clockStamps()) {
      for (const h of hoursIn(text)) {
        expect(h >= 1 && h < 5, `${id} names an hour inside 1–5 a.m.: ${h}`).toBe(false);
      }
    }
    for (const [id, n] of Object.entries(nodes)) {
      if (!n.text) continue;
      for (const h of hoursIn(n.text)) {
        expect(h >= 1 && h < 5, `${id} names an hour inside 1–5 a.m.: ${h}`).toBe(false);
      }
    }
  });

  it("pushes through: drive on → rumble strip → forced stop, all before the park", () => {
    const path = walk("6.2.rest_C", { "6.2.rest_C": "drive" });
    expect(path.slice(0, 12)).toEqual([
      "6.2.rest_C",
      "6.2.drive_on",
      "6.2.wait_drift",
      "6.2.drift",
      "6.2.wait_rumble",
      "6.2.6",
      "6.2.7",
      "6.2.8",
      "6.2.forced",
      "6.2.wait_parked2",
      "6.2.8b",
      "6.2.card_III-020",
    ]);
    // The forced stop is a resident end: the mission parks the car, then 6.2.9.
    expect(nodes["6.2.forced"].effects.start_gameplay).toBe("rest_area_forced");
    expect(path).toContain("6.2.sleep");
    expect(path).toContain("6.2.morning");
    for (const id of DRIVING) {
      expect(path.indexOf(id), `${id} walked`).toBeGreaterThan(-1);
      expect(path.indexOf(id), `${id} before the park`).toBeLessThan(path.indexOf("6.2.sleep"));
    }
    expect(path.indexOf("6.2.sleep")).toBeLessThan(path.indexOf("6.2.morning"));
  });

  it("stops at the rest area: pull in → park → radio → sleep → five a.m.", () => {
    const path = walk("6.2.rest_C", { "6.2.rest_C": "stop" });
    expect(path.slice(0, 5)).toEqual(["6.2.rest_C", "6.2.pullin", "6.2.pullin_fx", "6.2.wait_parked", "6.2.9"]);
    expect(nodes["6.2.pullin_fx"].effects.start_gameplay).toBe("rest_area_pullin");
    expect(path.indexOf("6.2.sleep")).toBeLessThan(path.indexOf("6.2.morning"));
    for (const id of DRIVING) expect(path).not.toContain(id);
  });

  it("the tire-check morning is at five, after the sleep, before 6.3", () => {
    const path = walk("6.2.morning", {}, {});
    expect(path.slice(0, 4)).toEqual(["6.2.morning", "6.2.tire_C", "6.2.tire_yes", "6.2.end"]);
    const check = nodes["6.2.tire_C"].choices ?? [];
    expect(check.map((c) => c.id)).toEqual(["check", "skip"]);
    expect(check[0].effects.set_flags.tire_checked).toBe(true);
    for (const c of check) expect(c.next).toMatch(/^6\.2\.tire_(yes|no)$/);
    expect(nodes["6.2.tire_yes"].next).toBe("6.2.end");
    expect(nodes["6.2.tire_no"].next).toBe("6.2.end");
    expect(nodes["6.2.end"].next_scene).toBe("6.3");
    // 6.3 opens predawn: the tire check is first light, not the middle of night.
    expect(nodes["6.2.morning"].text).toContain("Still dark");
    expect(walk("6.2.end")).toEqual(["6.2.end"]);
  });

  it("takes the retry back to the depot with no clock of its own", () => {
    const fresh = walk("6.2.entry", {}, { straight_retry: false });
    // VII-005 opens on the way out of the depot (6.2.pre -> card -> 6.2.go).
    expect(fresh.slice(0, 5)).toEqual(["6.2.entry", "6.2.0", "6.2.pre", "6.2.card_VII-005", "6.2.go"]);
    const retry = walk("6.2.entry", {}, { straight_retry: true });
    expect(retry.slice(0, 3)).toEqual(["6.2.entry", "6.2.retry", "6.2.go"]);
    expect(hoursIn(nodes["6.2.retry"].text ?? "")).toEqual([]);
  });
});
