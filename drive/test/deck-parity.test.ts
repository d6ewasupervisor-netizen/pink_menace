/**
 * The drive's deck copy *is* the card deck — field for field.
 *
 * `drive/src/quietroads/data/cards.json` is a projection of `cards/*.json`, and it
 * has drifted twice: it carried no `timeout_option_id`/`timeout_ms` for the 17 cards
 * that declare a clock (AUDIT §21 — the cockpit ran without a timer), and it carried
 * no `callback_of`/`schedules_callback` at all. A hand-trimmed copy of a 131-card
 * deck will always drift again, so the copy is now checked against the deck on every
 * run: same cards, same order, same fields, and the failure names the card and the
 * field.
 *
 * The one thing the bundle must *not* carry is the answer key — `options[].correct`,
 * `options[].result` and `options[].state_delta` stay on the server
 * (`src/routes-drive.js` grades the pick from `card_options`). The guard therefore
 * compares the option ids and texts the drive reads, and fails if the key ever
 * appears in the bundle.
 *
 * Fix drift by re-running `npm run export-drive-cards`, never by editing the bundle.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import bundleJson from '../src/quietroads/data/cards.json';

interface CardFields {
  CARD_FIELDS: string[];
  OPTION_FIELDS: string[];
  SOURCE_FIELDS: string[];
  imagePathFor: (cardId: string) => string;
  bundleCard: (raw: Record<string, unknown>, opts?: { hasStill?: boolean }) => Record<string, any>;
}

const require_ = createRequire(import.meta.url);
const fields = require_('../../scripts/drive-card-fields.js') as CardFields;
const { CARD_FIELDS, OPTION_FIELDS, SOURCE_FIELDS, bundleCard } = fields;

const root = new URL('../../', import.meta.url);
const url = (p: string) => fileURLToPath(new URL(p, root));
const CARD_FILE = /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/;

const deck: Record<string, any>[] = fs
  .readdirSync(url('cards'))
  .filter((f) => CARD_FILE.test(f))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(url(`cards/${f}`), 'utf8')));

const bundle = bundleJson as unknown as Record<string, any>[];
const hasStill = (cardId: string) => ['.png', '.jpg'].some((ext) => fs.existsSync(url(`cards/${cardId}${ext}`)));
const want = new Map(deck.map((c) => [c.card_id, bundleCard(c, { hasStill: hasStill(c.card_id) })]));
const got = new Map(bundle.map((c) => [c.card_id, c]));

/** A value as it reads in a failure message. */
const brief = (v: unknown) => {
  const s = JSON.stringify(v ?? null);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
};


/** Every difference between one card's projection and the bundle's copy of it. */
function drift(card: Record<string, any>, expected: Record<string, any>, actual: Record<string, any>): string[] {
  const out: string[] = [];
  const id = card.card_id;
  for (const field of CARD_FIELDS) {
    const w = expected[field];
    const g = actual[field];
    if (field === 'options') {
      const wo = w ?? [];
      const go = g ?? [];
      if (wo.length !== go.length) {
        out.push(`${id}: options — the deck has ${wo.length}, the bundle has ${go.length}`);
      }
      for (let i = 0; i < Math.min(wo.length, go.length); i++) {
        for (const key of OPTION_FIELDS) {
          if (wo[i][key] !== go[i][key]) {
            out.push(`${id}: options[${i}].${key} — deck ${brief(wo[i][key])}, bundle ${brief(go[i][key])}`);
          }
        }
      }
      continue;
    }
    if (field === 'source') {
      for (const key of SOURCE_FIELDS) {
        if (brief(w?.[key]) !== brief(g?.[key])) {
          out.push(`${id}: source.${key} — deck ${brief(w?.[key])}, bundle ${brief(g?.[key])}`);
        }
      }
      continue;
    }
    if (brief(w) !== brief(g)) out.push(`${id}: ${field} — deck ${brief(w)}, bundle ${brief(g)}`);
  }
  return out;
}

describe('the drive deck copy is the card deck', () => {
  it("carries every card, in the deck's order, and nothing else", () => {
    const deckIds = deck.map((c) => c.card_id);
    const bundleIds = bundle.map((c) => c.card_id);
    expect(bundleIds).toEqual(deckIds);
    expect(deck.length).toBe(131);
  });

  it('matches the deck field for field (id, copy, options, clock, callbacks, citation, image)', () => {
    const problems: string[] = [];
    for (const card of deck) {
      const expected = want.get(card.card_id)!;
      const actual = got.get(card.card_id);
      if (!actual) {
        problems.push(`${card.card_id}: missing from the bundle`);
        continue;
      }
      problems.push(...drift(card, expected, actual));
    }
    expect(problems, `\n${problems.join('\n')}\n\nre-export with: npm run export-drive-cards`).toEqual([]);
  });

  it('carries exactly the fields the export writes — no hand-added field survives', () => {
    const shape = (c: Record<string, any>) => ({
      keys: Object.keys(c).sort(),
      source: Object.keys(c.source ?? {}).sort(),
      options: (c.options ?? []).map((o: Record<string, any>) => Object.keys(o).sort()),
    });
    const problems: string[] = [];
    for (const card of deck) {
      const expected = shape(want.get(card.card_id)!);
      const actual = shape(got.get(card.card_id)!);
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        problems.push(
          `${card.card_id}: bundle ${brief(actual.keys)} / source ${brief(actual.source)} / options ${brief(actual.options)} — the export writes ${brief(expected.keys)} / ${brief(expected.source)} / ${brief(expected.options)}`,
        );
      }
    }
    expect(problems, `\n${problems.join('\n')}`).toEqual([]);
  });

  it('never carries the answer key: an option is its id and its text', () => {
    const leaks: string[] = [];
    for (const card of bundle) {
      for (const option of card.options ?? []) {
        const keys = Object.keys(option);
        for (const key of ['correct', 'result', 'state_delta']) {
          if (keys.includes(key)) leaks.push(`${card.card_id}: options.${key} is in the bundle (grading is server-side)`);
        }
        if (JSON.stringify(keys) !== JSON.stringify(OPTION_FIELDS)) {
          leaks.push(`${card.card_id}: options[${option.id ?? '?'}] carries ${brief(keys)}, not ${brief(OPTION_FIELDS)}`);
        }
      }
    }
    expect(leaks, `\n${leaks.join('\n')}`).toEqual([]);
  });

  it('names the still the drive requests, or none when the deck has none', () => {
    const problems: string[] = [];
    for (const card of deck) {
      const expected = hasStill(card.card_id) ? fields.imagePathFor(card.card_id) : null;
      const actual = got.get(card.card_id)!.image ?? null;
      if (actual !== expected) problems.push(`${card.card_id}: image — deck ${brief(expected)}, bundle ${brief(actual)}`);
    }
    expect(problems, `\n${problems.join('\n')}`).toEqual([]);
    // II-031 has no still on disk and the route answers null for it; VII-002's
    // still is served by the same route the card game uses.
    expect(got.get('II-031')!.image).toBeNull();
    expect(got.get('VII-002')!.image).toBe('/api/drive/image/VII-002');
  });
});
