/**
 * visibility — the two numbers that decide whether the road is there at night.
 *
 * Two device reports met here. In 6.3 the 3D view was black while the HUD ran, so
 * the first question is "is the road drawn, and is any light on it"; and the
 * mobile tier is the one place fog density and a camera far plane can quietly
 * swallow a road that is perfectly lit.
 *
 * `FogExp2` (what the sky uses) attenuates as `exp(-(density x metres)^2)`. Both
 * halves are pure so the claims can be measured in node instead of argued about:
 *
 *   - `fogTransmittance(density, metres)` — how much of a point survives the fog;
 *   - `fogDensityFor(weather)` — the density the sky may use, clamped so the road
 *     a player is looking at (80 m, a 45 mph stopping distance plus margin) keeps
 *     at least `MIN_ROAD_TRANSMITTANCE` of itself.
 *
 * It is deliberately independent of the tier: cheap tiers drop shadows, bloom and
 * props, never the road in front of the car.
 */

/** The distance a phone player can see down the road and still act. */
export const ROAD_SIGHT_M = 80;

/** How much of the road at `ROAD_SIGHT_M` must survive the fog. */
export const MIN_ROAD_TRANSMITTANCE = 0.85;

export type FogWeather = 'clear' | 'overcast' | 'rain';

/** The artist's densities, before the visibility floor is applied. */
const BASE_DENSITY: Record<FogWeather, number> = {
  clear: 0.0008,
  overcast: 0.002,
  rain: 0.0035,
};

/**
 * Transmittance of a point `metres` away through `FogExp2` of this density.
 * 1 = untouched, 0 = fully fogged.
 */
export function fogTransmittance(density: number, metres: number): number {
  if (!Number.isFinite(density) || density <= 0) return 1;
  const d = Math.max(0, metres) * density;
  return Math.exp(-(d * d));
}

/**
 * The largest density that still leaves `MIN_ROAD_TRANSMITTANCE` at
 * `ROAD_SIGHT_M`. `exp(-(d*s)^2) = t` ⇒ `d = sqrt(-ln t) / s`.
 */
export const MAX_FOG_DENSITY = Math.sqrt(-Math.log(MIN_ROAD_TRANSMITTANCE)) / ROAD_SIGHT_M;

/** The density the scene may use for this weather — never more than the floor allows. */
export function fogDensityFor(weather: FogWeather): number {
  return Math.min(BASE_DENSITY[weather] ?? BASE_DENSITY.clear, MAX_FOG_DENSITY);
}
