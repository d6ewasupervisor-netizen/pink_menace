/**
 * cockpit/tokens — the single design-language for Quiet Roads.
 * Every cockpit surface (HUD, cards, dialogue, quizzes, overlays) reads from
 * here so the whole game shares one visual voice instead of a pile of styles.
 * Q2 = both orientations: useOrientation() is the one source of truth.
 */
import { useEffect, useState } from 'react';

export const tokens = {
  colors: {
    bg: '#07080c',
    panel: 'rgba(7,8,12,0.82)',
    panelSoft: 'rgba(7,8,12,0.55)',
    ink: '#e8e6e1',
    body: '#d6d3cc',
    muted: '#9a9186',
    faint: '#8a8f99',
    accent: '#F28DB2',      // cranberry pink — the Menace
    correct: '#39ff14',
    wrong: '#ff4444',
    warn: '#ffd93d',
    cyan: '#3ef0ff',
    stroke: 'rgba(255,255,255,0.14)',
    strokeSoft: 'rgba(255,255,255,0.22)',
  },
  fonts: {
    ui: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 18 },
  z: { hud: 50, prompt: 210, card: 240, pause: 250, menu: 300 },
} as const;

export type Orientation = 'portrait' | 'landscape';

/** True in landscape. Reacts to resize + orientationchange. */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    typeof window === 'undefined' || window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape',
  );
  useEffect(() => {
    const check = () =>
      setOrientation(window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape');
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  return orientation;
}

/** Safe-area insets as CSS values for inline styles. */
export const safeTop = 'env(safe-area-inset-top)';
export const safeBottom = 'env(safe-area-inset-bottom)';