/**
 * ITEM 6.6 — what the client does when the save API is down, asserted instead of
 * inferred from a log.
 *
 * The suite used to run with nothing on the proxy's target port and stayed green:
 * `DriveSync` catches every failure, keeps the local save as the working copy and
 * retries on the next change. That is the right behaviour — but "the log was full
 * of ECONNREFUSED and nothing failed" is not a test, and a dead backend could have
 * been hiding a real regression (a boot that waits on hydration, a scene that never
 * starts, an unhandled rejection from the telemetry uploader).
 *
 * So this spec refuses every `/api/drive/**` call on purpose and asserts the three
 * things a player would notice: the drive boots to the scene it was asked for, the
 * cockpit is up, and the run is saved locally even though every PUT failed.
 * `/api/me` stays answered, because the *page* needs auth to boot at all — this is
 * about the save/telemetry path, not about being signed out.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

async function mockAuthOnly(page: Page) {
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'offline-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
}

test('with the save API down the drive still runs on its local save', async ({ page }) => {
  test.setTimeout(180_000);
  await mockAuthOnly(page);
  // Everything the drive persists, posts or grades is refused: this is the dead
  // backend the old logs were full of, made deliberate.
  await page.route('**/api/drive/**', (route) => route.abort());

  const uncaught: string[] = [];
  page.on('pageerror', (err) => uncaught.push(err.message.slice(0, 200)));

  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.evaluate(async () => {
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    QuietRoads.startAct('6.3');
  });

  // The scene must start without a round-trip: hydration is best-effort.
  const readScene = () =>
    page.evaluate(async () => {
      const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
      return QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null;
    });
  let scene: string | null = null;
  const started = Date.now();
  while (Date.now() - started < 40_000) {
    scene = await readScene();
    if (scene === '6.3') break;
    await page.waitForTimeout(250);
  }
  expect(scene, 'a refused hydration does not stop the scene').toBe('6.3');
  await expect(page.locator('[data-layer="hud"]'), 'the cockpit is up').toBeVisible();

  // The local save is the working copy: zustand's persist wrote it, no server needed.
  const saved = await page.evaluate(() => localStorage.getItem('quiet-roads-save'));
  expect(saved, 'the run is saved locally even though every PUT failed').toBeTruthy();
  const persisted = JSON.parse(saved as string) as { state?: { sceneId?: string | null } };
  expect(persisted.state?.sceneId, 'the local save names the scene the player is in').toBe('6.3');

  expect(uncaught, 'a refused fetch is not an uncaught exception').toEqual([]);
});
