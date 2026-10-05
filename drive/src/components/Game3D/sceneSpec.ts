import type { CardAct } from '@/quietroads';
import { tokens } from './cockpit/tokens';

/**
 * sceneSpec.ts — the per-act "look" table. Each act declares its zone and ego
 * vehicle, and which HUD modules belong. Q1/C hybrid camera + Q3/C hybrid art
 * are driven from here.
 *
 * Owner decision (2026-10-05) — one voice, one interface, one sound set across
 * every act: the accent is campaign-wide (`SCENE_ACCENT`, the Menace pink from
 * the shared design language), every act drives the same cockpit (over-the-hood
 * with the maneuver cam), and the Quiet meter belongs on every playable act —
 * the herd is present everywhere, so its meter is too. Zone and ego stay per-act
 * facts, not per-act interface.
 */
export type DriveView = 'cockpit' | 'quiet'; // cockpit = over-the-hood; quiet = exterior

/** The one accent for every act. CockpitHUD tints the frame and the badge with it. */
export const SCENE_ACCENT: string = tokens.colors.accent;

export interface SceneSpec {
  act: CardAct;
  zone: string;
  /** Which ego vehicle the act uses (informational; the bridge sets the chassis). */
  ego: 'beetle' | 'truck' | 'highway';
  /** Show the Quiet noise meter (the herd is listening — every playable act). */
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
  I:  { act: 'I',   zone: 'The Lot',        ego: 'beetle',  quiet: true, nav: false, maneuverCam: true, driveView: 'cockpit' },
  II: { act: 'II',  zone: 'The Grid',       ego: 'beetle',  quiet: true, nav: true,  maneuverCam: true, driveView: 'cockpit' },
  III:{ act: 'III', zone: 'Central',        ego: 'truck',   quiet: true, nav: true,  maneuverCam: true, driveView: 'cockpit' },
  IV: { act: 'IV',  zone: 'The Core',       ego: 'beetle',  quiet: true, nav: false, maneuverCam: true, driveView: 'cockpit' },
  V:  { act: 'V',   zone: 'The Ribbon',     ego: 'highway', quiet: true, nav: true,  maneuverCam: true, driveView: 'cockpit' },
  VI: { act: 'VI',  zone: 'The Backcountry', ego: 'beetle', quiet: true, nav: true,  maneuverCam: true, driveView: 'cockpit' },
  VII:{ act: 'VII', zone: 'The Dark Hours', ego: 'beetle',  quiet: true, nav: false, maneuverCam: true, driveView: 'cockpit' },
};

export function specForAct(act: CardAct): SceneSpec {
  return SCENE_SPECS[act] ?? SCENE_SPECS.I;
}