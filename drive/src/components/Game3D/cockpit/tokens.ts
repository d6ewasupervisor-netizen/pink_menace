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
  /**
   * Item 3.1: ONE type scale (12/14/16/20/28), ONE radius (12), ONE blur, and a
   * 4/8/12/16 spacing rhythm. Before this every surface carried its own numbers —
   * 9 px captions next to 11 px labels next to 8 px bar captions — which is how a
   * cockpit starts to read as a pile instead of a dashboard. The old sm/md/lg/xl
   * radii stay as aliases so unmigrated surfaces do not change shape in the same
   * commit that the HUD does.
   */
  type: {
    micro: 12,
    label: 12,
    body: 14,
    title: 16,
    readout: 20,
    hero: 28,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16 },
  radius: { sm: 6, md: 10, lg: 12, xl: 12, pill: 999 },
  blur: 'blur(10px) saturate(1.1)',
  z: { hud: 50, prompt: 210, dialogue: 228, quiz: 232, stranded: 234, card: 240, pause: 250, menu: 300 },
} as const;

/**
 * The same tokens as CSS custom properties, so a component can be written in one
 * `style` object and still share the scale (`var(--qr-type-title)`), and so a
 * `@media (prefers-reduced-motion)` block can override a token instead of a rule.
 * Mounted once by `CockpitHUD` on the HUD root.
 */
export const TOKEN_CSS = `
:root{
  --qr-bg:${tokens.colors.bg};
  --qr-panel:${tokens.colors.panel};
  --qr-ink:${tokens.colors.ink};
  --qr-body:${tokens.colors.body};
  --qr-muted:${tokens.colors.muted};
  --qr-faint:${tokens.colors.faint};
  --qr-accent:${tokens.colors.accent};
  --qr-cyan:${tokens.colors.cyan};
  --qr-warn:${tokens.colors.warn};
  --qr-stroke:${tokens.colors.stroke};
  --qr-stroke-soft:${tokens.colors.strokeSoft};
  --qr-glass:rgba(8,10,16,0.62);
  --qr-blur:${tokens.blur};
  --qr-type-micro:${tokens.type.micro}px;
  --qr-type-label:${tokens.type.label}px;
  --qr-type-body:${tokens.type.body}px;
  --qr-type-title:${tokens.type.title}px;
  --qr-type-readout:${tokens.type.readout}px;
  --qr-type-hero:${tokens.type.hero}px;
  --qr-space-xs:${tokens.space.xs}px;
  --qr-space-sm:${tokens.space.sm}px;
  --qr-space-md:${tokens.space.md}px;
  --qr-space-lg:${tokens.space.lg}px;
  --qr-radius:${tokens.radius.lg}px;
}
@media (prefers-reduced-motion: reduce){
  /* One switch for every animated surface: the gust streaks, the boot sweep, the
     vignette pulse. Reduced motion is a preference, not an absence of feedback. */
  .qr-anim{animation:none !important;transition:none !important}
}
`;

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