/**
 * The client's telemetry uploader: one POST per interval, whatever the sim emits.
 *
 * The 6.3 HAR: `speed.over:45` fired every frame (1,693 rows in 23 s) and the
 * client opened 466 POSTs in the same 23 s — one per ~50 ms — because
 * `crashReport` posted from `report()` and the drain loop posted per chunk. The
 * emitters are fixed in `sim/beats.ts`; this file proves the uploader cannot be
 * made to flood even if every emitter regresses.
 */
import { describe, expect, it } from 'vitest';
import { TELEMETRY, TelemetryBatch, TelemetryUploader, wireRow } from '../src/systems/telemetryBatch';

type Row = Parameters<TelemetryBatch['push']>[0];

const row = (event: string, ts = 1, data?: Record<string, unknown>): Row => ({ ts, event, data });

/** A clock a test drives by hand, and a POST that only counts. */
function harness(ok = true) {
  let now = 0;
  const posts: { at: number; rows: Row[]; urgent: boolean }[] = [];
  const uploader = new TelemetryUploader(async (rows, opts) => {
    posts.push({ at: now, rows, urgent: opts.urgent });
    return ok;
  }, () => now);
  const batch = new TelemetryBatch();
  return {
    batch,
    posts,
    uploader,
    at(ms: number) { now = ms; },
    now() { return now; },
    /** Flip the POST's answer mid-test. */
    setOk(next: boolean) { ok = next; },
  };
}

describe('the batch collapses a flood into counts', () => {
  it('2,000 identical rows are one row with a repeat count', () => {
    const batch = new TelemetryBatch();
    for (let i = 0; i < 2000; i++) batch.push(row('speed.over:45', i, { mph: 56, limit: 45 }));
    const taken = batch.take();
    expect(taken).not.toBeNull();
    expect(taken!.rows).toHaveLength(1);
    expect(taken!.rows[0].data).toEqual({ mph: 56, limit: 45, repeats: 2000 });
    expect(taken!.collapsed).toBe(1999);
    expect(batch.pending).toBe(0);
  });

  it('distinct events keep their first timestamp and their order', () => {
    const batch = new TelemetryBatch();
    batch.push(row('wind.gust', 10));
    batch.push(row('steer.into_wind', 20));
    batch.push(row('wind.gust', 30));
    const taken = batch.take()!;
    expect(taken.rows.map((r) => r.event)).toEqual(['wind.gust', 'steer.into_wind']);
    expect(taken.rows[0].ts).toBe(10);              // first arrival wins
    expect(taken.rows[0].data).toEqual({ repeats: 2 });
  });

  it('a single row is sent exactly as it was recorded', () => {
    const batch = new TelemetryBatch();
    batch.push(row('mission.start:vantage_bridge_crossing', 5));
    expect(batch.take()!.rows).toEqual([{ ts: 5, event: 'mission.start:vantage_bridge_crossing', data: undefined }]);
  });

  it('a POST carries at most maxRows distinct rows; the rest wait', () => {
    const batch = new TelemetryBatch();
    const extra = 5;                             // stay under maxEvents so nothing is dropped
    for (let i = 0; i < TELEMETRY.maxRows + extra; i++) batch.push(row(`ev:${i}`, i));
    const first = batch.take()!;
    expect(first.rows.length).toBe(TELEMETRY.maxRows);
    expect(batch.pending).toBe(extra);
  });

  it('never queues more than maxEvents distinct events between uploads', () => {
    const batch = new TelemetryBatch();
    for (let i = 0; i < TELEMETRY.maxEvents + 25; i++) batch.push(row(`ev:${i}`, i));
    expect(batch.counted).toBe(TELEMETRY.maxEvents);
    expect(batch.take()!.dropped).toBe(25);
  });

  it('wireRow is the only place a count reaches the wire', () => {
    expect(wireRow({ ts: 1, event: 'a', count: 1 })).toEqual({ ts: 1, event: 'a', data: undefined });
    expect(wireRow({ ts: 1, event: 'a', data: { x: 1 }, count: 3 })).toEqual({ ts: 1, event: 'a', data: { x: 1, repeats: 3 } });
  });
});

describe('one POST per interval, however often it is asked', () => {
  it('2,000 emits in one second produce exactly one POST', async () => {
    const h = harness();
    h.batch.push(row('mission.start:vantage_bridge_crossing', 0));
    await h.uploader.send(h.batch);              // the timer's first tick
    expect(h.posts).toHaveLength(1);
    for (let i = 0; i < 2000; i++) {
      h.at(100 + i / 2);                         // 2,000 rows inside the first second
      h.batch.push(row('speed.over:45', i, { mph: 56 }));
      await h.uploader.send(h.batch);            // a caller that panics and asks every row
    }
    expect(h.posts).toHaveLength(1);             // ...and the client posted once
    h.at(TELEMETRY.intervalMs);
    await h.uploader.send(h.batch);
    expect(h.posts).toHaveLength(2);
    expect(h.posts[1].rows).toHaveLength(1);     // collapsed to a single row...
    expect((h.posts[1].rows[0].data as { repeats: number }).repeats).toBe(2000); // ...with the count
  });

  it('the timer posts once per interval, and rows keep flowing after it', async () => {
    const h = harness();
    for (let second = 0; second <= 30; second++) {
      h.at(second * 1000);
      h.batch.push(row(`tick:${second}`, second * 1000));
      await h.uploader.send(h.batch);
    }
    // 31 s of rows at a 10 s interval: one at 0, 10, 20, 30 = 4.
    expect(h.posts.map((p) => p.at)).toEqual([0, 10_000, 20_000, 30_000]);
  });

  it('an urgent flush may jump the interval but not the floor', async () => {
    const h = harness();
    h.batch.push(row('mission.start:x', 0));
    await h.uploader.send(h.batch);
    expect(h.posts).toHaveLength(1);

    h.at(1_000);
    h.batch.push(row('client.stall', 1_000, { ms: 3_000 }));
    await h.uploader.send(h.batch, { urgent: true });   // inside the 5 s floor
    expect(h.posts).toHaveLength(1);

    h.at(TELEMETRY.minGapMs);
    await h.uploader.send(h.batch, { urgent: true });
    expect(h.posts).toHaveLength(2);
    expect(h.posts[1].urgent).toBe(true);
    expect(h.posts[1].rows[0].event).toBe('client.stall');
  });

  it('a failed POST puts its rows back and buys no free slot', async () => {
    const h = harness(false);
    h.batch.push(row('a', 0));
    const res = await h.uploader.send(h.batch);
    expect(res.failed).toBe(true);
    expect(h.batch.pending).toBe(1);
    // The next attempt is allowed immediately (nothing reached the server)...
    await h.uploader.send(h.batch);
    expect(h.posts).toHaveLength(2);
    // ...and once one succeeds, the interval applies again.
    h.setOk(true);
    await h.uploader.send(h.batch);
    expect(h.posts).toHaveLength(3);
    h.batch.push(row('b', 1));
    await h.uploader.send(h.batch);
    expect(h.posts).toHaveLength(3);
  });
});
