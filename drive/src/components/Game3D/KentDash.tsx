/**
 * KentDash — the nav strip and the objective line, and nothing else.
 *
 * WHAT WAS HERE: a 374×143 cluster at 390×844 holding a top-down street map painted
 * into a canvas, a 7-segment speedometer, a clock, a LIMIT sign, two resource bars and
 * the objective. Measured, it was the single biggest thing between the player and the
 * road: with it and the rest of the furniture the world band was 216 px (26 %). It also
 * drew the road as a squiggle, which is a map of the street the player is looking at.
 *
 * WHAT IS HERE NOW (item 3.3):
 *
 *   nav strip 56 px   [↰] 0.4 mi · Vantage Bridge        28/45   AUTO 40
 *   objective 40 px   "Cross the bridge. Under 45. Steer into the gust."
 *
 * The strip is the only always-on text in a drive. The objective shows when it
 * changes, when the player taps the strip, and while the mission is asking for a
 * specific action (`cockpit/objective.ts` owns those rules, with tests); otherwise it
 * collapses and the world gets the 40 px back, plus the resource tag's line.
 *
 * Everything is positioned from `cockpit/spec.ts` — the component has no absolute
 * coordinate of its own, which is the rule item 3.2 makes.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { liveDrive } from '@/systems/driveTelemetry';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useCockpitSpec, useDrivingHud } from './cockpit/layout';
import { objectiveVisible, resourceTagText, resourceTagVisible } from './cockpit/objective';
import { formatManeuverDist, planNav, type ManeuverKind, type NavPlan } from './kentNav';
import { tokens } from './cockpit/tokens';
import type { CockpitSpec } from './cockpit/spec';

/** The strip's text changes at a human rate; 2 Hz is generous and costs no frame time. */
const TICK_MS = 500;

interface Readout {
  mph: number;
  over: boolean;
  plan: NavPlan;
  limit: number;
}

function pose() {
  const g = useGameStore.getState();
  if (g.phase === 'walking') {
    return { x: g.walkerPosition[0], y: g.walkerPosition[2], heading: QuietRoads.sim.walker.facing };
  }
  const yaw = g.vehicleHeading;
  return {
    x: g.vehiclePosition[0],
    y: g.vehiclePosition[2],
    heading: Math.atan2(-Math.cos(yaw), -Math.sin(yaw)),
  };
}

export function KentDash() {
  const worldMode = useGameStore((s) => s.worldMode);
  // Not `phase === 'driving'`: the strip is part of the driving HUD the cockpit rule
  // owns (quietroads/cockpit.ts), so a stale phase cannot hide it mid-mission.
  const driving = useDrivingHud();
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const objective = useQRHud((s) => s.objective);
  const qteActive = useQRHud((s) => s.qteActive);
  const missionActive = useQRHud((s) => s.missionActive);
  const assist = useQRHud((s) => s.windAssist);
  const spec = useCockpitSpec();

  const [readout, setReadout] = useState<Readout>(() => ({
    mph: 0,
    over: false,
    plan: planNav({ x: 0, y: 0 }, 0, null),
    limit: 25,
  }));

  // ── the objective's own clock, and its tap ──────────────────────────────
  const changedAt = useRef(0);
  const [tappedAt, setTappedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    changedAt.current = performance.now();
    setTappedAt(null);
  }, [objective]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // ── the strip's numbers, at 2 Hz ────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const g = useGameStore.getState();
      if (g.worldMode !== 'kent') return;
      const here = pose();
      const dest = QuietRoads.sim.navTarget();
      const plan = planNav(here, here.heading, dest ? { x: dest.pos.x, y: dest.pos.y, label: dest.label } : null);
      const limit = useQRHud.getState().frame?.speedLimitMph ?? 25;
      const mph = Math.round(Math.max(0, liveDrive.velocityMph));
      setReadout({ mph, over: mph > limit + 2, plan, limit });
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // ── the HP/FUEL tag: only when it has something to say ──────────────────
  const changedResources = useRef(0);
  const [seen, setSeen] = useState({ hp, fuel });
  if (hp !== seen.hp || fuel !== seen.fuel) {
    setSeen({ hp, fuel });
    changedResources.current = performance.now();
  }

  if (worldMode !== 'kent') return null;
  if (!driving) return null;

  const resources = { hp, fuel, maxHp: 100, maxFuel: 100, changedAt: changedResources.current, now };
  const tag = resourceTagVisible(resources) ? resourceTagText(resources) : null;
  const showObjective =
    Boolean(objective) &&
    objectiveVisible({ changedAt: changedAt.current, tappedAt, subStep: missionActive && qteActive, now });

  const speedColor = readout.over ? tokens.colors.wrong : tokens.colors.cyan;
  const assistTag = assist ? `AUTO ${assist.holdMph}` : null;

  return (
    <>
      <div
        data-layer="nav"
        data-band="nav"
        role="button"
        aria-label="Navigation"
        onPointerDown={() => setTappedAt(performance.now())}
        style={navStyle(spec)}
      >
        <TurnGlyph kind={readout.plan.kind} size={26} />
        <div style={textStyle}>
          <div style={{ ...distStyle, fontSize: 'var(--qr-type-title)' }}>
            {readout.plan.hasDest ? formatManeuverDist(readout.plan.distM) : '—'}
            <span style={{ color: tokens.colors.muted, fontWeight: 600 }}> · </span>
            <span style={streetStyle}>{readout.plan.street || 'Kent'}</span>
          </div>
          <div style={{ ...subStyle, color: tag ? tokens.colors.warn : tokens.colors.muted }}>
            {tag ?? ' '}
          </div>
        </div>
        <div style={speedStyle}>
          <span style={{ color: speedColor, fontSize: 'var(--qr-type-readout)', fontWeight: 800, lineHeight: 1 }}>
            {readout.mph}
          </span>
          <span style={{ color: tokens.colors.muted, fontSize: 'var(--qr-type-micro)', fontWeight: 700 }}>
            /{readout.limit}
          </span>
        </div>
        {assistTag && (
          <div data-assist="wind" style={assistTagStyle}>
            {assistTag}
          </div>
        )}
      </div>

      {showObjective && (
        <div data-band="objective" style={objectiveStyle(spec)}>
          {objective}
        </div>
      )}
    </>
  );
}

/** The strip: the nav band from the spec, glass, one row. */
function navStyle(spec: CockpitSpec): React.CSSProperties {
  return {
    position: 'fixed',
    top: spec.nav.y,
    left: spec.nav.x,
    width: spec.nav.width,
    height: Math.max(44, spec.nav.height),
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space.sm,
    padding: `0 ${tokens.space.md}px`,
    boxSizing: 'border-box',
    background: 'var(--qr-glass)',
    backdropFilter: 'var(--qr-blur)',
    WebkitBackdropFilter: 'var(--qr-blur)',
    borderBottom: `1px solid ${tokens.colors.stroke}`,
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.ui,
    pointerEvents: 'auto',
    zIndex: tokens.z.hud + 1,
  };
}

const textStyle: React.CSSProperties = { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 };
const distStyle: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
const streetStyle: React.CSSProperties = { fontWeight: 600, color: tokens.colors.body };
const subStyle: React.CSSProperties = {
  fontSize: 'var(--qr-type-micro)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  minHeight: 14,
};
const speedStyle: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 2, flex: '0 0 auto' };
const assistTagStyle: React.CSSProperties = {
  flex: '0 0 auto',
  padding: '2px 6px',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.colors.cyan}66`,
  color: tokens.colors.cyan,
  fontSize: 'var(--qr-type-micro)',
  fontWeight: 800,
  letterSpacing: '0.1em',
  whiteSpace: 'nowrap',
};

/** The objective: the band under the strip, glass, then gone again. */
function objectiveStyle(spec: CockpitSpec): React.CSSProperties {
  return {
    position: 'fixed',
    top: spec.objective.y,
    left: spec.objective.x,
    width: spec.objective.width,
    height: Math.max(28, spec.objective.height),
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${tokens.space.md}px`,
    boxSizing: 'border-box',
    background: 'linear-gradient(180deg, rgba(8,10,16,0.72), rgba(8,10,16,0.28))',
    backdropFilter: 'var(--qr-blur)',
    WebkitBackdropFilter: 'var(--qr-blur)',
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.ui,
    fontSize: 'var(--qr-type-body)',
    fontWeight: 600,
    lineHeight: 1.25,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: tokens.z.hud + 1,
  };
}

/** One manoeuvre arrow: a turn is read in a glance or not at all. */
function TurnGlyph({ kind, size }: { kind: ManeuverKind; size: number }) {
  const sw = 5;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden style={{ flex: '0 0 auto' }}>
      <g stroke="#fff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        {kind === 'straight' && (<><path d="M24 42 V16" /><path d="M13 26 L24 12 L35 26" /></>)}
        {kind === 'right' && (<><path d="M16 42 V24 H34" /><path d="M24 14 L36 24 L24 34" /></>)}
        {kind === 'left' && (<><path d="M32 42 V24 H14" /><path d="M24 14 L12 24 L24 34" /></>)}
        {kind === 'slight-right' && (<><path d="M18 42 L26 28 L36 16" /><path d="M24 14 L38 14 L32 26" /></>)}
        {kind === 'slight-left' && (<><path d="M30 42 L22 28 L12 16" /><path d="M24 14 L10 14 L16 26" /></>)}
        {kind === 'uturn' && (<><path d="M34 42 V26 A10 10 0 0 0 14 26 V34" /><path d="M8 26 L14 38 L20 26" /></>)}
      </g>
      {kind === 'arrive' && (
        <path fill="#fff" d="M24 4c-6.2 0-11 4.7-11 10.6C13 23 24 42 24 42s11-19 11-27.4C35 8.7 30.2 4 24 4zm0 14.2a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6z" />
      )}
    </svg>
  );
}
