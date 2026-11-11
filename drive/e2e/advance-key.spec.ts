/**
 * On a keyboard, the handbrake key (Space) advances the pop-up that is up, so a
 * player never has to leave the keys for the mouse mid-drive.
 *
 * 1.2 covers the three dialogue states in one walk: its opening lines are a
 * cutscene, I-005 is a dossier card (CONTINUE only), and after `1.2.go` the car
 * is driving, where a line is held on screen until it is dismissed
 * (`holdForSteer` in DialogueBox — the case that sent players to the mouse).
 * 6.3's VII-006 is the graded card: answered with the mouse, left with Space.
 */
import { test, expect, type Page } from '@playwright/test';
import { duplicateViewportReason } from './skipDuplicate';

const VIEWPORT = { width: 1280, height: 720 };
test.use({ headless: true, hasTouch: false, viewport: VIEWPORT });

test.beforeEach(() => {
  const skip = duplicateViewportReason(test.info().project.use?.viewport ?? null, VIEWPORT);
  test.skip(skip !== null, skip ?? '');
});

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'space-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
  await page.route('**/api/drive/card-answers', async (route) => {
    const sent = route.request().postDataJSON() as { card_id?: string; option_id?: string | null };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        graded: {
          card_id: sent?.card_id ?? '',
          option_id: sent?.option_id ?? null,
          was_correct: sent?.option_id != null,
          result: 'Graded.',
          debrief: 'Graded.',
          state_delta: { noise: 0, time_cost: 0 },
        },
      }),
    });
  });
}

type State = { phase: string; card: string | null; line: string | null; choices: boolean; scene: string | null };

const read = (page: Page) =>
  page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    const h = useQRHud.getState();
    return {
      phase: useGameStore.getState().phase,
      card: h.card ? h.card.id : null,
      line: h.line ? h.line.node_id : null,
      choices: Boolean(h.choices),
      scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    } as State;
  });

async function boot(page: Page, scene: string, items: string[] = []) {
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
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
  await expect.poll(async () => (await read(page)).scene, { timeout: 30_000 }).toBe(scene);
}

test('Space walks 1.2: cutscene lines, the I-005 dossier, then a line held while driving', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page, '1.2');

  // The cutscene lines, one press each, until the card is up.
  const lines: string[] = [];
  for (let i = 0; i < 8; i++) {
    const s = await read(page);
    if (s.card) break;
    if (s.line) {
      lines.push(s.line);
      await page.keyboard.press('Space');
      // The last line stays in the HUD while the card it hands to is up.
      await expect
        .poll(async () => { const n = await read(page); return n.card !== null || n.line !== s.line; }, { timeout: 5_000 })
        .toBe(true);
    } else {
      await page.waitForTimeout(250);
    }
  }
  expect(lines.slice(0, 3)).toEqual(['1.2.1', '1.2.2', '1.2.3']);
  await expect.poll(async () => (await read(page)).card, { timeout: 10_000 }).toBe('I-005');

  // The dossier has only CONTINUE: Space takes it.
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect.poll(async () => (await read(page)).card, { timeout: 10_000 }).toBeNull();

  // Past 1.2.4 and into the park.
  await expect.poll(async () => (await read(page)).line, { timeout: 10_000 }).toBe('1.2.4');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await read(page)).phase, { timeout: 15_000 }).toBe('driving');

  // A clean park while driving: the line is held until dismissed — Space dismisses it.
  await page.evaluate(async () => {
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    QuietRoads.runner.onEvent('park.clean');
  });
  await expect.poll(async () => (await read(page)).line, { timeout: 5_000 }).toBe('1.2.5');
  expect((await read(page)).phase).toBe('driving');
  await page.waitForTimeout(800);
  expect((await read(page)).line, 'a driving line does not leave on its own').toBe('1.2.5');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await read(page)).scene, { timeout: 15_000 }).toBe('1.3');
});

test('Space leaves a graded card once it has a verdict, and never picks an answer', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page, '6.3', ['chains']);

  for (let i = 0; i < 12 && !(await read(page)).card; i++) {
    const s = await read(page);
    if (s.line) await page.keyboard.press('Space');
    await page.waitForTimeout(400);
  }
  await expect.poll(async () => (await read(page)).card, { timeout: 15_000 }).toBe('VII-006');

  // Unanswered: Space does nothing to a decision.
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  expect((await read(page)).card).toBe('VII-006');
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toHaveCount(0);

  await page.locator('[data-layer="dock"] button:has(span)').first().click();
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Space');
  await expect.poll(async () => (await read(page)).card, { timeout: 10_000 }).toBeNull();
});
