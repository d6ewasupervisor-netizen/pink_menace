/**
 * CardOverlay — a PINK MENACE card rendered *in the cockpit*, not as a separate
 * screen. The card's still fills the frame as a dimmed windshield "read" so the
 * picture and the question are one moment; the title, hook, scene and decision
 * sit in a bottom dock over the (still-visible) driving world. Grading goes to
 * the server; the verdict, result, and debrief come back. The bundle never holds
 * the answer key. Dossiers and beats have no decision — read and continue.
 *
 * A card can also name the decision time makes for you (`timeout_option_id` /
 * `timeout_ms`). The dock runs that clock on the card game's own timing: 1 750 ms
 * of grace with no clock on screen, 800 ms with it on screen and full, and only
 * then does it count — and only while the answers are actually on screen
 * (`useCardCountdown` + `cardTimeout.ts`, `public/game/app.js:711-778`). When it
 * reaches zero it calls the same `pick()` an option button does, so the player gets
 * that option's verdict and debrief and a CONTINUE. The clock pauses with the
 * cockpit, with the tab, and while the dock is scrolled away from the answers; a
 * card without a timeout id has no clock at all.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQRHud } from '@/stores/qrHud';
import { useGameStore } from '@/stores/gameStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { CardDeck, cardClock, type Card, type CardGrade } from '@/quietroads';
import { cardStillStyle } from './cardStillStyle';
import { frameFor, useCockpitOrientation } from './cockpit/layout';
import { tokens } from './cockpit/tokens';
import { useCardCountdown } from './useCardCountdown';

type Grading = { state: 'idle' } | { state: 'busy'; optionId: string } | { state: 'graded'; grade: CardGrade } | { state: 'offline'; optionId: string };

export function CardOverlay() {
  const active = useQRHud((s) => s.card);
  const card: Card | undefined = useMemo(() => (active ? QuietRoads.deck.get(active.id) : undefined), [active]);
  const [grading, setGrading] = useState<Grading>({ state: 'idle' });
  const phase = useGameStore((s) => s.phase);
  const orientation = useCockpitOrientation();
  const frame = frameFor(orientation, true);
  const landscape = orientation === 'landscape';

  useEffect(() => { setGrading({ state: 'idle' }); setClockExpired(false); }, [active?.id]);

  // The clock this card carries, if any: hazard/beat cards with a timeout id.
  const clock = useMemo(() => cardClock(card), [card]);
  const [clockExpired, setClockExpired] = useState(false);
  // The dock scrolls, and on a phone the answers sit below the fold until the
  // player scrolls to them. The clock holds until they are on screen — the card
  // game's `choiceDockInView()`.
  const dockRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  /**
   * The one grading path. An option button and the card's clock both land here,
   * so a timeout is graded, shown and recorded exactly like a tap.
   */
  const pick = async (optionId: string) => {
    const c = card;
    if (!c) return;
    setGrading((g) => (g.state === 'busy' ? g : { state: 'busy', optionId }));
    const g = await QuietRoads.gradeCard(c.card_id, optionId);
    if (g === 'offline' || g === null) setGrading({ state: 'offline', optionId });
    else setGrading({ state: 'graded', grade: g });
  };

  const countdown = useCardCountdown(
    clock ? `${card?.card_id}:${clock.ms}` : null,
    clock?.ms ?? null,
    // Running only while the card owns an unanswered screen; a paused cockpit
    // (`phase`), a hidden tab and answers scrolled out of the dock all freeze it.
    phase === 'card' && grading.state === 'idle' && !clockExpired,
    () => {
      if (!clock) return;
      setClockExpired(true);
      void pick(clock.optionId);
    },
    { options: optionsRef, viewport: dockRef },
  );

  if (!active || !card) return null;
  const graded = CardDeck.isGraded(card);
  const options = card.options ?? [];
  const grade = grading.state === 'graded' ? grading.grade : null;
  // Every resolved card must be leavable: a verdict (answered or timed out) gives
  // CONTINUE, a dossier never had one, and a card that never reached the ledger
  // still has to close (AUDIT §20).
  const canContinue = Boolean(grade) || !graded || grading.state === 'offline';

  const finish = async () => {
    if (!graded) await QuietRoads.gradeCard(card.card_id, null); // dossier: record as seen
    QuietRoads.finishCard({
      card: card.card_id,
      option: grade?.option_id ?? null,
      // No verdict (a card that never reached the ledger) is "seen", not "wrong":
      // the runner treats null as seen and leaves Respect alone.
      correct: graded ? (grade?.was_correct ?? null) : null,
      noise: grade?.state_delta?.noise,
      time_cost: grade?.state_delta?.time_cost,
    });
  };

  return (
    <div data-ui data-layer="card" style={styles.wrap}>
      {/* Two halves of the body: the still, then the dock. The still is never
          behind the words. Landscape puts them side by side, because a phone on
          its side has no vertical room for a 2:3 plate above a card body. */}
      <div
        style={{
          position: 'fixed',
          top: `calc(${frame.top}px + env(safe-area-inset-top))`,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: landscape ? 'row' : 'column',
        }}
      >
        <div
          data-layer="still"
          style={{
            position: 'relative',
            flex: landscape ? '1 1 46%' : '1 1 auto',
            minHeight: 0,
            minWidth: 0,
            margin: 8,
          }}
        >
          {card.image && (
            <img
              src={card.image}
              alt=""
              // No opacity gate: a cached still is already complete at mount, so an
              // `onLoad`-driven fade can leave the plate invisible. It is the read.
              style={cardStillStyle}
            />
          )}
          <div data-layer="kicker" style={styles.kicker}>{card.zone ?? card.act} · {card.card_type.replace(/-/g, ' ')}</div>
        </div>

        <div
          data-layer="dock"
          ref={dockRef}
          style={{
            flex: landscape ? '1 1 54%' : '0 1 auto',
            minHeight: 0,
            maxHeight: landscape ? '100%' : `${Math.round(frame.bottom * 100)}dvh`,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: 'var(--qr-glass)',
            backdropFilter: 'blur(3px)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            borderTopLeftRadius: landscape ? 0 : 18,
            borderTopRightRadius: landscape ? 0 : 18,
            borderLeft: landscape ? '1px solid rgba(255,255,255,0.10)' : 'none',
            padding: '18px 18px calc(20px + env(safe-area-inset-bottom))',
            pointerEvents: 'auto',
          }}
        >
          <h2 style={styles.title}>{card.title}</h2>
          {card.hook && <p style={styles.hook}>{card.hook}</p>}
          {card.scene && <p style={styles.scene}>{card.scene}</p>}

          {/* The card's own clock, when it carries one: the same bar the card
              game shows (hazard-window), shrinking to zero and then answering for
              you. It appears after the card game's grace and is gone the moment the
              card resolves. */}
          {clock && graded && !grade && grading.state !== 'busy' && countdown.shown && (
            <div data-layer="card-clock" data-timeout-option={clock.optionId} style={styles.clock} role="timer"
              aria-label={`${countdown.secondsLeft} seconds left`}>
              <div style={styles.clockRow}>
                <span style={styles.clockLabel}>{clockExpired ? 'TIME' : 'TIME LEFT'}</span>
                <span data-clock-seconds style={styles.clockSeconds}>{Math.max(0, countdown.secondsLeft)}s</span>
              </div>
              <div style={styles.clockTrack}>
                <div data-clock-fill style={{ ...styles.clockFill, width: `${Math.max(0, Math.min(1, clockExpired ? 0 : countdown.fraction)) * 100}%` }} />
              </div>
              {clockExpired && <div style={styles.clockNote}>The clock answered for you.</div>}
            </div>
          )}

          {graded && !grade && (
            <>
              {card.decision && <p style={styles.decision}>{card.decision}</p>}
              <div data-layer="options" ref={optionsRef} style={styles.options}>
                {options.map((o) => {
                  const busy = grading.state === 'busy';
                  const mine = (grading.state === 'busy' || grading.state === 'offline') && grading.optionId === o.id;
                  return (
                    <button key={o.id} data-ui disabled={busy} style={{ ...styles.option, opacity: busy && !mine ? 0.5 : 1, borderColor: mine ? tokens.colors.accent : tokens.colors.strokeSoft }} onClick={() => pick(o.id)}>
                      <span style={styles.optionId}>{o.id.toUpperCase()}</span>
                      <span>{o.text}</span>
                    </button>
                  );
                })}
              </div>
              {grading.state === 'busy' && <p style={styles.note}>Deac's thinking about it…</p>}
              {grading.state === 'offline' && (
                <p style={{ ...styles.note, color: '#ff9a9a' }}>
                  Couldn't reach the ledger. <button data-ui style={styles.retry} onClick={() => pick(grading.optionId)}>Try again</button>
                </p>
              )}
            </>
          )}

          {grade && (
            <div style={{ ...styles.result, borderColor: grade.was_correct ? '#39ff14' : '#ff4444' }}>
              <div style={{ ...styles.verdict, color: grade.was_correct ? '#39ff14' : '#ff4444' }}>
                {grade.was_correct ? 'RIGHT' : 'WRONG'}
                {grade.state_delta?.noise != null && grade.state_delta.noise > 0 && <span style={styles.noiseTag}> · noise +{grade.state_delta.noise}</span>}
              </div>
              <p style={styles.resultText}>{grade.result}</p>
            </div>
          )}

          {(grade || !graded) && (grade?.debrief || card.debrief) && (
            <div style={styles.debrief}>
              <div style={styles.debriefLabel}>DEBRIEF</div>
              <p style={styles.debriefText}>{grade?.debrief || card.debrief}</p>
              {card.source?.dol_section && card.source.dol_section !== 'n/a' && (
                <div style={styles.source}>WA Driver Guide {card.source.dol_section}{card.source.psdp_skill && card.source.psdp_skill !== 'n/a' ? ` · ${card.source.psdp_skill}` : ''}</div>
              )}
            </div>
          )}

          {canContinue && <button data-ui style={styles.continue} onClick={finish}>CONTINUE</button>}
        </div>
      </div>
    </div>
  );
}
const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, zIndex: 240, pointerEvents: 'auto', fontFamily: 'system-ui, sans-serif', color: '#e8e6e1' },
  // The card's still is `cardStillStyle`: whole plate, letterboxed, in its own
  // band above the dock. It used to be a full-bleed `cover` backdrop behind the
  // card's text, which cropped most of a 2:3 card away.
  kicker: { position: 'absolute', top: 8, left: 8, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: tokens.colors.accent, background: 'rgba(0,0,0,0.55)', padding: '4px 8px', borderRadius: 4 },
  // P12: text size scales the card type only; the still is never scaled.
  title: { fontSize: 'calc(22px * var(--qr-text-scale, 1))', margin: '0 0 4px', fontWeight: 800, letterSpacing: '-0.01em' },
  hook: { fontSize: 'calc(15px * var(--qr-text-scale, 1))', color: tokens.colors.accent, margin: '0 0 10px', fontStyle: 'italic' },
  scene: { fontSize: 'calc(15.5px * var(--qr-text-scale, 1))', lineHeight: 1.5, margin: '0 0 14px', color: '#d6d3cc' },
  decision: { fontSize: 'calc(16px * var(--qr-text-scale, 1))', fontWeight: 700, margin: '0 0 10px', color: '#fff' },
  options: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  option: { display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid', borderRadius: 10, padding: '12px 12px', fontSize: 'calc(15px * var(--qr-text-scale, 1))', lineHeight: 1.35, cursor: 'pointer', minHeight: 52 },
  optionId: { flex: '0 0 auto', width: 22, height: 22, borderRadius: 11, background: 'rgba(242,141,178,0.25)', color: tokens.colors.accent, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  note: { fontSize: 13, color: '#9a9186', margin: '0 0 12px' },
  // The card's clock: a thin bar under the scene, in the deck's pink, with the
  // whole seconds left beside it so it reads without motion.
  clock: { margin: '0 0 14px' },
  clockRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  clockLabel: { fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.2em', color: tokens.colors.accent },
  clockSeconds: { fontSize: 'calc(12px * var(--qr-text-scale, 1))', fontWeight: 700, color: '#e8e6e1', fontVariantNumeric: 'tabular-nums' },
  clockTrack: { height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  clockFill: { height: '100%', background: tokens.colors.accent, transition: 'width 100ms linear' },
  clockNote: { marginTop: 4, fontSize: 'calc(11px * var(--qr-text-scale, 1))', color: '#9a9186' },
  retry: { background: 'none', border: '1px solid #ff9a9a', color: '#ff9a9a', borderRadius: 6, padding: '4px 10px', marginLeft: 8, cursor: 'pointer', fontSize: 13 },
  result: { border: '1px solid', borderRadius: 10, padding: '10px 12px', marginBottom: 12, background: 'rgba(255,255,255,0.03)' },
  verdict: { fontSize: 'calc(12px * var(--qr-text-scale, 1))', letterSpacing: '0.2em', fontWeight: 800, marginBottom: 6 },
  noiseTag: { color: '#ffd93d', letterSpacing: 0, fontWeight: 600 },
  resultText: { margin: 0, fontSize: 'calc(15px * var(--qr-text-scale, 1))', lineHeight: 1.45 },
  debrief: { borderLeft: '3px solid #F28DB2', padding: '6px 12px', marginBottom: 16 },
  debriefLabel: { fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.2em', color: tokens.colors.accent, marginBottom: 4 },
  debriefText: { margin: 0, fontSize: 'calc(15px * var(--qr-text-scale, 1))', lineHeight: 1.45 },
  source: { marginTop: 6, fontSize: 'calc(11px * var(--qr-text-scale, 1))', color: '#8a8f99' },
  continue: { width: '100%', padding: '16px', fontSize: 'calc(15px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.15em', background: tokens.colors.accent, color: '#1a0a12', border: 'none', borderRadius: 10, cursor: 'pointer' },
};
