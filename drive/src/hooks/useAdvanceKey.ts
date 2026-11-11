import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { isAdvanceKey, pickAdvance, type AdvanceEntry } from '@/input/advanceKey';

const open = new Set<AdvanceEntry>();
let listening = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat || !open.size) return;
  if (!isAdvanceKey(e.key, useGameStore.getState().binds)) return;
  const t = e.target as HTMLElement | null;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  const best = pickAdvance(open);
  if (!best) return;
  e.preventDefault();
  // A focused button would take the same Space as a click on key-up.
  if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
  best.run();
}

/** Register a surface the handbrake key advances. `null` while it has nothing to advance. */
export function useAdvanceKey(priority: number, onAdvance: (() => void) | null): void {
  const ref = useRef(onAdvance);
  ref.current = onAdvance;
  const on = onAdvance !== null;
  useEffect(() => {
    if (!on) return;
    const entry: AdvanceEntry = { priority, run: () => ref.current?.() };
    open.add(entry);
    if (!listening) {
      window.addEventListener('keydown', onKeyDown);
      listening = true;
    }
    return () => { open.delete(entry); };
  }, [on, priority]);
}
