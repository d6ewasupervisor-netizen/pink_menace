/**
 * CockpitHUD — the one mount point for the Quiet Roads in-cockpit display.
 * Replaces the old stack of GameHUD + KentDash + EngineHUD + QuietHUD. It owns
 * the pause control, hosts the nav cluster (KentDash) and the world HUD
 * (noise / horn / trade-points, QuietHUD), and frames the drive in one shared
 * visual language (owner decision, 2026-10-05): one accent (`SCENE_ACCENT`) on
 * every act, one cockpit, the act badge telling you where you are. Reacts to
 * orientation.
 */
import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { KentDash } from './KentDash';
import { QuietHUD } from './QuietHUD';
import { tokens, useOrientation } from './cockpit/tokens';
import { readCockpitState, useDrivingHud } from './cockpit/layout';
import { staleCockpitFlag } from '@/quietroads/cockpit';
import { actForScene, challengeForAct, type CardAct } from '@/quietroads';
import { SCENE_ACCENT, specForAct } from './sceneSpec';

export function CockpitHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const sceneId = useQRStore((s) => s.sceneId);
  const orientation = useOrientation();
  // The one derived rule: mission running + nothing compound open = the HUD is
  // the surface. KentDash, the noise meter and the sticks all read it too.
  const drivingHud = useDrivingHud();

  // Safety net: a mission is running, nothing compound is open, and the car is
  // nevertheless not the surface. Wait a beat so a normal transition is never
  // fought, then name the stale flag out loud and hand the car back.
  useEffect(() => {
    const state = readCockpitState();
    if (!drivingHud) return;
    if (!state.missionActive) return;
    if (state.cardOpen || state.choiceOpen || state.debriefOpen || state.quizOpen) return;
    // A spoken line owns the screen (the scene hands the car back on idle), and
    // pause / menu are the player's own.
    if (state.storyOnScreen) return;
    if (phase === 'driving' || phase === 'walking' || phase === 'paused' || phase === 'menu') return;
    const t = window.setTimeout(() => {
      const again = readCockpitState();
      if (again.phase !== phase) return; // it moved on its own; nothing to repair
      if (again.storyOnScreen) return; // a line arrived; leave it
      const flag = staleCockpitFlag(again) ?? `phase="${again.phase}"`;
      console.warn(`[cockpit] ${flag} never cleared after the mission started — restoring the driving HUD.`);
      QuietRoads.restoreDrivingHud(flag);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [drivingHud, phase]);

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
    <div data-layer="hud" style={styles.root}>
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
          data-layer="pause"
          onClick={handlePause}
          aria-label="Pause"
          style={{ ...styles.pauseBtn, ...(orientation === 'landscape' ? styles.pauseLandscape : null) }}
        >
          ⏸
        </button>
      )}

      {/* Act badge — which scene you're in, in the one accent */}
      {(phase === 'driving' || phase === 'walking') && (
        <div data-layer="badge" style={{ ...styles.badge, ...(orientation === 'landscape' ? styles.badgeLandscape : null) }}>
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

      {/* Nav cluster + world HUD carry their own placement and share these
          tokens. Both read the cockpit rule (quietroads/cockpit.ts): a card, a
          quiz, a debrief or a choice stands the driving HUD down, and a running
          mission brings it back regardless of the phase flag. */}
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
    // Landscape keeps the badge in the left column (the pause chip owns the right
    // edge). `left: auto` plus a -50% translate used to push half of it off screen.
    top: 'calc(10px + env(safe-area-inset-top))',
    left: 12,
    right: 'auto',
    transform: 'none',
  },
};