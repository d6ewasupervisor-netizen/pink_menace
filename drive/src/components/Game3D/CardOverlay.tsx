/**
 * CardOverlay — a PINK MENACE card, portrait. Image on top, the hook, the scene,
 * then the decision. The pick goes to the server, which grades it; the verdict,
 * result, and debrief come back. The bundle never holds the answer key.
 * Dossiers and beats have no decision; they read and continue (recorded as seen).
 */
import { useEffect, useMemo, useState } from 'react';
import { useQRStore } from '@/stores/qrStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { CardDeck, type Card, type CardGrade } from '@/quietroads';

type Grading = { state: 'idle' } | { state: 'busy'; optionId: string } | { state: 'graded'; grade: CardGrade } | { state: 'offline'; optionId: string };

export function CardOverlay() {
  const active = useQRStore((s) => s.card);
  const card: Card | undefined = useMemo(() => (active ? QuietRoads.deck.get(active.id) : undefined), [active]);
  const [grading, setGrading] = useState<Grading>({ state: 'idle' });
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => { setGrading({ state: 'idle' }); setImgReady(false); }, [active?.id]);

  if (!active || !card) return null;
  const graded = CardDeck.isGraded(card);
  const options = card.options ?? [];
  const grade = grading.state === 'graded' ? grading.grade : null;

  const pick = async (optionId: string) => {
    setGrading({ state: 'busy', optionId });
    const g = await QuietRoads.gradeCard(card.card_id, optionId);
    if (g === 'offline' || g === null) setGrading({ state: 'offline', optionId });
    else setGrading({ state: 'graded', grade: g });
  };

  const finish = async () => {
    if (!graded) await QuietRoads.gradeCard(card.card_id, null); // dossier: record as seen
    QuietRoads.finishCard({
      card: card.card_id,
      option: grade?.option_id ?? null,
      correct: graded ? (grade?.was_correct ?? false) : null,
      noise: grade?.state_delta?.noise,
      time_cost: grade?.state_delta?.time_cost,
    });
  };

  return (
    <div data-ui style={styles.wrap}>
      <div style={styles.scroll}>
        {card.image && (
          <div style={styles.imgBox}>
            <img src={card.image} alt="" onLoad={() => setImgReady(true)} style={{ ...styles.img, opacity: imgReady ? 1 : 0 }} />
            <div style={styles.imgFade} />
            <div style={styles.kicker}>{card.zone ?? card.act} · {card.card_type.replace(/-/g, ' ')}</div>
          </div>
        )}
        <div style={styles.body}>
          <h2 style={styles.title}>{card.title}</h2>
          {card.hook && <p style={styles.hook}>{card.hook}</p>}
          {card.scene && <p style={styles.scene}>{card.scene}</p>}

          {graded && !grade && (
            <>
              {card.decision && <p style={styles.decision}>{card.decision}</p>}
              <div style={styles.options}>
                {options.map((o) => {
                  const busy = grading.state === 'busy';
                  const mine = (grading.state === 'busy' || grading.state === 'offline') && grading.optionId === o.id;
                  return (
                    <button key={o.id} data-ui disabled={busy} style={{ ...styles.option, opacity: busy && !mine ? 0.5 : 1, borderColor: mine ? '#F28DB2' : 'rgba(255,255,255,0.22)' }} onClick={() => pick(o.id)}>
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

          {(grade || !graded) && <button data-ui style={styles.continue} onClick={finish}>CONTINUE</button>}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, zIndex: 240, background: '#07080c', pointerEvents: 'auto', fontFamily: 'system-ui, sans-serif', color: '#e8e6e1' },
  scroll: { position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  imgBox: { position: 'relative', width: '100%', aspectRatio: '3 / 4', maxHeight: '58vh', overflow: 'hidden', background: '#0e0f14' },
  img: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'opacity 300ms', display: 'block' },
  imgFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: 'linear-gradient(to bottom, rgba(7,8,12,0), #07080c)' },
  kicker: { position: 'absolute', top: 'calc(10px + env(safe-area-inset-top))', left: 14, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F28DB2', background: 'rgba(0,0,0,0.55)', padding: '4px 8px', borderRadius: 4 },
  body: { padding: '4px 18px calc(24px + env(safe-area-inset-bottom))' },
  title: { fontSize: 22, margin: '6px 0 4px', fontWeight: 800, letterSpacing: '-0.01em' },
  hook: { fontSize: 15, color: '#F28DB2', margin: '0 0 10px', fontStyle: 'italic' },
  scene: { fontSize: 15.5, lineHeight: 1.5, margin: '0 0 14px', color: '#d6d3cc' },
  decision: { fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: '#fff' },
  options: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  option: { display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid', borderRadius: 10, padding: '12px 12px', fontSize: 15, lineHeight: 1.35, cursor: 'pointer', minHeight: 52 },
  optionId: { flex: '0 0 auto', width: 22, height: 22, borderRadius: 11, background: 'rgba(242,141,178,0.25)', color: '#F28DB2', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  note: { fontSize: 13, color: '#9a9186', margin: '0 0 12px' },
  retry: { background: 'none', border: '1px solid #ff9a9a', color: '#ff9a9a', borderRadius: 6, padding: '4px 10px', marginLeft: 8, cursor: 'pointer', fontSize: 13 },
  result: { border: '1px solid', borderRadius: 10, padding: '10px 12px', marginBottom: 12, background: 'rgba(255,255,255,0.03)' },
  verdict: { fontSize: 12, letterSpacing: '0.2em', fontWeight: 800, marginBottom: 6 },
  noiseTag: { color: '#ffd93d', letterSpacing: 0, fontWeight: 600 },
  resultText: { margin: 0, fontSize: 15, lineHeight: 1.45 },
  debrief: { borderLeft: '3px solid #F28DB2', padding: '6px 12px', marginBottom: 16 },
  debriefLabel: { fontSize: 10, letterSpacing: '0.2em', color: '#F28DB2', marginBottom: 4 },
  debriefText: { margin: 0, fontSize: 15, lineHeight: 1.45 },
  source: { marginTop: 6, fontSize: 11, color: '#8a8f99' },
  continue: { width: '100%', padding: '16px', fontSize: 15, fontWeight: 800, letterSpacing: '0.15em', background: '#F28DB2', color: '#1a0a12', border: 'none', borderRadius: 10, cursor: 'pointer' },
};
