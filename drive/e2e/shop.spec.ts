/**
 * The shop counter, end to end: 5.2 with no chains -> 2.8 -> buy the chains ->
 * 5.1 -> 5.2 chain-up -> 5.3.
 *
 * The deadlock guard used to allow-list `shop.buy:*` and `shop.cant_afford` as
 * "not on any forward path". They were: 5.2.block's `next_scene` is 2.8, and
 * with no counter the only exit from Tuna's bay was `2.8.end_reblocked` -> 5.1
 * -> 5.2.block again, forever. This walks the loop the way a player does — the
 * real runner, the real counter, the real Trade Points — and only the drive up
 * the grade is short-circuited (the car is placed on the sim's own
 * `chainup_pullout` start, because the climb's steering is not what this test
 * measures; the chain-up gesture itself is the real brake).
 *
 * Headless only, the same 390x844 phone the summit bug was reported on.
 */
import { test, expect, type Page } from "@playwright/test";

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

async function mockStudent(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, signedIn: true, kind: "game", person: { id: "shop-1", role: "student", name: "Ali", last4: null } }),
    }),
  );
  await page.route("**/api/drive/progress", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ progress: null }) }),
  );
  await page.route("**/api/drive/card-answers", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        graded: {
          card_id: "VII-002",
          option_id: "a",
          was_correct: true,
          result: "Chains on the drive wheels before the car moves.",
          debrief: "Chains on the drive wheels, before the car moves.",
          state_delta: { noise: 0, time_cost: 0 },
        },
      }),
    }),
  );
}

/** The save the loop starts from: the chain-up pull-out, no chains, 300 TP. */
const NO_CHAINS_SAVE = {
  state: {
    vars: { trade_points: 300 },
    flags: {},
    items: [],
    unlocks: [],
    ledger: [],
    mastery: {},
    attempts: [],
    choiceLog: [],
    examMissedIds: [],
    checkpoint: "climb_begin",
    sceneId: "5.2",
    runnerState: null,
  },
  version: 2,
};

async function seed(page: Page) {
  await page.addInitScript((save) => {
    localStorage.setItem("quiet-roads-save", JSON.stringify(save));
    localStorage.setItem("quiet-roads-last-saved", String(Date.now()));
  }, NO_CHAINS_SAVE);
}

const STATE = `(async () => {
  const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
  const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
  const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
  const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
  const hud = useQRHud.getState();
  const qr = useQRStore.getState();
  return {
    scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    node: QuietRoads.runner.currentId,
    line: hud.line ? hud.line.node_id : null,
    direction: hud.direction ? hud.direction.id : null,
    card: hud.card ? hud.card.id : null,
    shop: hud.shop ? hud.shop.scene : null,
    stranded: hud.stranded,
    missionId: QuietRoads.sim.missionId,
    phase: useGameStore.getState().phase,
    tradePoints: qr.vars.trade_points ?? 0,
    items: qr.items,
    flags: qr.flags,
  };
})()`;

type State = {
  scene: string | null;
  node: string;
  line: string | null;
  direction: string | null;
  card: string | null;
  shop: string | null;
  stranded: { scene: string; node: string; event: string } | null;
  missionId: string;
  phase: string;
  tradePoints: number;
  items: string[];
  flags: Record<string, boolean>;
};

const read = (page: Page) => page.evaluate(STATE as unknown as () => Promise<State>) as Promise<State>;

async function tap(page: Page) {
  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    QuietRoads.tap();
  });
}

/** Answer the card the moment it is up (a pick, then CONTINUE). */
async function answerCard(page: Page) {
  const options = page.locator('[data-layer="dock"] button:has(span)');
  if ((await options.count()) > 0) {
    await options.first().click({ timeout: 10_000 });
    await page.waitForTimeout(1200);
  }
  await page.getByRole("button", { name: "CONTINUE" }).first().click({ timeout: 15_000 });
}

/** Tap / answer until `done` says so, or the step cap runs out. */
async function walk(page: Page, done: (s: State) => boolean, steps = 80) {
  for (let i = 0; i < steps; i++) {
    const st = await read(page);
    if (done(st)) return st;
    if (st.card) await answerCard(page);
    else await tap(page);
    await page.waitForTimeout(400);
  }
  return read(page);
}

test("5.2 with no chains buys the set at Tuna's and the climb reaches 5.3", async ({ page }) => {
  test.setTimeout(240_000);
  test.skip(test.info().project.name !== "desktop", "viewport is set inside the test");
  await mockStudent(page);
  await seed(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  const booted = await read(page);
  expect(booted.scene, "resumed into the chain-up area").toBe("5.2");
  expect(booted.items, "no chains in the trunk").not.toContain("chains");
  expect(booted.tradePoints, "the save's Trade Points").toBe(300);

  // 1. The sign turns her around: 5.2.block -> 2.8.
  const atShop = await walk(page, (s) => s.scene === "2.8");
  expect(atShop.scene, "5.2.block sent her to Tuna's").toBe("2.8");
  expect(atShop.flags.chainup_blocked, "the loop is open").toBe(true);

  // 2. The counter is the surface, and the chains are on it at a real price.
  const counter = page.locator('[data-layer="shop"]');
  await expect(counter, "Tuna's counter is up").toBeVisible({ timeout: 20_000 });
  await expect(counter).toHaveAttribute("data-shop-scene", "2.8");
  const chains = counter.locator('[data-shop-item="chains"]');
  await expect(chains).toBeVisible();
  await expect(chains).toHaveAttribute("data-shop-price", "150");
  await expect(chains).toHaveAttribute("data-shop-affordable", "true");
  await expect(chains).toHaveAttribute("data-shop-owned", "false");

  // 3. Buy it: the points are spent and the story's own buy node runs.
  await chains.click();
  await expect.poll(async () => (await read(page)).tradePoints, { timeout: 10_000 }).toBe(150);
  const bought = await read(page);
  expect(bought.items, "the item 5.2.entry branches on").toContain("chains");
  expect(bought.flags.has_chains, "the flag 4.2 reads").toBe(true);
  expect(bought.line, "Tuna's buy line played").toBe("2.8.buy_chains");

  // 4. Leave: the close branch sees the set and returns to the pass.
  await expect(counter, "the counter comes back after the line").toBeVisible({ timeout: 20_000 });
  await counter.locator("[data-shop-leave]").click();
  const back = await walk(page, (s) => s.scene === "5.1");
  expect(back.scene, "2.8.end_return handed off to 5.1").toBe("5.1");
  expect(back.flags.chainup_return, "the trunk line is armed").toBe(true);
  expect(back.flags.chainup_blocked, "the block is cleared").toBe(false);

  // 5. 5.1 reads chainup_return and starts the climb from below the pull-out.
  const climbing = await walk(page, (s) => s.missionId === "climb_snoqualmie_from_below_chainup");
  expect(climbing.missionId, "the return climb is running").toBe("climb_snoqualmie_from_below_chainup");

  // The drive up the grade is not what this test measures: put the car on the
  // sim's own pull-out start and let the climb's own arrival rule fire.
  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    const { teleportVehicle } = await import("/drive/src/systems/VehicleController.ts");
    const start = QuietRoads.sim.map.starts.chainup_pullout;
    teleportVehicle(start.pos.x, start.pos.y, start.heading);
  });
  const atChainup = await walk(page, (s) => s.scene === "5.2");
  expect(atChainup.scene, "waypoint.reach:chainup handed off to 5.2").toBe("5.2");

  // 6. 5.2 takes the chain-up path (the card, then the QTE).
  const qte = await walk(page, (s) => s.missionId === "chainup_qte");
  expect(qte.missionId, "the chain-up gesture is live").toBe("chainup_qte");

  // The gesture is the brake: hold it, stopped, in the pull-out.
  await page.keyboard.down("ArrowDown");
  const summit = await walk(page, (s) => s.scene === "5.3", 40);
  await page.keyboard.up("ArrowDown");
  expect(summit.scene, "the chain-up handed off to the summit").toBe("5.3");
  expect(summit.flags.chains_mounted, "the chains are on the car").toBe(true);
  expect(summit.stranded, "no stranded state on the way").toBeNull();
  await expect(page.locator('[data-layer="stranded"]')).toHaveCount(0);
});

/** Resume into a scene with a given save, the way the campaign enters it. */
async function resumeInto(page: Page, scene: string, tradePoints: number) {
  await page.evaluate(
    async (args) => {
      const { useQRStore } = await import("/drive/src/stores/qrStore.ts");
      const { useGameStore } = await import("/drive/src/stores/gameStore.ts");
      const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
      useGameStore.getState().setWorldMode("kent");
      useQRStore.setState({
        sceneId: args.scene,
        items: [],
        flags: {},
        vars: { trade_points: args.tradePoints },
        checkpoint: null,
        runnerState: null,
      });
      QuietRoads.start(false);
    },
    { scene, tradePoints },
  );
}

test("7.2 Ritzville sells the muffler and the LED lights the later scenes read", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== "desktop", "viewport is set inside the test");
  await mockStudent(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  // 300 TP is the "you can do one" tier (7.2.tp_branch >= 180).
  await resumeInto(page, "7.2", 300);
  const atCounter = await walk(page, (s) => s.shop === "7.2");
  expect(atCounter.shop, "the trading post's counter is up").toBe("7.2");

  const counter = page.locator('[data-layer="shop"]');
  await expect(counter).toBeVisible({ timeout: 20_000 });
  const muffler = counter.locator('[data-shop-item="muffler"]');
  await expect(muffler).toHaveAttribute("data-shop-price", "200");
  await expect(muffler).toHaveAttribute("data-shop-affordable", "true");
  await muffler.click();

  await expect.poll(async () => (await read(page)).tradePoints, { timeout: 10_000 }).toBe(100);
  const bought = await read(page);
  expect(bought.items, "the item 8.1.cluster branches on").toContain("muffler");
  expect(bought.flags.muffler_from_ritzville, "the flag 8.1.cluster_src reads").toBe(true);
  expect(bought.flags.has_quiet_muffler, "the flag 8.3.tuna_branch reads").toBe(true);

  // The LED lights are now out of reach at 100 TP: the counter says so and the
  // keeper's own line plays instead of a silent no-op.
  await expect(counter, "the counter comes back after the line").toBeVisible({ timeout: 20_000 });
  const leds = counter.locator('[data-shop-item="led_lights"]');
  await expect(leds).toHaveAttribute("data-shop-affordable", "false");
  await leds.click();
  await expect.poll(async () => (await read(page)).line, { timeout: 10_000 }).toBe("7.2.cant");
  expect((await read(page)).tradePoints, "nothing was spent").toBe(100);

  await expect(counter, "the counter comes back after the refusal").toBeVisible({ timeout: 20_000 });
  await counter.locator("[data-shop-leave]").click();
  const next = await walk(page, (s) => s.scene === "7.3");
  expect(next.scene, "7.2.end handed off to 7.3").toBe("7.3");
  expect(next.flags.bought_anything_ritzville, "the close branch saw the buy").toBe(true);
});

test("2.6 and 2.7 sell what their scenes' flags are read for", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== "desktop", "viewport is set inside the test");
  await mockStudent(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  // Bea's cats: the toy is what 5.3.gracie_branch and 8.3 read.
  await resumeInto(page, "2.6", 200);
  expect((await walk(page, (s) => s.shop === "2.6")).shop, "Bea's counter is up").toBe("2.6");
  const cats = page.locator('[data-layer="shop"]');
  await expect(cats).toBeVisible({ timeout: 20_000 });
  await cats.locator('[data-shop-item="gracie_toy"]').click();
  await expect.poll(async () => (await read(page)).flags.has_gracie_toy, { timeout: 10_000 }).toBe(true);
  expect((await read(page)).items, "the toy is an item too").toContain("gracie_toy");
  await expect(cats, "the counter comes back after the line").toBeVisible({ timeout: 20_000 });
  await cats.locator("[data-shop-leave]").click();
  expect((await walk(page, (s) => s.scene === "2.3c")).scene, "2.6.end handed off to 2.3c").toBe("2.3c");

  // Priya's photocards: the Sori card is what 6.2 and 8.3 read.
  await resumeInto(page, "2.7", 200);
  expect((await walk(page, (s) => s.shop === "2.7")).shop, "Priya's counter is up").toBe("2.7");
  const kpop = page.locator('[data-layer="shop"]');
  await expect(kpop).toBeVisible({ timeout: 20_000 });
  await kpop.locator('[data-shop-item="photocard_sori"]').click();
  await expect.poll(async () => (await read(page)).flags.has_sori_card, { timeout: 10_000 }).toBe(true);
  expect((await read(page)).items, "the card is an item too").toContain("photocard_sori");
  await expect(kpop, "the counter comes back after the line").toBeVisible({ timeout: 20_000 });
  await kpop.locator("[data-shop-leave]").click();
  expect((await walk(page, (s) => s.scene === "2.3d")).scene, "2.7.end handed off to 2.3d").toBe("2.3d");
});
