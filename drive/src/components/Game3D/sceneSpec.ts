import type { CardAct } from '@/quietroads';

/**
 * sceneSpec.ts — the per-act "look" table. Each act declares its cockpit view,
 * ego vehicle, accent colour, and which HUD modules belong, so the drive can
 * feel like a different scene per portion instead of one rectangle. Q1/C hybrid
 * camera + Q3/C hybrid art are driven from here.
 */
export type DriveView = 'cockpit' | 'quiet'; // cockpit = over-the-hood; quiet = exterior

export interface SceneSpec {
  act: CardAct;
  zone: string;
  /** Which ego vehicle the act uses (informational; the bridge sets the chassis). */
  ego: 'beetle' | 'truck' | 'highway';
  /** Cockpit frame accent for this act (Q3 block-in colour). */
  accent: string;
  /** Show the Quiet noise meter (the herd is listening). */
  quiet: boolean;
  /** Show the nav cluster. */
  nav: boolean;
  /** Pull back to an exterior cam at low speed (parking / backing / chain-up). */
  maneuverCam: boolean;
  /** Default over-the-wheel view when at speed. */
  driveView: DriveView;
  /** Scenic still used behind dialogue/read moments (Q3 hybrid art). */
  backdrop?: string;
}

export const SCENE_SPECS: Record<CardAct, SceneSpec> = {
  I:  { act: 'I',   zone: 'The Lot',        ego: 'beetle',  accent: '#c45a68', quiet: true,  nav: false, maneuverCam: true,  driveView: 'cockpit' },
  II: { act: 'II',  zone: 'The Grid',       ego: 'beetle',  accent: '#c45a68', quiet: true,  nav: true,  maneuverCam: true,  driveView: 'cockpit' },
  III:{ act: 'III', zone: 'Central',        ego: 'truck',   accent: '#d98a2e', quiet: false, nav: true,  maneuverCam: true,  driveView: 'cockpit' },
  IV: { act: 'IV',  zone: 'The Core',       ego: 'beetle',  accent: '#3ef0ff', quiet: false, nav: false, maneuverCam: false, driveView: 'quiet' },
  V:  { act: 'V',   zone: 'The Ribbon',     ego: 'highway', accent: '#9a3d4d', quiet: true,  nav: true,  maneuverCam: true,  driveView: 'cockpit' },
  VI: { act: 'VI',  zone: 'The Backcountry', ego: 'beetle', accent: '#6a9a5a', quiet: true,  nav: true,  maneuverCam: true,  driveView: 'cockpit' },
  VII:{ act: 'VII', zone: 'The Dark Hours', ego: 'beetle',  accent: '#5a5a7a', quiet: false, nav: false, maneuverCam: false, driveView: 'quiet' },
};

export function specForAct(act: CardAct): SceneSpec {
  return SCENE_SPECS[act] ?? SCENE_SPECS.I;
}