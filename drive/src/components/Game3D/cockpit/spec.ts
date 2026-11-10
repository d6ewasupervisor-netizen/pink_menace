/**
 * cockpit/spec — the portrait cockpit's budgets, as arithmetic.
 *
 * The layout used to be a `COCKPIT_FRAME` table of three hand-tuned numbers plus
 * every component's own `position: fixed` and its own magic offset: the nav cluster
 * at 104 px, the meter at 6, the badge at 66, the lights at 230… and the result was
 * measured in `docs/cockpit/BEFORE.md` — **world band 216 px (26 %) at 390x844**,
 * overlay coverage 39 %, 140 px sticks, and the WIND ASSIST chip sitting on the act
 * badge. Nothing owned the sum.
 *
 * This file owns the sum. It answers one question — *where is each band, given a
 * viewport and the safe-area insets* — and every HUD component positions itself
 * from the answer. Pure: no React, no DOM, no window. `test/cockpit-spec.test.ts`
 * pins it at the five shipped shapes, and `e2e/cockpit-bands.spec.ts` measures the
 * real DOM against it.
 *
 * THE BUDGETS (from the rebuild's target layout):
 *
 *   top rail    48   pause · act chip · TP — nothing else
 *   noise bar    6   dB / "3 looking", fades in on change only
 *   nav strip   56   "0.4 mi · Vantage Bridge", speed/limit, assist tag
 *   objective   40   the current instruction; hides ~6 s after it changes
 *   controls   ≥150  (22 % of the height) sticks 110–120 px in the corners, the
 *                    lights/horn pair 44 px above the right stick
 *   world      the rest — ≥ 55 % of a portrait viewport, which is the whole point
 *
 * Landscape merges the rail and the nav strip into one 48 px row (there is no room
 * for two), and desktop lays the same stack in a centred 520 px column.
 */

export type CockpitShape = 'portrait' | 'landscape' | 'desktop';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** What the browser says the safe area is; zeros where `env()` is unsupported. */
export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export interface Band {
  /** px from the top of the viewport (safe-area top already added). */
  y: number;
  height: number;
  /** px from the left (safe-area left already added). */
  x: number;
  width: number;
}

export interface CockpitSpec {
  shape: CockpitShape;
  width: number;
  height: number;
  insets: Insets;
  /** The centred column every band is laid inside (desktop caps it at 520). */
  column: { x: number; width: number };
  rail: Band;
  noise: Band;
  nav: Band;
  objective: Band;
  /** The world: from the bottom of the nav/objective stack to the controls. */
  world: Band;
  controls: Band;
  /** The stick ring's diameter: 110–120 px, and it never eats the whole corner. */
  stick: number;
  /** LOW/HIGH and HORN: 44 px, and they sit above the right stick. */
  button: number;
  /** The dialogue box: the bottom of the world band, 2 lines, glass. */
  dialogue: { bottom: number; maxHeight: number; lines: number };
}

export const BUDGET = {
  rail: 48,
  noise: 6,
  nav: 56,
  objective: 40,
  /** Landscape: rail and nav become one row of this height. */
  railLandscape: 48,
  controlsMin: 150,
  controlsFraction: 0.22,
  stickMin: 110,
  stickMax: 120,
  button: 44,
  columnMax: 520,
  /** Two lines of 16 px dialogue plus its padding. */
  dialogueMax: 96,
} as const;

export function shapeFor(width: number, height: number): CockpitShape {
  if (width >= 1024) return 'desktop';
  return height >= width ? 'portrait' : 'landscape';
}

/** The stick diameter for a viewport: 110–120 px, and never more than 30 % of the width. */
export function stickFor(width: number): number {
  const byWidth = Math.round(width * 0.3);
  return Math.max(BUDGET.stickMin, Math.min(BUDGET.stickMax, byWidth));
}

/**
 * The whole cockpit for a viewport. Pure, so the same numbers drive the components,
 * the unit test and the e2e's own comparison.
 *
 * Portrait / desktop stack: rail → noise → nav → objective → world → controls.
 * Landscape merges rail+nav into one 48 px row and keeps the noise bar under it, so
 * the world keeps as much of a 390 px height as it can.
 */
export function cockpitSpec(
  width: number,
  height: number,
  insets: Insets = NO_INSETS,
): CockpitSpec {
  const shape = shapeFor(width, height);
  const columnWidth = shape === 'desktop' ? Math.min(BUDGET.columnMax, width) : width;
  const columnX = Math.round((width - columnWidth) / 2);
  const x = columnX + insets.left;
  const w = Math.max(1, columnWidth - insets.left - insets.right);

  const controlsHeight = Math.max(BUDGET.controlsMin, Math.round(height * BUDGET.controlsFraction));
  const stick = stickFor(width);

  let railH: number;
  let noiseH: number;
  let navH: number;
  let objectiveH: number;

  if (shape === 'landscape') {
    // One row carries the pause, the act chip, TP and the next manoeuvre; the noise
    // bar is the only thing under it. The objective rides with the nav text.
    railH = BUDGET.railLandscape;
    noiseH = BUDGET.noise;
    navH = 0;
    objectiveH = 0;
  } else {
    railH = BUDGET.rail;
    noiseH = BUDGET.noise;
    navH = BUDGET.nav;
    objectiveH = BUDGET.objective;
  }

  const top = insets.top;
  const rail: Band = { y: top, height: railH, x, width: w };
  const noise: Band = { y: rail.y + rail.height, height: noiseH, x, width: w };
  const nav: Band = { y: noise.y + noise.height, height: navH, x, width: w };
  const objective: Band = { y: nav.y + nav.height, height: objectiveH, x, width: w };

  const controlsTop = height - insets.bottom - controlsHeight;
  const controls: Band = { y: controlsTop, height: controlsHeight, x, width: w };

  const worldTop = objective.y + objective.height;
  const worldHeight = Math.max(0, controlsTop - worldTop);
  const world: Band = { y: worldTop, height: worldHeight, x, width: w };

  return {
    shape,
    width,
    height,
    insets,
    column: { x: columnX, width: columnWidth },
    rail,
    noise,
    nav,
    objective,
    world,
    controls,
    stick,
    button: BUDGET.button,
    dialogue: {
      // The dialogue sits at the foot of the world band, above the controls.
      bottom: height - insets.bottom - controlsHeight,
      maxHeight: Math.min(BUDGET.dialogueMax, Math.max(64, Math.round(worldHeight * 0.3))),
      lines: 2,
    },
  };
}

/** The world band as a fraction of the viewport height (the portrait promise is ≥ 0.55). */
export function worldFraction(spec: CockpitSpec): number {
  return spec.height > 0 ? spec.world.height / spec.height : 0;
}

/**
 * Where a corner control goes: the sticks hug the bottom corners of the control
 * band, inset by 12 px and the safe area. `side` is which corner.
 */
export function stickOrigin(spec: CockpitSpec, side: 'left' | 'right'): { x: number; y: number; size: number } {
  const pad = 12;
  const y = spec.controls.y + spec.controls.height - spec.stick - pad;
  const x = side === 'left' ? spec.controls.x + pad : spec.controls.x + spec.controls.width - spec.stick - pad;
  return { x: Math.round(x), y: Math.round(y), size: spec.stick };
}

/**
 * The lights/horn pair: 44 px buttons for the thumb that is already on the right
 * stick. They used to live in the body band at `bottom: 312px` in portrait — measured
 * 52×52 at (12,230), under the nav panel and on the far side of the screen from the
 * hand that uses them.
 *
 * Above the stick where the band has room for them (portrait: 117 + 8 + 44 + 12 = 181
 * of a 186 px band), and beside it where it does not (landscape: the 150 px band has
 * no 181 to give). Either way they stay inside the control band and never touch the
 * world, the dialogue or the nav.
 */
export function buttonOrigin(spec: CockpitSpec, index: 0 | 1): { x: number; y: number; size: number } {
  const pad = 12;
  const gap = 8;
  const right = stickOrigin(spec, 'right');
  const size = spec.button;
  const above = right.y - gap - size;
  // index 0 is the one nearest the stick (headlights, then horn to its left).
  if (above >= spec.controls.y + 4) {
    const x = right.x + right.size - size - index * (size + gap);
    return { x: Math.round(Math.max(spec.controls.x + pad, x)), y: Math.round(above), size };
  }
  const x = right.x - gap - size - index * (size + gap);
  const y = right.y + Math.round((right.size - size) / 2);
  return { x: Math.round(Math.max(spec.controls.x + pad, x)), y: Math.round(y), size };
}

