/**
 * The Act VII deck's teaching claims (2026-10-29).
 *
 * These are the checks the deck validators cannot make: whether a card's copy
 * says what the driver guide says, and whether the copy the player reads in the
 * drive (`quietroads/data/cards.json`) still matches the authored card in
 * `cards/`. Every assertion quotes the guide (`docs/wa-driver-guide/`) or the
 * card's own citation — never a remembered number.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const url = (p: string) => fileURLToPath(new URL(p, root));
const read = (p: string) => JSON.parse(fs.readFileSync(url(p), "utf8"));

const gameDeck = read("drive/src/quietroads/data/cards.json") as any[];
const inDrive = (id: string) => gameDeck.find((c) => c.card_id === id);

describe("VII-002 — a chain-required sign asks for chains on the drive wheels", () => {
  const card = read("cards/VII-002.json");
  const correct = card.options.find((o: any) => o.correct);

  it("does not invent an all-four requirement", () => {
    const copy = [correct.text, correct.result, card.debrief, card.source.teaching_target].join(" ");
    expect(copy).not.toMatch(/all four/i);
  });

  it("puts them on the drive wheels, the Menace's rear pair, before the car moves", () => {
    expect(correct.text).toMatch(/drive wheels/i);
    expect(correct.text).toMatch(/rear/i);
    expect(correct.text).toMatch(/before the car moves/i);
    expect(card.debrief).toMatch(/drive wheels/i);
    expect(card.debrief).toMatch(/rear pair/i);
  });

  it("cites DG 5.6's required-device rule verbatim", () => {
    // guide_extracted.txt: "Use snow tires or chains when it's required."
    expect(card.source.dol_section).toBe("5.6 Road and driving conditions (Slippery roads)");
    expect(card.source.teaching_target).toContain("Use snow tires or chains when it's required.");
    expect(card.source.teaching_target).toMatch(/guide names no axle/i);
  });

  it("keeps its shape and its scheduled callback", () => {
    expect(correct.id).toBe("a");
    expect(card.options.filter((o: any) => o.correct).length).toBe(1);
    expect(card.schedules_callback).toBe(true);
    expect(card.timeout_option_id).toBe("b");
    expect(card.timeout_ms).toBe(12000);
  });

  it("matches the copy the drive actually shows", () => {
    const live = inDrive("VII-002");
    expect(live).toBeDefined();
    expect(live.options.find((o: any) => o.id === "a").text).toBe(correct.text);
    expect(live.debrief).toBe(card.debrief);
    expect(live.source.teaching_target).toBe(card.source.teaching_target);
  });
});

describe("VII-010 — the gate restates the chain rule, not the receipt mechanic", () => {
  const card = read("cards/VII-010.json");

  it("teaches when chains are required and where they go", () => {
    expect(card.debrief).toMatch(/when it's required/i);
    expect(card.debrief).toMatch(/drive the car/i);
    expect(card.source.teaching_target).toContain("Use snow tires or chains when it's required.");
  });

  it("drops the back-office framing", () => {
    expect(card.debrief).not.toMatch(/receipt is the equipment/i);
    expect(card.debrief).not.toMatch(/billed at the gate/i);
  });

  it("matches the copy the drive actually shows", () => {
    const live = inDrive("VII-010");
    expect(live.debrief).toBe(card.debrief);
    expect(live.source.teaching_target).toBe(card.source.teaching_target);
  });
});
