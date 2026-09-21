import { type Vec2, add, angle, clamp, dist, len, mul, norm } from "./math";
import type { WalkerInput } from "./dol";
import { WALKER } from "./dol";

export const PHARMACY = {
  DOOR_RADIUS_M: 1.55,
  STEP_OUT_M: 1.6,
} as const;

/**
 * Act 2 delivery 1 dropoff: out of the Beetle, door first, insulin to the
 * clipboard. Walk is soft; run slams it.
 */
export class PharmacyDropoff {
  pos: Vec2 = { x: 0, y: 0 };
  facing = 0;
  speed = 0;
  done = false;
  private doorFired = false;
  private car: Vec2 = { x: 0, y: 0 };

  reset(car: Vec2, heading: number) {
    const left = { x: Math.cos(heading - Math.PI / 2), y: Math.sin(heading - Math.PI / 2) };
    this.car = { ...car };
    this.pos = add(car, mul(left, PHARMACY.STEP_OUT_M));
    this.facing = heading;
    this.speed = 0;
    this.done = false;
    this.doorFired = false;
  }

  step(
    dt: number,
    input: WalkerInput,
    blocked: (p: Vec2) => boolean,
    clipboard: Vec2,
    ev: { fire: (event: string, data?: Record<string, unknown>) => void },
  ) {
    if (this.done) { this.speed = 0; return; }

    const dir = { x: clamp(input.x, -1, 1), y: clamp(input.y, -1, 1) };
    const mag = Math.min(1, len(dir));
    const target = mag > 0.05 ? (input.run ? WALKER.RUN_MS : WALKER.WALK_MS) * mag : 0;
    this.speed += clamp(target - this.speed, -8 * dt, 8 * dt);

    if (mag > 0.05) {
      if (!this.doorFired) {
        this.doorFired = true;
        ev.fire(input.run ? "door.slam" : "door.close.soft");
      }
      const u = norm(dir);
      this.facing = angle(u);
      const next = add(this.pos, mul(u, this.speed * dt));
      if (!blocked(next)) this.pos = next;
      else {
        const nx = { x: next.x, y: this.pos.y };
        const ny = { x: this.pos.x, y: next.y };
        if (!blocked(nx)) this.pos = nx;
        else if (!blocked(ny)) this.pos = ny;
        else this.speed = 0;
      }
    }

    if (dist(this.pos, clipboard) < PHARMACY.DOOR_RADIUS_M && dist(this.pos, this.car) > 2) {
      this.done = true;
      this.speed = 0;
      ev.fire("delivery.complete");
    }
  }
}
