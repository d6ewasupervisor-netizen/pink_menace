/**
 * P12 — spoken lines.
 *
 * The rule: if any spoken line can play with no on-screen text, that text has
 * to be shown. If every line already carries text, the box is left alone and
 * nothing is added.
 *
 * This test measures which of those is true, so the decision is on record
 * rather than assumed.
 */
import { describe, expect, it } from 'vitest';
import act01 from '../src/quietroads/data/dialogue_act0-1.json';
import act2 from '../src/quietroads/data/dialogue_act2.json';
import act2central from '../src/quietroads/data/dialogue_act2_central.json';
import act3 from '../src/quietroads/data/dialogue_act3.json';
import act4 from '../src/quietroads/data/dialogue_act4.json';
import act5ribbon from '../src/quietroads/data/dialogue_act5_ribbon.json';
import act5 from '../src/quietroads/data/dialogue_act5.json';
import act6 from '../src/quietroads/data/dialogue_act6.json';
import act6backcountry from '../src/quietroads/data/dialogue_act6_backcountry.json';
import act7 from '../src/quietroads/data/dialogue_act7.json';
import act8 from '../src/quietroads/data/dialogue_act8.json';
import type { DialogueFile } from '../src/quietroads/dialogue/types';

const FILES = [act01, act2, act2central, act3, act4, act5ribbon, act5, act6, act6backcountry, act7, act8] as unknown as DialogueFile[];

describe('P12 — every spoken line already has on-screen text', () => {
  it('finds no line node without text, so no second subtitle layer is needed', () => {
    const missing: string[] = [];
    let lines = 0;
    for (const f of FILES) {
      for (const scene of Object.values(f.scenes ?? {})) {
        for (const [id, node] of Object.entries(scene.nodes ?? {})) {
          if (node.type !== 'line') continue;
          lines++;
          if (typeof node.text !== 'string' || node.text.trim() === '') missing.push(`${scene.id}.${id}`);
        }
      }
    }
    expect(lines).toBeGreaterThan(100);
    // This is the assertion that justifies leaving DialogueBox alone.
    expect(missing).toEqual([]);
  });
});