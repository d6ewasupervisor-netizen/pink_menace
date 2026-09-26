/**
 * MainMenu — a minimal launch card shown only when phase === 'menu'.
 * Quiet Roads is the single student surface: the player resumes straight into
 * the story, or starts a fresh run at the Act I cold open. There is no act list
 * or legacy "road trip" mode to choose from anymore.
 */
import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';

export function MainMenu({ onExit }: { onExit?: () => void }) {
  const phase = useGameStore((s) => s.phase);
  const checkpoint = useQRStore((s) => s.checkpoint);

  const handleContinue = useCallback(() => { QuietRoads.start(false); }, []);
  const handleNewRun = useCallback(() => { QuietRoads.start(true); }, []);

  if (phase !== 'menu') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>PINK<br />MENACE</h1>
        <p style={styles.subtitle}>QUIET ROADS</p>
        <p style={styles.tagline}>Kent. Grandma's Beetle.</p>

        <div style={styles.btnStack}>
          {checkpoint && (
            <button style={{ ...styles.btn, ...styles.btnContinue }} onClick={handleContinue}>
              ▶ CONTINUE
              <span style={styles.saveSummary}>{checkpoint.replace(/_/g, ' ')}</span>
            </button>
          )}
          <button style={{ ...styles.btn, ...styles.btnNew }} onClick={handleNewRun}>
            {checkpoint ? 'START NEW RUN' : 'BEGIN'}
          </button>

          {onExit && (
            <button style={{ ...styles.btn, ...styles.btnExit }} onClick={onExit}>
              ← Dashboard
            </button>
          )}
        </div>

        <p style={styles.credit}>The Quarantine Runs</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#121010',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 300,
    pointerEvents: 'auto',
    overflow: 'auto',
    padding: '1.5rem 0',
  },
  container: {
    textAlign: 'center',
    padding: '2rem',
    maxWidth: '380px',
    width: '100%',
  },
  title: {
    color: '#c45a68',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 400,
    fontSize: '32px',
    lineHeight: 1.1,
    letterSpacing: '0.14em',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#9a9186',
    fontSize: '13px',
    letterSpacing: '0.18em',
    marginBottom: '0.25rem',
  },
  tagline: {
    color: '#ede7dc',
    fontSize: '14px',
    marginBottom: '2rem',
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  btn: {
    borderRadius: '10px',
    padding: '0.9rem 1.5rem',
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer',
    border: '1px solid',
    minHeight: '52px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'opacity 0.15s',
  },
  btnNew: {
    background: 'linear-gradient(90deg, #9a3d4d, #c45a68)',
    color: '#f4eee6',
    borderColor: 'transparent',
    fontSize: '17px',
    letterSpacing: '0.04em',
  },
  btnContinue: {
    background: '#1b1716',
    color: '#8fb58a',
    borderColor: '#8fb58a',
  },
  saveSummary: {
    fontSize: '11px',
    color: '#9a9186',
    fontWeight: 400,
  },
  btnExit: {
    background: 'transparent',
    color: '#9a9186',
    borderColor: '#3a3230',
  },
  credit: {
    color: '#3a3230',
    fontSize: '11px',
    letterSpacing: '0.1em',
  },
};
