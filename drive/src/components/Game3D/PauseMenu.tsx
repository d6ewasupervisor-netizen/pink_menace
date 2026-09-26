/**
 * PauseMenu — shown when phase === 'paused'
 */
import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { controlsSchemeLabel } from '@/input/driveInput';

export function PauseMenu({ onExit }: { onExit?: () => void }) {
  const phase = useGameStore((s) => s.phase);
  const mileage = useGameStore((s) => s.mileage);
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const zCoins = useGameStore((s) => s.zCoins);
  const questionsAnswered = useGameStore((s) => s.questionsAnswered);
  const correctAnswers = useGameStore((s) => s.correctAnswers);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const controlsScheme = useGameStore((s) => s.controlsScheme);
  const cycleControlsScheme = useGameStore((s) => s.cycleControlsScheme);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const { saveProgress } = useGameProgress();
  const worldMode = useGameStore((s) => s.worldMode);
  const prePausePhase = useGameStore((s) => s.prePausePhase);
  const qrScene = useQRStore((s) => s.sceneId);
  const qrCheckpoint = useQRStore((s) => s.checkpoint);
  const tp = useQRStore((s) => s.vars.trade_points ?? 0);
  const objective = useQRHud((s) => s.objective);
  const kent = worldMode === 'kent';

  const accuracy = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  const handleResume = useCallback(() => {
    setPhase(prePausePhase === 'walking' ? 'walking' : 'driving');
  }, [prePausePhase, setPhase]);

  const handleSaveExit = useCallback(async () => {
    if (kent) {
      setPhase('menu');
      onExit?.();
      return;
    }
    await saveProgress({
      currentMile: mileage,
      hp,
      fuel,
      zCoins,
      questionsAnswered,
      correctAnswers,
      completedEncounters: [],
      lastSaveLocation: 'En Route',
    });
    setPhase('menu');
    onExit?.();
  }, [kent, mileage, hp, fuel, zCoins, questionsAnswered, correctAnswers, saveProgress, setPhase, onExit]);

  const handleRestart = useCallback(() => {
    if (kent) {
      QuietRoads.start(true);
      return;
    }
    resetProgress();
    setPhase('driving');
  }, [kent, resetProgress, setPhase]);

  if (phase !== 'paused') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>⏸ PAUSED</h2>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {kent ? (
            <>
              <StatRow label="Scene" value={qrScene ? String(qrScene) : 'Kent'} />
              {qrCheckpoint && <StatRow label="Checkpoint" value={qrCheckpoint.replace(/_/g, ' ')} />}
              {objective && <StatRow label="Objective" value={objective} />}
              <StatRow label="TP" value={String(Math.round(tp))} color="#ffd93d" />
            </>
          ) : (
            <>
              <StatRow label="Mile" value={`${Math.round(mileage)} / 2800`} />
              <StatRow label="HP" value={`${hp}%`} color="#ff6b6b" />
              <StatRow label="Fuel" value={`${Math.round(fuel)}%`} color={fuel < 25 ? '#ff4444' : '#39ff14'} />
              <StatRow label="Z-Coins" value={`💰 ${zCoins}`} color="#ffd93d" />
              <StatRow label="Accuracy" value={`${accuracy}%`} />
            </>
          )}
        </div>

        <div style={styles.btnStack}>
          <button
            style={{ ...styles.btn, ...styles.btnControls }}
            onClick={cycleControlsScheme}
          >
            CONTROLS · {controlsSchemeLabel(controlsScheme)}
          </button>
          <button style={{ ...styles.btn, ...styles.btnControls }} onClick={toggleMute}>
            {isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
          </button>
          <button style={{ ...styles.btn, ...styles.btnResume }} onClick={handleResume}>
            ▶ RESUME
          </button>
          <button style={{ ...styles.btn, ...styles.btnSaveExit }} onClick={handleSaveExit}>
            💾 SAVE & EXIT
          </button>
          <button style={{ ...styles.btn, ...styles.btnRestart }} onClick={handleRestart}>
            🔄 RESTART
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #3a3230' }}>
      <span style={{ color: '#9a9186', fontSize: '13px' }}>{label}</span>
      <span style={{ color: color ?? 'white', fontSize: '13px', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── Victory screen ───────────────────────────────────────────────────────────
export function VictoryScreen({ onExit }: { onExit?: () => void }) {
  const phase = useGameStore((s) => s.phase);
  const zCoins = useGameStore((s) => s.zCoins);
  const questionsAnswered = useGameStore((s) => s.questionsAnswered);
  const correctAnswers = useGameStore((s) => s.correctAnswers);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const { completeJourney } = useGameProgress();

  const accuracy = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  const handleDashboard = useCallback(async () => {
    await completeJourney({ questionsAnswered, correctAnswers, zCoins });
    resetProgress();
    onExit?.();
  }, [questionsAnswered, correctAnswers, zCoins, completeJourney, resetProgress, onExit]);

  if (phase !== 'victory') return null;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '0.5rem' }}>🏆</div>
        <h2 style={{ color: '#ffd93d', fontSize: '28px', marginBottom: '0.25rem' }}>YOU MADE IT!</h2>
        <p style={{ color: '#39ff14', marginBottom: '1.5rem' }}>
          Spokane, WA — Journey Complete!
        </p>
        <div style={styles.statsGrid}>
          <StatRow label="Z-Coins Earned" value={`💰 ${zCoins}`} color="#ffd93d" />
          <StatRow label="Questions" value={`${questionsAnswered}`} />
          <StatRow label="Accuracy" value={`${accuracy}%`} color="#39ff14" />
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnResume, marginTop: '1.5rem' }}
          onClick={handleDashboard}
        >
          → Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Game Over screen ─────────────────────────────────────────────────────────
export function GameOverScreen() {
  const phase = useGameStore((s) => s.phase);
  const resetProgress = useGameStore((s) => s.resetProgress);

  if (phase !== 'gameover') return null;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '0.5rem' }}>💀</div>
        <h2 style={{ color: '#ff4444', fontSize: '28px', marginBottom: '0.5rem' }}>GAME OVER</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>Your HP dropped to zero!</p>
        <button
          style={{ ...styles.btn, ...styles.btnRestart }}
          onClick={resetProgress}
        >
          🔄 TRY AGAIN
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(18,16,16,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 250,
    padding: '1rem',
    pointerEvents: 'auto',
  },
  modal: {
    background: '#1b1716',
    border: '1px solid #9a3d4d',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '380px',
    width: '100%',
    color: '#ede7dc',
  },
  title: {
    color: '#c45a68',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 400,
    letterSpacing: '0.12em',
    fontSize: '22px',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  statsGrid: {
    marginBottom: '1.5rem',
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btn: {
    borderRadius: '8px',
    padding: '0.8rem',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    border: 'none',
    minHeight: '48px',
    letterSpacing: '0.03em',
  },
  btnControls: {
    background: '#1b1716',
    color: '#ede7dc',
    border: '1px solid #3a3230',
  },
  btnResume: {
    background: 'linear-gradient(90deg, #9a3d4d, #c45a68)',
    color: '#f4eee6',
  },
  btnSaveExit: {
    background: 'transparent',
    color: '#ede7dc',
    border: '1px solid #3a3230',
  },
  btnRestart: {
    background: '#3a1a1a',
    color: '#ff6b6b',
    border: '1px solid #ff6b6b',
  },
};
