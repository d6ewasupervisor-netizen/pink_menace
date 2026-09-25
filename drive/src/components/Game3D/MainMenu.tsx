/**
 * MainMenu — shown when phase === 'menu'
 */
import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { ACT_ENTRY, ACT_ORDER, actForScene, challengeForAct } from '@/quietroads';

const BIOME_LABEL: Record<string, string> = {
  city: 'New York',
  highway: 'Pittsburgh',
  rural: 'Denver',
};

export function MainMenu({ onExit }: { onExit?: () => void }) {
  const phase = useGameStore((s) => s.phase);
  const mileage = useGameStore((s) => s.mileage);
  const currentBiome = useGameStore((s) => s.currentBiome);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetProgress = useGameStore((s) => s.resetProgress);

  const handleNewGame = useCallback(() => {
    resetProgress();
    useGameStore.getState().setWorldMode('highway');
    setPhase('driving');
  }, [resetProgress, setPhase]);

  const handleContinue = useCallback(() => {
    useGameStore.getState().setWorldMode('highway');
    setPhase('driving');
  }, [setPhase]);

  const qrCheckpoint = useQRStore((s) => s.checkpoint);
  const qrScene = useQRStore((s) => s.sceneId);
  const handleQuietRoadsContinue = useCallback(() => { QuietRoads.start(false); }, []);

  const continueAct = qrScene ? actForScene(qrScene) : null;

  if (phase !== 'menu') return null;

  const hasSave = mileage > 0;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h1 style={styles.title}>PINK<br />MENACE</h1>
        <p style={styles.subtitle}>QUIET ROADS</p>
        <p style={styles.tagline}>Kent. Grandma's Beetle.</p>

        <div style={styles.btnStack}>
          {qrCheckpoint && (
            <button style={{ ...styles.btn, ...styles.btnContinue }} onClick={handleQuietRoadsContinue}>
              ▶ CONTINUE
              <span style={styles.saveSummary}>
                {continueAct ? `Act ${continueAct} · ${challengeForAct(continueAct).zone}` : `Scene ${qrScene}`} · {qrCheckpoint.replace(/_/g, ' ')}
              </span>
            </button>
          )}
          {ACT_ORDER.map((act) => {
            const challenge = challengeForAct(act);
            if (!challenge.built) return null;
            return (
              <button
                key={act}
                style={{ ...styles.btn, ...(act === 'I' ? styles.btnQuiet : styles.btnAct) }}
                onClick={() => QuietRoads.startAct(ACT_ENTRY[act])}
              >
                ACT {act} · {challenge.zone.toUpperCase()}
                <span style={styles.saveSummary}>{challenge.title}</span>
              </button>
            );
          })}
          <button style={{ ...styles.btn, ...styles.btnNew }} onClick={handleNewGame}>
            🚀 ROAD TRIP (NYC → Spokane)
          </button>

          {hasSave && (
            <button style={{ ...styles.btn, ...styles.btnContinue }} onClick={handleContinue}>
              ▶ CONTINUE
              <span style={styles.saveSummary}>
                Mile {Math.round(mileage)} • {BIOME_LABEL[currentBiome] ?? 'En Route'}
              </span>
            </button>
          )}

          {onExit && (
            <button style={{ ...styles.btn, ...styles.btnExit }} onClick={onExit}>
              ← Dashboard
            </button>
          )}
        </div>

        <p style={styles.credit}>Ali's Aigoo Apocalypse</p>
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
    border: 'none',
    minHeight: '52px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'opacity 0.15s',
  },
  btnNew: {
    background: 'transparent',
    color: '#ede7dc',
    border: '1px solid #3a3230',
    fontSize: '16px',
    letterSpacing: '0.04em',
  },
  btnAct: {
    background: '#1b1716',
    color: '#ede7dc',
    border: '1px solid #3a3230',
    fontSize: '15px',
  },
  btnQuiet: {
    background: 'linear-gradient(90deg, #9a3d4d, #c45a68)',
    color: '#f4eee6',
    boxShadow: 'none',
    fontSize: '17px',
    letterSpacing: '0.04em',
  },
  btnContinue: {
    background: '#1b1716',
    color: '#8fb58a',
    border: '1px solid #8fb58a',
  },
  saveSummary: {
    fontSize: '11px',
    color: '#9a9186',
    fontWeight: 400,
  },
  btnExit: {
    background: 'transparent',
    color: '#9a9186',
    border: '1px solid #3a3230',
  },
  credit: {
    color: '#3a3230',
    fontSize: '11px',
    letterSpacing: '0.1em',
  },
};
