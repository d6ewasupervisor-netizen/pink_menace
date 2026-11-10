/**
 * CockpitHUD — the one mount point for the Quiet Roads in-cockpit display.
 * Replaces the old stack of GameHUD + KentDash + EngineHUD + QuietHUD. It owns
 * the pause control, hosts the nav strip (KentDash) and the world HUD
 * (noise bar / lights / horn, QuietHUD), and frames the drive in one shared
 * visual language (owner decision, 2026-10-05): one accent (`SCENE_ACCENT`) on
 * every act, one cockpit, the act chip telling you where you are.
 *
 * ITEM 3.3 — the top rail. Before this the pause chip, the act badge, the noise
 * meter, the trade-points chip and the bridge's WIND ASSIST chip each carried its
 * own `top:` and its own idea of the top band, and the meter sat *under* the badge
 * at 390x844. The rail is now one 48 px row — pause · act chip · TP — and nothing
 * else. Its geometry comes from `cockpit/spec.ts` like every other band, so the
 * component owns no absolute coordinate at all.
 *
 * The rail is the driving HUD's top edge and stands down with the rest of it when
 * a card, quiz, choice or debrief is open (the compound surfaces keep their own
 * full-height frame).
 */
import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { KentDash } from './KentDash';
import { QuietHUD } from './QuietHUD';
import { tokens } from './cockpit/tokens';
import { readCockpitState, useCockpitSpec, useDrivingHud } from './cockpit/layout';
import { staleCockpitFlag } from '@/quietroads/cockpit';
import { actForScene, type CardAct } from '@/quietroads';
import { SCENE_ACCENT, specForAct } from './sceneSpec';
import type { CockpitSpec } from './cockpit/spec';

export function CockpitHUD() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const sceneId = useQRStore((s) => s.sceneId);
  const tp = useQRStore((s) => s.vars.trade_points ?? 0);
  const spec = useCockpitSpec();
  // The one derived rule: mission running + nothing compound open = the HUD is
  // the surface. KentDash, the noise bar and the sticks all read it too.
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

  // The rail is part of the driving HUD. A card, a quiz, a choice or a debrief
  // stands it down with the rest of the cockpit; so does pause and the menu.
  const rail = drivingHud && (phase === 'driving' || phase === 'walking');

  // The act chip's words: "ACT VII · The Dark Hours". The ego vehicle used to trail
  // the chip in its own 10 px line; the spec's rail is three things and no more, so
  // the ego lives in the act's own card, not in the always-on furniture.
  const act: CardAct = (sceneId ? actForScene(sceneId) : null) ?? 'I';
  const zone = specForAct(act).zone;

  return (
    <div data-layer="hud" style={styles.root}>
      {/* Accent vignette — the one accent on every act (SCENE_ACCENT). A paint
          treatment, not furniture: it owns no space and no hit target. */}
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

      {/* The top rail: pause · act chip · TP. Nothing else, and nothing above it. */}
      {rail && (
        <div data-layer="rail" style={railStyle(spec)}>
          <button
            data-ui
            data-layer="pause"
            onClick={handlePause}
            aria-label="Pause"
            style={styles.pauseBtn}
          >
            ⏸
          </button>

          <div data-layer="badge" style={styles.badge}>
            <span style={{ color: SCENE_ACCENT, fontWeight: 800, letterSpacing: '0.16em' }}>
              ACT {act}
            </span>
            <span style={{ color: tokens.colors.ink, letterSpacing: '0.1em' }}>
              · {zone}
            </span>
          </div>

          <div data-layer="tp" style={styles.tp}>
            TP {tp}
          </div>
        </div>
      )}

      {/* Nav strip + noise bar carry their own placement from the same spec and
          read the cockpit rule (quietroads/cockpit.ts): a card, a quiz, a debrief
          or a choice stands the driving HUD down, and a running mission brings it
          back regardless of the phase flag. */}
      <KentDash />
      <QuietHUD />
    </div>
  );
}

/**
 * The rail's geometry, straight from the spec: a 48 px row at the top of the
 * viewport, safe area already added. Landscape merges the rail and the nav strip
 * into this one row, so the height is the spec's `rail.height` either way.
 */
function railStyle(spec: CockpitSpec): React.CSSProperties {
  return {
    position: 'fixed',
    top: spec.rail.y,
    left: spec.rail.x,
    width: spec.rail.width,
    height: spec.rail.height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space.sm,
    padding: `0 ${tokens.space.md}px`,
    boxSizing: 'border-box',
    background: 'var(--qr-glass)',
    backdropFilter: 'var(--qr-blur)',
    WebkitBackdropFilter: 'var(--qr-blur)',
    borderBottom: `1px solid ${tokens.colors.stroke}`,
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.ui,
    pointerEvents: 'none',
    zIndex: tokens.z.hud,
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: tokens.z.hud },
  // Inside the rail the pause control is a flex child, not an absolutely placed
  // chip: the rail owns the geometry and this owns the 36 px target.
  pauseBtn: {
    position: 'relative',
    flex: '0 0 auto',
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
  badge: {
    position: 'relative',
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    fontSize: 'var(--qr-type-micro)',
    letterSpacing: '0.06em',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  // TP is a readout, not a target: it sits at the rail's right edge in the one
  // warm colour the cockpit uses for the purse.
  tp: {
    flex: '0 0 auto',
    color: tokens.colors.warn,
    fontWeight: 800,
    fontSize: 'var(--qr-type-micro)',
    letterSpacing: '0.08em',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
};