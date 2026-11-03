/**
 * waitWatch — the two clocks that stop a story wait from stranding the player.
 *
 * A `wait` node only resumes when an event arrives. Every other kind of story
 * node is either on screen or has a surface the player can act on; a wait is
 * invisible, so an event nothing emits is an unrecoverable dead end — 5.3 sat
 * on `cutscene.summit_clear` forever with the car parked and the cockpit (rightly)
 * hidden, and every reload resumed into the same trap.
 *
 * Two rules, in order:
 *
 *  1. CUTSCENE — a `cutscene.*` mark is a direction beat, not a sim grade. When
 *     no mission owns the wait and no compound surface is open, the direction
 *     line is the whole beat, so the wait resolves after `CUTSCENE_WAIT_S`. A
 *     mission that *does* own the mark answers it first (`Simulation.onStoryWait`),
 *     so 8.2's Spokane cutscene keeps its gate exactly as it was.
 *  2. STRANDED — anything else that has waited `STRANDED_WAIT_S` with no mission
 *     and no surface is a bug, not a beat. The bridge names it on the console and
 *     offers a Continue control that fires the awaited event, so a player can
 *     always get out of a blank screen.
 *
 * The clock holds while the game is paused, the tab is hidden or a card/quiz/
 * choice is open — a player reading a card is not a deadlock — and it restarts
 * when the wait changes, because a new wait is a new beat.
 */

/** Every event this rule may answer by itself. */
export const CUTSCENE_EVENT_PREFIX = "cutscene.";

/** A cutscene direction reads after a short beat. */
export const CUTSCENE_WAIT_S = 2.5;

/** Past this, a wait with no mission behind it is stranded. */
export const STRANDED_WAIT_S = 8;

export function isCutsceneWait(waitFor: string | null | undefined): boolean {
  return typeof waitFor === "string" && waitFor.startsWith(CUTSCENE_EVENT_PREFIX);
}

export interface WaitWatchContext {
  /** The node's `wait_for`, or null when the runner is not waiting. */
  waitFor: string | null;
  /** A mission this scene started is running (qrHud.missionActive). */
  missionActive: boolean;
  /** A card / quiz / debrief / dialogue choice owns the screen. */
  compoundOpen: boolean;
  /** The player paused, or the tab is hidden: the clock holds where it is. */
  paused: boolean;
}

export type WaitSignal =
  | { kind: "cutscene"; event: string; waitedS: number }
  | { kind: "stranded"; event: string; waitedS: number };

export class WaitWatch {
  private key: string | null = null;
  private seconds = 0;
  private cutsceneFired = false;
  private strandedFired = false;

  /** How long the current wait has stood, for the console/telemetry. */
  get waitedS(): number {
    return this.seconds;
  }
  get event(): string | null {
    return this.key;
  }

  reset(): void {
    this.key = null;
    this.seconds = 0;
    this.cutsceneFired = false;
    this.strandedFired = false;
  }

  /**
   * Feed one frame. Returns the signal the bridge should act on at most once per
   * wait, or null while the beat is still legitimately waiting.
   */
  tick(dt: number, ctx: WaitWatchContext): WaitSignal | null {
    if (!ctx.waitFor) {
      this.reset();
      return null;
    }
    if (ctx.waitFor !== this.key) {
      this.key = ctx.waitFor;
      this.seconds = 0;
      this.cutsceneFired = false;
      this.strandedFired = false;
    }
    // Paused, hidden or a surface: the clock holds, it does not restart.
    if (ctx.paused || ctx.compoundOpen) return null;
    this.seconds += Math.max(0, dt);

    if (isCutsceneWait(this.key) && !ctx.missionActive && !this.cutsceneFired && this.seconds >= CUTSCENE_WAIT_S) {
      this.cutsceneFired = true;
      return { kind: "cutscene", event: this.key, waitedS: this.seconds };
    }
    if (!ctx.missionActive && !this.strandedFired && this.seconds >= STRANDED_WAIT_S) {
      this.strandedFired = true;
      return { kind: "stranded", event: this.key, waitedS: this.seconds };
    }
    return null;
  }
}
