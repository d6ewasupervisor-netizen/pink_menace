/**
 * Scene routing across act boundaries.
 *
 * The DialogueRunner throws `Dialogue scene missing: <id>` from `startScene` when
 * the scene's act has not been fetched yet. At startup only Act I is in the entry
 * chunk, so every campaign handoff — 1.4b → 2.1, 2.4 → 2.5, 2.5 → 3.1, the Ribbon
 * → 4.1, the exam → 5.1, 6.3 → 7.1 — landed on that throw. This module is the one
 * place that closes the gap: it owns "make this scene available, then start it".
 *
 * It is deliberately pure over `(runner, sceneId)` with no store, no React and no
 * window, so the campaign chain is unit-testable headlessly. The bridge wires it
 * to the runner; the tests walk the same chain with a stub host.
 *
 * Act VII is closed. `gotoScene('8.1')` returns false instead of loading act8, so
 * the 7.3 → 8.1 handoff ends the playable campaign rather than throwing.
 */
import { DialogueRunner } from './DialogueRunner';
import { actForSceneId, isActPlayable, loadAct, preloadAct } from './actDialogue';
import type { DialogueFile } from './types';

/**
 * Load the act that owns `sceneId` into `runner` and wait for it.
 * Resolves true when the runner can start the scene afterwards.
 *
 * The load is awaited, so the caller must await this before `startScene` — that is
 * the whole point: a next_scene jump crosses a chunk boundary the network owns.
 */
export async function prepareScene(runner: DialogueRunner, sceneId: string): Promise<boolean> {
  if (runner.hasScene(sceneId)) return true;
  const act = actForSceneId(sceneId);
  if (!act || !isActPlayable(act)) return false;
  for (const file of await loadAct(act)) mergeFile(runner, file);
  return runner.hasScene(sceneId);
}

/**
 * Make `sceneId` available and start it. Returns false (without throwing) when the
 * scene belongs to a closed act or cannot be resolved to any act.
 */
export async function gotoScene(runner: DialogueRunner, sceneId: string): Promise<boolean> {
  if (!sceneId) return false;
  if (!(await prepareScene(runner, sceneId))) return false;
  runner.startScene(sceneId);
  return true;
}

/**
 * The act a scene's next_scene jumps point at, for prefetching while the player
 * reads the debrief. Reading the *scene* rather than "the next act letter" is what
 * fixes `nextAct('III') === 'V'`, which walked 2.5 → 3.1 and skipped the exam at 4.1.
 */
export function actForNextScene(scene: DialogueFile['scenes'][string] | null | undefined): string | null {
  if (!scene) return null;
  for (const node of Object.values(scene.nodes ?? {})) {
    const next = node.next_scene;
    if (next) return next;
  }
  return null;
}

/** Warm the act that owns the current scene's next_scene, if it is playable. */
export function preloadNextScene(runner: DialogueRunner): void {
  const next = actForNextScene(runner.scene);
  if (!next) return;
  const act = actForSceneId(next);
  if (act && isActPlayable(act)) preloadAct(act);
}

/** Has any of this dialogue file's scenes already been handed to the runner? */
function mergeFile(runner: DialogueRunner, file: DialogueFile): void {
  for (const id of Object.keys(file.scenes ?? {})) {
    if (runner.hasScene(id)) return;
  }
  runner.load(structuredClone(file) as unknown as DialogueFile);
}