/**
 * PostProcessing — tier-driven. Three quality tiers mount different subsets of
 * the same post stack:
 *   high — bloom, brightness/contrast, hue/saturation, vignette, chromatic
 *          aberration, noise, headlight flares (the current stack, unchanged).
 *   mid  — vignette + colour grade only.
 *   low  — vignette only; no bloom, no chromatic aberration, no noise.
 *
 * The tier comes from utils/performance (a pure function fed measured frame
 * time). Effect *nodes* are mounted by the tier and never recreated per frame:
 * the per-frame work below only mutates intensity on refs that already exist,
 * and the mounted-only guards mean an unmounted effect is skipped entirely.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  BrightnessContrast,
  HueSaturation,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';
import { liveDrive } from '@/systems/driveTelemetry';
import { getWeather } from './Skybox';
import { HeadlightFlares } from './HeadlightFlares';
import { TIER_EFFECTS, type QualityTier } from '@/utils/performance';

export function PostProcessing({ tier = 'high' }: { tier?: QualityTier }) {
  const bloomRef = useRef<any>(null);
  const vignetteRef = useRef<any>(null);
  const chromaRef = useRef<any>(null);
  const brightnessRef = useRef<any>(null);
  const hueSatRef = useRef<any>(null);
  const noiseRef = useRef<any>(null);

  const mounted = useMemo(() => new Set(TIER_EFFECTS[tier].map((e) => e.id)), [tier]);
  // One Vector2 for the whole lifetime of this component. Allocating it here
  // rather than in JSX keeps a per-render allocation out of the tree.
  const chromaOffset = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame(() => {
    const { timeOfDay, mileage, phase, worldMode } = useGameStore.getState();
    const velocityMph = liveDrive.velocityMph;
    if (phase === 'quiz' || phase === 'card') return;
    const weather = getWeather(mileage);
    const speedNorm = Math.min(1, velocityMph / 70);

    // Dynamic bloom — brighter at speed
    const highway = worldMode === 'highway';
    if (bloomRef.current && mounted.has('bloom')) {
      bloomRef.current.intensity = highway ? 0.35 + speedNorm * 0.85 : 0.2 + speedNorm * 0.5;
    }

    // Vignette — stronger at night/sunset
    if (vignetteRef.current && mounted.has('vignette')) {
      const base = timeOfDay === 'night' ? 0.55 : timeOfDay === 'sunset' ? 0.45 : 0.3;
      vignetteRef.current.darkness = base + (highway ? 0.12 : 0) + speedNorm * (highway ? 0.18 : 0.1);
    }

    // Chromatic aberration — subtle at high speed
    if (chromaRef.current && mounted.has('chromaticAberration')) {
      const offset = speedNorm > 0.6 ? (speedNorm - 0.6) * 0.003 : 0;
      chromaRef.current.offset.set(offset, offset);
    }

    // Weather / time color grading
    if (brightnessRef.current && mounted.has('brightnessContrast')) {
      let brightness = 0;
      let contrast = 0;
      if (timeOfDay === 'night') {
        brightness = -0.06;
        contrast = 0.12;
      } else if (timeOfDay === 'sunset') {
        brightness = 0.02;
        contrast = 0.08;
      }
      if (highway) {
        brightness -= 0.02;
        contrast += 0.14;
      }
      if (weather === 'rain') {
        brightness -= 0.08;
        contrast += 0.1;
      } else if (weather === 'overcast') {
        brightness -= 0.03;
        contrast += 0.05;
      }
      brightnessRef.current.brightness = brightness;
      brightnessRef.current.contrast = contrast;
    }

    if (hueSatRef.current && mounted.has('hueSaturation')) {
      let hue = 0;
      let saturation = 0;
      if (timeOfDay === 'sunset') {
        hue = 0.04;
        saturation = 0.08;
      } else if (timeOfDay === 'night') {
        hue = -0.02;
        saturation = -0.25;
      }
      if (highway) saturation -= 0.08;
      if (weather === 'rain') {
        hue -= 0.02;
        saturation -= 0.18;
      }
      hueSatRef.current.hue = hue;
      hueSatRef.current.saturation = saturation;
    }

    // Rain noise — windshield static
    if (noiseRef.current && mounted.has('noise')) {
      noiseRef.current.opacity = weather === 'rain' ? 0.08 : 0;
    }
  });

  // Multisampling is the other half of the low tier's cost: 4× MSAA on high,
  // none at mid or low.
  const multisampling = tier === 'high' ? 4 : 0;

  // One array built from the tier. Effect nodes are created here, when the tier
  // changes — never inside the per-frame path.
  const effects: React.ReactElement[] = [];
  if (mounted.has('bloom')) {
    effects.push(
      <Bloom key="bloom" ref={bloomRef} intensity={0.3} luminanceThreshold={0.8} luminanceSmoothing={0.4} mipmapBlur />,
    );
  }
  if (mounted.has('brightnessContrast')) {
    effects.push(<BrightnessContrast key="bc" ref={brightnessRef} brightness={0} contrast={0} />);
  }
  if (mounted.has('hueSaturation')) {
    effects.push(<HueSaturation key="hs" ref={hueSatRef} hue={0} saturation={0} />);
  }
  if (mounted.has('vignette')) {
    effects.push(<Vignette key="vg" ref={vignetteRef} offset={0.3} darkness={0.4} blendFunction={BlendFunction.NORMAL} />);
  }
  if (mounted.has('chromaticAberration')) {
    effects.push(
      <ChromaticAberration
        key="ca"
        ref={chromaRef}
        offset={chromaOffset}
        radialModulation
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />,
    );
  }
  if (mounted.has('noise')) {
    effects.push(<Noise key="ns" ref={noiseRef} opacity={0} blendFunction={BlendFunction.OVERLAY} />);
  }
  if (mounted.has('headlightFlares')) {
    effects.push(<HeadlightFlares key="fl" />);
  }

  return <EffectComposer multisampling={multisampling}>{effects}</EffectComposer>;
}
