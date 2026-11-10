/**
 * StrandedContinue — the last way out of a story wait nothing answers.
 *
 * The bridge names a wait that has stood 8 s with no mission and no surface
 * (`qrHud.stranded`) and puts this control up in the body band. Clicking it
 * fires the awaited event on the game's own bus, so a blank frame is never a
 * dead end. Mounted beside DialogueBox rather than inside CockpitHUD: the
 * dialogue layer's cutscene tap-catcher is a full-screen element at z 228, and a
 * chip inside the HUD's stacking context (z 50) would sit under it and be
 * unclickable for a real player too.
 */
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useCockpitSpec, worldBandStyle } from './cockpit/layout';
import { tokens } from './cockpit/tokens';

export function StrandedContinue() {
  const stranded = useQRHud((s) => s.stranded);
  const worldMode = useGameStore((s) => s.worldMode);
  const spec = useCockpitSpec();
  if (worldMode !== 'kent' || !stranded) return null;

  return (
    <div
      data-layer="stranded"
      data-stranded-scene={stranded.scene}
      data-stranded-node={stranded.node}
      data-stranded-event={stranded.event}
      style={{ ...worldBandStyle(spec), zIndex: tokens.z.stranded }}
    >
      <button data-ui data-layer="continue" onClick={() => QuietRoads.continueStranded()} style={styles.button}>
        Continue
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    pointerEvents: 'auto',
    touchAction: 'manipulation',
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.62)',
    border: `1px solid ${tokens.colors.stroke}`,
    borderRadius: tokens.radius.sm,
    color: tokens.colors.ink,
    font: 'inherit',
    fontSize: 'calc(13px * var(--qr-text-scale, 1))',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '10px 22px',
  },
};
