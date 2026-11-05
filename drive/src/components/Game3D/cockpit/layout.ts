/**
 * cockpit/layout — the one grid the cockpit is built on.
 *
 * Three stacked bands, named once, read by every overlay:
 *
 *   top    HUD: pause, act badge, noise meter, TP, the nav cluster + objective
 *   body   the 3D view, the card still, the QTE prompt, the lights/horn rail
 *   bottom dialogue, the card dock, the touch sticks, toasts
 *
 * Why: on a phone the old stack placed each surface by its own magic number, so
 * the horn/lights buttons sat under the dialogue box and the card's still was
 * painted full-bleed behind the dock. Measured before the fix (headed Chromium,
 * 390x844): the horn button (310,684 64x64) overlapped both the dialogue box and
 * its first option, and the card still box was the whole 390x844 viewport with
 * every option under the dock's scroll.
 *
 * `compound` is the card/dialogue/quiz state: the driving HUD (meter, TP, nav
 * cluster) stands down so the still and the words own the screen, and only the
 * pause control and the act badge stay in a thin top band.
 */
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { compoundOpen, showDrivingHud, type CockpitState } from '@/quietroads/cockpit';

/** Three cockpit shapes. Desktop is its own frame: wide and shallow. */
export type CockpitOrientation = 'portrait' | 'landscape' | 'desktop';

export function cockpitOrientationFor(w: number, h: number): CockpitOrientation {
  if (w >= 1024) return 'desktop';
  return h >= w ? 'portrait' : 'landscape';
}

/** The frame's shape, reacting to resize/orientation the way tokens.useOrientation does. */
export function useCockpitOrientation(): CockpitOrientation {
  const [o, setO] = useState<CockpitOrientation>(() =>
    typeof window === 'undefined' ? 'desktop' : cockpitOrientationFor(window.innerWidth, window.innerHeight),
  );
  useEffect(() => {
    const check = () => setO(cockpitOrientationFor(window.innerWidth, window.innerHeight));
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  return o;
}

export interface CockpitFrame {
  /** px from the safe-area top to the bottom of the HUD band. */
  top: number;
  /** fraction of the viewport height owned by the bottom band. */
  bottom: number;
  /** the touch-stick strip, at the foot of the bottom band (0 = no sticks). */
  sticks: number;
}

/** Driving: the whole cockpit is awake. */
export const COCKPIT_FRAME: Record<CockpitOrientation, CockpitFrame> = {
  portrait: { top: 224, bottom: 0.52, sticks: 176 },
  landscape: { top: 176, bottom: 0.5, sticks: 176 },
  desktop: { top: 224, bottom: 0.44, sticks: 176 },
};

/** Compound (card / dialogue / quiz / debrief): the driving HUD stands down. */
export const COMPOUND_FRAME: Record<CockpitOrientation, CockpitFrame> = {
  portrait: { top: 76, bottom: 0.5, sticks: 176 },
  landscape: { top: 76, bottom: 0.56, sticks: 176 },
  desktop: { top: 76, bottom: 0.46, sticks: 176 },
};

export function frameFor(orientation: CockpitOrientation, compound = false): CockpitFrame {
  return compound ? COMPOUND_FRAME[orientation] : COCKPIT_FRAME[orientation];
}

const SAFE_TOP = 'env(safe-area-inset-top, 0px)';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

/** The top band: everything the HUD clusters into. */
export function zoneTop(frame: CockpitFrame): CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: `calc(${frame.top}px + ${SAFE_TOP})`,
    paddingTop: SAFE_TOP,
  };
}

/** The bottom band: dialogue, dock, sticks. Anchored to the foot of the screen. */
export function zoneBottom(frame: CockpitFrame): CSSProperties {
  return {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: `calc(${Math.round(frame.bottom * 100)}dvh + ${SAFE_BOTTOM})`,
    paddingBottom: SAFE_BOTTOM,
  };
}

/** The middle: the 3D view, the card still, a QTE prompt. */
export function zoneBody(frame: CockpitFrame): CSSProperties {
  return {
    position: 'fixed',
    left: 0,
    right: 0,
    top: `calc(${frame.top}px + ${SAFE_TOP})`,
    bottom: `calc(${Math.round(frame.bottom * 100)}dvh + ${SAFE_BOTTOM})`,
  };
}

/** The highest the dialogue box may grow. Portrait sits above the sticks; in
 *  landscape the box runs from the top band down (the sticks are beside it). */
export function dialogueMaxHeight(frame: CockpitFrame, viewportHeight: number, orientation: CockpitOrientation): number {
  const h = orientation === 'landscape'
    ? viewportHeight - frame.top - 16
    : Math.round(viewportHeight * frame.bottom) - frame.sticks - 16;
  return Math.max(120, h);
}

/**
 * The QTE prompt owns the screen below the HUD and above the sticks: no card, no
 * dock and no dialogue is up while a gesture is live, so it can use the whole
 * middle. Landscape has no room between the bands (390 - 176 - 195 = 19 px), so
 * the prompt band runs from the top band to the bottom edge.
 */
export function qteBand(frame: CockpitFrame): CSSProperties {
  return {
    position: 'fixed',
    left: 0,
    right: 0,
    top: `calc(${frame.top}px + ${SAFE_TOP})`,
    bottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}

/**
 * True while a full-screen surface owns the cockpit (card, quiz, debrief). The
 * driving HUD — noise meter, TP, nav cluster, lights/horn — stands down so the
 * still and the words get the body band. A spoken line is NOT compound: the
 * dialogue lives in the bottom band and the HUD in the top band, so bands are
 * what keep them apart, not hiding.
 */
export function useCompoundCockpit(): boolean {
  const quizActive = useGameStore((s) => s.quizActive);
  const card = useQRHud((s) => s.card);
  const debrief = useQRHud((s) => s.debrief);
  const choices = useQRHud((s) => s.choices);
  // A choice is a decision moment like a card: the player needs the screen for
  // the options, so the driving HUD stands down. A spoken line does not.
  return compoundOpen({
    cardOpen: Boolean(card),
    choiceOpen: Boolean(choices),
    debriefOpen: Boolean(debrief),
    quizOpen: Boolean(quizActive),
  });
}

/** Everything the rule reads, straight from the stores. */
export function readCockpitState(): CockpitState {
  const g = useGameStore.getState();
  const h = useQRHud.getState();
  return {
    phase: g.phase,
    missionActive: h.missionActive,
    cardOpen: Boolean(h.card),
    choiceOpen: Boolean(h.choices),
    debriefOpen: Boolean(h.debrief),
    quizOpen: Boolean(g.quizActive),
    storyOnScreen: Boolean(h.line || h.direction),
  };
}

/**
 * The driving cockpit's one derived answer: sticks, dash and noise meter are up
 * whenever a mission owns the car and no card / quiz / debrief / choice is open —
 * however the last card closed. See quietroads/cockpit.ts for the rule itself.
 */
export function useDrivingHud(): boolean {
  const phase = useGameStore((s) => s.phase);
  const quizActive = useGameStore((s) => s.quizActive);
  const missionActive = useQRHud((s) => s.missionActive);
  const card = useQRHud((s) => s.card);
  const debrief = useQRHud((s) => s.debrief);
  const choices = useQRHud((s) => s.choices);
  return showDrivingHud({
    phase,
    missionActive,
    cardOpen: Boolean(card),
    choiceOpen: Boolean(choices),
    debriefOpen: Boolean(debrief),
    quizOpen: Boolean(quizActive),
  });
}
