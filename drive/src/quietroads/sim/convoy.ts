import { type Vec2, dist, rectHas } from "./math";
import type { RibbonSites } from "./kentMap";
import type { VehicleSample } from "./vehicleObserver";

const MPH = 0.44704;
const SIGNAL_HOLD_S = 0.5;
const MATCH_FRAC = 0.85;
const FOLLOW_S = 3;
const FOLLOW_MIN_FRAC = 0.6;

export type ConvoyMission = "mission_convoy_issaquah" | "convoy_continue_solo" | "convoy_tow_jonah";

/**
 * Act V after the on-ramp lesson: the Issaquah convoy on the same Ribbon.
 * Emits the event names scene 3.2 / 3.3 already wait on.
 */
export class ConvoyRun {
  mission: ConvoyMission | "" = "";
  leadPos: Vec2 = { x: 0, y: 0 };
  leadHeading = Math.PI / 2;

  private onRamp = false;
  private rampFired = false;
  private rampS = 0;
  private gapFired = false;
  private gapS = 0;
  private merged = false;
  private leftRamp = false;
  private signalHold = 0;
  private pending: { fast: boolean; signaled: boolean; gapOk: boolean; loud: boolean } | null = null;
  private followCloseCd = 0;
  private followGreen = false;
  private greenS = 0;
  private limitS = 0;
  private limitN = 0;
  private stallFired = false;
  private arriveFired = false;
  private towStarted = false;
  private idleS = 0;
  private idleFired = false;
  private jerkCd = 0;

  constructor(
    private g: RibbonSites,
    private stall: Vec2,
    private issaquah: Vec2,
    private ev: { fire: (e: string, d?: Record<string, unknown>) => void },
  ) {}

  reset(id: ConvoyMission) {
    this.mission = id;
    this.onRamp = this.rampFired = this.gapFired = this.merged = this.leftRamp = false;
    this.rampS = this.gapS = this.signalHold = this.limitS = 0;
    this.limitN = 0;
    this.pending = null;
    this.followCloseCd = 0;
    this.followGreen = false;
    this.greenS = 0;
    this.stallFired = this.arriveFired = false;
    this.towStarted = false;
    this.idleS = 0;
    this.idleFired = false;
    this.jerkCd = 0;
    this.leadPos = { ...this.g.lead.from };
    this.leadHeading = Math.PI / 2;
  }

  clear() { this.mission = ""; }

  step(dt: number, s: VehicleSample, noiseBand: 0 | 1 | 2) {
    if (!this.mission) return;
    if (this.mission === "mission_convoy_issaquah") this.eastbound(dt, s, noiseBand);
    else this.afterStall(dt, s);
  }

  private eastbound(dt: number, s: VehicleSample, noiseBand: 0 | 1 | 2) {
    this.advanceLead(dt);
    const inRamp = rectHas(this.g.ramp, s.pos);
    if (inRamp && !this.rampFired) {
      this.rampFired = true;
      this.onRamp = true;
      this.ev.fire("ramp.enter");
    }
    if (this.rampFired) this.rampS += dt;
    if (this.onRamp && Math.abs(s.steer) > 0.18) this.signalHold += dt;

    // One shot, after the ramp line and its card (the card freezes the sim).
    // merge.gap_open also matches the later wait `merge.`, so it must not repeat.
    if (!this.gapFired && this.rampFired && this.rampS >= 3 && dist(s.pos, this.leadPos) >= 10) {
      this.gapFired = true;
      this.ev.fire("merge.gap_open");
    }
    if (this.gapFired && !this.merged) this.gapS += dt;

    if (this.onRamp && !inRamp && this.inLanes(s.pos)) {
      this.onRamp = false;
      this.leftRamp = true;
      const gap = dist(s.pos, this.leadPos);
      const need = Math.max(8, Math.abs(s.speedMs) * FOLLOW_S);
      this.pending = {
        fast: Math.abs(s.speedMs) >= this.g.flowMph * MPH * MATCH_FRAC,
        signaled: this.signalHold >= SIGNAL_HOLD_S,
        gapOk: gap >= need,
        loud: noiseBand === 2,
      };
    }

    if (!this.merged && this.leftRamp && this.gapFired && this.gapS >= 3.5 && this.pending) {
      this.merged = true;
      const g = this.pending;
      if (g.loud) this.ev.fire("merge.loud");
      else if (!g.fast || !g.signaled || !g.gapOk) this.ev.fire("merge.slow");
      else this.ev.fire("merge.clean");
    }

    if (this.merged) {
      this.limitS += dt;
      if (this.limitN < 3 && this.limitS >= 4 + this.limitN * 6) {
        this.limitN++;
        this.ev.fire("speed.limit_change:70");
      }
      this.trackFollow(dt, s);
    }

    if (this.merged && !this.idleFired) {
      this.idleS = Math.abs(s.speedMs) < 1 ? this.idleS + dt : 0;
      if (this.idleS > 3) {
        this.idleFired = true;
        this.ev.fire("cruise.idle");
      }
    }

    if (this.merged && !this.stallFired && dist(s.pos, this.stall) < 8) {
      this.stallFired = true;
      this.ev.fire("waypoint.reach:stall_point");
    }
  }

  private trackFollow(dt: number, s: VehicleSample) {
    this.followCloseCd = Math.max(0, this.followCloseCd - dt);
    if (Math.abs(s.speedMs) < 2) return;
    const gap = dist(s.pos, this.leadPos);
    const full = Math.abs(s.speedMs) * FOLLOW_S;
    if (gap < full * FOLLOW_MIN_FRAC && this.followCloseCd <= 0) {
      this.followCloseCd = 8;
      this.greenS = 0;
      this.ev.fire("follow.red", { gap_m: Math.round(gap) });
      return;
    }
    if (this.followGreen || gap < full) { this.greenS = 0; return; }
    this.greenS += dt;
    if (this.greenS >= 1.5) {
      this.followGreen = true;
      this.ev.fire("follow.green");
    }
  }

  private afterStall(dt: number, s: VehicleSample) {
    if (this.mission === "convoy_tow_jonah" && !this.towStarted && Math.abs(s.speedMs) > 1.2) {
      this.towStarted = true;
      this.ev.fire("tow.start");
    }
    this.jerkCd = Math.max(0, this.jerkCd - dt);
    if (this.towStarted && s.throttle > 0.85 && this.jerkCd <= 0) {
      this.jerkCd = 6;
      this.ev.fire("tow.jerk");
    }
    if (!this.arriveFired && dist(s.pos, this.issaquah) < 8) {
      this.arriveFired = true;
      this.ev.fire("waypoint.reach:issaquah");
    }
    void dt;
  }

  private advanceLead(dt: number) {
    const { from, to, speedMph } = this.g.lead;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    this.leadPos.x += ux * speedMph * MPH * dt;
    this.leadPos.y += uy * speedMph * MPH * dt;
    const proj = (this.leadPos.x - from.x) * ux + (this.leadPos.y - from.y) * uy;
    if (proj > L) this.leadPos = { ...to };
  }

  private inLanes(p: Vec2) {
    const { x0, x1, y0, y1 } = this.g.lanes;
    return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  }
}
