/**
 * The grade debrief — the mission-beat result panel.
 *
 * CardOverlay already shows a card's own debrief. This is the grade-event one:
 * result, the card id that just opened, and that card's source.dol_section, with
 * every string pulled from the card.
 */
import { describe, expect, it } from 'vitest';
import { buildDebrief, debriefCloseEvents, gradeResultFor, isGradeEvent } from '../src/quietroads/debrief';
import cardsJson from '../src/quietroads/data/cards.json';
import type { Card } from '../src/quietroads/study/cards';

function cardById(id: string): Card | undefined {
  return (cardsJson as Card[]).find((c) => c.card_id === id);
}

describe('grade debrief — built from a grade event plus a card', () => {
  const card = cardById('II-024')!;   // "First In at the Four-Way"

  it('reads pass or miss off the grade event', () => {
    expect(isGradeEvent('stop.full')).toBe(true);
    expect(gradeResultFor('stop.full')).toBe('pass');
    expect(gradeResultFor('stop.rolled')).toBe('miss');
    expect(gradeResultFor('ledger.follow.close')).toBe('miss');
    expect(gradeResultFor('rural.crossbuck.clean')).toBe('pass');
    expect(gradeResultFor('rural.crossbuck.rolled')).toBe('miss');
  });

  it('is not a grade event for a cue or a prompt', () => {
    expect(isGradeEvent('card.cue:II-024')).toBe(false);
    expect(isGradeEvent('noise.red')).toBe(false);
    expect(buildDebrief('noise.red', card)).toBeNull();
  });

  it('builds pass, the card id, and that card\'s dol_section', () => {
    const model = buildDebrief('stop.full', card)!;
    expect(model.label).toBe('GRADE');
    expect(model.result).toBe('pass');
    expect(model.resultLabel).toBe('PASS');
    expect(model.cardId).toBe('II-024');
    // Pulled from the card, not written here.
    expect(model.sectionId).toBe(card.source!.dol_section);
    expect(model.sectionId).not.toBe('');
  });

  it('builds miss the same way', () => {
    const model = buildDebrief('stop.rolled', card)!;
    expect(model.resultLabel).toBe('MISS');
    expect(model.cardId).toBe('II-024');
    expect(model.sectionId).toBe(card.source!.dol_section);
  });

  it('carries a second cue so pass/miss is never colour alone', () => {
    expect(buildDebrief('stop.full', card)!.shape).toBe('✓');
    expect(buildDebrief('stop.rolled', card)!.shape).toBe('✕');
    // …and the word is there regardless of the shape.
    expect(buildDebrief('stop.full', card)!.resultLabel).toBe('PASS');
  });

  it('closing it emits nothing — in particular never week.elapsed', () => {
    const model = buildDebrief('stop.full', card)!;
    expect(debriefCloseEvents(model)).toEqual([]);
    expect(debriefCloseEvents(model)).not.toContain('week.elapsed');
  });

  it('needs both a grade event and a card', () => {
    expect(buildDebrief('stop.full', undefined)).toBeNull();
    expect(buildDebrief('not.a.grade', card)).toBeNull();
  });

  it('reads real cards from the shipped deck', () => {
    for (const id of ['II-024', 'II-003', 'II-002', 'III-005', 'VI-011']) {
      const c = cardById(id);
      expect(c, `${id} is in the deck`).toBeTruthy();
      expect(buildDebrief('stop.rolled', c)!.cardId).toBe(id);
    }
  });
});