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
import { useTiltSteering } from '@/hooks/useTiltSteering';
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
// PostProcessing is loaded lazily, under the first-frame boundary (see PostProcessingLazy).
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
/**
 * The post stack (postprocessing + @react-three/postprocessing) is a chunk of its own.
 * The first frame is the road, the sky and the car; a bloom pass arriving 300 ms later
 * is invisible, and `TIER_EFFECTS.low` is one vignette, so a phone on the cheap tier
 * pays for the module only when it is already drawing.
 */
const PostProcessingLazy = lazy(() => import('./PostProcessing').then((m) => ({ default: m.PostProcessing })));


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

/**
 * ITEM 1.5 — the reload fallback, and why its timer is not owned by the effect.
 *
 * A lost context is not always recoverable. When the render loop keeps throwing,
 * three's throw unmounts the React tree, the effect's cleanup runs — so a timer
 * owned by the effect would be cancelled by the very crash it exists to recover
 * from. The give-up timer therefore lives beside the module; only
 * `webglcontextrestored` clears it.
 *
 * The flag survives the reload in `sessionStorage`, so the page that comes back
 * says "Restarting view…" instead of pretending nothing happened. The run itself
 * needs no flag: the checkpoint is in the persisted store (`quiet-roads-save`),
 * and `QuietRoads.start(false)` re-enters the scene it names.
 */
const RESTART_VIEW_FLAG = 'qr-restarting-view';
let giveUpTimer: number | null = null;

function clearGiveUp(): void {
  if (giveUpTimer != null) {
    window.clearTimeout(giveUpTimer);
    giveUpTimer = null;
  }
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
      // ITEM 1.5 — one cheap ask first: some browsers hand the context back on
      // their own, and a restore costs the player nothing.
      clearAsk();
      askRestore = window.setTimeout(() => {
        askRestore = null;
        try {
          gl.forceContextRestore();
        } catch {
          // No extension: the reload below is the fallback, not a crash.
        }
      }, 1500);

      // ...and if it is still gone at 5 s, stop trying to save the frame and save
      // the run instead. The flush is keepalive, so the save leaves with the
      // unload; the reload re-enters the scene from the persisted checkpoint.
      clearGiveUp();
      giveUpTimer = window.setTimeout(() => {
        giveUpTimer = null;
        // It came back between the last check and now — nothing to recover.
        let stillLost = true;
        try {
          stillLost = gl.getContext().isContextLost();
        } catch {
          stillLost = true; // a dead context is exactly the case this is for
        }
        if (!stillLost) return;

        try {
          sessionStorage.setItem(RESTART_VIEW_FLAG, '1');
        } catch {
          /* denied storage is not a failed reload */
        }
        DriveSync.noteEvent({
          ts: Date.now(),
          event: 'client.context_reload',
          data: { scene: useQRStore.getState().sceneId, tier },
        });
        const reload = () => window.location.reload();
        // Never let a hung save hold the black screen: 1.5 s, then reload anyway.
        const guard = window.setTimeout(reload, 1500);
        void DriveSync.flush(true).finally(() => {
          window.clearTimeout(guard);
          reload();
        });
      }, 5000);
    };

    const onRestored = () => {
      clearAsk();
      // The view is alive: there is nothing left to give up on.
      clearGiveUp();
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
      // `giveUpTimer` is deliberately NOT cleared here: this cleanup runs on the
      // very unmount a lost context causes, and a fallback that a crash cancels is
      // not a fallback. `webglcontextrestored` and the reload clear it instead.
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
      {/* The car has its own boundary: the GLB is 1 MB and the road does not need it. */}
      <Suspense fallback={null}>
        <Vehicle tier={tier} />
      </Suspense>
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

  // P12: text size. It is a CSS variable — the 3D world is never scaled.
  const textSize = useGameStore((s) => s.textSize);

  /**
   * ITEM 6.1 — the player's text scale, written where it can be read.
   *
   * The variable was set as an inline style on the `.ui-layer` div, so it was true
   * for the overlays inside that subtree and false for any surface mounted outside
   * it (a portal, a dialog, the next HUD that forgets). `textScaleStyle` is the one
   * mapping from the store's step to the value; this effect is its one writer, and
   * it writes to the document root — the same place `data-reduced-motion` already
   * lives (`Game3D`'s effect below), so both accessibility switches are one fact
   * and `e2e/text-scale.spec.ts` can measure the row from anywhere in the page.
   */
  useEffect(() => {
    const root = document.documentElement;
    const style = textScaleStyle(textSize);
    for (const [name, value] of Object.entries(style)) root.style.setProperty(name, value);
    return () => {
      for (const name of Object.keys(style)) root.style.removeProperty(name);
    };
  }, [textSize]);

  /**
   * ITEM 1.5 — the other side of the reload. `GLContextGuard`'s give-up timer sets
   * the flag just before it reloads; the page that comes back says "Restarting
   * view…" for five seconds, then takes the chip down. Clearing the flag on read
   * means a later, ordinary reload never inherits the words.
   */
  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(RESTART_VIEW_FLAG) === '1';
      if (flagged) sessionStorage.removeItem(RESTART_VIEW_FLAG);
    } catch {
      return;
    }
    if (!flagged) return;
    useQRHud.getState().setTransient({ toast: 'Restarting view…' });
    const clear = window.setTimeout(() => {
      if (useQRHud.getState().toast === 'Restarting view…') useQRHud.getState().setTransient({ toast: '' });
    }, 5000);
    return () => window.clearTimeout(clear);
  }, []);

  const { saveProgress } = useGameProgress();

  // Register systems
  useTouchControls();
  // ITEM 4.2: the phone's roll, when the player turned it on. It attaches one
  // listener and merges as a steering source behind the keys, pad and stick.
  useTiltSteering();
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

  /**
   * ITEM 5.1 — reduced motion's second door. The OS preference is a media query;
   * the settings row is a store boolean. `cockpit/tokens.ts` declares `.qr-anim`
   * as the one switch for every animated surface, and its CSS reads this
   * attribute — so the in-game toggle stops the CSS too, not just the camera.
   * Written only when the value changes: this runs on the store's bus, and the
   * bus fires for the frame loop as well.
   */
  useEffect(() => {
    const apply = (on: boolean) => {
      document.documentElement.dataset.reducedMotion = on ? 'true' : 'false';
    };
    apply(useGameStore.getState().reducedMotion);
    return useGameStore.subscribe((s, prev) => {
      if (s.reducedMotion !== prev.reducedMotion) apply(s.reducedMotion);
    });
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
        {/*
          TWO Suspense BOUNDARIES, ON PURPOSE (item 2.3).

          The world used to sit in one boundary with everything else, and the car's
          GLB suspends: so the *whole* subtree — the frame loop included — waited for
          a 1 MB model before the first frame could be drawn. Measured on a throttled
          Pixel 7: 13.9 s, almost exactly the time to fetch the JS and then the car.

          The frame loop, the context guard and the diagnostics never load an asset,
          so they are OUTSIDE the boundary; and the car has its own boundary inside
          the scene, so the road, the sky and the cockpit draw while the Beetle
          arrives. A black screen is still a failure (Phase 1); *no car yet* is not.
        */}
        <AudioBridge />
        <GLContextGuard dpr={dpr} tier={tier} />
        <FieldDiagnostics tier={tier} onDevice={onDevice} />
        <SceneDirector />
        <PerfRecorder onTier={onTier} onTierDown={onTierDown} />
        <Suspense fallback={null}>
          <Scene tier={tier} />
        </Suspense>
        {/* The post stack is its own chunk: the first frame does not need a bloom. */}
        <Suspense fallback={null}>
          <PostProcessingLazy tier={tier} />
        </Suspense>
        {/*
          ONE pixel-ratio writer. The Canvas `dpr` prop above is the tier's only
          writer, and GLContextGuard re-applies that same tier ratio on a context
          restore. drei's <AdaptiveDpr> used to sit here as a second writer — it
          calls R3F's setDpr() on its own schedule, so nothing owned the value — and
          <PerformanceMonitor> was mounted with no-op handlers alongside it. Both are
          gone, which is why this boundary holds nothing.
        */}
      </Canvas>

      {/* HTML overlay layer (outside Canvas) */}
      <div className="ui-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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
