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
  // Last registered route wins, so the catch-all goes on first.
  await page.route('**/api/**', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
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

test('profileDrive records first frame, fps, and 1% low', async ({ page }) => {
  test.setTimeout(90_000);
  await mockStudent(page);
  const started = Date.now();
  await page.goto('/drive/?profileDrive');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 45_000 });
  const canvasMs = Date.now() - started;
  // Fill the 600-frame window so the boot hitch rolls off the 1% low.
  await page.waitForFunction(() => {
    const read = (window as unknown as { __drivePerf?: () => { frameMs?: { count: number } } }).__drivePerf;
    return (read?.().frameMs?.count ?? 0) >= 600;
  }, null, { timeout: 45_000 });
  const perf = await page.evaluate(() => {
    const read = (window as unknown as { __drivePerf?: () => Record<string, unknown> }).__drivePerf;
    return read ? read() : null;
  });
  expect(perf).toBeTruthy();
  const frame = perf?.frameMs as { count: number; p50: number; p99: number };
  expect(frame.count).toBeGreaterThan(10);
  console.log(JSON.stringify({ canvasMs, firstFrameMs: perf?.firstFrameMs, fps: perf?.fps, onePctLowFps: perf?.onePctLowFps, frame, draw: perf?.previousDrawCalls, tris: perf?.previousTriangles }));
});