/**
 * GradeDebrief — the mission-beat result panel.
 *
 * When a grade event fires, this shows one short panel: GRADE, PASS or MISS,
 * the card id that just opened, and that card's source.dol_section. Every
 * string comes from the card or is a fixed label; nothing here explains the
 * feature and no lesson copy is written.
 *
 * It uses the same phase path as a card (the car is already frozen), and closes
 * on the existing continue control. Closing emits nothing — in particular it
 * never fires week.elapsed.
 *
 * P12: pass and miss are not red-versus-green alone. The word is always shown,
 * and the shape (✓ / ✕) rides with it.
 */
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';

export function GradeDebrief() {
  const model = useQRHud((s) => s.debrief);
  if (!model) return null;
  const pass = model.result === 'pass';

  return (
    <div data-ui style={styles.wrap}>
      <div style={{ ...styles.panel, borderColor: pass ? '#6fbf73' : '#d1695b' }}>
        <div style={styles.label}>{model.label}</div>

        <div style={styles.resultRow}>
          {/* Second cue: the shape. Colour is never the only signal. */}
          <span style={{ ...styles.shape, color: pass ? '#6fbf73' : '#d1695b' }} aria-hidden>
            {model.shape}
          </span>
          <span style={{ ...styles.result, color: pass ? '#6fbf73' : '#d1695b' }}>
            {model.resultLabel}
          </span>
        </div>

        <div style={styles.row}>
          <span style={styles.key}>CARD</span>
          <span style={styles.value}>{model.cardId}</span>
        </div>
        {model.sectionId && (
          <div style={styles.row}>
            <span style={styles.key}>SECTION</span>
            <span style={styles.value}>{model.sectionId}</span>
          </div>
        )}

        <button data-ui style={styles.continue} onClick={() => QuietRoads.continueDebrief()}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 245, display: 'flex',
    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
    fontFamily: 'system-ui, sans-serif',
  },
  panel: {
    pointerEvents: 'auto',
    background: 'rgba(7,8,12,0.94)',
    border: '1px solid',
    borderRadius: 12,
    padding: '18px 22px 16px',
    minWidth: 'min(340px, 88vw)',
    color: '#e8e6e1',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
  },
  label: {
    fontSize: 'calc(11px * var(--qr-text-scale, 1))',
    letterSpacing: '0.22em',
    color: '#8a8f99',
    marginBottom: 6,
  },
  resultRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  shape: { fontSize: 'calc(26px * var(--qr-text-scale, 1))', lineHeight: 1, fontWeight: 800 },
  result: { fontSize: 'calc(20px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.12em' },
  row: { display: 'flex', justifyContent: 'space-between', gap: 14, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.08)' },
  key: { fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.16em', color: '#8a8f99' },
  value: { fontSize: 'calc(13px * var(--qr-text-scale, 1))', color: '#e8e6e1', fontWeight: 600, textAlign: 'right' },
  continue: {
    width: '100%', marginTop: 14, padding: '12px', border: 'none', borderRadius: 8,
    background: '#F28DB2', color: '#1a0a12', cursor: 'pointer',
    fontSize: 'calc(13px * var(--qr-text-scale, 1))', fontWeight: 800, letterSpacing: '0.14em',
  },
};