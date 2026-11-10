/**
 * Game3D — Root component: Canvas + Physics + all systems
 * Main 3D game scene built with React Three Fiber.
 */
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import { useQRStore } from '@/stores/qrStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useTouchControls } from '@/hooks/useTouchControls';
import { useQuizManager } from '@/systems/QuizManager';
import { AudioManager } from '@/systems/AudioManager';
import { getSlipState } from '@/systems/VehicleController';
import { liveDrive } from '@/systems/driveTelemetry';
import { PHYSICS_STEP_SECONDS } from '@/systems/physicsStep';
import { getWeather } from './Skybox';
import { isLowEndDevice, recordDelta, stepQuality, initialQualityState, dprForTier, type QualityState, type QualityTier } from '@/utils/performance';
import { initialTier, pickTier, readTierOverride, tierBelow } from '@/utils/qualityPick';
import { bindHeld } from '@/input/driveInput';
import { textScaleStyle } from '@/input/textSize';
import { onContextLost, onContextRestored } from '@/systems/glContext';
import { diagEnabled, type GpuReport } from '@/systems/diagnostics';
import { FieldDiagnostics, DiagPanel } from './FieldDiagnostics';
import { DriveSync } from '@/systems/DriveSync';

import { Lighting } from './Lighting';
import { Skybox } from './Skybox';
import { Vehicle } from './Vehicle';
import { GameCamera } from './GameCamera';
import { LoadingScreen } from './LoadingScreen';
import { CockpitHUD } from './CockpitHUD';
import { StrandedContinue } from './StrandedContinue';
import { ShopCounter } from './ShopCounter';
import { CreditsScreen } from './CreditsScreen';
import { QuizOverlay } from './QuizOverlay';
import { TouchOverlay } from './TouchOverlay';
import { PauseMenu, VictoryScreen, GameOverScreen } from './PauseMenu';
import { MainMenu } from './MainMenu';
import { LovesStopScreen, OutOfGasScreen } from './LovesStopScreen';
import { PostProcessing } from './PostProcessing';
import { SkidMarks } from './SkidMarks';
import { SceneEnvironment } from './SceneEnvironment';
import { NpcState } from '@/systems/TrafficManager';
import { KentWorld } from './KentWorld';
import { ContinuousRoad } from './ContinuousRoad';
import { QuietSwarm } from './QuietSwarm';
import { StoppingShadow } from './StoppingShadow';
import { HeadlightBeam } from './HeadlightBeam';
import { HeadlightFlares } from './HeadlightFlares';
import { DialogueBox } from './DialogueBox';
import { SceneDirector } from './SceneDirector';
import { GracieQTE } from './GracieQTE';
import { CockpitQTE } from './CockpitQTE';
import { HandsOffOverlay } from './HandsOffOverlay';
import { WindAssistHUD } from './WindAssistHUD';
import { CardOverlay } from './CardOverlay';
import { GradeDebrief } from './GradeDebrief';
import { ScareOverlay } from './ScareOverlay';

/**
 * The LEGACY highway world — the endless road, its traffic, coins and colliders —
 * is not the world Quiet Roads drives in (`worldMode === 'kent'` is the only mode the
 * product sets). It used to be imported eagerly, and importing it was not free: each
 * of those four modules preloads its own Kenney GLBs at import time (15 models,
 * ~1.5 MB), so a phone downloaded a highway it would never see before it drew a car.
 *
 * Lazy, they cost nothing until something actually renders them, which is exactly
 * item 2.3's "only the world the player is in loads up front".
 */
const RoadChunks = lazy(() => import('./RoadChunks').then((m) => ({ default: m.RoadChunks })));
const TrafficRenderer = lazy(() => import('./TrafficRenderer').then((m) => ({ default: m.TrafficRenderer })));
const Collectibles = lazy(() => import('./Collectibles').then((m) => ({ default: m.Collectibles })));
const CollisionSystem = lazy(() => import('./CollisionSystem').then((m) => ({ default: m.CollisionSystem })));

// ─── Low-end detection (computed once) ───────────────────────────────────────
const LOW_END = isLowEndDevice();

/**
 * Which tier this device starts on (item 2.1) — computed once, in `qualityPick`, so
 * the model loader (`Vehicle.tsx`) starts on the same tier this Canvas does.
 */
const START_TIER: QualityTier = initialTier();
/** The explicit choice (`?tier=` or a save), if there is one — it pins the tier. */
const TIER_OVERRIDE = readTierOverride();

/**
 * `?diag=1` — the live board: GPU, tier, DPR, buffer, draw calls, triangles,
 * frame time, mean luminance, context state, scene. Read once at module load, so
 * the panel cannot appear mid-session by accident. Off by default.
 */
const DIAG = diagEnabled();

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
function PerfRecorder({
  onTier,
  onTierDown,
}: {
  onTier: (t: QualityTier) => void;
  /** Called once, when a device that was not overridden cannot hold 50 ms. */
  onTierDown: () => void;
}) {
  const qualityRef = useRef<QualityState>(initialQualityState(LOW_END ? 'mid' : 'high'));
  // Item 2.1's own guard: a phone that cannot hold 50 ms for three seconds gets
  // one step down, once, and the client says so. `stepQuality` below keeps its
  // own (slower) recovery rules; this is the cheap, early answer.
  const slowS = useRef(0);
  const stepped = useRef(false);

  useFrame((_, delta) => {
    // ?profileDrive frame-time counter.
    recordDelta(delta);
    // Draw calls / triangles come from the Kent scene pass — see KentPassProbe.

    if (delta * 1000 > 50) slowS.current += delta;
    else slowS.current = 0;
    if (!stepped.current && slowS.current >= 3) {
      stepped.current = true;
      onTierDown();
    }

    const before = qualityRef.current.tier;
    const next = stepQuality(qualityRef.current, delta * 1000, delta);
    qualityRef.current = next;
    // Only re-render when the tier actually changes, never per frame.
    if (next.tier !== before) onTier(next.tier);
  });

  return null;
}

// ─── WebGL context-loss guard (runs inside Canvas for gl.domElement) ────────
function GLContextGuard({ dpr, tier }: { dpr: number; tier: QualityTier }) {
  const { gl } = useThree();
  // The render loop keeps calling three while the context is gone, and three
  // throws (`Cannot read properties of null (reading 'alpha')` — a lost context
  // has no attributes to read). That throw unmounts the React tree: HUD, pause
  // menu and all. Measured in a headless Chromium by `e2e/never-black.spec.ts`'s
  // forced-loss case. Parking the loop for the duration is the whole fix.
  const setFrameloop = useThree((s) => s.setFrameloop);
  // P3: a second loss must not overwrite prePausePhase. This ref is the flag
  // the pure rule reads; the decision itself lives in systems/glContext.
  const lostWhilePaused = useRef(false);

  useEffect(() => {
    const el = gl.domElement;
    let askRestore: number | null = null;
    const clearAsk = () => {
      if (askRestore != null) {
        window.clearTimeout(askRestore);
        askRestore = null;
      }
    };

    const onLost = (e: Event) => {
      e.preventDefault(); // allow the browser to offer a restore, don't kill the canvas
      setFrameloop('never');
      // The row carries what the phone could not say before: which scene, which
      // tier, and how big the buffer was when the lights went out.
      DriveSync.noteEvent({
        ts: Date.now(),
        event: 'client.context_lost',
        data: {
          scene: useQRStore.getState().sceneId,
          tier,
          dpr,
          buffer: `${gl.domElement.width}x${gl.domElement.height}`,
          phase: useGameStore.getState().phase,
        },
      });
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
      // Say it on screen while it is true: a black view with a live HUD and no
      // words was the whole bug report.
      useQRHud.getState().setTransient({ toast: 'Restarting view…' });
      // If the browser does not hand a context back, ask it to — once. Without
      // this the canvas stays black forever and nothing ever retries.
      clearAsk();
      askRestore = window.setTimeout(() => {
        askRestore = null;
        try {
          gl.forceContextRestore();
        } catch {
          // A WebGL1 context without the extension has no way back; the chip
          // stays up and the player can reload. Not a crash.
        }
      }, 5000);
    };

    const onRestored = () => {
      clearAsk();
      DriveSync.noteEvent({
        ts: Date.now(),
        event: 'client.context_restored',
        data: { scene: useQRStore.getState().sceneId, tier },
      });
      const decision = onContextRestored(dpr);
      // The browser resets the pixel ratio when the context is recreated, so the
      // tier (the single DPR owner) has to write it again — once, with its own
      // current value. Nothing else writes DPR.
      gl.setPixelRatio(decision.pixelRatio);
      if (decision.clearToast) useQRHud.getState().setTransient({ toast: '' });
      // decision.autoResume is always false — the player resumes, not the browser.
      lostWhilePaused.current = false;
      // The loop was parked on the loss; it is safe to draw again.
      setFrameloop('always');
    };
    el.addEventListener('webglcontextlost', onLost, false);
    el.addEventListener('webglcontextrestored', onRestored, false);
    return () => {
      clearAsk();
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl, dpr, tier]);
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
function Scene({ tier }: { tier: QualityTier }) {
  const npcsRef = useRef<NpcState[]>([]);
  const worldMode = useGameStore((s) => s.worldMode);
  // The cheap tier is cheap everywhere: one flag, read by the world pieces that
  // know how to spend less (fewer props, fewer cars, no environment map).
  const lowEnd = tier === 'low';

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
      <SceneEnvironment lowEnd={tier !== 'high'} />
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
      <Vehicle tier={tier} />
      <HeadlightBeam />
      <HeadlightFlares />
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
  const [tier, setTier] = useState<QualityTier>(START_TIER);
  // An override PINS the tier: a bug report that asks for ?tier=high must run high,
  // not quietly step down on the first slow frame. Everything below checks it.
  const overrodeTier = useRef(TIER_OVERRIDE !== null);
  const onTier = useCallback((t: QualityTier) => {
    if (overrodeTier.current) return;
    setTier(t);
  }, []);
  // A device that was measured (not overridden) can be re-measured once the GPU
  // string is readable; an override is never second-guessed.
  const onDevice = useCallback((report: GpuReport) => {
    if (overrodeTier.current) return;
    const picked = pickTier({
      gpu: report.unmaskedRenderer ?? report.renderer,
      deviceMemory: report.deviceMemory,
      hardwareConcurrency: report.hardwareConcurrency,
      dpr: report.dpr,
    });
    setTier((prev) => (prev === picked ? prev : picked));
  }, []);
  const onTierDown = useCallback(() => {
    if (overrodeTier.current) return;
    setTier((prev) => {
      const next = tierBelow(prev);
      if (next === prev) return prev;
      DriveSync.noteEvent({
        ts: Date.now(),
        event: 'client.tier_down',
        data: { from: prev, to: next, why: 'frame>50ms for 3s', override: overrodeTier.current },
      });
      return next;
    });
  }, []);
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
        shadows={tier === 'high' ? 'soft' : false}
        camera={{ fov: 75, near: 0.1, far: 1500 }}
        gl={{ antialias: tier !== 'low', powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene tier={tier} />
          <PostProcessing tier={tier} />
          <AudioBridge />
          <GLContextGuard dpr={dpr} tier={tier} />
          <FieldDiagnostics tier={tier} onDevice={onDevice} />
          <SceneDirector />
          <PerfRecorder onTier={onTier} onTierDown={onTierDown} />
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
        <ShopCounter />
        <StrandedContinue />
        <CockpitQTE />
        <HandsOffOverlay />
        <WindAssistHUD />
        <ScareOverlay />
        <CardOverlay />
        <GradeDebrief />
        <CreditsScreen />
        <PauseMenu onExit={onExit} />
        <VictoryScreen onExit={onExit} />
        <GameOverScreen />
        <MainMenu onExit={onExit} />
        <LovesStopScreen />
        <OutOfGasScreen />
        {DIAG && <DiagPanel />}
      </div>
    </div>
  );
}
