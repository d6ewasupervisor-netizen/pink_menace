/**
 * GameHUD — Heads-up display rendered in the HTML layer
 */
import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useCompactHud } from '@/hooks/useCompactHud';
import { Speedometer } from './Speedometer';

// ─── Bar ──────────────────────────────────────────────────────────────────────
function Bar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const barColor = color === 'fuel' && value < 25 ? '#ff4444' : color;
  return (
    <div style={{ minWidth: '90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ color: '#888', fontSize: '10px' }}>{label}</span>
        <span style={{ color: barColor, fontSize: '10px', fontWeight: 700 }}>
          {Math.round(value)}
        </span>
      </div>
      <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: barColor,
          borderRadius: '4px',
          transition: 'width 0.2s',
        }} />
      </div>
    </div>
  );
}

// ─── Biome city labels ────────────────────────────────────────────────────────
const BIOME_LABEL: Record<string, string> = {
  city: 'New York → Pittsburgh',
  highway: 'Pittsburgh → Denver',
  rural: 'Denver → Spokane',
};

// ─── HUD ──────────────────────────────────────────────────────────────────────
export function GameHUD() {
  const mileage = useGameStore((s) => s.mileage);
  const currentBiome = useGameStore((s) => s.currentBiome);
  const zCoins = useGameStore((s) => s.zCoins);
  const velocityMph = useGameStore((s) => s.velocityMph);
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const streak = useGameStore((s) => s.streak);
  const phase = useGameStore((s) => s.phase);
  const worldMode = useGameStore((s) => s.worldMode);
  const setPhase = useGameStore((s) => s.setPhase);
  const compact = useCompactHud();

  const handlePause = useCallback(() => setPhase('paused'), [setPhase]);

  if (phase !== 'driving') return null;

  const kent = worldMode === 'kent';
  if (kent) {
    return (
      <div style={styles.hud}>
        <div style={{ ...styles.topRow, background: 'none', justifyContent: 'flex-end' }}>
          <div style={styles.topRight}>
            <button style={styles.pauseBtn} onClick={handlePause} aria-label="Pause">
              ⏸
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.min(mileage / 2800, 1);

  return (
    <div style={styles.hud}>
      {/* Top row */}
      <div style={styles.topRow}>
        <div style={styles.topLeft}>
          <div style={styles.mileage}>{Math.round(mileage)} mi</div>
          {!compact && <div style={styles.biomeLabel}>{BIOME_LABEL[currentBiome]}</div>}
          {compact && (
            <div style={styles.compactBars}>
              <Bar value={hp} color="#ff6b6b" label="HP" />
              <Bar value={fuel} color={fuel < 25 ? '#ff4444' : '#39ff14'} label="FUEL" />
            </div>
          )}
        </div>

        {!compact && (
          <div style={styles.topCenter}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
            </div>
            <div style={styles.progressLabel}>NYC → SPOKANE</div>
          </div>
        )}

        <div style={styles.topRight}>
          <span style={styles.coins}>💰 {zCoins}</span>
          {compact && streak > 0 && <span style={styles.compactStreak}>🔥 {streak}</span>}
          <button style={styles.pauseBtn} onClick={handlePause} aria-label="Pause">
            ⏸
          </button>
        </div>
      </div>

      {!compact && (
        <div style={styles.bottomRow}>
          <div style={styles.speedoBox}>
            <Speedometer mph={velocityMph} />
          </div>
          <div style={styles.barsBox}>
            <Bar value={hp} color="#ff6b6b" label="HP" />
            <Bar value={fuel} color={fuel < 25 ? '#ff4444' : '#39ff14'} label="FUEL" />
          </div>
          {streak > 0 && (
            <div style={styles.streakBox}>
              <div style={styles.streakLabel}>🔥</div>
              <div style={styles.streakValue}>{streak}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
  },
  topLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  mileage: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  biomeLabel: {
    color: '#aaa',
    fontSize: '10px',
    marginTop: '2px',
  },
  topCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    padding: '0 16px',
  },
  progressTrack: {
    width: '100%',
    maxWidth: '220px',
    height: '6px',
    background: '#333',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff00ff, #39ff14)',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  progressLabel: {
    color: '#666',
    fontSize: '9px',
    letterSpacing: '0.08em',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  },
  coins: {
    color: '#ffd93d',
    fontSize: '14px',
    fontWeight: 700,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  pauseBtn: {
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid #555',
    borderRadius: '6px',
    color: 'white',
    fontSize: '16px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'flex-end',
    padding: '8px 12px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
    gap: '12px',
  },
  speedoBox: {},
  barsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    maxWidth: '180px',
  },
  streakBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '8px',
    padding: '6px 10px',
    border: '1px solid #ff6b6b',
    marginLeft: 'auto',
  },
  streakLabel: { fontSize: '16px' },
  streakValue: { color: '#ff6b6b', fontSize: '14px', fontWeight: 700 },
  compactBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 6,
    minWidth: 88,
  },
  compactStreak: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: 700,
  },
};
