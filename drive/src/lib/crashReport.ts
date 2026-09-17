/**
 * crashReport — get crash data off her phone. Uncaught errors, unhandled rejections,
 * and WebGL context loss are queued as telemetry and flushed immediately (keepalive),
 * so a frozen tab still leaves a row in drive_events.
 */
import { useQRHud } from '@/stores/qrHud';
import { DriveSync } from '@/systems/DriveSync';

let installed = false;
export function installCrashReport(): void {
  if (installed) return;
  installed = true;
  const report = (event: string, data: Record<string, unknown>) => {
    useQRHud.getState().addTelemetry({ ts: Date.now(), event, data: { ...data, ua: navigator.userAgent.slice(0, 160), mem: (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null, w: window.innerWidth, h: window.innerHeight } });
    void DriveSync.sendTelemetry(true);
  };
  window.addEventListener('error', (e) => report('client.error', { message: String(e.message).slice(0, 300), source: `${e.filename}:${e.lineno}:${e.colno}`, stack: String(e.error?.stack ?? '').slice(0, 800) }));
  window.addEventListener('unhandledrejection', (e) => report('client.rejection', { reason: String((e.reason && (e.reason.stack || e.reason.message)) || e.reason).slice(0, 800) }));
  window.addEventListener('webglcontextlost', () => report('client.webgl_lost', {}), true);
  // Long-task watchdog: a main-thread stall over 2 s is what "frozen" looks like from inside.
  let last = performance.now();
  const tick = () => { const now = performance.now(); if (now - last > 2000) report('client.stall', { ms: Math.round(now - last) }); last = now; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
