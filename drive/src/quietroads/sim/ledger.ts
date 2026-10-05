import { type Vec2, dist, rectHas, clamp } from "./math";
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
 * Deac's drive down Central — the behaviour III-001 promises the player watches
 * before he hands over the wheel.
 *
 * III-001 ("Your Wheel") is hand-written, not generated (`pack/00_README.md`:
 * "`22_III_001_RIDE_ALONG.md` ... Hand-written. Not generated."). Its scene text
 * is: "He will sweep the glass, hold the lane, then take one merge late on
 * purpose so you can watch what that costs." Its debrief: "You saw the merge
 * you do not take. He spent another man's margin to keep his." III-013 grades the
 * same act from his side — twenty-six years and not one preventable.
 *
 * He used to run a dead-straight line at constant speed and never changed lane,
 * so the merge both cards are written about did not exist on the road at all.
 * These numbers are that merge:
 *
 *   - `signalLeadM`   — he arms out this far north of the taper. He signals; his
 *                      sin is the *timing*, not the signal. Moving this earlier
 *                      would be "fixing" him and would make the cards wrong.
 *   - `mergeStartFrac` — he holds the right lane until this far INTO the taper,
 *                      not at its start. That lateness is the lesson, and it is
 *                      what puts him across the player's path.
 *   - `mergeEndFrac`   — ...and he is still finishing the crossing here.
 *   - `intoLane`       — which lane he ends up in, one left of the right lane.
 *
 * Every value is measured from `merge.y`, the start of the lane-drop taper, so
 * retuning the corridor moves Deac with it.
 */
export const DEAC = {
  /** Arm out before the taper (III-001: the sweep, then the arm). */
  signalLeadM: 4,
  /** He holds the lane until this far INTO the taper. This is the late merge. */
  mergeStartFrac: 0.6,
  mergeEndFrac: 0.95,
  intoLane: 1,
  /** How far behind him you must be to have seen any of it. */
  witnessM: 45,
} as const;

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
  /** Scripted lateral offset from the right travel lane centre; see DEAC. */
  private leadOffset = 0;
  /** Metres travelled along the corridor. Position is derived from this, not accumulated. */
  private leadS = 0;
  /** Deac's own beats — only for a player close enough behind to have seen them. */
  private deacSignalled = false;
  private deacMerged = false;
  /** Stable scratch so advanceLead never reallocates (P13). */
  private readonly ledgerPos: Vec2 = { x: 0, y: 0 };

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
    this.leadOffset = 0;
    this.leadS = 0;
    this.deacSignalled = this.deacMerged = false;
    this.ledgerPos.x = this.g.lead.from.x;
    this.ledgerPos.y = this.g.lead.from.y;
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
    this.trackDeac(s);
    if (!this.endFired && dist(s.pos, this.g.end) < END_RADIUS_M) {
      this.endFired = true;
      this.ev.fire("waypoint.reach:ledger_end");
    }
  }

  /**
   * Walk Deac down his line: hold the right travel lane, arm out before the
   * taper, then cross one lane — late, on purpose — exactly as III-001 has him
   * do it in front of the player.
   *
   * The lateral position is a function of how far along the corridor he is, so
   * it is frame-rate independent and reproducible: re-running the mission gives
   * the same merge at the same place, which is what the scripted laps in
   * `bench/` and `test/observedCues.ts` depend on.
   *
   * Heading is taken from the displacement he actually made this step rather
   * than being assumed, so the model in `KentWorld` turns through the merge
   * instead of sliding sideways with its nose pointed down the road.
   */
  private advanceLead(dt: number) {
    const { from, to, speedMph } = this.g.lead;
    const dx = to.x - from.x, dy = to.y - from.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;

    // Distance along the corridor is the single source of truth; position is a
    // pure function of it. Advancing a scalar and re-deriving x/y each step (as
    // opposed to nudging leadPos in place) matters here because the path is
    // clamped at its end — an in-place accumulation gets snapped back to `to`,
    // which is the lane he started in, and a correction applied after that clamp
    // cannot tell the difference between "already offset" and "reset to lane 0".
    const prevX = this.ledgerPos.x, prevY = this.ledgerPos.y;
    this.leadS = Math.min(this.leadS + speedMph * MPH * dt, L);
    const baseY = from.y + uy * this.leadS;
    // The corridor runs along +y, so a lane change is purely an x offset.
    this.leadOffset = this.mergeOffset(baseY);
    this.ledgerPos.x = from.x + ux * this.leadS + this.leadOffset;
    this.ledgerPos.y = baseY;
    this.leadPos.x = this.ledgerPos.x;
    this.leadPos.y = this.ledgerPos.y;

    const mx = this.ledgerPos.x - prevX, my = this.ledgerPos.y - prevY;
    if (mx !== 0 || my !== 0) this.leadHeading = Math.atan2(my, mx);
  }

  /**
   * How far across the road Deac should be, given how far along the corridor he
   * is. He holds the right travel lane (index 0, where the mission spawns him)
   * until he is most of the way into the lane-drop taper, then ramps into the
   * next lane. Smoothstepped so the crossing eases in rather than snapping — he
   * is a careful driver about everything except the timing.
   */
  private mergeOffset(alongY: number): number {
    const { x0, x1, count } = this.g.lanes;
    const laneW = (x1 - x0) / count;
    const taper = this.g.merge;
    const taperLen = Math.max(taper.h, 1e-6);
    const k = (alongY - taper.y - taperLen * DEAC.mergeStartFrac)
      / (taperLen * (DEAC.mergeEndFrac - DEAC.mergeStartFrac));
    const s = clamp(k, 0, 1);
    return laneW * DEAC.intoLane * (s * s * (3 - 2 * s));
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
   * Deac's own beats: the arm going out, and the merge he takes late.
   *
   * III-001's debrief is "You saw the merge you do not take" — the card is about
   * what the player WITNESSED. So neither beat fires unless the player is
   * actually on the road behind him and close enough to have read it. Without
   * that gate these would be exactly the kind of bare-coordinate cue AUDIT.md
   * §"cues fire on the skill, not a timer" was written to eliminate: the merge
   * would reach a player parked at the far end of the corridor who never saw a
   * thing. `test/deac.test.ts` asserts both halves.
   *
   * These describe Deac, not the player's truck, so they are namespaced `deac.*`
   * and kept out of the `ledger.*` grade bus the player's own driving reports to.
   */
  private trackDeac(s: VehicleSample) {
    const dy = this.leadPos.y - s.pos.y;
    // Ahead of him or too far back: not a thing you could have watched happen.
    if (dy < 0 || dy > DEAC.witnessM) return;

    if (!this.deacSignalled && this.leadPos.y >= this.g.merge.y - DEAC.signalLeadM) {
      this.deacSignalled = true;
      this.ev.fire("deac.signal");
    }
    if (!this.deacMerged && this.leadOffset > 0) {
      this.deacMerged = true;
      this.ev.fire("deac.merge.late");
    }
  }

  /**
   * The beats around the lead truck and the road edge — each a thing the driver
   * actually does, not a coordinate that happens to be true:
   *   alongside    — out of his mirrors (§4.4, III-011/III-012)
   *   pass.clear   — his whole front back in the mirror (§5.2, III-018)
   *   wet.enter    — south of the solid white, onto wet paint (§5.6, III-024/III-025)
   *   rumble.ride  — the car drifting onto the line, i.e. a soft tyre (§2.5, III-028)
   *
   * `alongside` and `pass.clear` are measured in DEAC'S frame, not the world's.
   * That is what `ALONGSIDE_DX_M`'s own comment always claimed — "lateral band
   * around the lead's lane" — but the check was a raw world-axis dy, which was
   * only correct for as long as he drove perfectly straight. Now that he merges,
   * a player sitting in the right travel lane fourteen metres BEHIND him would
   * satisfy |dy| < ALONGSIDE_DY_M against his lane change and be graded as
   * riding alongside his trailer. Projecting onto his heading is what "alongside
   * his trailer" actually means, and it is what makes the two beats survive him
   * moving across the road.
   */
  private trackSharing(s: VehicleSample, dt: number) {
    const dx = s.pos.x - this.leadPos.x;
    const dy = s.pos.y - this.leadPos.y;
    // Player relative to Deac, rotated into the frame he is driving in.
    const fx = Math.cos(this.leadHeading), fy = Math.sin(this.leadHeading);
    const ahead = dx * fx + dy * fy;      // + = ahead of him along his travel
    const abreast = -dx * fy + dy * fx;   // signed lateral offset in his lane

    if (!this.alongsideFired && Math.abs(ahead) < ALONGSIDE_DY_M && Math.abs(abreast) > ALONGSIDE_DX_M) {
      this.alongsideFired = true;
      this.ev.fire("ledger.alongside");
    }
    // Recovering is only safe once his whole front is behind you in the mirror.
    if (!this.passFired && this.alongsideFired && ahead < -ALONGSIDE_DY_M && Math.abs(abreast) < ALONGSIDE_DX_M) {
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