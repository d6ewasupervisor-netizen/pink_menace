/**
 * The handbrake key advances pop-ups on a keyboard: one press, one surface, the
 * highest priority first, and it follows a rebind of the handbrake.
 */
import { describe, expect, it } from 'vitest';
import { ADVANCE_PRIORITY, isAdvanceKey, pickAdvance } from '../src/input/advanceKey';
import { defaultBinds, rebind } from '../src/input/driveInput';

describe('advance key', () => {
  it('is Space by default, and nothing else in the default binds', () => {
    const binds = defaultBinds();
    expect(isAdvanceKey(' ', binds)).toBe(true);
    for (const k of ['Enter', 'w', 'ArrowUp', 'h', 'l', 'Escape']) expect(isAdvanceKey(k, binds)).toBe(false);
  });

  it('follows the handbrake when it is rebound, case-insensitively', () => {
    const binds = rebind(defaultBinds(), 'handbrake', 'b');
    expect(isAdvanceKey('b', binds)).toBe(true);
    expect(isAdvanceKey('B', binds)).toBe(true);
    expect(isAdvanceKey(' ', binds)).toBe(false);
  });

  it('one press advances the card before the quiz before the line', () => {
    const ran: string[] = [];
    const line = { priority: ADVANCE_PRIORITY.dialogue, run: () => ran.push('line') };
    const quiz = { priority: ADVANCE_PRIORITY.quiz, run: () => ran.push('quiz') };
    const card = { priority: ADVANCE_PRIORITY.card, run: () => ran.push('card') };
    pickAdvance([line, card, quiz])!.run();
    pickAdvance([line, quiz])!.run();
    pickAdvance([line])!.run();
    expect(ran).toEqual(['card', 'quiz', 'line']);
    expect(pickAdvance([])).toBeNull();
  });
});
