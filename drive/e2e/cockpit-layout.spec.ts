/**
 * The cockpit grid, measured in a real browser at the three shipped shapes.
 *
 * Rule under test: no two *interactive* layers share space at any viewport in
 * any state. That is how the cockpit went wrong on a device — at 390x844 the
 * horn button (310,684 64x64) sat on top of the dialogue box and its first
 * option, and the card's still was painted full-bleed behind the dock, so every
 * answer lived under the card body's scroll.
 *
 * The four states are the ones a player is in when it matters: driving (HUD +
 * objective), a dialogue choice, a card, and a QTE. Each gets a stored
 * screenshot (12 total) with the WebGL canvas hidden, so the baseline is the
 * layout and not the GPU.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STILL = path.resolve(process.cwd(), '..', 'cards', 'II-019.png');

const VIEWPORTS = [
  ['portrait-390x844', 390, 844],
  ['landscape-844x390', 844, 390],
  ['desktop-1280x800', 1280, 800],
] as const;

const STATES = ['hud', 'dialogue', 'card', 'qte'] as const;
type State = (typeof STATES)[number];

// Headed on purpose: these are the device screenshots, and the stored baselines
// are headed Chromium. Software rendering resamples the card still differently
// enough to trip a 2% diff, which says nothing about the layout.
test.use({ headless: false, hasTouch: true });

async function mockStudent(page: Page) {
  // Last route registered wins in Playwright, so the catch-all goes first and the
  // specific routes below it.
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/drive/image/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(STILL) }),
  );
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'layout-1', role: 'student', name: 'Ali', last4: null } }),
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
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    useGameStore.setState({ worldMode: 'kent', phase: 'driving', controlsScheme: 'dual-steer-left' });
    useQRHud.getState().setTransient({
      objective: "Chain-up. Brake down and hold. Drape, hook, tighten. Don't drop it.",
      toast: '',
      line: null,
      choices: null,
      card: null,
      qte: null,
      qteActive: false,
      debrief: null,
    });
  });
}

const PAYLOAD: Record<State, Record<string, unknown>> = {
  hud: { phase: 'driving' },
  dialogue: {
    phase: 'driving',
    line: {
      id: 'layout',
      speaker: 'DEAC',
      delivery: 'R',
      emotion: 'neutral',
      volume: 'low',
      text: "Chain-up. Pull in. I'll watch the grass. Don't stop in the lane and don't stab it when you do.",
    },
    choices: {
      node: { id: 'layout.choice', type: 'choice', timeout_ms: null },
      options: [
        { id: 'a', text: 'Chains on, then up. Slowly.' },
        { id: 'b', text: "Back down to Tuna's." },
      ],
    },
  },
  card: { phase: 'card', card: { id: 'II-019', source: 'story' } },
  qte: {
    phase: 'driving',
    qte: { label: 'HOLD THE BRAKE', hint: 'Drape, hook, tighten. Keep the pedal down till it bites.', progress: 0.45 },
  },
};

async function show(page: Page, state: State) {
  await page.evaluate(async (p) => {
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useQRHud.getState().setTransient({
      line: null, direction: null, choices: null, card: null, qte: null, qteActive: false, debrief: null,
      ...p,
    });
    useGameStore.setState({ phase: (p.phase as never) ?? 'driving' });
  }, PAYLOAD[state]);
  await page.waitForTimeout(350);
}

interface Box { x: number; y: number; w: number; h: number }

/** Every visible interactive box, tagged with the named layer it belongs to. */
async function interactiveLayers(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    };
    const visible = (el: Element) => {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el as HTMLElement);
      return b.width > 1 && b.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };
    const rows: Array<{ layer: string; name: string; x: number; y: number; w: number; h: number }> = [];
    // Attribute every hit target to its *nearest* named layer, so a button inside
    // `hud` that names its own layer (`pause`, `horn`) is counted once.
    const owner = (el: Element) => el.closest('[data-layer]')?.getAttribute('data-layer') ?? 'none';
    for (const layer of Array.from(document.querySelectorAll('[data-layer]'))) {
      if (!visible(layer)) continue;
      const name = layer.getAttribute('data-layer') as string;
      for (const hit of Array.from(layer.querySelectorAll('button, [data-ui], input, [role="button"]'))) {
        if (!visible(hit) || owner(hit) !== name) continue;
        rows.push({
          layer: name,
          name: `${hit.tagName.toLowerCase()}[${hit.getAttribute('aria-label') ?? (hit.textContent ?? '').trim().slice(0, 20)}]`,
          ...box(hit),
        });
      }
    }
    const at = (n: string) => {
      const el = document.querySelector(`[data-layer="${n}"]`);
      return el && visible(el) ? box(el) : null;
    };
    return {
      rows,
      still: at('still'),
      dock: at('dock'),
      qte: at('qte'),
      dialogue: at('dialogue'),
    };
  });
}

function overlaps(rows: Array<{ layer: string; name: string; x: number; y: number; w: number; h: number }>) {
  const hits: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (a.layer === b.layer) continue;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        hits.push(`${a.layer}:${a.name} (${a.x},${a.y} ${a.w}x${a.h}) ∩ ${b.layer}:${b.name} (${b.x},${b.y} ${b.w}x${b.h})`);
      }
    }
  }
  return hits;
}

for (const [vpName, width, height] of VIEWPORTS) {
  test(`${vpName}: the cockpit bands keep interactive layers apart`, async ({ page }) => {
    test.setTimeout(180_000);
    // This spec sets its own three viewports; one project is enough.
    test.skip(test.info().project.name !== 'desktop', 'viewports are set inside the test');
    await page.setViewportSize({ width, height });
    await boot(page);
    // The 3D world animates; the layout does not. Freeze the canvas so the stored
    // screenshots are the cockpit, not the GPU.
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; } body { background: #0b1013; }' });

    for (const state of STATES) {
      await show(page, state);
      const layers = await interactiveLayers(page);
      expect(overlaps(layers.rows), `${vpName} / ${state}`).toEqual([]);

      if (state === 'card') {
        // The still is fully above the dock, and the dock owns the answers.
        expect(layers.still, `${vpName} still band`).not.toBeNull();
        expect(layers.dock, `${vpName} dock`).not.toBeNull();
        // ...and the plate is actually on screen, not a broken image in a box.
        const loaded = await page.evaluate(() => {
          const img = document.querySelector('[data-layer="still"] img') as HTMLImageElement | null;
          return img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
        });
        expect(loaded, `${vpName} still image`).not.toBeNull();
        expect(loaded!.w).toBeGreaterThan(0);
        const s = layers.still!;
        const d = layers.dock!;
        const sideBySide = d.x >= s.x + s.w || s.x >= d.x + d.w;
        const above = s.y + s.h <= d.y;
        expect(sideBySide || above, `${vpName} still (${s.x},${s.y} ${s.w}x${s.h}) vs dock (${d.x},${d.y} ${d.w}x${d.h})`).toBe(true);
      }

      await expect(page).toHaveScreenshot(`${vpName}-${state}.png`, {
        animations: 'allow',
        caret: 'hide',
        // The overlap assertions above are the test; these are the visual record.
        maxDiffPixelRatio: 0.02,
      });
    }
  });
}
