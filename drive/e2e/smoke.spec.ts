/**
 * Smoke test: /drive loads, a signed-in student is accepted, and the 3D surface
 * mounts without redirecting back to the card game.
 *
 * A deeper "drives the scripted replay" e2e is covered deterministically by
 * bench/sim-bench.test.ts (graders) — the browser replay is a follow-up.
 */
import { test, expect } from '@playwright/test';

/** Mock the two drive-only endpoints the shell calls before rendering. */
async function mockStudent(page: import('@playwright/test').Page) {
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        signedIn: true,
        kind: 'game',
        person: { id: 'student-smoke-1', role: 'student', name: 'Ali', last4: null },
      }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
  // Anything else under /api that the shell might reach → 404, never the proxy.
  await page.route('**/api/**', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
}

test('loads /drive and mounts the WebGL surface as a signed-in student', async ({ page }) => {
  await mockStudent(page);
  await page.goto('/drive/');
  // The drive never shows a login: it must stay on /drive and mount a <canvas>.
  await expect(page).toHaveURL(/\/drive\//);
  const canvas = page.locator('canvas');
  await expect(canvas.first()).toBeVisible({ timeout: 45_000 });
  // The title surface (menu or first scene) renders inside the shell.
  await expect(page.locator('#game-touch-area').first()).toBeVisible();
});