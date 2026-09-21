/**
 * KentDash — one navigation cluster for Quiet Roads.
 * The map is a view from above and behind the car: the chevron sits low,
 * the scale is pulled back, and the street ahead fills the glass.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useCompactHud } from '@/hooks/useCompactHud';
import { dashEdge, type DashEdge } from '@/input/driveInput';
import {
  formatEta,
  formatManeuverDist,
  planNav,
  type ManeuverKind,
  type NavPlan,
} from './kentNav';

const PX_PER_M = 0.95;
const DIGIT_MASK: Record<string, number> = {
  '0': 0x3f,
  '1': 0x06,
  '2': 0x5b,
  '3': 0x4f,
  '4': 0x66,
  '5': 0x6d,
  '6': 0x7d,
  '7': 0x07,
  '8': 0x7f,
  '9': 0x6f,
};

interface Readout {
  mph: number;
  over: boolean;
  clock: string;
  plan: NavPlan;
  limit: number;
  driving: boolean;
}

function clockNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function pose() {
  const g = useGameStore.getState();
  const walking = g.phase === 'walking';
  if (walking) {
    return {
      x: g.walkerPosition[0],
      y: g.walkerPosition[2],
      heading: QuietRoads.sim.walker.facing,
    };
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
  const phase = useGameStore((s) => s.phase);
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const objective = useQRHud((s) => s.objective);
  const scheme = useGameStore((s) => s.controlsScheme);
  const compact = useCompactHud();
  const edge: DashEdge = compact ? dashEdge(scheme) : 'top';
  const stacked = compact && edge !== 'top';
  const rootRef = useRef<HTMLDivElement>(null);
  const gapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [readout, setReadout] = useState<Readout>(() => ({
    mph: 0,
    over: false,
    clock: clockNow(),
    plan: planNav({ x: 0, y: 0 }, 0, null),
    limit: 25,
    driving: true,
  }));

  useEffect(() => {
    let raf = 0;
    let alive = true;
    let sig = '';
    const tick = () => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const gap = gapRef.current;
      const here = pose();
      const dest = QuietRoads.sim.navTarget();
      const plan = planNav(here, here.heading, dest ? { x: dest.pos.x, y: dest.pos.y, label: dest.label } : null);
      if (root && canvas) paintMap(canvas, root, gap, here, plan);
      const g = useGameStore.getState();
      const hud = useQRHud.getState();
      const limit = hud.frame?.speedLimitMph ?? 25;
      const mph = Math.round(Math.max(0, g.velocityMph));
      const clock = clockNow();
      const next = `${mph}|${clock}|${plan.kind}|${plan.street}|${Math.round(plan.distM)}|${plan.thenKind}|${Math.round(plan.totalM)}|${plan.hasDest}|${limit}|${g.phase}`;
      if (next !== sig) {
        sig = next;
        if (alive) {
          setReadout({
            mph,
            over: g.phase === 'driving' && mph > limit + 2,
            clock,
            plan,
            limit,
            driving: g.phase === 'driving',
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (worldMode !== 'kent') return null;
  if (phase !== 'driving' && phase !== 'walking') return null;

  const { plan } = readout;
  const speedColor = readout.over ? '#ff5c6a' : '#3ef0ff';
  const digit = stacked ? { w: 11, h: 20 } : { w: 14, h: 26 };

  return (
    <div ref={rootRef} style={place(edge, compact, stacked)} aria-label="Navigation">
      <canvas ref={canvasRef} style={styles.canvas} aria-label="Street map" />
      <div style={styles.stack}>
        {stacked ? (
          <>
            <div ref={gapRef} style={styles.mapBand} />
            <div style={styles.row}>
              <NavCard plan={plan} mph={readout.mph} dense />
              <SpeedCard
                readout={readout}
                speedColor={speedColor}
                digit={digit}
                hp={hp}
                fuel={fuel}
                narrow
              />
            </div>
          </>
        ) : (
          <div style={styles.row}>
            <NavCard plan={plan} mph={readout.mph} dense={compact} />
            <div ref={gapRef} style={{ ...styles.gap, flexBasis: compact ? 48 : 64 }} />
            <SpeedCard
              readout={readout}
              speedColor={speedColor}
              digit={digit}
              hp={hp}
              fuel={fuel}
              narrow={compact}
            />
          </div>
        )}
        {objective && (
          <div style={styles.objective}>
            <div style={styles.objTitle}>OBJECTIVE</div>
            <div>{objective}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavCard({ plan, mph, dense }: { plan: NavPlan; mph: number; dense: boolean }) {
  return (
    <div style={{ ...styles.nav, ...(dense ? styles.navDense : null) }}>
      <div style={styles.navTop}>
        <TurnGlyph kind={plan.kind} size={dense ? 22 : 28} />
        <div style={styles.navText}>
          {plan.hasDest && (
            <div style={{ ...styles.dist, fontSize: dense ? 14 : 17 }}>
              {formatManeuverDist(plan.distM)}
            </div>
          )}
          <div style={{ ...styles.street, fontSize: dense ? 10 : 11 }}>{plan.street}</div>
        </div>
      </div>
      {plan.hasDest && plan.thenKind && (
        <div style={styles.thenRow}>
          <span>Then</span>
          <TurnGlyph kind={plan.thenKind} size={16} />
        </div>
      )}
      {plan.hasDest && <div style={styles.eta}>{formatEta(plan.totalM, mph)}</div>}
    </div>
  );
}

function SpeedCard({
  readout,
  speedColor,
  digit,
  hp,
  fuel,
  narrow,
}: {
  readout: Readout;
  speedColor: string;
  digit: { w: number; h: number };
  hp: number;
  fuel: number;
  narrow?: boolean;
}) {
  return (
    <div style={{ ...styles.speed, width: narrow ? 96 : 118 }}>
      <div style={styles.speedTop}>
        <span style={{ ...styles.clock, color: speedColor, textShadow: `0 0 8px ${speedColor}` }}>{readout.clock}</span>
      </div>
      <div style={styles.speedMain}>
        <Segments text={String(readout.mph)} w={digit.w} h={digit.h} color={speedColor} />
        <span style={{ ...styles.mph, color: speedColor }}>MPH</span>
      </div>
      <div style={styles.speedFoot}>
        {readout.driving && <LimitSign value={readout.limit} hot={readout.over} />}
        <div style={styles.bars}>
          <MiniBar label="HP" value={hp} color="#ff6b6b" />
          <MiniBar label="FUEL" value={fuel} color={fuel < 25 ? '#ff4444' : '#39ff14'} />
        </div>
      </div>
    </div>
  );
}

function LimitSign({ value, hot }: { value: number; hot: boolean }) {
  const ink = hot ? '#ff3333' : '#111';
  return (
    <div style={{ ...styles.limit, color: ink, borderColor: ink }}>
      <div style={styles.limitTitle}>LIMIT</div>
      <div style={styles.limitNum}>{value}</div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={styles.barLabel}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{Math.round(value)}</span>
      </div>
      <div style={styles.barTrack}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

function Segments({ text, w, h, color }: { text: string; w: number; h: number; color: string }) {
  const gap = Math.max(2, Math.round(w * 0.18));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {text.split('').map((ch, i) => (
        <Digit key={i} mask={DIGIT_MASK[ch] ?? 0} w={w} h={h} color={color} />
      ))}
    </span>
  );
}

function Digit({ mask, w, h, color }: { mask: number; w: number; h: number; color: string }) {
  const t = Math.max(2, Math.round(w * 0.18));
  const on = (bit: number) => (mask & bit) !== 0;
  const seg = (bit: number, style: React.CSSProperties) => (
    <span
      style={{
        position: 'absolute',
        borderRadius: t,
        background: on(bit) ? color : 'rgba(255,255,255,0.08)',
        boxShadow: on(bit) ? `0 0 8px ${color}` : 'none',
        ...style,
      }}
    />
  );
  const half = h / 2;
  return (
    <span style={{ position: 'relative', width: w, height: h, display: 'inline-block' }}>
      {seg(0x01, { left: t, right: t, top: 0, height: t })}
      {seg(0x02, { right: 0, top: t * 0.7, width: t, height: half - t * 1.3 })}
      {seg(0x04, { right: 0, top: half + t * 0.45, width: t, height: half - t * 1.35 })}
      {seg(0x08, { left: t, right: t, bottom: 0, height: t })}
      {seg(0x10, { left: 0, top: half + t * 0.45, width: t, height: half - t * 1.35 })}
      {seg(0x20, { left: 0, top: t * 0.7, width: t, height: half - t * 1.3 })}
      {seg(0x40, { left: t, right: t, top: half - t / 2, height: t })}
    </span>
  );
}

function TurnGlyph({ kind, size }: { kind: ManeuverKind; size: number }) {
  const sw = size < 22 ? 5 : 6.5;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <g stroke="#fff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        {kind === 'straight' && (
          <>
            <path d="M24 42 V16" />
            <path d="M13 26 L24 12 L35 26" />
          </>
        )}
        {kind === 'right' && (
          <>
            <path d="M16 42 V24 H34" />
            <path d="M24 14 L36 24 L24 34" />
          </>
        )}
        {kind === 'left' && (
          <>
            <path d="M32 42 V24 H14" />
            <path d="M24 14 L12 24 L24 34" />
          </>
        )}
        {kind === 'slight-right' && (
          <>
            <path d="M18 42 L26 28 L36 16" />
            <path d="M24 14 L38 14 L32 26" />
          </>
        )}
        {kind === 'slight-left' && (
          <>
            <path d="M30 42 L22 28 L12 16" />
            <path d="M24 14 L10 14 L16 26" />
          </>
        )}
        {kind === 'uturn' && (
          <>
            <path d="M34 42 V26 A10 10 0 0 0 14 26 V34" />
            <path d="M8 26 L14 38 L20 26" />
          </>
        )}
      </g>
      {kind === 'arrive' && (
        <path
          fill="#fff"
          d="M24 4c-6.2 0-11 4.7-11 10.6C13 23 24 42 24 42s11-19 11-27.4C35 8.7 30.2 4 24 4zm0 14.2a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6z"
        />
      )}
    </svg>
  );
}

function place(edge: DashEdge, compact: boolean, stacked: boolean): React.CSSProperties {
  const common: React.CSSProperties = {
    position: 'fixed',
    zIndex: 215,
    pointerEvents: 'none',
    borderRadius: 14,
    overflow: 'hidden',
    background: 'rgba(7, 12, 20, 0.16)',
    backdropFilter: 'blur(6px) saturate(1.05)',
    WebkitBackdropFilter: 'blur(6px) saturate(1.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  };
  if (stacked) {
    return {
      ...common,
      width: 'min(196px, 48vw)',
      bottom: 'calc(12px + env(safe-area-inset-bottom))',
      ...(edge === 'right'
        ? { right: 'max(10px, env(safe-area-inset-right))' }
        : { left: 'max(10px, env(safe-area-inset-left))' }),
    };
  }
  return {
    ...common,
    width: 'min(400px, calc(100vw - 16px))',
    top: compact
      ? 'calc(78px + env(safe-area-inset-top))'
      : 'calc(58px + env(safe-area-inset-top))',
    left: '50%',
    transform: 'translateX(-50%)',
  };
}

function paintMap(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  gap: HTMLElement | null,
  here: { x: number; y: number; heading: number },
  plan: NavPlan,
) {
  const cssW = root.clientWidth;
  const cssH = root.clientHeight;
  if (cssW < 2 || cssH < 2) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = dpr * PX_PER_M;
  let anchorX = w / 2;
  let anchorY = h * 0.78;
  if (gap && cssW > 0 && cssH > 0) {
    const gr = gap.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    if (gr.width > 4 && gr.height > 4) {
      anchorX = (gr.left + gr.width / 2 - rr.left) * (w / rr.width);
      // The view sits above and behind the car. The chevron rides the
      // bottom of the map so the street ahead fills the glass.
      anchorY = (gr.bottom - 16 - rr.top) * (h / rr.height);
    }
  }

  const cos = -Math.sin(here.heading);
  const sin = -Math.cos(here.heading);
  const to = (x: number, y: number) => {
    const dx = x - here.x;
    const dy = y - here.y;
    return {
      x: anchorX + (dx * cos - dy * sin) * scale,
      y: anchorY + (dx * sin + dy * cos) * scale,
    };
  };

  ctx.clearRect(0, 0, w, h);
  const map = QuietRoads.sim.map;
  const margin = 80 * dpr;

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (const building of map.buildings) {
    if (!rectNear(building.rect, here, 420)) continue;
    traceRect(ctx, building.rect, to);
    ctx.fill();
  }

  if (map.schoolZone) {
    ctx.fillStyle = 'rgba(255, 214, 80, 0.13)';
    traceRect(ctx, map.schoolZone, to);
    ctx.fill();
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(198, 208, 222, 0.55)';
  for (const road of map.roads) {
    traceRect(ctx, road.rect, to);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(1, dpr);
  ctx.setLineDash([5 * dpr, 7 * dpr]);
  ctx.beginPath();
  for (const [a, c] of map.centerLines) {
    const p = to(a.x, a.y);
    const q = to(c.x, c.y);
    if (!nearScreen(p, w, h, margin) && !nearScreen(q, w, h, margin)) continue;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  if (map.rail) {
    const a = to(map.rail.from.x, map.rail.from.y);
    const b = to(map.rail.to.x, map.rail.to.y);
    ctx.strokeStyle = 'rgba(214, 176, 64, 0.7)';
    ctx.lineWidth = Math.max(1.5, 1.6 * dpr);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (plan.poly.length > 1) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    plan.poly.forEach((p, i) => {
      const s = to(p.x, p.y);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.strokeStyle = 'rgba(70, 168, 255, 0.35)';
    ctx.lineWidth = 9 * dpr;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90, 190, 255, 0.95)';
    ctx.lineWidth = 4.5 * dpr;
    ctx.stroke();
  }

  ctx.font = `700 ${Math.round(11 * dpr)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3 * dpr;
  const seen = new Set<string>();
  for (const road of map.roads) {
    if (!road.name || /LOT|DRIVEWAY/.test(road.name) || seen.has(road.name)) continue;
    const anchor = labelPoint(road.rect, here);
    const s = to(anchor.x, anchor.y);
    if (!nearScreen(s, w, h, 0)) continue;
    const dx = s.x - anchorX;
    const dy = s.y - anchorY;
    if (dx * dx + dy * dy < (36 * dpr) * (36 * dpr)) continue;
    seen.add(road.name);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.strokeText(road.name, s.x, s.y);
    ctx.fillStyle = 'rgba(255,255,255,0.84)';
    ctx.fillText(road.name, s.x, s.y);
  }

  if (plan.hasDest && plan.poly.length) {
    const dest = plan.poly[plan.poly.length - 1];
    const s = to(dest.x, dest.y);
    if (nearScreen(s, w, h, margin)) drawPin(ctx, s.x, s.y, dpr);
  }

  drawDriver(ctx, anchorX, anchorY, dpr);
}

function traceRect(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  to: (x: number, y: number) => { x: number; y: number },
) {
  const a = to(rect.x, rect.y);
  const b = to(rect.x + rect.w, rect.y);
  const c = to(rect.x + rect.w, rect.y + rect.h);
  const d = to(rect.x, rect.y + rect.h);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
}

function rectNear(
  rect: { x: number; y: number; w: number; h: number },
  p: { x: number; y: number },
  reach: number,
) {
  const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
  return (p.x - cx) ** 2 + (p.y - cy) ** 2 < reach * reach;
}

function nearScreen(p: { x: number; y: number }, w: number, h: number, margin: number) {
  return p.x >= -margin && p.y >= -margin && p.x <= w + margin && p.y <= h + margin;
}

function labelPoint(
  rect: { x: number; y: number; w: number; h: number },
  p: { x: number; y: number },
) {
  if (rect.w >= rect.h) {
    return {
      x: Math.max(rect.x, Math.min(p.x, rect.x + rect.w)),
      y: rect.y + rect.h / 2,
    };
  }
  return {
    x: rect.x + rect.w / 2,
    y: Math.max(rect.y, Math.min(p.y, rect.y + rect.h)),
  };
}

function drawDriver(ctx: CanvasRenderingContext2D, x: number, y: number, dpr: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(90, 200, 255, 0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, 14 * dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7f8ff';
  ctx.strokeStyle = '#083044';
  ctx.lineWidth = 1.4 * dpr;
  ctx.beginPath();
  ctx.moveTo(0, -11 * dpr);
  ctx.lineTo(7.5 * dpr, 8 * dpr);
  ctx.lineTo(0, 3.5 * dpr);
  ctx.lineTo(-7.5 * dpr, 8 * dpr);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, dpr: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#ffd93d';
  ctx.beginPath();
  ctx.arc(0, -8, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4.6, -6);
  ctx.lineTo(0, 6);
  ctx.lineTo(4.6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1404';
  ctx.beginPath();
  ctx.arc(0, -8, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const styles: Record<string, React.CSSProperties> = {
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'block',
  },
  stack: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 6,
  },
  row: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 6,
  },
  gap: {
    flex: '1 0 56px',
    minHeight: 72,
  },
  mapBand: {
    height: 88,
  },
  nav: {
    flex: '1 1 132px',
    minWidth: 0,
    maxWidth: 176,
    background: 'rgba(6, 18, 16, 0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '5px 7px 5px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  navDense: {
    padding: '4px 6px',
  },
  navTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  navText: {
    minWidth: 0,
  },
  dist: {
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  street: {
    marginTop: 3,
    fontWeight: 650,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  thenRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: 650,
  },
  eta: {
    marginTop: 5,
    paddingTop: 4,
    borderTop: '1px solid rgba(255,255,255,0.12)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.01em',
  },
  speed: {
    flex: '0 0 auto',
    background: 'rgba(8, 14, 32, 0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '4px 6px 5px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  speedTop: {
    display: 'flex',
    justifyContent: 'flex-end',
    minHeight: 14,
  },
  clock: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    lineHeight: 1,
  },
  speedMain: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 6,
  },
  mph: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    marginTop: 2,
  },
  speedFoot: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  bars: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  barLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8,
    letterSpacing: '0.06em',
  },
  barTrack: {
    height: 4,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  limit: {
    width: 30,
    flex: '0 0 auto',
    background: '#fff',
    border: '2px solid',
    borderRadius: 3,
    textAlign: 'center',
    lineHeight: 1,
    padding: '2px 0 2px',
  },
  limitTitle: {
    fontSize: 6,
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  limitNum: {
    fontSize: 12,
    fontWeight: 800,
    marginTop: 1,
  },
  objective: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 1.3,
    padding: '2px 6px 2px',
    textShadow: '0 1px 2px rgba(0,0,0,0.85)',
  },
  objTitle: {
    fontSize: 8,
    letterSpacing: '0.16em',
    color: '#F28DB2',
    marginBottom: 2,
  },
};
