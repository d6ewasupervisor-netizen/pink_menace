import type { Rect, Vec2 } from "./math";
import { dist, rectHas } from "./math";
import type { VehicleSample } from "./vehicleObserver";
import { BRIDGE_WAIT_S } from "../handsoff";
import { gustSideAt, gustWarnings, gustsCrossed, steerWindows } from "../assist";

const MPH = 0.44704;

export type BeatMission =
  | "straight_night_drive"
  | "rest_area_pullin"
  | "rest_area_forced"
  | "vantage_bridge_crossing"
  | "bridge_after_sign_toy"
  | "bridge_after_sign_moth"
  | "bridge_engine_off_wait";

/**
 * The beats after the gravel lesson and the pass: the night straight (6.2)
 * and Vantage Bridge (6.3). Emits the event names those scenes already wait on.
 */
export class BeatRun {
  mission: BeatMission | "" = "";
  private t = 0;
  private flags = new Set<string>();
  private park = 0;
  private steerHold = 0;
  private creep = 0;
  private passedRest = 0;
  private restPing = 0;
  private idle = 0;
  /**
   * Edge-trigger state for the two level-triggered bridges faults. On her 6.3
   * drive `speed.over:45` fired on every frame she was over (1,693 rows in 23 s)
   * and `steer.overcorrect` fired on every frame the stick was pushed past 0.7 —
   * one event per frame is not a report, it is a flood, and the uploader used to
   * answer each one with a POST.
   */
  private overLimit = false;
  private hardSteer = 0;
  private overSteerCd = 0;
  /**
   * The wind assist is on (touch/keyboard on the span, quietroads/assist.ts).
   * Written by `Simulation.windAssist`, which the bridge sets once per mission.
   */
  assist = false;

  constructor(
    private rest: Rect,
    private restPin: Vec2,
    private bridge: { mid: Vec2; end: Vec2 },
    private ev: { fire: (e: string, d?: Record<string, unknown>) => void },
  ) {}

  reset(id: BeatMission) {
    this.mission = id;
    this.t = this.park = this.steerHold = this.creep = this.passedRest = this.restPing = this.idle = 0;
    this.overLimit = false;
    this.hardSteer = 0;
    this.overSteerCd = 0;
    this.flags.clear();
  }

  clear() { this.mission = ""; }

  /** Sit-still on the span. The pin should not tell her to drive until this is over. */
  waitingOutTheBridge(): boolean {
    return this.mission === "bridge_engine_off_wait" && this.park < BRIDGE_WAIT_S;
  }

  /**
   * How long the engine-off wait has been standing still, in seconds. The overlay's
   * countdown reads this instead of running its own clock: the sim only steps while
   * the car is the surface, so a paused game or a locked phone holds the number
   * where it was and the 15/30/45/60 marks stay in step with the ring.
   */
  get waitElapsedS(): number {
    return this.park;
  }

  /** What the dash should say for the bridge. Null on the other beats. */
  goal(): string | null {
    switch (this.mission) {
      case "vantage_bridge_crossing":
        return "Cross the bridge. Under 45. When the wind pushes, steer into it — small.";
      case "bridge_after_sign_toy":
        return this.flags.has("quiet.settle")
          ? "Far side. Stay under 9 mph."
          : "Stay under 9 mph until it settles. Then the far side.";
      case "bridge_after_sign_moth":
        return this.flags.has("gracie.moth")
          ? "Far side."
          : "Keep rolling, above 18 mph. Don't creep.";
      case "bridge_engine_off_wait": {
        const left = Math.max(0, Math.ceil(BRIDGE_WAIT_S - this.park));
        return left > 0
          ? `Engine off. Sit still. ${left}s, then the far side.`
          : "Drive to the far side.";
      }
      default:
        return null;
    }
  }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    this.t += dt;
    if (this.mission === "straight_night_drive") this.straight(dt, s);
    else if (this.mission === "rest_area_pullin" || this.mission === "rest_area_forced") this.parkIn(dt, s);
    else if (this.mission === "vantage_bridge_crossing") this.bridgeCross(dt, s);
    else if (this.mission === "bridge_after_sign_toy") this.toy(dt, s);
    else if (this.mission === "bridge_after_sign_moth") this.moth(dt, s);
    else this.engineOff(dt, s);
  }

  private once(name: string) {
    if (this.flags.has(name)) return;
    this.flags.add(name);
    this.ev.fire(name);
  }

  private straight(dt: number, s: VehicleSample) {
    if (this.t > 1) this.once("night.fall");
    // 6.2's hush bark: the night straight, stopped with nothing coming. The scene
    // listens for `cruise.idle.night`; the eastbound convoy owns plain `cruise.idle`.
    this.idle = Math.abs(s.speedMs) < 1 ? this.idle + dt : 0;
    if (this.idle > 3) this.once("cruise.idle.night");
    if (s.beams === "high") this.once("headlight.highbeam.on");
    const mph = Math.abs(s.speedMs) / MPH;
    if (mph > 70) this.once("shadow.exceeds_lights");
    else if (mph > 15 && mph < 55 && this.flags.has("headlight.highbeam.on")) this.once("shadow.inside_lights");
    if (this.t > 20 && Math.abs(s.speedMs) > 4) this.once("fatigue.yellow");
    if (this.t > 40 && Math.abs(s.speedMs) > 4) this.once("fatigue.red");
    // Keep offering the pin. The first drive-by used to consume the event
    // before the story could take it, and sitting on the mark did nothing after.
    const atRest = rectHas(this.rest, s.pos) || dist(s.pos, this.restPin) < 16;
    if (atRest) {
      this.restPing -= dt;
      if (this.restPing <= 0) {
        this.flags.add("waypoint.reach:rest_area");
        this.ev.fire("waypoint.reach:rest_area");
        this.restPing = 0.75;
      }
    } else {
      this.restPing = 0;
    }
    if (this.flags.has("waypoint.reach:rest_area") && s.pos.x > this.restPin.x + 24 && Math.abs(s.speedMs) > 6) {
      this.passedRest += dt;
      if (this.passedRest > 3) this.once("microsleep.drift");
    }
    if (this.flags.has("microsleep.drift") && !rectHas(this.rest, s.pos) && Math.abs(s.pos.y - this.restPin.y) > 2.2) {
      this.once("rumble.strip");
    }
  }

  private parkIn(dt: number, s: VehicleSample) {
    const inStall = rectHas(this.rest, s.pos) || dist(s.pos, this.restPin) < 8;
    const settled = inStall && Math.abs(s.speedMs) < 1.2 && s.brake > 0.25;
    this.park = settled ? this.park + dt : 0;
    if (this.park >= 1.2) this.once("park.clean");
  }

  private bridgeCross(dt: number, s: VehicleSample) {
    // The gust, and the arrow that says which side it comes from 0.9 s early.
    // Both are computed from the sim's own clock, so a long frame can drop
    // neither (the old `Math.floor(t/8)` test could).
    for (const atS of gustsCrossed(this.t - dt, this.t)) {
      this.ev.fire("wind.gust", { side: gustSideAt(atS) });
    }
    for (const w of gustWarnings(this.t - dt, this.t)) {
      this.ev.fire("wind.gust.warn", { side: w.side, inS: w.inS });
    }
    const mph = Math.abs(s.speedMs) / MPH;
    // One report per crossing, not one per frame. Re-armed 2 mph below the limit
    // so a needle sitting on 44–46 cannot chatter the trigger.
    if (!this.overLimit && mph > 45) {
      this.overLimit = true;
      this.ev.fire("speed.over:45", { mph: Math.round(mph) });
    } else if (this.overLimit && mph <= 43) {
      this.overLimit = false;
    }
    // With the assist on, the windows are the thumb's (quietroads/assist.ts):
    // a modest correction passes, a real yank is still the mistake.
    const win = steerWindows(this.assist);
    if (s.steer > win.intoWind.min && s.steer < win.intoWind.max) this.steerHold += dt;
    else this.steerHold = 0;
    if (this.steerHold > win.intoWind.holdS) this.once("steer.into_wind");
    // A yank is a gesture, not a level: it has to be held, and it is reported once
    // per 2 s. At 60 Hz the old line emitted this 60 times a second while the
    // stick was pinned, which is what buried the bridge under telemetry.
    this.overSteerCd = Math.max(0, this.overSteerCd - dt);
    this.hardSteer = Math.abs(s.steer) > win.overcorrect.threshold ? this.hardSteer + dt : 0;
    if (this.hardSteer > win.overcorrect.holdS && this.overSteerCd <= 0) {
      this.overSteerCd = 2;
      this.ev.fire("steer.overcorrect", { steer: +s.steer.toFixed(2) });
    }
    if (dist(s.pos, this.bridge.mid) < 8) this.once("waypoint.reach:bridge_mid");
    if (dist(s.pos, this.bridge.end) < 8) this.once("waypoint.reach:bridge_end");
  }

  private toy(dt: number, s: VehicleSample) {
    this.creep = Math.abs(s.speedMs) < 4 ? this.creep + dt : 0;
    if (this.creep > 2) this.once("gracie.toy");
    if (this.flags.has("gracie.toy") && Math.abs(s.speedMs) < 5) {
      this.park += dt;
      if (this.park > 3) this.once("quiet.settle");
    }
  }

  private moth(dt: number, s: VehicleSample) {
    this.creep = Math.abs(s.speedMs) > 8 ? this.creep + dt : 0;
    if (this.creep > 1) this.once("gracie.moth");
  }

  private engineOff(dt: number, s: VehicleSample) {
    // The minute is served: she drives to the far side. The engine coming back
    // on is the scene's own "Okay. Key. Gentle. Go." (6.3.13) — not a restart.
    // Before this guard, the first throttle press after the wait fired
    // `engine.start_early` and threw her back to "Sixty. From the top."
    if (this.park >= BRIDGE_WAIT_S) {
      // The clock keeps running so the overlay can hold its release beat and let
      // go; nothing else reads it (the marks are `once`, the goal is past).
      this.park += dt;
      if (dist(s.pos, this.bridge.end) < 8) this.once("waypoint.reach:bridge_end");
      return;
    }
    if (s.throttle > 0.3 || Math.abs(s.speedMs) > 1.5) {
      if (this.park > 2) this.ev.fire("engine.start_early");
      this.park = 0;
      return;
    }
    this.park += dt;
    for (const mark of [15, 30, 45, BRIDGE_WAIT_S]) {
      if (this.park >= mark) this.once(`bridge.wait:${mark}`);
    }
    if (dist(s.pos, this.bridge.end) < 8) this.once("waypoint.reach:bridge_end");
  }
}
