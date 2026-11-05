import { dist, rectCenter, rectHas } from "./math";
import type { WorldMap } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const CLUSTER_M = 26;
const CHECK_M = 30;

/**
 * Act VII — The Road Home. The last two hours into Spokane (scene 8.1), the
 * Division Street arrival (8.2 video), the epilogue radio (8.3).
 *
 * 8.1–8.3 WAIT/TRIGGER INVENTORY — this mission emits every event those nodes
 * listen for (nothing else in the codebase names them):
 *
 *   8.1 wait:  quiet.reason_passed                        (8.1.wait_reason)
 *   8.1 trig:  shadow.exceeds_lights  shadow.inside_lights  city.enter
 *              stop.full  stop.rolled  zone.school.enter  zone.rail.enter
 *              intersection.fourway.approach  intersection.uncontrolled.approach
 *              lanechange.clean  lanechange.no_signal
 *              quiet.pass_cluster  mya.wake
 *              checkpoint.approach:on_speed  checkpoint.approach:over
 *              park.parallel.start .adjust .curb .over_line .clean
 *              qte.gracie.start .success .fail
 *              noise.yellow  noise.red  mission.fail.swarm
 *   8.2 wait:  cutscene.beetle_stops  cutscene.ali_out
 *              cutscene.mom_arrives  cutscene.grandma_blanket
 *   8.3:       none (radio; branches on stall flags, muffler, has_sori_card)
 *
 * The two grades the dialogue branches on: the checkpoint speed grade
 * (fires checkpoint.approach:* → 8.1.speed_ok sets checkpoint_on_speed) and the
 * final parallel park (fires park.parallel.* and writes park_gap_in, inches to
 * the line — 8.1.gap_branch / 8.2.gap_branch).
 *
 * Grader, not driver: reads the R3F VehicleSample only.
 */
export class SpokaneRun {
  mission = false;
  private t = 0;
  private flags = new Set<string>();
  private clusterMin = Infinity;
  private checkMin = Infinity;
  private parkStarted = false;
  private parkAdjust = false;
  private parkDone = false;
  private parkGapInches = 99;
  private curbCd = 0;
  private overLineCd = 0;
  private stoppedS = 0;
  private steerHold = 0;
  private lane: number | null = null;
  private laneCd = 0;
  private gracieS = 0;

  constructor(
    private map: WorldMap,
    private ev: {
      fire: (e: string, d?: Record<string, unknown>) => void;
      setVar?: (name: string, value: number) => void;
    },
  ) {}

  reset() {
    this.mission = true;
    this.t = 0;
    this.flags.clear();
    this.clusterMin = this.checkMin = Infinity;
    this.parkStarted = this.parkAdjust = this.parkDone = false;
    this.parkGapInches = 99;
    this.curbCd = this.overLineCd = this.stoppedS = this.steerHold = this.laneCd = this.gracieS = 0;
    this.lane = null;
  }

  clear() { this.mission = false; }

  private once(name: string) {
    if (this.flags.has(name)) return;
    this.flags.add(name);
    this.ev.fire(name);
  }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.t += dt;
    this.curbCd = Math.max(0, this.curbCd - dt);
    this.overLineCd = Math.max(0, this.overLineCd - dt);
    this.laneCd = Math.max(0, this.laneCd - dt);

    // Sprague Avenue. Everything from Kent, in a different order.
    if (this.t > 0.5) this.once("city.enter");

    // Lights: inside the stopping shadow, or past it.
    const mph = Math.abs(s.speedMs) / MPH;
    if (mph > 70) this.once("shadow.exceeds_lights");
    else if (mph > 15 && s.beams === "high") this.once("shadow.inside_lights");

    this.stops(s);
    this.lanes(dt, s);
    this.cluster(s);
    this.checkpoint(s);
    this.park(dt, s);
    this.gracie(dt, s);
  }

  /** Stop signs, school zone, rail crossing, four-way, uncontrolled. */
  private stops(s: VehicleSample) {
    const atStop = dist(s.pos, { x: 259, y: 5 }) < CLUSTER_M || dist(s.pos, { x: 258, y: 105 }) < CLUSTER_M;
    if (atStop && Math.abs(s.speedMs) < 0.3) this.once("stop.full");
    else if (atStop && Math.abs(s.speedMs) < 3.2) this.once("stop.rolled");
    if (s.pos.x > 258 && s.pos.x < 272 && s.pos.y > 150 && s.pos.y < 280) this.once("zone.school.enter");
    if (dist(s.pos, { x: 263, y: 292 }) < CLUSTER_M) this.once("zone.rail.enter");
    if (dist(s.pos, { x: 265, y: 0 }) < CLUSTER_M) this.once("intersection.fourway.approach");
    if (dist(s.pos, { x: 200, y: 110 }) < CLUSTER_M) this.once("intersection.uncontrolled.approach");
  }

  /** A lane change with the signal held — or without. */
  private lanes(dt: number, s: VehicleSample) {
    const lanes = this.map.grid.lanes;
    if (s.pos.x < lanes.x0 || s.pos.x > lanes.x1 || s.pos.y < lanes.y0 || s.pos.y > lanes.y1) return;
    const lane = Math.floor(((s.pos.x - lanes.x0) / (lanes.x1 - lanes.x0)) * lanes.count);
    this.steerHold = Math.abs(s.steer) > 0.12 ? this.steerHold + dt : 0;
    if (lane === this.lane || this.lane === null) { this.lane = lane; return; }
    if (this.laneCd <= 0) {
      this.laneCd = 5;
      this.ev.fire(this.steerHold >= 0.4 ? "lanechange.clean" : "lanechange.no_signal");
    }
    this.lane = lane;
    this.steerHold = 0;
  }

  /**
   * The Quiet cluster at the roadside. The pass itself is the beat (8.1.cluster_src
   * branches on the muffler); a rough pass wakes the street and the swarm takes
   * her — the mission emits the whole set itself.
   */
  private cluster(s: VehicleSample) {
    for (const q of this.map.quietSpawns) {
      if (Math.abs(s.pos.x - q.x) > 40) continue;
      if (dist(s.pos, q) > CLUSTER_M) continue;
      this.clusterMin = Math.min(this.clusterMin, dist(s.pos, q));
      if (this.clusterMin < CLUSTER_M) {
        this.once("quiet.pass_cluster");
        // Loud at the curb: hard wheel, horn, or hammering the pedal.
        const loud = s.horn || Math.abs(s.steer) > 0.5 || s.throttle > 0.9;
        const wild = s.horn || (Math.abs(s.steer) > 0.5 && s.throttle > 0.9);
        if (loud) this.once("noise.yellow");
        if (wild) {
          this.once("noise.red");
          this.once("mission.fail.swarm");
        }
      }
      break;
    }
    if (this.flags.has("quiet.pass_cluster") && !this.flags.has("mya.wake")) {
      this.once("mya.wake");
    }
  }

  /** Fred Meyer lot. Forty times. One more. Writes park_gap_in (inches). */
  private park(dt: number, s: VehicleSample) {
    if (this.parkDone) return;
    const g = this.map.grid;
    const stall = g.tunaStall;
    const near = dist(s.pos, rectCenter(stall)) < 14;
    const aligned = Math.abs(Math.sin(s.heading)) < 0.4;
    if (!this.parkStarted && near && aligned && Math.abs(s.speedMs) > 0.4) {
      this.parkStarted = true;
      this.ev.fire("park.parallel.start");
    }
    if (near && s.speedMs < -0.3 && !this.parkAdjust) {
      this.parkAdjust = true;
      this.ev.fire("park.parallel.adjust");
    }
    if (near && s.pos.y - 0.95 < g.tunaCurbY && Math.abs(s.speedMs) > 0.35 && this.curbCd <= 0) {
      this.curbCd = 5;
      this.stoppedS = 0;
      this.ev.fire("park.parallel.curb");
      return;
    }
    const lineY = stall.y + stall.h;
    if (near && s.pos.y + 0.95 > lineY && Math.abs(s.speedMs) > 0.3 && this.overLineCd <= 0) {
      this.overLineCd = 5;
      this.ev.fire("park.parallel.over_line");
    }
    const inside = rectHas(stall, s.pos, -0.05);
    if (inside && aligned && this.parkAdjust && Math.abs(s.speedMs) < 0.22) this.stoppedS += dt;
    else this.stoppedS = 0;
    if (this.stoppedS < 0.6) return;
    this.parkDone = true;
    this.parkGapInches = Math.max(0, Math.round((lineY - (s.pos.y + 0.95)) * 39.37));
    this.ev.setVar?.("park_gap_in", this.parkGapInches);
    this.ev.fire("park.parallel.clean");
  }

  /** The sawhorse checkpoint: exactly the posted 25. */
  private checkpoint(s: VehicleSample) {
    const x = this.map.grid.lanes.x0 - 4;
    if (s.pos.x > x - CHECK_M && s.pos.x < x + CHECK_M) {
      this.checkMin = Math.min(this.checkMin, Math.abs(s.speedMs));
      if (s.pos.x < x) {
        if (this.checkMin <= 25 * MPH + 0.6) this.once("checkpoint.approach:on_speed");
        else this.once("checkpoint.approach:over");
      }
    }
  }

  /** Gracie bolts for the dash mid-drive; keeping it steady settles her. */
  private gracie(dt: number, s: VehicleSample) {
    if (!this.flags.has("city.enter") || this.flags.has("qte.gracie.start")) return;
    if (Math.abs(s.steer) > 0.5) {
      this.gracieS += dt;
      if (this.gracieS > 1.2) {
        this.once("qte.gracie.start");
        this.once(Math.abs(s.speedMs) < 6 ? "qte.gracie.success" : "qte.gracie.fail");
      }
    } else this.gracieS = 0;
  }

  /**
   * A wait in 8.x asked for a beat this mission owns. The runner relays wait
   * entry here (see QuietRoadsBridge), so the mark lands exactly once — the
   * web build has no video timeline to fire it.
   */
  onStoryWait(name: string): boolean {
    const owned = new Set([
      "quiet.reason_passed",
      "cutscene.beetle_stops",
      "cutscene.ali_out",
      "cutscene.mom_arrives",
      "cutscene.grandma_blanket",
    ]);
    if (!owned.has(name)) return false;
    if (name === "quiet.reason_passed" && !this.flags.has("mya.wake")) return false; // not yet
    this.ev.fire(name);
    return true;
  }
}