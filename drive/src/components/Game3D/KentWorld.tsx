/**
 * KentWorld — the Act 0/1 map, built from QuietRoads.sim.map (metres).
 * Core coordinates: x east, y south → world X, Z. Road surface at Y = 0.
 *
 * Buildings are boxes with fixed Rapier cuboid colliders so the Beetle stops
 * against them (the sim's blocked() is for the Quiet; Rapier handles the car).
 * Everything is drawn from data — nothing hand-placed.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { useGameStore } from '@/stores/gameStore';
import type { Rect, SignDef } from '@/quietroads';

const ROAD_Y = 0.01;
const MARK_Y = 0.02;

function RectPlane({ r, y, color, opacity = 1 }: { r: Rect; y: number; color: string; opacity?: number }) {
  return (
    <mesh position={[r.x + r.w / 2, y, r.y + r.h / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[r.w, r.h]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.95} />
    </mesh>
  );
}

function Dashes({ a, b, color = '#d8b93c', dash = 3, gap = 3, width = 0.15 }: { a: { x: number; y: number }; b: { x: number; y: number }; color?: string; dash?: number; gap?: number; width?: number }) {
  const segs = useMemo(() => {
    const dx = b.x - a.x, dy = b.y - a.y; const L = Math.hypot(dx, dy); const ux = dx / L, uy = dy / L;
    const out: { x: number; z: number; len: number }[] = [];
    for (let d = 0; d < L; d += dash + gap) { const len = Math.min(dash, L - d); out.push({ x: a.x + ux * (d + len / 2), z: a.y + uy * (d + len / 2), len }); }
    return { out, rot: Math.atan2(dy, dx) };
  }, [a.x, a.y, b.x, b.y, dash, gap]);
  return (
    <group>
      {segs.out.map((s, i) => (
        <mesh key={i} position={[s.x, MARK_Y, s.z]} rotation={[-Math.PI / 2, 0, -segs.rot]}>
          <planeGeometry args={[s.len, width]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Line({ a, b, color = '#ffffff', width = 0.3 }: { a: { x: number; y: number }; b: { x: number; y: number }; color?: string; width?: number }) {
  const dx = b.x - a.x, dy = b.y - a.y; const L = Math.hypot(dx, dy);
  return (
    <mesh position={[(a.x + b.x) / 2, MARK_Y, (a.y + b.y) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(dy, dx)]}>
      <planeGeometry args={[L, width]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Building({ r, label }: { r: Rect; label?: string }) {
  if (label === 'DOL') return <DolBuilding r={r} />;
  if (label === 'PHARMACY') return <PharmacyBuilding r={r} />;
  if (label === 'WAREHOUSE') return <WarehouseBuilding r={r} />;
  const h = label === 'KENT MIDDLE' ? 7 : label === 'SANCTUARY' ? 3.6 : label === 'RADIO' ? 3.2 : 4 + ((r.x * 7 + r.y * 3) % 3);
  const color = label === 'KENT MIDDLE' ? '#a8895e' : label === 'SANCTUARY' ? '#6e5a68' : label === 'RADIO' ? '#3d5166' : '#7c7368';
  return (
    <RigidBody type="fixed" colliders={false} position={[r.x + r.w / 2, h / 2, r.y + r.h / 2]}>
      <CuboidCollider args={[r.w / 2, h / 2, r.h / 2]} />
      <mesh receiveShadow>
        <boxGeometry args={[r.w, h, r.h]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2 + 0.15, 0]}>
        <boxGeometry args={[r.w + 0.6, 0.3, r.h + 0.6]} />
        <meshStandardMaterial color="#3a352f" />
      </mesh>
    </RigidBody>
  );
}

function PharmacyBuilding({ r }: { r: Rect }) {
  const h = 4.4;
  const cx = r.x + r.w / 2;
  const cz = r.y + r.h / 2;
  const doorZ = r.y + r.h;
  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={[cx, h / 2, cz]}>
        <CuboidCollider args={[r.w / 2, h / 2, r.h / 2]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[r.w, h, r.h]} />
          <meshStandardMaterial color="#8a9a8e" roughness={0.88} />
        </mesh>
        <mesh position={[0, h / 2 + 0.14, 0]}>
          <boxGeometry args={[r.w + 0.5, 0.28, r.h + 0.5]} />
          <meshStandardMaterial color="#3a352f" />
        </mesh>
      </RigidBody>
      <mesh position={[cx, 2.6, doorZ + 0.04]}>
        <boxGeometry args={[1.7, 1.7, 0.08]} />
        <meshStandardMaterial color="#1f4d3a" />
      </mesh>
      <mesh position={[cx, 2.6, doorZ + 0.08]}>
        <boxGeometry args={[0.28, 1.15, 0.06]} />
        <meshStandardMaterial color="#3ecf7a" emissive="#1d8a48" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[cx, 2.6, doorZ + 0.08]}>
        <boxGeometry args={[1.15, 0.28, 0.06]} />
        <meshStandardMaterial color="#3ecf7a" emissive="#1d8a48" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[cx, 2.55, doorZ + 0.7]}>
        <boxGeometry args={[4.2, 0.08, 1.2]} />
        <meshStandardMaterial color="#3a352f" />
      </mesh>
    </group>
  );
}

function WarehouseBuilding({ r }: { r: Rect }) {
  const h = 6.2;
  const cx = r.x + r.w / 2;
  const cz = r.y + r.h / 2;
  return (
    <RigidBody type="fixed" colliders={false} position={[cx, h / 2, cz]}>
      <CuboidCollider args={[r.w / 2, h / 2, r.h / 2]} />
      <mesh receiveShadow castShadow>
        <boxGeometry args={[r.w, h, r.h]} />
        <meshStandardMaterial color="#5a5854" roughness={0.92} />
      </mesh>
      <mesh position={[0, h / 2 + 0.16, 0]}>
        <boxGeometry args={[r.w + 0.7, 0.32, r.h + 0.7]} />
        <meshStandardMaterial color="#2f2d2a" />
      </mesh>
      <mesh position={[0, -0.4, r.h / 2 + 0.03]}>
        <boxGeometry args={[8.5, 3.6, 0.08]} />
        <meshStandardMaterial color="#3d3a36" />
      </mesh>
    </RigidBody>
  );
}

function ClipboardWoman() {
  const p = QuietRoads.sim.map.markers.clipboard;
  if (!p) return null;
  return (
    <group position={[p.x, 0, p.y]}>
      <mesh position={[-0.1, 0.45, 0]}><boxGeometry args={[0.16, 0.9, 0.2]} /><meshStandardMaterial color="#3a3340" /></mesh>
      <mesh position={[0.1, 0.45, 0]}><boxGeometry args={[0.16, 0.9, 0.2]} /><meshStandardMaterial color="#3a3340" /></mesh>
      <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.42, 0.58, 0.26]} /><meshStandardMaterial color="#6b6e74" roughness={0.9} /></mesh>
      <mesh position={[0, 1.66, 0]} castShadow><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#c4a07a" /></mesh>
      <mesh position={[0.18, 1.18, 0.16]} rotation={[-0.4, 0.2, 0.1]}>
        <boxGeometry args={[0.18, 0.24, 0.03]} />
        <meshStandardMaterial color="#c4b89a" />
      </mesh>
    </group>
  );
}

function Sign({ s }: { s: SignDef }) {
  const face = useMemo(() => {
    switch (s.kind) {
      case 'stop': return { geo: <cylinderGeometry args={[0.45, 0.45, 0.05, 8]} />, color: '#c0302b', rot: Math.PI / 8 };
      case 'school': return { geo: <cylinderGeometry args={[0.45, 0.45, 0.05, 5]} />, color: '#e8d63a', rot: Math.PI / 2 };
      case 'rail': return { geo: <cylinderGeometry args={[0.45, 0.45, 0.05, 24]} />, color: '#e8d63a', rot: 0 };
      default: return { geo: <cylinderGeometry args={[0.5, 0.5, 0.05, 4]} />, color: '#e8d63a', rot: 0 };
    }
  }, [s.kind]);
  return (
    <group position={[s.pos.x, 0, s.pos.y]}>
      <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.04, 0.04, 2.2, 6]} /><meshStandardMaterial color="#444" /></mesh>
      <mesh position={[0, 2.3, 0]} rotation={[Math.PI / 2, face.rot, 0]} castShadow>
        {face.geo}
        <meshStandardMaterial color={face.color} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── The DOL: walls + floor always; roof only when she's outside ──────────────
const DOL_H = 4.2;
const WALL = 0.5;
function DolBuilding({ r }: { r: Rect }) {
  const dol = QuietRoads.sim.map.dol;
  const roofRef = useRef<THREE.Mesh>(null);
  useFrame(() => { if (roofRef.current) roofRef.current.visible = useGameStore.getState().phase !== 'walking'; });
  const wallMat = <meshStandardMaterial color="#8a8f96" roughness={0.9} />;
  const cx = r.x + r.w / 2, cz = r.y + r.h / 2;
  const doorHalf = dol.doorWidth / 2;
  // east wall is split around the door
  const eastTop = { z0: r.y, z1: dol.door.y - doorHalf };
  const eastBot = { z0: dol.door.y + doorHalf, z1: r.y + r.h };
  return (
    <group>
      {/* car-facing collider: solid box (the Beetle never goes inside) */}
      <RigidBody type="fixed" colliders={false} position={[cx, DOL_H / 2, cz]}>
        <CuboidCollider args={[r.w / 2, DOL_H / 2, r.h / 2]} />
      </RigidBody>
      {/* floor */}
      <mesh position={[cx, 0.015, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[r.w, r.h]} />
        <meshStandardMaterial color="#b9b4a8" roughness={0.95} />
      </mesh>
      {/* walls: north, south, west, east (split) */}
      <mesh position={[cx, DOL_H / 2, r.y + WALL / 2]} castShadow receiveShadow><boxGeometry args={[r.w, DOL_H, WALL]} />{wallMat}</mesh>
      <mesh position={[cx, DOL_H / 2, r.y + r.h - WALL / 2]} castShadow receiveShadow><boxGeometry args={[r.w, DOL_H, WALL]} />{wallMat}</mesh>
      <mesh position={[r.x + WALL / 2, DOL_H / 2, cz]} castShadow receiveShadow><boxGeometry args={[WALL, DOL_H, r.h]} />{wallMat}</mesh>
      <mesh position={[r.x + r.w - WALL / 2, DOL_H / 2, (eastTop.z0 + eastTop.z1) / 2]} castShadow receiveShadow><boxGeometry args={[WALL, DOL_H, eastTop.z1 - eastTop.z0]} />{wallMat}</mesh>
      <mesh position={[r.x + r.w - WALL / 2, DOL_H / 2, (eastBot.z0 + eastBot.z1) / 2]} castShadow receiveShadow><boxGeometry args={[WALL, DOL_H, eastBot.z1 - eastBot.z0]} />{wallMat}</mesh>
      {/* door header + the glass doors, propped open */}
      <mesh position={[r.x + r.w - WALL / 2, DOL_H - 0.4, dol.door.y]}><boxGeometry args={[WALL, 0.8, dol.doorWidth]} />{wallMat}</mesh>
      <mesh position={[r.x + r.w + 0.4, 1.2, dol.door.y - doorHalf - 0.05]} rotation={[0, 0.5, 0]}><boxGeometry args={[0.04, 2.4, 1.1]} /><meshStandardMaterial color="#9fd3e6" transparent opacity={0.5} /></mesh>
      {/* roof */}
      <mesh ref={roofRef} position={[cx, DOL_H + 0.15, cz]}>
        <boxGeometry args={[r.w + 0.6, 0.3, r.h + 0.6]} />
        <meshStandardMaterial color="#3a352f" />
      </mesh>
      {/* sign over the door */}
      <mesh position={[r.x + r.w + 0.02, 3.2, dol.door.y]}><boxGeometry args={[0.06, 0.7, 3.2]} /><meshStandardMaterial color="#1c4d7a" /></mesh>
      <DolInterior />
    </group>
  );
}

function DolInterior() {
  const dol = QuietRoads.sim.map.dol;
  const carrierRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((st) => {
    const phase = useGameStore.getState().phase;
    if (phase === 'quiz' || phase === 'card') return;
    const at = QuietRoads.sim.interior.myaCarrierAt;
    if (carrierRef.current) { carrierRef.current.visible = !!at; if (at) carrierRef.current.position.set(at.x, 0.2, at.y); }
    if (screenRef.current) screenRef.current.emissiveIntensity = 1.4 + Math.sin(st.clock.elapsedTime * 9) * 0.15; // emergency power flicker
  });
  return (
    <group>
      {dol.blocked.map((b, i) => (
        <mesh key={i} position={[b.x + b.w / 2, 0.45, b.y + b.h / 2]} castShadow receiveShadow>
          <boxGeometry args={[b.w, 0.9, b.h]} />
          <meshStandardMaterial color={i === 0 ? '#6e5a44' : i >= 5 ? '#5a5f66' : '#4c5a6e'} roughness={0.9} />
        </mesh>
      ))}
      {/* number board */}
      <mesh position={[dol.labels[0].pos.x + 1.2, 2.4, dol.floor.y + 0.35]}>
        <boxGeometry args={[2.2, 0.6, 0.08]} />
        <meshStandardMaterial color="#111" emissive="#ff3b1f" emissiveIntensity={0.9} />
      </mesh>
      {/* the terminal: a desk-top screen still lit */}
      <group position={[dol.terminal.x, 0, dol.terminal.y]}>
        <mesh position={[0, 1.15, 0]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.05]} />
          <meshStandardMaterial ref={screenRef} color="#0c1a24" emissive="#5fd3ff" emissiveIntensity={1.4} />
        </mesh>
        <pointLight position={[0, 1.4, 0.3]} intensity={2.5} distance={5} color="#5fd3ff" />
      </group>
      {/* Mya's carrier, left by the terminal */}
      <group ref={carrierRef} visible={false}>
        <mesh castShadow><boxGeometry args={[0.55, 0.4, 0.38]} /><meshStandardMaterial color="#5a4a3a" /></mesh>
        <mesh position={[0, 0.02, 0.2]}><boxGeometry args={[0.5, 0.32, 0.02]} /><meshStandardMaterial color="#222" wireframe /></mesh>
      </group>
    </group>
  );
}

// ─── Ali on foot: a pink jacket, two carriers, a loose orange cat when it goes wrong ──
function Walker() {
  const root = useRef<THREE.Group>(null);
  const myaRef = useRef<THREE.Mesh>(null);
  const gracieCarrierRef = useRef<THREE.Mesh>(null);
  const gracieLooseRef = useRef<THREE.Mesh>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const g = root.current; if (!g) return;
    const w = QuietRoads.sim.walker;
    const walking = useGameStore.getState().phase === 'walking';
    g.visible = walking;
    if (!walking) return;
    g.position.set(w.pos.x, 0, w.pos.y);
    g.rotation.y = -w.facing - Math.PI / 2; // core facing 0 = +X; model forward is -Z
    if (myaRef.current) myaRef.current.visible = w.carriers.mya;
    if (gracieCarrierRef.current) gracieCarrierRef.current.visible = w.carriers.gracie;
    // Legs alternate — one swings forward while the other swings back
    const swing = Math.sin(st.clock.elapsedTime * (w.speed > 1.8 ? 14 : 9)) * Math.min(w.speed, 1) * 0.35;
    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
  });
  useFrame(() => {
    const gl = gracieLooseRef.current; if (!gl) return;
    const w = QuietRoads.sim.walker;
    gl.visible = w.gracie.loose && useGameStore.getState().phase === 'walking';
    if (gl.visible) gl.position.set(w.gracie.pos.x, 0.18, w.gracie.pos.y);
  });
  return (
    <>
    <GracieLoose refObj={gracieLooseRef} />
    <group ref={root} visible={false}>
      <group position={[0, 0.45, 0]}>
        <mesh ref={leftLegRef}  position={[-0.11, 0, 0]}><boxGeometry args={[0.16, 0.9, 0.2]} /><meshStandardMaterial color="#2b3440" /></mesh>
        <mesh ref={rightLegRef} position={[0.11, 0, 0]}><boxGeometry args={[0.16, 0.9, 0.2]} /><meshStandardMaterial color="#2b3440" /></mesh>
      </group>
      <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.46, 0.62, 0.28]} /><meshStandardMaterial color="#F28DB2" roughness={0.9} /></mesh>
      <mesh position={[0, 1.7, 0]} castShadow><sphereGeometry args={[0.17, 10, 8]} /><meshStandardMaterial color="#d9a98e" /></mesh>
      <mesh position={[0, 1.78, -0.02]}><sphereGeometry args={[0.19, 10, 8]} /><meshStandardMaterial color="#3b2418" /></mesh>
      {/* carriers, one each side */}
      <mesh ref={myaRef} position={[-0.45, 0.55, 0.05]} castShadow><boxGeometry args={[0.36, 0.34, 0.5]} /><meshStandardMaterial color="#5a4a3a" /></mesh>
      <mesh ref={gracieCarrierRef} position={[0.45, 0.55, 0.05]} castShadow><boxGeometry args={[0.36, 0.34, 0.5]} /><meshStandardMaterial color="#7a5f45" /></mesh>
    </group>
    </>
  );
}

function GracieLoose({ refObj }: { refObj: React.RefObject<THREE.Mesh> }) {
  return <mesh ref={refObj} visible={false}><boxGeometry args={[0.22, 0.2, 0.42]} /><meshStandardMaterial color="#F2A63B" /></mesh>;
}

// ─── Parking stalls with the target lit up ───────────────────────────────────
function ParkingStalls() {
  const lot = QuietRoads.sim.map.parking;
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st) => {
    if (!glow.current) return;
    const phase = useGameStore.getState().phase;
    if (phase === 'quiz' || phase === 'card') return;
    const active = QuietRoads.sim.missionId === 'minigame_park_dol';
    glow.current.opacity = active ? 0.22 + Math.sin(st.clock.elapsedTime * 3) * 0.1 : 0.0;
  });
  const t = lot.stalls[lot.target];
  return (
    <group>
      {lot.stalls.map((s, i) => (
        <group key={i}>
          <Line a={{ x: s.x, y: s.y }} b={{ x: s.x, y: s.y + s.h }} width={0.12} />
          <Line a={{ x: s.x + s.w, y: s.y }} b={{ x: s.x + s.w, y: s.y + s.h }} width={0.12} />
        </group>
      ))}
      {/* head curb along the south edge of the stalls */}
      <mesh position={[lot.stalls[0].x + (lot.stalls.length * 2.9) / 2 - 0.15, 0.08, t.y + t.h + 0.12]}>
        <boxGeometry args={[lot.stalls.length * 2.9, 0.16, 0.25]} />
        <meshStandardMaterial color="#c9c3b8" />
      </mesh>
      <mesh position={[t.x + t.w / 2, 0.03, t.y + t.h / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t.w, t.h]} />
        <meshBasicMaterial ref={glow} color="#F28DB2" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GridMarks() {
  const g = QuietRoads.sim.map.grid;
  const bea = g.beaStall;
  const tuna = g.tunaStall;
  return (
    <group>
      <Line a={{ x: bea.x, y: bea.y }} b={{ x: bea.x, y: bea.y + bea.h }} width={0.1} color="#c4b89a" />
      <Line a={{ x: bea.x + bea.w, y: bea.y }} b={{ x: bea.x + bea.w, y: bea.y + bea.h }} width={0.1} color="#c4b89a" />
      <Line a={{ x: tuna.x, y: tuna.y }} b={{ x: tuna.x + tuna.w, y: tuna.y }} width={0.1} color="#c4b89a" />
      <Line a={{ x: tuna.x, y: tuna.y + tuna.h }} b={{ x: tuna.x + tuna.w, y: tuna.y + tuna.h }} width={0.1} color="#c4b89a" />
      <Line a={{ x: g.lanes.x0 + (g.lanes.x1 - g.lanes.x0) * (2 / 3), y: g.bus.y }} b={{ x: g.lanes.x1, y: g.bus.y }} width={0.18} color="#e8d63a" />
    </group>
  );
}

function LedgerMarks() {
  const g = QuietRoads.sim.map.ledger;
  const rightBoundary = g.lanes.x0 + (g.lanes.x1 - g.lanes.x0) * (1 / 3);   // between right + middle
  const leftBoundary = g.lanes.x0 + (g.lanes.x1 - g.lanes.x0) * (2 / 3);    // between middle + left
  return (
    <group>
      {/* right-lane boundary: broken north of the solid line, solid south of it */}
      <Dashes a={{ x: rightBoundary, y: g.lanes.y0 }} b={{ x: rightBoundary, y: g.solidY }} />
      <Line a={{ x: rightBoundary, y: g.solidY }} b={{ x: rightBoundary, y: g.lanes.y1 }} color="#ffffff" width={0.18} />
      <Dashes a={{ x: leftBoundary, y: g.lanes.y0 }} b={{ x: leftBoundary, y: g.lanes.y1 }} />
      {/* the lane-drop zone */}
      <RectPlane r={g.merge} y={MARK_Y} color="#8a7a4a" opacity={0.22} />
    </group>
  );
}

function LedgerLead() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const led = QuietRoads.sim.ledger;
    const phase = useGameStore.getState().phase;
    if (!led.mission || phase !== 'driving') { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.set(led.leadPos.x, 0, led.leadPos.y);
    ref.current.rotation.y = -led.leadHeading - Math.PI / 2; // core 0 = +X; model forward = -Z
  });
  return (
    <group ref={ref} visible={false}>
      {/* cab (front, -Z) + box body (rear, +Z) */}
      <mesh position={[0, 1.15, -1.9]} castShadow>
        <boxGeometry args={[2.2, 1.7, 1.8]} />
        <meshStandardMaterial color="#8a9aa0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.9, 1.1]} castShadow>
        <boxGeometry args={[2.2, 2.5, 4.2]} />
        <meshStandardMaterial color="#c9c3b8" roughness={0.85} />
      </mesh>
    </group>
  );
}

function RibbonMarks() {
  const g = QuietRoads.sim.map.ribbon;
  const b1 = g.lanes.x0 + (g.lanes.x1 - g.lanes.x0) * (1 / 3);   // right ↔ middle
  const b2 = g.lanes.x0 + (g.lanes.x1 - g.lanes.x0) * (2 / 3);   // middle ↔ left
  const rampEndY = g.ramp.y + g.ramp.h;
  return (
    <group>
      <Dashes a={{ x: b1, y: g.lanes.y0 }} b={{ x: b1, y: g.lanes.y1 }} />
      <Dashes a={{ x: b2, y: g.lanes.y0 }} b={{ x: b2, y: g.lanes.y1 }} />
      {/* ramp's left edge (solid) — the line you cross to merge into the flow */}
      <Line a={{ x: g.ramp.x, y: g.ramp.y }} b={{ x: g.ramp.x, y: rampEndY }} color="#ffffff" width={0.18} />
      {/* the paint line where the ramp dies into the right lane */}
      <Line a={{ x: g.ramp.x, y: rampEndY }} b={{ x: g.ramp.x + g.ramp.w, y: rampEndY }} color="#e8d63a" width={0.18} />
    </group>
  );
}

function RibbonLead() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const rb = QuietRoads.sim.ribbon;
    const cv = QuietRoads.sim.convoy;
    const phase = useGameStore.getState().phase;
    const lead = rb.mission ? rb : cv.mission === "mission_convoy_issaquah" ? cv : null;
    if (!lead || phase !== 'driving') { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.set(lead.leadPos.x, 0, lead.leadPos.y);
    ref.current.rotation.y = -lead.leadHeading - Math.PI / 2;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 3.6]} />
        <meshStandardMaterial color="#4d96ff" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function KentWorld() {
  const map = QuietRoads.sim.map;
  return (
    <group>
      {/* Ground + collider (road surface at Y=0, 1 m thick below) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[map.bounds.w / 2, 0.5, map.bounds.h / 2]} position={[map.bounds.x + map.bounds.w / 2, -0.5, map.bounds.y + map.bounds.h / 2]} friction={0} />
        {/* map edge walls */}
        <CuboidCollider args={[map.bounds.w / 2, 3, 1]} position={[map.bounds.x + map.bounds.w / 2, 3, map.bounds.y]} />
        <CuboidCollider args={[map.bounds.w / 2, 3, 1]} position={[map.bounds.x + map.bounds.w / 2, 3, map.bounds.y + map.bounds.h]} />
        <CuboidCollider args={[1, 3, map.bounds.h / 2]} position={[map.bounds.x, 3, map.bounds.y + map.bounds.h / 2]} />
        <CuboidCollider args={[1, 3, map.bounds.h / 2]} position={[map.bounds.x + map.bounds.w, 3, map.bounds.y + map.bounds.h / 2]} />
      </RigidBody>
      <RectPlane r={map.bounds} y={0} color="#4f5f45" />

      {map.roads.map((r, i) => <RectPlane key={i} r={r.rect} y={ROAD_Y} color={r.name?.endsWith('LOT') ? '#5b5e63' : '#3a3d42'} />)}
      {map.centerLines.map(([a, b], i) => <Dashes key={i} a={a} b={b} />)}
      {map.stopLines.map(([a, b], i) => <Line key={i} a={a} b={b} />)}
      {map.schoolZone && <RectPlane r={map.schoolZone} y={MARK_Y} color="#ffe680" opacity={0.12} />}

      {map.rail && (
        <group>
          <RectPlane r={{ x: map.rail.from.x, y: map.rail.from.y - 1.5, w: map.rail.to.x - map.rail.from.x, h: 3 }} y={MARK_Y} color="#6a5a48" />
          <Line a={{ x: map.rail.from.x, y: map.rail.from.y - 0.8 }} b={{ x: map.rail.to.x, y: map.rail.to.y - 0.8 }} color="#3b3b3b" width={0.12} />
          <Line a={{ x: map.rail.from.x, y: map.rail.from.y + 0.8 }} b={{ x: map.rail.to.x, y: map.rail.to.y + 0.8 }} color="#3b3b3b" width={0.12} />
        </group>
      )}

      {map.buildings.map((b, i) => <Building key={i} r={b.rect} label={b.label} />)}
      <ClipboardWoman />
      {map.signs.map((s, i) => <Sign key={i} s={s} />)}
      <ParkingStalls />
      <GridMarks />
      <LedgerMarks />
      <LedgerLead />
      <RibbonMarks />
      <RibbonLead />
      <Walker />

      {/* Grandma's carport */}
      <mesh position={[13.5, 1.4, -13.5]}><boxGeometry args={[7, 0.15, 5]} /><meshStandardMaterial color="#555a60" /></mesh>
      {[[10.5, -11.5], [16.5, -11.5], [10.5, -15.5], [16.5, -15.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.7, z]}><cylinderGeometry args={[0.06, 0.06, 1.4, 6]} /><meshStandardMaterial color="#333" /></mesh>
      ))}
    </group>
  );
}

/** Kept for parity with the HUD noise ring; a THREE color per Quiet state. */
export const QUIET_COLORS = [new THREE.Color('#6b6f73'), new THREE.Color('#a39d5c'), new THREE.Color('#c4763a'), new THREE.Color('#b23a3a')];
