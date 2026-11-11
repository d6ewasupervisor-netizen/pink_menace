/**
 * DialogueBox — story text for Quiet Roads. Lines and stage directions are
 * tap-to-advance (unless auto_ms); choices render as buttons. Timed choices
 * show a shrinking bar. Whisper is the default volume in this world, so the
 * box is small and quiet; a "shout" line gets a red edge because it cost her.
 *
 * ITEM 3.5 — TWO LINES, GLASS, AT THE FOOT OF THE WORLD BAND. The old box was a
 * `min(720px, 92vw)` panel with `dialogueMaxHeight()` (up to 40 % of the viewport)
 * that could run to four or five lines of 17 px text, and it floated above the
 * sticks rather than in its own band. It is now the spec's dialogue band: the width
 * of the cockpit column, sitting exactly on `spec.dialogue.bottom` (the top of the
 * controls), glass over the road, the speaker in the micro type, and the words
 * clamped to two lines. Anything longer is a card or a cutscene, not a line.
 */
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useAdvanceKey } from '@/hooks/useAdvanceKey';
import { ADVANCE_PRIORITY } from '@/input/advanceKey';
import { STILL_FOR_SCENE } from './stills';
import { tokens } from './cockpit/tokens';
import { useCockpitSpec } from './cockpit/layout';

/**
 * Content-aware auto-dismiss delay.
 * 1 200 ms base + 55 ms per character, clamped 2 000 – 6 000 ms.
 * "Seatbelt." → ~2 000 ms.  A 50-char line → ~3 950 ms.
 */
function autoDismissMs(text: string): number {
  return Math.max(2000, Math.min(6000, 1200 + text.length * 55));
}

export function DialogueBox() {
  const line = useQRHud((s) => s.line);
  const direction = useQRHud((s) => s.direction);
  const choices = useQRHud((s) => s.choices);
  // The hands-off overlay carries the scene's lines itself, so the box stands
  // down while it is up. Its auto-dismiss clock keeps running (the effect above
  // does not read this), exactly as it did before the overlay existed.
  const handsOff = useQRHud((s) => s.handsOff);
  const phase = useGameStore((s) => s.phase);
  const worldMode = useGameStore((s) => s.worldMode);
  const sceneId = useQRStore((s) => s.sceneId);
  const spec = useCockpitSpec();

  // Fraction 1→0 shared by both the choice timeout bar and the auto-dismiss bar.
  const [barFraction, setBarFraction] = useState(1);

  // Shrinking bar for timed choices
  useEffect(() => {
    if (!choices?.node.timeout_ms) return;
    setBarFraction(1);
    const start = performance.now();
    const id = window.setInterval(() => setBarFraction(Math.max(0, 1 - (performance.now() - start) / choices.node.timeout_ms!)), 50);
    return () => window.clearInterval(id);
  }, [choices]);

  // Auto-dismiss: any line or direction without explicit auto_ms gets a
  // content-aware countdown outside of full-cutscene mode (phase = 'dialogue').
  // A visible bar replaces the static "tap" hint so the player can see it coming.
  const isCutscene = phase === 'dialogue';
  const holdForSteer = phase === 'driving' && Boolean(line);
  useEffect(() => {
    if (isCutscene || choices || holdForSteer) return;

    const text = line ? line.text : direction?.node.text;
    if (!text) return;
    // Skip nodes that already manage their own timing
    if (line?.auto_ms != null) return;
    if (!line && direction?.node.auto_ms != null) return;

    const delay = autoDismissMs(text);
    const start = performance.now();
    setBarFraction(1);

    const intervalId = window.setInterval(
      () => setBarFraction(Math.max(0, 1 - (performance.now() - start) / delay)),
      50,
    );
    const timeoutId = window.setTimeout(() => QuietRoads.tap(), delay);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [line, direction, choices, isCutscene, holdForSteer]);

  const hidden = worldMode !== 'kent' || phase === 'quiz' || phase === 'paused' || phase === 'menu' || phase === 'card';
  useAdvanceKey(ADVANCE_PRIORITY.dialogue, !hidden && !handsOff && !choices && (line || direction) ? () => QuietRoads.tap() : null);

  if (hidden) return null;
  if (handsOff) return null;
  if (!line && !direction && !choices) return null;
  const cutscene = phase === 'dialogue';

  const speakerName = line ? (line.speaker_def?.name ?? line.speaker) : '';
  const speakerColor = line?.speaker_def?.color ?? '#ddd';
  const loud = line?.volume === 'shout' || line?.volume === 'raised';
  const radio = line?.voice_bed && line.voice_bed !== 'none';

  // Show the countdown bar whenever auto-dismiss is running (non-cutscene,
  // no choices, no manual auto_ms already set on the node).
  const showCountdown = !cutscene && !choices && !holdForSteer && (
    (line && line.auto_ms == null) || (direction && !line && direction.node.auto_ms == null)
  );

  // The dialogue band is the foot of the world band: `spec.dialogue.bottom` is the
  // top of the controls, so the box sits exactly on it at every shape. A choice list
  // is allowed to grow into the world band (it is a decision, not a line); a line is
  // clamped to two.
  const bandBottom = Math.max(tokens.space.sm, spec.height - spec.dialogue.bottom);
  const boxWidth = Math.max(200, Math.min(spec.column.width - tokens.space.md * 2, 640));

  return (
    <div
      data-ui
      data-layer="dialogue"
      style={{
        ...styles.wrap,
        pointerEvents: cutscene ? 'auto' : 'none',
        padding: `0 ${tokens.space.sm}px ${bandBottom}px ${tokens.space.sm}px`,
      }}
      onClick={() => { if (!choices) QuietRoads.tap(); }}
    >
      {cutscene && <div style={styles.dim} />}
      {cutscene && sceneId && STILL_FOR_SCENE[sceneId] && (
        <img
          src={STILL_FOR_SCENE[sceneId]}
          alt=""
          style={{ ...styles.still, top: spec.rail.y + tokens.space.sm }}
        />
      )}
      <div
        data-ui
        onClick={(e) => { if (!cutscene && !choices) { e.stopPropagation(); QuietRoads.tap(); } }}
        style={{
          ...styles.box,
          width: boxWidth,
          maxHeight: choices ? Math.max(180, Math.round(spec.world.height * 0.7)) : undefined,
          overflowY: choices ? 'auto' : 'hidden',
          pointerEvents: 'auto',
          borderColor: loud ? tokens.colors.wrong : radio ? '#5DADE2' : tokens.colors.strokeSoft,
        }}
      >
        {line && (
          <>
            <div style={{ ...styles.speaker, color: speakerColor }}>
              {radio ? '📻 ' : ''}{speakerName}
              {line.delivery === 'SYS' && <span style={styles.sys}>  · note to self</span>}
            </div>
            <div style={{ ...styles.text, fontStyle: line.emotion === 'reading' ? 'italic' : 'normal' }}>{line.text}</div>
          </>
        )}
        {direction && !line && (
          <div style={styles.direction}>{direction.node.text}</div>
        )}
        {choices && (
          <div style={styles.choices}>
            {choices.options.map((o) => (
              <button key={o.id} style={styles.choice} onClick={(e) => { e.stopPropagation(); QuietRoads.choose(o.id); }}>
                {o.text}
              </button>
            ))}
            {choices.node.timeout_ms != null && (
              <div style={styles.timerTrack}><div style={{ ...styles.timerFill, width: `${barFraction * 100}%` }} /></div>
            )}
          </div>
        )}
        {/* Countdown bar — replaces the static "tap" hint; shrinks to 0 then line auto-advances */}
        {showCountdown && (
          <div style={styles.timerTrack}>
            <div style={{ ...styles.timerFill, width: `${barFraction * 100}%`, background: 'rgba(255,255,255,0.28)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, zIndex: 228, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxSizing: 'border-box' },
  dim: { position: 'absolute', inset: 0, background: 'rgba(5,6,10,0.72)' },
  still: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 'min(92vw, 520px)', aspectRatio: '606 / 361', objectFit: 'cover', borderRadius: tokens.radius.lg, opacity: 0.92, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', filter: 'saturate(0.85)' },
  // Glass over the road, one radius, one blur: the same panel language as the rail
  // and the nav strip. Nothing here is an opaque card.
  box: {
    position: 'relative',
    boxSizing: 'border-box',
    background: 'var(--qr-glass)',
    backdropFilter: 'var(--qr-blur)',
    WebkitBackdropFilter: 'var(--qr-blur)',
    border: '1px solid',
    borderRadius: tokens.radius.lg,
    padding: `${tokens.space.sm}px ${tokens.space.md}px`,
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.ui,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  // P12: text size scales the dialogue type only (the var is set on the overlay root).
  speaker: { fontSize: 'var(--qr-type-micro)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 },
  sys: { color: tokens.colors.faint, fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
  // TWO LINES. A third line is a card or a cutscene; the box is not a wall of text
  // on top of the road it is describing.
  text: {
    fontSize: 'calc(var(--qr-type-body) * var(--qr-text-scale, 1))',
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  direction: {
    fontSize: 'calc(var(--qr-type-body) * var(--qr-text-scale, 1))',
    lineHeight: 1.3,
    color: tokens.colors.body,
    fontStyle: 'italic',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  choices: { display: 'flex', flexDirection: 'column', gap: tokens.space.sm, marginTop: tokens.space.sm },
  choice: { background: 'rgba(255,255,255,0.06)', color: tokens.colors.ink, border: `1px solid ${tokens.colors.strokeSoft}`, borderRadius: tokens.radius.md, padding: '12px 14px', fontSize: 'calc(var(--qr-type-body) * var(--qr-text-scale, 1))', textAlign: 'left', cursor: 'pointer', minHeight: 48 },
  timerTrack: { height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: tokens.space.xs },
  timerFill: { height: '100%', background: tokens.colors.warn, transition: 'width 50ms linear' },
};
