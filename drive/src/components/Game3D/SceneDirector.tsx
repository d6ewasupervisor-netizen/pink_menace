import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, type CameraMode } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { actForScene } from '@/quietroads';
import { specForAct } from './sceneSpec';

/**
 * SceneDirector — applies the per-act scene spec and the Q1/C hybrid camera:
 * cockpit (over-the-hood) while driving, an exterior view for low-speed
 * maneuvers (parking, backing, chain-up), and exterior framing for cutscenes.
 * Mounted inside the Canvas; it only sets state when the target changes.
 */

const MANEUVER_BELOW = 2.5; // mph — at/below this, pull back to exterior
const DRIVE_ABOVE = 5.0;    // mph — at/above this, go over-the-hood

export function SceneDirector() {
  const camRef = useRef<CameraMode>('quiet');

  useFrame(() => {
    const g = useGameStore.getState();
    if (g.worldMode !== 'kent') return;
    const { phase } = g;

    const sceneId = useQRStore.getState().sceneId;
    const act = sceneId ? actForScene(sceneId) : null;
    const spec = specForAct(act ?? 'I');

    let target: CameraMode = g.cameraMode;

    if (phase === 'driving') {
      // Hysteresis so stop-and-go at lights doesn't flap between views.
      if (spec.maneuverCam) {
        const speed = g.velocityMph;
        if (camRef.current !== 'quiet' && speed < MANEUVER_BELOW) camRef.current = 'quiet';
        else if (camRef.current !== 'cockpit' && speed > DRIVE_ABOVE) camRef.current = 'cockpit';
      } else {
        camRef.current = spec.driveView; // no maneuver cam: lock the act's view
      }
      target = camRef.current;
    } else if (phase === 'dialogue' || phase === 'card' || phase === 'walking' || phase === 'paused' || phase === 'menu' || phase === 'quiz') {
      // Cutscenes, prompts and the terminal read better pulled back.
      camRef.current = 'quiet';
      target = 'quiet';
    }

    if (target !== g.cameraMode) useGameStore.setState({ cameraMode: target });
  });

  return null;
}