# AGENT_LOG — Quiet Roads overhaul

Branch: `agent/overhaul-2026-09-30`. Never push/merge to main. Keep this file
current after every task.

## 2026-10-01 — Phase 1 (recon) + test/build foundations

### Assumptions recorded (no owner available)
- The drive client lives in `drive/` (confirmed: Vite base `/drive/`, builds to
  `public/game/drive`).
- "Source of truth" = the **text-only** PDF `docs/wa-driver-guide/Washington
  State Driver Guide text only.pdf`. Extracted to `guide_extracted.txt` (pypdf)
  so citations can be quoted verbatim.
- The operating date is used as the branch suffix: `agent/overhaul-2026-09-30`.

### What I did
1. Read the full guide (81 pp / 5 chapters) and indexed every section to the
   acts/cards/missions that teach it → `docs/wa-driver-guide/INDEX.md`
   (+ `guide_extracted.txt`).
2. Mapped the whole drive: entry (`App.tsx`), Rapier setup (fixed 1/60,
   `interpolate`, CCD on), `VehicleController` (arcade `setLinvel/angvel`),
   `DialogueRunner` ↔ `Simulation` ↔ graders, input pipeline, camera, HUD, audio,
   persistence, act registry.
3. Wrote `AUDIT.md` (architecture + Mermaid, per-act card→trigger→grade table,
   15 tagged problems, BLOCKED DECISIONS, sim baselines).
4. Wrote `ROADMAP.md` (P0 foundations → P3 polish).
5. Added a test/build harness:
   - `vitest` + `esbuild` + `@playwright/test` devDeps, `vitest.config.ts`,
     `playwright.config.ts`, `e2e/smoke.spec.ts`.
   - `test/grading.test.ts` (8 tests: stop/gap/yield/park/stopping-distance —
     **9/9 pass**).
   - `bench/sim-bench.test.ts` → `bench/baseline.json` (deterministic laps:
     sim step p50 ≈ 58–60 µs; stop distances captured).
6. Verified `tsc --noEmit` stays green (exit 0).

### Decisions / flags for the owner
- **BD-1** following-distance rule conflict (3 s vs guide "twice vehicle length").
- **BD-2** hand-signal citation (guided § not in text-only edition).
- P1..P15 problem log lives in `AUDIT.md §3`.

### Next
- Start P0: throttled HUD channel, then surface friction (gravel/wet), then WebGL
  context-loss handling. Each behind a named config, telemetry before/after.

---