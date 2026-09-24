import type { Rect, Vec2 } from "./math";
import { dist, rectHas } from "./math";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const LIMIT = 35;

/**
 * Act V scene 5.1. The grade up to the chain-up pull-out.
 * Thirty-five, nothing sudden, and the ice tells on a hard input.
 */
export class ClimbRun {
  mission = false;
  private iceFired = false;
  private gentle = 0;
  private gentleFired = false;
  private overCd = 0;
  private worseCd = 0;
  private settle = 0;
  private settleFired = false;
  private sawFast = false;
  private arrived = false;

  constructor(private ice: Rect, private chainup: Vec2, private ev: { fire: (e: string) => void }) {}

  reset() {
    this.mission = true;
    this.iceFired = this.gentleFired = this.settleFired = this.arrived = this.sawFast = false;
    this.gentle = this.overCd = this.worseCd = this.settle = 0;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.overCd = Math.max(0, this.overCd - dt);
    this.worseCd = Math.max(0, this.worseCd - dt);
    const onIce = rectHas(this.ice, s.pos);
    const mph = Math.abs(s.speedMs) / MPH;

    if (onIce && !this.iceFired) {
      this.iceFired = true;
      this.ev.fire("ice.enter");
    }
    if (mph > LIMIT + 3 && this.overCd <= 0) {
      this.overCd = 8;
      this.sawFast = true;
      this.ev.fire("speed.over:35");
    }
    const gentleNow = onIce && mph > 8 && mph <= LIMIT && s.throttle < 0.55 && s.brake < 0.45 && Math.abs(s.steer) < 0.35;
    this.gentle = gentleNow ? this.gentle + dt : 0;
    if (!this.gentleFired && this.gentle >= 3) {
      this.gentleFired = true;
      this.ev.fire("input.gentle_streak");
    }
    if (onIce && s.brake > 0.55 && mph > 12 && this.worseCd <= 0) {
      this.worseCd = 3;
      this.ev.fire("skid.worsening");
    }
    if (this.iceFired && mph < 12) this.settle += dt;
    else this.settle = 0;
    if (!this.settleFired && this.sawFast && this.settle > 2) {
      this.settleFired = true;
      this.ev.fire("quiet.settle");
    }
    if (!this.arrived && dist(s.pos, this.chainup) < 8) {
      this.arrived = true;
      this.ev.fire("waypoint.reach:chainup");
    }
  }
}
