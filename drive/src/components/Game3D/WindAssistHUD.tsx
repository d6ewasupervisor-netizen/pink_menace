/**
 * WindAssistHUD — "this is help", said out loud.
 *
 * On Vantage Bridge, on touch or keyboard, the car holds 40, the steering is
 * scaled for a thumb and a gust announces itself 0.9 s early. None of that is
 * the car being broken, so the cockpit says so: a chip in the top band reading
 * `WIND ASSIST · 40`, and an arrow on the gust's side for the beat before it
 * lands.
 *
 * `quietroads/assist.ts` owns the values; this file draws them.
 */
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { useCompactHud } from '@/hooks/useCompactHud';
import { tokens, useOrientation } from './cockpit/tokens';

export function WindAssistHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const assist = useQRHud((s) => s.windAssist);
  const gust = useQRHud((s) => s.gust);
  const compact = useCompactHud();
  const orientation = useOrientation();

  if (worldMode !== 'kent' || (!assist && !gust)) return null;

  return (
    <div data-layer="wind-assist" style={styles.root} aria-hidden>
      {assist && (
        <div
          data-wind-assist-label={assist.label}
          style={{
            ...styles.chip,
            top: `calc(${orientation === 'landscape' ? 34 : 104}px + env(safe-area-inset-top, 0px))`,
            fontSize: `calc(${compact ? 10 : 11}px * var(--qr-text-scale, 1))`,
          }}
        >
          {assist.label}
        </div>
      )}

      {gust && (
        <div
          data-gust-side={gust.side}
          style={{
            ...styles.gust,
            ...(gust.side === 'left' ? styles.gustLeft : styles.gustRight),
          }}
        >
          <span style={styles.gustArrow}>{gust.side === 'left' ? '◀' : '▶'}</span>
          <span style={styles.gustWord}>GUST</span>
          <span style={styles.gustHint}>steer into it</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: tokens.z.hud + 1, fontFamily: tokens.fonts.ui },
  chip: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: tokens.radius.sm,
    background: 'rgba(0,0,0,0.5)',
    border: `1px solid ${tokens.colors.cyan}66`,
    color: tokens.colors.cyan,
    fontWeight: 800,
    letterSpacing: '0.14em',
    whiteSpace: 'nowrap',
  },
  gust: {
    position: 'absolute',
    top: '46%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    color: tokens.colors.warn,
    textShadow: '0 2px 8px #000',
  },
  gustLeft: { left: 10, alignItems: 'flex-start' },
  gustRight: { right: 10, alignItems: 'flex-end' },
  gustArrow: { fontSize: 'calc(34px * var(--qr-text-scale, 1))', lineHeight: 1 },
  gustWord: { fontSize: 'calc(12px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.18em' },
  gustHint: { fontSize: 'calc(9px * var(--qr-text-scale, 1))', color: tokens.colors.body, letterSpacing: '0.08em' },
};
