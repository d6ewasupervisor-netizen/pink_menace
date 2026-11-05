/**
 * assist — what the Vantage Bridge does for a thumb.
 *
 * 6.3 is the one scene whose whole lesson is *small*: under 45, two hands, and
 * when the wind pushes, steer into it a little. A touch stick has no "a little":
 * the ring is 54 px of travel, the pedal ramps to whatever you hold within about
 * a second, and a full push is full lock — so her HAR is 52–59 in a 45 and a skid
 * in the 25 after it. On a gamepad that is a skill problem; on glass it is an
 * interface problem.
 *
 * So on touch and keyboard (never on an analog pad, which already has travel):
 *
 *   - the car holds 40 mph itself — the brake still works, the throttle cannot
 *     push past the hold, and she only steers;
 *   - steering is scaled to 55 % of the stick, with a 4 % dead zone, so a thumb
 *     can ask for a correction instead of a lane change;
 *   - `steer.into_wind` accepts a modest correction (0.05–0.40 for 0.45 s) and
 *     `steer.overcorrect` is a real yank (0.5 for 0.4 s), both reachable by a
 *     thumb — before this, any full stick was an overcorrection 60 times a second
 *     and the pass line could not be reached at all;
 *   - a gust's arrow shows on the side the wind comes from 0.9 s before the
 *     `wind.gust` the story is waiting for, so "steer into it" is a cue she can
 *     read rather than a line she reads after the fact.
 *
 * The HUD says `WIND ASSIST · 40` while it is on. It is help, and it says so.
 *
 * What is NOT here: a lateral gust force. Measured, 2026-11-05: nothing in the
 * drive applies one. `wind.gust` is a story cue (`sim/beats.ts` fires it every
 * 8 s on the span); the only lateral motion the car has is the yaw the steering
 * asks for. So "reduce the gust force to 50–60 % for touch" had nothing to
 * reduce, and inventing one here would change VII-006's lesson and the span's
 * handling. The assist reduces the *yank* (steering gain + windows) and adds the
 * cue; the report says so rather than pretending a force exists.
 */
export const WIND = {
  /** What the car holds on the span (posted 45). */
  holdMph: 40,
  /** How fast the hold gets there, m/s². A Beetle's own drive is 1.96. */
  cruiseAccelMps2: 1.1,
  /** Touch/keyboard steering, as a fraction of the stick. */
  steerGain: 0.55,
  /** ...and the dead zone at the centre, so 0 is reachable by a thumb. */
  steerDeadZone: 0.04,
  /** The pass: a modest correction, held briefly. */
  intoWind: { min: 0.05, max: 0.4, holdS: 0.45 },
  /** The mistake: a real yank, held. */
  overcorrect: { threshold: 0.5, holdS: 0.4 },
  /** The arrow, seconds before the gust. */
  gustLeadS: 0.9,
  /** The span's gust cadence (sim/beats.ts, one per 8 s). */
  gustPeriodS: 8,
  /** The label on the HUD chip. */
  label: 'WIND ASSIST · 40',
} as const;

/** The windows the bridge graders use when no assist is on (unchanged). */
export const WIND_HARD = {
  intoWind: { min: 0.12, max: 0.45, holdS: 0.8 },
  overcorrect: { threshold: 0.7, holdS: 0.35 },
} as const;

/** The mission the assist belongs to. */
export const WIND_MISSION = 'vantage_bridge_crossing';

/** Which family is driving. An analog pad has travel of its own and gets no assist. */
export type InputFamily = 'gamepad' | 'touch';

export interface WindAssist {
  holdMph: number;
  steerGain: number;
  deadZone: number;
  label: string;
}

/** The assist for a mission + input family, or null when neither applies. */
export function windAssistFor(missionId: string | null | undefined, family: InputFamily): WindAssist | null {
  if (missionId !== WIND_MISSION) return null;
  if (family === 'gamepad') return null;
  return { holdMph: WIND.holdMph, steerGain: WIND.steerGain, deadZone: WIND.steerDeadZone, label: WIND.label };
}

/** The steering windows the bridge grades with, assist or not. */
export function steerWindows(assist: boolean) {
  return assist ? { intoWind: WIND.intoWind, overcorrect: WIND.overcorrect } : WIND_HARD;
}

/**
 * Steering after the assist: scale, then dead-zone, then clamp. Pure, so the
 * ratio a thumb actually gets is a number a test can pin.
 */
export function steerWithAssist(rawSteer: number, sensitivity: number, assist: WindAssist | null): number {
  const scaled = rawSteer * sensitivity * (assist ? assist.steerGain : 1);
  const dead = assist ? assist.deadZone : 0;
  const out = Math.abs(scaled) < dead ? 0 : scaled;
  return Math.max(-1, Math.min(1, out));
}

/**
 * The speed hold. The brake wins; below the target the car finds it on its own;
 * above it, the throttle cannot push past it. Pure: the vehicle controller calls
 * this once per step and the test calls it directly.
 */
export function cruiseSpeedMps(currentMps: number, targetMps: number, braking: boolean, dt: number): number {
  if (braking) return currentMps;
  if (currentMps > targetMps) return targetMps;
  if (currentMps < targetMps) return Math.min(targetMps, currentMps + WIND.cruiseAccelMps2 * Math.max(0, dt));
  return currentMps;
}

/** Gust `k` (k >= 1) comes from alternating sides, so the arrow alternates. */
export function gustSide(k: number): 'left' | 'right' {
  return k % 2 === 0 ? 'left' : 'right';
}

/** The side of the gust that lands at `atS` seconds into the span. */
export function gustSideAt(atS: number, period = WIND.gustPeriodS): 'left' | 'right' {
  return gustSide(Math.round(atS / period));
}

/**
 * Every gust instant `k · period` crossed by `(prevT, t]`. The sim's own test
 * (`Math.floor(t/8) !== Math.floor((t-dt)/8)`) can drop one on a long frame;
 * this cannot.
 */
export function gustsCrossed(prevT: number, t: number, period = WIND.gustPeriodS): number[] {
  const out: number[] = [];
  if (!(period > 0) || !(t > prevT)) return out;
  const first = Math.max(1, Math.floor(prevT / period) + 1);
  for (let k = first; k * period <= t + 1e-9; k++) out.push(k * period);
  return out;
}

/**
 * Every warning instant `k · period − lead` crossed by `(prevT, t]`, with the
 * side the gust will come from. The warning is what the arrow draws.
 */
export function gustWarnings(
  prevT: number,
  t: number,
  period = WIND.gustPeriodS,
  lead = WIND.gustLeadS,
): { atS: number; side: 'left' | 'right'; inS: number }[] {
  const out: { atS: number; side: 'left' | 'right'; inS: number }[] = [];
  if (!(period > 0) || !(t > prevT)) return out;
  const first = Math.max(1, Math.floor((prevT + lead) / period) + 1);
  for (let k = first; k * period - lead <= t + 1e-9; k++) {
    out.push({ atS: k * period - lead, side: gustSide(k), inS: lead });
  }
  return out;
}

