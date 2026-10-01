# Benchmark harness for the /drive (Quiet Roads) client

Two halves, because a teaching drive has a deterministic *sim* layer and a
non-deterministic *render* layer.

## 1. Deterministic sim bench (headless, no GPU)

`bench/sim-bench.test.ts` (a Vitest test) replays a scripted input lap through
each act's mission grader on a fixed 1/60 s step and records:

- step count and per-step CPU cost (µs p50 / p95 / max),
- which grade events fired (did the stop / gap / yield / merge checks fire correctly),
- the stopping-distance contract per chassis & surface at 55 mph.

Run it:

```sh
cd drive
npx vitest run bench
```

Output: `bench/baseline.json`. Commit this after every physics/teaching change so
the before/after telemetry is reproducible. The numbers are CPU-cost and
deterministic-event baselines — they are **not** a GPU/FPS proxy (see below).

## 2. Browser perf (GPU) — instrumented client

Open the drive with `?profileDrive` and read `window.__drivePerf()` in the console.
It reports p50/p95/p99 for `frameMs`, `vehicleMs`, `missionMs`,
`previousDrawCalls`, `previousTriangles` (see `src/utils/performance.ts`).

Manual browser protocol (run at desktop 1280×720 and a throttled mobile portrait
profile, ~390×844, CPU 4× / network "Good 3G"):

1. Load `/<drive>/drive/?profileDrive`. Record **time-to-first-frame** (the
   `useProgress` boot bar to 100%) and JS heap (`performance.memory`).
2. Start Act I, drive one scripted lap, then call `__drivePerf()`.
3. Record average FPS (from `frameMs` p50), 1% low (p99), draw calls, triangles.
4. **Input-to-visible-response**: on the lap, log
   `performance.now()` at the keydown and at the next frame that changes
   `vehiclePosition`; the delta is the input-to-response latency.

These browser numbers go into `AUDIT.md` §5 after a measured run on the branch.