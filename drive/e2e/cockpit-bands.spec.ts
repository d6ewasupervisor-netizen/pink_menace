/**
 * The cockpit's bands, measured in a real browser at the five shipped shapes.
 *
 * ITEM 3.9 — THIS SPEC REPLACES `cockpit-layout.spec.ts`. What changed and why:
 *
 *   - the old spec hid the canvas (`canvas { visibility: hidden }`) so its stored
 *     screenshots were "the layout and not the GPU". That also hid the only thing
 *     the player is looking at, and the measured promise is about the ROAD. The
 *     canvas stays visible here.
 *   - 4 viewports × 4 states became **5 viewports × 6 states**: 390×844, Android
 *     412×915, the reported iPhone 440×956, landscape 844×390 and desktop 1280×800;
 *     driving, driving+dialogue, driving+gust, chain-up prompt, card open and the
 *     hands-off wait.
 *   - the old baselines in `cockpit-layout.spec.ts-snapshots/` are RETIRED: the
 *     surfaces they photographed (the 143 px nav cluster, the 46 px meter, the
 *     140 px sticks, the WIND ASSIST chip) no longer exist. New baselines live in
 *     `cockpit-bands.spec.ts-snapshots/`, at the two portrait/landscape shapes.
 *
 * RULES UNDER TEST: nothing the player touches may overlap anything else the player
 * touches, at any shape, in any state; LOW and HORN must be on screen and uncovered;
 * and the road — `[data-band="world"]`, written from `cockpit/spec.ts` — must be at
 * least **55 % of a portrait viewport**, which is what the rebuild was for (it
 * measured 26 % at 390×844).
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STILL = path.resolve(process.cwd(), '..', 'cards', 'II-019.png');

const VIEWPORTS = [
  ['portrait-390x844', 390, 844],
  ['android-412x915', 412, 915],
  ['iphone-440x956', 440, 956],
  ['landscape-844x390', 844, 390],
  ['desktop-1280x800', 1280, 800],
] as const;

/** The pixel record is DPR-scaled, so it is written by the 1x project, at two shapes. */
const BASELINE_VIEWPORTS = new Set(['portrait-390x844', 'landscape-844x390']);
const BASELINE_PROJECT = 'desktop';

const STATES = ['driving', 'dialogue', 'gust', 'prompt', 'card', 'handsoff'] as const;
type State = (typeof STATES)[number];

test.use({ headless: true, hasTouch: true });

async function mockStudent(page: Page) {
  // Last route registered wins in Playwright, so the catch-all goes first.
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/drive/image/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(STILL) }),
  );
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'bands-1', role: 'student', name: 'Ali', last4: null } }),
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
      windAssist: null,
      gust: null,
      handsOff: null,
    });
  });
}

const LINE = {
  id: 'bands',
  speaker: 'DEAC',
  delivery: 'R',
  emotion: 'neutral',
  volume: 'low',
  text: "Chain-up. Pull in. I'll watch the grass. Don't stop in the lane and don't stab it when you do. And keep the wheel straight while the rig settles.",
};

const PAYLOAD: Record<State, Record<string, unknown>> = {
  driving: { phase: 'driving' },
  dialogue: {
    phase: 'driving',
    line: LINE,
    choices: {
      node: { id: 'bands.choice', type: 'choice', timeout_ms: null },
      options: [
        { id: 'a', text: 'Chains on, then up. Slowly.' },
        { id: 'b', text: "Back down to Tuna's." },
      ],
    },
  },
  gust: {
    phase: 'driving',
    windAssist: { label: 'WIND ASSIST · 40', holdMph: 40 },
    gust: { side: 'right', atMs: 1, push: true },
  },
  prompt: {
    phase: 'driving',
    qte: { label: 'HOLD THE BRAKE', hint: 'Drape, hook, tighten. Keep the pedal down till it bites.', progress: 0.45 },
  },
  card: { phase: 'card', card: { id: 'II-019', source: 'story' } },
  handsoff: { phase: 'driving', handsOff: { mission: 'vantage_bridge_crossing', totalS: 60, elapsedS: 18 } },
};

async function show(page: Page, state: State) {
  await page.evaluate(async (p) => {
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    useQRHud.getState().setTransient({
      line: null, direction: null, choices: null, card: null, qte: null, qteActive: false,
      debrief: null, handsOff: null, windAssist: null, gust: null,
      objective: "Chain-up. Brake down and hold. Drape, hook, tighten. Don't drop it.",
      toast: '',
      ...p,
    });
    useGameStore.setState({ phase: (p.phase as never) ?? 'driving' });
  }, PAYLOAD[state]);
  await page.waitForTimeout(400);
  if (state === 'card') {
    await page.locator('[data-layer="card-clock"]').first().waitFor({ state: 'visible', timeout: 8000 });
  }
}

interface Box { x: number; y: number; w: number; h: number }

/** Every visible interactive box, tagged with the layer it belongs to. */
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
    const named = (name: string, el: Element | null) => {
      if (!el || !visible(el)) return;
      rows.push({ layer: `band:${name}`, name, ...box(el) });
    };
    named('act-chip', document.querySelector('[data-layer="badge"]'));
    named('noise-bar', document.querySelector('[data-noise-meter]'));
    named('nav-strip', document.querySelector('[data-layer="nav"]'));
    named('gust-cue', document.querySelector('[data-gust-side]'));

    const vp = { w: window.innerWidth, h: window.innerHeight };
    const worldEl = document.querySelector('[data-band="world"]') as HTMLElement | null;
    const world = worldEl ? box(worldEl) : null;
    const at = (n: string) => {
      const el = document.querySelector(`[data-layer="${n}"]`);
      return el && visible(el) ? box(el) : null;
    };
    // Fully inside the viewport, and the topmost element at its centre is itself.
    const control = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el || !visible(el)) return { inside: null, uncovered: null };
      const b = el.getBoundingClientRect();
      const inside = b.x >= 0 && b.y >= 0 && b.x + b.width <= vp.w + 0.5 && b.y + b.height <= vp.h + 0.5;
      const hit = document.elementFromPoint(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
      return { inside, uncovered: hit === el || el.contains(hit) };
    };
    return {
      rows,
      world,
      vp,
      still: at('still'),
      dock: at('dock'),
      lights: control('[data-layer="lights"]'),
      horn: control('[data-layer="horn"]'),
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
  test(`${vpName}: six states, no overlaps, the road keeps its half`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    await boot(page);
    const portrait = height >= width;

    for (const state of STATES) {
      await show(page, state);
      const layers = await interactiveLayers(page);
      expect(overlaps(layers.rows), `${vpName} / ${state}`).toEqual([]);

      // The road, measured from the element `cockpit/spec.ts` writes rather than
      // inferred from the furniture around it.
      if (state === 'driving') {
        expect(layers.world, `${vpName}: the world band exists`).not.toBeNull();
        const fraction = layers.world!.h / layers.vp.h;
        if (portrait) {
          expect(
            fraction,
            `${vpName}: world ${layers.world!.h}px of ${layers.vp.h} = ${(fraction * 100).toFixed(1)} %`,
          ).toBeGreaterThanOrEqual(0.55);
        } else {
          expect(fraction, `${vpName}: landscape/desktop world`).toBeGreaterThan(0.3);
        }
      }

      // LOW and HORN are on screen and nothing is painted over them.
      if (state === 'driving' || state === 'gust') {
        expect(layers.lights.inside, `${vpName}: LOW is in the viewport`).toBe(true);
        expect(layers.horn.inside, `${vpName}: HORN is in the viewport`).toBe(true);
        expect(layers.lights.uncovered, `${vpName}: LOW is not covered`).toBe(true);
        expect(layers.horn.uncovered, `${vpName}: HORN is not covered`).toBe(true);
      }

      // The card's still stays clear of the dock that holds the answers.
      if (state === 'card') {
        expect(layers.still, `${vpName} still`).not.toBeNull();
        expect(layers.dock, `${vpName} dock`).not.toBeNull();
        const s = layers.still!;
        const d = layers.dock!;
        const sideBySide = d.x >= s.x + s.w || s.x >= d.x + d.w;
        const above = s.y + s.h <= d.y;
        expect(sideBySide || above, `${vpName} still (${s.x},${s.y} ${s.w}x${s.h}) vs dock (${d.x},${d.y} ${d.w}x${d.h})`).toBe(true);
      }

      if (test.info().project.name === BASELINE_PROJECT && BASELINE_VIEWPORTS.has(vpName)) {
        // The measurements above run against the live world. A *picture* of a
        // running 3D scene is not a baseline — the road moves between runs — so
        // the canvas is hidden for the length of the capture only. The HUD is a
        // separate DOM layer, so what the baseline records is exactly the cockpit.
        await page.evaluate(() => {
          const c = document.querySelector('canvas') as HTMLElement | null;
          if (c) c.style.visibility = 'hidden';
        });
        await expect(page).toHaveScreenshot(`${vpName}-${state}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.01,
        });
        await page.evaluate(() => {
          const c = document.querySelector('canvas') as HTMLElement | null;
          if (c) c.style.visibility = '';
        });
      }
    }
  });
}
