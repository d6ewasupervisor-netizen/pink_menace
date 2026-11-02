/**
 * The cockpit comes back when a card hands the car back.
 *
 * Every story card that leads into `start_gameplay` (Act VII's ten placements
 * from e343149 plus the older I-005 / V-001 / VI-xxx runs) closes, the runner
 * fires the mission, and the player must be driving again: sticks on screen, the
 * nav cluster and the noise meter mounted, the car answering the throttle. A
 * card-resolution path that leaves the driving HUD down strands the player in a
 * car with no controls.
 *
 * Each scene is entered the way the campaign enters it (resume into the scene
 * with the items the branch needs), then: tap to the card, resolve it, tap to
 * `start_gameplay`, and measure. The three ways a card can close are covered:
 * answered (a pick, graded), timed out (no pick: the card resolves with its
 * `timeout_option_id` through the same `finishCard` entry a timer would use) and
 * continue-only (a beat/dossier card with no decision).
 */
import { test, expect, type Page } from '@playwright/test';

// The phone the bug was reported on. Headless: no window, no GPU, the same
// 390x844 layout.
test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

interface Sweep {
  scene: string;
  card: string;
  /** Items the scene's entry branch needs. */
  items: string[];
  /** How the card closes. */
  closes: 'answered' | 'timeout' | 'continue-only';
}

const SWEEP: Sweep[] = [
  // Act VII's card → start_gameplay placements (e343149).
  { scene: '5.1', card: 'VII-001', items: ['chains'], closes: 'answered' },
  { scene: '5.2', card: 'VII-002', items: ['chains'], closes: 'answered' },
  { scene: '6.2', card: 'VII-005', items: ['chains'], closes: 'answered' },
  { scene: '6.3', card: 'VII-006', items: ['chains'], closes: 'answered' },
  // Older card → start_gameplay runs (V-001 … V-012, then the Ribbon).
  { scene: '3.1b', card: 'V-001', items: [], closes: 'answered' },
  // A dossier (no decision): read and continue, then the gravel lesson.
  { scene: '6.1b', card: 'VI-001', items: [], closes: 'continue-only' },
  { scene: '1.2', card: 'I-005', items: [], closes: 'continue-only' },
  // A hazard that ran out its clock (VII-002's timeout_option_id is "b", 12 s).
  { scene: '5.2', card: 'VII-002', items: ['chains'], closes: 'timeout' },
];

/**
 * 8.1 is the one placement that is NOT card → mission: its card (VII-008) sits at
 * the parking gap, after `8.1.go` has already started `spokane_home`. So it is
 * measured from the other side — the mission starts with the cockpit up, with no
 * card in between at all.
 */
const SCENE_WITHOUT_CARD_BEFORE_MISSION = { scene: '8.1', items: ['chains'], mission: 'spokane_home' };

async function mockStudent(page: Page) {
  // Last route registered wins, so the catch-all goes first.
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'restore-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
  await page.route('**/api/drive/card-answers', async (route) => {
    const sent = route.request().postDataJSON() as { card_id?: string; option_id?: string | null; source?: string };
    // The bundle has no answer key. VII-002 is answered per option so a timeout
    // can be told apart from a tap: only "a" is the chains-on-the-drive-wheels
    // answer, and "b" is the clock's (VII-002 timeout_option_id = b).
    const timed = sent?.card_id === 'VII-002' && sent?.option_id === 'b';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        graded: {
          card_id: sent?.card_id ?? '',
          option_id: sent?.option_id ?? null,
          was_correct: sent?.card_id === 'VII-002' ? sent?.option_id === 'a' : sent?.option_id != null,
          result: timed
            ? 'The clock took the decision: no chains went on, and the grade was not in the pull-out yet.'
            : 'Chains on the drive wheels before the car moves.',
          debrief: timed
            ? 'A hazard card times out onto its own answer, and here that answer is "wait".'
            : 'Chains on the drive wheels, before the car moves.',
          state_delta: { noise: 0, time_cost: 0 },
        },
      }),
    });
  });
}

const STATE = `(async () => {
  const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
  const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
  const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
  const g = useGameStore.getState();
  const h = useQRHud.getState();
  const seen = (layer) => {
    const el = document.querySelector('[data-layer="' + layer + '"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { w: Math.round(r.width), h: Math.round(r.height), display: cs.display, vis: cs.visibility };
  };
  return {
    phase: g.phase,
    card: h.card, choices: h.choices ? h.choices.node.id : null, line: h.line ? h.line.node_id : null,
    debrief: h.debrief ? 'open' : null, objective: h.objective, qte: h.qte,
    missionId: QuietRoads.sim.missionId, simFrozen: QuietRoads.sim.frozen,
    node: QuietRoads.runner.currentId, scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    sticks: seen('sticks'), nav: seen('nav'),
  };
})()`;

interface Cockpit {
  phase: string;
  card: { id: string } | null;
  choices: string | null;
  line: string | null;
  debrief: string | null;
  objective: string;
  qte: unknown;
  missionId: string;
  simFrozen: boolean;
  node: string;
  scene: string | null;
  sticks: { display: string; vis: string } | null;
  nav: { display: string; vis: string } | null;
}

const read = (page: Page) => page.evaluate(STATE as unknown as () => Promise<Cockpit>) as Promise<Cockpit>;

async function startScene(page: Page, scene: string, items: string[]) {
  await page.evaluate(
    async (args) => {
      const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
      const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
      const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
      useGameStore.getState().setWorldMode('kent');
      useQRStore.setState({ sceneId: args.scene, items: args.items, runnerState: null, flags: {}, vars: {}, checkpoint: null });
      QuietRoads.start(false);
    },
    { scene, items },
  );
}

async function tap(page: Page) {
  await page.evaluate(async () => {
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    QuietRoads.tap();
  });
}

/**
 * Close the open card however this sweep says it closes.
 *
 * Options are the dock's buttons that carry an option-id span; CONTINUE carries
 * none, so a dossier card is not mistaken for a decision.
 *
 * `timeout` waits for the card's own clock to finish. That clock is the card
 * game's (`public/game/app.js:711-778`): 1 750 ms of grace with no bar on screen,
 * 800 ms with the bar on screen and full, and only then does it count — and it
 * only counts while the answers are on screen (`choiceDockInView`), which on this
 * phone means after the player scrolls the dock down to them.
 */
async function resolveCard(page: Page, id: string, closes: Sweep['closes']) {
  const options = page.locator('[data-layer="dock"] button:has(span)');
  const cont = page.getByRole('button', { name: 'CONTINUE' });
  const hasOptions = (await options.count()) > 0;
  if (closes === 'timeout' && hasOptions) {
    return expireCard(page, id);
  }
  if (hasOptions) {
    // A decision: pick the first option, then CONTINUE once the grade is back.
    await options.first().click();
    await page.waitForTimeout(1200);
  }
  // A dossier / beat card is read and continued (no options to pick).
  await cont.first().click({ timeout: 15_000 });
}

/** The clock's whole seconds, off the bar's label. */
const secondsLeft = (page: Page) =>
  page.locator('[data-clock-seconds]').innerText().then((t) => Number(t.replace(/[^0-9]/g, '')));

/** The bar's fill width in px. */
const barWidth = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-clock-fill]') as HTMLElement | null;
    return el ? Math.round(el.getBoundingClientRect().width) : -1;
  });

/**
 * The answers have to be on screen for the clock to spend anything (the card
 * game's `choiceDockInView`). On the phone the dock scrolls and a long scene puts
 * them below the fold, so scrolling to them is a player action, not a test trick.
 */
async function scrollToAnswers(page: Page) {
  await page.evaluate(() => {
    const opts = document.querySelector('[data-layer="options"]');
    if (opts) opts.scrollIntoView({ block: 'center' });
  });
}

/** The rule the clock uses, measured in the page: the answers overlap the dock. */
async function answersInView(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const dock = document.querySelector('[data-layer="dock"]')?.getBoundingClientRect();
    const opts = document.querySelector('[data-layer="options"]')?.getBoundingClientRect();
    if (!dock || !opts) return false;
    return opts.top < dock.bottom - 8 && opts.bottom > dock.top + 8;
  });
}

/**
 * The card game's clock starts when the card opens, and the walk's own polling is
 * coarser than the 1 750 ms grace — so the opening is stamped in the page. The
 * recorder also records whether the bar existed at that instant (it must not) and
 * what it read the moment it appeared (it must be full).
 */
const START_CLOCK_RECORDER = `(() => {
  const w = window;
  w.__clock = { openedAt: null, barAtOpen: null, shownAt: null, seconds: null };
  const t = setInterval(() => {
    const r = w.__clock;
    if (r.shownAt != null) { clearInterval(t); return; }
    if (r.openedAt == null && document.querySelector('[data-layer="card"]')) {
      r.openedAt = performance.now();
      r.barAtOpen = Boolean(document.querySelector('[data-layer="card-clock"]'));
    }
    if (r.openedAt != null && document.querySelector('[data-layer="card-clock"]')) {
      r.shownAt = performance.now();
      r.seconds = document.querySelector('[data-clock-seconds]')?.textContent ?? null;
      clearInterval(t);
    }
  }, 20);
})()`;

interface ClockRecording {
  openedAt: number | null;
  barAtOpen: boolean | null;
  shownAt: number | null;
  seconds: string | null;
}

/** The card's clock, not a tap: wait it out, then dismiss what it decided. */
async function expireCard(page: Page, id: string) {
  // 1) The clock the card game runs: nothing on screen at the moment the card
  //    opens, the bar arriving only after the 1 750 ms grace, at full.
  const bar = page.locator('[data-layer="card-clock"]');
  await expect(bar, `${id}: the card has a clock`).toBeVisible({ timeout: 8000 });
  const optionId = await bar.getAttribute('data-timeout-option');
  expect(optionId, `${id}: the clock names the option it will pick`).toBeTruthy();
  const opening = (await page.evaluate(() => (window as unknown as { __clock: ClockRecording }).__clock)) ?? null;
  expect(opening, `${id}: the clock recorder was armed`).not.toBeNull();
  expect(opening.openedAt, `${id}: the card opened while the recorder watched`).not.toBeNull();
  expect(opening.barAtOpen, `${id}: no clock at the moment the card opens`).toBe(false);
  expect(opening.shownAt, `${id}: the clock bar appeared`).not.toBeNull();
  const graceMs = Math.round(opening.shownAt! - opening.openedAt!);
  expect(graceMs, `${id}: the bar waits the grace before it appears (${graceMs} ms)`).toBeGreaterThanOrEqual(1600);
  expect(Number((opening.seconds ?? '').replace(/[^0-9]/g, '')), `${id}: the bar starts full`).toBeGreaterThan(0);

  // 2) Nothing is spent before the wind-up ends, and the decision starts full: the
  //    answers have to be on screen for it to count at all (the gate has its own
  //    case below, on a screen short enough to push them off).
  expect(await secondsLeft(page), `${id}: the decision starts whole`).toBe(Number((opening.seconds ?? '').replace(/[^0-9]/g, '')));
  if (!(await answersInView(page))) await scrollToAnswers(page);
  await expect.poll(() => answersInView(page), { timeout: 4000 }).toBe(true);
  const before = await barWidth(page);
  await expect.poll(() => barWidth(page), { timeout: 6000, message: `${id}: the clock moved` }).toBeLessThan(Math.max(1, before));

  // 4) ...and at zero the card answers for the player, with that option's verdict.
  const cont = page.getByRole('button', { name: 'CONTINUE' });
  await expect(cont, `${id}: CONTINUE after the clock ran out`).toBeVisible({ timeout: 25_000 });
  const dock = page.locator('[data-layer="dock"]');
  await expect(dock).toContainText('WRONG');
  await expect(dock).toContainText('The clock took the decision');
  await expect(dock).toContainText('A hazard card times out onto its own answer');
  // The clock is gone once it has resolved.
  await expect(page.locator('[data-layer="card-clock"]')).toHaveCount(0);
  await cont.click();
  await page.waitForTimeout(600);
  // The pick the clock made is the pick the story recorded — the same grading
  // path a tap takes, logged as `card:<id>:<option>`.
  const logged = await page.evaluate(async () => {
    const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
    return useQRStore.getState().choiceLog.map((c) => c.option);
  });
  expect(logged, `${id}: recorded as option ${optionId}`).toContain(`card:${id}:${optionId}`);
}

/** Tap/resolve the scene from its entry until the card's mission is running. */
async function walkToMission(page: Page, s: Sweep) {
  const before = await read(page);
  expect(before.scene, `${s.scene} started`).toBe(s.scene);
  // The clock is measured from the card opening, so the page watches for it from
  // here rather than from the (coarser) poll below.
  await page.evaluate(START_CLOCK_RECORDER);
  let sawCard = false;
  for (let step = 0; step < 40; step++) {
    const st = await read(page);
    if (st.missionId && st.missionId !== before.missionId) break;
    if (st.card) {
      // Cards that follow the target (3.1b runs V-001 → V-012 before its
      // mission) are resolved the same way.
      if (!sawCard && st.card.id !== s.card) throw new Error(`${s.scene}: expected ${s.card}, got ${st.card.id}`);
      if (st.card.id === s.card) sawCard = true;
      // Only the target card follows the sweep's close path; any card after it
      // is answered normally.
      await resolveCard(page, st.card.id, st.card.id === s.card ? s.closes : 'answered');
    } else if (st.choices) {
      // A decision before the card: take the first option, the run only needs
      // to reach the card and the mission behind it.
      await page.locator('[data-layer="dialogue"] button').first().click();
    } else {
      await tap(page);
    }
    await page.waitForTimeout(600);
  }
  expect(sawCard, `${s.scene} opened ${s.card}`).toBe(true);
  return { before, after: await read(page) };
}

/**
 * The cockpit as it stands once the mission owns the car. A world card cued by
 * the mission start (the Ribbon's, for one) can open a moment later; it is a real
 * surface, so it is closed the way a player closes it before measuring.
 */
async function settleCockpit(page: Page): Promise<Cockpit> {
  for (let i = 0; i < 24; i++) {
    const st = await read(page);
    if (st.card) {
      await resolveCard(page, st.card.id, 'answered');
      continue;
    }
    if (st.phase === 'driving' || st.phase === 'walking') return st;
    await page.waitForTimeout(500);
  }
  return read(page);
}

for (const s of SWEEP) {
  test(`${s.scene} · ${s.card} (${s.closes}) hands the car back`, async ({ page }) => {
    test.setTimeout(180_000);
    // This spec sets its own viewport (the phone); one project is enough.
    test.skip(test.info().project.name !== 'desktop', 'viewport is set inside the test');
    await mockStudent(page);
    await page.goto('/drive/');
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
    await page.waitForTimeout(1200);

    await startScene(page, s.scene, s.items);
    await page.waitForTimeout(2500);
    const { before } = await walkToMission(page, s);
    const after = await settleCockpit(page);
    // The mission is the thing the card handed to.
    expect(after.missionId, `${s.scene}: mission after ${s.card}`).not.toBe(before.missionId);
    await expectCockpitUp(page, s.scene, after);
  });
}

/** Sticks on screen, dash mounted, sim running, and the car answers the throttle. */
async function expectCockpitUp(page: Page, label: string, st: Cockpit) {
  expect(st.phase, `${label}: phase`).toBe('driving');
  expect(st.sticks, `${label}: sticks mounted`).not.toBeNull();
  expect(st.sticks!.display, `${label}: sticks display`).not.toBe('none');
  expect(st.sticks!.vis, `${label}: sticks visible`).toBe('visible');
  expect(st.nav, `${label}: nav cluster mounted`).not.toBeNull();
  expect(st.nav!.vis, `${label}: nav visible`).toBe('visible');
  expect(st.objective, `${label}: objective`).not.toBe('');
  expect(st.simFrozen, `${label}: sim running`).toBe(false);

  const pos = async () => page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().vehiclePosition;
  });
  const before = await pos();
  await page.evaluate(async () => {
    const { setStickAxes } = await import('/drive/src/input/driveInput.ts');
    setStickAxes({ steer: 0, throttle: 1, brake: 0, active: true });
  });
  await page.waitForTimeout(2200);
  const after = await pos();
  await page.evaluate(async () => {
    const { setStickAxes } = await import('/drive/src/input/driveInput.ts');
    setStickAxes({ steer: 0, throttle: 0, brake: 0, active: false });
  });
  const moved = Math.hypot(after[0] - before[0], after[2] - before[2]);
  expect(moved, `${label}: throttle moves the car`).toBeGreaterThan(0.5);
}

test('8.1 · spokane_home starts with the cockpit up (its card comes later)', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== 'desktop', 'viewport is set inside the test');
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(1200);

  await startScene(page, SCENE_WITHOUT_CARD_BEFORE_MISSION.scene, SCENE_WITHOUT_CARD_BEFORE_MISSION.items);
  await page.waitForTimeout(2500);
  for (let step = 0; step < 20; step++) {
    const st = await read(page);
    if (st.missionId === SCENE_WITHOUT_CARD_BEFORE_MISSION.mission) break;
    if (st.choices) await page.locator('[data-layer="dialogue"] button').first().click();
    else await tap(page);
    await page.waitForTimeout(600);
  }
  const after = await settleCockpit(page);
  expect(after.missionId, '8.1: mission').toBe(SCENE_WITHOUT_CARD_BEFORE_MISSION.mission);
  await expectCockpitUp(page, '8.1', after);
});

/**
 * The safety net, on the exact shape of the reported bug: a mission is running
 * and the card's own phase was left behind. Nothing about the close path is
 * simulated here — the flag is forced to the stale value, the way a path that
 * forgot to clear it would leave it. Pre-fix this is a car with no sticks and no
 * dashboard, forever; post-fix the rule keeps the HUD up and the reconcile names
 * the flag and hands the car back within a second.
 */
test('a phase left behind by a card cannot strand the cockpit', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== 'desktop', 'viewport is set inside the test');
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('[cockpit]')) warnings.push(m.text()); });
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(1200);

  const chainup: Sweep = { scene: '5.2', card: 'VII-002', items: ['chains'], closes: 'answered' };
  await startScene(page, chainup.scene, chainup.items);
  await page.waitForTimeout(2500);
  await walkToMission(page, chainup);

  // The stale flag: the card closed and the mission started, but the phase the
  // card set was never cleared.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ phase: 'card' });
  });

  // The rule keeps the sticks and the dash up immediately.
  await expect(page.locator('[data-layer="sticks"]')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('[data-layer="nav"]')).toBeVisible({ timeout: 4000 });
  // The reconcile (or the one-second watchdog) repairs the phase and says why.
  await expect.poll(async () => (await read(page)).phase, { timeout: 4000 }).toBe('driving');
  expect(warnings.join(' | '), `warnings: ${warnings.join(' | ')}`).toContain('phase="card"');

  // ...and the car drives.
  const before = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().vehiclePosition;
  });
  await page.evaluate(async () => {
    const { setStickAxes } = await import('/drive/src/input/driveInput.ts');
    setStickAxes({ steer: 0, throttle: 1, brake: 0, active: true });
  });
  await page.waitForTimeout(2000);
  const after = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().vehiclePosition;
  });
  await page.evaluate(async () => {
    const { setStickAxes } = await import('/drive/src/input/driveInput.ts');
    setStickAxes({ steer: 0, throttle: 0, brake: 0, active: false });
  });
  expect(Math.hypot(after[0] - before[0], after[2] - before[2])).toBeGreaterThan(0.5);
});

/**
 * The clock must never spend a decision the player couldn't see or act on: not
 * while the cockpit is paused, and not while the tab is in the background. That
 * is why it is a tick over running time rather than a `setTimeout`.
 */
test('the card clock waits while the cockpit is paused or the tab is hidden', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== 'desktop', 'viewport is set inside the test');
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(1200);

  await startScene(page, '5.2', ['chains']);
  await page.waitForTimeout(2500);
  // Tap to VII-002 and stop there: this test is about the clock, not the close.
  for (let i = 0; i < 20; i++) {
    const st = await read(page);
    if (st.card) break;
    await tap(page);
    await page.waitForTimeout(600);
  }
  // Past the grace, and with the answers on screen, so the clock is counting.
  await expect(page.locator('[data-layer="card-clock"]')).toBeVisible({ timeout: 8000 });
  await scrollToAnswers(page);
  await expect.poll(() => answersInView(page), { timeout: 4000 }).toBe(true);
  const setPhase = (phase: string) => page.evaluate(async (p) => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ phase: p as never });
  }, phase);

  // It runs.
  const opened = await secondsLeft(page);
  await page.waitForTimeout(2500);
  const ran = await secondsLeft(page);
  expect(ran, `clock ran: ${opened} -> ${ran}`).toBeLessThan(opened);

  // Paused cockpit: the number holds.
  await setPhase('paused');
  const pausedAt = await secondsLeft(page);
  await page.waitForTimeout(4000);
  expect(await secondsLeft(page), 'paused cockpit').toBe(pausedAt);

  // Backgrounded tab: the number holds too.
  await setPhase('card');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenAt = await secondsLeft(page);
  await page.waitForTimeout(4000);
  expect(await secondsLeft(page), 'hidden tab').toBe(hiddenAt);

  // Back in view and running: it carries on from where it was.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(2500);
  expect(await secondsLeft(page), 'resumed').toBeLessThan(hiddenAt);
});

/**
 * The answers-in-view gate, on its own: the dock scrolls, and a player reading a
 * long scene must not be charged for the reading. The card game only spends the
 * decision while its choice dock is on screen (`choiceDockInView`), and the
 * cockpit now does the same — so scrolling away from the answers stops the clock
 * dead, and scrolling back resumes it where it was.
 *
 * A shorter screen than the reported phone is deliberate: the point is a dock
 * where the answers start below the fold, which is what the gate is for.
 */
test('the card clock holds while the answers are scrolled out of view', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name !== 'desktop', 'viewport is set inside the test');
  await page.setViewportSize({ width: 390, height: 560 });
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(1200);

  await startScene(page, '5.2', ['chains']);
  await page.waitForTimeout(2500);
  for (let i = 0; i < 20; i++) {
    const st = await read(page);
    if (st.card) break;
    await tap(page);
    await page.waitForTimeout(600);
  }
  // Past the grace, bar up, and the answers still below the fold.
  await expect(page.locator('[data-layer="card-clock"]')).toBeVisible({ timeout: 8000 });
  expect(await answersInView(page), 'the answers start below the fold').toBe(false);
  const offScreenAt = await secondsLeft(page);
  await page.waitForTimeout(3500);
  expect(await secondsLeft(page), 'the clock holds while the answers are off screen').toBe(offScreenAt);

  // Scrolled to them: it counts.
  await scrollToAnswers(page);
  await expect.poll(() => answersInView(page), { timeout: 4000 }).toBe(true);
  const onScreenAt = await secondsLeft(page);
  expect(onScreenAt, 'nothing was spent off screen').toBe(offScreenAt);
  await page.waitForTimeout(2500);
  const ran = await secondsLeft(page);
  expect(ran, `clock ran with the answers on screen: ${onScreenAt} -> ${ran}`).toBeLessThan(onScreenAt);

  // Back up to the scene: the answers leave the dock, and it holds again.
  await page.evaluate(() => {
    const dock = document.querySelector('[data-layer="dock"]') as HTMLElement | null;
    if (dock) dock.scrollTop = 0;
  });
  await expect.poll(() => answersInView(page), { timeout: 4000 }).toBe(false);
  const heldAt = await secondsLeft(page);
  await page.waitForTimeout(3500);
  expect(await secondsLeft(page), 'the clock holds again').toBe(heldAt);
});
