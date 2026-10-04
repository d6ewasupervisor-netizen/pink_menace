/**
 * The grade debrief — the mission-beat result panel.
 *
 * CardOverlay already shows a card's OWN debrief (the server's answer key).
 * This is the other thing: when a *grade event* fires (a stop, a gap, a yield,
 * a follow, the Ledger events, the retest week's grade), show one short panel
 * with the result, the card id that just opened, and that card's
 * source.dol_section.
 *
 * Rules this module holds:
 *   - every string comes from the card or is a fixed label — no lesson copy is
 *     written here, and nothing explains the feature;
 *   - the labels are exactly GRADE, PASS or MISS, the card id, the section id;
 *   - closing the panel emits NO events, so it can never fire week.elapsed.
 */

import type { Card } from './study/cards';

export type GradeResult = 'pass' | 'miss';

/** Events that are a verdict on the beat, and which way they read. */
const GRADE_EVENTS: Record<string, GradeResult> = {
  // Stop sign / full stop
  'stop.full': 'pass',
  'stop.rolled': 'miss',
  // Following gap
  'ledger.follow.close': 'miss',
  // Yield / uncontrolled
  'rural.uncontrolled.yield': 'pass',
  'rural.uncontrolled.rolled': 'miss',
  // Crossbuck
  'rural.crossbuck.clean': 'pass',
  'rural.crossbuck.rolled': 'miss',
  // Crest speed
  'rural.crest.clean': 'pass',
  'rural.crest.fast': 'miss',
  // Roundabout
  'roundabout.rolled': 'miss',
  // Lane discipline / signals
  'ledger.lanechange.clean': 'pass',
  'ledger.lanechange.no_signal': 'miss',
  'ledger.wrong_lane': 'miss',
  'ledger.crossed_solid': 'miss',
  // Merge
  'ledger.merge.clean': 'pass',
  'ledger.merge.slow': 'miss',
  'ribbon.merge': 'pass',
  'merge.clean': 'pass',
  // Parking
  'park.clean': 'pass',
  'park.rolled': 'miss',
  // The retest week's grade
  'week.grade.pass': 'pass',
  'week.grade.miss': 'miss',
};

/** Is this event a grade result (as opposed to a cue, a prompt or telemetry)? */
export function isGradeEvent(event: string): boolean {
  return event in GRADE_EVENTS;
}

/** pass / miss for a grade event, or null if it is not a grade event. */
export function gradeResultFor(event: string): GradeResult | null {
  return GRADE_EVENTS[event] ?? null;
}

export interface DebriefModel {
  /** The literal label. */
  label: 'GRADE';
  /** PASS or MISS. */
  result: GradeResult;
  /** The word shown next to the result. */
  resultLabel: 'PASS' | 'MISS';
  /** The card id that just opened. */
  cardId: string;
  /** That card's source.dol_section — pulled from the card, never invented. */
  sectionId: string;
  /**
   * P12: the second cue. Pass and miss are never red-versus-green alone —
   * the word is always there, and this shape rides with it.
   */
  shape: '✓' | '✕';
}

/**
 * Build the panel from a known grade event plus the card that just opened.
 * Returns null when the event is not a grade, or when there is no card to
 * point at (a debrief without a card id would be an empty shell).
 */
export function buildDebrief(event: string, card: Card | undefined): DebriefModel | null {
  const result = gradeResultFor(event);
  if (!result || !card) return null;
  return {
    label: 'GRADE',
    result,
    resultLabel: result === 'pass' ? 'PASS' : 'MISS',
    cardId: card.card_id,
    sectionId: card.source?.dol_section ?? '',
    shape: result === 'pass' ? '✓' : '✕',
  };
}

/**
 * What closing the panel emits. Always nothing: the panel is a readout, not a
 * beat, so it must never advance the story (in particular it must never fire
 * week.elapsed, which the Act IV week owns).
 */
export function debriefCloseEvents(_model: DebriefModel): string[] {
  return [];
}