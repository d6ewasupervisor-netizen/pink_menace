/**
 * wind — the crosswind on Vantage Bridge, as a force.
 *
 * 6.3's objective is "When the wind pushes, steer into it — small", and until
 * 2026-11-08 nothing pushed. `wind.gust` was a story cue; the arrow was a cue
 * about a cue; a player who obeyed the instruction drove off the span
 * cancelling a force that was not there. Measured headless (the real
 * `VehicleController` on a stub Rapier body, 40 mph, no input), the car held
 * 0.000 m of lateral drift across a gust, and the same steer that "answered"
 * it drifted the car 1.4 m in still air.
 *
 * So the gust is a shape and a push:
 *
 *   warning 0.9 s  →  ramp 0.3 s  →  hold 1.2 s  →  ramp out 0.4 s
 *
 * The push is applied as **lateral velocity on the car body**
 * (`VehicleController`), which is the one channel nothing else takes back: a
 * heading tweak is eaten by the steering's auto-centre, a speed change by the
 * 40 mph hold, and the tyres' own lateral damping by construction (the push is
 * added after it). The nose kick is a separate heading *offset* that returns to
 * zero, so the car straightens up when the gust passes instead of tracking down
 * the lane at an angle.
 *
 * Side convention: `side` is the side the wind comes FROM. A gust from the
 * right pushes the car to its LEFT (`pushDir` −1), so the correction is a steer
 * to the right — which is what `steer.into_wind` grades.
 */
import { HAPTIC_PATTERNS, buzz } from './haptics';

export type GustSide = 'left' | 'right';

export const GUST = {
  /** The span's cadence (quietroads/assist.ts WIND.gustPeriodS owns the cue). */
  periodS: 8,
  /** The arrow, before the push lands. */
  leadS: 0.9,
  /** Push shape. */
  rampInS: 0.3,
  holdS: 1.2,
  rampOutS: 0.4,
  /**
   * Lateral speed the gust puts on the body at full strength, m/s. The push is
   * this × the envelope's area (1.55 s) = 1.50 m; with the nose kick it measures
   * 1.84 m on a pad — a lane's worth of push, and it recovers when it passes.
   */
  peakLatMps: 0.97,
  /**
   * What the touch/keyboard assist takes off the push: 0.68 of full strength is
   * 0.66 m/s, 1.02 m of push and **1.35 m measured** with no input — visible, and
   * never a crash on its own. (The assist's job on this bridge is to make a
   * thumb's correction possible; it also takes the gust down a third, which is
   * the same help.)
   */
  assistScale: 0.68,
  /**
   * The nose kick at its peak, radians of heading offset. Small on purpose: the
   * offsets return to zero on the way out, so the heading at the end of the gust
   * is the heading at the start of it, and the drift is the whole memory of it.
   */
  peakYawRad: 0.012,
  /** Body roll at its peak, radians (Vehicle.tsx draws the Beetle at 0.4 of it). */
  peakRollRad: 0.05,
  /**
   * How far the car may drift from where the gust caught it and still count as a
   * "small" correction, metres. Half a lane: a correction that holds it inside
   * this is steering into the wind; one that carries it past centre toward the
   * wind side by more than this has overcorrected.
   */
  bandM: 0.5,
  /** The correction has to be held this long to count — it is a gesture. */
  intoWindHoldS: 0.3,
  /**
   * Below this much steering the wheel does not move at all (the vehicle
   * controller's own dead zone), so a correction under it is not a correction.
   */
  minSteer: 0.06,
} as const;

/** Ramp in + hold + ramp out: how long one gust pushes for. */
export const GUST_TOTAL_S = GUST.rampInS + GUST.holdS + GUST.rampOutS;

/** The push envelope at `atS` seconds into the gust, 0..1. */
export function gustEnvelope(atS: number): number {
  if (!(atS > 0) || atS >= GUST_TOTAL_S) return 0;
  if (atS < GUST.rampInS) return atS / GUST.rampInS;
  const held = GUST.rampInS + GUST.holdS;
  if (atS < held) return 1;
  return 1 - (atS - held) / GUST.rampOutS;
}

/** +1 when the gust pushes the car to its right, −1 when it pushes it left. */
export function gustPushDir(side: GustSide): 1 | -1 {
  return side === 'left' ? 1 : -1;
}

/** The peak lateral speed for a profile: full strength, or the assist's share. */
export function gustPeakLatMps(assist: boolean): number {
  return GUST.peakLatMps * (assist ? GUST.assistScale : 1);
}

/** Signed lateral speed on the body at `atS` seconds in (positive = to the right). */
export function gustLatMps(atS: number, side: GustSide, assist: boolean): number {
  return gustEnvelope(atS) * gustPeakLatMps(assist) * gustPushDir(side);
}

/**
 * Signed heading offset at `atS`, returns to 0. The gust turns the nose
 * *downwind* — a free-rolling body weathervanes — so the sign is the push's,
 * flipped: a positive rotation about world +Y turns the nose to the car's left.
 */
export function gustYawRad(atS: number, side: GustSide): number {
  return gustEnvelope(atS) * GUST.peakYawRad * -gustPushDir(side);
}

/** Signed body roll at `atS`: the shell leans into the wind the tyres are resisting. */
export function gustRollRad(atS: number, side: GustSide): number {
  return gustEnvelope(atS) * GUST.peakRollRad * -gustPushDir(side);
}

/**
 * Lateral displacement the push alone makes over one gust, metres: the peak speed
 * times the envelope's area (1.50 m at full strength, 1.02 m with the assist).
 * The sim test measures the push *and* the nose kick (1.84 m / 1.35 m), which is
 * what the car actually does.
 */
export function gustDriftM(assist: boolean): number {
  const area = GUST.rampInS / 2 + GUST.holdS + GUST.rampOutS / 2;
  return gustPeakLatMps(assist) * area;
}

/** Which way the player steers into a gust from `side`: the side it comes from. */
export function gustSteerWord(side: GustSide): 'left' | 'right' {
  return side;
}

/** The label on the gust indicator: the cue names the action, not just the gust. */
export function gustActionLabel(side: GustSide): string {
  return `GUST · steer ${gustSteerWord(side)}`;
}

/** What a phone should buzz for a gust. iOS has no `vibrate`; that is not an error. */
export const GUST_VIBRATION = HAPTIC_PATTERNS.gust;

/**
 * Buzz for the gust, where the platform supports it. Returns whether the platform
 * took it, so the caller (and a test) can tell "no vibration API" from "vibrated".
 *
 * ITEM 5.1 moved the pattern table and the gate into `quietroads/haptics.ts` —
 * one place for every physical event — but the gust keeps its own name here so
 * the bridge's line still reads as "the wind buzzes". The `enabled` argument is
 * the player's HAPTICS switch; it defaults to on so a caller that has not heard
 * of the switch behaves exactly as before.
 */
export function buzzGust(
  nav: Pick<Navigator, 'vibrate'> | null | undefined,
  enabled = true,
): boolean {
  return buzz('gust', { nav, enabled });
}
