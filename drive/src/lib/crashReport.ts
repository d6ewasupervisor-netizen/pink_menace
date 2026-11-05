/**
 * crashReport — get crash data off her phone. Uncaught errors, unhandled rejections,
 * and WebGL context loss are recorded as telemetry and pushed immediately (keepalive),
 * so a frozen tab still leaves a row in drive_events.
 *
 * Two rules learned from the 6.3 HAR:
 *  1. `report()` does NOT post. It hands the row to `DriveSync.noteEvent`, and the
 *     uploader decides when a connection opens (one POST per interval, or an
 *     urgent flush at most one per 5 s). One row per error used to be one POST
 *     per error.
 *  2. A long task is not proof of a freeze. Her phone locked mid-wait: the tab
 *     was hidden for 84 s, `requestAnimationFrame` stopped, and the watchdog
 *     reported it as `client.stall` — a freeze that never happened. The row now
 *     carries `visibility` and `hidden` so a locked phone reads as a locked phone.
 */
import { DriveSync } from '@/systems/DriveSync';

let installed = false;
export function installCrashReport(): void {
  if (installed) return;
  installed = true;
  const pageState = () => ({
    visibility: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    hidden: typeof document !== 'undefined' ? document.hidden : null,
  });
  const report = (event: string, data: Record<string, unknown>) => {
    DriveSync.noteEvent({
      ts: Date.now(),
      event,
      data: {
        ...data,
        ...pageState(),
        ua: navigator.userAgent.slice(0, 160),
        mem: (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null,
        w: window.innerWidth,
        h: window.innerHeight,
      },
    });
    void DriveSync.sendTelemetry(true);
  };
  window.addEventListener('error', (e) => report('client.error', { message: String(e.message).slice(0, 300), source: `${e.filename}:${e.lineno}:${e.colno}`, stack: String(e.error?.stack ?? '').slice(0, 800) }));
  window.addEventListener('unhandledrejection', (e) => report('client.rejection', { reason: String((e.reason && (e.reason.stack || e.reason.message)) || e.reason).slice(0, 800) }));
  window.addEventListener('webglcontextlost', () => report('client.webgl_lost', {}), true);
  // Long-task watchdog: a main-thread stall over 2 s is what "frozen" looks like
  // from inside — unless the page was hidden, in which case no frames run at all
  // and the gap is the phone being locked, not the game being stuck.
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    const ms = now - last;
    last = now;
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (ms > 2000) report('client.stall', { ms: Math.round(ms), while_hidden: hidden, since_visibility: hidden ? 'hidden' : 'visible' });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

