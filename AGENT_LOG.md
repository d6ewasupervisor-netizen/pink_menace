# AGENT_LOG — Quiet Roads overhaul

Branch: `agent/overhaul-2026-09-30`. Production is `main` (ali.tactag.app).
Keep this file current after every task.

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

## 2026-10-01 — Act IV retest week is a drive

`local_loop_week` was a 10-question study set that fired `week.elapsed` when
the quiz ended. It is now a Kent drive. `retestPlan` reads `exam_weak_chapter`
and the missed questions' `guide_ref`s and picks one grade the guide already
states: school zone 20 (§4.17), four-way first-in (§4.13), back into the stall
(§4.18), hold the right lane (§4.16), the §5.2 gap behind the truck, or a full
stop at Meeker (§4.12) under 25 (§5.1). A chapter 1 miss does not invent a
license maneuver. `week.elapsed` fires only after the grade, and the dialogue
line plays with the car frozen. 12 retest tests. Vitest 36/36.

Playwright headed Chrome, mocked student, `?profileDrive`, both viewports.
Act I is on screen. Canvas up in under a second. Steady frame is a flat 30 Hz
(p50 33.3 ms, 1% low about 29.5 fps). Draw calls read as 1 because the sample
lands on the postprocessing blit.

## 2026-10-01 — correction (grid cues were not on the bus)

`CardCues` listed II-015 / II-016 / II-017 / II-021 / II-022, and the coverage
test repeated that list, so both stayed green. `GridRun` was still constructed
with `this.ev.fire`, which never calls `CardCues.onEvent`. The grade events
(`backing.start`, `lanechange.start`, `park.parallel.start`) reached telemetry
and the cards did not. Grid now uses the wrapped `fire`. `teaching.test.ts`
steps those three missions and requires `card.cue:*`. Reduced motion also
clears a shake already in progress.

Production deploys from `main` (ali.tactag.app). The five local commits after
`c2de6ac` were not on `main` and were not deployed.

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

## 2026-10-04 — remaining overhaul, one pass (P13, P9, P8, P14, P12, P3)

Branch `agent/overhaul-2026-09-30` only. Nothing pushed, nothing deployed, no
production files touched, `main` untouched.

Each item below was checked with `npm test` (vitest run) and `npx tsc --noEmit`
from `drive/`; items 3, 4 and 9 also ran `npm run build`.

| # | Item | Files | Check | Result |
|---|---|---|---|---|
| 1 | P13 — no allocation on the physics step | `sim/vehicleObserver.ts`, `sim/Simulation.ts`, `sim/zones.ts`, `systems/QuietRoadsBridge.ts`, `test/alloc.test.ts` | `npm test` + `npx tsc --noEmit` + `npm run bench` | 41 tests pass, tsc 0. Two consecutive samples keep one prev-object identity. Sim step p50 neutral-to-better on an interleaved A/B; stopping distances unchanged. |
| 2 | P9 — CCD telemetry | `quietroads/config.ts`, `sim/vehicleObserver.ts`, `sim/Simulation.ts`, `test/ccd.test.ts` | `npm test` + `npx tsc --noEmit` | 48 tests pass, tsc 0. 0 tunnels at top speed on dry/gravel/wet/ice; 74.7 / 89.8 / 103.0 / 264.4 m unchanged. |
| 3 | P8 — quality tiers | `utils/performance.ts`, `Game3D/PostProcessing.tsx`, `Game3D/Game3D.tsx`, `test/quality.test.ts` | `npm test` + `npx tsc --noEmit` + `npm run build` | 62 tests pass, tsc 0, build green (810 modules). One DPR owner; high→mid→low on sustained slow frames, recovers on fast; low mounts 1 effect vs high 7. No FPS claim. |
| 4 | P14 — Kent draw merge | `sim/instancing.ts`, `Game3D/KentWorld.tsx`, `Game3D/ContinuousRoad.tsx`, `test/instancing.test.ts` | `npm test` + `npx tsc --noEmit` + `npm run build` | 70 tests pass, tsc 0, build green (811 modules). 42 plain buildings → 4 instanced batches; collider count one per building. |
| 5 | P12 — accessibility | `input/driveInput.ts`, `input/textSize.ts`, `stores/gameStore.ts`, `hooks/useTouchControls.ts`, `Game3D/PauseMenu.tsx`, `Game3D/DialogueBox.tsx`, `Game3D/CardOverlay.tsx`, the HUD type, `test/accessibility.test.ts`, `test/spoken.test.ts` | `npm test` + `npx tsc --noEmit` | 90 tests pass, tsc 0. Defaults resolve to the current arrows/WASD/Space behaviour; a rebound steer key is honoured; reset restores. Every spoken line already has text, so `DialogueBox` was left alone. |
| 6 | Debrief on a grade event | `quietroads/debrief.ts`, `Game3D/GradeDebrief.tsx`, `systems/QuietRoadsBridge.ts`, `test/debrief.test.ts` | `npm test` + `npx tsc --noEmit` | 95 tests pass, tsc 0. Model yields PASS/MISS, card id and `source.dol_section`; closing emits nothing and never `week.elapsed`. |
| 7 | P15 — II-006 / II-012 on the road | `data/dialogue_act3.json`, `sim/cardCues.ts`, `test/coverage.test.ts`, `test/teaching.test.ts` | `npm test` + `npx tsc --noEmit` | 95 tests pass, tsc 0. Coverage still zero-missing for acts I, II, III, V, VI. |
| 8 | P11 — close the id | `AUDIT.md` only | search of the client for id validation | Nothing rejects the suffix; the deck is a `Map` keyed by the literal id. No code change, one AUDIT line. |
| 9 | P3 — bundle split + context edges | `quietroads/dialogue/actDialogue.ts`, `sim/actResources.ts`, `systems/glContext.ts`, `systems/QuietRoadsBridge.ts`, `Game3D/Game3D.tsx`, `Game3D/QuietSwarm.tsx`, `Game3D/RoadChunks.tsx`, `test/bundle.test.ts` | `npm test` + `npx tsc --noEmit` + `npm run build` | 110 tests pass, tsc 0, build green. 10 act dialogue chunks split out; entry 4,145 kB → 3,957 kB; Act I still in the first load. Double-loss `prePausePhase` rule is a pure function. |
| 10 | Touch + audio (verify) | `Game3D/Game3D.tsx`, `systems/AudioManager.ts` | `npm test` + `npx tsc --noEmit` + `npm run build` | 111 tests pass, tsc 0, build green. Root gained `overscroll-behavior: none`; `AudioContext.resume()` now runs inside the same first-gesture handler as `init()`. `TouchOverlay` and the stick untouched. |

### Notes

- `bench/baseline.json` was regenerated only by running `npm run bench`, never
  by hand. The whole machine was running ~15% slower than when the file was
  last recorded, so an interleaved stash/unstash A/B was used to compare
  before/after rather than reading absolute numbers.
- **The browser `?profileDrive` run was not repeated.** No headed browser was
  run in this pass; the 2026-10-01 result (a flat 30 Hz window clock, p50
  33.3 ms, both viewports) stands as the last browser measurement.
- Deliberately untouched: `VehicleController` setLinvel/angvel and its feel
  constants, Act VII, backend/auth/parent dashboard/DRIVE_ENABLED, story voice,
  card image paths and `cards/takes` filenames, the `IV-001-brake` id, and the
  existing touch-stick shaping.

## 2026-10-04b - campaign act boundaries, cues on the skill, the week grade, graphics honesty

Branch `agent/overhaul-2026-09-30` only. Nothing pushed, nothing deployed, no production files touched, `main` untouched.

The previous pass ended 111/111 green. That was not a campaign proof, and this pass is about the four things it did not check. Checked with `npm test`, `npx tsc --noEmit` and `npm run build` from `drive/`.

### What was actually broken

| # | Problem | Fix | Files |
|---|---|---|---|
| 1 | The campaign could not change scenes. `startScene` throws on any scene whose act is not fetched, only Act I ships in the entry chunk, and `scene_finished` called `startScene(next)` directly. Every handoff landed on the throw: 1.4b->2.1, 2.4->2.5, 2.5->3.1, Ribbon->4.1, exam->5.1, 6.3->7.1 | New `sceneRouter.prepareScene`/`gotoScene`: load the act that owns the destination, await it, then start. The bridge routes both the handoff and `open()` through it. Pure over `(runner, sceneId)` so it is testable headlessly | `quietroads/dialogue/sceneRouter.ts`, `systems/QuietRoadsBridge.ts` |
| 2 | V-006 is in `dialogue_act7.json` scene 7.1, `actForSceneId("7.1")` returns VI, but the act7 file rode the closed Act VII loader, so the Act 6 -> 7 jump had no destination | `dialogue_act7.json` moved to the Act VI load. `dialogue_act8.json` stays on Act VII and `loadAct` refuses it, so Act VII is unreachable by construction | `quietroads/dialogue/actDialogue.ts` |
| 3 | The 7.3 -> 8.1 jump would throw "Dialogue scene missing: 8.1" | `gotoScene` returns false for a closed act; the bridge shows a toast and stops the campaign. No throw, Act VII never fetched | `sceneRouter.ts`, `QuietRoadsBridge.ts` |
| 4 | Act select was dead. `open()` asked `runner.hasScene(which)` *before* loading the act, so every act not already in the entry chunk fell through to `0.1` | `open()` resolves the requested id and lets the router fetch what it needs. `startAct` now starts 2.1 / 2.5 / 4.1 / 3.1b / 6.1b | `systems/QuietRoadsBridge.ts` |
| 5 | `nextAct("III")` answered `"V"`, which walked 2.5 -> 3.1 and skipped the exam at 4.1 - no act-order chain can name 3.5 -> 4.1 | The debrief preloads the act owning the current scene's own `next_scene`. `nextAct` is gone | `actDialogue.ts`, `sceneRouter.ts`, `QuietRoadsBridge.ts` |
| 6 | Eight cards were cued from a timer or a bare coordinate, so a drive that never did the skill still saw them: II-012 / III-005 / III-009 on the *too close* grade; II-019 on 4 s of dry motion; II-025 on 2 s of the night straight; II-026 on the back-in grading; III-008 at `pos.y > 120`; VI-003 only after leaving the road | Each moved onto the beat it teaches: `ledger.follow.start`, `p.onIce`, a reverse, `dropoff.walk`, `ledger.crossed_solid`, `rural.edge`. III-010 stays on the `follow.close` grade. Four new Ledger beats (`alongside`, `pass.clear`, `wet.enter`, `rumble.ride`) carry the Act III sharing cluster, so no Act III card is on a duration or a coordinate any more | `sim/cardCues.ts`, `sim/ledger.ts`, `sim/rural.ts`, `sim/Simulation.ts` |
| 7 | `coverage.test.ts` treated a hardcoded id list as proof - it could not tell a card that opens on the skill from one that opens on a timer | Coverage now consumes a set **measured** by driving the missions (`test/observedCues.ts` collects the `card.cue:` events that reach the bus). `teaching.test.ts` asserts each id both fires on the skill and stays shut without it | `test/coverage.test.ts`, `test/observedCues.ts`, `test/teaching.test.ts` |
| 8 | The debrief listened for `week.grade.pass` / `week.grade.miss`, which nothing emits; `RetestWeek.step` returns a boolean and `Simulation` fires `week.elapsed` | `RetestWeek` records the result it already decided, and `week.elapsed` carries it as data. **No second week-end event.** Closing still emits nothing | `sim/retestWeek.ts`, `sim/Simulation.ts`, `quietroads/debrief.ts`, `Game3D/GradeDebrief.tsx` |
| 9 | `maybeDebrief` returned early when no card was cued, so a grade with no cue showed nothing at all | The card is the citation, not the verdict. `buildDebrief` builds without one and the UI omits the card rows. The Act IV week is exactly this case | `quietroads/debrief.ts`, `Game3D/GradeDebrief.tsx`, `QuietRoadsBridge.ts` |
| 10 | Two DPR writers: the Canvas `dpr` prop and drei's `<AdaptiveDpr>`, which calls R3F's own `setDpr()` on its own schedule. A no-op `<PerformanceMonitor>` sat beside them | `<AdaptiveDpr>` and `<PerformanceMonitor>` removed. The Canvas `dpr` prop is the only writer; `GLContextGuard` re-applies the tier's ratio once on a context restore | `Game3D/Game3D.tsx` |
| 11 | A 30 Hz panel could fall to `low` and never climb back: the reducer demoted over 33.4 ms but needed under 18.2 ms to recover, and a panel locked at 30 Hz can never produce an 18.2 ms frame | One threshold: slow = over `SLOW_FRAME_MS`, recovered = not slow. The high -> mid -> low reducer, hold times and demotion behaviour are unchanged; a genuinely slow panel still walks down and stays | `utils/performance.ts`, `test/quality.test.ts` |
| 12 | The draw-call sample of 1 was the postprocessing blit: three resets `gl.info` per `renderer.render` and `EffectComposer` renders once per post pass with a fullscreen blit last | Sampled from the Kent scene pass via `attachScenePassProbe` (`onAfterRender`), where the counters are still the scene's | `utils/performance.ts`, `Game3D/KentWorld.tsx`, `Game3D/Game3D.tsx` |
| 13 | The CCD "0 tunnels" result could not fail: a legal 1/60 step at top speed is ~0.55 m against a 1.5 m threshold | The suite asserts a step *larger* than the threshold emits `ccd.tunnel`, that a legal 1/60 step at top speed does not, and that the margin is wide. The four-surface lap stays as a regression net, labelled as such | `test/ccd.test.ts` |

### Tests added

- **Act boundary chain** (`test/bundle.test.ts`) - walks all 26 playable `next_scene` handoffs on a real `DialogueRunner`, asserting each destination is present **and started**, that `7.1.card_V-006` resolves inside scene 7.1, that all five `ACT_ENTRY` scenes start (none falls back to `0.1`), and that the 7.3 -> 8.1 handoff ends rather than throws. A test that only calls `loadAct` and checks a scene id in the returned JSON is not one of these.
- **Cues fire on the skill and not on a timer** (`test/teaching.test.ts`) - two-sided per card: a drive that performs the beat fires `card.cue:<id>`, a drive that never performs it does not.
- **Coverage measured, not listed** (`test/observedCues.ts`) - drives the missions and collects what the bus actually emitted.
- **The week grade** (`test/debrief.test.ts`) - `week.elapsed` carries `grade: pass|miss`, a grade with no cued card still reads, and a malformed payload shows no panel rather than inventing a PASS.
- **30 Hz recovery** (`test/quality.test.ts`) - a flat 33.4 ms cadence does not walk the tier down, and a tier that fell to `low` on a stall climbs back.
- **Scene-pass draw calls** (`test/quality.test.ts`) - the probe reports the scene pass, not the blit.
- **CCD both ways** (`test/ccd.test.ts`) - see row 13.

### Notes

- **`bench/baseline.json` was restored, not regenerated.** No physics change landed in this pass, so 74.7 / 89.8 / 103.0 / 264.4 m still hold. Re-recording would only churn step timings that move with machine load, and the file is not hand-edited.
- **No headed browser ran in this pass.** No `?profileDrive` lap, no frame rate, no draw-call number. The old "30 / 29.6" was the sample window's own 30 Hz clock and is withdrawn as a result; the old draw-call 1 was the postprocessing blit and is now sampled from the right place, but nobody has read it on real hardware.
- The 30 Hz recovery fix is verified headlessly against a pure reducer. No 30 Hz display was available to watch climb back in the flesh.
- Deliberately untouched: `VehicleController` setLinvel/angvel and its feel constants, `FOLLOW.rule` staying `"seconds"`, Act VII (`dialogue_act8.json` stays unloaded and is now refused), backend/auth/parent dashboard/DRIVE_ENABLED, the `IV-001-brake` id, card image paths, and the existing touch-stick shaping.

### Still open
The browser `?profileDrive` pass and the full-campaign playthrough (both need a device + backend). Deac's on-road behaviour and one tone of voice across acts - both left open in ROADMAP.

---

### Measured, this pass

- `npm test`: **151/151** across 14 files (was 111/111 across 13).
- `npx tsc --noEmit`: exit 0.
- `npm run build`: green, **818 modules**, 5.68 s. Entry chunk 3,957 kB (unchanged by this pass) with the same 10 act dialogue chunks split out.
- Act-boundary handoffs covered: 26. Cards cued on a timer or coordinate: 0. Act-select entry scenes reachable: 5 of 5.
- Stopping distances: unchanged. Frame rate: not measured. Draw calls: not measured.

---

## 2026-10-05 — P3: Deac's on-road behaviour matches the story

Branch `agent/overhaul-2026-09-30`. Commit `9c84d85`.

### The finding

ROADMAP P3 listed two items still open. This pass took the falsifiable half of
the first: *"Deac's on-road behaviour matches the story."*

III-001 **"Your Wheel"** is hand-written, not generated — `pack/00_README.md:44`
says so explicitly, and that is why it is worth holding the code to. Scene text:
*"He will sweep the glass, hold the lane, then take one merge late on purpose so
you can watch what that costs."* Debrief: *"You saw the merge you do not take.
He spent another man's margin to keep his."* III-013 ("Twenty-Six, None
Preventable") is the same act from his side.

`LedgerRun.advanceLead` moved the truck in a dead-straight line at constant
18 mph from `lead.from` to `lead.to` and **never changed lane**. `leadHeading`
was assigned `Math.PI / 2` in `reset()` and never touched again, so even if he
had moved laterally the model in `KentWorld` would have crabbed down the road
with its nose pointed south. The merge both cards are written about did not
exist on the road.

Second defect, in the cue table: III-013 was cued on `ledger.merge.slow`, which
is the **player** rolling onto the ramp under 12 mph. The comment above it read
*"Deac took one merge late and never wrote a preventable. The late merge IS the
beat."* Comment and code were describing different actors — the card opened on a
beat it was not written about and stayed shut through the one it was.

### What changed

1. **`sim/ledger.ts` — the merge exists now.** A named `DEAC` block holds his
   drive script, measured from `merge.y` so retuning the corridor moves him with
   it: arm out `signalLeadM` north of the taper, then hold the right travel lane
   until `mergeStartFrac` = 0.6 *into* the taper before ramping into lane 1.
   That lateness is the lesson, and the comment says so — moving it earlier would
   be "fixing" him and would make both cards wrong.
2. **Heading comes from real displacement**, so he turns through the merge.
3. **`cardCues.ts`**: III-013 moved onto `deac.merge.late`, the beat its own
   comment named.
4. **`test/deac.test.ts`** — new, 12 tests, two-sided throughout.
5. **`test/observedCues.ts`** — Act III gained a drive that actually rides behind
   Deac to the taper. The existing run exercised every player skill on Central but
   stopped around y≈118, short of the lane drop, so it could not witness the merge.
   It is also the only proof the witness gate lets a legitimate player through.
6. **Two bugs I introduced and then fixed**, both worth recording because the
   first is a trap:
   - Applying the lateral offset to an in-place-accumulated `leadPos` was undone
     every step by the pre-existing clamp `if (proj > L) this.leadPos = { ...to }`
     — `to` is the lane he *started* in, so he arrived in lane 1 and was
     teleported back to lane 0, which also made `ledger.alongside` fire on a
     3.3 m teleport. Fixed by making distance-along-corridor the single source of
     truth and re-deriving x/y from it, rather than accumulating and correcting.
   - `trackSharing` measured alongside-ness on a raw world-axis `dy`, correct only
     because he drove perfectly straight. Now projected into his heading frame,
     which is what `ALONGSIDE_DX_M`'s own comment ("lateral band around the lead's
     lane") always claimed.

### Measured, this pass

- `npm test`: **163/163** across 15 files (was 151/151 across 14; +1 file, +12 tests).
- `npx tsc --noEmit`: exit 0.
- `npm run build`: green, 818 modules, entry chunk 3,958 kB (was 3,957).
- Act III sim step p50, interleaved A/B, 3 runs each: with-change
  **60.1 / 60.2 / 60.6 µs** vs baseline **61.0 / 62.4 / 60.3 µs**. No regression.
  A single earlier reading of 68.2 µs was machine load, not the change — every row
  including untouched Act II/V/VI rose together.
- Stopping distances **byte-identical**: 74.7 / 85.6 / 102.6 / 89.8 / 103.0 /
  264.4 m. No physics touched.
- The bench lap now records `deac.signal → deac.merge.late → card.cue:III-013`
  in that order — the merge and the card written for it, from a deterministic run.

### Still open

- **Quiet pressure tied to the graded skill** — the other half of the P3 bullet.
  Not started. The Quiet/Noise system is Act I–II only (`mission_jonah_intersection`
  is the one driving-mission hook); nothing in Acts III/V/VI reads awareness. The
  obvious reading of "reinforce, don't add chaos" is that Act III's noise should
  feed the gap grader, but that is a design call, not a mechanical one, and it
  wants an owner.
- **One tone of voice / one UI / one audio palette across acts** — untouched.
- The browser `?profileDrive` pass and the full-campaign playthrough still need a
  device + backend. **No headed browser ran in this pass**, so there is still no
  frame-rate or draw-call number to quote.
- *Recorded, not fixed:* the Act III lane convention reads oddly against the
  render. `KentWorld.LedgerMarks` calls `x0 + 1/3 span` "between right + middle"
  while `laneIndex` counts up from `x0`, so `trackLane`'s `li === 2` "passing
  lane" is the lane *nearest the right boundary* — the two disagree about which
  side is which. Predates this pass and deliberately left alone; noted in AUDIT.md
  rather than silently retuned, because flipping it would move every Act III grade.

---

## 2026-10-04c — handoff rule is the same in every workspace

The three files at the repo root stay the memory: `AGENT_LOG.md`, `ROADMAP.md`, `AUDIT.md`. A new chat reads them first. After a task, the log gets a dated entry and the other two move only when the next work or the open problems move.

The instruction now sits in the user-level rule files Cursor, Cline, and Claude Code load for every workspace, and the copy in this repo matches that text. No second memory file.
