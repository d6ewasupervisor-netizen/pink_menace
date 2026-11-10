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
import { cockpitSpec, NO_INSETS, type CockpitSpec, type Insets } from './spec';

/**
 * The safe-area insets, measured.
 *
 * `env(safe-area-inset-*)` is only readable through a computed style, so this mounts
 * a zero-size probe once, reads its four paddings, and takes it away again. Zeros are
 * the honest answer where the browser has no notion of a notch.
 */
export function readSafeInsets(doc: Document | undefined = typeof document === 'undefined' ? undefined : document): Insets {
  if (!doc) return NO_INSETS;
  try {
    const probe = doc.createElement('div');
    probe.style.cssText =
      'position:fixed;left:-9999px;top:0;width:0;height:0;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top,0px);padding-right:env(safe-area-inset-right,0px);' +
      'padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);';
    doc.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const px = (v: string) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const insets = {
      top: px(cs.paddingTop),
      right: px(cs.paddingRight),
      bottom: px(cs.paddingBottom),
      left: px(cs.paddingLeft),
    };
    probe.remove();
    return insets;
  } catch {
    return NO_INSETS;
  }
}

/**
 * The cockpit's geometry for the viewport that is actually there — the spec, in px,
 * with the safe area already added. Every HUD component positions itself from this;
 * none of them owns an absolute coordinate of its own.
 */
export function useCockpitSpec(): CockpitSpec {
  const read = () => ({
    w: typeof window === 'undefined' ? 390 : window.innerWidth,
    h: typeof window === 'undefined' ? 844 : window.innerHeight,
    insets: readSafeInsets(),
  });
  const [state, setState] = useState(read);
  useEffect(() => {
    const check = () => {
      const next = read();
      setState((prev) =>
        prev.w === next.w && prev.h === next.h &&
        prev.insets.top === next.insets.top && prev.insets.bottom === next.insets.bottom &&
        prev.insets.left === next.insets.left && prev.insets.right === next.insets.right
          ? prev
          : next,
      );
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  return cockpitSpec(state.w, state.h, state.insets);
}

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

/**
 * The world band as a fixed style — where a gesture prompt, the stranded Continue
 * and the shop counter live. It is the same box the gust cue is placed inside
 * (`spec.world`), so nothing in a drive floats over a band that is not its own.
 */
export function worldBandStyle(spec: CockpitSpec): CSSProperties {
  return {
    position: 'fixed',
    left: spec.world.x,
    top: spec.world.y,
    width: spec.world.width,
    height: spec.world.height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
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
