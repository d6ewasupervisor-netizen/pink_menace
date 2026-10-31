/**
 * CockpitQTE — the in-cockpit gesture prompt. Chain-up (5.2) is the first one:
 * "hold the brake" while the tensioner bites. It reads state, never input; the
 * gesture itself is the pedal, so the prompt is not a button and cannot be
 * mistapped.
 *
 * Renders above every other layer while a QTE is live (`z` is the top of the
 * cockpit stack below the pause menu), and clears itself the moment the mission
 * hands the beat back.
 */
import { useQRHud } from '@/stores/qrHud';
import { tokens } from './cockpit/tokens';

export function CockpitQTE() {
  const qte = useQRHud((s) => s.qte);
  if (!qte) return null;
  const pct = Math.round(Math.max(0, Math.min(1, qte.progress)) * 100);
  return (
    <div data-layer="qte" data-ui style={styles.wrap} role="status" aria-live="polite">
      <div style={styles.label}>{qte.label}</div>
      <div style={styles.track}>
        <div style={{ ...styles.fill, width: `${pct}%` }} />
      </div>
      <div style={styles.hint}>{qte.hint}</div>
      <div style={styles.keys}>HOLD ↓ / S · or pull the gas stick back</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    left: '50%',
    top: '42%',
    transform: 'translate(-50%, -50%)',
    zIndex: 246,
    width: 'min(360px, calc(100vw - 32px))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '14px 18px',
    borderRadius: tokens.radius.lg,
    background: 'rgba(7,8,12,0.86)',
    border: `1px solid ${tokens.colors.accent}`,
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    textAlign: 'center',
  },
  label: {
    fontFamily: tokens.fonts.ui,
    fontSize: 'calc(18px * var(--qr-text-scale, 1))',
    fontWeight: 900,
    letterSpacing: '0.14em',
    color: tokens.colors.accent,
  },
  track: { width: '100%', height: 8, background: 'rgba(255,255,255,0.14)', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', background: tokens.colors.accent, transition: 'width 80ms linear' },
  hint: {
    fontFamily: tokens.fonts.ui,
    fontSize: 'calc(13px * var(--qr-text-scale, 1))',
    lineHeight: 1.35,
    color: tokens.colors.body,
  },
  keys: {
    fontFamily: tokens.fonts.mono,
    fontSize: 'calc(10px * var(--qr-text-scale, 1))',
    letterSpacing: '0.08em',
    color: tokens.colors.muted,
  },
};
