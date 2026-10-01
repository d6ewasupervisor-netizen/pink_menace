import { defineConfig, devices } from '@playwright/test';

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
    // The real client is heavy; give WebGL rendering time on CI-ish machines.
    navigationTimeout: 45_000,
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173/drive/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
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