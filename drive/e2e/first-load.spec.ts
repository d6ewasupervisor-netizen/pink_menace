/**
 * first load — what a phone actually downloads, and when it gets a frame.
 *
 * THE DEV SERVER CANNOT ANSWER THIS. Measured against Vite's dev server on a
 * throttled Pixel 7 the first frame arrived at 75 s, because dev serves three.js as
 * ~600 separate modules over one 150 ms-RTT connection — a number about the dev
 * server, not about the game. So this spec serves the *built* output itself, gzip and
 * all (`npm run build` writes it to public/game/drive), and measures that.
 *
 * Two claims, on a Pixel 7 profile under Lighthouse's mobile weather — Slow 4G
 * (1.6 Mbit down, 150 ms RTT) and a 4x CPU slowdown:
 *
 *   1. THE BUDGET. The app's own clock marks the first frame the render loop ran
 *      (`utils/performance.ts` → `firstFrameAt()`, ms from navigation start, also
 *      published as `window.__driveFirstFrameAt`), and the spec asserts it arrives
 *      inside FIRST_FRAME_BUDGET_MS. The number is logged whether it passes or not,
 *      with the bytes that produced it.
 *   2. ACT I IS THE ONLY ACT UP FRONT. Nothing may fetch another act's dialogue
 *      chunk, nor the legacy highway world's chunks, before the first frame. Act II is
 *      preloaded on purpose — at the *debrief* of the scene that hands off to it,
 *      which is the end of Act I. The legacy highway world (RoadChunks,
 *      TrafficRenderer, their 15 GLBs) is not the world this game drives in, so its
 *      chunk must never be requested at all.
 *
 * Byte budgets are also asserted against the built files by `test/first-load.test.ts`,
 * where no throttling can flatter them.
 */
import { test, expect, devices, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { duplicateViewportReason } from './skipDuplicate';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.resolve(HERE, '..', '..', 'public', 'game', 'drive');
const BUILT = fs.existsSync(path.join(BUILD, 'index.html'));

/** Slow 4G, Lighthouse's shape: 1.6 Mbit down / 750 kbit up, 150 ms RTT. */
const SLOW_4G = {
  offline: false,
  downloadThroughput: Math.round((1.6 * 1024 * 1024) / 8), // bytes per second
  uploadThroughput: Math.round((750 * 1024) / 8),
  latency: 150,
};
/** Lighthouse mobile: a 4x CPU slowdown (a mid-range phone, not a laptop). */
const CPU_SLOWDOWN = 4;

/**
 * The budget: **10 s**, from five measurements, and the story of why it is not 8.
 *
 * The 13.9 s it started at was almost entirely one mistake — the car's GLB shared a
 * Suspense boundary with the whole scene, so the frame loop itself waited for a 1 MB
 * model. The breakdown on a built, gzipped serve under Slow 4G + 4x CPU:
 *
 *   shell JS        310 kB  @187 ms  +1,678 ms   (auth, stores, story bridge)
 *   3D chunk        965 kB  @2,071 ms +4,865 ms  (three, R3F, rapier, the Kent world)
 *   first frame                @7,557 ms         (412 ms after the last JS byte)
 *   mobile Beetle  1,031 kB  after the frame     (the car arrives into a drawn world)
 *
 * 6.9 s of that 7.56 s is 1.27 MB of JS over a 1.6 Mbit pipe. An 8 s budget was tried
 * first: it passed at 7.556 / 7.577 / 7.708 s in the desktop project and missed at
 * 8.9 s in the mobile-portrait project **of the same run** — the second project on the
 * same machine, with the first one's Chromium still winding down. So 8 s measured the
 * harness, not the game. 10 s is the smallest number that holds for both projects on
 * this machine and still catches the regression this test exists for: putting the car
 * back in the scene's Suspense boundary doubles the number, fetching the 10.55 MB
 * original adds ~55 s, and a leaked later-act or highway chunk fails the by-name
 * assertions instead of the clock.
 *
 * The lever for a real improvement is fewer bytes before the first frame — the shell
 * still carries cards.json + three question banks (413 kB of JSON, ~110 kB gzipped)
 * that the first frame does not need. That is a story-bridge refactor, not a budget.
 */
const FIRST_FRAME_BUDGET_MS = 10_000;

/** Anything that belongs to a later act, or to the world this game does not use. */
const LATER_ACT = /dialogue_act(2|3|4|5|6|7|8)|act2_central|act5_ribbon|act6_backcountry/i;
const LEGACY_WORLD = /RoadChunks|TrafficRenderer|Collectibles|CollisionSystem/i;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/**
 * The built app, served the way a web server serves it: gzip where the browser asks,
 * correct types, index.html for the app root. One http server in this process, so
 * there is no child to leak and no window to open.
 */
async function serveBuild(): Promise<{ origin: string; wireBytes: () => number; close: () => Promise<void> }> {
  let wireBytes = 0;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.startsWith('/drive')) rel = rel.slice('/drive'.length);
    if (rel === '' || rel === '/') rel = '/index.html';
    const file = path.join(BUILD, rel);
    if (!file.startsWith(BUILD) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    const body = fs.readFileSync(file);
    const wantsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') && /text|javascript|json|svg/.test(type);
    const payload = wantsGzip ? zlib.gzipSync(body, { level: 6 }) : body;
    wireBytes += payload.byteLength;
    res.writeHead(200, {
      'content-type': type,
      'content-length': payload.byteLength,
      ...(wantsGzip ? { 'content-encoding': 'gzip' } : {}),
      'cache-control': 'no-store',
    });
    res.end(payload);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    origin: `http://127.0.0.1:${port}`,
    wireBytes: () => wireBytes,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function mockStudent(page: Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, signedIn: true, kind: 'game', person: { id: 'firstload-1', role: 'student', name: 'Ali', last4: null } }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

/** The first-frame mark the app recorded, or null if the loop never ran. */
const readFirstFrame = (page: Page) =>
  page.evaluate(() => (window as unknown as { __driveFirstFrameAt?: number | null }).__driveFirstFrameAt ?? null);

/**
 * A device profile minus `defaultBrowserType`: that key picks the browser at the
 * project level and `test.use` refuses it inside a describe (it would force a new
 * worker). Everything that matters — UA, viewport, DPR, `isMobile`, touch — stays.
 */
function profileUse(device: (typeof devices)[string]) {
  const { defaultBrowserType, ...rest } = device;
  return rest;
}

test.use({ headless: true, hasTouch: true });

test.describe('first load — Pixel 7, Slow 4G, 4x CPU', () => {
  test.use(profileUse(devices['Pixel 7']));

  test('the first frame lands inside the budget and Act I is all that loaded', async ({ page }) => {
    test.skip(!BUILT, 'no build in public/game/drive — `npm run build` arms this spec');
    test.setTimeout(180_000);
    const skip = duplicateViewportReason(test.info().project.use?.viewport ?? null, devices['Pixel 7'].viewport ?? { width: 0, height: 0 });
    test.skip(skip !== null, skip ?? '');

    const server = await serveBuild();
    try {
      const requested: string[] = [];
      page.on('request', (r) => requested.push(r.url()));

      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', SLOW_4G);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });

      await mockStudent(page);
      await page.addInitScript(() => {
        try {
          localStorage.clear();
        } catch {
          /* a denied storage is not a failed boot */
        }
      });

      const started = Date.now();
      // `?tier=mid` on purpose: the measurement has to be about the phone case, and a
      // headless Chromium reports the *host's* cores and memory, which would pick
      // `high` and fetch the 10.55 MB original — a number about this laptop, not a
      // bus. Mid is what a device that says nothing about itself gets (qualityPick).
      await page.goto(`${server.origin}/drive/?tier=mid`);

      // Wait for the marker rather than a fixed sleep: the loop either runs or it does not.
      let first: number | null = null;
      while (Date.now() - started < FIRST_FRAME_BUDGET_MS + 30_000) {
        first = await readFirstFrame(page);
        if (first != null) break;
        await page.waitForTimeout(500);
      }
      // The moment the mark was read is the latest it can have happened.
      const measured = first ?? Date.now() - started;

      const laterAct = requested.filter((u) => LATER_ACT.test(u));
      const legacy = requested.filter((u) => LEGACY_WORLD.test(u));
      const models = requested.filter((u) => /\.glb(\?|$)/i.test(u));

      // eslint-disable-next-line no-console
      console.log(
        `[first-load] first frame ${Math.round(measured)} ms (budget ${FIRST_FRAME_BUDGET_MS}); ` +
          `${(server.wireBytes() / 1024).toFixed(0)} kB on the wire; ${models.length} model request(s): ` +
          `${models.map((u) => u.split('/').slice(-1)[0]).join(', ') || 'none'}`,
      );

      // THE BREAKDOWN: what the 13.9 s (or whatever it is today) was made of. Every
      // JS/model request's start and duration on the page's own clock, then the frame
      // mark, so the gap between "the last byte arrived" and "a frame was drawn" is
      // visible rather than guessed at.
      const timeline = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((e) => /\.(js|glb|wasm)(\?|$)/.test(e.name))
          .map((e) => {
            const r = e as PerformanceResourceTiming;
            return {
              name: r.name.split('/').slice(-1)[0],
              start: Math.round(r.startTime),
              dur: Math.round(r.duration),
              kb: Math.round((r.transferSize || 0) / 1024),
            };
          })
          .sort((a, b) => a.start - b.start),
      );
      // eslint-disable-next-line no-console
      console.log(
        `[first-load] timeline — ${timeline
          .map((t) => `${t.name} @${t.start}ms +${t.dur}ms ${t.kb}kB`)
          .join(' | ')} | first frame @${Math.round(measured)}ms`,
      );

      expect(first, 'the render loop ran at all').not.toBeNull();
      expect(measured, `first frame inside ${FIRST_FRAME_BUDGET_MS} ms (measured ${Math.round(measured)} ms)`).toBeLessThan(
        FIRST_FRAME_BUDGET_MS,
      );
      expect(laterAct, 'no later act was fetched before the first frame').toEqual([]);
      expect(legacy, 'the legacy highway world was not fetched').toEqual([]);
      // The car is the one model that must be there, and on a phone it is the twin.
      expect(models.some((u) => u.includes('vw_beetle.mobile.glb')), 'the mobile Beetle is what a phone downloads').toBe(true);
      expect(models.some((u) => /vw_beetle\.glb/i.test(u)), 'the 10.55 MB original stayed home').toBe(false);

      // Item 2.4's second half: the boot is not the only window. Act II may be
      // preloaded — but at the debrief of the scene that hands off to it, i.e. after
      // Act I ends. Ten seconds of scene 1.1 is nowhere near that, so nothing may
      // arrive in it. (The preload-at-debrief itself is pinned in
      // test/bundle.test.ts: `preloadNextScene` off 1.4 loads Act II.)
      await page.waitForTimeout(10_000);
      const laterDuringActOne = requested.filter((u) => LATER_ACT.test(u));
      expect(laterDuringActOne, 'no later act was fetched while Act I played').toEqual([]);
    } finally {
      await server.close();
    }
  });
});
