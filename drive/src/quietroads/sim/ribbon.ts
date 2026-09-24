import { type Vec2, dist, rectHas } from "./math";
import type { RibbonSites } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const SIGNAL_HOLD_S = 0.5;      // steer held this long = a signal
const MATCH_FRAC = 0.85;        // within 85% of flow speed counts as "matched"
const FOLLOW_S = 3.0;           // three-second rule at highway speed
const FOLLOW_MIN_FRAC = 0.6;    // below 60% of the three-second gap → too close
const END_RADIUS_M = 6;

/**
 * Act V — The Ribbon. The on-ramp merge.
 *
 * Highway leg: eyes up, read the ramp in three pieces, match the flow before the
 * paint, signal, take a gap big enough that nobody has to brake, then sit in the
 * lane. This is the Act V card cluster (V-001/003/005/007/010/012).
 *
 * Like LedgerRun, this is a grader, not a driver: it reads the VehicleSample the
 * R3F car already produces and emits the `ribbon.*` events the dialogue listens for.
 */
export class RibbonRun {
  mission = false;
  /** The traffic ahead of the player — the gap target for the merge + following rule. */
  leadPos: Vec2 = { x: 0, y: 0 };
  leadHeading = Math.PI / 2;

  private rampEntered = false;
  private onRamp = false;
  private merged = false;
  private signalHold = 0;
  private followCloseCd = 0;
  private endFired = false;

  constructor(private g: RibbonSites, private ev: { fire: (e: string, d?: Record<string, unknown>) => void }) {}

  reset() {
    this.mission = true;
    this.rampEntered = this.onRamp = this.merged = this.endFired = false;
    this.signalHold = 0;
    this.followCloseCd = 0;
    this.leadPos = { ...this.g.lead.from };
    this.leadHeading = Math.PI / 2;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.advanceLead(dt);

    const inRamp = rectHas(this.g.ramp, s.pos);
    if (inRamp && !this.rampEntered) { this.rampEntered = true; this.onRamp = true; this.ev.fire("ramp.enter"); }

    if (this.onRamp) {
      // Signal tracking while climbing the ramp: hold the steer = signal the merge.
      if (Math.abs(s.steer) > 0.18) this.signalHold += dt;
      else this.signalHold = 0;

      // Leaving the ramp → grade the merge.
      if (!inRamp) {
        this.onRamp = false;
        const li = laneIndex(this.g, s.pos);
        if (li >= 0 && !this.merged) {
          this.merged = true;
          const fast = Math.abs(s.speedMs) >= this.g.flowMph * MPH * MATCH_FRAC;
          const signaled = this.signalHold >= SIGNAL_HOLD_S;
          const gap = dist(s.pos, this.leadPos);
          const need = Math.abs(s.speedMs) * FOLLOW_S;
          this.ev.fire("ribbon.merge");
          this.ev.fire(signaled ? "ribbon.signal.clean" : "ribbon.signal.miss");
          this.ev.fire(fast ? "ribbon.match.clean" : "ribbon.match.slow");
          this.ev.fire(gap >= need ? "ribbon.gap.clean" : "ribbon.gap.tight");
        }
      }
    }

    // Three-second following once in the flow.
    if (this.merged) this.trackFollow(dt, s);

    if (!this.endFired && dist(s.pos, this.g.end) < END_RADIUS_M) {
      this.endFired = true;
      this.ev.fire("waypoint.reach:ribbon_end");
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

  private trackFollow(dt: number, s: VehicleSample) {
    this.followCloseCd = Math.max(0, this.followCloseCd - dt);
    if (Math.abs(s.speedMs) <= 1 || this.followCloseCd > 0) return;
    const gap = dist(s.pos, this.leadPos);
    const need = Math.abs(s.speedMs) * FOLLOW_S * FOLLOW_MIN_FRAC;
    if (gap < need) {
      this.followCloseCd = 5;
      this.ev.fire("ribbon.follow.close", { gap_m: Math.round(gap) });
    }
  }
}

function laneIndex(g: RibbonSites, p: Vec2): number {
  const { x0, x1, y0, y1, count } = g.lanes;
  if (p.y < y0 || p.y > y1 || p.x < x0 || p.x > x1) return -1;
  const i = Math.floor(((p.x - x0) / (x1 - x0)) * count);
  return Math.max(0, Math.min(count - 1, i));
}