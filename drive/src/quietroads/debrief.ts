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
 *
 * The Act IV week arrives as ONE event, `week.elapsed`, carrying the grade the
 * retest already decided (`data.grade`). This module used to listen for
 * `week.grade.pass` / `week.grade.miss`, which nothing ever emitted, so a graded
 * week could never open its panel. There is no second week-end event: the verdict
 * is data on the one the retest already fires.
 */

import type { Card } from './study/cards';

export type GradeResult = 'pass' | 'miss';

/** The single Act IV week-end event. Its verdict rides on `data.grade`. */
export const WEEK_ELAPSED = 'week.elapsed';

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
};

/**
 * The week-end verdict, read off the data the retest already attached to
 * `week.elapsed`. Returns null when the payload carries no usable grade, so a
 * malformed event shows no panel rather than inventing a PASS.
 */
function weekResultFor(data?: Record<string, unknown>): GradeResult | null {
  const grade = data?.grade;
  return grade === 'pass' || grade === 'miss' ? grade : null;
}

/** Is this event a grade result (as opposed to a cue, a prompt or telemetry)? */
export function isGradeEvent(event: string, data?: Record<string, unknown>): boolean {
  return gradeResultFor(event, data) !== null;
}

/** pass / miss for a grade event, or null if it is not a grade event. */
export function gradeResultFor(event: string, data?: Record<string, unknown>): GradeResult | null {
  if (event === WEEK_ELAPSED) return weekResultFor(data);
  return GRADE_EVENTS[event] ?? null;
}

export interface DebriefModel {
  /** The literal label. */
  label: 'GRADE';
  /** PASS or MISS. */
  result: GradeResult;
  /** The word shown next to the result. */
  resultLabel: 'PASS' | 'MISS';
  /** The card that just opened. Null when the grade fired with no cue behind it. */
  card: Card | null;
  /** The card id that just opened. Empty when no card was cued. */
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
 * Build the panel from a grade event (plus its data, for the week) and the card
 * that just opened.
 *
 * A card is optional. The grade is the result; the card is the citation. A stop
 * grade with no cue behind it still has to say PASS or MISS — that was the bug
 * where `maybeDebrief` returned early on a null `lastCuedCard` and the panel showed
 * nothing at all. With no card the model carries an empty id and no section, and
 * the UI omits those rows.
 */
export function buildDebrief(
  event: string,
  card: Card | undefined,
  data?: Record<string, unknown>,
): DebriefModel | null {
  const result = gradeResultFor(event, data);
  if (!result) return null;
  return {
    label: 'GRADE',
    result,
    resultLabel: result === 'pass' ? 'PASS' : 'MISS',
    card: card ?? null,
    cardId: card?.card_id ?? '',
    sectionId: card?.source?.dol_section ?? '',
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