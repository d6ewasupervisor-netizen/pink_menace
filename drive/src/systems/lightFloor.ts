/**
 * lightFloor — no scene is ever unlit.
 *
 * The 6.3 report ("the 3D view is fully black while the HUD runs") has a boring
 * version that a phone can produce on its own: a night preset whose ambient and
 * hemisphere values are so low that an unshadowed road, a stopped car and a dark
 * sky are all the same four pixels. The presets in `Lighting.tsx` were tuned as a
 * mood; night + rain is ambient 0.07, hemisphere 0.05, sun 0.03.
 *
 * The floor is a floor, not a new look: it lifts the three scene-wide lights to a
 * minimum that still reads as night, and lets every brighter preset through
 * untouched. Day stays day; night stops being indistinguishable from a black
 * screen.
 */
export interface LightPresetNumbers {
  ambient: number;
  hemi: number;
  sun: number;
}

/**
 * The minimum a scene-wide light may be. Chosen against the drive itself: at
 * 0.14/0.10 a night road is a dark grey with visible markings, which is what the
 * prose calls for, and 0.000 is a black screen.
 */
export const LIGHT_FLOOR: LightPresetNumbers = { ambient: 0.14, hemi: 0.1, sun: 0.06 };

/** Lift a preset to the floor. Values above it are returned unchanged. */
export function withLightFloor(p: LightPresetNumbers): LightPresetNumbers {
  return {
    ambient: Math.max(p.ambient, LIGHT_FLOOR.ambient),
    hemi: Math.max(p.hemi, LIGHT_FLOOR.hemi),
    sun: Math.max(p.sun, LIGHT_FLOOR.sun),
  };
}
