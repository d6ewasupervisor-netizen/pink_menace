/**
 * CreditsScreen — the attribution the licences require, on screen.
 *
 * Two models in the drive are CC-BY-4.0 (the VW Beetle and the low-poly
 * cactus). CC-BY is an attribution licence: whoever receives the work has to be
 * given the title, the author, the source and the licence. A `CREDITS.md` beside
 * the GLBs satisfies nobody — the player never sees it. This screen is where the
 * requirement is actually met, and `drive/test/credits.test.ts` pins it to that
 * file so a new CC-BY asset cannot slip in uncredited.
 *
 * It opens at the end of the campaign (`8.3.end` unlocks `credits`, which the
 * bridge turns into this screen) and from the end-of-run screen, and it closes
 * back to whatever was underneath: it is a panel, not a phase, so nothing has to
 * hand the car back afterwards.
 */
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { CC_BY_ATTRIBUTIONS, KENNEY_CREDIT } from '@/quietroads/credits';
import { tokens } from './cockpit/tokens';

export function CreditsScreen() {
  const open = useQRHud((s) => s.credits);
  if (!open) return null;

  return (
    <div data-layer="credits" role="dialog" aria-modal="true" aria-label="Credits" style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.heading}>CREDITS</div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Models under CC-BY-4.0</div>
          <div style={styles.sectionNote}>
            These two are licensed for use with attribution. Here it is.
          </div>
          {CC_BY_ATTRIBUTIONS.map((a) => (
            <div key={a.file} style={styles.entry} data-credit-file={a.file}>
              <div style={styles.title} data-credit-title>
                {a.title}
              </div>
              <div style={styles.author} data-credit-author>
                by {a.author}
              </div>
              <div style={styles.links}>
                <a
                  href={a.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                  data-credit-source
                >
                  source
                </a>
                <span style={styles.dot}>·</span>
                <a
                  href={a.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                  data-credit-license
                >
                  {a.license}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>CC0</div>
          <div style={styles.kenneyLine} data-credit-kenney>
            {KENNEY_CREDIT.line}
          </div>
        </div>

        <button data-ui data-credits-close onClick={() => QuietRoads.closeCredits()} style={styles.close}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,6,10,0.94)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: tokens.z.menu,
    pointerEvents: 'auto',
  },
  panel: {
    width: 'min(440px, 100%)',
    maxHeight: '100%',
    overflowY: 'auto',
    background: tokens.colors.bg,
    border: `1px solid ${tokens.colors.stroke}`,
    borderRadius: tokens.radius.lg,
    padding: '18px 20px',
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.ui,
    boxShadow: '0 16px 60px rgba(0,0,0,0.7)',
  },
  heading: {
    fontFamily: tokens.fonts.serif,
    fontSize: 'calc(20px * var(--qr-text-scale, 1))',
    letterSpacing: '0.16em',
    color: tokens.colors.accent,
    marginBottom: 14,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 'calc(11px * var(--qr-text-scale, 1))',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: tokens.colors.muted,
    marginBottom: 6,
  },
  sectionNote: {
    fontSize: 'calc(12px * var(--qr-text-scale, 1))',
    color: tokens.colors.faint,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  entry: {
    borderLeft: `2px solid ${tokens.colors.stroke}`,
    paddingLeft: 10,
    marginBottom: 12,
  },
  title: { fontSize: 'calc(15px * var(--qr-text-scale, 1))', fontWeight: 700 },
  author: { fontSize: 'calc(13px * var(--qr-text-scale, 1))', color: tokens.colors.body },
  links: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  link: {
    fontSize: 'calc(12px * var(--qr-text-scale, 1))',
    color: tokens.colors.cyan,
    textDecoration: 'underline',
    fontFamily: tokens.fonts.mono,
  },
  dot: { color: tokens.colors.muted },
  kenneyLine: { fontSize: 'calc(13px * var(--qr-text-scale, 1))', color: tokens.colors.body, lineHeight: 1.4 },
  close: {
    marginTop: 4,
    width: '100%',
    minHeight: 44,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.06)',
    color: tokens.colors.ink,
    border: `1px solid ${tokens.colors.stroke}`,
    borderRadius: tokens.radius.md,
    font: 'inherit',
    fontSize: 'calc(13px * var(--qr-text-scale, 1))',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
