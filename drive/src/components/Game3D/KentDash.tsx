/**
 * KentDash — speedometer + GPS for Quiet Roads.
 * Canvas paints from the live sim so React does not re-render at 60 Hz.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { Speedometer } from './Speedometer';
import { useCompactHud } from '@/hooks/useCompactHud';
import { dashEdge, type DashEdge } from '@/input/driveInput';

const GPS_CSS = 108;

export function KentDash() {
  const worldMode = useGameStore((s) => s.worldMode);
  const phase = useGameStore((s) => s.phase);
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const limit = useQRHud((s) => s.frame?.speedLimitMph ?? 25);
  const objective = useQRHud((s) => s.objective);
  const scheme = useGameStore((s) => s.controlsScheme);
  const compact = useCompactHud();
  const edge: DashEdge = compact ? dashEdge(scheme) : 'top';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const destRef = useRef<HTMLSpanElement>(null);
  const mphRef = useRef(0);
  const [, bump] = useState(0);

  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const tick = (t: number) => {
      paintGps(canvasRef.current);
      const dest = QuietRoads.sim.navTarget();
      if (destRef.current) destRef.current.textContent = dest?.label ?? '';
      const mph = useGameStore.getState().velocityMph;
      if (t - lastUi > 80) {
        lastUi = t;
        if (Math.abs(mph - mphRef.current) > 0.25) {
          mphRef.current = mph;
          bump((n) => n + 1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (worldMode !== 'kent') return null;
  if (phase !== 'driving' && phase !== 'walking') return null;

  return (
    <div style={rootStyle(edge, compact)}>
      <div style={styles.glass}>
        <div style={styles.row}>
          <div style={styles.mapCol}>
            <canvas
              ref={canvasRef}
              width={GPS_CSS * 2}
              height={GPS_CSS * 2}
              style={styles.canvas}
              aria-label="Street map"
            />
            <div style={styles.gpsCaption}>
              <span style={styles.gpsYou}>YOU</span>
              <span ref={destRef} style={styles.gpsDest} />
            </div>
          </div>
          <div style={styles.gaugeCol}>
            <Speedometer mph={mphRef.current} limit={limit} size="compact" />
            <MiniBar label="HP" value={hp} color="#ff6b6b" />
            <MiniBar label="FUEL" value={fuel} color={fuel < 25 ? '#ff4444' : '#39ff14'} />
          </div>
        </div>
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

function rootStyle(edge: DashEdge, compact: boolean): React.CSSProperties {
  const common: React.CSSProperties = {
    position: 'fixed',
    zIndex: 215,
    pointerEvents: 'none',
  };
  if (!compact) {
    return {
      ...common,
      top: 'calc(8px + env(safe-area-inset-top))',
      left: 'max(8px, env(safe-area-inset-left))',
    };
  }
  if (edge === 'top') {
    return {
      ...common,
      top: 'calc(78px + env(safe-area-inset-top))',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  }
  if (edge === 'right') {
    return {
      ...common,
      bottom: 'calc(12px + env(safe-area-inset-bottom))',
      right: 'max(10px, env(safe-area-inset-right))',
    };
  }
  return {
    ...common,
    bottom: 'calc(12px + env(safe-area-inset-bottom))',
    left: 'max(10px, env(safe-area-inset-left))',
  };
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
        <span style={{ color: '#888', fontSize: 9 }}>{label}</span>
        <span style={{ color, fontSize: 9, fontWeight: 700 }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 5, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

function paintGps(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sim = QuietRoads.sim;
  const map = sim.map;
  const w = canvas.width;
  const h = canvas.height;
  const b = map.bounds;
  const pad = 10;
  const sx = (w - pad * 2) / b.w;
  const sy = (h - pad * 2) / b.h;
  const scale = Math.min(sx, sy);
  const ox = pad + (w - pad * 2 - b.w * scale) / 2;
  const oy = pad + (h - pad * 2 - b.h * scale) / 2;
  const px = (x: number) => ox + (x - b.x) * scale;
  const py = (y: number) => oy + (y - b.y) * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(8, 12, 20, 0.5)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#1a2230';
  for (const building of map.buildings) {
    ctx.fillRect(px(building.rect.x), py(building.rect.y), building.rect.w * scale, building.rect.h * scale);
  }

  ctx.fillStyle = '#3a4558';
  for (const road of map.roads) {
    ctx.fillRect(px(road.rect.x), py(road.rect.y), road.rect.w * scale, road.rect.h * scale);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = Math.max(1, scale * 0.15);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (const [a, c] of map.centerLines) {
    ctx.moveTo(px(a.x), py(a.y));
    ctx.lineTo(px(c.x), py(c.y));
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,217,61,0.22)';
  if (map.schoolZone) {
    ctx.fillRect(px(map.schoolZone.x), py(map.schoolZone.y), map.schoolZone.w * scale, map.schoolZone.h * scale);
  }

  if (map.rail) {
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = Math.max(1.5, scale * 0.35);
    ctx.beginPath();
    ctx.moveTo(px(map.rail.from.x), py(map.rail.from.y));
    ctx.lineTo(px(map.rail.to.x), py(map.rail.to.y));
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,209,102,0.72)';
  ctx.font = `700 ${Math.max(8, scale * 1.45)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  for (const building of map.buildings) {
    if (!building.label || building.label === 'JUNE') continue;
    ctx.fillText(building.label, px(building.rect.x + building.rect.w / 2), py(building.rect.y + building.rect.h / 2) + 3);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `600 ${Math.max(9, scale * 1.6)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  for (const road of map.roads) {
    if (!road.name || road.name.includes('DRIVEWAY') || road.name.includes('LOT')) continue;
    const vertical = road.rect.h > road.rect.w * 1.6;
    const tx = px(road.rect.x + road.rect.w / 2);
    const ty = py(road.rect.y + road.rect.h / 2);
    ctx.save();
    ctx.translate(tx, ty);
    if (vertical) ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(road.name, 0, 3);
    ctx.restore();
  }

  const g = useGameStore.getState();
  const walking = g.phase === 'walking';
  const pos = walking
    ? { x: g.walkerPosition[0], y: g.walkerPosition[2] }
    : { x: g.vehiclePosition[0], y: g.vehiclePosition[2] };

  const dest = sim.navTarget();
  if (dest) {
    ctx.strokeStyle = 'rgba(255,209,102,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(px(pos.x), py(pos.y));
    ctx.lineTo(px(dest.pos.x), py(dest.pos.y));
    ctx.stroke();
    ctx.setLineDash([]);
    drawPin(ctx, px(dest.pos.x), py(dest.pos.y), '#ffd93d');
  }

  let heading = 0;
  if (walking) {
    heading = sim.walker.facing;
  } else {
    const yaw = g.vehicleHeading;
    heading = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
  }
  drawYou(ctx, px(pos.x), py(pos.y), heading);
}

function drawYou(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.fillStyle = '#F28DB2';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, 4.5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-5, -4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4.2, -5);
  ctx.lineTo(0, 5);
  ctx.lineTo(4.2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(0, -7, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const styles: Record<string, React.CSSProperties> = {
  glass: {
    background: 'rgba(8, 10, 16, 0.46)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 14,
    padding: 6,
    boxShadow: '0 8px 22px rgba(0,0,0,0.28)',
    maxWidth: 'min(236px, 62vw)',
  },
  row: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
  },
  mapCol: {
    flex: '0 0 auto',
  },
  gaugeCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 4,
    minWidth: 88,
    paddingBottom: 2,
  },
  canvas: {
    width: GPS_CSS,
    height: GPS_CSS,
    display: 'block',
    borderRadius: 8,
    background: 'transparent',
  },
  gpsCaption: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
    padding: '3px 2px 0',
    fontSize: 8,
    letterSpacing: '0.08em',
    fontWeight: 800,
  },
  gpsYou: { color: '#F28DB2' },
  gpsDest: {
    color: '#ffd93d',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 72,
  },
  objective: {
    marginTop: 4,
    color: '#eee',
    fontSize: 11,
    lineHeight: 1.3,
    padding: '4px 4px 2px',
    borderTop: '1px solid rgba(255,255,255,0.12)',
  },
  objTitle: {
    fontSize: 8,
    letterSpacing: '0.16em',
    color: '#F28DB2',
    marginBottom: 2,
  },
};
