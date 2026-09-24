import type { Vec2 } from "./math";
import { dist } from "./math";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const FOLLOW_S = 4;

/**
 * Act VI scene 7.1. Four seconds behind Hank, out of his blind spots,
 * wide on the turn, over for the patrol car, then Ritzville.
 */
export class EscortRun {
  mission = false;
  leadPos: Vec2 = { x: 0, y: 0 };
  leadHeading = 0;

  private from: Vec2 = { x: 40, y: 438 };
  private to: Vec2 = { x: 300, y: 438 };
  private speedMph = 30;
  private end: Vec2 = { x: 300, y: 438 };
  private flags = new Set<string>();
  private green = 0;
  private nzCd = 0;
  private idle = 0;
  private patrolSeen = false;
  private patrolT = 0;
  private patrolY = 0;
  private patrolSpeed = 0;
  private ahead = 0;

  constructor(private ev: { fire: (e: string) => void }) {}

  reset(from: Vec2, to: Vec2, end: Vec2) {
    this.mission = true;
    this.from = from;
    this.to = to;
    this.end = end;
    this.leadPos = { ...from };
    this.leadHeading = 0;
    this.flags.clear();
    this.green = this.nzCd = this.idle = this.patrolT = this.ahead = 0;
    this.patrolSeen = false;
  }

  clear() { this.mission = false; }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.advance(dt);
    this.nzCd = Math.max(0, this.nzCd - dt);
    const gap = s.pos.x - this.leadPos.x;
    const need = Math.max(8, Math.abs(s.speedMs) * FOLLOW_S);
    const behind = gap < -2;

    if (this.nzCd <= 0 && behind && -gap < need * 0.45) {
      this.nzCd = 6;
      this.ev.fire("nozone.enter:rear");
    } else if (this.nzCd <= 0 && gap > 2 && gap < 8) {
      this.nzCd = 6;
      this.ev.fire("nozone.enter:front");
    } else if (this.nzCd <= 0 && Math.abs(s.pos.y - this.leadPos.y) < 1.2 && behind && -gap < need * 0.7) {
      this.nzCd = 6;
      this.ev.fire(s.pos.y > this.leadPos.y ? "nozone.enter:right" : "nozone.enter:left");
    }

    if (behind && -gap >= need * 0.75 && -gap <= need * 1.35 && Math.abs(s.speedMs) > 4) {
      this.green += dt;
      if (this.green > 1.5) this.once("follow.green.truck");
    } else this.green = 0;

    if (!this.flags.has("wide_turn.approach") && this.leadPos.x > 145 && this.leadPos.x < 165) {
      this.once("wide_turn.approach");
      if (Math.abs(s.pos.y - this.leadPos.y) > 2.4) this.once("wide_turn.held");
      else this.once("wide_turn.inside");
    }

    if (!this.patrolSeen && this.leadPos.x > 190) {
      this.patrolSeen = true;
      this.patrolY = s.pos.y;
      this.patrolSpeed = s.speedMs;
      this.once("patrol.lights");
    }
    if (this.patrolSeen && !this.flags.has("moveover.lane") && !this.flags.has("moveover.slow") && !this.flags.has("moveover.none")) {
      this.patrolT += dt;
      if (Math.abs(s.pos.y - this.patrolY) > 1.6) this.once("moveover.lane");
      else if (this.patrolSpeed - s.speedMs > 3) this.once("moveover.slow");
      else if (this.patrolT > 4) this.once("moveover.none");
    }

    if (s.pos.x > this.leadPos.x + 4) {
      this.once("pass.begin");
      this.ahead += dt;
      if (this.ahead > 3) this.once("pass.linger");
    } else if (this.flags.has("pass.begin")) {
      this.once("pass.complete");
      this.ahead = 0;
    }

    this.idle = Math.abs(s.speedMs) < 1 ? this.idle + dt : 0;
    if (this.idle > 3) this.once("cruise.idle.escort");

    if (dist(s.pos, this.end) < 8) this.once("waypoint.reach:ritzville");
  }

  private once(name: string) {
    if (this.flags.has(name)) return;
    this.flags.add(name);
    this.ev.fire(name);
  }

  private advance(dt: number) {
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    this.leadPos.x += ux * this.speedMph * MPH * dt;
    this.leadPos.y += uy * this.speedMph * MPH * dt;
    const proj = (this.leadPos.x - this.from.x) * ux + (this.leadPos.y - this.from.y) * uy;
    if (proj > L) this.leadPos = { ...this.to };
  }
}
