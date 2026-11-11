/**
 * ITEM 6.2 — every scene in the campaign, opened on a phone, in one sweep.
 *
 * The rebuild removed UI layers (the minimap, the clock, the HP/FUEL bars, the old
 * nav cluster) and replaced the settings surface, the HUD's own stylesheet and the
 * cockpit's geometry. `fullchain.test.ts` proves the *story* still walks; it cannot
 * see a scene whose only surface was one of the layers that left. This sweep opens
 * each scene the campaign can enter and asks the three questions a broken surface
 * would answer badly:
 *
 *   1. **The scene is the one that was asked for** — the act file loaded, the router
 *      resolved the id, and nothing bounced the player somewhere else.
 *   2. **Something the player reads is on screen** — a line, a card, the world HUD,
 *      the shop, the stranded prompt. A scene that renders nothing is the regression
 *      this pass is most likely to have caused.
 *   3. **Nothing threw.** A shader that fails to compile and an uncaught exception are
 *      the two ways a scene can be "open" and unusable.
 *
 * The sweep records what each scene actually put on screen (`SWEEP` in the test
 * output), so the AFTER record quotes a measurement rather than the intention.
 *
 * It runs at 390×844 and skips the project that already is that viewport
 * (`skipDuplicate`), so the gate pays for it once.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { duplicateViewportReason, type Viewport } from './skipDuplicate';

/** Every scene the campaign can enter, in play order (4.3 is the retest week). */
export const SWEPT = [
  '0.1', '0.2', '0.3', '1.1', '1.2', '1.3', '1.4', '1.4b',
  '2.1', '2.2', '2.3a', '2.3b', '2.3c', '2.3d', '2.4', '2.5',
  '3.1', '3.1b', '3.2', '3.3', '3.4', '3.4a', '3.5',
  '4.1', '4.2', '4.3', '6.1b', '5.1', '5.2', '5.3',
  '6.1', '6.2', '6.3', '7.1', '7.2', '7.3', '8.1', '8.2', '8.3',
] as const;

const VIEWPORT: Viewport = { width: 390, height: 844 };

/** The surfaces a scene can legitimately open on. */
const SURFACES = ['dialogue', 'card', 'hud', 'world-hud', 'shop', 'stranded', 'credits', 'hands-off', 'qte'] as const;

test.use({ headless: true, hasTouch: true, viewport: VIEWPORT });

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'sweep-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

/** What the runner and the DOM say right now. */
async function readState(page: Page) {
  return page.evaluate(async (surfaces) => {
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const onScreen = (layer: string) => {
      const el = document.querySelector(`[data-layer="${layer}"]`);
      if (!el) return false;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };
    return {
      scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
      phase: useGameStore.getState().phase,
      visible: surfaces.filter(onScreen),
      // The HUD root is mounted for every scene, so it proves nothing on its own;
      // the rail is the part that only exists while a mission owns the car.
      rail: onScreen('rail'),
    };
  }, SURFACES as unknown as string[]);
}

/** A fresh page per scene: a resumed campaign must not decide what the next scene is. */
async function openScene(page: Page, scene: string) {
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.evaluate(async (id) => {
    const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
    QuietRoads.startAct(id);
  }, scene);

  const started = Date.now();
  let state = await readState(page);
  while (Date.now() - started < 40_000) {
    if (state.scene === scene) return state;
    await page.waitForTimeout(250);
    state = await readState(page);
  }
  return state;
}

test('every scene opens on a surface the player can read', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const skip = duplicateViewportReason(test.info().project.use?.viewport ?? null, VIEWPORT);
  test.skip(skip !== null, skip ?? '');

  // A resumed campaign must not decide what the next scene is, so every navigation
  // starts from empty storage.
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* storage can be denied; the scene check below still holds */
    }
  });
  await mockStudent(page);

  const faults: string[] = [];
  page.on('pageerror', (err) => faults.push(`uncaught: ${err.message.slice(0, 160)}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /Shader Error|not compiled|LINK_STATUS/.test(m.text())) {
      faults.push(`shader: ${m.text().slice(0, 160)}`);
    }
  });

  const swept: string[] = [];
  for (const scene of SWEPT) {
    faults.length = 0;
    const state = await openScene(page, scene);

    expect(state.scene, `${scene}: the scene that started`).toBe(scene);
    expect(state.phase, `${scene}: the drive is not the menu`).not.toBe('menu');
    // A story surface (a line, a card, a counter, a stranded prompt) or a running
    // mission's rail. The bare HUD root is not enough: it is mounted in every scene.
    const readable = state.visible.filter((layer) => layer !== 'hud' && layer !== 'world-hud');
    expect(
      readable.length > 0 || state.rail,
      `${scene}: a surface the player can read is on screen (${state.visible.join(', ') || 'none'}; rail ${state.rail})`,
    ).toBe(true);
    expect(faults, `${scene}: nothing threw while it opened`).toEqual([]);

    swept.push(`${scene} [${state.visible.join('+')}${state.rail ? '+rail' : ''}] ${state.phase}`);
  }

  // The record: one line per scene, in the run's own output dir (`test-results/`,
  // which the runner owns and `.gitignore` covers), so the AFTER note quotes the
  // sweep itself rather than its headline.
  const record = path.resolve(process.cwd(), 'test-results', 'scene-sweep.txt');
  fs.mkdirSync(path.dirname(record), { recursive: true });
  fs.writeFileSync(record, `${swept.length} scenes\n${swept.join('\n')}\n`, 'utf8');
  test.info().annotations.push({ type: 'SWEEP', description: swept.join(' · ') });
});
