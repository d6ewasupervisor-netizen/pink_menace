/**
 * 6.3 — Vantage Bridge, the whole beat, on a phone.
 *
 * The HAR this pass started from: she held 52–59 in the 45 (the event flood),
 * touched a stick during "Engine off. Hands off." (the mission restarted four
 * times), the phone locked itself for 84 s (the "stall"), and then she was in a
 * 25 at 60–67. So this walks the real scene with the real runner and a real
 * thumb on the sticks:
 *
 *   VII-006 card → cross under the wind assist → the sign → the moth →
 *   ENGINE OFF · HANDS OFF with no sticks, and a touch that must NOT restart →
 *   the minute → the release line → the far side → 7.1
 *
 * and, separately, counts the POSTs to /api/drive/events across a scripted 20 s
 * of the span (the flood was 466 POSTs in 23 s; the budget here is 3).
 *
 * Headless only. The drive to the sign is where the reported bugs lived, so the
 * crossing itself is driven on the touch stick; the span's length after that is
 * not what any of these cases measure, so the car is put on the sim's own mid
 * start (the same shortcut `shop.spec.ts` takes up the grade).
 */
import { test, expect, type Page } from "@playwright/test";
import { duplicateViewportReason } from "./skipDuplicate";

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

/** The save the phone was carrying: scene 6.3, no Gracie toy (the moth branch). */
const BRIDGE_SAVE = {
  state: {
    vars: { trade_points: 120, bridge_wait_restarts: 0, fatigue_stage: 1, calm: 40 },
    flags: { rested: true, pushed_through: false },
    items: [],
    unlocks: [],
    ledger: [],
    mastery: {},
    attempts: [],
    choiceLog: [],
    examMissedIds: [],
    checkpoint: "vantage_approach",
    sceneId: "6.3",
    runnerState: null,
  },
  version: 2,
};

async function mockStudent(page: Page, opts: { countEvents?: boolean } = {}) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, signedIn: true, kind: "game", person: { id: "bridge-1", role: "student", name: "Ali", last4: null } }),
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
          card_id: "VII-006",
          option_id: "b",
          was_correct: true,
          result: "Slow down before the span and take the gusts in small corrections.",
          debrief: "Slow down, two hands, small corrections. The wind does not care what the sign says.",
          state_delta: { noise: 0, time_cost: 0 },
        },
      }),
    }),
  );
  if (opts.countEvents) return;
}

async function seedBridge(page: Page) {
  await page.addInitScript((save) => {
    localStorage.setItem("quiet-roads-save", JSON.stringify(save));
    localStorage.setItem("quiet-roads-last-saved", String(Date.now()));
  }, BRIDGE_SAVE);
}

const STATE = `(async () => {
  const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
  const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
  const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
  const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
  const { getCurrentSpeedMs } = await import('/drive/src/systems/VehicleController.ts');
  const { driveInputLocked } = await import('/drive/src/input/driveInput.ts');
  const hud = useQRHud.getState();
  return {
    scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    node: QuietRoads.runner.currentId,
    waiting: QuietRoads.runner.isWaiting,
    card: hud.card ? hud.card.id : null,
    handsOff: hud.handsOff,
    assist: hud.windAssist,
    gust: hud.gust,
    stranded: hud.stranded,
    missionId: QuietRoads.sim.missionId,
    waitElapsedS: QuietRoads.sim.waitElapsedS,
    speedMph: Math.abs(getCurrentSpeedMs()) / 0.44704,
    pos: [...useGameStore.getState().vehiclePosition],
    phase: useGameStore.getState().phase,
    vars: useQRStore.getState().vars,
    flags: useQRStore.getState().flags,
    checkpoint: useQRStore.getState().checkpoint,
    locked: driveInputLocked(),
    line: hud.line ? hud.line.text : null,
    direction: hud.direction ? hud.direction.text : null,
    choices: Boolean(hud.choices),
  };
})()`;

type State = {
  scene: string | null;
  node: string;
  waiting: boolean;
  card: string | null;
  handsOff: { mission: string; totalS: number; elapsedS: number } | null;
  assist: { label: string; holdMph: number } | null;
  gust: { side: 'left' | 'right'; atMs: number; push: boolean } | null;
  stranded: unknown;
  missionId: string;
  waitElapsedS: number;
  speedMph: number;
  pos: [number, number, number];
  phase: string;
  vars: Record<string, number>;
  flags: Record<string, boolean>;
  checkpoint: string | null;
  locked: boolean;
  line: string | null;
  direction: string | null;
  choices: boolean;
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
async function walk(page: Page, done: (s: State) => boolean, steps = 90) {
  for (let i = 0; i < steps; i++) {
    const st = await read(page);
    if (done(st)) return st;
    if (st.card) await answerCard(page);
    else await tap(page);
    await page.waitForTimeout(400);
  }
  return read(page);
}

/**
 * Put a thumb on the gas stick and hold it there, for real: the ring listens for
 * pointer events, so a mouse-down (which is a pointer) inside it is the same
 * input a phone delivers.
 */
async function gasStick(page: Page) {
  const ring = page.locator('[data-layer="sticks"] div[data-ui]').last();
  const box = await ring.boundingBox();
  if (!box) throw new Error("no gas stick on screen");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return { page, cx, cy, radius: box.width * 0.38 };
}

async function holdGas(stick: { page: Page; cx: number; cy: number; radius: number }) {
  const { page, cx, cy, radius } = stick;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - radius * 0.95, { steps: 4 });
}

async function releaseGas(page: Page) {
  await page.mouse.up();
}

async function boot(page: Page, viewport?: { width: number; height: number }) {
  await mockStudent(page);
  await seedBridge(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);
  if (viewport) await page.setViewportSize(viewport);
}

/** Put the car on the span's own start — the span's length is not what these cases measure. */
async function placeAt(page: Page, start: 'bridge_mid_start' | 'bridge_west') {
  await page.evaluate(async (which) => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    const { teleportVehicle } = await import("/drive/src/systems/VehicleController.ts");
    const s = QuietRoads.sim.map.starts[which];
    teleportVehicle(s.pos.x, s.pos.y, s.heading);
  }, start);
}

/**
 * A thumb on the STEER ring, moved off centre by a fraction of its travel. The
 * assist then scales it (0.55, with a 4 % dead zone), so 0.25 of the ring is a
 * correction, not a lane change — the same gesture the scene asks for.
 */
async function steerStick(page: Page) {
  const ring = page.locator('[data-layer="sticks"] div[data-ui]').first();
  const box = await ring.boundingBox();
  if (!box) throw new Error("no steer ring on screen");
  return { page, cx: box.x + box.width / 2, cy: box.y + box.height / 2, radius: box.width * 0.38 };
}

/** Hold the wheel toward `side` (the side the wind comes from) for `ms`. */
async function steerInto(page: Page, side: 'left' | 'right', ms: number) {
  const s = await steerStick(page);
  // 0.18 of the ring is ~0.15 at the input layer, and the assist's 0.55 gain
  // makes that ~0.08 at the wheel — the correction the physics test shows cancels
  // the push. Anything more is the overcorrection the scene warns about.
  const dx = s.radius * 0.18 * (side === 'right' ? 1 : -1);
  await page.mouse.move(s.cx, s.cy);
  await page.mouse.down();
  await page.mouse.move(s.cx + dx, s.cy, { steps: 3 });
  await page.waitForTimeout(ms);
  await page.mouse.move(s.cx, s.cy, { steps: 3 });
  await page.mouse.up();
}

test("6.3 from the card to 7.1: the crossing, the sign, the moth, and the hands-off minute", async ({ page }) => {
  test.setTimeout(300_000);
  const duplicate = duplicateViewportReason(test.info().project.use?.viewport, { width: 390, height: 844 });
  test.skip(duplicate !== null, duplicate ?? '');
  await boot(page);

  const booted = await read(page);
  expect(booted.scene, "resumed onto the bridge approach").toBe("6.3");

  // 1. The card, then the crossing: VII-006 → 6.3.go starts the mission.
  const crossing = await walk(page, (s) => s.missionId === "vantage_bridge_crossing");
  expect(crossing.missionId, "the crossing is live").toBe("vantage_bridge_crossing");
  await expect(page.locator('[data-layer="sticks"]'), "the sticks are up for the crossing").toHaveCount(1);

  // 2. The assist says what it is doing — as the nav strip's tag, not a chip.
  await expect(page.locator('[data-assist="wind"]')).toHaveText("AUTO 40", { timeout: 10_000 });

  // 3. Drive it with a thumb. The hold finds 40 on its own and cannot be pushed
  //    past it, which is the whole point of the assist.
  const stick = await gasStick(page);
  await holdGas(stick);
  await page.waitForTimeout(9000);
  const driving = await read(page);
  await releaseGas(page);
  expect(driving.pos[0], "the car moved under the touch stick").toBeGreaterThan(120);
  expect(driving.speedMph, "the hold is 40 mph, under the posted 45").toBeGreaterThan(28);
  expect(driving.speedMph).toBeLessThan(41);
  expect(driving.vars.bridge_wait_restarts ?? 0, "no restart on the crossing").toBe(0);

  // 4. Halfway across: the sign. The span between here and the far side is not
  //    what this case measures, so the car is placed on the sim's own mid start.
  await placeAt(page, "bridge_mid_start");
  const sign = await walk(page, (s) => s.missionId === "bridge_after_sign_moth" || s.missionId === "bridge_after_sign_toy");
  expect(sign.missionId, "the sign slam chose the moth branch (no Gracie toy in this save)").toBe("bridge_after_sign_moth");

  // 5. Keep rolling — above 18 mph — and Gracie takes the moth.
  const stick2 = await gasStick(page);
  await holdGas(stick2);
  const engineOff = await walk(page, (s) => s.missionId === "bridge_engine_off_wait");
  await releaseGas(page);
  expect(engineOff.missionId, "the engine-off wait started").toBe("bridge_engine_off_wait");

  // 6. The overlay: title, ring, countdown, and no sticks at all.
  const overlay = page.locator('[data-layer="hands-off"]');
  await expect(overlay, "ENGINE OFF · HANDS OFF is up").toBeVisible({ timeout: 20_000 });
  await expect(overlay).toContainText("ENGINE OFF · HANDS OFF");
  await expect(overlay).toHaveAttribute("data-hands-off-mission", "bridge_engine_off_wait");
  await expect(overlay).toHaveAttribute("data-hands-off-total", "60");
  await expect(page.locator('[data-layer="sticks"]'), "the sticks are gone").toHaveCount(0);
  const locked = await read(page);
  expect(locked.locked, "every driving input is ignored").toBe(true);

  // 7. A touch during the minute must NOT start the engine. Two ways a thumb can
  //    reach the car: a press where a stick used to be, and the keyboard (the
  //    other input the assist covers).
  const box = await overlay.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
  }
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1200);
  await page.keyboard.up("ArrowUp");
  const afterTouch = await read(page);
  expect(afterTouch.node, "no restart node").not.toBe("6.3.restart");
  expect(afterTouch.vars.bridge_wait_restarts ?? 0, "no restart counted").toBe(0);
  expect(afterTouch.speedMph, "and the car did not move").toBeLessThan(1.5);
  expect(afterTouch.waitElapsedS, "the minute is still running").toBeGreaterThan(0);

  // 8. The minute — in real time, and that is a measurement: `page.clock` was
  //    tried first. `runFor(66_000)` spent 90,073 ms of wall time (4,125 mocked
  //    frames of WebGL, serialized) and then left the rAF loop paused, so the
  //    overlay never released. Slower than the wait it replaces and wrong about
  //    it. A real minute of a real loop is 66 s.
  const before = (await read(page)).waitElapsedS;
  await expect(overlay, "the overlay releases when the ring is spent").toHaveCount(0, { timeout: 90_000 });
  const released = await read(page);
  expect(released.waitElapsedS, "the whole sixty seconds were spent").toBeGreaterThan(59);
  expect(released.waitElapsedS).toBeGreaterThan(before);
  expect(released.locked, "the car is hers again").toBe(false);
  await expect(page.locator('[data-layer="sticks"]'), "the sticks are back").toHaveCount(1);
  expect(released.stranded, "nothing stranded on the way").toBeNull();

  // 9. The far side and out: 6.3.clear → 6.3.13 → bridge_end → 6.3.end → 7.1.
  await walk(page, (s) => s.node === "6.3.wait_end", 30);
  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    const { teleportVehicle } = await import("/drive/src/systems/VehicleController.ts");
    const end = QuietRoads.sim.map.markers.bridge_end;
    teleportVehicle(end.x - 4, end.y, 0);
  });
  const finished = await walk(page, (s) => s.scene === "7.1", 60);
  expect(finished.scene, "the bridge handed off to 7.1").toBe("7.1");
  expect(finished.checkpoint, "the crossing checkpoint").toBe("bridge_crossed");
});

test("20 s of the crossing posts to /api/drive/events at most three times", async ({ page }) => {
  test.setTimeout(180_000);
  const duplicate = duplicateViewportReason(test.info().project.use?.viewport, { width: 390, height: 844 });
  test.skip(duplicate !== null, duplicate ?? '');
  await mockStudent(page);
  // Count every POST the client makes while she drives. The flood was 466 POSTs
  // in 23 s; the uploader's budget is one per 10 s interval.
  let posts = 0;
  let events = 0;
  await page.route("**/api/drive/events", async (route) => {
    posts += 1;
    const body = route.request().postDataJSON() as { events?: unknown[] } | null;
    events += body?.events?.length ?? 0;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, accepted: body?.events?.length ?? 0 }) });
  });
  await seedBridge(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  const crossing = await walk(page, (s) => s.missionId === "vantage_bridge_crossing");
  expect(crossing.missionId).toBe("vantage_bridge_crossing");
  posts = 0;                                    // from the moment the span starts
  events = 0;
  const stick = await gasStick(page);
  await holdGas(stick);
  await page.waitForTimeout(20_000);
  await releaseGas(page);

  const st = await read(page);
  expect(st.pos[0], "she actually crossed").toBeGreaterThan(200);
  expect(posts, `POSTs in 20 s of the span (budget 3, the HAR had 466 in 23 s)`).toBeLessThanOrEqual(3);
  // One POST can carry many rows; the flood is counts, not rows.
  expect(events).toBeLessThanOrEqual(posts * 50);
});

test("the overlay fits a 440x956 phone: title, ring, marks, and no sticks", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 440, height: 956 });
  await mockStudent(page);
  await seedBridge(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  // Straight to the wait: the sim's own mission start, so the case is about the
  // overlay's geometry at this width, not about the crossing again. The scene's
  // entry lines had the car frozen (that is what `start_gameplay` releases), so
  // the freeze is released here the way the bridge does it.
  await page.evaluate(async () => {
    const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
    const { teleportVehicle } = await import("/drive/src/systems/VehicleController.ts");
    const { useGameStore } = await import("/drive/src/stores/gameStore.ts");
    const start = QuietRoads.sim.map.starts.bridge_mid_start;
    QuietRoads.sim.startMission("bridge_engine_off_wait");
    teleportVehicle(start.pos.x, start.pos.y, start.heading);
    QuietRoads.sim.unfreeze("dialogue");
    useGameStore.getState().setPhase("driving");
  });
  const overlay = page.locator('[data-layer="hands-off"]');
  await expect(overlay).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-layer="sticks"]')).toHaveCount(0);

  const box = (await overlay.boundingBox())!;
  expect(box.width, "the overlay spans the phone").toBeGreaterThan(400);
  expect(box.height, "and leaves the HUD band alone").toBeLessThan(956 - 200);
  const ring = await page.locator("[data-hands-off-ring]").boundingBox();
  expect(ring, "the countdown ring is on screen").not.toBeNull();
  expect(ring!.width).toBeGreaterThan(100);
  await expect(page.locator("[data-hands-off-mark-tick]")).toHaveCount(4);
  await expect(overlay).toHaveAttribute("data-hands-off-remaining", /\d+/);
  const first = Number(await overlay.getAttribute("data-hands-off-remaining"));
  await page.waitForTimeout(3500);
  const second = Number(await overlay.getAttribute("data-hands-off-remaining"));
  expect(second, "the ring is counting down").toBeLessThan(first);
});

/**
 * The lesson, on a phone, in one run: the gust pushes, the arrow names the side,
 * and a thumb that answers it stays in the lane all the way to `bridge_mid`.
 *
 * 440x956 is the phone this was reported on. The car is left to the assist's own
 * 40 mph hold (no gas at all: that is the hold doing its job), and the first gust
 * is measured bare so the push is a number, not a claim. Every gust after it gets
 * the correction the indicator asks for, on the side it names.
 */
test("440x956: the gust pushes, the thumb answers, and she reaches bridge_mid in her lane", async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 440, height: 956 });
  await mockStudent(page);
  await seedBridge(page);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  const crossing = await walk(page, (s) => s.missionId === "vantage_bridge_crossing");
  expect(crossing.missionId, "the crossing is live").toBe("vantage_bridge_crossing");
  await expect(page.locator('[data-assist="wind"]'), "the assist says what it is").toHaveText("AUTO 40");

  await placeAt(page, "bridge_west");
  const CENTRE_Y = 1140;                       // the span runs east along y = 1140
  const gusts: { side: "left" | "right"; label: string; drift: number; off: number }[] = [];
  const warnings: { side: "left" | "right"; label: string }[] = [];
  let worstOffsetM = 0;
  let warned = -1;
  let answered = -1;
  let reachedMid = false;
  let after = "";
  let lastX = 0;
  let lastOff = 0;
  const offsets: number[] = [];

  for (let i = 0; i < 300; i++) {
    const st = await read(page);
    worstOffsetM = Math.max(worstOffsetM, Math.abs(st.pos[2] - CENTRE_Y));
    if (i % 5 === 0) offsets.push(st.pos[2] - CENTRE_Y);
    lastX = st.pos[0];
    if (st.missionId !== "vantage_bridge_crossing") {
      reachedMid = true;
      after = st.missionId;
      break;
    }
    // Story surfaces advance with a thumb, the way a player's would.
    if (st.card) await answerCard(page);
    else if (st.line || st.direction || st.choices) await tap(page);

    const label = async () =>
      ((await page.locator("[data-gust-side]").innerText()) ?? "").replace(/\s+/g, " ").trim();

    // The warning: the arrow, on the side the wind comes from, before it lands.
    if (st.gust && !st.gust.push && st.gust.atMs !== warned) {
      warned = st.gust.atMs;
      warnings.push({ side: st.gust.side, label: await label() });
    }
    // The push itself: measure it (the first one bare, so the drift is a number),
    // and answer every one after it the way the indicator says.
    if (st.gust && st.gust.push && st.gust.atMs !== answered) {
      answered = st.gust.atMs;
      const side = st.gust.side;
      const text = await label();
      const from = st.pos[2];
      if (gusts.length >= 1) await steerInto(page, side, 480);
      await page.waitForTimeout(1500);
      const to = (await read(page)).pos[2];
      gusts.push({ side, label: text, drift: to - from, off: from - CENTRE_Y });
    } else if (!st.gust) {
      // Between gusts a thumb holds the line, the way a player's does. The car
      // keeps every heading it is given (the arcade chassis has no self-centring
      // *heading*, only a centring yaw rate), so position alone is not enough to
      // steer by: the demand leads on the rate the offset is closing. Without the
      // lead the correction overshoots and the offset grows run to run.
      const off = st.pos[2] - CENTRE_Y;
      const rate = (off - lastOff) / 0.25;                 // m/s, + = to the right
      lastOff = off;
      const demand = off + 0.6 * rate;
      if (Math.abs(off) > 0.4 || Math.abs(rate) > 0.25) {
        await steerInto(page, demand < 0 ? "right" : "left", 180);
      }
    }
    await page.waitForTimeout(220);
  }
  console.log(`[e2e] offsets: ${offsets.map((o) => o.toFixed(2)).join(" ")}`);
  console.log(`[e2e] worst ${worstOffsetM.toFixed(2)} m, reached ${reachedMid} at x=${lastX.toFixed(0)}`);

  // The warning came first, on the same side as the push, and said what to do.
  expect(warnings.length, `warnings seen: ${warnings.length} / gusts ${gusts.length}`).toBeGreaterThanOrEqual(1);
  for (const g of gusts) {
    expect(warnings.some((w) => w.side === g.side), `a warning for the ${g.side} gust`).toBe(true);
  }
  expect(warnings[0].label, "the warning names the action").toContain(`GUST · steer ${warnings[0].side}`);

  // The indicator named the side the wind came from, with the action in words —
  // and the wind alternates, first gust from the right.
  expect(gusts.length, `gusts: ${gusts.map((g) => `${g.side}@${g.off.toFixed(2)}`).join(" ")}`).toBeGreaterThanOrEqual(2);
  expect(gusts[0].side, "the first gust comes from the right").toBe("right");
  for (let i = 0; i < gusts.length; i++) {
    expect(gusts[i].label, `gust ${i} says which way to steer`).toContain(`GUST · steer ${gusts[i].side}`);
    if (i > 0) expect(gusts[i].side, "the wind alternates").not.toBe(gusts[i - 1].side);
  }

  // A gust with no input moves the car downwind — the far side from the wind.
  // From the right, that is the car's left: negative on the span's y axis.
  expect(gusts[0].drift, `drifts: ${gusts.map((g) => `${g.side} ${g.drift.toFixed(2)} m`).join(", ")}`).toBeLessThan(-0.4);

  // She crossed: the sign scene is what `waypoint.reach:bridge_mid` starts.
  expect(reachedMid, `the car reached bridge_mid (last x ${lastX.toFixed(0)} of 800)`).toBe(true);
  expect(after).toMatch(/^bridge_after_sign_/);
  // ...and never left the lane doing it (a lane is 4 m either side of the mark).
  expect(worstOffsetM, `worst offset from the centreline ${worstOffsetM.toFixed(2)} m`).toBeLessThan(4);
});

