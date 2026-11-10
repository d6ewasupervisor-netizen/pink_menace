/**
 * HandsOffOverlay — the sixty seconds of 6.3, in the cockpit's own voice.
 *
 * The scene says "Engine off. Hands off. … Sixty seconds." On a phone there is
 * no engine switch and no handbrake, so the only hands-off surface is the screen
 * itself: this panel says what the scene says, counts the minute down, and takes
 * the sticks away so a resting thumb cannot start the engine. The scene's lines
 * (6.3.10 / 6.3.11 / 6.3.12 at 15 / 30 / 45 s, 6.3.clear at 60) play *in* the
 * panel — the dialogue box stands down while it is up (DialogueBox reads
 * `qrHud.handsOff`), so a line is never shown twice or hidden behind the panel.
 *
 * It lives in the body band (below the HUD band, above the safe-area foot) and
 * is translucent: the Quiet drifting away behind it is the point of the scene.
 * The pause chip stays reachable above it; the count reads the sim's own clock,
 * so pausing — or the phone locking — holds the ring instead of spending it.
 *
 * The screen is kept awake for the whole wait (`systems/screenWakeLock.ts`):
 * obeying "don't touch the screen" for a minute is exactly what iOS auto-lock
 * waits for.
 */
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { handsOffFor, handsOffView } from '@/quietroads/handsoff';
import { screenWake } from '@/systems/screenWakeLock';
import { tokens } from './cockpit/tokens';
import { useCockpitSpec } from './cockpit/layout';

/**
 * Hold the screen awake while `active`. Feature-detected inside the keeper and
 * re-requested on the way back from a locked phone; released on the way out.
 */
export function useScreenWake(active: boolean) {
  useEffect(() => {
    if (!active) return;
    void screenWake.acquire();
    const onVisibility = () => { if (!document.hidden) void screenWake.onVisible(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void screenWake.release();
    };
  }, [active]);
}

const RING = 132;
const STROKE = 8;
const CIRC = 2 * Math.PI * (RING / 2 - STROKE / 2);

export function HandsOffOverlay() {
  const handsOff = useQRHud((s) => s.handsOff);
  const line = useQRHud((s) => s.line);
  const direction = useQRHud((s) => s.direction);
  const phase = useGameStore((s) => s.phase);
  const spec = useCockpitSpec();
  useScreenWake(Boolean(handsOff));

  if (!handsOff) return null;
  const wait = handsOffFor(handsOff.mission);
  if (!wait) return null;
  const view = handsOffView(wait, handsOff.elapsedS);
  const paused = phase === 'paused';
  const spoken = line?.text ?? direction?.node.text ?? '';
  const speaker = line ? line.speaker_def?.name ?? line.speaker : '';
  const nodeId = line?.node_id ?? direction?.id ?? '';

  return (
    <div
      data-layer="hands-off"
      data-hands-off-mission={wait.mission}
      data-hands-off-total={wait.totalS}
      data-hands-off-remaining={view.remainingS}
      data-hands-off-mark={view.mark}
      data-hands-off-line={nodeId}
      data-hands-off-paused={paused ? 'true' : 'false'}
      aria-live="polite"
      aria-label={wait.title}
      style={{
        ...styles.band,
        // ITEM 3.7: the wait owns the world band, from the same spec every other
        // surface reads — it is not lifted 224 px down a hand-tuned top band.
        top: spec.world.y,
        height: spec.world.height,
      }}
    >
      <div style={styles.title}>{wait.title}</div>
      <div style={styles.note}>{paused ? 'Paused. The clock is holding.' : wait.note}</div>

      <div style={styles.ringWrap} data-hands-off-ring data-fraction={view.fraction.toFixed(3)}>
        <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden>
          <circle cx={RING / 2} cy={RING / 2} r={RING / 2 - STROKE / 2} fill="none" stroke={tokens.colors.stroke} strokeWidth={STROKE} />
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={RING / 2 - STROKE / 2}
            fill="none"
            stroke={view.spent ? tokens.colors.correct : tokens.colors.cyan}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - view.fraction)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            style={{ transition: 'stroke-dashoffset 120ms linear' }}
          />
        </svg>
        <div style={styles.ringText}>
          <div style={styles.ringNum}>{view.spent ? 'GO' : view.remainingS}</div>
          <div style={styles.ringUnit}>{view.spent ? '' : 'SECONDS'}</div>
        </div>
      </div>

      <div style={styles.marks}>
        {wait.marks.map((m) => (
          <span
            key={m}
            data-hands-off-mark-tick={m}
            data-reached={view.mark >= m ? 'true' : 'false'}
            style={{ ...styles.mark, color: view.mark >= m ? tokens.colors.ink : tokens.colors.muted, borderColor: view.mark >= m ? tokens.colors.accent : tokens.colors.stroke }}
          >
            {m}
          </span>
        ))}
      </div>

      <div style={styles.lineBox}>
        {speaker && <div style={styles.speaker}>{speaker}</div>}
        <div style={styles.lineText} data-hands-off-text>{spoken}</div>
      </div>

      <div style={styles.foot}>{view.spent ? 'Roll. Softly.' : 'Hands off the sticks.'}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  band: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '0 18px',
    pointerEvents: 'none',
    zIndex: tokens.z.prompt,
    fontFamily: tokens.fonts.ui,
    textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 45%, rgba(7,8,12,0.58), rgba(7,8,12,0.84))',
    borderTop: `1px solid ${tokens.colors.stroke}`,
  },
  title: {
    color: tokens.colors.accent,
    fontWeight: 800,
    letterSpacing: '0.18em',
    fontSize: 'calc(13px * var(--qr-text-scale, 1))',
  },
  note: {
    color: tokens.colors.muted,
    fontSize: 'calc(11px * var(--qr-text-scale, 1))',
    letterSpacing: '0.04em',
    maxWidth: 320,
  },
  ringWrap: { position: 'relative', width: RING, height: RING, marginTop: 2 },
  ringText: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ringNum: { color: tokens.colors.ink, fontFamily: tokens.fonts.mono, fontSize: 34, fontWeight: 700, lineHeight: 1 },
  ringUnit: { color: tokens.colors.muted, fontSize: 9, letterSpacing: '0.16em', marginTop: 4 },
  marks: { display: 'flex', gap: 8 },
  mark: {
    fontFamily: tokens.fonts.mono,
    fontSize: 'calc(11px * var(--qr-text-scale, 1))',
    border: '1px solid',
    borderRadius: tokens.radius.sm,
    padding: '1px 7px',
  },
  lineBox: { minHeight: 54, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 4 },
  speaker: { color: tokens.colors.accent, fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.14em', fontWeight: 800 },
  lineText: { color: tokens.colors.body, fontFamily: tokens.fonts.serif, fontSize: 'calc(14px * var(--qr-text-scale, 1))', lineHeight: 1.4 },
  foot: { color: tokens.colors.faint, fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.1em' },
};
