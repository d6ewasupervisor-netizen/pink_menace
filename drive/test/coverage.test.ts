/**
 * Full card-coverage check — the Definition-of-Done "every card in every
 * playable act is opened in-scene" invariant.
 *
 * Three channels open a card in the drive:
 *   1. a dialogue `card` node (scan the dialogue files),
 *   2. CARD_FOR_TRIGGER (an in-world sign/hazard prompt),
 *   3. CardCues (a beat on the mission fires card.cue:<id>).
 *
 * Act IV spans the knowledge gate (study_terminal → exam_40), not a driving
 * place, so its cards are excluded here (only IV-018 opens in the drive).
 *
 * THIS FILE NO LONGER CARRIES A CUED-ID LIST. A hardcoded list only proved the
 * ids were spelled correctly — it could not tell a card that opens on the skill
 * from one that opens on a timer, and it counted cards the sim never emits.
 * Channel 3 is now MEASURED by driving the missions: `observedCues.ts` steps the
 * real Simulation over each cue's beat and collects the `card.cue:<id>` events
 * that actually came off the bus, so a cue that stops firing fails here too.
 */
import { describe, expect, it } from "vitest";
import { observedCueIds } from "./observedCues";
import cardsJson from "../src/quietroads/data/cards.json";
import { CARD_FOR_TRIGGER } from "../src/quietroads/study/cards";

import act01 from "../src/quietroads/data/dialogue_act0-1.json";
import act2 from "../src/quietroads/data/dialogue_act2.json";
import act2central from "../src/quietroads/data/dialogue_act2_central.json";
import act3 from "../src/quietroads/data/dialogue_act3.json";
import act4 from "../src/quietroads/data/dialogue_act4.json";
import act5ribbon from "../src/quietroads/data/dialogue_act5_ribbon.json";
import act5 from "../src/quietroads/data/dialogue_act5.json";
import act6 from "../src/quietroads/data/dialogue_act6.json";
import act6backcountry from "../src/quietroads/data/dialogue_act6_backcountry.json";
import act7 from "../src/quietroads/data/dialogue_act7.json";
import act8 from "../src/quietroads/data/dialogue_act8.json";
import type { DialogueFile } from "../src/quietroads/dialogue/types";

const FILES = [act01, act2, act2central, act3, act4, act5ribbon, act5, act6, act6backcountry, act7, act8] as DialogueFile[];

/**
 * Channel 3, MEASURED rather than asserted.
 *
 * This list used to be a hardcoded array of ids. That only proved the strings were
 * spelled right: it could not tell a card that opens on the skill from one that
 * opens on a timer, and it counted cards the sim never emits. It also drifted —
 * II-012 and III-007 were in the cue list but nothing drove them.
 *
 * What replaced it: `observedCues.ts` steps the real Simulation through each
 * cue's beat and collects the `card.cue:<id>` events that actually reach the bus.
 * The set below is what the missions produced. `teaching.test.ts` additionally
 * asserts the two-sided contract per id — fires on the skill, stays shut without
 * it — so a card cannot pass coverage by being cued from a timer either.
 *
 * Adding a card here is NOT how you close a coverage gap. Either the sim fires the
 * event, in which case this measured set grows by itself, or it does not, in which
 * case the cue is not real yet.
 */
const CUED = observedCueIds();

const DRIVE_ACTS = ["I", "II", "III", "V", "VI"];

function dialogueCards(): Set<string> {
  const out = new Set<string>();
  for (const f of FILES) {
    for (const scene of Object.values(f.scenes ?? {})) {
      for (const node of Object.values(scene.nodes ?? {})) {
        if (node.card) out.add(node.card);
      }
    }
  }
  return out;
}

function triggerCards(): Set<string> {
  const out = new Set<string>();
  for (const ids of Object.values(CARD_FOR_TRIGGER)) for (const id of ids) out.add(id);
  return out;
}

describe("every card opens in-scene (Definition of Done)", () => {
  const reachable = new Set<string>([...dialogueCards(), ...triggerCards(), ...CUED]);
  const real = cardsJson.filter((c) => c.card_id !== "art-review-state");

  it("covers every card of the driving acts I, II, III, V, VI", () => {
    for (const act of DRIVE_ACTS) {
      const ids = real.filter((c) => c.act === act).map((c) => c.card_id);
      const missing = ids.filter((id) => !reachable.has(id));
      expect({ act, missing }).toEqual({ act, missing: [] });
    }
  });

  it("does not silently drop a build artifact as a card", () => {
    expect(real.some((c) => c.card_id === "art-review-state")).toBe(false);
    // IV-001-brake is a ride-along still, not an in-scene drive card; it may
    // stay read-only, but it must exist in the deck.
    expect(real.some((c) => c.card_id === "IV-001-brake")).toBe(true);
  });

  it("Act IV has IV-018 opening inside the drive (exam scene), rest are gate stills", () => {
    const ivInDrive = real.filter((c) => c.act === "IV" && reachable.has(c.card_id)).map((c) => c.card_id);
    expect(ivInDrive).toContain("IV-018");
  });
});