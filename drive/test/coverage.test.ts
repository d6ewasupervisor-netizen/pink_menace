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
 */
import { describe, expect, it } from "vitest";
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
 * Ids CardCues knows how to offer. This list does not prove the sim bus
 * emits them — GridRun used to fire past the wrapper while this still passed.
 * teaching.test.ts steps the three grid missions and requires card.cue.
 */
const CUED = [
  // II-006 and II-012 left the Act V briefing still (3.1) and now open on the
  // Ledger drive: II-012 on ledger.follow.close, II-006 on the signal beat.
  "II-006", "II-012",
  "II-007", "II-008", "II-009", "II-011", "II-013", "II-014", "II-015", "II-016", "II-017",
  "II-018", "II-019", "II-020", "II-021", "II-022", "II-023", "II-025", "II-026", "II-028",
  "II-029", "II-031",
  "III-001", "III-005", "III-008", "III-009", "III-010", "III-011", "III-012", "III-013",
  "III-014", "III-015", "III-017", "III-018", "III-019", "III-021", "III-022", "III-023",
  "III-024", "III-025", "III-026", "III-027", "III-028", "III-029", "III-030",
  "V-002", "V-004", "V-008", "V-009", "V-011",
  "VI-003", "VI-005", "VI-009", "VI-011", "VI-013",
];

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