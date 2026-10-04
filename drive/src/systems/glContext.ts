/**
 * P3 — WebGL context-loss edges, as a pure function.
 *
 * The rules (the browser fires webglcontextlost more than once, and the phase
 * it lands in is not always "driving"):
 *
 *   1. A loss during driving / walking / dialogue / card pauses the game and
 *      records what phase to come back to.
 *   2. A SECOND loss while already paused for loss must NOT overwrite
 *      prePausePhase — otherwise the first "driving" is lost and Resume drops
 *      the player into a dialogue they left.
 *   3. A loss during menu / quiz / an already-paused game changes nothing at all.
 *   4. Restore re-applies the current tier's pixel ratio and clears the toast.
 *      It never auto-unpauses — the player chooses.
 */

export interface LossState {
  phase: string;
  prePausePhase: string;
  /** True once a loss has paused the game; a second loss must not re-pause. */
  lostWhilePaused: boolean;
}

export interface LossDecision {
  phase: string;
  prePausePhase: string;
  /** Did this loss actually pause the game? */
  paused: boolean;
}

/** The phases a context loss is allowed to pause out of. */
export const LOSS_PAUSE_PHASES = ['driving', 'walking', 'dialogue', 'card'] as const;

/**
 * Decide what a `webglcontextlost` event does to the game state.
 * Pure: same input, same decision, no store touched.
 */
export function onContextLost(state: LossState): LossDecision {
  const pausable = (LOSS_PAUSE_PHASES as readonly string[]).includes(state.phase);

  // Rule 2: already paused *because of a loss* — do not touch prePausePhase.
  if (state.lostWhilePaused) {
    return { phase: state.phase, prePausePhase: state.prePausePhase, paused: false };
  }
  // Rule 3: menu, quiz, or a pause the player already chose.
  if (!pausable) {
    return { phase: state.phase, prePausePhase: state.prePausePhase, paused: false };
  }
  return { phase: 'paused', prePausePhase: state.phase, paused: true };
}

export interface RestoreDecision {
  /** The pixel ratio the tier wants back — the browser resets it on restore. */
  pixelRatio: number;
  /** Clear the "Graphics paused" toast. */
  clearToast: boolean;
  /** Always false: a restore must never auto-unpause. */
  autoResume: false;
}

/** What a `webglcontextrestored` event does. Never unpauses. */
export function onContextRestored(currentDpr: number): RestoreDecision {
  return { pixelRatio: currentDpr, clearToast: true, autoResume: false };
}