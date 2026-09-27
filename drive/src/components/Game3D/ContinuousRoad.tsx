/**
 * ContinuousRoad — each scene corridor is its own road, built from a moving
 * window of RoadSegment pieces. The Kent city board does not carry these.
 */
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '@/stores/gameStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import {
  SEGMENT_M,
  type Corridor,
  type SegmentSlot,
  nearCorridor,
  windowSlots,
} from '@/quietroads/sim/corridors';

function RoadSegment({ corridor, slot }: { corridor: Corridor; slot: SegmentSlot }) {
  const east = corridor.axis === 'east';
  const driveW = east ? corridor.road.h : corridor.road.w;
  const cross = driveW + corridor.shoulder * 2;
  const spanX = east ? SEGMENT_M : (corridor.deck ? driveW : cross);
  const spanZ = east ? (corridor.deck ? driveW : cross) : SEGMENT_M;
  const deckX = east ? SEGMENT_M : driveW;
  const deckZ = east ? driveW : SEGMENT_M;
  const yRail = east ? deckZ / 2 : 0;
  const xRail = east ? 0 : deckX / 2;

  return (
    <RigidBody type="fixed" colliders={false} position={[slot.x, 0, slot.y]} friction={0}>
      <CuboidCollider
        args={[spanX / 2, 0.5, spanZ / 2]}
        position={[0, -0.5, 0]}
        friction={0}
      />
      {corridor.deck && (
        <>
          <CuboidCollider args={[east ? SEGMENT_M / 2 : 0.3, 0.45, east ? 0.3 : SEGMENT_M / 2]} position={[east ? 0 : xRail, 0.45, east ? yRail : 0]} />
          <CuboidCollider args={[east ? SEGMENT_M / 2 : 0.3, 0.45, east ? 0.3 : SEGMENT_M / 2]} position={[east ? 0 : -xRail, 0.45, east ? -yRail : 0]} />
          <mesh position={[east ? 0 : xRail, 0.45, east ? yRail : 0]}>
            <boxGeometry args={[east ? SEGMENT_M : 0.35, 0.7, east ? 0.35 : SEGMENT_M]} />
            <meshStandardMaterial color="#9aa3ab" roughness={0.6} />
          </mesh>
          <mesh position={[east ? 0 : -xRail, 0.45, east ? -yRail : 0]}>
            <boxGeometry args={[east ? SEGMENT_M : 0.35, 0.7, east ? 0.35 : SEGMENT_M]} />
            <meshStandardMaterial color="#9aa3ab" roughness={0.6} />
          </mesh>
        </>
      )}
      <mesh position={[0, corridor.deck ? -0.12 : -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[east ? SEGMENT_M : cross, east ? cross : SEGMENT_M]} />
        <meshStandardMaterial color={corridor.shoulderColor} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[deckX, deckZ]} />
        <meshStandardMaterial color={corridor.roadColor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[east ? SEGMENT_M * 0.42 : 0.16, east ? 0.16 : SEGMENT_M * 0.42]} />
        <meshBasicMaterial color={corridor.deck ? '#d7dde3' : '#d8b93c'} />
      </mesh>
      {corridor.id === 'ribbon' && (
        <>
          <mesh position={[east ? 0 : -driveW / 6, 0.03, east ? -driveW / 6 : 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[east ? SEGMENT_M * 0.42 : 0.12, east ? 0.12 : SEGMENT_M * 0.42]} />
            <meshBasicMaterial color="#e8e8e8" />
          </mesh>
          <mesh position={[east ? 0 : driveW / 6, 0.03, east ? driveW / 6 : 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[east ? SEGMENT_M * 0.42 : 0.12, east ? 0.12 : SEGMENT_M * 0.42]} />
            <meshBasicMaterial color="#e8e8e8" />
          </mesh>
        </>
      )}
      <mesh name="ice" visible={slot.ice} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[deckX, deckZ]} />
        <meshStandardMaterial color="#d5e4ee" transparent opacity={0.55} roughness={0.15} />
      </mesh>
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

  if (!slots.length) return null;
  return (
    <group>
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
