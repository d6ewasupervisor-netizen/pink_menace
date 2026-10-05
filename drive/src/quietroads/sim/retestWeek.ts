import { dist, rectCenter, rectHas, type Rect, type Vec2 } from "./math";
import type { WorldMap } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";
import { FOLLOW, followFullGapM, GUIDE_SPACE } from "../config";

/**
 * Act IV retest week. The exam's weak chapter and the missed questions' guide
 * refs pick one existing Kent street skill. Licensing (chapter 1) has no
 * maneuver in the guide, so that week still drives the local stop and says
 * the chapter is the book.
 */
export type RetestKind = "stop" | "speed" | "school" | "fourway" | "backin" | "lanes" | "gap";

export type RetestStart =
  | "retest_meeker"
  | "retest_school"
  | "retest_fourway"
  | "retest_lanes"
  | "bea_alley"
  | "ledger_south";

export interface RetestPlan {
  kind: RetestKind;
  objective: string;
  limitMph: number;
  start: RetestStart;
}

const SCHOOL = ["4.17"];
const PARK = ["4.18", "2.11", "4.14"];
const ROW = ["4.13", "4.15"];
const SPACE = ["5.2"];
const SPEED = ["5.1", "5.6"];
const SIGNS = ["4.12", "4.11"];
const MARK = ["4.16"];

const TEXT: Record<RetestKind, string> = {
  stop: "Full stop at the line. Then past it.",
  speed: "Twenty-five. Full stop at the line. Then past it.",
  school: "School zone is twenty. Then the far side.",
  fourway: "Full stop. First in goes first. Then through.",
  backin: "Back into the stall. Stop.",
  lanes: "Hold the right lane to the end of the block.",
  gap: `${GUIDE_SPACE} Count three seconds off a mark. Stay behind the truck.`,
};

const LICENSE = "The license chapter is the book. Full stop at the line, then past it.";

function hits(refs: string[], needles: string[]) {
  return refs.reduce((n, ref) => n + (needles.some((s) => ref.includes(s)) ? 1 : 0), 0);
}

function defaultKind(chapter: number): RetestKind {
  switch (chapter) {
    case 2: return "lanes";
    case 3: return "fourway";
    case 4: return "backin";
    case 5: return "speed";
    default: return "stop";
  }
}

export function retestPlan(chapter: number, guideRefs: string[]): RetestPlan {
  const scored: [RetestKind, number][] = [
    ["school", hits(guideRefs, SCHOOL)],
    ["backin", hits(guideRefs, PARK)],
    ["fourway", hits(guideRefs, ROW)],
    ["gap", hits(guideRefs, SPACE)],
    ["speed", hits(guideRefs, SPEED)],
    ["stop", hits(guideRefs, SIGNS)],
    ["lanes", hits(guideRefs, MARK)],
  ];
  const top = Math.max(...scored.map((s) => s[1]));
  const winners = scored.filter((s) => s[1] === top && top > 0);
  const fromDefault = winners.length !== 1;
  const kind = winners.length === 1 ? winners[0][0] : defaultKind(chapter);
  const license = fromDefault && kind === "stop" && chapter <= 1;
  return {
    kind,
    objective: license ? LICENSE : TEXT[kind],
    limitMph: 25,
    start: startFor(kind),
  };
}

function startFor(kind: RetestKind): RetestStart {
  switch (kind) {
    case "school": return "retest_school";
    case "fourway": return "retest_fourway";
    case "backin": return "bea_alley";
    case "lanes": return "retest_lanes";
    case "gap": return "ledger_south";
    default: return "retest_meeker";
  }
}

function zone(map: WorldMap, kind: string, id: string): Rect | null {
  const d = map.zones.find((z) => z.kind === kind && z.id === id);
  return d ? d.rect : null;
}

function laneIndex(lanes: { x0: number; x1: number; y0: number; y1: number; count: number }, p: Vec2) {
  if (p.y < lanes.y0 || p.y > lanes.y1 || p.x < lanes.x0 || p.x > lanes.x1) return -1;
  const i = Math.floor(((p.x - lanes.x0) / (lanes.x1 - lanes.x0)) * lanes.count);
  return Math.max(0, Math.min(lanes.count - 1, i));
}

export class RetestWeek {
  active = false;
  plan: RetestPlan | null = null;
  private stopped = false;
  private dirty = false;
  /**
   * The grade the week earned: "pass" when the beat was met cleanly, "miss" when
   * a rule was blown on the way (a rolled stop, an over-speed inside the graded
   * window, a gap that closed). Set once, when the week completes — this is the
   * same result that decides `week.elapsed`, not a second opinion.
   */
  result: "pass" | "miss" | null = null;
  private backed = false;
  private hold = 0;
  private gapHold = 0;
  private leftLane = false;
  private seenSchool = false;
  private done = false;

  begin(plan: RetestPlan) {
    this.active = true;
    this.plan = plan;
    this.stopped = this.dirty = this.backed = this.leftLane = this.seenSchool = this.done = false;
    this.hold = this.gapHold = 0;
    this.result = null;
  }

  clear() {
    this.active = false;
    this.plan = null;
    this.done = false;
    this.result = null;
  }

  note(event: string, data?: Record<string, unknown>) {
    if (!this.active || !this.plan || this.done) return;
    const kind = this.plan.kind;
    const stopId = String(data?.stop ?? "");
    if (event === "speed.over" && (kind === "speed" || kind === "school")) { this.dirty = true; this.result = "miss"; }
    if (event === "zone.school.enter" && kind === "school") { this.seenSchool = true; this.dirty = false; }
    if (event === "stop.full") {
      const want = kind === "fourway" ? "titus_central" : "meeker";
      if ((kind === "stop" || kind === "speed" || kind === "fourway") && stopId === want && !this.dirty) this.stopped = true;
    }
    // A rolled stop is a blown rule: the week is a miss even if the driver goes
    // round again and finally parks. The recorded result never goes back to pass.
    if (event === "stop.rolled" && (stopId === "meeker" || stopId === "titus_central")) {
      this.stopped = false;
      this.result = "miss";
    }
    if (event === "ledger.follow.close" && kind === "gap") { this.gapHold = 0; this.result = "miss"; }
  }

  /** Short line after the stop is done, so the pin is the remaining ask. */
  hint(): string | null {
    if (!this.plan || !this.stopped) return null;
    if (this.plan.kind === "stop" || this.plan.kind === "speed") return "Past the line.";
    if (this.plan.kind === "fourway") return "Through.";
    return null;
  }

  pin(map: WorldMap): { pos: Vec2; label: string } | null {
    if (!this.plan) return null;
    const kind = this.plan.kind;
    if (kind === "stop" || kind === "speed") {
      const r = zone(map, "stop", "meeker");
      if (!r) return null;
      return { pos: { x: r.x + r.w + 12, y: r.y + r.h / 2 }, label: "PAST" };
    }
    if (kind === "fourway") {
      const r = zone(map, "stop", "titus_central");
      if (!r) return null;
      return { pos: { x: r.x + r.w + 14, y: r.y + r.h / 2 }, label: "THROUGH" };
    }
    if (kind === "school") {
      const r = zone(map, "school", "central");
      if (!r) return null;
      return { pos: { x: r.x + r.w / 2, y: r.y + r.h + 8 }, label: "FAR SIDE" };
    }
    if (kind === "backin") return { pos: rectCenter(map.grid.beaStall), label: "STALL" };
    if (kind === "lanes") {
      const lanes = map.grid.lanes;
      const span = (lanes.x1 - lanes.x0) / lanes.count;
      return { pos: { x: lanes.x0 + span / 2, y: lanes.y1 - 2 }, label: "END" };
    }
    return null;
  }

  /** True once, when the beat's grade is met. */
  step(dt: number, s: VehicleSample, map: WorldMap, lead: Vec2 | null): boolean {
    if (!this.active || !this.plan || this.done) return false;
    const kind = this.plan.kind;
    let finished = false;
    if (kind === "stop" || kind === "speed" || kind === "fourway") finished = this.pastStop(s, map, kind);
    else if (kind === "school") finished = this.farSide(s, map);
    else if (kind === "backin") finished = this.stall(dt, s, map);
    else if (kind === "lanes") finished = this.rightLane(s, map);
    else if (kind === "gap") finished = this.gap(dt, s, lead);
    if (!finished) return false;
    this.done = true;
    this.active = false;
    // A clean run is a pass. `note()` already recorded a miss for any blown rule,
    // so a null result here means nothing was violated.
    if (this.result == null) this.result = "pass";
    return true;
  }

  private pastStop(s: VehicleSample, map: WorldMap, kind: RetestKind) {
    const id = kind === "fourway" ? "titus_central" : "meeker";
    const r = zone(map, "stop", id);
    if (!r) return false;
    // Back past the approach re-arms a blown speed or a rolled stop.
    if (s.pos.x < r.x - 25) {
      this.dirty = false;
      this.stopped = false;
    }
    const pin = this.pin(map);
    return !!pin && this.stopped && !this.dirty && dist(s.pos, pin.pos) < 10;
  }

  private farSide(s: VehicleSample, map: WorldMap) {
    const r = zone(map, "school", "central");
    if (!r || this.dirty || !this.seenSchool) return false;
    return s.pos.y > r.y + r.h + 4 && s.pos.x > r.x - 4 && s.pos.x < r.x + r.w + 4;
  }

  private stall(dt: number, s: VehicleSample, map: WorldMap) {
    const stall = map.grid.beaStall;
    const near = dist(s.pos, rectCenter(stall)) < 14;
    if (s.speedMs < -0.35 && near) this.backed = true;
    if (rectHas(stall, s.pos) && this.backed && Math.abs(s.speedMs) < 0.22) this.hold += dt;
    else this.hold = 0;
    return this.hold >= 0.55;
  }

  private rightLane(s: VehicleSample, map: WorldMap) {
    const lanes = map.grid.lanes;
    if (s.pos.y < lanes.y0 + 4) this.leftLane = false;
    const lane = laneIndex(lanes, s.pos);
    if (lane > 0) this.leftLane = true;
    return !this.leftLane && lane === 0 && s.pos.y >= lanes.y1 - 2;
  }

  private gap(dt: number, s: VehicleSample, lead: Vec2 | null) {
    if (!lead || Math.abs(s.speedMs) <= 1) {
      this.gapHold = 0;
      return false;
    }
    const need = followFullGapM(s.speedMs, "dry") * FOLLOW.minFrac;
    if (dist(s.pos, lead) >= need) this.gapHold += dt;
    else this.gapHold = 0;
    return this.gapHold >= 6;
  }
}
