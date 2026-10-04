import { type Vec2, MPH, clamp } from "./math";
import { CCD } from "../config";
import type { NoiseSystem } from "./noise";

/**
 * The R3F vehicle controller owns movement. This observer watches it and
 * derives the teaching layer: stopping shadow, hard-input noise, skid, ambient
 * engine noise, speed-limit tracking. Feed it once per frame.
 */
export interface VehicleSample {
  pos: Vec2;          // metres, world XZ → (x, y)
  heading: number;    // radians, 0 = +x
  speedMs: number;    // signed, negative = reversing
  throttle: number;   // 0..1
  brake: number;      // 0..1
  steer: number;      // -1..1
  horn: boolean;
  /** Player stalk. Absent means the sim does not invent a beam. */
  beams?: 'off' | 'low' | 'high';
  /** Measured sideways slip from the vehicle controller (|lateral v| / |forward v|), if available. */
  lateralSlip?: number;
}

export const SKID = {
  SLIP_THRESHOLD: 0.32,   // measured slip ratio that counts as sliding
  MIN_SPEED_MS: 5.5,      // ~12 mph — below this the tyres can't scream
  SUSTAIN_S: 0.25,        // must hold for a quarter second (no single-frame blips)
} as const;

export const VEHICLE = {
  REACTION_S: 1.5,
  BRAKE_DECEL_DRY: 8.0,   // m/s², matches the Beetle in VehicleController
  // Surface friction coefficients. Guide §5.6: rain/snow/ice "significantly
  // reduce friction"; §4.15 references entering a paved road from an unpaved
  // one. Gravel is looser than dry asphalt and yields a longer stop than dry —
  // shorter than ice (ice is catastrophic). Wet is reserved for a future
  // rain/deck surface; no Kent corridor applies it yet.
  MU: { dry: 0.7, wet: 0.4, gravel: 0.5, ice: 0.15 } as { dry: number; wet: number; gravel: number; ice: number },
  WHEELBASE_M: 2.4,
  LENGTH_M: 4.0,
  WIDTH_M: 1.9,
};

/** Dry-pavement brake. The truck's wheelbase is longer; the highway car sits between. */
export const CHASSIS_DECEL: Record<"beetle" | "truck" | "highway", number> = {
  beetle: 8.0,
  highway: 6.2,
  truck: 4.6,
};

/** What the car can actually shed, given chassis and surface. The shadow uses this too. */
export function brakeDecel(chassis: "beetle" | "truck" | "highway", mu = VEHICLE.MU.dry): number {
  return Math.max(CHASSIS_DECEL[chassis] * (mu / VEHICLE.MU.dry), 0.5);
}

/** Reaction + braking distance, in metres. The single most valuable visual in the game. */
export function stoppingDistanceM(speedMs: number, mu = VEHICLE.MU.dry, dryDecel = VEHICLE.BRAKE_DECEL_DRY): number {
  const v = Math.abs(speedMs);
  const decel = Math.max(dryDecel * (mu / VEHICLE.MU.dry), 0.5);
  return v * VEHICLE.REACTION_S + (v * v) / (2 * decel);
}
export const reactionDistanceM = (speedMs: number) => Math.abs(speedMs) * VEHICLE.REACTION_S;

export interface ObserverOut {
  skidding: boolean;
  stoppingM: number;
  lateralG: number;
}

export class VehicleObserver {
  mu: number = VEHICLE.MU.dry;
  skidding = false;
  private prev: VehicleSample | null = null;
  /**
   * One previous-sample object for the whole run (P13). The sample step used to
   * do `this.prev = { ...s }`, which allocated a new object and a new `pos`
   * every physics step; here the fields are copied into this one instance, so
   * its identity never changes after the first sample.
   */
  private readonly prevSample: VehicleSample = { pos: { x: 0, y: 0 }, heading: 0, speedMs: 0, throttle: 0, brake: 0, steer: 0, horn: false };
  /** One ObserverOut for the whole run — the caller reads it immediately. */
  private readonly out: ObserverOut = { skidding: false, stoppingM: 0, lateralG: 0 };
  private hornHeld = false;
  private hardCd = 0; private skidCd = 0; private speedOverT = 0; private speedOverCd = 0; private ambientT = 0;
  private slipT = 0;
  private lastHeading = 0;
  private contactThisStep = false;
  private ccdCd = 0;

  constructor(private noise: NoiseSystem, private fire: (event: string, data?: Record<string, unknown>) => void) {}

  reset() { this.prev = null; this.skidding = false; this.hardCd = this.skidCd = this.speedOverT = this.speedOverCd = this.ambientT = this.slipT = 0; this.ccdCd = 0; }

  /** The reused previous-sample object (null until the first step). Identity is stable. */
  previousSample(): VehicleSample | null { return this.prev; }

  /**
   * P9 — call when the car touched something this step (the plow, a Quiet, a
   * curb). A contact legitimately eats displacement, so a step that moved far
   * *without* one is the tunnelling shape we report.
   */
  noteContact() { this.contactThisStep = true; }

  /** P9 — CCD displacement check. Telemetry only; it changes nothing about the drive. */
  private trackCcd(dt: number, s: VehicleSample) {
    this.ccdCd = Math.max(0, this.ccdCd - dt);
    const p = this.prev;
    const contact = this.contactThisStep;
    this.contactThisStep = false;
    if (!p || contact || this.ccdCd > 0) return;
    const dx = s.pos.x - p.pos.x, dy = s.pos.y - p.pos.y;
    if (dx * dx + dy * dy <= CCD.tunnelDisplacementM * CCD.tunnelDisplacementM) return;
    this.ccdCd = CCD.cooldownS;
    this.fire(CCD.event, { dx: +dx.toFixed(3), dy: +dy.toFixed(3), speedMs: +s.speedMs.toFixed(2) });
  }

  step(dt: number, s: VehicleSample, speedLimitMph: number): ObserverOut {
    const p = this.prev ?? s;
    this.trackCcd(dt, s);
    this.hardCd = Math.max(0, this.hardCd - dt); this.skidCd = Math.max(0, this.skidCd - dt); this.speedOverCd = Math.max(0, this.speedOverCd - dt);
    const v = Math.abs(s.speedMs);

    // horn
    if (s.horn && !this.hornHeld) { this.noise.emitKind("horn", s.pos); this.fire("horn.used"); }
    this.hornHeld = s.horn;

    // hard inputs
    if (s.throttle > 0.9 && p.throttle <= 0.9 && v < 9 && this.hardCd <= 0) { this.noise.emitKind("hard_accel", s.pos); this.fire("input.hard_accel"); this.hardCd = 1.5; }
    if (s.brake > 0.85 && p.brake <= 0.85 && v > 4.5 && this.hardCd <= 0) { this.noise.emitKind("hard_brake", s.pos); this.fire("input.hard_brake"); this.hardCd = 1.5; }

    // Skid: prefer the controller's measured slip. Fall back to yaw-derived lateral g only
    // when no slip is supplied, and then only at real speed — arcade steering pivots hard at
    // low speed and would otherwise read every corner as a slide.
    let dh = s.heading - (this.prev ? this.lastHeading : s.heading);
    dh = ((dh + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const yawRate = dt > 0 ? dh / dt : 0;
    const latAcc = Math.abs(v * yawRate);
    const limit = this.mu * 9.81;
    const slidingNow = s.lateralSlip != null
      ? (s.lateralSlip > SKID.SLIP_THRESHOLD && v > SKID.MIN_SPEED_MS)
      : (latAcc > limit * 0.95 && v > 8);
    this.slipT = slidingNow ? this.slipT + dt : 0;
    const was = this.skidding;
    if (this.slipT >= SKID.SUSTAIN_S) {
      this.skidding = true;
      if (!was && this.skidCd <= 0) { this.noise.emitKind("skid", s.pos); this.fire("skid.begin"); this.skidCd = 2; }
    } else if (!slidingNow) {
      if (was) this.fire("skid.recovered");
      this.skidding = false;
    }

    // ambient engine
    this.ambientT += dt;
    if (this.ambientT >= 0.5) { this.ambientT = 0; this.noise.emitKind(v > 0.5 ? "cruise" : "idle", s.pos); }

    // speed limit (5 mph grace, 2 s sustained, 10 s cooldown)
    if (s.speedMs > (speedLimitMph + 5) * MPH) {
      this.speedOverT += dt;
      if (this.speedOverT > 2 && this.speedOverCd <= 0) { this.fire("speed.over", { mph: Math.round(v / MPH), limit: speedLimitMph }); this.speedOverCd = 10; }
    } else this.speedOverT = 0;

    const prev = this.prevSample;
    prev.pos.x = s.pos.x; prev.pos.y = s.pos.y;
    prev.heading = s.heading; prev.speedMs = s.speedMs;
    prev.throttle = s.throttle; prev.brake = s.brake; prev.steer = s.steer;
    prev.horn = s.horn; prev.beams = s.beams; prev.lateralSlip = s.lateralSlip;
    this.prev = prev;
    this.lastHeading = s.heading;
    this.out.skidding = this.skidding;
    this.out.stoppingM = stoppingDistanceM(s.speedMs, this.mu, VEHICLE.BRAKE_DECEL_DRY);
    this.out.lateralG = latAcc / 9.81;
    return this.out;
  }

  /** Call when the car hits static geometry (curb, house). Emits the soft collision. */
  staticHit(pos: Vec2, speedMs: number) {
    if (Math.abs(speedMs) > 1) { this.noise.emitKind("collision_soft", pos); this.fire("collision.static"); }
  }
}

/** Grace helper for touch pads: converts hold time into a pressure ramp (gentle is a skill). */
export function pedalRamp(heldS: number, fullAtS = 0.9): number { return clamp(heldS / fullAtS, 0, 1); }
