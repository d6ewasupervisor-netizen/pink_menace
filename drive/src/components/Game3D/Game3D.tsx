/**
 * Game3D — Root component: Canvas + Physics + all systems
 * Main 3D game scene built with React Three Fiber.
 */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

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
import { isLowEndDevice, recordDelta, stepQuality, initialQualityState, dprForTier, type QualityState, type QualityTier } from '@/utils/performance';
import { bindHeld } from '@/input/driveInput';
import { textScaleStyle } from '@/input/textSize';
import { onContextLost, onContextRestored } from '@/systems/glContext';

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
import { GradeDebrief } from './GradeDebrief';
import { ScareOverlay } from './ScareOverlay';

// ─── Low-end detection (computed once) ───────────────────────────────────────
const LOW_END = isLowEndDevice();

// ─── Quality tiers (P8) ──────────────────────────────────────────────────────
// ONE system owns DPR: the tier. It is chosen from measured frame time via the
// pure reducer in utils/performance, and the Canvas `dpr` prop is its only
// writer.
//
// There used to be a second writer: drei's <AdaptiveDpr>, mounted beside the
// Canvas. It calls R3F's setDpr() on its own schedule, so the renderer's pixel
// ratio was being set from two places and neither owned the value. It is gone.
// drei's <PerformanceMonitor> also went with it — its onDecline/onIncline were
// no-ops, and the frame time it measured is the `delta` PerfRecorder already
// reads on the same frame. On a context restore GLContextGuard below writes the
// tier's ratio once, which is the only other place DPR is touched.
function PerfRecorder({ onTier }: { onTier: (t: QualityTier) => void }) {
  const qualityRef = useRef<QualityState>(initialQualityState(LOW_END ? 'mid' : 'high'));

  useFrame((_, delta) => {
    // ?profileDrive frame-time counter.
    recordDelta(delta);
    // Draw calls / triangles come from the Kent scene pass — see KentPassProbe.

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
  // P3: a second loss must not overwrite prePausePhase. This ref is the flag
  // the pure rule reads; the decision itself lives in systems/glContext.
  const lostWhilePaused = useRef(false);

  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault(); // allow the browser to offer a restore, don't kill the canvas
      useQRHud.getState().addTelemetry({ ts: Date.now(), event: 'webgl.context_lost' });
      const s = useGameStore.getState();
      const decision = onContextLost({
        phase: s.phase,
        prePausePhase: s.prePausePhase,
        lostWhilePaused: lostWhilePaused.current,
      });
      if (decision.paused) {
        lostWhilePaused.current = true;
        useGameStore.setState({ phase: decision.phase as typeof s.phase, prePausePhase: decision.prePausePhase as typeof s.prePausePhase });
      }
      useQRHud.getState().setTransient({ toast: 'Graphics paused. Tap Resume to continue.' });
    };
    const onRestored = () => {
      useQRHud.getState().addTelemetry({ ts: Date.now(), event: 'webgl.context_restored' });
      const decision = onContextRestored(dpr);
      // The browser resets the pixel ratio when the context is recreated, so the
      // tier (the single DPR owner) has to write it again — once, with its own
      // current value. Nothing else writes DPR.
      gl.setPixelRatio(decision.pixelRatio);
      if (decision.clearToast) useQRHud.getState().setTransient({ toast: '' });
      // decision.autoResume is always false — the player resumes, not the browser.
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

  // P12: text size. It is a CSS variable on the HTML overlay only — the 3D
  // world is never scaled.
  const textSize = useGameStore((s) => s.textSize);

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

  // ── Keyboard: the bound pause key(s) toggle pause ─────────────────────────
  useEffect(() => {
    const handleKey = () => {
      if (bindHeld('pause', useGameStore.getState().binds)) togglePause();
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
        // The drive root swallows every gesture: no scroll chain to the page
        // behind it, no pinch-zoom, no pull-to-refresh.
        touchAction: 'none',
        overscrollBehavior: 'none',
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
            ONE pixel-ratio writer. The Canvas `dpr` prop above is the tier's only
            writer, and GLContextGuard re-applies that same tier ratio on a context
            restore. drei's <AdaptiveDpr> used to sit here as a second writer —
            it calls R3F's setDpr() on its own schedule, so nothing owned the
            value — and <PerformanceMonitor> was mounted with no-op handlers
            alongside it. Both are gone.
          */}
        </Suspense>
      </Canvas>

      {/* HTML overlay layer (outside Canvas) */}
      <div className="ui-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...textScaleStyle(textSize) }}>
        <LoadingScreen />
        <CockpitHUD />
        <QuizOverlay />
        <TouchOverlay />
        <GracieQTE />
        <DialogueBox />
        <ScareOverlay />
        <CardOverlay />
        <GradeDebrief />
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
