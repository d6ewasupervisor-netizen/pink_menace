/**
 * Phase 6: the text-size row actually changes the type (AUDIT §34.5).
 *
 * Phase 5 mounted `TOKEN_CSS`, which made the cockpit's *type scale* real
 * (`--qr-type-*`). The *player's* scale is a different variable, `--qr-text-scale`,
 * which every overlay reads as `calc(… * var(--qr-text-scale, 1))`. The audit left
 * one question open — the row wrote the store value and no test had ever seen the
 * DOM change — so this spec answers it the way a player would:
 *
 *   1. measure a cockpit glyph before the row is touched (the scale is 1);
 *   2. press the pause button, open SETTINGS, press TEXT SIZE until it says Largest;
 *   3. resume and measure the same glyph again;
 *   4. and measure a probe appended to `<body>`, *outside* the `.ui-layer` subtree
 *      the variable used to be scoped to.
 *
 * A store-only test cannot tell whether anything was listening, and a computed style
 * read cannot tell whether the row was the thing that wrote it, so both ends are
 * measured through the row itself. Step 4 is the one the audit was really about: the
 * value used to be an inline style on `.ui-layer`, so everything inside it scaled and
 * everything outside it did not. The write now lands on the document root, beside
 * `data-reduced-motion`, and with the old writer this step fails while step 3 passes —
 * which is the distinction the spec exists to keep.
 *
 * Standard is pinned as the exact base size, not "smaller than Largest", so a missing
 * variable (the state before the token sheet was mounted) cannot pass as "it grew a
 * bit".
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

/** The cockpit's own base glyph: `calc(16px * var(--qr-text-scale, 1))`. */
const BASE_PX = 16;

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'text-size-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

/**
 * A driving cockpit with nothing open. The cold open's own line is cleared as well
 * as the phase, because a line is a compound surface: `showDrivingHud` stands the
 * whole cockpit (and the pause control with it) down while one is on screen.
 */
async function boot(page: Page) {
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    useGameStore.setState({ worldMode: 'kent', phase: 'driving', controlsScheme: 'dual-steer-left', textSize: 0 });
    useQRHud.getState().setTransient({
      objective: 'Keep it under the limit through town.',
      toast: '',
      line: null,
      choices: null,
      card: null,
      qte: null,
      qteActive: false,
      debrief: null,
      windAssist: null,
      gust: null,
      handsOff: null,
    });
  });
  await expect(page.locator('[data-layer="pause"]'), 'the rail is up while driving').toBeVisible();
}

/** The pause control's font size is `calc(16px * var(--qr-text-scale, 1))`. */
async function pauseGlyphPx(page: Page) {
  const size = await page.locator('[data-layer="pause"]').evaluate((el) => getComputedStyle(el).fontSize);
  return Number.parseFloat(size);
}

/** A probe outside `.ui-layer`: the document root is what has to carry the scale. */
async function bodyProbePx(page: Page) {
  return page.evaluate(() => {
    const d = document.createElement('div');
    d.style.position = 'fixed';
    d.style.fontSize = 'calc(16px * var(--qr-text-scale, 1))';
    document.body.appendChild(d);
    const px = Number.parseFloat(getComputedStyle(d).fontSize);
    d.remove();
    return px;
  });
}

/** Pause → SETTINGS → press TEXT SIZE once. Leaves the panel open. */
async function pressTextSize(page: Page) {
  await page.locator('[data-layer="pause"]').click();
  await page.locator('[data-settings-open]').click();
  const row = page.getByRole('button', { name: /Standard|Large|Largest/ });
  await expect(row, 'the text-size row reads the stored step').toBeVisible();
  await row.click();
  return row;
}

/** DONE → RESUME: the rail (and the control being measured) comes back. */
async function resume(page: Page) {
  await page.getByRole('button', { name: 'DONE' }).click();
  await page.getByRole('button', { name: /RESUME/ }).click();
  await expect(page.locator('[data-layer="pause"]')).toBeVisible();
}

test('the text-size row grows the cockpit type, and Standard is the base size', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page);

  // 1. Standard. The base size is the promise: 16 px, not 16 px "times something".
  expect(await pauseGlyphPx(page), 'Standard is the token sheet’s own 16 px').toBeCloseTo(BASE_PX, 1);
  expect(await bodyProbePx(page), 'and the document carries the scale').toBeCloseTo(BASE_PX, 1);

  // 2. The row, through the player's path: pause → SETTINGS → TEXT SIZE ×2.
  const row = await pressTextSize(page);
  await expect(row).toHaveText(/Large/);
  await row.click();
  await expect(row, 'the row shows the step it wrote').toHaveText(/Largest/);

  const stored = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().textSize;
  });
  expect(stored, 'the row wrote the store').toBe(2);

  // 3. The DOM followed: 16 px × 1.3 = 20.8 px, on the real control and on the probe.
  await resume(page);
  expect(await pauseGlyphPx(page), 'Largest is 1.3 × the base size').toBeCloseTo(BASE_PX * 1.3, 1);
  expect(await bodyProbePx(page), 'a surface outside the overlay layer scales too').toBeCloseTo(BASE_PX * 1.3, 1);

  // 4. And back to Standard, so the row is a cycle and not a one-way door.
  await pressTextSize(page); // Largest → Standard
  await resume(page);
  expect(await pauseGlyphPx(page), 'the cycle returns to the base size').toBeCloseTo(BASE_PX, 1);
});
