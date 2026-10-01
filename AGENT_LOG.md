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

### Phase 3 (execution) — first three items
1. **[teaching] gravel surface friction** (`vehicleObserver.MU.gravel=0.5`,
   `Simulation.surfaceMu()`). The backcountry run + the Ritzville escort now ride
   gravel, so the stopping shadow stops lying on unpaved road. Before: beetle dry
   55 mph stop 74.7 m; after: 89.8 m (gravel). Ice stays 264.4 m; wet remains an
   unused named value (no rain/wet corridor in the drive yet — recorded). 11/11
   tests pass, `tsc` green. Violated-rule check: guide §5.6/§4.15 support it.
2. **[ux] act select** (`MainMenu`) — lists Acts I–VI from `ACT_ORDER` /
   `ACT_CHALLENGES` and jumps to each act's first scene via the bridge's existing
   `startAct(ACT_ENTRY[act])`. A new run no longer forces Act I replay;
   I–III are replayable. `tsc` green.
3. **[latency] WebGL context-loss** (`Game3D.GLContextGuard`) — on
   `webglcontextlost` pause the sim (preserve `prePausePhase`) + telemetry + a
   resume prompt; on `webglcontextrestored` clear it. No silent black screen.

### Next
- Throttle the HUD speed/RPM channel (P5) — needs a browser baseline to prove the
  re-render win before landing.
- Wire the remaining in-scene cards (P4: Act II 20, Act III 24, Act V 5, Act VI 5).
- Continue the P0 config consolidation (one named tuning file).

## 2026-10-01 — owner: fix the open list

### What changed
1. **BD-1.** `drive/src/quietroads/config.ts` (`FOLLOW.rule`, default `seconds`).
   Graders call `followFullGapM`. Teaching copy on II-012, V-012, II-014, the
   Ledger/convoy/escort objectives, and the fallback quiz leads with guide §5.2
   ("at least twice the length of your vehicle"). The seconds count is how you
   hold that gap. II-012 and V-012 cite 5.2 Space.
2. **BD-2.** Hand-signal `dol_section` strings now say `4.14 Turning`.
3. **Wet.** Ledger south of `solidY` uses μ 0.4. Beetle wet stop at 55 mph is 103.0 m.
4. **Cards.** `CardCues` offers the previously unopened II (20), III (23), V (5),
   and VI (5) cards on the mission beat for that skill. The bridge queues
   `card.cue:<id>` and shows one at a time, 2.5 s after the last one closes.
5. **HUD.** `liveDrive` is the 60 Hz channel. `gameStore` speed/RPM publish at 10 Hz.
6. **Deck.** Removed the leaked `art-review-state` object from the client `cards.json`.
   The review file at `cards/art-review-state.json` is untouched.

### Check
- `npx vitest run` — 14/14 (grading 10, teaching 3, bench 1).
- `tsc --noEmit` — exit 0.
- Baseline regenerated: `drive/bench/baseline.json` (ledger p50 55.6 µs). Step
  times are not stable across runs; the JSON is the diff source.
- Browser `?profileDrive` was not run. No device pass this session.

### Still open
P8, P9, P11–P15, the Act IV missed-question road.

---

## 2026-10-01 — continuation (reduced motion + coverage + final report)

Verified the post-`9982d8e` state is green: 14→17 tests, `tsc` exit 0, `vite
build` green (809 modules, 4.06 s). Merged the caretaker commits (`9982d8e`,
`.clinerules`) onto `agent/overhaul-2026-09-30`; never wrote to `main`.

1. **[a11y] reduced-motion / camera-shake toggle.** `gameStore.reducedMotion`
   (persisted) plus a PauseMenu toggle. `triggerScreenShake` and camera drift
   are gated on it, and a `prefers-reduced-motion` listener auto-raises it.
   Commit `04f4b6a`. (P12, partial)
2. **[test] card-coverage invariant.** `coverage.test.ts` scans dialogue +
   `CARD_FOR_TRIGGER` + the CardCues list and asserts every card in acts
   I/II/III/V/VI opens in-scene. Caught that the first scan omitted the
   act7/act8 dialogue files (V-006 lives in `act7.json:7.1`); fixed. Commit
   `bbb36e9`. (Definition-of-Done check)
3. **[docs] FINAL_REPORT.md** — executive summary, before/after metrics,
   card-to-trigger-to-grade, coverage summary, scorecard, accuracy fixes, physics
   config old→new, what failed, BLOCKED DECISIONS, backlog.

### Still open (unchanged)
Act IV missed-question road; P8/P9/P13/P14 + remaining a11y; browser `?profileDrive`
benchmarks and the full-campaign playthrough (need a device + backend).

---