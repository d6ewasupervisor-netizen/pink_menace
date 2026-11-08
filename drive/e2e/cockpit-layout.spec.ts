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
  ['portrait-440x956', 440, 956],
  ['landscape-844x390', 844, 390],
  ['desktop-1280x800', 1280, 800],
] as const;

/**
 * The pixel record is DPR-scaled and has three baselines; the 440x956 shape is
 * measured for overlaps only (it is the phone the bridge bug was reported on,
 * and its geometry is the overlap rule's business, not the painter's).
 */
const BASELINE_VIEWPORTS = new Set(['portrait-390x844', 'landscape-844x390', 'desktop-1280x800']);

const STATES = ['hud', 'dialogue', 'card', 'qte'] as const;
type State = (typeof STATES)[number];

// Headless: the layout is geometry, not pixels. A window would only add a GPU
// and a desktop session to the run; the stored baselines are the same 390x844 /
// 844x390 / 1280x800 frames either way.
test.use({ headless: true, hasTouch: true });

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
  // The bridge's own top band: the assist chip and the gust indicator are on
  // screen in the state a player is actually in when they matter.
  hud: {
    phase: 'driving',
    windAssist: { label: 'WIND ASSIST · 40', holdMph: 40 },
    gust: { side: 'right', atMs: Date.now(), push: true },
  },
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
      windAssist: null, gust: null,
      ...p,
    });
    useGameStore.setState({ phase: (p.phase as never) ?? 'driving' });
  }, PAYLOAD[state]);
  await page.waitForTimeout(350);
  // The card's clock appears only after the card game's 1 750 ms grace, and the
  // card frame is the state the bar lives in — wait for it instead of photographing
  // its absence.
  if (state === 'card') {
    await page.locator('[data-layer="card-clock"]').first().waitFor({ state: 'visible', timeout: 8000 });
  }
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
    // The surfaces that are not hit targets but still share the top band with the
    // hit targets: the act badge, the noise meter and its sub-label, the nav
    // cluster, and the bridge's own two (the assist chip and the gust cue). They
    // are returned with their own layer name so nothing is skipped as "same
    // layer" when the rule compares them.
    const named = (name: string, el: Element | null) => {
      if (!el || !visible(el)) return;
      rows.push({ layer: `band:${name}`, name, ...box(el) });
    };
    named('act-badge', document.querySelector('[data-layer="badge"]'));
    // The sub-label lives inside the meter box, so comparing against the meter
    // covers it (comparing both would be the meter overlapping itself).
    named('noise-meter', document.querySelector('[data-noise-meter]'));
    named('nav-cluster', document.querySelector('[data-layer="nav"]'));
    named('wind-assist', document.querySelector('[data-wind-assist-label]'));
    named('gust-indicator', document.querySelector('[data-gust-side]'));
    return {
      rows,
      still: at('still'),
      dock: at('dock'),
      qte: at('qte'),
      dialogue: at('dialogue'),
    };
  });
}

/**
 * Every box that collides with one of `targets`. The two surfaces this pass added
 * to the top band (`wind-assist`, `gust-indicator`) are checked against
 * everything on screen; the rest of the band is checked by `overlaps` above.
 */
function collisionsWith(
  rows: Array<{ layer: string; name: string; x: number; y: number; w: number; h: number }>,
  targets: string[],
) {
  const hits: string[] = [];
  for (const a of rows) {
    if (!targets.includes(a.name)) continue;
    for (const b of rows) {
      if (a === b) continue;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        hits.push(`${a.name} (${a.x},${a.y} ${a.w}x${a.h}) ∩ ${b.layer}:${b.name} (${b.x},${b.y} ${b.w}x${b.h})`);
      }
    }
  }
  return [...new Set(hits)];
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

/**
 * The pixel record is DPR-scaled, so it is written by the 1x project only. The
 * overlap rule — the actual test — runs in every project: this spec sets its own
 * three viewports, so the second project is the same CSS geometry under the
 * phone's device profile (`isMobile`, DPR 2.75, an Android UA), which is where
 * the bug was reported. Skipping the whole run there would have been a claim
 * that the device profile does not matter; measuring it costs three more runs.
 */
const BASELINE_PROJECT = 'desktop';

for (const [vpName, width, height] of VIEWPORTS) {
  test(`${vpName}: the cockpit bands keep interactive layers apart`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    await boot(page);
    // The 3D world animates; the layout does not. Freeze the canvas so the stored
    // screenshots are the cockpit, not the GPU.
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; } body { background: #0b1013; }' });

    for (const state of STATES) {
      await show(page, state);
      const layers = await interactiveLayers(page);
      expect(overlaps(layers.rows), `${vpName} / ${state}`).toEqual([]);

      // The bridge's two new surfaces own their slots: the assist chip and the
      // gust indicator may not touch anything else in the top band, at any of the
      // four shapes — the chip used to sit on the noise meter's sub-label in
      // landscape and on the nav cluster's objective in portrait.
      if (state === 'hud') {
        expect(layers.rows.some((r) => r.name === 'wind-assist'), `${vpName}: the assist chip is on screen`).toBe(true);
        expect(layers.rows.some((r) => r.name === 'gust-indicator'), `${vpName}: the gust cue is on screen`).toBe(true);
        expect(collisionsWith(layers.rows, ['wind-assist', 'gust-indicator']), `${vpName} / top band slots`).toEqual([]);
      }

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

      if (test.info().project.name === BASELINE_PROJECT && BASELINE_VIEWPORTS.has(vpName)) {
        await expect(page).toHaveScreenshot(`${vpName}-${state}.png`, {
          animations: 'allow',
          caret: 'hide',
          // The overlap assertions above are the test; these are the visual record.
          maxDiffPixelRatio: 0.02,
        });
      }
    }
  });
}
