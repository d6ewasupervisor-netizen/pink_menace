/**
 * ITEM 6.6 — the backend the e2e suite was missing.
 *
 * The client talks to `/api/...` on its own origin; Vite proxies that to
 * `VITE_API_TARGET` (default `http://localhost:8080`). With nothing on 8080, every
 * *unmocked* request — and every request Playwright's `page.route` cannot see, such
 * as an unload `keepalive` POST — ended in
 * `[vite] http proxy error: /api/drive/progress … ECONNREFUSED`. The suite was
 * green (the client is best-effort on purpose) but the log was noise, and a real
 * regression in the proxy path would have been invisible in it.
 *
 * This is not a mock of the game's logic: it is the smallest server that keeps the
 * proxy honest — 200s and empty progress. Per-test fixtures still `page.route`
 * whatever a test is *about*; this only stops the suite from testing the absence of
 * a server.
 *
 * Playwright starts it as a second `webServer` entry, and `reuseExistingServer`
 * means a real backend on 8080 wins when one is running.
 */
import http from 'node:http';

const PORT = Number(process.env.STUB_API_PORT || 8080);

const json = (res, code, body = {}) => {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  });
  res.end(payload);
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') return json(res, 204);

  // Readiness + liveness for Playwright's webServer check.
  if (url === '/api/health') return json(res, 200, { ok: true, stub: true });

  // The save: nothing stored, so a hydrate adopts the local copy.
  if (url === '/api/drive/progress') {
    if (req.method === 'GET') return json(res, 200, { progress: null });
    if (req.method === 'PUT') return json(res, 200, { ok: true });
  }

  // Telemetry, attempts, card grading: accepted and dropped.
  if (req.method === 'POST' && (url === '/api/drive/events' || url === '/api/drive/attempts')) {
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url === '/api/drive/card-answers') {
    // `graded: null` is the client's "recorded as seen, nothing to grade" answer.
    return json(res, 200, { graded: null });
  }

  // Anything else is a real 404, not a hang: a missing route should look missing.
  return json(res, 404, { ok: false, error: 'not found', path: url });
});

server.listen(PORT, '127.0.0.1', () => {
  // One line, so a stale stub is obvious in the run's output.
  console.log(`[stub-api] listening on http://127.0.0.1:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
