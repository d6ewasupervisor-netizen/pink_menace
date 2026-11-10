/**
 * The cockpit's one rule, on the stores that feed it.
 *
 * The bug: a card opened in a gameplay scene, the card resolved into
 * `start_gameplay`, and the driving HUD (sticks + dash + noise meter) stayed
 * down — a flag the compound frame sets while a card is up was never cleared on
 * every close path. The fix is a derived rule (`showDrivingHud`) instead of flags
 * each path has to remember to clear, so these tests pin the rule against the two
 * real zustand stores the HUD reads: after every way a card can close, plus
 * `start_gameplay`, the HUD is up; while a card is open, it is down.
 *
 * The store writes below are the ones `QuietRoadsBridge` performs (showCard →
 * `phase: 'card'` + `card`; finishCard → `card: null` + the scene's phase;
 * startGameplay → `syncMission()` → `missionActive: true`). The bridge itself
 * cannot be imported here: it pulls Rapier through VehicleController.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { CockpitState } from '../src/quietroads/cockpit';

type Stores = {
  hud: typeof import('../src/stores/qrHud').useQRHud;
  game: typeof import('../src/stores/gameStore').useGameStore;
  rule: typeof import('../src/quietroads/cockpit');
};
let s: Stores;

beforeAll(async () => {
  // gameStore persists through zustand/persist; node has no localStorage.
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  } as Storage;
  s = {
    hud: (await import('../src/stores/qrHud')).useQRHud,
    game: (await import('../src/stores/gameStore')).useGameStore,
    rule: await import('../src/quietroads/cockpit'),
  };
});

/** What the HUD sees right now, built the way `readCockpitState()` builds it. */
function snapshot(): CockpitState {
  const g = s.game.getState();
  const h = s.hud.getState();
  return {
    phase: g.phase,
    missionActive: h.missionActive,
    cardOpen: Boolean(h.card),
    choiceOpen: Boolean(h.choices),
    debriefOpen: Boolean(h.debrief),
    quizOpen: g.quizActive || g.phase === 'quiz',
    quizResultOpen: g.quizResultOpen,
    storyOnScreen: Boolean(h.line || h.direction),
  };
}

function reset() {
  s.hud.setState({ card: null, choices: null, debrief: null, line: null, direction: null, missionActive: false });
  s.game.setState({ phase: 'driving', quizActive: false, quizResultOpen: false, currentQuestion: null });
}

/** QuietRoadsBridge.showCard: the card owns the screen. */
function openCard(id = 'VII-002') {
  s.hud.setState({ card: { id, source: 'story' } });
  s.game.setState({ phase: 'card' });
}

/** QuietRoadsBridge.syncMission after startGameplay: the mission owns the car. */
function startGameplay() {
  s.hud.setState({ missionActive: true });
  s.game.setState({ phase: 'driving' });
}

type ClosePath = 'answered' | 'timeout' | 'continue-only';
const PATHS: ClosePath[] = ['answered', 'timeout', 'continue-only'];

/**
 * QuietRoadsBridge.finishCard for a story card in a gameplay scene, then
 * `resolveCard` → the effects node → `startGameplay`. Every path runs the same
 * two store writes: the card closes, and the scene's type decides the phase.
 */
function closeCardThenStartMission(_path: ClosePath) {
  s.hud.setState({ card: null });
  s.game.setState({ phase: 'driving' }); // scene.type === 'gameplay'
  startGameplay();
}

describe('showDrivingHud — while a card is open', () => {
  it('is false, and the card is the surface', () => {
    reset();
    openCard();
    const st = snapshot();
    expect(st.cardOpen).toBe(true);
    expect(s.rule.showDrivingHud(st)).toBe(false);
    expect(s.rule.compoundOpen(st)).toBe(true);
  });

  it('does not repair a live card: the phase is the card\'s on purpose', () => {
    reset();
    openCard();
    expect(s.rule.cockpitPhaseFor(snapshot(), false)).toBeNull();
  });
});

describe('showDrivingHud — after the card closes and start_gameplay fires', () => {
  for (const path of PATHS) {
    it(`${path}: the driving HUD is up`, () => {
      reset();
      openCard();
      closeCardThenStartMission(path);
      const st = snapshot();
      expect(st.cardOpen).toBe(false);
      expect(st.missionActive).toBe(true);
      expect(s.rule.showDrivingHud(st)).toBe(true);
      // Nothing left to repair: the phase and the surfaces agree.
      expect(s.rule.staleCockpitFlag(st)).toBeNull();
      expect(s.rule.cockpitPhaseFor(st, false)).toBeNull();
    });
  }

  it('a close followed by a spoken line, then the mission, is up too', () => {
    reset();
    openCard();
    s.hud.setState({ card: null, line: { node_id: '5.2.2' } as never });
    s.game.setState({ phase: 'driving' });
    startGameplay();
    expect(s.rule.showDrivingHud(snapshot())).toBe(true);
  });

  it('never talks over a line: a stale phase with a line up is left alone', () => {
    reset();
    s.hud.setState({ missionActive: true, line: { node_id: 'pad.arrival' } as never });
    s.game.setState({ phase: 'dialogue' });
    const st = snapshot();
    // The HUD is up either way; only the phase repair waits for the line.
    expect(s.rule.showDrivingHud(st)).toBe(true);
    expect(s.rule.cockpitPhaseFor(st, false)).toBeNull();
    s.hud.setState({ line: null });
    expect(s.rule.cockpitPhaseFor(snapshot(), false)).toBe('driving');
  });
});

describe('showDrivingHud — the stale flag is derived away, not cleared by hand', () => {
  it('a mission running with the phase left at "card" still shows the HUD', () => {
    reset();
    s.hud.setState({ missionActive: true });
    s.game.setState({ phase: 'card' }); // the flag nobody cleared
    const st = snapshot();
    expect(st.cardOpen).toBe(false);
    expect(s.rule.showDrivingHud(st)).toBe(true);
    expect(s.rule.staleCockpitFlag(st)).toBe('phase="card"');
    expect(s.rule.cockpitPhaseFor(st, false)).toBe('driving');
  });

  it('a mission running with the phase left at "dialogue" is repaired to driving', () => {
    reset();
    s.hud.setState({ missionActive: true });
    s.game.setState({ phase: 'dialogue' });
    const st = snapshot();
    expect(s.rule.showDrivingHud(st)).toBe(true);
    expect(s.rule.staleCockpitFlag(st)).toBe('phase="dialogue"');
    expect(s.rule.cockpitPhaseFor(st, false)).toBe('driving');
  });

  it('the walker missions are repaired to walking, not driving', () => {
    reset();
    s.hud.setState({ missionActive: true });
    s.game.setState({ phase: 'dialogue' });
    expect(s.rule.cockpitPhaseFor(snapshot(), true)).toBe('walking');
  });

  it('never fights a compound surface: a choice or a debrief keeps it down', () => {
    reset();
    s.hud.setState({ missionActive: true, choices: { node: {}, options: [] } as never });
    s.game.setState({ phase: 'card' });
    expect(s.rule.showDrivingHud(snapshot())).toBe(false);
    expect(s.rule.cockpitPhaseFor(snapshot(), false)).toBeNull();
    s.hud.setState({ choices: null, debrief: { card_id: 'VII-002' } as never });
    expect(s.rule.showDrivingHud(snapshot())).toBe(false);
    expect(s.rule.cockpitPhaseFor(snapshot(), false)).toBeNull();
  });

  it('never fights the player: pause, menu, victory and the pump keep it down', () => {
    for (const phase of ['paused', 'menu', 'victory', 'gameover', 'gasStation', 'outOfGas'] as const) {
      reset();
      s.hud.setState({ missionActive: true });
      s.game.setState({ phase });
      const st = snapshot();
      expect(s.rule.showDrivingHud(st), phase).toBe(false);
      expect(s.rule.cockpitPhaseFor(st, false), phase).toBeNull();
    }
  });
});

describe('showDrivingHud — free roam and cutscenes are unchanged', () => {
  it('driving with no mission still shows the HUD', () => {
    reset();
    expect(s.rule.showDrivingHud(snapshot())).toBe(true);
  });

  it('a cutscene with no mission keeps the HUD down', () => {
    reset();
    s.game.setState({ phase: 'dialogue' });
    expect(s.rule.showDrivingHud(snapshot())).toBe(false);
    expect(s.rule.cockpitPhaseFor(snapshot(), false)).toBeNull();
  });

  it('a quiz owns the screen', () => {
    reset();
    s.hud.setState({ missionActive: true });
    s.game.setState({ phase: 'quiz', quizActive: true });
    expect(s.rule.showDrivingHud(snapshot())).toBe(false);
    expect(s.rule.compoundOpen(snapshot())).toBe(true);
  });

  /**
   * ITEM 3.7 — the gap this closes. `answerQuiz` hands the phase back to `driving`
   * and clears `quizActive`, but the verdict panel stays up until CONTINUE. The
   * rule read only `quizOpen`, so the rail, the noise bar and the lights/horn came
   * back underneath the CONTINUE button and `mobile-layout.spec.ts` caught two
   * buttons overlapping it. The verdict is its own surface, and it stands the HUD
   * down until it is read.
   */
  it('a quiz verdict owns the screen, even with the phase back on driving', () => {
    reset();
    s.hud.setState({ missionActive: true });
    s.game.setState({ phase: 'driving', quizActive: false, quizResultOpen: true });
    const st = snapshot();
    expect(st.quizOpen, 'the phase is driving again').toBe(false);
    expect(st.quizResultOpen).toBe(true);
    expect(s.rule.compoundOpen(st)).toBe(true);
    expect(s.rule.showDrivingHud(st)).toBe(false);
    expect(s.rule.staleCockpitFlag(st)).toBe('quiz result');
    // CONTINUE: the verdict is read and the car's HUD comes straight back.
    s.game.getState().dismissQuizResult();
    expect(s.rule.showDrivingHud(snapshot())).toBe(true);
    expect(s.rule.staleCockpitFlag(snapshot())).toBeNull();
  });
});
