import { type Vec2, dist } from "./math";
import type { RuralSites } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const APPROACH_M = 18;         // how far before a feature we start reading its speed
const CREST_MAX_MPH = 25;      // blind crest should be taken slow
const YIELD_MAX_MPH = 8;       // uncontrolled intersection: near-yield
const CROSSBUCK_MAX_MPH = 6;   // crossbuck: slow enough to look and listen
const SHOULDER_MARGIN_M = 3;   // how far off the road edge still reads as "shoulder"
const YANK_STEER = 0.6;
const END_RADIUS_M = 6;

/**
 * Act VI — The Backcountry. The gravel run.
 *
 * Ali alone on a gravel two-lane: hold the line off the soft edge, slow for the
 * blind crest, yield the uncontrolled four-way, and treat the crossbuck like the
 * law. The Act VI card cluster (VI-002/004/006/010/012); VI-004 arms the VI-011
 * ledger callback elsewhere.
 *
 * Grader, not driver: reads the R3F VehicleSample and emits `rural.*` events.
 */
export class RuralRun {
  mission = false;

  private shoulderFired = false;
  private shoulderCd = 0;
  private crestDone = false;
  private zones: Record<"uncontrolled" | "crossbuck", { done: boolean; min: number }> = {
    uncontrolled: { done: false, min: Infinity },
    crossbuck: { done: false, min: Infinity },
  };
  private endFired = false;
  private roundaboutDone = false;
  private roundaboutLane = false;
  private roundaboutSteer = 0;

  constructor(
    private g: RuralSites,
    private ev: { fire: (e: string, d?: Record<string, unknown>) => void; requestQuiz?: (t: string) => void },
  ) {}

  reset() {
    this.mission = true;
    this.shoulderFired = false;
    this.shoulderCd = 0;
    this.crestDone = false;
    this.zones.uncontrolled = { done: false, min: Infinity };
    this.zones.crossbuck = { done: false, min: Infinity };
    this.endFired = false;
    this.roundaboutDone = false;
    this.roundaboutLane = false;
    this.roundaboutSteer = 0;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.shoulderCd = Math.max(0, this.shoulderCd - dt);

    // Soft shoulder: off the road edge but still beside it. A yank while there is the VI-004 mistake.
    if (onShoulder(this.g, s.pos) && !onRoad(this.g, s.pos)) {
      if (!this.shoulderFired && this.shoulderCd <= 0) {
        this.shoulderFired = true;
        this.shoulderCd = 3;
        this.ev.fire("rural.shoulder");
      }
      if (Math.abs(s.steer) > YANK_STEER) this.ev.fire("rural.shoulder.yank");
    }

    // Blind crest: slow before the top.
    if (!this.crestDone && s.pos.x >= this.g.crestX) {
      this.crestDone = true;
      const mph = Math.abs(s.speedMs) / MPH;
      this.ev.fire(mph > CREST_MAX_MPH ? "rural.crest.fast" : "rural.crest.clean", { mph: Math.round(mph) });
    }

    this.roundabout(dt, s);
    this.trackZone(s, "uncontrolled", this.g.uncontrolledX, YIELD_MAX_MPH * MPH, "rural.uncontrolled.yield", "rural.uncontrolled.rolled");
    this.trackZone(s, "crossbuck", this.g.crossbuckX, CROSSBUCK_MAX_MPH * MPH, "rural.crossbuck.clean", "rural.crossbuck.rolled");

    if (!this.endFired && dist(s.pos, this.g.end) < END_RADIUS_M) {
      this.endFired = true;
      this.ev.fire("waypoint.reach:rural_end");
    }
  }

  /** VI-007/008: yield on the way in, don't saw the wheel inside, signal on the way out. */
  private roundabout(dt: number, s: VehicleSample) {
    const c = this.g.roundabout;
    const d = dist(s.pos, c);
    if (!this.roundaboutDone && s.pos.x < c.x && d < c.r + 6) {
      this.roundaboutDone = true;
      const mph = Math.abs(s.speedMs) / MPH;
      this.ev.fire(mph <= YIELD_MAX_MPH ? "roundabout.yield" : "roundabout.rolled", { mph: Math.round(mph) });
      this.ev.requestQuiz?.("roundabout.approach");
    }
    if (d < c.r) {
      if (Math.abs(s.steer) > 0.18) this.roundaboutSteer += dt;
      if (!this.roundaboutLane && Math.abs(s.steer) > YANK_STEER) {
        this.roundaboutLane = true;
        this.ev.fire("roundabout.lane");
      }
    }
    if (this.roundaboutDone && s.pos.x > c.x + c.r && this.roundaboutSteer >= 0.5) {
      this.roundaboutSteer = -1;
      this.ev.fire("roundabout.exit");
    }
  }

  private trackZone(s: VehicleSample, key: "uncontrolled" | "crossbuck", x: number, threshold: number, ok: string, bad: string) {
    const z = this.zones[key];
    if (z.done) return;
    if (s.pos.x >= x) {
      z.done = true;
      this.ev.fire(z.min < threshold ? ok : bad, { min_mph: Math.round(z.min / MPH) });
      return;
    }
    if (s.pos.x >= x - APPROACH_M) z.min = Math.min(z.min, Math.abs(s.speedMs));
  }
}

function onRoad(g: RuralSites, p: Vec2): boolean {
  return p.x >= g.road.x && p.x <= g.road.x + g.road.w && p.y >= g.road.y && p.y <= g.road.y + g.road.h;
}

function onShoulder(g: RuralSites, p: Vec2): boolean {
  const m = SHOULDER_MARGIN_M + g.shoulder;
  return p.x >= g.road.x && p.x <= g.road.x + g.road.w
    && p.y >= g.road.y - m && p.y <= g.road.y + g.road.h + m;
}