/**
 * Street route for the Kent dash.
 * World axes match the map: +x east, +y south. Heading 0 faces east;
 * positive heading turns toward south.
 */
import { buildKentMap, type RoadSeg } from '@/quietroads/sim/kentMap';

export type ManeuverKind =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'left'
  | 'right'
  | 'uturn'
  | 'arrive';

export interface NavPlan {
  poly: { x: number; y: number }[];
  kind: ManeuverKind;
  street: string;
  distM: number;
  thenKind: ManeuverKind | null;
  totalM: number;
  hasDest: boolean;
}

type Pt = { x: number; y: number };
type Edge = { a: Pt; b: Pt; name: string };

const q = (n: number) => Math.round(n * 2) / 2;
const keyOf = (p: Pt) => `${q(p.x)},${q(p.y)}`;
const hypot = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

function buildEdges(roads: RoadSeg[]): { edges: Edge[]; nodes: Map<string, Pt>; adj: Map<string, { to: string; name: string; w: number }[]> } {
  type Seg = { x1: number; y1: number; x2: number; y2: number; name: string; horizontal: boolean };
  const segs: Seg[] = [];
  for (const road of roads) {
    if (!road.name || /LOT|DRIVEWAY/.test(road.name)) continue;
    const r = road.rect;
    if (r.w >= r.h) {
      const y = r.y + r.h / 2;
      segs.push({ x1: r.x, y1: y, x2: r.x + r.w, y2: y, name: road.name, horizontal: true });
    } else {
      const x = r.x + r.w / 2;
      segs.push({ x1: x, y1: r.y, x2: x, y2: r.y + r.h, name: road.name, horizontal: false });
    }
  }

  const cuts: Pt[] = [];
  for (const h of segs) {
    if (!h.horizontal) continue;
    for (const v of segs) {
      if (v.horizontal) continue;
      const x = v.x1;
      const y = h.y1;
      const onH = x >= Math.min(h.x1, h.x2) - 1 && x <= Math.max(h.x1, h.x2) + 1;
      const onV = y >= Math.min(v.y1, v.y2) - 1 && y <= Math.max(v.y1, v.y2) + 1;
      if (onH && onV) cuts.push({ x, y });
    }
  }

  const nodes = new Map<string, Pt>();
  const node = (p: Pt): Pt => {
    const k = keyOf(p);
    let n = nodes.get(k);
    if (!n) {
      n = { x: q(p.x), y: q(p.y) };
      nodes.set(k, n);
    }
    return n;
  };

  const edges: Edge[] = [];
  for (const seg of segs) {
    const pts: Pt[] = [node({ x: seg.x1, y: seg.y1 }), node({ x: seg.x2, y: seg.y2 })];
    for (const c of cuts) {
      if (seg.horizontal) {
        if (Math.abs(c.y - seg.y1) > 1.5) continue;
        if (c.x < Math.min(seg.x1, seg.x2) - 0.5 || c.x > Math.max(seg.x1, seg.x2) + 0.5) continue;
        pts.push(node({ x: c.x, y: seg.y1 }));
      } else {
        if (Math.abs(c.x - seg.x1) > 1.5) continue;
        if (c.y < Math.min(seg.y1, seg.y2) - 0.5 || c.y > Math.max(seg.y1, seg.y2) + 0.5) continue;
        pts.push(node({ x: seg.x1, y: c.y }));
      }
    }
    pts.sort((a, b) => (seg.horizontal ? a.x - b.x : a.y - b.y));
    for (let i = 1; i < pts.length; i++) {
      if (hypot(pts[i - 1], pts[i]) < 0.5) continue;
      edges.push({ a: pts[i - 1], b: pts[i], name: seg.name });
    }
  }

  const adj = new Map<string, { to: string; name: string; w: number }[]>();
  const link = (a: Pt, b: Pt, name: string) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    const w = hypot(a, b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ to: kb, name, w });
    adj.get(kb)!.push({ to: ka, name, w });
  };
  for (const e of edges) link(e.a, e.b, e.name);
  return { edges, nodes, adj };
}

const GRAPH = buildEdges(buildKentMap().roads);

function project(p: Pt, e: Edge): { point: Pt; d: number } {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 < 1e-6 ? 0 : ((p.x - e.a.x) * dx + (p.y - e.a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: e.a.x + dx * t, y: e.a.y + dy * t };
  return { point, d: Math.hypot(p.x - point.x, p.y - point.y) };
}

function snap(p: Pt): { edge: Edge; point: Pt; d: number } {
  let best = { edge: GRAPH.edges[0], point: p, d: Infinity };
  for (const edge of GRAPH.edges) {
    const hit = project(p, edge);
    if (hit.d < best.d) best = { edge, point: hit.point, d: hit.d };
  }
  return best;
}

function routeOnRoads(from: Pt, to: Pt): { points: Pt[]; names: string[] } | null {
  const start = snap(from);
  const goal = snap(to);
  const { adj, nodes } = GRAPH;
  const S = '__s';
  const G = '__g';
  const extra = new Map<string, { to: string; name: string; w: number }[]>();
  const add = (fromK: string, toK: string, name: string, w: number) => {
    if (!extra.has(fromK)) extra.set(fromK, []);
    extra.get(fromK)!.push({ to: toK, name, w });
  };
  const neighbors = (k: string) => [...(adj.get(k) ?? []), ...(extra.get(k) ?? [])];

  add(S, keyOf(start.edge.a), start.edge.name, hypot(start.point, start.edge.a));
  add(S, keyOf(start.edge.b), start.edge.name, hypot(start.point, start.edge.b));
  add(keyOf(goal.edge.a), G, goal.edge.name, hypot(goal.point, goal.edge.a));
  add(keyOf(goal.edge.b), G, goal.edge.name, hypot(goal.point, goal.edge.b));
  if (start.edge === goal.edge) {
    add(S, G, start.edge.name, hypot(start.point, goal.point));
  }

  const distM = new Map<string, number>([[S, 0]]);
  const prev = new Map<string, { k: string; name: string }>();
  const used = new Set<string>();
  for (let guard = 0; guard < 64; guard++) {
    let bestK = '';
    let bestD = Infinity;
    for (const [k, d] of distM) {
      if (used.has(k)) continue;
      if (d < bestD) {
        bestD = d;
        bestK = k;
      }
    }
    if (!bestK) return null;
    if (bestK === G) break;
    used.add(bestK);
    for (const n of neighbors(bestK)) {
      if (used.has(n.to)) continue;
      const nd = bestD + n.w;
      if (nd + 1e-6 < (distM.get(n.to) ?? Infinity)) {
        distM.set(n.to, nd);
        prev.set(n.to, { k: bestK, name: n.name });
      }
    }
  }
  if (!prev.has(G)) return null;

  const revPts: Pt[] = [goal.point];
  const revNames: string[] = [];
  let cur = G;
  const guard = new Set<string>();
  while (cur !== S) {
    if (guard.has(cur)) return null;
    guard.add(cur);
    const step = prev.get(cur);
    if (!step) return null;
    revNames.push(step.name);
    if (step.k === S) revPts.push(start.point);
    else {
      const n = nodes.get(step.k);
      if (!n) return null;
      revPts.push(n);
    }
    cur = step.k;
  }
  revPts.reverse();
  revNames.reverse();
  return { points: revPts, names: revNames };
}

function ang(a: Pt, b: Pt) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function wrap(d: number) {
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function kindFromDelta(d: number): ManeuverKind {
  const a = Math.abs(d);
  if (a < 0.4) return 'straight';
  if (a > 2.55) return 'uturn';
  if (a < 0.95) return d > 0 ? 'slight-right' : 'slight-left';
  return d > 0 ? 'right' : 'left';
}

const EMPTY: NavPlan = {
  poly: [],
  kind: 'straight',
  street: 'KENT',
  distM: 0,
  thenKind: null,
  totalM: 0,
  hasDest: false,
};

export function planNav(player: Pt, heading: number, dest: { x: number; y: number; label: string } | null): NavPlan {
  if (!GRAPH.edges.length) return EMPTY;
  if (!dest) {
    const here = snap(player);
    return {
      ...EMPTY,
      street: here.d < 18 ? here.edge.name : 'KENT',
    };
  }

  const road = routeOnRoads(player, dest);
  const points: Pt[] = [player];
  const names: string[] = [];
  const push = (p: Pt, name: string) => {
    if (hypot(points[points.length - 1], p) < 0.75) return;
    names.push(name);
    points.push(p);
  };
  if (road) {
    for (let i = 0; i < road.points.length; i++) {
      push(road.points[i], i === 0 ? '' : (road.names[i - 1] || ''));
    }
  }
  push(dest, dest.label);

  let total = 0;
  for (let i = 1; i < points.length; i++) total += hypot(points[i - 1], points[i]);

  type Step = { at: number; kind: ManeuverKind; street: string };
  const turns: Step[] = [];
  let traveled = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const prevLen = hypot(points[i - 1], points[i]);
    traveled += prevLen;
    const nextLen = hypot(points[i], points[i + 1]);
    const incoming = names[i - 1];
    const outgoing = names[i];
    if (!outgoing || outgoing === dest.label) continue;
    if (!incoming || incoming === dest.label) continue;
    if (prevLen < 8 || nextLen < 8) continue;
    const kind = kindFromDelta(wrap(ang(points[i], points[i + 1]) - ang(points[i - 1], points[i])));
    if (kind !== 'straight') turns.push({ at: traveled, kind, street: outgoing });
  }

  let follow: { street: string; dir: number } | null = null;
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || names[i] === dest.label) continue;
    if (hypot(points[i], points[i + 1]) < 6) continue;
    follow = { street: names[i], dir: ang(points[i], points[i + 1]) };
    break;
  }
  if (follow) {
    const kind = kindFromDelta(wrap(follow.dir - heading));
    if (kind !== 'straight') turns.unshift({ at: 0, kind, street: follow.street });
  }

  const roadName = follow?.street || dest.label;
  let kind: ManeuverKind;
  let street: string;
  let distM: number;
  let thenKind: ManeuverKind | null;
  if (turns.length > 0) {
    kind = turns[0].kind;
    street = turns[0].street;
    distM = turns[0].at;
    thenKind = turns[1]?.kind ?? 'arrive';
  } else if (total > 45) {
    kind = 'straight';
    street = roadName;
    distM = total;
    thenKind = 'arrive';
  } else {
    kind = 'arrive';
    street = dest.label;
    distM = total;
    thenKind = null;
  }

  return { poly: points, kind, street, distM, thenKind, totalM: total, hasDest: true };
}

export function formatDist(meters: number): string {
  const feet = meters * 3.28084;
  if (feet < 450) {
    const rounded = Math.max(20, Math.round(feet / 10) * 10);
    return `${rounded} ft`;
  }
  const mi = meters / 1609.344;
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

export function formatManeuverDist(meters: number): string {
  if (meters < 12) return 'NOW';
  return formatDist(meters);
}

export function formatEta(meters: number, mph: number): string {
  const pace = mph >= 8 ? mph : 20;
  const min = (meters / 1609.344) / pace * 60;
  const time = min < 1 ? '<1 min' : `${Math.max(1, Math.round(min))} min`;
  return `${time}  \u00b7  ${formatDist(meters)}`;
}
