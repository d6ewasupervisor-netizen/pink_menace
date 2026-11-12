/**
 * The four-way on delivery 1 is one card, and it is the question.
 *
 * It used to be three surfaces: a line that did not stop the car, then II-024,
 * then a button quiz of the same question that also did not stop the car. The
 * approach now opens the card, and answering it hands the car back.
 */
import { describe, expect, it } from "vitest";
import { DialogueRunner } from "../src/quietroads/dialogue/DialogueRunner";
import act2 from "../src/quietroads/data/dialogue_act2.json";

function boot() {
  const cards: string[] = [];
  const choices: string[] = [];
  const runner = new DialogueRunner({
    getVar: () => NaN,
    setVar: () => {},
    addVar: () => {},
    getFlag: () => undefined,
    setFlag: () => {},
    hasItem: () => false,
    giveItem: () => {},
    unlock: () => {},
    emitNoise: () => {},
    playSfx: () => {},
    animCue: () => {},
    checkpoint: () => {},
    ledger: () => {},
    logEvent: () => {},
    logChoice: () => {},
    startGameplay: () => {},
    setTimer: () => 0,
    clearTimer: () => {},
    now: () => 0,
    random: () => 0,
  } as never);
  runner.load(structuredClone(act2) as never);
  runner.on("card_shown", (id) => cards.push(id));
  runner.on("choice_shown", (_node, options) => {
    choices.push((options ?? []).map((o) => o.id).join(","));
  });
  return { runner, cards, choices };
}

describe("delivery 1 four-way", () => {
  it("opens II-024 at the intersection, and answering it is the end of the beat", () => {
    const { runner, cards, choices } = boot();
    runner.startScene("2.3a");
    for (let i = 0; i < 20 && runner.current; i++) {
      const cur = runner.current;
      if (cur.type === "card") runner.resolveCard({ card: cur.card ?? "", option: "d", correct: true });
      else runner.advanceFromUi();
    }
    expect(runner.current, "the brief ends and the drive is underway").toBeNull();
    expect(cards).toEqual(["II-001"]);

    runner.onEvent("intersection.fourway.approach");

    expect(runner.current?.type).toBe("card");
    expect((runner.current as { card?: string }).card).toBe("II-024");
    expect(choices, "the button quiz does not ask it again").toEqual([]);
    expect(cards).toEqual(["II-001", "II-024"]);

    runner.resolveCard({ card: "II-024", option: "d", correct: true });
    expect(runner.current).toBeNull();
    expect(choices).toEqual([]);
  });

  it("the unsigned crossing before the pharmacy is the question, with no lead-in line", () => {
    const { runner, choices } = boot();
    runner.startScene("2.3a");
    for (let i = 0; i < 20 && runner.current; i++) {
      const cur = runner.current;
      if (cur.type === "card") runner.resolveCard({ card: cur.card ?? "", option: "d", correct: true });
      else runner.advanceFromUi();
    }
    runner.onEvent("intersection.uncontrolled.approach");
    expect(runner.current?.type).toBe("choice");
    expect(runner.current?.text).toBe("No sign. What do you do.");
    expect(choices).toEqual(["slow_look_yield,speed_up,stop_wait"]);
  });
});
