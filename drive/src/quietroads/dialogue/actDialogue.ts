/**
 * P3 — act dialogue is loaded per act, not all in the entry chunk.
 *
 * The bridge used to `import` every dialogue_act*.json statically, so all eleven
 * files shipped in the first bundle. Here each act's file is behind a dynamic
 * import, so Vite puts it in its own chunk and only the act that needs it is
 * fetched.
 *
 * Act I stays in the first load: `PRELOADED_ACT` is imported eagerly below, so
 * the opening scene never waits on a network round trip.
 *
 * The physics world and the vehicle are NOT touched by any of this — they stay
 * in the entry chunk exactly as before.
 */
import type { DialogueFile } from './types';
import type { CardAct } from '../actChallenges';

// ── Act I: eager, so the first scene is in the entry chunk ───────────────────
import act01 from '../data/dialogue_act0-1.json';

/** The act whose dialogue is always in the first load. */
export const PRELOADED_ACT: CardAct = 'I';

/** Act I's file(s), eagerly imported — these stay in the entry chunk. */
export const ACT_ONE_DIALOGUE: DialogueFile[] = [act01 as unknown as DialogueFile];

/** Which act a scene id belongs to, from the scene id's leading number. */
export function actForSceneId(sceneId: string): CardAct | null {
  const n = sceneId.split('.')[0];
  switch (n) {
    case '0': case '1': return 'I';
    case '2': return sceneId === '2.5' ? 'III' : 'II';
    case '3': return 'V';
    case '4': return 'IV';
    case '5': return 'V';
    case '6': case '7': return 'VI';
    case '8': return 'VII';
    default: return null;
  }
}

/** The next act to prefetch while the player reads the current debrief. */
export function nextAct(act: CardAct): CardAct | null {
  switch (act) {
    case 'I': return 'II';
    case 'II': return 'III';
    case 'III': return 'V';
    case 'IV': return 'V';
    case 'V': return 'VI';
    case 'VI': return null;   // VII stays closed
    default: return null;
  }
}

/** Dynamic import per act. Each becomes its own chunk. */
const LOADERS: Record<CardAct, () => Promise<DialogueFile[]>> = {
  I: async () => ACT_ONE_DIALOGUE,
  II: async () => [(await import('../data/dialogue_act2.json')).default as unknown as DialogueFile],
  III: async () => [(await import('../data/dialogue_act2_central.json')).default as unknown as DialogueFile],
  IV: async () => [(await import('../data/dialogue_act4.json')).default as unknown as DialogueFile],
  V: async () => [
    (await import('../data/dialogue_act3.json')).default as unknown as DialogueFile,
    (await import('../data/dialogue_act5.json')).default as unknown as DialogueFile,
    (await import('../data/dialogue_act5_ribbon.json')).default as unknown as DialogueFile,
  ],
  VI: async () => [
    (await import('../data/dialogue_act6.json')).default as unknown as DialogueFile,
    (await import('../data/dialogue_act6_backcountry.json')).default as unknown as DialogueFile,
  ],
  VII: async () => [
    (await import('../data/dialogue_act7.json')).default as unknown as DialogueFile,
    (await import('../data/dialogue_act8.json')).default as unknown as DialogueFile,
  ],
};

/**
 * Acts already handed to the runner. Each act is fetched at most once; a repeat
 * is a no-op that resolves immediately.
 */
const loaded = new Map<CardAct, DialogueFile[]>();

/** Load (or return) an act's dialogue files. Idempotent. */
export async function loadAct(act: CardAct): Promise<DialogueFile[]> {
  const have = loaded.get(act);
  if (have) return have;
  const files = await LOADERS[act]();
  loaded.set(act, files);
  return files;
}

/**
 * Warm an act's chunk without needing it yet — used while the grade debrief is
 * on screen. Failures are swallowed: a prefetch is an optimisation, never a
 * requirement.
 */
export function preloadAct(act: CardAct): void {
  if (loaded.has(act)) return;
  void loadAct(act).catch(() => { /* the real load will surface the error */ });
}

/** Test seam: has this act's chunk been resolved? */
export function isActLoaded(act: CardAct): boolean {
  return loaded.has(act);
}

/** The scene ids an act's files carry — used by the tests to prove the split. */
export function sceneIdsIn(act: CardAct): string[] {
  return (loaded.get(act) ?? []).flatMap((f) => Object.keys(f.scenes ?? {}));
}