import { type Rect, type Vec2, dist, rectCenter, rectHas } from "./math";
import type { GridSites, WorldMap } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";
import type { QuietField } from "./quiet";

export type GridMission =
  | "mission_delivery_2_catfood"
  | "mission_delivery_3_radio"
  | "mission_delivery_4_filters"
  | "mission_jonah_intersection";

type GridEvents = {
  fire: (event: string, data?: Record<string, unknown>) => void;
  requestQuiz: (trigger: string, delayS: number) => void;
};

const BACK_FAST_MS = 2.2;
const SIGNAL_HOLD_S = 0.4;

/**
 * The rest of the Grid after insulin: Bea's back-in, Priya's lane change,
 * Tuna's parallel, and Jonah blowing the four-way. Same Kent field, new pins.
 */
export class GridRun {
  mission: GridMission | "" = "";
  /** Set when the back-in is good enough to get out and hand Bea the bag. */
  parkGrade: "park.back_in.clean" | "park.back_in.crooked" | "" = "";
  private backed = false;
  private bumped = false;
  private bumpCd = 0;
  private backFastCd = 0;
  private curbCd = 0;
  private laneCd = 0;
  private lane: number | null = null;
  private steerHold = 0;
  private laneStarted = false;
  private busFired = false;
  private parallelStarted = false;
  private parallelAdjust = false;
  private parallelDone = false;
  private stoppedS = 0;
  private jonahBlew = false;
  private jonahSettled = false;
  private calmS = 0;
  private closeFired = false;

  constructor(private map: WorldMap, private ev: GridEvents, private quiet: QuietField) {}

  reset(id: GridMission) {
    this.mission = id;
    this.parkGrade = "";
    this.backed = this.bumped = false;
    this.bumpCd = this.backFastCd = this.curbCd = this.laneCd = 0;
    this.lane = null;
    this.steerHold = 0;
    this.laneStarted = this.busFired = false;
    this.parallelStarted = this.parallelAdjust = this.parallelDone = false;
    this.stoppedS = 0;
    this.jonahBlew = this.jonahSettled = this.closeFired = false;
    this.calmS = 0;
  }

  clear() { this.mission = ""; }

  step(dt: number, s: VehicleSample, noiseBand: 0 | 1 | 2) {
    if (!this.mission) return;
    if (this.mission === "mission_delivery_2_catfood") this.bea(dt, s);
    else if (this.mission === "mission_delivery_3_radio") this.priya(dt, s);
    else if (this.mission === "mission_delivery_4_filters") this.tuna(dt, s);
    else if (this.mission === "mission_jonah_intersection") this.jonah(dt, s, noiseBand);
  }

  onFourWay() {
    if (this.mission !== "mission_jonah_intersection" || this.jonahBlew) return;
    this.jonahBlew = true;
    const at = { x: 265, y: 0 };
    for (const q of this.quiet.list) {
      if (q.zone !== "outdoor") continue;
      if (dist(q.pos, at) < 22) q.addAwareness(70, at);
    }
    this.ev.fire("jonah.blowthrough");
    this.ev.requestQuiz("stop.approach", 0.6);
  }

  private bea(dt: number, s: VehicleSample) {
    if (this.parkGrade) return;
    const g = this.map.grid;
    const near = dist(s.pos, rectCenter(g.beaStall)) < 14;
    this.backFastCd = Math.max(0, this.backFastCd - dt);
    this.bumpCd = Math.max(0, this.bumpCd - dt);
    if (s.speedMs < -0.35 && near) {
      if (!this.backed) {
        this.backed = true;
        this.ev.fire("backing.start");
        this.ev.requestQuiz("backing.mirror", 0.4);
        this.ev.requestQuiz("driveway.turn", 24);
      }
      if (-s.speedMs > BACK_FAST_MS && this.backFastCd <= 0) {
        this.backFastCd = 6;
        this.ev.fire("backing.too_fast");
      }
    }
    const north = northPoint(s);
    if (near && north.y < g.beaDockY && Math.abs(s.speedMs) > 0.35 && this.bumpCd <= 0) {
      this.bumped = true;
      this.bumpCd = 6;
      this.ev.fire("backing.bump");
    }
    const aligned = alignedTo(s.heading, Math.PI / 2, 0.28);
    const inside = rectHas(g.beaStall, s.pos, -0.05);
    if (inside && this.backed && Math.abs(s.speedMs) < 0.22) this.stoppedS += dt;
    else this.stoppedS = 0;
    if (this.stoppedS < 0.55) return;
    // Held until she walks the bag to the door. The dialogue event is the handoff.
    this.parkGrade = this.bumped || !aligned ? "park.back_in.crooked" : "park.back_in.clean";
  }

  private priya(dt: number, s: VehicleSample) {
    const g = this.map.grid;
    if (!this.busFired && rectHas(g.bus, s.pos)) {
      this.busFired = true;
      this.ev.requestQuiz("bus.stop_arm", 0.8);
    }
    this.laneCd = Math.max(0, this.laneCd - dt);
    const lane = laneIndex(g, s.pos);
    if (lane < 0) { this.lane = null; this.steerHold = 0; return; }
    if (Math.abs(s.steer) > 0.18) this.steerHold += dt;
    else if (this.lane === lane) this.steerHold = 0;
    if (this.lane == null) { this.lane = lane; return; }
    if (lane === this.lane) return;
    const signaled = this.steerHold >= SIGNAL_HOLD_S;
    if (!this.laneStarted) {
      this.laneStarted = true;
      this.ev.fire("lanechange.start");
      this.ev.requestQuiz("signal.arm", 0.5);
    }
    if (this.laneCd <= 0) {
      this.laneCd = 5;
      this.ev.fire(signaled ? "lanechange.clean" : "lanechange.no_signal");
    }
    this.lane = lane;
    this.steerHold = 0;
  }

  private tuna(dt: number, s: VehicleSample) {
    if (this.parallelDone) return;
    const g = this.map.grid;
    const stall = g.tunaStall;
    const near = dist(s.pos, rectCenter(stall)) < 12;
    const aligned = alignedTo(s.heading, 0, 0.4) || alignedTo(s.heading, Math.PI, 0.4);
    if (!this.parallelStarted && near && aligned && Math.abs(s.speedMs) > 0.4) {
      this.parallelStarted = true;
      this.ev.fire("park.parallel.start");
    }
    if (near && s.speedMs < -0.3 && !this.parallelAdjust) {
      this.parallelAdjust = true;
      this.ev.fire("park.parallel.adjust");
    }
    this.curbCd = Math.max(0, this.curbCd - dt);
    if (near && s.pos.y - 0.95 < g.tunaCurbY && Math.abs(s.speedMs) > 0.35 && this.curbCd <= 0) {
      this.curbCd = 5;
      this.stoppedS = 0;
      this.ev.fire("park.parallel.curb");
      return;
    }
    const inside = rectHas(stall, s.pos, -0.05);
    if (inside && aligned && this.parallelAdjust && Math.abs(s.speedMs) < 0.22) this.stoppedS += dt;
    else this.stoppedS = 0;
    if (this.stoppedS < 0.6) return;
    this.parallelDone = true;
    this.ev.fire("park.parallel.clean");
  }

  private jonah(dt: number, s: VehicleSample, noiseBand: 0 | 1 | 2) {
    if (!this.jonahBlew || this.jonahSettled) return;
    if (!this.closeFired && dist(s.pos, { x: 265, y: 0 }) < 16 && Math.abs(s.speedMs) > 6) {
      this.closeFired = true;
      this.ev.requestQuiz("follow.close", 22);
    }
    if (noiseBand === 0) this.calmS += dt;
    else this.calmS = 0;
    if (this.calmS < 3.2) return;
    this.jonahSettled = true;
    this.ev.fire("quiet.settle");
  }
}

function laneIndex(g: GridSites, p: Vec2): number {
  const { x0, x1, y0, y1, count } = g.lanes;
  if (p.y < y0 || p.y > y1 || p.x < x0 || p.x > x1) return -1;
  const i = Math.floor(((p.x - x0) / (x1 - x0)) * count);
  return Math.max(0, Math.min(count - 1, i));
}

function normAngle(a: number) {
  return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

function alignedTo(heading: number, target: number, tol: number) {
  return Math.abs(normAngle(heading - target)) < tol;
}

function northPoint(s: VehicleSample): Vec2 {
  const nose = s.speedMs < 0 ? s.heading + Math.PI : s.heading;
  return { x: s.pos.x + Math.cos(nose) * 2.1, y: s.pos.y + Math.sin(nose) * 2.1 };
}

export function stallCenter(r: Rect): Vec2 { return rectCenter(r); }
