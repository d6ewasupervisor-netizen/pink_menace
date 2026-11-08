/**
 * WindAssistHUD — "this is help", said out loud, and the gust said in a way a
 * player can act on.
 *
 * On Vantage Bridge, on touch or keyboard, the car holds 40, the steering is
 * scaled for a thumb and a gust announces itself 0.9 s early. None of that is
 * the car being broken, so the cockpit says so: a chip reading `WIND ASSIST · 40`
 * in its own slot of the top band, and — on the side the wind comes FROM — an
 * arrow, streaks blowing toward the car, and the action: `GUST · steer left`.
 * Before this the indicator said "steer into it" and nothing pushed, so the
 * instruction and the physics pointed at each other.
 *
 * `quietroads/assist.ts` owns the assist's values and `quietroads/wind.ts` the
 * gust's shape; this file draws them. Positions here are the top band's own
 * slots: the chip takes the left rail (under the pause control in portrait, under
 * the act badge in landscape), and e2e/cockpit-layout asserts it overlaps nothing
 * at 390x844, 440x956, 844x390 and 1280x800.
 */
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { useCompactHud } from '@/hooks/useCompactHud';
import { gustActionLabel } from '@/quietroads/wind';
import { tokens, useOrientation } from './cockpit/tokens';

/** The streaks: three lines blowing in from the gust's side, over and over. */
const STREAK_CSS = `
@keyframes qr-wind-in-left { from { transform: translateX(-26px); opacity: 0 } 25% { opacity: .9 } to { transform: translateX(34px); opacity: 0 } }
@keyframes qr-wind-in-right { from { transform: translateX(26px); opacity: 0 } 25% { opacity: .9 } to { transform: translateX(-34px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .qr-wind-streak { animation: none !important } }
`;

export function WindAssistHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const assist = useQRHud((s) => s.windAssist);
  const gust = useQRHud((s) => s.gust);
  const compact = useCompactHud();
  const orientation = useOrientation();

  if (worldMode !== 'kent' || (!assist && !gust)) return null;

  const streakName = gust?.side === 'right' ? 'qr-wind-in-right' : 'qr-wind-in-left';

  return (
    <div data-layer="wind-assist" style={styles.root} aria-hidden>
      <style>{STREAK_CSS}</style>

      {assist && (
        <div
          data-wind-assist-label={assist.label}
          style={{
            ...styles.chip,
            ...(orientation === 'landscape' ? styles.chipLandscape : styles.chipPortrait),
            fontSize: `calc(${compact ? 10 : 11}px * var(--qr-text-scale, 1))`,
          }}
        >
          {assist.label}
        </div>
      )}

      {gust && (
        <div
          data-gust-side={gust.side}
          data-gust-push={gust.push ? '1' : '0'}
          style={{
            ...styles.gust,
            ...(orientation === 'landscape' ? styles.gustLandscape : null),
            ...(gust.side === 'left' ? styles.gustLeft : styles.gustRight),
          }}
        >
          <div style={styles.streaks}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="qr-wind-streak"
                style={{
                  ...styles.streak,
                  // Before the push lands the lines are there but still; while the
                  // force is on they run at the car, which is the cue that moves.
                  width: gust.push ? 44 : 26,
                  opacity: gust.push ? 0.9 : 0.4,
                  animation: gust.push
                    ? `${streakName} ${0.5 + i * 0.12}s linear ${i * 0.09}s infinite`
                    : 'none',
                }}
              />
            ))}
          </div>
          <span style={styles.gustArrow}>{gust.side === 'left' ? '◀' : '▶'}</span>
          <span style={styles.gustWord}>{gustActionLabel(gust.side)}</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: tokens.z.hud + 1, fontFamily: tokens.fonts.ui },
  chip: {
    position: 'absolute',
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
  /**
   * Portrait: the left column between the pause chip (top 10, 36 tall) and the
   * act badge (top 66, from x=102), above the nav cluster (from 104). The label
   * wraps to two lines there instead of running under the badge.
   */
  chipPortrait: {
    left: 12,
    top: 'calc(54px + env(safe-area-inset-top, 0px))',
    maxWidth: 88,
    padding: '3px 5px',
    whiteSpace: 'normal',
    lineHeight: 1.15,
    textAlign: 'center',
  },
  /**
   * Landscape/desktop: the top row is full (badge left, meter centre, TP and the
   * pause chip right) and the nav cluster starts at 64, so the chip takes the
   * left rail between the act badge and the nav — and the right edge stays free
   * for the gust cue, which needs the side the wind comes from.
   */
  chipLandscape: {
    left: 12,
    top: 'calc(36px + env(safe-area-inset-top, 0px))',
  },
  gust: {
    position: 'absolute',
    top: '46%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    color: tokens.colors.warn,
    textShadow: '0 2px 8px #000',
  },
  /** Landscape has ~114 px between the lights/horn rail and the sticks: it fits there. */
  gustLandscape: {
    top: 'calc(108px + env(safe-area-inset-top, 0px))',
  },
  gustLeft: { left: 10, alignItems: 'flex-start' },
  gustRight: { right: 10, alignItems: 'flex-end' },
  streaks: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 4 },
  streak: { height: 2, borderRadius: 2, background: 'currentColor', display: 'block' },
  gustArrow: { fontSize: 'calc(30px * var(--qr-text-scale, 1))', lineHeight: 1 },
  gustWord: { fontSize: 'calc(12px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.12em', whiteSpace: 'nowrap' },
};
