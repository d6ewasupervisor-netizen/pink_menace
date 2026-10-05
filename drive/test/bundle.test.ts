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
  isActPlayable,
  preloadAct,
  isActLoaded,
  loadAct,
  resetLoadedActs,
  sceneIdsIn,
  PRELOADED_ACT,
  ACT_ONE_DIALOGUE,
} from '../src/quietroads/dialogue/actDialogue';
import { prepareScene, gotoScene, actForNextScene, preloadNextScene } from '../src/quietroads/dialogue/sceneRouter';
import { DialogueRunner } from '../src/quietroads/dialogue/DialogueRunner';
import type { DialogueFile, DialogueHost } from '../src/quietroads/dialogue/types';

/**
 * A host that does nothing: the scene router never touches the world, only the
 * runner's scene table, so the campaign chain is testable with no store, no
 * React and no window.
 */
function stubHost(): DialogueHost {
  const vars: Record<string, number> = {};
  const flags: Record<string, boolean> = {};
  return {
    getVar: (n) => vars[n] ?? NaN,
    setVar: (n, v) => { vars[n] = v; },
    addVar: (n, d) => { vars[n] = (vars[n] || 0) + d; },
    getFlag: (n) => flags[n],
    setFlag: (n, v) => { flags[n] = v; },
    hasItem: () => false,
    giveItem: () => {},
    unlock: () => {},
    emitNoise: () => {},
    playSfx: () => {},
    animCue: () => {},
    checkpoint: () => {},
    ledger: () => {},
    logEvent: () => {},
    logChoice: () => {},
    startGameplay: () => {},
    setTimer: () => 0,
    clearTimer: () => {},
    now: () => 0,
    random: () => 0,
  };
}

/** A runner holding only Act I — the state the entry chunk actually ships. */
function runnerWithActOne(): DialogueRunner {
  const r = new DialogueRunner(stubHost());
  for (const f of ACT_ONE_DIALOGUE) r.load(structuredClone(f) as unknown as DialogueFile);
  return r;
}

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
    expect(actForSceneId('5.1')).toBe('V');
    expect(actForSceneId('6.1b')).toBe('VI');
    expect(actForSceneId('7.1')).toBe('VI');
    expect(actForSceneId('8.1')).toBe('VII');
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

  it('never loads Act VII — it stays closed', async () => {
    expect(isActPlayable('VII')).toBe(false);
    expect(isActPlayable('VI')).toBe(true);
    await expect(loadAct('VII')).rejects.toThrow(/closed/);
    // A prefetch must not sneak it in either.
    preloadAct('VII');
    expect(isActLoaded('VII')).toBe(false);
  });

  it('Act VI owns 7.1 / 7.2 / 7.3, so the Act 6 → 7 jump has a destination', async () => {
    // Act VI ends by handing off to 7.1, which is where V-006 lives. If the
    // act7 file rode Act VII, that jump threw "Dialogue scene missing: 7.1".
    await loadAct('VI');
    const scenes = sceneIdsIn('VI');
    for (const id of ['6.1', '6.1b', '6.2', '6.3', '7.1', '7.2', '7.3']) {
      expect(scenes).toContain(id);
    }
  });
});

/**
 * The campaign has to be able to CHANGE scenes.
 *
 * At startup only Act I is in the entry chunk, and `startScene` throws on any
 * scene the runner has not been handed. These walk the real next_scene chain on a
 * real DialogueRunner and assert the destination is present AND started — not that
 * a chunk happens to contain a matching string.
 */
describe('P3 — every act boundary in the campaign chain', () => {
  /** The campaign's playable chain, in play order, as the dialogue hands off. */
  const CHAIN = [
    '1.4b', '2.1', '2.2', '2.3a', '2.3b', '2.3c', '2.3d', '2.4',
    '2.5', '3.1', '3.1b', '3.2', '3.3', '3.4a', '3.5',
    '4.1', '4.2', '5.1', '5.2', '5.3',
    '6.1', '6.1b', '6.2', '6.3', '7.1', '7.2', '7.3',
  ];

  it('walks every next_scene jump: the destination is present and started', async () => {
    const runner = runnerWithActOne();
    for (const sceneId of CHAIN) {
      const ok = await prepareScene(runner, sceneId);
      expect({ sceneId, ok }).toEqual({ sceneId, ok: true });
      expect(runner.hasScene(sceneId)).toBe(true);
    }
    // And each one actually starts, rather than merely existing in the table.
    for (const sceneId of CHAIN) {
      expect(await gotoScene(runner, sceneId)).toBe(true);
      expect(runner.scene?.id).toBe(sceneId);
    }
  });

  it('starts Act I and then crosses into Act II — the jump that used to throw', async () => {
    const runner = runnerWithActOne();
    expect(await gotoScene(runner, '1.4b')).toBe(true);
    // Act I ends with next_scene 2.1, and only Act I is loaded at this point.
    expect(runner.hasScene('2.1')).toBe(false);
    const next = actForNextScene(runner.scene);
    expect(next).toBe('2.1');
    expect(await gotoScene(runner, next!)).toBe(true);
    expect(runner.scene?.id).toBe('2.1');
  });

  it('reaches every act-select entry scene, and none of them falls back to 0.1', async () => {
    const runner = runnerWithActOne();
    // ACT_ENTRY from actChallenges.ts — the ids MainMenu hands to startAct.
    for (const entry of ['2.1', '2.5', '4.1', '3.1b', '6.1b']) {
      expect(await gotoScene(runner, entry)).toBe(true);
      expect(runner.scene?.id).toBe(entry);
    }
  });

  it('reaches 7.1 with its card node, and ends the campaign at the 8.1 jump', async () => {
    const runner = runnerWithActOne();
    // Act 6 ends by handing off to 7.1. V-006 lives in scene 7.1.
    expect(await gotoScene(runner, '6.3')).toBe(true);
    expect(actForNextScene(runner.scene)).toBe('7.1');
    expect(await gotoScene(runner, '7.1')).toBe(true);
    expect(runner.scene?.id).toBe('7.1');
    expect(runner.scene?.nodes['7.1.card_V-006']?.card).toBe('V-006');

    expect(await gotoScene(runner, '7.2')).toBe(true);
    expect(await gotoScene(runner, '7.3')).toBe(true);
    // 7.3 hands off to 8.1, the closed Act VII. That must END the campaign, not
    // throw "Dialogue scene missing: 8.1".
    expect(actForNextScene(runner.scene)).toBe('8.1');
    expect(await gotoScene(runner, '8.1')).toBe(false);
    expect(runner.scene?.id).toBe('7.3');
    expect(isActLoaded('VII')).toBe(false);
  });

  it('an unknown scene id is refused rather than thrown on', async () => {
    const runner = runnerWithActOne();
    expect(await gotoScene(runner, '9.9')).toBe(false);
    expect(await gotoScene(runner, '')).toBe(false);
  });

  it('preloads the act that owns the upcoming next_scene, not the next act letter', async () => {
    // nextAct('III') used to answer 'V', which skipped the exam at 4.1 entirely:
    // 2.5 (III) hands off to 3.1 (V's files), then 3.5 hands off to 4.1 (IV) —
    // a jump no single act-order chain could name. Reading the scene's own
    // next_scene names it exactly.
    const CASES = [
      { id: '1.4', next: '2.1', act: 'II' },
      { id: '2.5', next: '3.1', act: 'V' },
      { id: '3.5', next: '4.1', act: 'IV' },
      { id: '6.3', next: '7.1', act: 'VI' },
    ];
    for (const c of CASES) {
      // A minimal scene whose only node hands off to `next`.
      const file: DialogueFile = {
        meta: { schema_version: '1.3.0', acts: [1], locale: 'en-US' },
        characters: { A: { name: 'A' } },
        scenes: {
          [c.id]: {
            id: c.id, act: 1, title: c.id, type: 'still', entry: 'end',
            nodes: { end: { type: 'end', next_scene: c.next } },
          },
        },
      };
      const runner = new DialogueRunner(stubHost());
      runner.load(structuredClone(file) as unknown as DialogueFile);
      runner.startScene(c.id);
      const next = actForNextScene(runner.scene);
      expect({ id: c.id, next, act: actForSceneId(next!) }).toEqual(c);
      preloadNextScene(runner);
    }
    // Act IV — the exam — is what got warmed off 3.5, not Act V.
    expect(isActLoaded('IV')).toBe(true);
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