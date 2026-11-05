/**
 * DriveSync — keeps qrStore and the PINK MENACE server in step.
 *   hydrate(): pull /api/drive/progress; adopt it if it's newer than the local save.
 *   begin():   debounced PUT of the save on change, telemetry batches every 10 s,
 *              attempts as they happen, and a final flush on pagehide.
 * Everything is best-effort; the local save is always the working copy.
 *
 * Telemetry is a *pull* of nothing and a push of everything: `noteEvent()` accepts
 * rows at any rate (a sim flood included) and `sendTelemetry()` is the only thing
 * that opens a connection — one POST per `TELEMETRY.intervalMs`, deduped into
 * repeat counts, capped per batch. See systems/telemetryBatch.ts for why.
 */
import { useQRStore } from '@/stores/qrStore';
import { withCanonPlaceholders } from '@/quietroads/placeholders';
import type { CardGrade } from '@/quietroads';
import { TELEMETRY, TelemetryBatch, TelemetryUploader, type TelemetryRow } from '@/systems/telemetryBatch';

const SAVE_DEBOUNCE_MS = 12_000;
const TELEMETRY_INTERVAL_MS = TELEMETRY.intervalMs;
const BATCH = 50;
const LAST_SAVED_KEY = 'quiet-roads-last-saved';

type Json = Record<string, unknown>;

async function post(path: string, body: Json, keepalive = false): Promise<boolean> {
  try {
    const r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
    return r.ok;
  } catch { return false; }
}

class Sync {
  private saveTimer: number | null = null;
  private telemetryTimer: number | null = null;
  private dirty = false;
  private attemptsQueue: Json[] = [];
  private lastAttemptCount = 0;
  private unsub: (() => void) | null = null;
  private started = false;
  /** Every outbound event row, deduped and capped. See noteEvent(). */
  private readonly telemetry = new TelemetryBatch();
  private readonly uploader = new TelemetryUploader(
    (rows, opts) => post('/api/drive/events', { events: rows }, opts.urgent),
  );
  private lastAttemptPostAt = 0;

  /**
   * One telemetry row. Called from the sim's event funnel, the crash reporter and
   * the WebGL guard — as often as those fire. No fetch happens here.
   */
  noteEvent(row: TelemetryRow): void {
    this.telemetry.push(row);
  }

  /** How many events are waiting (a flood reads as its count, not its rate). */
  get pendingEvents(): number {
    return this.telemetry.counted;
  }

  /** Server → local, only if the server copy is newer than what this device last saved. */
  async hydrate(): Promise<void> {
    try {
      const r = await fetch('/api/drive/progress', { credentials: 'same-origin' });
      if (!r.ok) return;
      const { progress } = await r.json();
      if (!progress) return;
      const lastSaved = Number(localStorage.getItem(LAST_SAVED_KEY) || 0);
      if (progress.clientUpdatedAt && progress.clientUpdatedAt <= lastSaved) return; // local is current
      useQRStore.setState({
        sceneId: progress.sceneId ?? null,
        checkpoint: progress.checkpoint ?? null,
        vars: progress.vars ?? {},
        flags: progress.flags ?? {},
        items: progress.items ?? [],
        unlocks: progress.unlocks ?? [],
        mastery: progress.mastery ?? {},
        runnerState: progress.runnerState ?? null,
        // Canon names win: an older save's placeholders must not override them.
        placeholders: withCanonPlaceholders({ ...useQRStore.getState().placeholders, ...(progress.placeholders ?? {}) }),
      });
      localStorage.setItem(LAST_SAVED_KEY, String(progress.clientUpdatedAt ?? Date.now()));
    } catch { /* offline: play from local */ }
  }

  begin(): void {
    if (this.started) return;
    this.started = true;
    this.lastAttemptCount = useQRStore.getState().attempts.length;
    this.unsub = useQRStore.subscribe(
      (s) => [s.vars, s.flags, s.items, s.unlocks, s.mastery, s.checkpoint, s.sceneId, s.runnerState, s.attempts.length] as const,
      (now, prev) => {
        if (now[8] !== prev[8]) this.queueAttempts();
        this.dirty = true;
        if (this.saveTimer == null) this.saveTimer = window.setTimeout(() => { this.saveTimer = null; void this.saveProgress(); }, SAVE_DEBOUNCE_MS);
      },
      { equalityFn: (a, b) => a.every((v, i) => v === b[i]) }
    );
    this.telemetryTimer = window.setInterval(() => void this.sendTelemetry(), TELEMETRY_INTERVAL_MS);
    window.addEventListener('pagehide', () => void this.flush(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void this.flush(true); });
  }

  private queueAttempts() {
    const all = useQRStore.getState().attempts;
    for (const a of all.slice(this.lastAttemptCount)) this.attemptsQueue.push({ ts: a.ts, question_id: a.question_id, correct: a.correct, chosen: a.chosen, response_ms: a.response_ms });
    this.lastAttemptCount = all.length;
  }

  async saveProgress(keepalive = false): Promise<void> {
    if (!this.dirty) return;
    const s = useQRStore.getState();
    const clientUpdatedAt = Date.now();
    const body = { sceneId: s.sceneId, checkpoint: s.checkpoint, vars: s.vars, flags: s.flags, items: s.items, unlocks: s.unlocks, mastery: s.mastery, runnerState: s.runnerState, clientUpdatedAt };
    try {
      const r = await fetch('/api/drive/progress', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
      if (r.ok) { this.dirty = false; localStorage.setItem(LAST_SAVED_KEY, String(clientUpdatedAt)); }
    } catch { /* retry on next change */ }
  }

  /**
   * The one place a telemetry POST happens. Safe to call as often as you like:
   * the uploader refuses anything inside its interval (or its urgent floor) and
   * the batch carries at most `maxRows` deduped rows per POST.
   */
  async sendTelemetry(keepalive = false): Promise<void> {
    await this.uploader.send(this.telemetry, { urgent: keepalive });
    // Attempts are their own table and ride the same cadence: one POST per
    // interval, one chunk of 50. They used to loop until the queue was empty,
    // which is another way to make many POSTs in one burst.
    if (!this.attemptsQueue.length) return;
    const now = Date.now();
    if (this.lastAttemptPostAt !== 0 && now - this.lastAttemptPostAt < TELEMETRY_INTERVAL_MS) return;
    this.lastAttemptPostAt = now;
    const chunk = this.attemptsQueue.splice(0, BATCH);
    const ok = await post('/api/drive/attempts', { attempts: chunk }, keepalive);
    if (!ok) this.attemptsQueue.unshift(...chunk);
  }

  /**
   * A PINK MENACE card pick → the server grades it and records it (drive_card_answers + parent log).
   * Returns the verdict, or null if the server couldn't be reached (the UI asks to retry).
   * option null = a dossier/beat: recorded as seen, nothing graded.
   */
  async gradeCard(cardId: string, optionId: string | null, source: 'story' | 'world', sceneId: string | null, msToAnswer: number): Promise<CardGrade | null | 'offline'> {
    try {
      const r = await fetch('/api/drive/card-answers', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ts: Date.now(), card_id: cardId, option_id: optionId, source, scene_id: sceneId, ms_to_answer: Math.round(msToAnswer) }),
      });
      if (!r.ok) return 'offline';
      const j = await r.json();
      return (j.graded as CardGrade) ?? null;
    } catch { return 'offline'; }
  }

  async flush(keepalive = false): Promise<void> {
    if (this.saveTimer != null) { window.clearTimeout(this.saveTimer); this.saveTimer = null; }
    await Promise.all([this.saveProgress(keepalive), this.sendTelemetry(keepalive)]);
  }

  stop(): void {
    this.unsub?.(); this.unsub = null;
    if (this.telemetryTimer != null) window.clearInterval(this.telemetryTimer);
    this.started = false;
  }
}

export const DriveSync = new Sync();
