/**
 * sceneLight — what time of day a scene actually is.
 *
 * The never-black sweep found the second half of the 6.3 report: entering 6.2 and
 * 6.3 straight from the act select left `timeOfDay` at the store default, `'day'`.
 * Every night behaviour is gated on that value — the two spot lights, the beam on
 * the road, the flares, the sky — so the player pressed LOW on a predawn bridge
 * and the game did nothing at all, because the world it was drawing thought it was
 * midday.
 *
 * The act files already say what time each scene is, in the `background` key the
 * art was shot against (`vantage_bridge_predawn_wind.png`, `i90_straight_dusk.png`).
 * That is the source of truth this table is checked against, and
 * `test/lighting.test.ts` reads the JSON to prove it, so the two cannot drift.
 *
 * Scope: only the scenes whose lighting matters to a mission have an entry. A
 * scene with no entry keeps whatever the store already had (which is how the
 * campaign's day-by-default scenes have always worked).
 *
 * ITEM 5.2 — the two keys that lied about their hour. 7.3's key said
 * `ritzville_beetle_elevators_dusk.png` while its own `location` says
 * `ritzville_lot_morning`, and 8.1's said `i90_spokane_approach_night.png` while its
 * prose says "the gray sky going flat white … a city that is awake now" (AUDIT §16).
 * Nothing in the drive reads those strings, so the lie cost nothing in code and
 * everything in the audit: the scene hour and the art's name disagreed. Both keys are
 * renamed to the hour the story states and both scenes are in this table, so the
 * lighting and the name are the same fact.
 */
export type SceneTimeOfDay = 'day' | 'sunset' | 'night';

export const SCENE_TIME_OF_DAY: Readonly<Record<string, SceneTimeOfDay>> = {
  '1.4': 'night', // Grandma's carport, engine off
  '1.4b': 'day',
  '2.1': 'day',
  '6.2': 'sunset', // i90_straight_dusk
  '6.3': 'night', // vantage_bridge_predawn_wind
  '7.3': 'day', // ritzville_lot_morning — the lot behind the trading post
  '8.1': 'day', // "the gray sky going flat white" — flat-white midday, not night
};

/** The time a scene starts at, or the time the store already had. */
export function timeOfDayForScene(sceneId: string, current: SceneTimeOfDay): SceneTimeOfDay {
  return SCENE_TIME_OF_DAY[sceneId] ?? current;
}
