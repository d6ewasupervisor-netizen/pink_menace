/**
 * Teaching-rule switches. The car's arcade feel stays in VehicleController
 * (the owner's tuned setLinvel/angvel). Surface friction stays in
 * vehicleObserver.MU. This file is the named rule the graders and the
 * teaching copy both read.
 *
 * BD-1: the text-only guide §5.2 says leave at least twice the length of
 * your vehicle. The drive feel stays a seconds count (3 dry / 4 behind a
 * truck) so a gap still grows with speed. Set `rule` to `vehicle_lengths`
 * to grade the guide's distance literally (a fixed gap, not a growing one).
 */
export const FOLLOW = {
  rule: "seconds" as "seconds" | "vehicle_lengths",
  drySeconds: 3,
  truckSeconds: 4,
  /** Guide §5.2. */
  lengths: 2,
  vehicleLengthM: 4,
  truckLengthM: 7,
  /** Below this fraction of the full gap, the grader calls it too close. */
  minFrac: 0.6,
};

/** The gap the grader treats as "enough road", in metres. */
export function followFullGapM(
  speedMs: number,
  kind: "dry" | "truck" = "dry",
  rule: "seconds" | "vehicle_lengths" = FOLLOW.rule,
): number {
  if (rule === "vehicle_lengths") {
    const len = kind === "truck" ? FOLLOW.truckLengthM : FOLLOW.vehicleLengthM;
    return len * FOLLOW.lengths;
  }
  const sec = kind === "truck" ? FOLLOW.truckSeconds : FOLLOW.drySeconds;
  return Math.abs(speedMs) * sec;
}

/** The sentence the guide actually teaches. Cards and objectives lead with this. */
export const GUIDE_SPACE =
  "Leave a distance that's at least twice the length of your vehicle.";

/**
 * P9 — CCD telemetry. The car body already sets `ccd` on its RigidBody (see
 * Vehicle.tsx); this is the *observer* half: a named displacement threshold that
 * says "the car moved further than a contact could have allowed in one step",
 * which is what tunnelling looks like from the sim's side.
 *
 * It changes no feel. Nothing here is read by VehicleController, the colliders,
 * the mass, or the damping — it only decides when to record one `ccd.tunnel`
 * telemetry event.
 *
 * At the fixed 1/60 s step, the Beetle's top speed on the highway (~33 m/s)
 * covers about 0.55 m per step. A threshold of 1.5 m sits far above any speed
 * the game can produce and far below the distance that would mean the body
 * passed through a thin wall in a single step, so the current scripted laps
 * record zero tunnels — they are the baseline.
 */
export const CCD = {
  /**
   * Planar displacement in metres, per fixed 1/60 s step, above which a
   * contact-free step is reported as a possible tunnel.
   */
  tunnelDisplacementM: 1.5,
  /** Event name. One row in the existing telemetry path, not a new bus. */
  event: 'ccd.tunnel',
  /** Minimum gap between reports, so one bad frame cannot flood telemetry. */
  cooldownS: 1,
} as const;
