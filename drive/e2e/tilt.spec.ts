/**
 * Phase 4, in a real browser: the settings panel a player can reach, and the
 * phone's roll actually steering the car.
 *
 * The unit tests pin the maths and the merge. This pins the two things only a
 * browser can answer:
 *
 *   1. **Is there a settings panel, and does it write the store?** Open the pause
 *      menu, open settings, move the sensitivity slider and press TILT, then read
 *      the store. A panel whose rows are not wired is a screenshot, not a feature.
 *   2. **Does a `deviceorientation` event reach the wheels?** Synthetic events
 *      with real gamma/beta values are dispatched at the window; the assertion is
 *      the drive's own `steering`, not the panel's label. A phone laid flat must
 *      steer nothing, a calibrated angle must be straight, and a key must beat it.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STILL = path.resolve(process.cwd(), '..', 'cards', 'II-019.png');

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/drive/image/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(STILL) }),
  );
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'tilt-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

async function boot(page: Page) {
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({
      worldMode: 'kent',
      phase: 'driving',
      controlsScheme: 'dual-steer-left',
      steeringSensitivity: 1,
      tiltSteering: false,
      tiltInvert: false,
      tiltNeutral: { roll: 0, pitch: 0 },
    });
  });
}

/** One synthetic reading, in the device's own units. */
async function tilt(page: Page, gamma: number, beta = 0) {
  await page.evaluate(({ gamma: gam, beta: bet }) => {
    const e = new Event('deviceorientation') as DeviceOrientationEvent;
    Object.defineProperty(e, 'gamma', { value: gam });
    Object.defineProperty(e, 'beta', { value: bet });
    window.dispatchEvent(e);
  }, { gamma, beta });
}

/** The drive's own steering, after the 16 ms pad poll has merged it. */
async function steering(page: Page) {
  await page.waitForTimeout(120);
  return page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().steering;
  });
}

test('the settings panel opens from the pause menu and writes the store', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);

  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ phase: 'paused', prePausePhase: 'driving' });
  });
  const open = page.locator('[data-settings-open]');
  await expect(open, 'the pause menu offers settings').toBeVisible();
  await open.click();
  await expect(page.locator('[data-settings]'), 'the panel is up').toBeVisible();

  // Every section a player would look for.
  for (const label of ['SOUND', 'STEERING', 'ACCESSIBILITY', 'KEYS']) {
    await expect(
      page.locator(`[data-settings] [role="group"][aria-label="${label}"]`),
      label,
    ).toBeVisible();
  }

  // The sensitivity slider writes the store (not just its own label).
  const slider = page.locator('[data-settings] input[type="range"]').nth(2);
  await expect(slider, 'the sensitivity slider exists').toBeVisible();
  await slider.fill('150');
  const sensitivity = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().steeringSensitivity;
  });
  expect(sensitivity, 'the slider wrote 1.5').toBeCloseTo(1.5, 5);

  // TILT asks the device and then writes the store. Chromium desktop has no
  // requestPermission, which counts as granted.
  const tiltToggle = page.locator('[data-tilt-toggle]');
  await expect(tiltToggle).toHaveText('OFF');
  await tiltToggle.click();
  await expect(tiltToggle, 'tilt is on').toHaveText('ON');
  const on = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    return useGameStore.getState().tiltSteering;
  });
  expect(on, 'the toggle wrote the store').toBe(true);

  // SET STRAIGHT only appears while tilt is on, and refuses with no reading.
  const calibrate = page.locator('[data-tilt-calibrate]');
  await expect(calibrate).toBeVisible();
  await calibrate.click();
  await expect(page.locator('[data-tilt-note]')).toContainText('hold the phone');
});

test('the phone leaning steers the car, and a flat phone does not', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);

  // No listener is attached until the setting is on: a synthetic reading now must
  // change nothing at all.
  await tilt(page, 20);
  expect(await steering(page), 'tilt off: the reading is ignored').toBe(0);

  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ tiltSteering: true });
  });
  // The listener is attached by an effect, i.e. after React's next render. Without
  // this the very first synthetic reading lands before there is anything to hear
  // it — a test race, not a game one.
  await page.waitForTimeout(250);

  await tilt(page, 15);
  const right = await steering(page);
  expect(right, 'leaning right steers right').toBeGreaterThan(0.35);
  expect(right, 'and not past the axis').toBeLessThanOrEqual(1);

  await tilt(page, -15);
  expect(await steering(page), 'leaning left steers left').toBeLessThan(-0.35);

  // A phone on the table is not a wheel: no tilt opinion, so the car goes straight.
  await tilt(page, 15, 70);
  expect(await steering(page), 'a phone lying down steers nothing').toBe(0);

  // Full lock past 30°, and it cannot go further.
  await tilt(page, 60);
  expect(await steering(page), 'past full lock is still full lock').toBeCloseTo(1, 5);

  // The calibration: whatever angle is declared straight reads as straight.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const { noteTiltReading } = await import('/drive/src/input/tiltSteering.ts');
    noteTiltReading({ roll: 15, pitch: 0 });
    useGameStore.getState().calibrateTilt();
  });
  await tilt(page, 15);
  expect(await steering(page), 'the calibrated angle is straight').toBe(0);
  await tilt(page, 35);
  expect(await steering(page), '20° past the calibration steers').toBeGreaterThan(0.4);

  // A key is a clearer intent than a wrist: it wins, and the tilt returns when the
  // key is released.
  await page.keyboard.down('ArrowLeft');
  expect(await steering(page), 'the key beats the tilt').toBe(-1);
  await page.keyboard.up('ArrowLeft');
  expect(await steering(page), 'the tilt is back after the key').toBeGreaterThan(0.4);
});

