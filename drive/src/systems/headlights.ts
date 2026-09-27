/** Player headlight control. Off, low, and high are the whole stalk. */
export type HeadlightBeam = 'off' | 'low' | 'high';

const ORDER: HeadlightBeam[] = ['off', 'low', 'high'];

export function nextHeadlight(current: HeadlightBeam): HeadlightBeam {
  const i = ORDER.indexOf(current);
  return ORDER[(i + 1) % ORDER.length];
}

/**
 * Metres of road the beam is supposed to show.
 * High beams clear a 55 mph stop (~75 m) and run out before a 70 mph stop (~108 m).
 * Tuna's LEDs reach farther and still fall short of that 70 mph stop.
 */
export function headlightReachM(beam: HeadlightBeam, led = false): number {
  if (beam === 'off') return 0;
  if (beam === 'low') return 42;
  return led ? 102 : 88;
}

export function headlightWidthM(beam: HeadlightBeam): number {
  if (beam === 'high') return 14;
  if (beam === 'low') return 8;
  return 0;
}

/**
 * Spot settings in the same intensity scale as the sun (about 2).
 * Decay 1 fades along the road so the path brightens without a flat wash.
 */
export function headlightSpot(beam: HeadlightBeam, night: boolean) {
  if (!night || beam === 'off') {
    return { intensity: beam === 'off' ? 0 : 1.5, distance: 16, decay: 2, angle: 0.5, penumbra: 0.6 };
  }
  if (beam === 'high') {
    return { intensity: 36, distance: 130, decay: 1, angle: 0.4, penumbra: 0.55 };
  }
  return { intensity: 20, distance: 60, decay: 1, angle: 0.62, penumbra: 0.65 };
}
