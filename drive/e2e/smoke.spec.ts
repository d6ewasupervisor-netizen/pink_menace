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

/**
 * The texture the world renders with has to be a texture.
 *
 * The original bug was invisible in the network tab: every GLB asked for
 * `Textures/colormap.png`, the file did not exist, the SPA fallback answered
 * `index.html` with a 200, and the image quietly failed to decode. The guard in
 * `test/model-textures.test.ts` holds the files; this holds the wire — a 200
 * with HTML in it is not a texture, and a 404 is not a texture either.
 */
test('serves the kits own colormaps, never index.html', async ({ page }) => {
  test.setTimeout(90_000);
  await mockStudent(page);
  const seen = new Map<string, { status: number; type: string; bytes: number }>();
  page.on('response', (res) => {
    const clean = res.url().split('?')[0];
    if (!/\/models\/[^/]+\/Textures\/colormap\.png$/.test(clean)) return;
    const headers = res.headers();
    seen.set(clean, {
      status: res.status(),
      type: headers['content-type'] ?? '',
      bytes: Number(headers['content-length'] ?? 0),
    });
  });

  await page.goto('/drive/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 45_000 });
  // The highway world's modules are LAZY since item 2.3: nothing loads its 15 GLBs —
  // or the colormaps they reference — until something renders that world, and Quiet
  // Roads drives `kent`. So this asks for the highway world on purpose. It also proves
  // the split resolves: a broken lazy boundary would request no model at all, and the
  // poll below would time out instead of passing quietly.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.getState().setWorldMode('highway');
  });
  await expect.poll(() => seen.size, { timeout: 30_000, message: 'the world asked for its colormaps' }).toBeGreaterThanOrEqual(2);

  // A texture is a PNG with a PNG's length; the fallback was `text/html` at the
  // length of index.html, which is why the network tab looked healthy.
  const bad = [...seen.entries()]
    .filter(([, r]) => r.status !== 200 || !r.type.includes('png') || r.bytes < 2000)
    .map(([url, r]) => `${url} -> ${r.status} ${r.type} ${r.bytes} B`);
  expect(bad, 'every colormap served is a real PNG').toEqual([]);

  // ...and the bytes on the wire really are a PNG, read the way the decoder reads it.
  const heads = await page.evaluate(async (urls) => {
    const out: Record<string, string> = {};
    for (const url of urls) {
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      out[url] = [...buf.subarray(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return out;
  }, [...seen.keys()]);
  expect(Object.values(heads).filter((h) => h !== '89504e470d0a1a0a'), 'every body is a PNG').toEqual([]);
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