import { type Rect, type Vec2, rectHas } from "./math";

export type ZoneKind = "waypoint" | "stop" | "school" | "rail" | "sign";

export interface ZoneDef {
  kind: ZoneKind;
  id: string;
  rect: Rect;              // metres
  quiz?: string;           // in_world_trigger to ask on entry
  quizDelayS?: number;
  once?: boolean;          // default true (stops always re-arm)
  /** Heading (radians, 0 = east) that faces this stop sign. The opposite semicircle is not a stop. */
  approach?: number;
}

/** Painted stage pad, metres. Covers the lane the car is actually in. */
export const MARKER_R = 6;
/** How close the chassis has to be to the pad center. Wider than the paint so the nose counts. */
export const MARKER_REACH_M = 12;
/** Beetle plow tip, ahead of the rigid-body origin. Vehicle.tsx PLOW_TIP_Z. */
export const NOSE_REACH_M = 2.6;

/** The body origin or the nose is inside the disc. Heading 0 is east. */
export function carTouchesDisc(pos: Vec2, heading: number, disc: Vec2, radius = MARKER_R, nose = NOSE_REACH_M): boolean {
  const cx = Math.cos(heading);
  const cy = Math.sin(heading);
  const r2 = radius * radius;
  for (const d of [0, nose]) {
    const x = pos.x + cx * d;
    const y = pos.y + cy * d;
    if ((x - disc.x) ** 2 + (y - disc.y) ** 2 <= r2) return true;
  }
  return false;
}

/** Body origin or nose is inside the rectangle. */
export function carHitsRect(pos: Vec2, heading: number, rect: Rect, nose = 0): boolean {
  if (rectHas(rect, pos)) return true;
  if (nose <= 0) return false;
  return rectHas(rect, { x: pos.x + Math.cos(heading) * nose, y: pos.y + Math.sin(heading) * nose });
}

/** Smallest absolute difference between two headings, in radians. */
export function headingDelta(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

export interface ZoneEvents {
  fire: (event: string, data?: Record<string, unknown>) => void;
  requestQuiz: (trigger: string, delayS: number) => void;
  setSpeedLimit: (mph: number) => void;
}

/** Inclusive segment/rectangle intersection: catches a zone crossed between steps. */
export function segmentCrossesRect(from: Vec2, to: Vec2, rect: Rect): boolean {
  let entry = 0, exit = 1;
  const dx = to.x - from.x, dy = to.y - from.y;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) entry = Math.max(entry, t);
    else exit = Math.min(exit, t);
    return entry <= exit;
  };
  return clip(-dx, from.x - rect.x) && clip(dx, rect.x + rect.w - from.x)
    && clip(-dy, from.y - rect.y) && clip(dy, rect.y + rect.h - from.y);
}

/** Rectangular triggers with stop grading. Feed the car position/speed each fixed step. */
export class ZoneField {
  private inside = new Set<string>();
  private fired = new Set<string>();
  private stopTrack = new Map<string, { minSpeed: number; stoppedS: number }>();
  /** Previous car position, copied into one owned object (P13 — no per-step allocation). */
  private readonly prevA: Vec2 = { x: 0, y: 0 };
  private readonly prevB: Vec2 = { x: 0, y: 0 };
  private hasPrevious = false;
  private previousIsA = true;
  quizzesEnabled = false;

  constructor(public defs: ZoneDef[], private ev: ZoneEvents) {}

  rearm(kinds?: ZoneKind[]) {
    if (!kinds) { this.fired.clear(); return; }
    for (const d of this.defs) if (kinds.includes(d.kind)) this.fired.delete(zoneKey(d));
  }

  reset() { this.inside.clear(); this.fired.clear(); this.stopTrack.clear(); this.quizAsked.clear(); this.hasPrevious = false; }

  /** The car is on the pink marker. Fire this waypoint if it has not already fired. */
  claim(id: string) {
    const d = this.defs.find((z) => z.kind === "waypoint" && z.id === id);
    if (!d) return;
    const key = zoneKey(d);
    if (this.fired.has(key)) return;
    this.inside.add(key);
    this.enter(d, key);
  }

  /** Placement/reset changes the sample origin without simulating a driven crossing. */
  place(pos: Vec2) {
    this.prevA.x = pos.x; this.prevA.y = pos.y;
    this.previousIsA = true;
    this.hasPrevious = true;
    this.inside.clear();
    this.stopTrack.clear();
    for (const d of this.defs) if (rectHas(d.rect, pos)) this.inside.add(zoneKey(d));
  }

  step(dt: number, carPos: Vec2, speedMs: number, heading = 0, nose = 0) {
    // Two owned buffers, alternated: the swept-crossing test still needs last
    // step's position while this step's is being written.
    const previous = this.hasPrevious ? (this.previousIsA ? this.prevA : this.prevB) : null;
    const next = this.previousIsA ? this.prevB : this.prevA;
    // Mission teleports must not activate every zone along the jump.
    const swept = previous && (carPos.x - previous.x) ** 2 + (carPos.y - previous.y) ** 2 <= 30 * 30;
    next.x = carPos.x; next.y = carPos.y;
    this.previousIsA = !this.previousIsA;
    this.hasPrevious = true;
    for (const d of this.defs) {
      const key = `${d.kind}:${d.id}`;
      const now = d.kind === "waypoint"
        ? carHitsRect(carPos, heading, d.rect, nose)
        : rectHas(d.rect, carPos);
      const was = this.inside.has(key);
      const facing = this.facesSign(d, heading);
      if (now && !was && facing) { this.inside.add(key); this.enter(d, key); }
      if (!now && was) { this.inside.delete(key); this.exit(d, key); }
      if (!now && !was && facing && swept && segmentCrossesRect(previous!, carPos, d.rect)) {
        this.enter(d, key);
        const crossing = this.stopTrack.get(key);
        if (crossing) crossing.minSpeed = Math.abs(speedMs);
        this.exit(d, key);
      }
      const t = this.stopTrack.get(key);
      if (now && t) { const v = Math.abs(speedMs); t.minSpeed = Math.min(t.minSpeed, v); if (v < 0.3) t.stoppedS += dt; }
    }
  }

  /** A stop sign faces one way. Heading in the opposite semicircle does not have to stop. */
  private facesSign(d: ZoneDef, heading: number): boolean {
    if (d.kind !== "stop" || d.approach == null) return true;
    return headingDelta(heading, d.approach) <= Math.PI / 2;
  }

  private enter(d: ZoneDef, key: string) {
    if ((d.once ?? true) && d.kind !== "stop" && this.fired.has(key)) return;
    this.fired.add(key);
    switch (d.kind) {
      case "waypoint": this.ev.fire(`waypoint.reach:${d.id}`); break;
      case "stop": this.stopTrack.set(key, { minSpeed: Infinity, stoppedS: 0 }); this.ev.fire("stop.approach", { stop: d.id }); break;
      case "school": this.ev.setSpeedLimit(20); this.ev.fire("zone.school.enter"); break;
      case "rail": this.ev.fire("zone.rail.enter"); break;
      case "sign": this.ev.fire(`sign.prompt:${d.id}`); break;
    }
    if (d.quiz && this.quizzesEnabled && !this.quizAsked.has(key)) {
      this.ev.requestQuiz(d.quiz, d.quizDelayS ?? 0);
      if (d.kind !== "stop") this.quizAsked.add(key);
    }
  }
  private quizAsked = new Set<string>();

  private exit(d: ZoneDef, key: string) {
    if (d.kind === "stop") {
      const t = this.stopTrack.get(key); this.stopTrack.delete(key);
      if (!t) return;
      if (t.stoppedS >= 0.4) this.ev.fire("stop.full", { stop: d.id });
      else this.ev.fire("stop.rolled", { stop: d.id, min_mph: Math.round(t.minSpeed / 0.44704) });
    } else if (d.kind === "school") { this.ev.setSpeedLimit(25); this.ev.fire("zone.school.exit"); }
  }
}
export function zoneKey(d: ZoneDef) { return `${d.kind}:${d.id}`; }
