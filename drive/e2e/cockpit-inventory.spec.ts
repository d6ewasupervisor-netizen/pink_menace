/**
 * cockpit inventory — the measured BEFORE record of the driving cockpit.
 *
 * Why a separate pass: "the HUD covers half the screen and the sticks own the
 * other quarter" is a claim until it is a number, and every later phase is judged
 * against this one. The pass boots /drive with the mock student the other specs
 * use, puts the game in the state a phone is in when it matters (a mission
 * running, an objective, the bridge's assist and a gust), and writes:
 *
 *   docs/cockpit/inventory.json  every overlay layer: its box, z-index, whether
 *                                it takes a touch, and its text;
 *   docs/cockpit/BEFORE.md       the same as a table, per viewport, plus the
 *                                measured coverage and the largest free band;
 *   docs/cockpit/before/*.png    a screenshot with the canvas VISIBLE.
 *
 * It writes documentation, so it is opt-in: `COCKPIT_INVENTORY=1 npx playwright
 * test e2e/cockpit-inventory.spec.ts --workers=1`. Without the variable it skips
 * with that instruction, which keeps a normal gate run from touching the tree.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { duplicateViewportReason } from './skipDuplicate';

const ROOT = path.resolve(process.cwd(), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'cockpit');
const SHOT_DIR = path.join(OUT_DIR, 'before');

const SHAPES = [
  ['portrait-390x844', 390, 844],
  ['android-412x915', 412, 915],
  ['landscape-844x390', 844, 390],
] as const;

test.use({ headless: true, hasTouch: true });

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'inv-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

/** The driving state, as 6.3 leaves it: mission up, assist on, a gust pushing. */
async function bootDriving(page: Page) {
  await mockStudent(page);
  await page.goto('/drive/');
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 45_000 });
  await page.evaluate(async () => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    useGameStore.setState({ worldMode: 'kent', phase: 'driving', controlsScheme: 'dual-steer-left', timeOfDay: 'night' });
    useQRHud.getState().setTransient({
      missionActive: true,
      objective: 'Cross the bridge. Under 45. Steer into the wind when it pushes.',
      toast: '',
      line: null,
      choices: null,
      card: null,
      qte: null,
      qteActive: false,
      debrief: null,
      windAssist: { label: 'WIND ASSIST · 40', holdMph: 40 },
      gust: { side: 'right', atMs: Date.now(), push: true },
    });
  });
  await page.waitForTimeout(1200);
  // The world mount is what may remount the Canvas (worldMode changes the tree),
  // so wait for the cockpit to be up rather than for a wall-clock delay.
  await page.locator('[data-layer="hud"]').first().waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => !!document.querySelector('canvas'), undefined, { timeout: 20_000 });
}

interface Row {
  key: string;
  layer: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  touch: boolean;
  text: string;
  /** A full-screen pointer-transparent root: a layer's canvas, not a HUD box. */
  container: boolean;
}

/** Every overlay box on screen, with the numbers a layout argument needs. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const rectOf = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    };
    const visible = (el: Element) => {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el as HTMLElement);
      return b.width > 1 && b.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };
    const layerOf = (el: Element) => el.closest('[data-layer]')?.getAttribute('data-layer') ?? 'none';
    const SELECTOR = [
      '[data-layer]',
      '[data-ui]',
      '[data-noise-meter]',
      '[data-wind-assist-label]',
      '[data-wind-assist]',
      '[data-gust-side]',
      'button',
    ].join(', ');

    const rows: Array<{
      key: string; layer: string; x: number; y: number; w: number; h: number; z: number; touch: boolean; text: string; container: boolean;
    }> = [];
    const viewportArea = window.innerWidth * window.innerHeight;
    const seen = new Set<Element>();
    for (const el of Array.from(document.querySelectorAll(SELECTOR))) {
      if (seen.has(el) || !visible(el)) continue;
      seen.add(el);
      const s = getComputedStyle(el as HTMLElement);
      const layer = layerOf(el);
      const named =
        el.getAttribute('aria-label') ??
        el.getAttribute('data-layer') ??
        (el.hasAttribute('data-noise-meter')
          ? 'noise-meter'
          : el.hasAttribute('data-gust-side')
            ? 'gust-indicator'
            : el.hasAttribute('data-wind-assist')
              ? 'wind-assist'
              : (el.textContent ?? '').trim().slice(0, 24));
      const box = rectOf(el);
      rows.push({
        key: `${layer}:${named}`,
        layer,
        ...box,
        z: Number(s.zIndex) || 0,
        touch: s.pointerEvents !== 'none' && el.matches('button, [data-ui], [role="button"], input'),
        text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
        // A full-screen, pointer-transparent root (`hud`, `sticks`, `world-hud`)
        // is the layer's canvas, not a thing that covers the road. Counting it as
        // coverage would say the HUD owns 100 % of every screen, which is true of
        // the element and false of the player's view.
        container: box.w * box.h >= viewportArea * 0.9,
      });
    }

    // The band the world actually gets: the tallest vertical run of the centre
    // column (x = 25 %..75 %, where the road is) that no overlay covers.
    const W = window.innerWidth;
    const H = window.innerHeight;
    const covered = new Uint8Array(H);
    for (const r of rows) {
      if (r.container) continue;
      if (r.w < W * 0.25) continue; // a 44 px button does not block the road
      if (r.x > W * 0.75 || r.x + r.w < W * 0.25) continue;
      for (let y = Math.max(0, r.y); y < Math.min(H, r.y + r.h); y++) covered[y] = 1;
    }
    let best = 0;
    let run = 0;
    let bestStart = 0;
    let start = 0;
    for (let y = 0; y < H; y++) {
      if (covered[y]) {
        run = 0;
      } else {
        if (run === 0) start = y;
        run++;
        if (run > best) {
          best = run;
          bestStart = start;
        }
      }
    }

    // Union coverage of every overlay box on a 4 px grid: "the HUD is half the
    // screen" as a number, not an impression.
    const step = 4;
    const cells = new Set<number>();
    const cols = Math.ceil(W / step);
    for (const r of rows) {
      if (r.container) continue;
      const x0 = Math.max(0, Math.floor(r.x / step));
      const x1 = Math.min(cols, Math.ceil((r.x + r.w) / step));
      const y0 = Math.max(0, Math.floor(r.y / step));
      const y1 = Math.min(Math.ceil(H / step), Math.ceil((r.y + r.h) / step));
      for (let cy = y0; cy < y1; cy++) for (let cx = x0; cx < x1; cx++) cells.add(cy * cols + cx);
    }
    const total = Math.ceil(W / step) * Math.ceil(H / step);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;

    return {
      viewport: { w: W, h: H, dpr: window.devicePixelRatio },
      canvas: canvas
        ? { ...rectOf(canvas), buffer: `${canvas.width}x${canvas.height}`, visible: getComputedStyle(canvas).visibility === 'visible' }
        : null,
      rows,
      coverage: cells.size / total,
      worldBand: { top: bestStart, height: best, fraction: best / H },
    };
  });
}

test('the driving cockpit, measured at three shapes', async ({ page }) => {
  const skip = duplicateViewportReason(test.info().project.use?.viewport ?? null, { width: 390, height: 844 });
  test.skip(skip !== null, skip ?? '');
  test.skip(!process.env.COCKPIT_INVENTORY, 'writes docs/cockpit — run with COCKPIT_INVENTORY=1');
  test.setTimeout(240_000);

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const report: Array<{ shape: string; data: Awaited<ReturnType<typeof measure>> }> = [];

  for (const [shape, width, height] of SHAPES) {
    await page.setViewportSize({ width, height });
    await bootDriving(page);
    const data = await measure(page);
    expect(data.canvas, `${shape}: the world is on screen`).not.toBeNull();
    expect(data.canvas!.visible).toBe(true);
    // The canvas is the world; it must fill the viewport behind the cockpit.
    expect(data.canvas!.w).toBeGreaterThan(width * 0.9);
    await page.screenshot({ path: path.join(SHOT_DIR, `${shape}.png`) });
    report.push({ shape, data });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'inventory.json'), JSON.stringify(report, null, 2));

  const lines: string[] = [
    '# Cockpit BEFORE — measured, not described',
    '',
    'Generated by `drive/e2e/cockpit-inventory.spec.ts` (`COCKPIT_INVENTORY=1`).',
    'State: a mission running in 6.3 (night, wind assist on, a gust pushing). Canvas',
    'visible in every shot. Boxes are CSS pixels from `getBoundingClientRect()`; `z`',
    'is the computed `z-index` of the element itself; `touch` means it takes a',
    'pointer. Coverage is the union of every box on a 4 px grid; the world band is',
    'the tallest vertical run of the centre column (x 25–75 %) no box covers. A',
    'full-screen pointer-transparent root (`hud`, `sticks`, `world-hud`) is marked',
    '`container` and left out of both numbers: it is the layer, not a HUD box.',
    '',
    '| Shape | Viewport | World band | Overlay coverage | Canvas buffer |',
    '|---|---|---|---|---|',
  ];
  for (const { shape, data } of report) {
    lines.push(
      `| ${shape} | ${data.viewport.w}x${data.viewport.h} @${data.viewport.dpr} | ${data.worldBand.height} px (${Math.round(data.worldBand.fraction * 100)} %) | ${Math.round(data.coverage * 100)} % | ${data.canvas?.buffer ?? '—'} |`,
    );
  }
  for (const { shape, data } of report) {
    lines.push('', `## ${shape}`, '', '| Layer | Box (x,y w×h) | z | touch | text |', '|---|---|---|---|---|');
    const rows = data.rows as Row[];
    for (const r of rows.sort((a, b) => b.z - a.z || a.y - b.y || a.x - b.x)) {
      const key = r.container ? `\`${r.key}\` (container)` : `\`${r.key}\``;
      lines.push(`| ${key} | ${r.x},${r.y} ${r.w}×${r.h} | ${r.z} | ${r.touch ? 'yes' : '—'} | ${r.text || '—'} |`);
    }
    lines.push('', `Screenshot: \`docs/cockpit/before/${shape}.png\``);
  }
  lines.push('');
  fs.writeFileSync(path.join(OUT_DIR, 'BEFORE.md'), lines.join('\n'));
});
