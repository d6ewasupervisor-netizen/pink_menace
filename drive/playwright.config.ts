import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// This checkout has Chromium installed under a version Playwright's default
// lookup does not pick (the headless shell is missing), so point at the browser
// that is actually on disk when it is there and fall back to the default
// otherwise. `PW_HEADED=1 npx playwright test` runs the same specs with a window.
const localChrome = path.join(
  process.env.LOCALAPPDATA ?? '',
  'ms-playwright',
  'chromium-1243',
  'chrome-win64',
  'chrome.exe',
);
const launchOptions = fs.existsSync(localChrome) ? { executablePath: localChrome } : {};

// Smoke test of the /drive surface. The drive redirects to `/` unless /api/me
// reports a signed-in student, and it hydrates from /api/drive/progress; the
// spec mocks both at the browser so no backend is needed.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    launchOptions,
    headless: process.env.PW_HEADED ? false : true,
    // The real client is heavy; give WebGL rendering time on CI-ish machines.
    navigationTimeout: 45_000,
  },
  /**
   * TWO SERVERS (item 6.6). The app is served by Vite; its `/api` proxy needs a
   * target or every unproxied request logs
   * `[vite] http proxy error: /api/drive/progress … ECONNREFUSED` — which is what
   * the suite's log was full of. `e2e/stub-api.mjs` is that target: the smallest
   * server that answers the drive's endpoints, so the proxy path is exercised
   * instead of failing. A real backend on the same port wins (`reuseExistingServer`).
   */
  webServer: [
    {
      command: 'node e2e/stub-api.mjs',
      url: 'http://127.0.0.1:8080/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173/drive/',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile-portrait',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
});