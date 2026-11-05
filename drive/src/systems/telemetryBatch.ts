/**
 * telemetryBatch — one POST per interval, no matter what the sim emits.
 *
 * What went wrong on her phone (6.3, Vantage Bridge): `speed.over:45` was
 * emitted once per frame while she held 52–59 in a 45 zone — 1,693 rows in 23 s
 * — and the client answered with ~466 POSTs to `/api/drive/events` over the same
 * 23 s (one every ~50 ms) instead of the normal one batch per 10 s. Two faults:
 * the emitters were level-triggered (fixed in `sim/beats.ts` + `Simulation`),
 * and the uploader trusted whoever called it. `crashReport` posts immediately on
 * any error or long task, so one row per call was one POST per row.
 *
 * The uploader is now the only thing that decides when a POST happens:
 *
 *   - one POST per `intervalMs` — a caller can ask as often as it likes;
 *   - an urgent flush (a crash row, `pagehide`) may jump the interval but not
 *     the `minGapMs` floor;
 *   - identical (event, data) rows collapse into one row carrying `repeats`, so
 *     a flood is one line with a count, not 1,693 lines;
 *   - one POST carries at most `maxRows` rows; the rest wait for the next one.
 *
 * Pure and clock-injected, so `test/telemetry.test.ts` measures it in node.
 */
import type { TelemetryRow } from '@/stores/qrHud';

export type { TelemetryRow };

export const TELEMETRY = {
  /** The periodic batch. `DriveSync`'s timer runs at this rate. */
  intervalMs: 10_000,
  /** The floor between any two POSTs, including an urgent flush. */
  minGapMs: 5_000,
  /** Rows carried by one POST. The server slices the array at 50. */
  maxRows: 50,
  /** Events counted into one batch before dedupe — the hard cap on work. */
  maxEvents: 60,
} as const;

export interface TelemetryRowCounted extends TelemetryRow {
  /** How many identical rows this one stands for (written only when > 1). */
  count?: number;
}

/** The row as it goes on the wire: a repeat count rides in `data.repeats`. */
export function wireRow(row: TelemetryRowCounted): TelemetryRow {
  if (!row.count || row.count < 2) return { ts: row.ts, event: row.event, data: row.data };
  return { ts: row.ts, event: row.event, data: { ...(row.data ?? {}), repeats: row.count } };
}

export interface TakenBatch {
  rows: TelemetryRow[];
  /** Rows the count was folded out of — the flood, measured. */
  collapsed: number;
  /** Events refused because the batch was already at `maxEvents`. */
  dropped: number;
}

function keyOf(row: TelemetryRow): string {
  return `${row.event}\u0000${row.data ? JSON.stringify(row.data) : ''}`;
}

/**
 * The queue. `push` is cheap on purpose: the sim may call it thousands of times
 * between two uploads.
 */
export class TelemetryBatch {
  private readonly buckets = new Map<string, TelemetryRowCounted>();
  private events = 0;
  private dropped = 0;

  /** Distinct rows waiting. */
  get pending(): number {
    return this.buckets.size;
  }

  /** Events counted (repeats included) since the last `take`. */
  get counted(): number {
    return this.events;
  }

  push(row: TelemetryRow): void {
    const key = keyOf(row);
    const existing = this.buckets.get(key);
    if (existing) {
      existing.count = (existing.count ?? 1) + 1;
      this.events += 1;
      return;
    }
    if (this.events >= TELEMETRY.maxEvents) {
      this.dropped += 1;
      return;
    }
    this.buckets.set(key, { ts: row.ts, event: row.event, data: row.data, count: 1 });
    this.events += 1;
  }

  /** Put rows back after a failed POST. Counts are already folded, so they stay rows. */
  restore(rows: TelemetryRow[]): void {
    for (const row of rows) this.push(row);
  }

  /**
   * The next POST's payload, or null when there is nothing to send. Deduped,
   * ordered by first arrival, capped at `maxRows`; whatever does not fit stays
   * queued for the next interval.
   */
  take(): TakenBatch | null {
    if (!this.buckets.size) return null;
    const out: TelemetryRow[] = [];
    let collapsed = 0;
    for (const [key, bucket] of this.buckets) {
      if (out.length >= TELEMETRY.maxRows) break;
      this.buckets.delete(key);
      const n = bucket.count ?? 1;
      this.events -= n;
      collapsed += n - 1;
      out.push(wireRow(bucket));
    }
    if (!out.length) return null;
    const dropped = this.dropped;
    this.dropped = 0;
    return { rows: out, collapsed, dropped };
  }

  clear(): void {
    this.buckets.clear();
    this.events = 0;
    this.dropped = 0;
  }
}

export interface UploadResult {
  /** Events handed to the server by this call (0 when it was rate-limited). */
  events: number;
  /** Distinct rows one POST carried. */
  distinct: number;
  /** Rows folded into a repeat count. */
  collapsed: number;
  /** Events refused because the batch was already at its cap. */
  dropped: number;
  /** The call was refused because the interval had not elapsed. */
  skipped: boolean;
  /** The POST failed and the rows are back in the queue. */
  failed: boolean;
}

const NOTHING: UploadResult = { events: 0, distinct: 0, collapsed: 0, dropped: 0, skipped: true, failed: false };

/**
 * The clock and the POST are injected, so a test can emit 2,000 rows inside one
 * second and prove the client posted once.
 */
export class TelemetryUploader {
  private lastPostAt = 0;
  private posted = false;
  private inFlight = false;

  constructor(
    private readonly post: (rows: TelemetryRow[], opts: { urgent: boolean }) => Promise<boolean>,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /**
   * Ask for a batch. A normal call posts at most once per `intervalMs`; an
   * urgent one (a crash row, the page going away) may post between intervals but
   * never sooner than `minGapMs` after the last POST.
   */
  async send(batch: TelemetryBatch, opts: { urgent?: boolean } = {}): Promise<UploadResult> {
    const urgent = Boolean(opts.urgent);
    if (this.inFlight) return NOTHING;
    const t = this.now();
    const gap = this.posted ? t - this.lastPostAt : Infinity;
    if (gap < (urgent ? TELEMETRY.minGapMs : TELEMETRY.intervalMs)) return NOTHING;
    const taken = batch.take();
    if (!taken) return NOTHING;

    this.inFlight = true;
    this.lastPostAt = t;
    this.posted = true;
    let ok = false;
    try {
      ok = await this.post(taken.rows, { urgent });
    } catch {
      ok = false;
    } finally {
      this.inFlight = false;
    }
    if (!ok) {
      batch.restore(taken.rows);
      // A failed POST must not buy the next one a free slot.
      this.posted = false;
      return { events: 0, distinct: 0, collapsed: 0, dropped: 0, skipped: false, failed: true };
    }
    return {
      events: taken.rows.reduce(
        (n, r) => n + Number((r.data as { repeats?: number } | undefined)?.repeats ?? 1),
        0,
      ),
      distinct: taken.rows.length,
      collapsed: taken.collapsed,
      dropped: taken.dropped,
      skipped: false,
      failed: false,
    };
  }

  /** When the last POST went out (0 = never posted). */
  get lastPostMs(): number {
    return this.posted ? this.lastPostAt : 0;
  }
}

