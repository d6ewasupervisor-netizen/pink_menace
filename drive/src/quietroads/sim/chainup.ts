import type { Rect, Vec2 } from "./math";
import { dist, rectCenter, rectHas } from "./math";
import type { VehicleSample } from "./vehicleObserver";

/**
 * Act V scene 5.2. The player already has the chains. Tighten without
 * dropping the tensioner: hold the brake in the pull-out, don't stab it, don't
 * rev it, don't lean on the horn.
 *
 * What used to be here could not be finished. The success window was
 * `brake > 0.2 && brake < 0.85` held for 3.5 s, and `brake > 0.92` fired
 * `chainup.qte.drop`. Keys and pads are binary and the pedal ramps to 1.0 in
 * 0.6 s (`KENT_BRAKE_UP`), so the one brake a keyboard or a phone can produce
 * was both outside the success window and inside the fail window: stopping the
 * car fired "the tensioner hits the ice" every 4 s and success could never
 * accrue. There was no prompt either, so the objective ("Tighten. Don't drop
 * it.") named a gesture nothing on screen taught.
 *
 * Now: arrive (generous bay radius), stop (walking pace), then hold *any* brake
 * for `CHAIN_TIGHTEN_S`. A stab while still rolling is what drops it, which is
 * what the fiction says it is.
 */

/** Arrival radius from the pin. The bay is 28 x 44 m of unplowed pull-out; the
 *  painted pad is 6 m of it, and a phone screen is not a tape measure. */
export const CHAIN_ARRIVE_M = 26;
/** "Stopped" is walking pace or slower — a Beetle idling on ice still drifts. */
export const CHAIN_STOPPED_MS = 1.5;
/** Hold the brake this long, stopped, and the tensioner is tight. */
export const CHAIN_TIGHTEN_S = 1.6;
/** Any brake pressure counts, including the only brake a key or pad can make. */
export const CHAIN_BRAKE_MIN = 0.12;
/** Brake this hard while still rolling = the stab that sends it to the ice. */
export const CHAIN_STAB_BRAKE = 0.9;
export const CHAIN_STAB_MS = 3;
/** Revving it or leaning on the horn drops it too. */
export const CHAIN_DROP_THROTTLE = 0.6;

/** drive → stop → tighten → done. The HUD objective and the QTE prompt read this. */
export type ChainStage = "drive" | "stop" | "tighten" | "done";

export interface ChainupPrompt {
  label: string;
  hint: string;
  progress: number;
}

export interface ChainupEvents {
  fire: (event: string) => void;
  /** The HUD objective, per stage, in Deac's voice. */
  setObjective?: (text: string) => void;
  /** The cockpit QTE prompt; null clears it. */
  prompt?: (p: ChainupPrompt | null) => void;
}

export class ChainupRun {
  mission = false;
  private hold = 0;
  private done = false;
  private dropCd = 0;
  private stage: ChainStage = "drive";
  private objective = "";

  constructor(private pullout: Rect, private ev: ChainupEvents) {}

  /** The tensioner's pin: the 3D pad, the nav marker and the HUD distance all read this. */
  get pin(): Vec2 { return rectCenter(this.pullout); }
  get current(): ChainStage { return this.stage; }
  get holdFraction(): number { return Math.min(1, this.hold / CHAIN_TIGHTEN_S); }
  /** Metres to the pull-out, for the objective line. */
  distanceM(pos: Vec2): number { return dist(pos, this.pin); }

  reset() {
    this.mission = true;
    this.hold = 0;
    this.done = false;
    this.dropCd = 0;
    this.stage = "drive";
    this.objective = "";
  }

  clear() {
    this.mission = false;
    this.ev.prompt?.(null);
  }

  /** Deac, one line per stage, with the distance while it still matters. */
  private say(text: string) {
    if (text === this.objective) return;
    this.objective = text;
    this.ev.setObjective?.(text);
  }

  step(dt: number, s: VehicleSample) {
    if (!this.mission) return;
    if (this.done) return;
    const d = this.distanceM(s.pos);
    const arrived = rectHas(this.pullout, s.pos) || d <= CHAIN_ARRIVE_M;
    const stopped = Math.abs(s.speedMs) <= CHAIN_STOPPED_MS;

    if (!arrived) {
      this.stage = "drive";
      this.hold = 0;
      this.ev.prompt?.(null);
      this.say(`Chain-up is ${Math.max(1, Math.round(d))} m up the grade. Pull in at the sign and stop.`);
      return;
    }

    if (!stopped) {
      this.stage = "stop";
      this.hold = 0;
      this.ev.prompt?.(null);
      this.say("You're in the pull-out. Stop it. Ease off — don't stab it.");
      if (s.brake > CHAIN_STAB_BRAKE && Math.abs(s.speedMs) > CHAIN_STAB_MS) this.drop();
      return;
    }

    this.stage = "tighten";
    this.dropCd = Math.max(0, this.dropCd - dt);
    const revving = s.throttle > CHAIN_DROP_THROTTLE || s.horn;
    if (revving) {
      if (this.dropCd <= 0) this.drop();
      return;
    }

    const braking = s.brake >= CHAIN_BRAKE_MIN && s.throttle < 0.2;
    this.hold = braking ? this.hold + dt : Math.max(0, this.hold - dt * 2);
    this.say("Brake down and hold. Drape, hook, tighten. Don't drop it.");
    this.ev.prompt?.({
      label: "HOLD THE BRAKE",
      hint: "Drape, hook, tighten. Keep the pedal down till it bites.",
      progress: this.holdFraction,
    });

    if (this.hold >= CHAIN_TIGHTEN_S) {
      this.done = true;
      this.stage = "done";
      this.ev.prompt?.(null);
      this.ev.fire("chainup.qte.success");
    }
  }

  private drop() {
    this.dropCd = 4;
    this.hold = 0;
    this.ev.prompt?.(null);
    this.ev.fire("chainup.qte.drop");
  }
}
