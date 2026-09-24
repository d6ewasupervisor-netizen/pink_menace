import type { Rect } from "./math";
import { rectHas } from "./math";
import type { VehicleSample } from "./vehicleObserver";

/**
 * Act V scene 5.2. The player already has the chains. Tighten without
 * dropping the tensioner: a steady brake in the pull-out, not a stab of throttle.
 */
export class ChainupRun {
  mission = false;
  private hold = 0;
  private done = false;
  private dropCd = 0;

  constructor(private pullout: Rect, private ev: { fire: (e: string) => void }) {}

  reset() {
    this.mission = true;
    this.hold = 0;
    this.done = false;
    this.dropCd = 0;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission || this.done) return;
    if (!rectHas(this.pullout, s.pos)) return;
    this.dropCd = Math.max(0, this.dropCd - dt);
    const dropped = s.throttle > 0.75 || s.horn || s.brake > 0.92;
    if (dropped && this.dropCd <= 0) {
      this.dropCd = 4;
      this.hold = 0;
      this.ev.fire("chainup.qte.drop");
      return;
    }
    const tightening = s.brake > 0.2 && s.brake < 0.85 && Math.abs(s.speedMs) < 2 && s.throttle < 0.2;
    this.hold = tightening ? this.hold + dt : 0;
    if (this.hold >= 3.5) {
      this.done = true;
      this.ev.fire("chainup.qte.success");
    }
  }
}
