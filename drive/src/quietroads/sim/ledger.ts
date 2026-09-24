import { type Vec2, dist, rectHas } from "./math";
import type { LedgerSites } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const SIGNAL_HOLD_S = 0.5;      // steer held this long = a signal
const FOLLOW_S = 3.0;           // three-second following rule
const FOLLOW_MIN_FRAC = 0.6;    // below 60% of the three-second gap → too close
const MERGE_MIN_MPH = 12;       // must be rolling at least this to claim a gap
const WRONG_LANE_S = 2.0;       // lingering in the passing lane this long is a habit
const END_RADIUS_M = 6;

/**
 * Act III — Central. The Ledger run.
 *
 * Same Kent frame as the Grid, but the ego is Deac's cutaway shuttle: longer,
 * wider, no rear window. The skills are the Act III card cluster — stay right
 * except to pass, signal every lane change, do not cross solid white, hold the
 * three-second space behind Deac's truck, and take the merge with a real gap.
 *
 * This is a grader, not a driver: it reads the same VehicleSample the R3F car
 * already produces and emits the `ledger.*` events the dialogue listens for.
 */
export class LedgerRun {
  mission = false;
  /** Deac's box truck ahead of the player (the three-second rule target). */
  leadPos: Vec2 = { x: 0, y: 0 };
  leadHeading = Math.PI / 2;

  private lane: number | null = null;
  private steerHold = 0;
  private laneStarted = false;
  private solidFired = false;
  private mergeStarted = false;
  private mergeDone = false;
  private wrongLaneT = 0;
  private closeCd = 0;
  private endFired = false;

  constructor(private g: LedgerSites, private ev: { fire: (e: string, d?: Record<string, unknown>) => void }) {}

  reset() {
    this.mission = true;
    this.lane = null;
    this.steerHold = 0;
    this.laneStarted = false;
    this.solidFired = this.mergeStarted = this.mergeDone = this.endFired = false;
    this.wrongLaneT = 0;
    this.closeCd = 0;
    this.leadPos = { ...this.g.lead.from };
    this.leadHeading = Math.PI / 2;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.advanceLead(dt);
    this.trackLane(dt, s);
    this.trackFollow(dt, s);
    this.trackMerge(s);
    if (!this.endFired && dist(s.pos, this.g.end) < END_RADIUS_M) {
      this.endFired = true;
      this.ev.fire("waypoint.reach:ledger_end");
    }
  }

  private advanceLead(dt: number) {
    const { from, to, speedMph } = this.g.lead;
    const dx = to.x - from.x, dy = to.y - from.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    this.leadPos.x += ux * speedMph * MPH * dt;
    this.leadPos.y += uy * speedMph * MPH * dt;
    const proj = (this.leadPos.x - from.x) * ux + (this.leadPos.y - from.y) * uy;
    if (proj > L) this.leadPos = { ...to };
  }

  private trackLane(dt: number, s: VehicleSample) {
    const li = laneIndex(this.g, s.pos);
    if (li < 0) { this.lane = null; this.steerHold = 0; return; }
    if (Math.abs(s.steer) > 0.18) this.steerHold += dt;
    else if (this.lane === li) this.steerHold = 0;

    if (this.lane == null) { this.lane = li; return; }
    if (li === this.lane) {
      // Stay right: the passing lane (index 2) is not a cruising lane.
      if (li === 2) {
        const prev = this.wrongLaneT;
        this.wrongLaneT += dt;
        if (prev < WRONG_LANE_S && this.wrongLaneT >= WRONG_LANE_S) this.ev.fire("ledger.wrong_lane");
      } else this.wrongLaneT = 0;
      return;
    }

    const signaled = this.steerHold >= SIGNAL_HOLD_S;
    if (!this.laneStarted) { this.laneStarted = true; this.ev.fire("ledger.lanechange.start"); }
    // Solid white: leaving the right travel lane south of the boundary is illegal.
    if (this.lane === 0 && s.pos.y > this.g.solidY && !this.solidFired) {
      this.solidFired = true;
      this.ev.fire("ledger.crossed_solid");
    }
    this.ev.fire(signaled ? "ledger.lanechange.clean" : "ledger.lanechange.no_signal");
    this.lane = li;
    this.steerHold = 0;
    this.wrongLaneT = 0;
  }

  private trackFollow(dt: number, s: VehicleSample) {
    this.closeCd = Math.max(0, this.closeCd - dt);
    if (Math.abs(s.speedMs) <= 1 || this.closeCd > 0) return;
    const gap = dist(s.pos, this.leadPos);
    const need = Math.abs(s.speedMs) * FOLLOW_S * FOLLOW_MIN_FRAC;
    if (gap < need) {
      this.closeCd = 5;
      this.ev.fire("ledger.follow.close", { gap_m: Math.round(gap) });
    }
  }

  private trackMerge(s: VehicleSample) {
    const inMerge = rectHas(this.g.merge, s.pos);
    if (!inMerge) { this.mergeStarted = false; return; }
    if (!this.mergeStarted) { this.mergeStarted = true; this.ev.fire("ledger.merge.approach"); }
    if (this.mergeDone) return;
    const li = laneIndex(this.g, s.pos);
    if (li >= 0 && li !== 0) {
      this.mergeDone = true;
      this.ev.fire(Math.abs(s.speedMs) >= MERGE_MIN_MPH * MPH ? "ledger.merge.clean" : "ledger.merge.slow");
    }
  }
}

function laneIndex(g: LedgerSites, p: Vec2): number {
  const { x0, x1, y0, y1, count } = g.lanes;
  if (p.y < y0 || p.y > y1 || p.x < x0 || p.x > x1) return -1;
  const i = Math.floor(((p.x - x0) / (x1 - x0)) * count);
  return Math.max(0, Math.min(count - 1, i));
}