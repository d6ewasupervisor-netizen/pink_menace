import type { Rect, Vec2 } from "./math";
import { dist, rectHas } from "./math";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;

export type BeatMission =
  | "straight_night_drive"
  | "rest_area_pullin"
  | "rest_area_forced"
  | "vantage_bridge_crossing"
  | "bridge_after_sign_toy"
  | "bridge_after_sign_moth"
  | "bridge_engine_off_wait";

/**
 * The beats after the gravel lesson and the pass: the night straight (6.2)
 * and Vantage Bridge (6.3). Emits the event names those scenes already wait on.
 */
export class BeatRun {
  mission: BeatMission | "" = "";
  private t = 0;
  private flags = new Set<string>();
  private park = 0;
  private steerHold = 0;
  private creep = 0;
  private passedRest = 0;

  constructor(
    private rest: Rect,
    private restPin: Vec2,
    private bridge: { mid: Vec2; end: Vec2 },
    private ev: { fire: (e: string) => void },
  ) {}

  reset(id: BeatMission) {
    this.mission = id;
    this.t = this.park = this.steerHold = this.creep = this.passedRest = 0;
    this.flags.clear();
  }

  clear() { this.mission = ""; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.t += dt;
    if (this.mission === "straight_night_drive") this.straight(dt, s);
    else if (this.mission === "rest_area_pullin" || this.mission === "rest_area_forced") this.parkIn(dt, s);
    else if (this.mission === "vantage_bridge_crossing") this.bridgeCross(dt, s);
    else if (this.mission === "bridge_after_sign_toy") this.toy(dt, s);
    else if (this.mission === "bridge_after_sign_moth") this.moth(dt, s);
    else this.engineOff(dt, s);
  }

  private once(name: string) {
    if (this.flags.has(name)) return;
    this.flags.add(name);
    this.ev.fire(name);
  }

  private straight(dt: number, s: VehicleSample) {
    if (this.t > 1) this.once("night.fall");
    if (Math.abs(s.speedMs) > 8) this.once("headlight.highbeam.on");
    const mph = Math.abs(s.speedMs) / MPH;
    if (mph > 70) this.once("shadow.exceeds_lights");
    else if (mph > 15 && mph < 55 && this.flags.has("headlight.highbeam.on")) this.once("shadow.inside_lights");
    if (this.t > 20 && Math.abs(s.speedMs) > 4) this.once("fatigue.yellow");
    if (this.t > 40 && Math.abs(s.speedMs) > 4) this.once("fatigue.red");
    if (!this.flags.has("waypoint.reach:rest_area") && dist(s.pos, this.restPin) < 10) {
      this.once("waypoint.reach:rest_area");
    }
    if (this.flags.has("waypoint.reach:rest_area") && s.pos.x > this.restPin.x + 24 && Math.abs(s.speedMs) > 6) {
      this.passedRest += dt;
      if (this.passedRest > 3) this.once("microsleep.drift");
    }
    if (this.flags.has("microsleep.drift") && !rectHas(this.rest, s.pos) && Math.abs(s.pos.y - this.restPin.y) > 2.2) {
      this.once("rumble.strip");
    }
  }

  private parkIn(dt: number, s: VehicleSample) {
    const inStall = rectHas(this.rest, s.pos) || dist(s.pos, this.restPin) < 8;
    const settled = inStall && Math.abs(s.speedMs) < 1.2 && s.brake > 0.25;
    this.park = settled ? this.park + dt : 0;
    if (this.park >= 1.2) this.once("park.clean");
  }

  private bridgeCross(dt: number, s: VehicleSample) {
    if (Math.floor(this.t / 8) !== Math.floor((this.t - dt) / 8) && this.t > 1) this.ev.fire("wind.gust");
    const mph = Math.abs(s.speedMs) / MPH;
    if (mph > 45) this.ev.fire("speed.over:45");
    if (s.steer > 0.12 && s.steer < 0.45) this.steerHold += dt;
    else this.steerHold = 0;
    if (this.steerHold > 0.8) this.once("steer.into_wind");
    if (Math.abs(s.steer) > 0.7) this.ev.fire("steer.overcorrect");
    if (dist(s.pos, this.bridge.mid) < 8) this.once("waypoint.reach:bridge_mid");
    if (dist(s.pos, this.bridge.end) < 8) this.once("waypoint.reach:bridge_end");
  }

  private toy(dt: number, s: VehicleSample) {
    this.creep = Math.abs(s.speedMs) < 4 ? this.creep + dt : 0;
    if (this.creep > 2) this.once("gracie.toy");
    if (this.flags.has("gracie.toy") && Math.abs(s.speedMs) < 5) {
      this.park += dt;
      if (this.park > 3) this.once("quiet.settle");
    }
  }

  private moth(dt: number, s: VehicleSample) {
    this.creep = Math.abs(s.speedMs) > 8 ? this.creep + dt : 0;
    if (this.creep > 1) this.once("gracie.moth");
  }

  private engineOff(dt: number, s: VehicleSample) {
    if (s.throttle > 0.3 || Math.abs(s.speedMs) > 1.5) {
      if (this.park > 2) this.ev.fire("engine.start_early");
      this.park = 0;
      return;
    }
    this.park += dt;
    for (const mark of [15, 30, 45, 60]) {
      if (this.park >= mark) this.once(`bridge.wait:${mark}`);
    }
    if (dist(s.pos, this.bridge.end) < 8) this.once("waypoint.reach:bridge_end");
  }
}
