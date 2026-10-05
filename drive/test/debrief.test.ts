/**
 * The grade debrief — the mission-beat result panel.
 *
 * CardOverlay already shows a card's own debrief. This is the grade-event one:
 * result, the card id that just opened, and that card's source.dol_section, with
 * every string pulled from the card.
 */
import { describe, expect, it } from 'vitest';
import { buildDebrief, debriefCloseEvents, gradeResultFor, isGradeEvent, WEEK_ELAPSED } from '../src/quietroads/debrief';
import { Simulation, retestPlan, type VehicleSample } from '../src/quietroads';
import cardsJson from '../src/quietroads/data/cards.json';
import type { Card } from '../src/quietroads/study/cards';

function cardById(id: string): Card | undefined {
  return (cardsJson as Card[]).find((c) => c.card_id === id);
}

describe('the Act IV week grades through the event the retest already fires', () => {
  /**
   * The panel used to listen for `week.grade.pass` / `week.grade.miss`. Nothing
   * emits those: `RetestWeek.step` returns a boolean and `Simulation` fires
   * `week.elapsed`. The grade now rides on that one event as data, so there is no
   * second week-end event and no chance of the two disagreeing.
   */
  it('reads PASS off week.elapsed', () => {
    const model = buildDebrief(WEEK_ELAPSED, undefined, { grade: 'pass' })!;
    expect(model.result).toBe('pass');
    expect(model.resultLabel).toBe('PASS');
    expect(model.shape).toBe('✓');
  });

  it('reads MISS off the same event', () => {
    const model = buildDebrief(WEEK_ELAPSED, undefined, { grade: 'miss' })!;
    expect(model.result).toBe('miss');
    expect(model.resultLabel).toBe('MISS');
    expect(model.shape).toBe('✕');
  });

  it('is a grade event only when it carries a usable grade', () => {
    expect(isGradeEvent(WEEK_ELAPSED, { grade: 'pass' })).toBe(true);
    expect(isGradeEvent(WEEK_ELAPSED, { grade: 'miss' })).toBe(true);
    // No payload, or one we do not recognise: no panel, and no invented PASS.
    expect(isGradeEvent(WEEK_ELAPSED)).toBe(false);
    expect(isGradeEvent(WEEK_ELAPSED, {})).toBe(false);
    expect(isGradeEvent(WEEK_ELAPSED, { grade: 'maybe' })).toBe(false);
    expect(buildDebrief(WEEK_ELAPSED, undefined, { grade: 'maybe' })).toBeNull();
  });

  it('shows a grade with no cued card — the panel is the result, the card is the citation', () => {
    const model = buildDebrief(WEEK_ELAPSED, undefined, { grade: 'pass' })!;
    expect(model.card).toBeNull();
    expect(model.cardId).toBe('');
    expect(model.sectionId).toBe('');
    // The labels that matter are still there.
    expect(model.label).toBe('GRADE');
    expect(model.resultLabel).toBe('PASS');
  });

  it('keeps the card citation when one was cued behind the grade', () => {
    const card = cardById('II-024')!;
    const model = buildDebrief(WEEK_ELAPSED, card, { grade: 'miss' })!;
    expect(model.cardId).toBe('II-024');
    expect(model.sectionId).toBe(card.source!.dol_section);
  });

  it('closing it still emits nothing, so it cannot re-end the week', () => {
    const model = buildDebrief(WEEK_ELAPSED, undefined, { grade: 'pass' })!;
    expect(debriefCloseEvents(model)).toEqual([]);
    expect(debriefCloseEvents(model)).not.toContain(WEEK_ELAPSED);
  });
});

describe('the retest week really produces that payload', () => {
  function harness() {
    const fired: { event: string; data?: Record<string, unknown> }[] = [];
    const sim = new Simulation({
      fire: (e, d) => fired.push({ event: e, data: d }),
      requestQuiz: () => {},
      setObjective: () => {},
      toast: () => {},
      placeVehicle: () => {},
    });
    return { sim, fired };
  }

  function sample(pos: { x: number; y: number }, heading: number, speedMs: number): VehicleSample {
    return { pos, heading, speedMs, throttle: 0.2, brake: 0, steer: 0, horn: false };
  }

  it('a clean stop week ends with grade: pass, and the panel can read it', () => {
    const { sim, fired } = harness();
    sim.armRetest(retestPlan(1, []));
    sim.startMission('local_loop_week');
    sim.step(0.2, sample({ x: 250, y: 97 }, 0, 3));
    sim.step(0.2, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.5, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.2, sample({ x: 290, y: 97 }, 0, 3));
    const weeks = fired.filter((f) => f.event === WEEK_ELAPSED);
    // Exactly one week-end event, carrying the verdict.
    expect(weeks).toHaveLength(1);
    expect(weeks[0].data).toEqual({ grade: 'pass' });
    expect(buildDebrief(WEEK_ELAPSED, undefined, weeks[0].data)!.resultLabel).toBe('PASS');
  });

  it('a week that rolled the stop stays a miss, even after re-doing it cleanly', () => {
    const { sim, fired } = harness();
    sim.armRetest(retestPlan(1, []));
    sim.startMission('local_loop_week');
    // Roll the stop: a blown rule, recorded as a miss.
    sim.step(0.2, sample({ x: 250, y: 97 }, 0, 8));
    sim.step(0.05, sample({ x: 265, y: 97 }, 0, 8));
    sim.step(0.05, sample({ x: 290, y: 97 }, 0, 8));
    // Go round again and do it properly. The week completes, but the verdict the
    // retest already decided does not quietly turn back into a pass.
    sim.step(0.2, sample({ x: 220, y: 97 }, 0, 8));
    sim.step(0.2, sample({ x: 250, y: 97 }, 0, 3));
    sim.step(0.2, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.5, sample({ x: 265, y: 97 }, 0, 0));
    sim.step(0.2, sample({ x: 290, y: 97 }, 0, 3));
    const weeks = fired.filter((f) => f.event === WEEK_ELAPSED);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].data).toEqual({ grade: 'miss' });
  });
});

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

  it('needs a grade event, and builds without one only when there is no card', () => {
    // Not a grade: nothing, with or without a card.
    expect(buildDebrief('not.a.grade', card)).toBeNull();
    expect(buildDebrief('not.a.grade', undefined)).toBeNull();
    // A grade with no cued card still reads: the card is the citation, not the
    // verdict. This is the case the week lands in.
    const bare = buildDebrief('stop.full', undefined);
    expect(bare).toBeTruthy();
    expect(bare!.resultLabel).toBe('PASS');
    expect(bare!.card).toBeNull();
    expect(bare!.cardId).toBe('');
  });

  it('reads real cards from the shipped deck', () => {
    for (const id of ['II-024', 'II-003', 'II-002', 'III-005', 'VI-011']) {
      const c = cardById(id);
      expect(c, `${id} is in the deck`).toBeTruthy();
      expect(buildDebrief('stop.rolled', c)!.cardId).toBe(id);
    }
  });
});