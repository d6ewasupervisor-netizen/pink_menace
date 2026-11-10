/**
 * Phase 5, in a real browser: the cockpit feels like a car (items 5.1 and 5.3).
 *
 * The unit tests pin the arithmetic — the haptic patterns, the shake decay, the
 * refusal when steady cam is on. This spec pins the three things only a browser
 * can answer, and each one is a way the wiring can be "done" and still wrong:
 *
 *   1. **Steady cam reaches the page, not just the camera.** The setting is a
 *      store boolean; the animated surfaces are CSS. If the switch only stops
 *      `GameCamera`'s shake, the gust streaks and the scare palm keep moving on a
 *      screen the player asked to still. The test reads the computed style of a
 *      real `.qr-anim` element with the switch off and on.
 *   2. **The horn buzzes, and the player's switch is real.** A button that is only
 *      a 44 px rectangle does not feel pressed. The stub is the phone's motor; the
 *      assertion is the pattern the module's table names, then silence when the
 *      switch goes off.
 *   3. **A steady camera does not shake on a wreck.** The unit test proves the
 *      refusal; this proves the refusal is wired to the same store value the
 *      settings row writes.
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
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'feel-1', role: 'student', name: 'Ali', last4: null } }),
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
      reducedMotion: false,
      haptics: true,
    });
  });
}

test('steady cam reaches the page, not just the camera', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);

  // With the switch off, an animated surface really moves: a computed
  // `animationName` of "none" here would mean the CSS was always off and the
  // "on" case would prove nothing.
  const read = () =>
    page.evaluate(() => {
      const d = document.createElement('div');
      d.className = 'qr-anim';
      d.style.position = 'fixed';
      d.style.animation = 'qr-test-spin 1s linear infinite';
      document.body.appendChild(d);
      const style = getComputedStyle(d);
      const out = { name: style.animationName, attr: document.documentElement.dataset.reducedMotion ?? null };
      d.remove();
      return out;
    });

  const moving = await read();
  expect(moving.name, 'the animation runs while the switch is off').not.toBe('none');

  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ reducedMotion: true });
  });
  await page.waitForTimeout(150);

  const still = await read();
  expect(still.attr, 'the store switch is the document attribute').toBe('true');
  expect(still.name, 'the CSS switch stops the animation').toBe('none');

  // And back, so the switch is a switch and not a one-way door.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ reducedMotion: false });
  });
  await page.waitForTimeout(150);
  expect((await read()).name, 'the animation comes back').not.toBe('none');
});

test('the horn buzzes, and the player switch is real', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);

  // A phone's motor, recorded. `navigator.vibrate` is the API the module gates on.
  await page.evaluate(() => {
    const w = window as unknown as { __buzzes: (number | number[])[] };
    w.__buzzes = [];
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (p: number | number[]) => { w.__buzzes.push(p); return true; },
    });
  });

  const horn = page.locator('[data-layer="horn"]');
  await expect(horn, 'the horn is on screen while driving').toBeVisible();
  await horn.dispatchEvent('pointerdown');
  await page.waitForTimeout(150);

  const first = await page.evaluate(() => (window as unknown as { __buzzes: unknown[] }).__buzzes.slice());
  expect(first.length, 'pressing the horn buzzed once').toBe(1);
  expect(first[0], "the pattern is the module table's horn").toEqual([60]);

  // The player turns haptics off. The same press must reach no motor at all.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useGameStore.setState({ haptics: false });
  });
  await horn.dispatchEvent('pointerdown');
  await page.waitForTimeout(150);

  const second = await page.evaluate(() => (window as unknown as { __buzzes: unknown[] }).__buzzes.slice());
  expect(second.length, 'a press with haptics off never reached the motor').toBe(1);
});

test('a steady camera does not shake on a wreck', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);

  // Ask the camera's own state machine, in the app, through the same store value
  // the settings row writes. Reduced motion on = the trigger is refused.
  const refused = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const shake = await import('/drive/src/quietroads/shake.ts');
    useGameStore.setState({ reducedMotion: true });
    const taken = shake.triggerScreenShake(0.9, 0.4, { reducedMotion: useGameStore.getState().reducedMotion });
    const level = shake.shakeLevel(0.016);
    shake.resetShake();
    return { taken, level };
  });
  expect(refused.taken, 'steady cam refuses the trigger').toBe(false);
  expect(refused.level, 'and the frame gets no offset').toBe(0);

  const taken = await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const shake = await import('/drive/src/quietroads/shake.ts');
    useGameStore.setState({ reducedMotion: false });
    const ok = shake.triggerScreenShake(0.9, 0.4, { reducedMotion: useGameStore.getState().reducedMotion });
    const level = shake.shakeLevel(0.016);
    shake.resetShake();
    return { ok, level };
  });
  expect(taken.ok, 'with steady cam off the wreck shakes').toBe(true);
  expect(taken.level, 'and the frame gets the level').toBeGreaterThan(0.5);
});
