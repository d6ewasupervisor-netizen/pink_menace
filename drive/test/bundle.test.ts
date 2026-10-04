/**
 * P3 — the split bundle, the act preload, the act-change disposal, and the
 * WebGL context-loss edges.
 *
 * The context-loss rule is a pure function (systems/glContext), so the
 * double-loss prePausePhase rule is testable without a canvas.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { onContextLost, onContextRestored, LOSS_PAUSE_PHASES } from '../src/systems/glContext';
import {
  registerActResource,
  disposeActResources,
  actResourceCount,
  resetActResources,
} from '../src/quietroads/sim/actResources';
import {
  actForSceneId,
  nextAct,
  preloadAct,
  isActLoaded,
  loadAct,
  PRELOADED_ACT,
  ACT_ONE_DIALOGUE,
} from '../src/quietroads/dialogue/actDialogue';

describe('P3 — a second context loss does not overwrite prePausePhase', () => {
  it('the first loss while driving pauses and records driving', () => {
    const d = onContextLost({ phase: 'driving', prePausePhase: 'driving', lostWhilePaused: false });
    expect(d.paused).toBe(true);
    expect(d.phase).toBe('paused');
    expect(d.prePausePhase).toBe('driving');
  });

  it('a second loss while paused for loss leaves prePausePhase alone', () => {
    // After the first loss the store reads phase 'paused', prePausePhase 'driving'.
    const afterFirst = { phase: 'paused', prePausePhase: 'driving', lostWhilePaused: true };
    const second = onContextLost(afterFirst);
    expect(second.paused).toBe(false);
    expect(second.prePausePhase).toBe('driving');   // NOT overwritten with 'paused'
    expect(second.phase).toBe('paused');
  });

  it('a third loss still does not clobber it', () => {
    const state = { phase: 'paused', prePausePhase: 'walking', lostWhilePaused: true };
    expect(onContextLost(state).prePausePhase).toBe('walking');
  });

  it('does not change phase in menu, quiz, or a pause the player chose', () => {
    for (const phase of ['menu', 'quiz', 'victory', 'gameover', 'paused']) {
      const d = onContextLost({ phase, prePausePhase: 'driving', lostWhilePaused: false });
      expect(d.paused).toBe(false);
      expect(d.phase).toBe(phase);
      expect(d.prePausePhase).toBe('driving');
    }
  });

  it('pauses out of every phase that should be pausable', () => {
    for (const phase of LOSS_PAUSE_PHASES) {
      expect(onContextLost({ phase, prePausePhase: 'driving', lostWhilePaused: false }).paused).toBe(true);
    }
  });

  it('is pure — it never mutates the state it was given', () => {
    const state = { phase: 'driving', prePausePhase: 'driving', lostWhilePaused: false };
    const snapshot = { ...state };
    onContextLost(state);
    expect(state).toEqual(snapshot);
  });

  it('restore re-applies the tier pixel ratio, clears the toast, never auto-resumes', () => {
    const r = onContextRestored(1);
    expect(r.pixelRatio).toBe(1);
    expect(r.clearToast).toBe(true);
    expect(r.autoResume).toBe(false);
    expect(onContextRestored(1.5).pixelRatio).toBe(1.5);
  });
});

describe('P3 — act dialogue loads per act', () => {
  it('Act I is in the first load', async () => {
    expect(PRELOADED_ACT).toBe('I');
    // Act I's files are available without touching a dynamic import.
    const actI = await loadAct('I');
    expect(actI.length).toBeGreaterThan(0);
    expect(Object.keys(actI[0].scenes!)).toContain('0.1');
    expect(ACT_ONE_DIALOGUE.length).toBe(actI.length);
  });

  it('maps scene ids to their act', () => {
    expect(actForSceneId('0.1')).toBe('I');
    expect(actForSceneId('1.4b')).toBe('I');
    expect(actForSceneId('2.1')).toBe('II');
    expect(actForSceneId('2.5')).toBe('III');
    expect(actForSceneId('3.1')).toBe('V');
    expect(actForSceneId('4.1')).toBe('IV');
    expect(actForSceneId('6.1b')).toBe('VI');
    expect(actForSceneId('nope')).toBe(null);
  });

  it('loads an act on demand and serves it from cache the second time', async () => {
    expect(isActLoaded('V')).toBe(false);
    preloadAct('V');
    const files = await loadAct('V');
    expect(isActLoaded('V')).toBe(true);
    // Act V spans the convoy (3.x) and the ribbon (5.x) files.
    const scenes = files.flatMap((f) => Object.keys(f.scenes ?? {}));
    expect(scenes).toContain('3.1');
    expect(scenes).toContain('5.1');
    // Second call is the same array — no second fetch.
    expect(await loadAct('V')).toBe(files);
  });

  it('knows which act comes next, and stops before the closed act', () => {
    expect(nextAct('I')).toBe('II');
    expect(nextAct('II')).toBe('III');
    expect(nextAct('V')).toBe('VI');
    expect(nextAct('VI')).toBe(null);   // VII stays closed
  });
});

describe('P3 — act change disposes only what that act created', () => {
  beforeEach(() => resetActResources());

  function fake() {
    let disposed = 0;
    return { item: { dispose: () => { disposed++; } }, count: () => disposed };
  }

  it("disposes the previous act's own resources", () => {
    const a = fake();
    registerActResource('I', a.item);
    expect(disposeActResources('I')).toBe(1);
    expect(a.count()).toBe(1);
    expect(actResourceCount('I')).toBe(0);
  });

  it('leaves shared highway chunks alone', () => {
    const shared = fake();
    const own = fake();
    registerActResource('highway', shared.item, true);
    registerActResource('I', own.item);
    expect(disposeActResources('I')).toBe(1);
    expect(own.count()).toBe(1);
    // The shared one is still registered and still undisposed.
    expect(shared.count()).toBe(0);
    expect(actResourceCount('highway', true)).toBe(1);
  });

  it('only touches the named act', () => {
    const i = fake(), ii = fake();
    registerActResource('I', i.item);
    registerActResource('II', ii.item);
    expect(disposeActResources('I')).toBe(1);
    expect(i.count()).toBe(1);
    expect(ii.count()).toBe(0);
    expect(actResourceCount('II')).toBe(1);
  });

  it('the unregister function removes a resource without disposing it', () => {
    const a = fake();
    const off = registerActResource('I', a.item);
    off();
    expect(disposeActResources('I')).toBe(0);
    expect(a.count()).toBe(0);
  });
});