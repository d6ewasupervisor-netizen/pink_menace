/**
 * CockpitHUD — the one mount point for the Quiet Roads in-cockpit display.
 * Replaces the old stack of GameHUD + KentDash + EngineHUD + QuietHUD. It owns
 * the pause control, hosts the nav cluster (KentDash) and the world HUD
 * (noise / horn / trade-points, QuietHUD), and frames the drive in one shared
 * visual language (owner decision, 2026-10-05): one accent (`SCENE_ACCENT`) on
 * every act, one cockpit, the act badge telling you where you are. Reacts to
 * orientation.
 */
import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { KentDash } from './KentDash';
import { QuietHUD } from './QuietHUD';
import { tokens, useOrientation } from './cockpit/tokens';
import { actForScene, challengeForAct, type CardAct } from '@/quietroads';
import { SCENE_ACCENT, specForAct } from './sceneSpec';

export function CockpitHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const sceneId = useQRStore((s) => s.sceneId);
  const orientation = useOrientation();

  const handlePause = useCallback(() => setPhase('paused'), [setPhase]);

  if (worldMode !== 'kent') return null;

  // Pause is reachable during the live world (driving / walking). Quiet roads
  // hide it in dialogue, card, quiz and pause so those surfaces stay clean.
  const showPause = phase === 'driving' || phase === 'walking';

  // Per-act scene identity: the act, its zone, and its ego vehicle.
  const act: CardAct = (sceneId ? actForScene(sceneId) : null) ?? 'I';
  const spec = specForAct(act);
  const ego = challengeForAct(act).vehicle.split(' — ')[0] ?? 'the Menace';

  return (
    <div style={styles.root}>
      {/* Accent vignette — the one accent on every act (SCENE_ACCENT) */}
      {phase === 'driving' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 130px ${SCENE_ACCENT}33, inset 0 0 3px ${SCENE_ACCENT}66`,
          }}
        />
      )}

      {showPause && (
        <button
          data-ui
          onClick={handlePause}
          aria-label="Pause"
          style={{ ...styles.pauseBtn, ...(orientation === 'landscape' ? styles.pauseLandscape : null) }}
        >
          ⏸
        </button>
      )}

      {/* Act badge — which scene you're in, in the one accent */}
      {(phase === 'driving' || phase === 'walking') && (
        <div style={{ ...styles.badge, ...(orientation === 'landscape' ? styles.badgeLandscape : null) }}>
          <span style={{ color: SCENE_ACCENT, fontWeight: 800, letterSpacing: '0.16em' }}>
            ACT {act}
          </span>
          <span style={{ color: tokens.colors.ink, letterSpacing: '0.1em' }}>
            · {spec.zone.toUpperCase()}
          </span>
          <span style={{ color: tokens.colors.muted, fontSize: 'calc(10px * var(--qr-text-scale, 1))', letterSpacing: '0.06em' }}>
            {ego}
          </span>
        </div>
      )}

      {/* Nav cluster + world HUD carry their own placement; they gate on
          worldMode/phase themselves and share these tokens. */}
      <KentDash />
      <QuietHUD />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: tokens.z.hud },
  pauseBtn: {
    position: 'absolute',
    top: 'calc(10px + env(safe-area-inset-top))',
    left: 12,
    background: 'rgba(0,0,0,0.5)',
    border: `1px solid ${tokens.colors.strokeSoft}`,
    borderRadius: tokens.radius.sm,
    color: tokens.colors.ink,
    fontSize: 'calc(16px * var(--qr-text-scale, 1))',
    width: 36,
    height: 36,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    touchAction: 'manipulation',
  },
  pauseLandscape: {
    top: 'calc(10px + env(safe-area-inset-top))',
    left: 'auto',
    right: 12,
  },
  badge: {
    position: 'absolute',
    top: 'calc(66px + env(safe-area-inset-top))',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontSize: 'calc(11px * var(--qr-text-scale, 1))',
    padding: '3px 10px',
    borderRadius: tokens.radius.sm,
    background: 'rgba(0,0,0,0.45)',
    border: `1px solid ${tokens.colors.stroke}`,
    whiteSpace: 'nowrap',
  },
  badgeLandscape: {
    top: 'calc(12px + env(safe-area-inset-top))',
    left: 'auto',
    right: 'auto',
    transform: 'translateX(-50%)',
  },
};