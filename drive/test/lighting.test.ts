/**
 * lighting — the two ways a lit scene still looks black.
 *
 * 6.3 (Vantage Bridge, night) reported a fully black 3D view with the HUD running
 * and a LOW button that changed nothing. The physics of that are measurable even
 * without the phone:
 *
 *   - if the scene-wide lights are effectively off, nothing lit and nothing
 *     unlit look different (the presets, and the floor that stops it);
 *   - if the fog is dense enough, the road 80 m ahead is fog colour no matter how
 *     bright the headlights are (the fog ceiling, and the transmittance it keeps);
 *   - if LOW and HIGH are the same light, the button is a label (the spot's own
 *     numbers).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SCENE_TIME_OF_DAY, timeOfDayForScene } from '../src/quietroads/sceneLight';
import { LIGHT_FLOOR, withLightFloor } from '../src/systems/lightFloor';
import {
  MAX_FOG_DENSITY,
  MIN_ROAD_TRANSMITTANCE,
  ROAD_SIGHT_M,
  fogDensityFor,
  fogTransmittance,
} from '../src/systems/visibility';
import { headlightReachM, headlightSpot, headlightWidthM, nextHeadlight } from '../src/systems/headlights';

describe('the light floor', () => {
  // The night + rain row of Lighting.tsx's PRESETS — the darkest the game gets.
  const nightRain = { ambient: 0.07, hemi: 0.05, sun: 0.03 };

  it('lifts the darkest preset to something a screen can show', () => {
    const floored = withLightFloor(nightRain);
    expect(floored.ambient).toBe(LIGHT_FLOOR.ambient);
    expect(floored.hemi).toBe(LIGHT_FLOOR.hemi);
    expect(floored.sun).toBe(LIGHT_FLOOR.sun);
    // Nothing at zero: a zero light is a black scene with extra steps.
    for (const v of Object.values(floored)) expect(v).toBeGreaterThan(0);
  });

  it('leaves every brighter preset exactly as it was', () => {
    const dayClear = { ambient: 0.6, hemi: 0.3, sun: 2.0 };
    expect(withLightFloor(dayClear)).toEqual(dayClear);
    const sunsetClear = { ambient: 0.25, hemi: 0.2, sun: 0.8 };
    expect(withLightFloor(sunsetClear)).toEqual(sunsetClear);
  });
});

describe('the fog ceiling', () => {
  it('keeps 85 % of the road at 80 m in every weather', () => {
    for (const weather of ['clear', 'overcast', 'rain'] as const) {
      const t = fogTransmittance(fogDensityFor(weather), ROAD_SIGHT_M);
      expect(t, weather).toBeGreaterThanOrEqual(MIN_ROAD_TRANSMITTANCE);
    }
  });

  it('is a real ceiling — a denser fog would fail the same measurement', () => {
    // Twice the allowed density: the road at 80 m is no longer reliably visible,
    // which is what makes the assertion above able to fail.
    expect(fogTransmittance(MAX_FOG_DENSITY * 2, ROAD_SIGHT_M)).toBeLessThan(MIN_ROAD_TRANSMITTANCE);
    expect(fogDensityFor('rain')).toBeLessThanOrEqual(MAX_FOG_DENSITY);
  });

  it('does not fog what is close to the car', () => {
    expect(fogTransmittance(MAX_FOG_DENSITY, 10)).toBeGreaterThan(0.99);
  });
});

describe('the scene hour matches the art the act files name', () => {
  // The `background` key is what the art was shot against, so it is the honest
  // source for "is this scene at night". The sweep that found the bug measured
  // `timeOfDay=day` on 6.3 (a predawn bridge), where every night gate is off.
  function backgrounds(): Record<string, string> {
    const dir = path.resolve(__dirname, '..', 'src', 'quietroads', 'data');
    const found: Record<string, string> = {};
    for (const file of fs.readdirSync(dir).filter((f) => f.startsWith('dialogue_act') && f.endsWith('.json'))) {
      const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as {
        scenes?: Record<string, { background?: string }>;
      };
      for (const [id, scene] of Object.entries(json.scenes ?? {})) {
        if (scene.background) found[id] = scene.background;
      }
    }
    return found;
  }

  it('names a real scene, and the key agrees with the table', () => {
    const bg = backgrounds();
    for (const [id, time] of Object.entries(SCENE_TIME_OF_DAY)) {
      const key = bg[id];
      expect(key, `${id} has a background key`).toBeTruthy();
      if (time === 'night') expect(key, `${id} is night`).toMatch(/night|predawn|dark/i);
      if (time === 'sunset') expect(key, `${id} is dusk`).toMatch(/dusk|sunset|dawn/i);
      // A daylight scene's key need not name the hour (`pharmacy_board.png`), but
      // it must not claim to be a night scene.
      if (time === 'day') expect(key, `${id} is not a night key`).not.toMatch(/night|predawn|dusk/i);
    }
  });

  it('6.2 and 6.3 are not day — the two scenes whose LOW button did nothing', () => {
    expect(timeOfDayForScene('6.2', 'day')).toBe('sunset');
    expect(timeOfDayForScene('6.3', 'day')).toBe('night');
    // A scene with no entry keeps whatever the store had.
    expect(timeOfDayForScene('2.4', 'day')).toBe('day');
    expect(timeOfDayForScene('nowhere', 'sunset')).toBe('sunset');
  });
});

describe('headlights', () => {
  it('LOW and HIGH are different lights', () => {
    const low = headlightSpot('low', true);
    const high = headlightSpot('high', true);
    expect(low.intensity).toBeGreaterThan(0);
    expect(high.intensity).toBeGreaterThan(low.intensity);
    expect(high.distance).toBeGreaterThan(low.distance);
    // A tight cone reaches; a wide one shows the verge — the shapes differ too.
    expect(high.angle).toBeLessThan(low.angle);
  });

  it('OFF is off, day is not night-bright, and the stalk cycles', () => {
    expect(headlightSpot('off', true).intensity).toBe(0);
    expect(headlightSpot('off', false).intensity).toBe(0);
    expect(headlightSpot('low', false).intensity).toBeLessThan(headlightSpot('low', true).intensity);
    expect(nextHeadlight('off')).toBe('low');
    expect(nextHeadlight('low')).toBe('high');
    expect(nextHeadlight('high')).toBe('off');
  });

  it('the beam reach and width agree with the spot', () => {
    expect(headlightReachM('off')).toBe(0);
    expect(headlightReachM('low')).toBeLessThan(headlightReachM('high'));
    expect(headlightReachM('high', true)).toBeGreaterThan(headlightReachM('high'));
    expect(headlightWidthM('high')).toBeGreaterThan(headlightWidthM('low'));
  });
});
