/**
 * Pressure — a missed grade wakes the Quiet (owner decision, 2026-10-05).
 *
 * The Quiet ARE the zombies (QuietField in this folder, spawns in `kentMap.ts`,
 * drawn by `QuietSwarm`). There is one herd and this rule never adds to it. On a
 * missed grade — too close, a rolled stop, the wrong lane, a crossed solid, a bad
 * merge, a yanked shoulder, and the rest of the fail outcomes the graders already
 * fire — awareness rises on the Quiet near the car so the player SEES them. A
 * pass raises nothing. Decay (`QUIET.DECAY_PER_S`) still drains awareness.
 *
 * `GRADE_MISSES` is exactly the fail halves on the grade bus. Story beats
 * (`deac.*`, `jonah.*` — Jonah's own run already wakes the Grid herd), approach
 * and neutral beats (`stop.approach`, `ramp.enter`, `rural.edge`, `merge.gap_open`),
 * the pass halves (`*clean`, `*yield`, `stop.full`, `follow.green`,
 * `park.back_in.clean`, `quiet.settle`), and the noise band events are absent on
 * purpose: a pass does not raise pressure.
 */
export const PRESSURE = {
  /** Awareness one missed grade adds to each Quiet who can see the car. */
  MISS_AWARENESS: 30,
  /**
   * A miss never pushes a Quiet past ALERT on its own (thresholds: CURIOUS 25,
   * ALERT 60, SWARM 90). The swarm — and the cargo-losing `mission.fail.swarm` —
   * stays the noise system's verdict; mistakes reinforce, they don't condemn.
   * "Reinforce, don't add chaos."
   */
  MISS_CAP: 75,
  /** Within this radius a Quiet is close enough to see the miss. */
  SIGHT_M: 25,
  /** When nobody is in sight, this many dormant Quiet step onto the roadside. */
  RALLY_COUNT: 3,
  /** How far ahead of the car the roadside stand is set (first, second, third). */
  RALLY_AHEAD_M: [12, 17, 22],
  /** Lateral offset from the car's line — the roadside, not the traffic lane. */
  RALLY_OFFSET_M: 8,
  /**
   * Minimum seconds between two pressure applications. Some fail events fire
   * every step while the mistake continues (`rural.shoulder.yank`), and the herd
   * walk is per-Quiet work — one wake per second is plenty of reinforcement.
   */
  CD_S: 1,
} as const;

/** The fail events the graders already fire. Everything here raises pressure. */
export const GRADE_MISSES: ReadonlySet<string> = new Set([
  // too close
  "ledger.follow.close", "ribbon.follow.close", "follow.red",
  // rolled stop
  "stop.rolled", "rural.uncontrolled.rolled", "rural.crossbuck.rolled", "roundabout.rolled",
  // wrong lane
  "ledger.wrong_lane", "roundabout.lane",
  // crossed solid
  "ledger.crossed_solid",
  // a bad merge
  "ledger.merge.slow", "merge.slow", "merge.loud",
  "ribbon.signal.miss", "ribbon.match.slow", "ribbon.gap.tight",
  // a yanked shoulder — and the shoulder it happens on
  "rural.shoulder.yank", "rural.shoulder",
  // the rest of the fail halves the graders already fire
  "ledger.lanechange.no_signal", "lanechange.no_signal",
  "park.curb", "park.parallel.curb", "park.back_in.crooked",
  "backing.bump", "backing.too_fast",
  "speed.over", "speed.over:35", "speed.over:45",
  "rural.crest.fast",
  "collision.static", "steer.overcorrect", "tow.jerk",
  "chainup.qte.drop", "qte.gracie.fail", "walker.bump",
  "skid.worsening", "engine.start_early",
  "input.hard_accel", "input.hard_brake",
]);

export function isGradeMiss(event: string): boolean {
  return GRADE_MISSES.has(event);
}