import { type Rect, type Vec2, rectHas } from "./math";

export type ZoneKind = "waypoint" | "stop" | "school" | "rail" | "sign";

export interface ZoneDef {
  kind: ZoneKind;
  id: string;
  rect: Rect;              // metres
  quiz?: string;           // in_world_trigger to ask on entry
  quizDelayS?: number;
  once?: boolean;          // default true (stops always re-arm)
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
  private previous: Vec2 | null = null;
  quizzesEnabled = false;

  constructor(public defs: ZoneDef[], private ev: ZoneEvents) {}

  rearm(kinds?: ZoneKind[]) {
    if (!kinds) { this.fired.clear(); return; }
    for (const d of this.defs) if (kinds.includes(d.kind)) this.fired.delete(zoneKey(d));
  }

  reset() { this.inside.clear(); this.fired.clear(); this.stopTrack.clear(); this.quizAsked.clear(); this.previous = null; }

  /** Placement/reset changes the sample origin without simulating a driven crossing. */
  place(pos: Vec2) {
    this.previous = { ...pos };
    this.inside.clear();
    this.stopTrack.clear();
    for (const d of this.defs) if (rectHas(d.rect, pos)) this.inside.add(zoneKey(d));
  }

  step(dt: number, carPos: Vec2, speedMs: number) {
    const previous = this.previous;
    // Mission teleports must not activate every zone along the jump.
    const swept = previous && (carPos.x - previous.x) ** 2 + (carPos.y - previous.y) ** 2 <= 30 * 30;
    this.previous = { ...carPos };
    for (const d of this.defs) {
      const key = `${d.kind}:${d.id}`;
      const now = rectHas(d.rect, carPos);
      const was = this.inside.has(key);
      if (now && !was) { this.inside.add(key); this.enter(d, key); }
      if (!now && was) { this.inside.delete(key); this.exit(d, key); }
      if (!now && !was && swept && segmentCrossesRect(previous, carPos, d.rect)) {
        this.enter(d, key);
        const crossing = this.stopTrack.get(key);
        if (crossing) crossing.minSpeed = Math.abs(speedMs);
        this.exit(d, key);
      }
      const t = this.stopTrack.get(key);
      if (now && t) { const v = Math.abs(speedMs); t.minSpeed = Math.min(t.minSpeed, v); if (v < 0.3) t.stoppedS += dt; }
    }
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
