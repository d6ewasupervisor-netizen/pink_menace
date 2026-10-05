import { type Vec2, dist, rectHas } from "./math";
import type { LedgerSites } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";
import { FOLLOW, followFullGapM } from "../config";

const MPH = 0.44704;
const SIGNAL_HOLD_S = 0.5;      // steer held this long = a signal
const MERGE_MIN_MPH = 12;       // must be rolling at least this to claim a gap
const WRONG_LANE_S = 2.0;       // lingering in the passing lane this long is a habit
const END_RADIUS_M = 6;
/** Lateral band around the lead's lane that reads as "alongside his trailer". */
const ALONGSIDE_DX_M = 2.4;
/** Longitudinal window (in travel direction) that counts as abreast. */
const ALONGSIDE_DY_M = 8;
/** How close to the solid-white line counts as riding the rumble (a soft tyre). */
const RUMBLE_DX_M = 0.7;
const RUMBLE_CD_S = 6;
/** How far into the wet half of the run III-024/III-025 practice before firing. */
const WET_ENTER_Y = 6;

/**
 * Act III — Central. The Ledger run.
 *
 * Same Kent frame as the Grid, but the ego is Deac's cutaway shuttle: longer,
 * wider, no rear window. The skills are the Act III card cluster — stay right
 * except to pass, signal every lane change, do not cross solid white, hold the
 * space behind Deac's truck (twice the vehicle's length; counted as three
 * seconds off a mark), and take the merge with a real gap.
 *
 * This is a grader, not a driver: it reads the same VehicleSample the R3F car
 * already produces and emits the `ledger.*` events the dialogue listens for.
 */
export class LedgerRun {
  mission = false;
  /** Deac's box truck ahead of the player (the following-gap target). */
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
  /** Latch state for the beats the card book opens on (all one-per-run). */
  private followStarted = false;
  private alongsideFired = false;
  private passFired = false;
  private wetFired = false;
  private rumbleCd = 0;

  constructor(private g: LedgerSites, private ev: { fire: (e: string, d?: Record<string, unknown>) => void }) {}

  reset() {
    this.mission = true;
    this.lane = null;
    this.steerHold = 0;
    this.laneStarted = false;
    this.solidFired = this.mergeStarted = this.mergeDone = this.endFired = false;
    this.wrongLaneT = 0;
    this.closeCd = 0;
    this.followStarted = this.alongsideFired = this.passFired = this.wetFired = false;
    this.rumbleCd = 0;
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
    this.trackSharing(s, dt);
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
    if (Math.abs(s.speedMs) <= 1) return;
    const gap = dist(s.pos, this.leadPos);
    const need = followFullGapM(s.speedMs, "dry") * FOLLOW.minFrac;

    // The FOLLOW BEAT starts when she is rolling behind Deac's truck with room —
    // that is what III-005 / III-009 / II-012 are about. It used to open only on
    // `ledger.follow.close`, so a driver who held the gap correctly (the skill the
    // cards teach) never saw them at all.
    if (!this.followStarted && gap < need * 2.2) {
      this.followStarted = true;
      this.ev.fire("ledger.follow.start", { gap_m: Math.round(gap) });
    }

    if (this.closeCd > 0) return;
    if (gap < need) {
      this.closeCd = 5;
      this.ev.fire("ledger.follow.close", { gap_m: Math.round(gap) });
    }
  }

  /**
   * The beats around the lead truck and the road edge — each a thing the driver
   * actually does, not a coordinate that happens to be true:
   *   alongside    — out of his mirrors (§4.4, III-011/III-012)
   *   pass.clear   — his whole front back in the mirror (§5.2, III-018)
   *   wet.enter    — south of the solid white, onto wet paint (§5.6, III-024/III-025)
   *   rumble.ride  — the car drifting onto the line, i.e. a soft tyre (§2.5, III-028)
   */
  private trackSharing(s: VehicleSample, dt: number) {
    const dx = s.pos.x - this.leadPos.x;
    const dy = s.pos.y - this.leadPos.y;

    if (!this.alongsideFired && Math.abs(dy) < ALONGSIDE_DY_M && Math.abs(dx) > ALONGSIDE_DX_M) {
      this.alongsideFired = true;
      this.ev.fire("ledger.alongside");
    }
    // Recovering is only safe once his whole front is behind you in the mirror.
    if (!this.passFired && this.alongsideFired && dy < -ALONGSIDE_DY_M && Math.abs(dx) < ALONGSIDE_DX_M) {
      this.passFired = true;
      this.ev.fire("ledger.pass.clear");
    }
    if (!this.wetFired && s.pos.y > this.g.solidY + WET_ENTER_Y) {
      this.wetFired = true;
      this.ev.fire("ledger.wet.enter");
    }

    this.rumbleCd = Math.max(0, this.rumbleCd - dt);
    if (laneIndex(this.g, s.pos) >= 0 && this.rumbleCd <= 0
      && laneEdgeGap(this.g, s.pos) <= RUMBLE_DX_M && Math.abs(s.speedMs) > 2) {
      this.rumbleCd = RUMBLE_CD_S;
      this.ev.fire("ledger.rumble.ride");
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

/** Metres from the point to the nearest boundary of the lane it is in. */
function laneEdgeGap(g: LedgerSites, p: Vec2): number {
  const { x0, x1, count } = g.lanes;
  const span = (x1 - x0) / count;
  const li = laneIndex(g, p);
  if (li < 0) return Infinity;
  return Math.min(Math.abs(p.x - (x0 + li * span)), Math.abs(p.x - (x0 + (li + 1) * span)));
}