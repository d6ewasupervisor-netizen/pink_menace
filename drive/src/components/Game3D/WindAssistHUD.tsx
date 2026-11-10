/**
 * WindAssistHUD — the gust, said in a way a player can act on, and nothing else.
 *
 * ITEM 3.3 REMOVED THE CHIP. It used to draw `WIND ASSIST · 40` in its own slot of
 * the top band — measured at 390x844 at (12,54) 88x31, sitting *on* the act badge,
 * and at 844x390 at (356,34) on the noise meter's sub-label. The same fact now
 * lives in the nav strip's assist tag (`AUTO 40`, next to the speed), and the gas
 * stick hides while it is true, so the chip was a third copy of one sentence.
 *
 * ITEM 3.4 PUT THE CUE IN THE WORLD BAND. The arrow, the streaks and the words are
 * drawn at mid-height on the side the wind comes FROM, from `cockpit/spec.ts`'s
 * world band, so they sit over the road rather than over the dashboard. Nothing
 * else may share that slot; the cue is the only world-band element that is not a
 * story surface, and it is pointer-transparent.
 */
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { gustActionLabel } from '@/quietroads/wind';
import { useCockpitSpec } from './cockpit/layout';
import { tokens } from './cockpit/tokens';

/** The streaks: three lines blowing in from the gust's side, over and over. */
const STREAK_CSS = `
@keyframes qr-wind-in-left { from { transform: translateX(-26px); opacity: 0 } 25% { opacity: .9 } to { transform: translateX(34px); opacity: 0 } }
@keyframes qr-wind-in-right { from { transform: translateX(26px); opacity: 0 } 25% { opacity: .9 } to { transform: translateX(-34px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .qr-wind-streak { animation: none !important } }
`;

export function WindAssistHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const gust = useQRHud((s) => s.gust);
  const spec = useCockpitSpec();

  if (worldMode !== 'kent' || !gust) return null;

  const streakName = gust.side === 'right' ? 'qr-wind-in-right' : 'qr-wind-in-left';

  return (
    <div data-layer="wind-assist" style={styles.root} aria-hidden>
      <style>{STREAK_CSS}</style>
      <div
        data-gust-side={gust.side}
        data-gust-push={gust.push ? '1' : '0'}
        style={{
          ...styles.gust,
          top: spec.world.y + Math.round(spec.world.height * 0.34),
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
        <span style={styles.gustArrow}>{gust.side === 'left' ? '\u25c0' : '\u25b6'}</span>
        <span style={styles.gustWord}>{gustActionLabel(gust.side)}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: tokens.z.hud + 1, fontFamily: tokens.fonts.ui },
  gust: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    color: tokens.colors.warn,
    textShadow: '0 2px 8px #000',
  },
  gustLeft: { left: 14, alignItems: 'flex-start' },
  gustRight: { right: 14, alignItems: 'flex-end' },
  streaks: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 4 },
  streak: { height: 2, borderRadius: 2, background: 'currentColor', display: 'block' },
  gustArrow: { fontSize: 'calc(30px * var(--qr-text-scale, 1))', lineHeight: 1 },
  gustWord: { fontSize: 'calc(12px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.12em', whiteSpace: 'nowrap' },
};
