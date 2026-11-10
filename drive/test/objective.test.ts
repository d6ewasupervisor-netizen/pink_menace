/**
 * The objective line and the HP/FUEL tag: when they are on, in numbers.
 *
 * Both were always-on in the cockpit the BEFORE pass measured (a 374×143 nav cluster
 * plus two bars at 26 % world band). The rebuild shows them only when they have
 * something to say, and the rules are pure, so this file can hold them still:
 *
 *   - a change holds the objective for OBJECTIVE_HOLD_MS, then it leaves;
 *   - a tap brings it back for another window;
 *   - a sub-step mission keeps it up regardless of the clock;
 *   - HP or FUEL under 30 % keeps the tag up; anything else needs a recent change.
 */
import { describe, expect, it } from "vitest";
import {
  OBJECTIVE_HOLD_MS,
  RESOURCE_FLASH_MS,
  WARN_FRACTION,
  objectiveRemainingMs,
  objectiveVisible,
  resourceTagText,
  resourceTagVisible,
  resourceWarning,
} from "../src/components/Game3D/cockpit/objective";

const objective = (over: Partial<Parameters<typeof objectiveVisible>[0]> = {}) => ({
  changedAt: 0,
  tappedAt: null as number | null,
  subStep: false,
  now: 0,
  ...over,
});

const resources = (over: Partial<Parameters<typeof resourceWarning>[0]> = {}) => ({
  hp: 100,
  fuel: 100,
  maxHp: 100,
  maxFuel: 100,
  changedAt: 0,
  now: 0,
  ...over,
});

describe("the objective shows on change, then gets out of the way", () => {
  it("is up the moment it changes", () => {
    expect(objectiveVisible(objective({ now: 0 }))).toBe(true);
    expect(objectiveVisible(objective({ now: OBJECTIVE_HOLD_MS - 1 }))).toBe(true);
  });

  it(`leaves after ${OBJECTIVE_HOLD_MS} ms — the plan's ~6 s`, () => {
    expect(OBJECTIVE_HOLD_MS).toBe(6_000);
    expect(objectiveVisible(objective({ now: OBJECTIVE_HOLD_MS }))).toBe(false);
    expect(objectiveVisible(objective({ now: OBJECTIVE_HOLD_MS + 5_000 }))).toBe(false);
  });

  it("comes back when the player taps the nav strip", () => {
    const tapped = objective({ tappedAt: 10_000, now: 10_500 });
    expect(objectiveVisible(tapped)).toBe(true);
    expect(objectiveVisible({ ...tapped, now: 10_000 + OBJECTIVE_HOLD_MS - 1 })).toBe(true);
    expect(objectiveVisible({ ...tapped, now: 10_000 + OBJECTIVE_HOLD_MS })).toBe(false);
  });

  it("a sub-step mission keeps it up however long the player takes", () => {
    expect(objectiveVisible(objective({ subStep: true, now: 1_000_000 }))).toBe(true);
    // ...and it does not depend on a change time that was never set.
    expect(objectiveVisible(objective({ subStep: true, changedAt: -1, now: 0 }))).toBe(true);
  });

  it("reports how much of the window is left, clamped", () => {
    expect(objectiveRemainingMs(objective({ now: 0 }))).toBe(OBJECTIVE_HOLD_MS);
    expect(objectiveRemainingMs(objective({ now: 2_000 }))).toBe(OBJECTIVE_HOLD_MS - 2_000);
    expect(objectiveRemainingMs(objective({ now: 60_000 }))).toBe(0);
    expect(objectiveRemainingMs(objective({ subStep: true, now: 60_000 }))).toBe(OBJECTIVE_HOLD_MS);
  });
});

describe("the HP/FUEL tag", () => {
  it("says nothing while both are full and nothing has changed", () => {
    expect(resourceWarning(resources())).toBeNull();
    expect(resourceTagVisible(resources({ now: RESOURCE_FLASH_MS + 1 }))).toBe(false);
    expect(resourceTagText(resources({ now: RESOURCE_FLASH_MS + 1 }))).toBeNull();
  });

  it(`shows on change for ${RESOURCE_FLASH_MS} ms`, () => {
    expect(resourceTagVisible(resources({ now: 0 }))).toBe(true);
    expect(resourceTagVisible(resources({ now: RESOURCE_FLASH_MS - 1 }))).toBe(true);
    expect(resourceTagVisible(resources({ now: RESOURCE_FLASH_MS }))).toBe(false);
    // The change flash names both, because both changed hands.
    expect(resourceTagText(resources({ now: 0 }))).toBe("HP 100 · FUEL 100");
  });

  it(`stays up under ${WARN_FRACTION * 100} % however long ago it changed`, () => {
    const low = resources({ hp: 20, now: 10 * 60_000 });
    expect(resourceWarning(low)).toBe("hp");
    expect(resourceTagVisible(low)).toBe(true);
    expect(resourceTagText(low)).toBe("HP 20");

    const dry = resources({ fuel: 15, now: 10 * 60_000 });
    expect(resourceWarning(dry)).toBe("fuel");
    expect(resourceTagText(dry)).toBe("FUEL 15");
  });

  it("names both when both are low, and the worse one when they differ", () => {
    expect(resourceTagText(resources({ hp: 10, fuel: 5 }))).toBe("HP 10 · FUEL 5");
    // Exactly at the line is "low": 30 % of 100 is 30.
    expect(resourceWarning(resources({ hp: 30 }))).toBe("hp");
    expect(resourceWarning(resources({ hp: 31 }))).toBeNull();
  });

  it("treats a zero maximum as full rather than as a division by zero", () => {
    const zero = resources({ hp: 0, fuel: 0, maxHp: 0, maxFuel: 0, now: 1e6 });
    expect(resourceWarning(zero)).toBeNull();
    expect(resourceTagVisible(zero)).toBe(false);
  });
});
