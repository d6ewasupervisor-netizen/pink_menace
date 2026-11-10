/**
 * ?tier= — the override actually changes the renderer.
 *
 * Item 2.1 gives the player a way to say which tier to run, and it is only real if
 * the canvas changes with it: the tier owns the pixel ratio, so a low tier must
 * fill no more than 1.25 device pixels per CSS pixel and a high tier no more than
 * 1.5. The GPU string the picker reads cannot be faked in a browser, but the
 * override — the part a bug report uses — can be measured directly.
 */
import { test, expect, type Page } from '@playwright/test';
import { duplicateViewportReason } from './skipDuplicate';

test.use({ headless: true, hasTouch: true });

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'tier-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

const bufferRatio = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    return c && c.clientWidth > 0 ? c.width / c.clientWidth : 0;
  });

const readTier = (page: Page) =>
  page.evaluate(async () => {
    const { diag } = await import('/drive/src/systems/diagnostics.ts');
    return diag.tier;
  });

for (const [name, tier, ceiling] of [
  ['low', 'low', 1.25],
  ['high', 'high', 1.5],
] as const) {
  test(`?tier=${name} caps the pixel ratio at ${ceiling}`, async ({ page }) => {
    const skip = duplicateViewportReason(test.info().project.use?.viewport ?? null, { width: 390, height: 844 });
    test.skip(skip !== null, skip ?? '');
    test.setTimeout(120_000);
    await mockStudent(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/drive/?tier=${tier}`);
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
    await page.evaluate(async () => {
      const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
      const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
      useGameStore.setState({ worldMode: 'kent', phase: 'driving' });
      useQRHud.getState().setTransient({ missionActive: true, objective: 'hold the lane' });
    });
    // One frame of the diagnostics is enough: it copies the live tier every frame.
    await page.waitForTimeout(1500);
    expect(await readTier(page)).toBe(tier);
    expect(await bufferRatio(page)).toBeLessThanOrEqual(ceiling + 0.01);
    await expect(page.locator('canvas').first()).toBeVisible();
  });
}
