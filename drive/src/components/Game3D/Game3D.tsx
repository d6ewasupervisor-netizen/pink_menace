/**
 * Game3D — Root component: Canvas + Physics + all systems
 * Main 3D game scene built with React Three Fiber.
 */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';

import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useTouchControls } from '@/hooks/useTouchControls';
import { useQuizManager } from '@/systems/QuizManager';
import { AudioManager } from '@/systems/AudioManager';
import { getSlipState } from '@/systems/VehicleController';
import { liveDrive } from '@/systems/driveTelemetry';
import { PHYSICS_STEP_SECONDS } from '@/systems/physicsStep';
import { getWeather } from './Skybox';
import { isLowEndDevice, recordDelta, recordPerformanceSample, stepQuality, initialQualityState, dprForTier, type QualityState, type QualityTier } from '@/utils/performance';

import { Lighting } from './Lighting';
import { Skybox } from './Skybox';
import { RoadChunks } from './RoadChunks';
import { Vehicle } from './Vehicle';
import { TrafficRenderer } from './TrafficRenderer';
import { GameCamera } from './GameCamera';
import { LoadingScreen } from './LoadingScreen';
import { CockpitHUD } from './CockpitHUD';
import { QuizOverlay } from './QuizOverlay';
import { TouchOverlay } from './TouchOverlay';
import { PauseMenu, VictoryScreen, GameOverScreen } from './PauseMenu';
import { MainMenu } from './MainMenu';
import { LovesStopScreen, OutOfGasScreen } from './LovesStopScreen';
import { Collectibles } from './Collectibles';
import { CollisionSystem } from './CollisionSystem';
import { PostProcessing } from './PostProcessing';
import { SkidMarks } from './SkidMarks';
import { SceneEnvironment } from './SceneEnvironment';
import { NpcState } from '@/systems/TrafficManager';
import { KentWorld } from './KentWorld';
import { ContinuousRoad } from './ContinuousRoad';
import { QuietSwarm } from './QuietSwarm';
import { StoppingShadow } from './StoppingShadow';
import { HeadlightBeam } from './HeadlightBeam';
import { DialogueBox } from './DialogueBox';
import { SceneDirector } from './SceneDirector';
import { GracieQTE } from './GracieQTE';
import { CardOverlay } from './CardOverlay';
import { ScareOverlay } from './ScareOverlay';

// ─── Low-end detection (computed once) ───────────────────────────────────────
const LOW_END = isLowEndDevice();

// ─── Quality tiers (P8) ──────────────────────────────────────────────────────
// ONE system owns DPR: the tier. It is chosen from measured frame time via the
// pure reducer in utils/performance, and the Canvas `dpr` prop is its only
// writer. The old local PerformanceMonitor used to call gl.setPixelRatio(1)
// after 5 s of slow frames — that second writer is gone. drei's PerformanceMonitor
// supplies the measured frame time; AdaptiveDpr only reacts to an R3F
// regress() (the Canvas `performance` prop is deliberately not set, so nothing
// regresses it behind the tier's back).
function PerfRecorder({ onTier }: { onTier: (t: QualityTier) => void }) {
  const { gl } = useThree();
  const qualityRef = useRef<QualityState>(initialQualityState(LOW_END ? 'mid' : 'high'));

  useFrame((_, delta) => {
    // Existing ?profileDrive counters — frame time, draw calls, triangles.
    recordDelta(delta);
    recordPerformanceSample('previousDrawCalls', gl.info.render.calls);
    recordPerformanceSample('previousTriangles', gl.info.render.triangles);

    const before = qualityRef.current.tier;
    const next = stepQuality(qualityRef.current, delta * 1000, delta);
    qualityRef.current = next;
    // Only re-render when the tier actually changes, never per frame.
    if (next.tier !== before) onTier(next.tier);
  });

  return null;
}

// ─── WebGL context-loss guard (runs inside Canvas for gl.domElement) ────────
function GLContextGuard({ dpr }: { dpr: number }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault(); // allow the browser to offer a restore, don't kill the canvas
      useQRHud.getState().addTelemetry({ ts: Date.now(), event: 'webgl.context_lost' });
      const s = useGameStore.getState();
      if (s.phase === 'driving' || s.phase === 'walking' || s.phase === 'dialogue' || s.phase === 'card') {
        useGameStore.setState({ phase: 'paused', prePausePhase: s.phase });
      }
      useQRHud.getState().setTransient({ toast: 'Graphics paused. Tap Resume to continue.' });
    };
    const onRestored = () => {
      useQRHud.getState().addTelemetry({ ts: Date.now(), event: 'webgl.context_restored' });
      // The browser resets the pixel ratio when the context is recreated, so the
      // tier (the single DPR owner) has to write it again.
      gl.setPixelRatio(dpr);
      useQRHud.getState().setTransient({ toast: '' });
    };
    el.addEventListener('webglcontextlost', onLost, false);
    el.addEventListener('webglcontextrestored', onRestored, false);
    return () => {
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl, dpr]);
  return null;
}

// ─── Audio bridge (runs inside Canvas for useFrame) ─────────────────────────
function AudioBridge() {
  useFrame(() => {
    const { phase, isMuted, mileage } = useGameStore.getState();
    const engineRPM = liveDrive.engineRPM;
    const velocityMph = liveDrive.velocityMph;
    const slip = getSlipState();
    const raining = getWeather(mileage) === 'rain';
    AudioManager.setMuted(isMuted);
    AudioManager.update(engineRPM, velocityMph, slip.slipAmount, phase === 'driving', raining);

    if (phase === 'paused' || phase === 'quiz' || phase === 'gasStation') {
      AudioManager.suspend();
    } else {
      AudioManager.resume();
    }
  });
  return null;
}

// ─── Inner scene (needs Canvas context) ──────────────────────────────────────
function Scene({ lowEnd }: { lowEnd: boolean }) {
  const npcsRef = useRef<NpcState[]>([]);
  const worldMode = useGameStore((s) => s.worldMode);

  const handleNpcsRef = useRef((ref: React.MutableRefObject<NpcState[]>) => {
    npcsRef.current = ref.current;
  }).current;

  return (
    <Physics
      gravity={[0, -9.7119, 0]}
      timeStep={PHYSICS_STEP_SECONDS}
      interpolate={true}
    >
      <Lighting />
      <SceneEnvironment lowEnd={lowEnd} />
      <Skybox />
      {worldMode === 'kent' ? (
        <>
          <KentWorld />
          <ContinuousRoad />
          <QuietSwarm />
          <StoppingShadow />
        </>
      ) : (
        <>
          <RoadChunks lowEnd={lowEnd} />
          <TrafficRenderer lowEnd={lowEnd} onNpcsRef={handleNpcsRef} />
          <Collectibles />
          <CollisionSystem npcsRef={npcsRef} />
        </>
      )}
      <Vehicle />
      <HeadlightBeam />
      <SkidMarks />
      <GameCamera />
    </Physics>
  );
}

// ─── Hooks bridge (runs inside Canvas) ───────────────────────────────────────
// (useQuizManager is NOT a 3D hook — it's called outside Canvas below)

// ─── Main export ─────────────────────────────────────────────────────────────
interface Game3DProps {
  onExit?: () => void;
}

export function Game3D({ onExit }: Game3DProps) {
  const setPhase = useGameStore((s) => s.setPhase);
  const togglePause = useGameStore((s) => s.togglePause);
  const phase = useGameStore((s) => s.phase);
  const mileage = useGameStore((s) => s.mileage);
  const hp = useGameStore((s) => s.hp);
  const fuel = useGameStore((s) => s.fuel);
  const zCoins = useGameStore((s) => s.zCoins);
  const questionsAnswered = useGameStore((s) => s.questionsAnswered);
  const correctAnswers = useGameStore((s) => s.correctAnswers);

  // ── Quality tier (P8): the single owner of DPR and of the post stack ──────
  const [tier, setTier] = useState<QualityTier>(LOW_END ? 'mid' : 'high');
  const onTier = useCallback((t: QualityTier) => setTier(t), []);
  const dpr = dprForTier(tier, typeof window === 'undefined' ? 1 : window.devicePixelRatio, LOW_END);

  const { saveProgress } = useGameProgress();

  // Register systems
  useTouchControls();
  useQuizManager();

  // ── Initialize audio on first user interaction ─────────────────────────────
  useEffect(() => {
    const initAudio = () => {
      if (!AudioManager.initialized) {
        AudioManager.init();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // ── Keyboard: Escape / P to toggle pause ─────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePause]);

  // ── Tab visibility: auto-save on hide ────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        saveProgress({
          currentMile: mileage,
          hp,
          fuel,
          zCoins,
          questionsAnswered,
          correctAnswers,
          completedEncounters: [],
          lastSaveLocation: 'En Route',
        });
        if (phase === 'driving') setPhase('paused');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, mileage, hp, fuel, zCoins, questionsAnswered, correctAnswers, saveProgress, setPhase]);

  // ── Reduced motion: honour the OS preference (never lower it back automatically) ──
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { if (mq.matches) useGameStore.getState().setReducedMotion(true); };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', apply); };
  }, []);

  // ── Load saved backend progress into store on first mount ────────────────
  const { savedProgress } = useGameProgress();
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current || !savedProgress) return;
    loadedRef.current = true;
    const store = useGameStore.getState();
    // Only load if local storage has no progress
    if (store.mileage === 0 && savedProgress.currentMile > 0) {
      useGameStore.setState({
        mileage: savedProgress.currentMile,
        hp: savedProgress.hp,
        zCoins: savedProgress.zCoins,
        questionsAnswered: savedProgress.questionsAnswered,
        correctAnswers: savedProgress.correctAnswers,
      });
    }
  }, [savedProgress]);

  return (
    <div
      id="game-touch-area"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none',
        background: '#0a0a12',
      }}
    >
      {/* 3D Canvas */}
      <Canvas
        frameloop="always"
        dpr={dpr}
        shadows={LOW_END ? false : 'soft'}
        camera={{ fov: 75, near: 0.1, far: 1500 }}
        gl={{ antialias: !LOW_END, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene lowEnd={LOW_END} />
          <PostProcessing tier={tier} />
          <AudioBridge />
          <GLContextGuard dpr={dpr} />
          <SceneDirector />
          <PerfRecorder onTier={onTier} />
          {/*
            drei's PerformanceMonitor is the measured-frame-time source; its
            onDecline/onIncline feed the same pure tier reducer. AdaptiveDpr is
            mounted so a transient R3F regress() can drop the ratio inside the
            tier's ceiling — the Canvas `dpr` prop stays the tier's own writer.
          */}
          <PerformanceMonitor
            bounds={() => [45, 58]}
            onDecline={() => undefined}
            onIncline={() => undefined}
          />
          <AdaptiveDpr pixelated={false} />
        </Suspense>
      </Canvas>

      {/* HTML overlay layer (outside Canvas) */}
      <div className="ui-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <LoadingScreen />
        <CockpitHUD />
        <QuizOverlay />
        <TouchOverlay />
        <GracieQTE />
        <DialogueBox />
        <ScareOverlay />
        <CardOverlay />
        <PauseMenu onExit={onExit} />
        <VictoryScreen onExit={onExit} />
        <GameOverScreen />
        <MainMenu onExit={onExit} />
        <LovesStopScreen />
        <OutOfGasScreen />
      </div>
    </div>
  );
}
