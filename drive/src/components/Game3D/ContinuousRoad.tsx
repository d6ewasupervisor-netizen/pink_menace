/**
 * ContinuousRoad — each scene corridor is its own road, built from a moving
 * window of RoadSegment pieces. The Kent city board does not carry these.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import {
  SEGMENT_M,
  type Corridor,
  type SegmentSlot,
  nearCorridor,
  windowSlots,
} from '@/quietroads/sim/corridors';

/**
 * P14 — the repeated segment meshes draw as instanced batches instead of ~6
 * meshes per segment. Each solid segment keeps its own CuboidCollider, so the
 * surface the car drives on is unchanged and segments are never merged.
 */
interface SegmentPiece {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  rot?: number;
}

export interface SegmentBatches {
  shoulder: { color: string; pieces: SegmentPiece[] };
  road: { color: string; pieces: SegmentPiece[] };
  centreLine: { color: string; pieces: SegmentPiece[] };
  ribbonEdge: { color: string; pieces: SegmentPiece[] };
  rail: { color: string; pieces: SegmentPiece[] };
  ice: SegmentPiece[];
}

const FLAT = -Math.PI / 2;

/** Build a corridor's batches from its slots. Pure — same input, same output. */
export function buildSegmentBatches(corridor: Corridor, slots: SegmentSlot[]): SegmentBatches {
  const east = corridor.axis === 'east';
  const driveW = east ? corridor.road.h : corridor.road.w;
  const cross = driveW + corridor.shoulder * 2;
  const deckX = east ? SEGMENT_M : driveW;
  const deckZ = east ? driveW : SEGMENT_M;
  const yRail = east ? deckZ / 2 : 0;
  const xRail = east ? 0 : deckX / 2;

  const shoulder: SegmentPiece[] = [], road: SegmentPiece[] = [], centreLine: SegmentPiece[] = [];
  const ribbonEdge: SegmentPiece[] = [], rail: SegmentPiece[] = [], ice: SegmentPiece[] = [];

  for (const slot of slots) {
    const { x: bx, y: bz } = slot;
    shoulder.push({ x: bx, y: corridor.deck ? -0.12 : -0.01, z: bz, sx: east ? SEGMENT_M : cross, sy: 1, sz: east ? cross : SEGMENT_M, rot: FLAT });
    road.push({ x: bx, y: 0.02, z: bz, sx: deckX, sy: 1, sz: deckZ, rot: FLAT });
    centreLine.push({ x: bx, y: 0.03, z: bz, sx: east ? SEGMENT_M * 0.42 : 0.16, sy: 1, sz: east ? 0.16 : SEGMENT_M * 0.42, rot: FLAT });
    if (corridor.id === 'ribbon') {
      ribbonEdge.push({ x: bx + (east ? 0 : -driveW / 6), y: 0.03, z: bz + (east ? -driveW / 6 : 0), sx: east ? SEGMENT_M * 0.42 : 0.12, sy: 1, sz: east ? 0.12 : SEGMENT_M * 0.42, rot: FLAT });
      ribbonEdge.push({ x: bx + (east ? 0 : driveW / 6), y: 0.03, z: bz + (east ? driveW / 6 : 0), sx: east ? SEGMENT_M * 0.42 : 0.12, sy: 1, sz: east ? 0.12 : SEGMENT_M * 0.42, rot: FLAT });
    }
    if (corridor.deck) {
      const rx = east ? 0 : xRail, rz = east ? yRail : 0;
      rail.push({ x: bx + rx, y: 0.45, z: bz + rz, sx: east ? SEGMENT_M : 0.35, sy: 0.7, sz: east ? 0.35 : SEGMENT_M });
      rail.push({ x: bx - rx, y: 0.45, z: bz - rz, sx: east ? SEGMENT_M : 0.35, sy: 0.7, sz: east ? 0.35 : SEGMENT_M });
    }
    if (slot.ice) ice.push({ x: bx, y: 0.035, z: bz, sx: deckX, sy: 1, sz: deckZ, rot: FLAT });
  }

  return {
    shoulder: { color: corridor.shoulderColor, pieces: shoulder },
    road: { color: corridor.roadColor, pieces: road },
    centreLine: { color: corridor.deck ? '#d7dde3' : '#d8b93c', pieces: centreLine },
    ribbonEdge: { color: '#e8e8e8', pieces: ribbonEdge },
    rail: { color: '#9aa3ab', pieces: rail },
    ice,
  };
}

/** One InstancedMesh fed from a piece list. */
function SegmentPieces({ pieces, color, box, opacity = 1, roughness = 0.92 }: {
  pieces: SegmentPiece[]; color: string; box: boolean; opacity?: number; roughness?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    pieces.forEach((p, i) => {
      pos.set(p.x, p.y, p.z);
      e.set(p.rot ?? 0, 0, 0);
      q.setFromEuler(e);
      scale.set(p.sx, box ? p.sy : 1, p.sz);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces, box]);
  if (!pieces.length) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]} receiveShadow={!box}>
      {box ? <boxGeometry args={[1, 1, 1]} /> : <planeGeometry args={[1, 1]} />}
      <meshStandardMaterial color={color} roughness={roughness} transparent={opacity < 1} opacity={opacity} />
    </instancedMesh>
  );
}

/** Colliders only — the drawing is instanced above. One collider per segment. */
function RoadSegment({ corridor, slot }: { corridor: Corridor; slot: SegmentSlot }) {
  const east = corridor.axis === 'east';
  const driveW = east ? corridor.road.h : corridor.road.w;
  const cross = driveW + corridor.shoulder * 2;
  const spanX = east ? SEGMENT_M : (corridor.deck ? driveW : cross);
  const spanZ = east ? (corridor.deck ? driveW : cross) : SEGMENT_M;
  const yRail = east ? spanZ / 2 : 0;
  const xRail = east ? 0 : spanX / 2;
  return (
    <RigidBody type="fixed" colliders={false} position={[slot.x, 0, slot.y]} friction={0}>
      <CuboidCollider args={[spanX / 2, 0.5, spanZ / 2]} position={[0, -0.5, 0]} friction={0} />
      {corridor.deck && (
        <>
          <CuboidCollider args={[east ? SEGMENT_M / 2 : 0.3, 0.45, east ? 0.3 : SEGMENT_M / 2]} position={[east ? 0 : xRail, 0.45, east ? yRail : 0]} />
          <CuboidCollider args={[east ? SEGMENT_M / 2 : 0.3, 0.45, east ? 0.3 : SEGMENT_M / 2]} position={[east ? 0 : -xRail, 0.45, east ? -yRail : 0]} />
        </>
      )}
    </RigidBody>
  );
}

function CorridorStrip({ corridor }: { corridor: Corridor }) {
  const [slots, setSlots] = useState<SegmentSlot[]>([]);
  const sig = useRef('');
  useFrame(() => {
    const [x, , z] = useGameStore.getState().vehiclePosition;
    const player = { x, y: z };
    const next = nearCorridor(corridor, player) ? windowSlots(corridor, player) : [];
    const key = next.map((s) => `${s.index}${s.ice ? 'i' : ''}`).join(',');
    if (key === sig.current) return;
    sig.current = key;
    setSlots(next);
  }, -100);

  const batches = useMemo(() => buildSegmentBatches(corridor, slots), [corridor, slots]);

  if (!slots.length) return null;
  return (
    <group>
      {/* P14: the segment meshes, instanced. Coliders stay per-segment below. */}
      <SegmentPieces pieces={batches.shoulder.pieces} color={batches.shoulder.color} box={false} roughness={0.95} />
      <SegmentPieces pieces={batches.road.pieces} color={batches.road.color} box={false} />
      <SegmentPieces pieces={batches.centreLine.pieces} color={batches.centreLine.color} box={false} roughness={1} />
      <SegmentPieces pieces={batches.ribbonEdge.pieces} color={batches.ribbonEdge.color} box={false} roughness={1} />
      <SegmentPieces pieces={batches.rail.pieces} color={batches.rail.color} box roughness={0.6} />
      <SegmentPieces pieces={batches.ice} color="#d5e4ee" box={false} opacity={0.55} roughness={0.15} />

      {slots.map((slot) => (
        <RoadSegment key={`${corridor.id}-${slot.index}`} corridor={corridor} slot={slot} />
      ))}
      {corridor.pad && (
        <RigidBody type="fixed" colliders={false} position={[corridor.pad.x + corridor.pad.w / 2, 0, corridor.pad.y + corridor.pad.h / 2]}>
          <CuboidCollider args={[corridor.pad.w / 2, 0.5, corridor.pad.h / 2]} position={[0, -0.5, 0]} friction={0} />
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[corridor.pad.w, corridor.pad.h]} />
            <meshStandardMaterial color={corridor.padColor ?? corridor.roadColor} roughness={0.9} />
          </mesh>
        </RigidBody>
      )}
    </group>
  );
}

export function ContinuousRoad() {
  const corridors = QuietRoads.sim.map.corridors;
  return (
    <group>
      {corridors.map((corridor) => (
        <CorridorStrip key={corridor.id} corridor={corridor} />
      ))}
    </group>
  );
}
