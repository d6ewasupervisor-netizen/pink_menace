/**
 * HeadlightFlares — the glow on the player's headlights and the cars ahead.
 *
 * It used to be postprocessing's `LensFlare` effect on the high tier. That effect
 * does not compile against this three.js: the console says
 *
 *     THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
 *     Material Name: EffectMaterial
 *     Program Info Log: Fragment shader is not compiled.
 *     ERROR: 0:668: 'vTexCoord' : redefinition
 *
 * and `EffectMaterial` is the composer's own material — so the *whole* post pass
 * fails, and a night scene with the lights on renders black while the HUD keeps
 * running. That is the 6.3 report, reproduced in a headless browser, and it is
 * why pressing LOW "changed nothing": LOW was what mounted the broken pass.
 *
 * The glow is now four additive sprites in the scene — no post pass, no custom
 * shader, nothing that can fail to compile, and cheaper than the effect was. The
 * positions are the same ones the flares used (the nose of the Beetle and the two
 * nearest cars ahead).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';
import { getNpcFlareSources } from './trafficFlareSources';

const VEHICLE_SCALE = 0.75;
const HEADLIGHT_LEFT = new THREE.Vector3(-0.55 * VEHICLE_SCALE, 0.45 * VEHICLE_SCALE, -2.1 * VEHICLE_SCALE);
const HEADLIGHT_RIGHT = new THREE.Vector3(0.55 * VEHICLE_SCALE, 0.45 * VEHICLE_SCALE, -2.1 * VEHICLE_SCALE);

function localHeadlightToWorld(
  local: THREE.Vector3,
  vehiclePos: [number, number, number],
  heading: number,
  out: THREE.Vector3
) {
  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);
  const rx = local.x * cosH + local.z * sinH;
  const rz = -local.x * sinH + local.z * cosH;
  out.set(vehiclePos[0] + rx, vehiclePos[1] + local.y, vehiclePos[2] + rz);
}

/** One radial gradient, reused by every flare. */
function flareTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,246,226,1)');
  grad.addColorStop(0.22, 'rgba(255,232,196,0.62)');
  grad.addColorStop(0.55, 'rgba(255,214,166,0.16)');
  grad.addColorStop(1, 'rgba(255,200,150,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function HeadlightFlares() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const phase = useGameStore((s) => s.phase);
  const headlights = useGameStore((s) => s.headlights);
  const active = phase === 'driving' && headlights !== 'off' && (timeOfDay === 'night' || timeOfDay === 'sunset');
  const isNight = timeOfDay === 'night';

  const texture = useMemo(() => flareTexture(), []);
  useEffect(() => () => texture?.dispose(), [texture]);

  const leftPos = useRef(new THREE.Vector3());
  const rightPos = useRef(new THREE.Vector3());
  const npcPos0 = useRef(new THREE.Vector3(0, -500, 0));
  const npcPos1 = useRef(new THREE.Vector3(0, -500, 0));
  const left = useRef<THREE.Sprite>(null);
  const right = useRef<THREE.Sprite>(null);
  const npc0 = useRef<THREE.Sprite>(null);
  const npc1 = useRef<THREE.Sprite>(null);

  useFrame(() => {
    const warm = isNight ? 1.6 : 1.2;
    const set = (sprite: THREE.Sprite | null, pos: THREE.Vector3, size: number, tint: number) => {
      if (!sprite) return;
      sprite.visible = active;
      if (!active) return;
      sprite.position.copy(pos);
      sprite.scale.set(size, size, 1);
      (sprite.material as THREE.SpriteMaterial).color.setRGB(tint, tint * 0.92, tint * 0.8);
    };

    if (active) {
      const { vehiclePosition, vehicleHeading } = useGameStore.getState();
      localHeadlightToWorld(HEADLIGHT_LEFT, vehiclePosition, vehicleHeading, leftPos.current);
      localHeadlightToWorld(HEADLIGHT_RIGHT, vehiclePosition, vehicleHeading, rightPos.current);

      const npcSources = getNpcFlareSources();
      if (npcSources[0]?.strength > 0) npcPos0.current.copy(npcSources[0].position);
      else npcPos0.current.set(0, -500, 0);
      if (npcSources[1]?.strength > 0) npcPos1.current.copy(npcSources[1].position);
      else npcPos1.current.set(0, -500, 0);
    }

    set(left.current, leftPos.current, 1.7, warm);
    set(right.current, rightPos.current, 1.5, warm);
    set(npc0.current, npcPos0.current, 1.1, 0.9);
    set(npc1.current, npcPos1.current, 0.8, 0.7);
  });

  if (!texture) return null;

  return (
    <>
      <sprite ref={left} visible={false}>
        <spriteMaterial map={texture} blending={THREE.AdditiveBlending} transparent depthWrite={false} depthTest={false} opacity={0.9} />
      </sprite>
      <sprite ref={right} visible={false}>
        <spriteMaterial map={texture} blending={THREE.AdditiveBlending} transparent depthWrite={false} depthTest={false} opacity={0.85} />
      </sprite>
      <sprite ref={npc0} visible={false}>
        <spriteMaterial map={texture} color="#ff5a3c" blending={THREE.AdditiveBlending} transparent depthWrite={false} depthTest={false} opacity={0.55} />
      </sprite>
      <sprite ref={npc1} visible={false}>
        <spriteMaterial map={texture} color="#ff5a3c" blending={THREE.AdditiveBlending} transparent depthWrite={false} depthTest={false} opacity={0.45} />
      </sprite>
    </>
  );
}
