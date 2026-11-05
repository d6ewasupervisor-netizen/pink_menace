/**
 * 5.3 — The Summit (card VII-003) must reach 6.1.
 *
 * On a phone, the save pointed at 5.3 and every reload resumed into the same
 * trap: the card played, then the story waited on `cutscene.summit_clear` —
 * an event nothing emitted — with no mission running, so the cockpit rule
 * (correctly) hid the dashboard and the car sat in a placeholder world.
 *
 * Two cases:
 *  1. a resumed save at 5.3 answers VII-003 and the campaign reaches 6.1 with no
 *     stranded state (the cutscene rule answers the wait after a short beat);
 *  2. a deliberately orphaned wait shows the Continue safety net after 8 s and
 *     the control releases it.
 *
 * Headless only, the same 390x844 phone the bug was reported on.
 */
import { test, expect, type Page } from "@playwright/test";

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

async function mockStudent(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, signedIn: true, kind: "game", person: { id: "summit-1", role: "student", name: "Ali", last4: null } }),
    }),
  );
  await page.route("**/api/drive/progress", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ progress: null }) }),
  );
}

/** The save the phone was carrying: scene 5.3, the chain-up done. */
const SUMMIT_SAVE = {
  state: {
    vars: {},
    // A real save at 5.3 carries all three: the 2.8 purchase sets the `chains`
    // item and `has_chains`, and 5.2's chain-up sets `chains_mounted`. The summit
    // scene does not read `has_chains`, but the seeded save should be the shape
    // the reported save had.
    flags: { has_chains: true, chains_mounted: true },
    items: ["chains"],
    unlocks: [],
    ledger: [],
    mastery: {},
    attempts: [],
    choiceLog: [],
    examMissedIds: [],
    checkpoint: "chains_on",
    sceneId: "5.3",
    runnerState: null,
  },
  version: 2,
};

async function seedSummit(page: Page) {
  await page.addInitScript((save) => {
    localStorage.setItem("quiet-roads-save", JSON.stringify(save));
    localStorage.setItem("quiet-roads-last-saved", String(Date.now()));
  }, SUMMIT_SAVE);
}

const STATE = `(async () => {
  const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
  const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
  const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
  const hud = useQRHud.getState();
  return {
    scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    node: QuietRoads.runner.currentId,
    waiting: QuietRoads.runner.isWaiting,
    event: QuietRoads.runner.current ? QuietRoads.runner.current.wait_for ?? null : null,
    card: hud.card ? hud.card.id : null,
    line: hud.line ? hud.line.node_id : null,
    direction: hud.direction ? hud.direction.id : null,
    stranded: hud.stranded,
    phase: (await import('/drive/src/stores/gameStore.ts')).useGameStore.getState().phase,
    checkpoint: useQRStore.getState().checkpoint,
    flags: useQRStore.getState().flags,
  };
})()`;

type State = {
  scene: string | null;
  node: string;
  waiting: boolean;
  event: string | null;
  card: string | null;
  line: string | null;
  direction: string | null;
  stranded: { scene: string; node: string; event: string } | null;
  phase: string;
  checkpoint: string | null;
  flags: Record<string, boolean>;
};

const read = (page: Page) => page.evaluate(STATE as unknown as () => Promise<State>) as Promise<State>;

async function tap(page: Page) {
  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    QuietRoads.tap();
  });
}

/** Answer VII-003 the moment the card is up. */
async function answerCard(page: Page) {
  const options = page.locator('[data-layer="dock"] button:has(span)');
  if ((await options.count()) > 0) {
    await options.first().click({ timeout: 10_000 });
    await page.waitForTimeout(1200);
  }
  await page.getByRole("button", { name: "CONTINUE" }).first().click({ timeout: 15_000 });
}

test("resume at 5.3: VII-003 answers and the summit reaches 6.1", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== "desktop", "viewport is set inside the test");
  await mockStudent(page);
  await seedSummit(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  const booted = await read(page);
  expect(booted.scene, "resumed into the summit scene").toBe("5.3");
  expect(booted.checkpoint, "the chain-up checkpoint is the save's").toBe("chains_on");
  expect(booted.flags.chains_mounted, "the chains are on the car").toBe(true);

  let answered = false;
  for (let step = 0; step < 60; step++) {
    const st = await read(page);
    if (st.scene === "6.1") break;
    if (st.card) {
      if (st.card === "VII-003") answered = true;
      await answerCard(page);
    } else {
      await tap(page);
    }
    await page.waitForTimeout(500);
  }

  expect(answered, "VII-003 opened").toBe(true);
  const arrived = await read(page);
  expect(arrived.scene, "the summit handed off to 6.1").toBe("6.1");
  expect(arrived.stranded, "no stranded state on the way").toBeNull();
  await expect(page.locator('[data-layer="stranded"]')).toHaveCount(0);
});

test("an orphaned wait surfaces Continue and the control releases it", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(test.info().project.name !== "desktop", "viewport is set inside the test");
  await mockStudent(page);
  await seedSummit(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  // Walk to 5.3's real post-card wait (its own 3 s direction timer has to be
  // spent first), then rename the event it waits on to one nothing emits. The
  // node, its `next` and the runner's state stay exactly as the scene made them
  // — only the event is orphaned, which is the reported bug's shape.
  let answered = false;
  for (let step = 0; step < 40; step++) {
    const st = await read(page);
    if (st.card === "VII-003") {
      await answerCard(page);
      answered = true;
      break;
    }
    await tap(page);
    await page.waitForTimeout(500);
  }
  expect(answered, "VII-003 opened").toBe(true);

  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    const r = QuietRoads.runner as unknown as { current: { wait_for?: string } | null; currentId: string };
    if (!r.current || r.current.wait_for !== "cutscene.summit_clear") {
      throw new Error(`expected 5.3.hold, got ${r.currentId}`);
    }
    r.current.wait_for = "story.orphan_check";
  });
  await expect.poll(async () => (await read(page)).event, { timeout: 5000 }).toBe("story.orphan_check");

  const control = page.locator('[data-layer="stranded"]');
  await expect(control, "the Continue control appears after the 8 s net").toBeVisible({ timeout: 30_000 });
  await expect(control).toHaveAttribute("data-stranded-event", "story.orphan_check");
  await expect(control).toHaveAttribute("data-stranded-scene", "5.3");
  await expect(control.getByRole("button", { name: "Continue" })).toBeVisible();

  await control.getByRole("button", { name: "Continue" }).click({ timeout: 10_000 });
  await expect.poll(async () => (await read(page)).node, { timeout: 10_000 }).not.toBe("5.3.hold");
  await expect(control).toHaveCount(0);
});
