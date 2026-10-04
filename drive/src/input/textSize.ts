/**
 * P12 — text size. Three steps, persisted, applied to dialogue, card and HUD
 * type. It scales TYPE ONLY: the 3D world is never scaled, and no layout
 * geometry outside the HTML overlay layer reads it.
 */

export type TextSize = 0 | 1 | 2;

export const TEXT_SIZES: TextSize[] = [0, 1, 2];

/** The three multipliers. Standard is 1 — the current build's size. */
export const TEXT_SCALE: Record<TextSize, number> = { 0: 1, 1: 1.15, 2: 1.3 };

/** Labels for the pause-menu row. */
export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  0: 'Standard',
  1: 'Large',
  2: 'Largest',
};

/** Step up, wrapping back to standard at the top. */
export function nextTextSize(current: TextSize): TextSize {
  const i = TEXT_SIZES.indexOf(current);
  return TEXT_SIZES[(i + 1) % TEXT_SIZES.length];
}

/** Clamp anything (including a stale save) to a real step. */
export function normalizeTextSize(raw: unknown): TextSize {
  const n = Number(raw);
  return n === 1 || n === 2 ? (n as TextSize) : 0;
}

/** The CSS custom property the overlay reads. */
export const TEXT_SCALE_VAR = '--qr-text-scale';

/**
 * Style fragment for an overlay subtree: sets the scale variable once at the
 * root, so every `fontSize: calc(... * var(--qr-text-scale))` inside follows.
 */
export function textScaleStyle(current: TextSize): Record<string, string> {
  return { [TEXT_SCALE_VAR]: String(TEXT_SCALE[current]) };
}

/** Scale a px font size by the current step (the value is read from CSS, not JS). */
export function scaledPx(px: number, _current?: TextSize): string {
  return `calc(${px}px * var(${TEXT_SCALE_VAR}, 1))`;
}