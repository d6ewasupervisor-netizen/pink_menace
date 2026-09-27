/**
 * HeadlightBeam — the visible pool on the road ahead of the car.
 * The spot lights brighten the asphalt; this unlit wedge is the edge you
 * can still read when the night ambient is almost nothing.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { headlightReachM, headlightWidthM } from '@/systems/headlights';

const FRONT_OFFSET = 2.1;

function beamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  if (!g) return null;
  const along = g.createLinearGradient(0, canvas.height, 0, 0);
  along.addColorStop(0, 'rgba(255, 236, 190, 0.9)');
  along.addColorStop(0.4, 'rgba(255, 220, 150, 0.4)');
  along.addColorStop(1, 'rgba(255, 210, 140, 0)');
  g.fillStyle = along;
  g.fillRect(0, 0, canvas.width, canvas.height);
  const side = g.createLinearGradient(0, 0, canvas.width, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.2, 'rgba(0,0,0,0)');
  side.addColorStop(0.8, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function HeadlightBeam() {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const map = useMemo(() => beamTexture(), []);

  useFrame(() => {
    const g = group.current;
    const m = mesh.current;
    if (!g || !m) return;
    const st = useGameStore.getState();
    const night = st.timeOfDay === 'night' || st.timeOfDay === 'sunset';
    const driving = st.phase === 'driving';
    const led = useQRStore.getState().items.includes('led_lights');
    const reach = night && driving ? headlightReachM(st.headlights, led && st.headlights === 'high') : 0;
    g.visible = reach > 0.5;
    if (!g.visible) return;
    const [x, , z] = st.vehiclePosition;
    g.position.set(x, 0.025, z);
    g.rotation.set(0, st.vehicleHeading, 0);
    const width = headlightWidthM(st.headlights) * (led && st.headlights === 'high' ? 1.15 : 1);
    m.scale.set(width, reach, 1);
    m.position.z = -(FRONT_OFFSET + reach / 2);
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={map ?? undefined}
          color="#ffe6b0"
          transparent
          depthWrite={false}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}
