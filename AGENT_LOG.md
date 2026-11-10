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

---

## 2026-10-05b — check of the Deac pass (`9c84d85`, docs `3555448`)

Branch `agent/overhaul-2026-09-30`, two commits ahead of origin, tree clean. Re-ran from `drive/`: `npm test` **163/163** across 15 files, `npx tsc --noEmit` exit 0. Did not rebuild, so the entry-chunk size was not re-measured. The commit says 3,958 kB. `AUDIT.md` had been left at 3,957 kB.

Held up: `DEAC` in `sim/ledger.ts` (arm at 4 m, merge starts at 0.6 of the taper, into lane 1, witness gate 45 m). Heading is `atan2` of the step displacement. III-013 opens only on `deac.merge.late`. `test/deac.test.ts` has 12 tests. III-001's scene text is the late-merge line. The truck speed is 18 mph, from `kentMap` `lead.speedMph`. Stopping distances in `bench/baseline.json` match the previous commit.

Did not hold up as written:

- The bench file was **regenerated**, not restored. `generated_at` is `2026-10-05T06:44:19Z`. Event order changed. Committed Central p50 is **67.7 µs** (was 60.2). The log's 60.1 / 60.2 / 60.6 µs runs are not in the file.
- **P19 is not a mirror.** Lanes are x 260–270, three wide. Index 0 is the right lane (the 1/3 line, and the spawn commented "right lane" at x 261.67). Index 2 is the left lane, which is the passing lane. Do not flip it.
- III-001 the card still opens on the player's `ledger.lanechange.start`. Only III-013 moved onto Deac's merge. Leave III-001 there.
- The witness gate is `DEAC.witnessM` = 45 m, not 100 m.

Still open, and still not this check: quiet pressure tied to the graded skill, one tone of voice across acts, and a headed `?profileDrive` run.

---

## 2026-10-05c — owner decisions: BD-1 signed off, misses wake the Quiet, one voice/interface

Branch `agent/overhaul-2026-09-30`, not merged, not pushed, `main` untouched.
Re-ran from `drive/`: `npm test` **172/172** across 17 files (+2 files, +9 tests),
`npx tsc --noEmit` exit 0. `bench/baseline.json` is byte-identical: the bench test
rewrites it on every `npm test`, no physics constant changed here, so the run's
copy was restored, not committed.

### 1. BD-1 — following distance: SIGNED OFF (no code change)

Owner decision: `FOLLOW.rule` stays `"seconds"` (3 s dry, 4 s behind a truck).
Do not switch the grader to `vehicle_lengths`. The teaching copy already leads
with the guide's own sentence ("Leave a distance that's at least twice the length
of your vehicle") and stays exactly as it is. This is a sign-off, not a code
change — `config.ts`, the graders, and the card copy are untouched. Recorded in
`AUDIT.md` §4, `ROADMAP.md`, and `FINAL_REPORT.md` §10.

### 2. A missed grade raises Quiet pressure — the Quiet are the zombies

One herd, as it always was: `QuietField` in `sim/quiet.ts`, spawns in
`kentMap.ts`, drawn by `QuietSwarm`. No second herd is added. On the fail events
the graders already fire — too close, a rolled stop, the wrong lane, a crossed
solid, a bad merge, a yanked shoulder, and the rest of the fail halves
(`GRADE_MISSES` in the new `sim/pressure.ts`) — the Quiet within sight wake
toward the car. If nobody is close enough to see it, up to three EXISTING dormant
Quiet step onto the roadside ahead of the player and wake, so the sprites are on
screen when they look up. A pass raises nothing. Decay is untouched. The numbers
live in one named block (`PRESSURE`):

- 30 awareness per miss, applied at most once a second (some fails —
  `rural.shoulder.yank` — fire every step while the mistake continues).
- A miss alone caps at ALERT (75): the swarm and `mission.fail.swarm` stay the
  noise system's verdict. Reinforce, don't add chaos.
- The hook runs on the grade funnel every grader already fires through, so the
  rule is one taxonomy, not a hook per mission. (The pharmacy/Bea dropoff fires
  `door.slam` / `park.back_in.*` on the raw bus — noted, not re-plumbed.)

`test/pressure.test.ts`, 5 tests, two-sided: the miss comes from the REAL grader
(`ledger.follow.close`, `rural.shoulder.yank`), not from poking the hook. A miss
wakes the Quiet within sight and only those; a pass (`ledger.lanechange.clean`)
wakes nobody; the roadside rally adds no new Quiet; the pressure decays to zero
when the mistakes stop. The harness mutes the herd's hearing (`setListeners([])`)
— engine noise already wakes a parked-beside Quiet on its own, so without that
"the pass wakes nobody" would measure the engine, not the grade.

### 3. One voice, one interface, one sound set

- **Interface.** `sceneSpec.ts` no longer gives each act its own accent.
  `SCENE_ACCENT` (the Menace pink from `cockpit/tokens`) is the one accent and
  CockpitHUD tints the frame and the act badge from it. One cockpit on every act
  (driveView `cockpit` + maneuver cam), and `quiet: true` everywhere — the Quiet
  meter belongs on every playable act, and QuietHUD now reads that flag instead
  of the flag being decorative. Zone and ego stay per-act facts (Act III is the
  Ledger; that is story, not interface).
- **Voice.** New `dialogue/voice.ts` holds ONE speaker voice table (bed + in-cab
  volume). "Radio and CB beds stop being a different voice per act": Deac is the
  CB voice in every act, Jonah too, Mom/Ray/Lumi/Sori the radio voice, and the
  in-cab speakers are one bedless treatment whose loudness maps through the one
  VOLUME_DB table. A per-line `voice_bed` still wins — that is act 8's existing
  pattern (Mom and Ray standing in the room, Deac calling in on the radio) and
  stays the escape hatch for any scene that needs the other medium. Per-act
  `characters[]` voice fields are no longer consulted for listed speakers.
  `test/voice.test.ts` measures it: every act file resolves every speaker to the
  same voice, and the scene spec is one cockpit with the meter on every act.
- **Sound set.** AudioManager is already one procedural set (one engine, one
  wind, one screech, one rain). Nothing added, nothing per act. Card copy
  untouched; `pack/23_THE_SPOKEN_DICTIONARY.md` stays the word list.

### Held, per instructions

The Deac pass stands. III-001 stays on `ledger.lanechange.start`. Act III lanes
stay as they are (0 = right, 2 = left passing). The witness gate is 45 m.
`bench/baseline.json` not regenerated. No headed browser ran (none available) —
still no frame-rate or draw-call number to quote.

## 2026-10-15 — carport pad, one-way stops, stage spots

Played on the local drive. Four things were wrong on the Act I loop, and the other destinations used the same loose regions.

1. **Home did not register.** `tutorialTick` completed on `x < 30` and under 1 mph. The carport is off the street, and holding the brake at a crawl starts reverse, so that razor never held. The return is the pad under the carport (`markers.carport`), slow for 0.3 s. The street in front of the house does not count. Brake-at-rest holds for half a second before it becomes reverse.
2. **The Titus stop graded the drive home.** Stop zones had no facing. `approach` on `titus_central` is east; the opposite semicircle does not enter the stop. Meeker faces south. A side approach (the retest's eastbound pass) still grades.
3. **The carport was 1.4 m at the eave.** Legs are 2.8 m. The roof sits on them. An apron runs from the bay to the curb.
4. **Stage destinations were invisible regions.** A pink ring and post sit on `navTarget()` for the active mission. The end-of-block, pharmacy, Priya, warehouse, and DOL gate waypoints are that pad. The DOL pin was the middle of the lot while the trigger was a box on Central; the pin is the driveway gate now.

`npx vitest run` 174/174. `tsc --noEmit` exit 0. `bench/baseline.json` was restored; the run only moved step timings.

Clipping the pink ring consumed it at speed and moved the pin, with no line. The ring now stays until the car has settled on it. That settle fires `tutorial.block` (the return line) and only then moves the pin to the carport. Home is the whole bay, not the small ring. The post stands above the roof so the marker does not vanish under the car.

## 2026-10-16 — shipped to main

Fast-forwarded `main` from `d490fff` to `a240270` (23 commits) and pushed. Railway production deploy `f526f14b` succeeded. `DRIVE_ENABLED` was already on, so a signed-in student at ali.tactag.app lands in the drive. The live bundle contains `tutorial.block`.

## 2026-10-16 — marker entry uses the plow

The pink ring tested the rigid-body origin. The plow tip is 2.6 m ahead of that, so the car could sit in the ring while the test point was still outside, and a speed dwell made a moving entry count as a miss. `carTouchesDisc` treats the nose as inside the 2 m ring. Waypoint rects use the same nose. Tutorial block and carport fire on entry, at any speed. 174/174, tsc 0.

The nose check was on `main` and in the live bundle (`index-BxA4wqwa.js`) and it still missed: the grade used the chassis sample, not the mesh the player drives through the ring. `StageSpot` now measures the rendered car against the rendered ring (`player-car` world position) and calls `seeMarker`. The ring radius is 4.5 m.

The pad was 20 m before the Titus intersection, so stopping at the sign the player can see was not arrival. `block_end` is now on that stop (`x: 252`). A car within 12 m of the drawn pad counts, using the same position that already grades the stop. The pad is a filled pink disc.

The chassis sample can miss a car that is visibly on the disc. The hit is now the drawn chassis (`carDraw`, world position of the mesh) against the drawn pad, and that call resolves the pad without checking the sample again.

A spent waypoint was staying pink and silent. Resolving the pad releases that waypoint and plays its line as a cutscene, then hands the car back when the line ends. The pharmacy pad (green cross, clipboard) is one of those. The clipboard pad is 4 m closer to the door and does not replay that line.

## 2026-10-18 — clipboard walk

Getting out of the Beetle steps Ali 1.6 m west of June. The handoff was a 1.55 m circle, so that path missed, and the pharmacy wall (the south face is solid through y = 96) then held her: forward and sideways stay inside the rect, so only reverse worked. The dash routed the lot out to Meeker and reported 90 ft from the pad itself. The pharmacy handoff is now 3.2 m, a walker clipped into a building is pushed back outside, and a pin under 22 m that the street route inflates is measured in a straight line.

## 2026-10-16 — grade flash does not stop the car

The PASS/MISS panel froze the drive and waited on Continue. It is now a 1 s overlay at half opacity. No freeze, no phase change, no tap. Story cards are unchanged.

## 2026-10-27 — full storyline audit → `docs/STORY_BIBLE.md`

Read-only sweep of the whole repo (509 text/code files outside `node_modules`; 13,050 total).
Only `docs/STORY_BIBLE.md` was written (no code touched). The bible covers: synopsis, the
full chronological story (drive scenes 0.1→7.3 playable, 8.1–8.3 written-but-closed), cast,
locations, lore/world rules, plot threads (RESOLVED/UNRESOLVED/ABANDONED), every
flag/var/choice gate, a story-to-code map, three Mermaid diagrams, and a problems log.

Top findings: (1) `dialogue_act8.json` — the Spokane epilogue incl. the `respect`-gated
"…Seatbelt." ending — is unreachable (`actDialogue.ts:49-51` closes Act VII; 7.3→8.1 runs
`endCampaign`, `QuietRoadsBridge.ts:181-193`); (2) cargo contradiction on the I-90 run —
drive `act3.json` says insulin, card canon/`scripts/validate-act-v.js` forbid it for Act V
(relay kit / Tower 4); (3) drive shows card I-009 ("passenger seat is empty") before Mya is
lost; (4) `chainup_return` is read (`act5.json:95`) but never set, and shop scenes `2.6-2.8`
end with no `next_scene` — the chain-up-blocked → Tuna shop path dead-ends; (5) placeholders:
`src/manifest.js:31` "TODO — Claude: Backcountry load", `unlock: credits/postgame.deacs_route`
unimplemented. `AUDIT.md`/`ROADMAP.md` left untouched per the task's read-only constraint;
full problem list is in `docs/STORY_BIBLE.md` §10-11.

## 2026-10-28 — Phase 1: Act VII restructure + spokane_home mission

**Chain reorder** (the road home runs west→east into Spokane): `4.2 → 6.1b → 5.1 →
5.2 → 5.3 → 6.1 → 6.2 → 6.3 → 7.1 → 7.2 → 7.3 → 8.1 → 8.2 → 8.3`. Three
`next_scene` rewires: `4.2.pass_end` 5.1→6.1b (`dialogue_act4.json`), `6.1b.end`
6.2→5.1 (`dialogue_act6_backcountry.json`), `6.1.end` 6.1b→6.2 (`dialogue_act6.json`).
`5.3.end` still unlocks `region.ellensburg`; nothing gates the gravel on it.

**6.1b west-side rewrite**: `location` `backcountry_gravel`→`foothills_gravel`, opener
now "The blacktop quits **before the pass**" — the gravel lesson is a west-side
foothills run now that it precedes the climb. 7.1 untouched (east-side beacon intact).

**Act remap** (`actChallenges.ts`): `SCENE_ACT`/`MISSION_ACT`/`ACT_ENTRY` — scenes
5.1–8.3 + their missions → Act VII ("The Road Home", zone label stays "The Dark
Hours" per the card schema enum); `6.1b`/`mission_backcountry_run` → Act VI alone.
`ACT_ORDER` gains VII. `ACT_CHALLENGES.VII` replaces the permanently-closed copy.

**Act VII opened**: `actDialogue.ts` `isActPlayable` now true; `LOADERS` re-split by
card act (V = 3.x + ribbon, VI = 6.1b, VII = act5/act6/act7/act8 files);
`sceneRouter.ts` + `QuietRoadsBridge.ts` drop the closed-epilogue wording
(7.3→8.1 now runs; `endCampaign` remains for genuinely unknown scenes).

**spokane_home** (`sim/spokane.ts`, wired in `Simulation.ts` + `QuietRoadsBridge`):
the mission emits every wait/trigger event in 8.1–8.3 — 26 triggers
(city.enter, shadow.*, stop.*, zone.*, intersection.*, lanechange.*, quiet.pass_cluster,
mya.wake, checkpoint.approach:on_speed|over, park.parallel.* ×5, qte.gracie.*,
noise.*, mission.fail.swarm) and the 5 waits (quiet.reason_passed + the four 8.2
`cutscene.*` marks). The two grades the dialogue branches on: checkpoint speed
grade → `checkpoint.approach:*` (8.1.speed_ok sets `checkpoint_on_speed`); park
grade → `park.parallel.*` + `park_gap_in` written in inches to the line. The 8.2
video waits are answered via `onStoryWait` — the bridge relays wait entry in `tick`
so the marks land even while the video scene freezes the sim.

**Tests** (`test/spokane.test.ts`, 4): full trigger inventory coverage across
graded runs; `park_gap_in` written; all 8.x waits answered; 8.1 lights branch and
quiet-cluster muffler branch both reachable. `test/bundle.test.ts` updated to the
new act map (actForSceneId 5.1/7.1→VII, CHAIN order, 8.1 jump now continues,
preload cases 4.2→6.1b/6.3→7.1). 183/183 green; tsc clean.

**Scope notes**: no `cards/VII-*.json` — `pack/43_PACK_RULES_CONSOLIDATED.md:5,235`
forbids scaffolding VII cards ("No VII card scaffold, no VII stills, no VII seed"),
no drive scene references a VII-* card, and the card seed has no VII rows.
`src/manifest.js` untouched (its VII work is Phase 4/5 scope; Phase 1 restored the
file byte-for-byte).


## 2026-10-28 — Phase 2: I-90 cargo insulin → relay kit + 3.5 night-radio line

**Swap sites** (the I-90 corpus is now insulin-family-free):
`3.1.1` briefing "Issaquah checkpoint. **Medical**." → "**Relay kit**." and the
stall brief `3.3.5` "It's **insulin**." → "It's **the relay kit. Repeater,
antenna, clamps**." (both in `dialogue_act3.json`). Scene `3.4` (Mya Returns)
verified node-by-node — no cargo fiction to swap. The 8.2 stall payoff
(`.stall_a*`/`.stall_b*`) and `dialogue_act5_ribbon.json` scanned clean (0 hits);
"Cargo made the window." (3.3.13 / 8.2.stall_b3) stays as the generic echo.
Remaining insulin/June/cooler mentions repo-wide are canon or prohibitions:
Act II fiction (act2 briefs, II-cards, `manifest.js` MANIFESTS.II,
`game.js` cargoNameOf II, `actChallenges.ts` II block), image-prompt
negatives ("No insulin cooler"), `validate-act-v.js` rule text, and Act II
mission ids in tests. `src/manifest.js` IV/V entries already "Relay kit".

**3.5 night-radio line** (`dialogue_act3.json`, new nodes `3.5.signal_branch`,
`3.5.signal_clear`, `3.5.signal_weak` after `3.5.3`): Mom's signal is clearer on
`stall_stopped` ("Mom — you're coming through clear.") and weaker on
`stall_continued` ("Mom — you keep breaking up."), falling back to clear when
neither flag is set. Polarity follows the goal's word order and the game's
moral register (stop = the humane call, +40 respect; 8.3 "the mountains eat
radio" is the punishment register). Atmospheric lines only — no tower
causality claimed (the kit is delivered that day, never installed by night).

**Verified**: 182/182 vitest green (the Phase 1 "183" was a miscount — suite
re-run at HEAD via stash = 182 both sides; no test derives cases from data),
`tsc --noEmit` exit 0, `validate-act-v.js` baseline unchanged (V-006/V-008/V-013
fail exactly as before, no new failures). `bench/baseline.json` restored after
the bench run.

## 2026-10-28 — Phase 3: chain-up loop + shop dead-end fixes

**Shop continuation** (the runner strands on an `end` with no `next_scene` — the
bridge ignores an empty next): `2.6.end` → `2.3c`, `2.7.end` → `2.3d`, mirroring
the `2.3b.end→2.3c` / `2.3c.end→2.3d` pattern. `2.8` now carries a close branch:
`shop.close` → `2.8.close_branch`, which takes `2.8.end_return` from the chain-up
(sets `chainup_return`, clears `chainup_blocked`, → `5.1`), `2.8.end_reblocked`
when the trunk is still empty (clears `chainup_blocked` → `5.1` re-climb — she
loops back to the block until she buys), or `2.8.end` (→ `2.4`) on the normal
Act II shop visit from `2.3d`.

**Chains actually granted**: `2.8.buy_chains` now `give_items: ["chains"]` —
`5.2.entry` and `4.2.chains_branch` gate on the `chains` item and nothing ever
granted it (shop buys only set `has_*` flags). The `has_chains` flag stays for
the bible'd readers.

**`once` continuation triggers** (the strand class): `5.1`'s
`waypoint.reach:chainup → 5.1.end` and `5.2`'s `chainup.qte.success → 5.2.3`
were spent for good on the first pass — stranding the re-climb and the post-swarm
QTE retry. `8.1`'s `park.parallel.clean → 8.1.clean_fx` — the scene's *only*
completion path — had the same bug: a swarm that interrupts the gap-reveal tail
after the park strands every retry. All three `once`s removed. Safe because the
sim latches those events per run (`ClimbRun.arrived`, `ChainupRun.done`,
`GridRun.parallelDone`), so nothing refires within a visit, and resume semantics
are untouched (`restore()` still spends them across a save load). Bark `once`s
stay.

**Permanent test** (`drive/test/chainup-loop.test.ts`, 6): the scripted loop
(block → Tuna's → buy → return → re-climb → QTE → 5.3) on a real DialogueRunner,
incl. the `5.1.ret` trunk line and `climb_snoqualmie_from_below_chainup`; the
swarm-interrupt re-arm at 5.2 and 8.1; the 2.6/2.7/2.8 close targets; the
empty-handed return; and an audit that every `shop` scene's every `end` node has
a `next_scene` (the 2.6/2.7/2.8/7.2 class, made permanent).

**Verified**: 188/188 vitest green (182 + 6 new), `tsc --noEmit` exit 0,
`validate-act-v.js` baseline unchanged (V-006/V-008/V-013 fail exactly as
before). `bench/baseline.json` restored after the bench run; the three dialogue
JSONs stay CRLF (0 bare LFs).

**Open / deferred** (Phase 4's 8.x surface): a retry through `8.1.retry` still
loses the `once` story barks (city.enter, quiet.pass_cluster, mya.wake, the
checkpoint/park beats) — the scene completes but plays sparse. Same accepted
semantics as 3.3/5.1 retries; fixing it needs per-visit re-arm (a runner change,
resume-sensitive), so it is logged for Phase 4/5 to weigh while in 8.x.

### Next — Phase 4
- Nav tablet → radio: rewrite the II-009/III-027 Chorus lines as radio, convert
  the other tablet/screen/nav refs, flag the tablet stills.
- Grandma: surprise at 8.2, gray blanket, "Come home slow" loop, character
  table, `voice.ts` flag, `{GRANDMA_INITIALS}` default "— G.".
- `src/manifest.js`: drop account-name signing (~203–213) + tests; replace the
  `:31` TODO with the pass-plow fuel named in the VI end beat; check the 6.2
  in-fiction night time vs the 1–5 a.m. restriction after the 4.2 WA rules.
## 2026-10-29 — Phase 4 (radio not tablet, Grandma at 8.2, the clipboard, 6.2's clock)

**The Chorus never had a screen.** `cards/II-009` and `cards/III-027` described an
"aftermarket tablet" the art lock has never allowed to be lit (`ref_cockpit.jpg`
is "poisoned (tablet / digital…)"), while the scene's own first sentence and the
canon prop (`cards/I-011`: "a physical CB radio deck with knobs and a dark face")
already said radio. Both cards' prose now runs on the deck — II-009 on "the old
deck" and "the dial", III-027 retitled "The Chorus Wakes" with the CB deck bolted
to the doghouse crackling up mid-change — and **every mechanical field is
untouched**: ids, option ids, `correct` flags and all `state_delta`s. III-022's
"Check the tablet" → "Check the net"; `FAIL_PLACE["II-009"]` "the tablet" → "the
radio"; `data/cards.json` re-exported for the three changed cards.

**Tablet stills flagged, not redrawn** (full table in `AUDIT.md` §11): II-009's
and III-027's `image_brief`s still describe a lit tablet and want redrawing as the
deck; II-001 / I-011 / V-002 carry a *dark* tablet (optional cleanup); I-003,
V-002, VI-004, VI-011, VI-013 already forbid lit devices and stay as the lock.

**Grandma is on screen once.** 8.2's gray blanket was Ray's; the third figure at
Division Street is now Grandma, out of the checkpoint hut at `8.2.gm1`–`8.2.gm6`:
"I got on the bus. It went east. So did you." / "I told you. Come home slow." /
"…I did." — the note paid off out loud — then she takes the blanket out of Ray's
hands and puts it over the roof. Cue renamed `cutscene.ray_blanket` →
`cutscene.grandma_blanket` (emitted by `sim/spokane.ts`, asserted in
`spokane.test.ts`); `voice.ts` gains `GRANDMA` (bedless/low, which `voice.test.ts`
requires of every speaker); act-8 `characters` gains `{GRANDMA}` with no
`portrait_dir` (no art; schema requires only `name`). `{GRANDMA_INITIALS}`
defaults to `"— G."` in `dialogue_act0-1.json` meta **and** `qrStore.ts` (the
store overrides meta via `setPlaceholder` at boot), and the note's literal em dash
went away so it renders "Come home slow. — G." instead of "— — G.".

**The clipboard stopped signing itself.** `manifestFor(act, driverName)` stamped
the signed-in student's real name on Deac's manifest; it is in-fiction paperwork,
so it always ships `driver: "________"` now and the start button signs it
(`feel.js` already renders `row.driver || "________"`). Both callers updated;
`MANIFESTS` exported. New `scripts/test-manifest.js` locks the blank signature
(even when a name is passed), no placeholder rows, and — with the Act VI cargo now
"Diesel — four cans for the ridge plows" instead of the shipped
`TODO — Claude: Backcountry load` — that the cargo and the Act VI end beat name
the same load ("…chains are on the floor, the diesel for the ridge plows is
strapped down in the back, and the word is dawn.").

**6.2's clock now agrees with the exam.** questions_v1 `c1_008` teaches that a
first-year intermediate license means no 1–5 a.m. without a 25+ supervisor, and
Ali drives home alone. Nothing in acts 5–8 stamped a clock except 6.2, which
stamped the one window that would contradict it. `6.2.sleep` is now "Night.
Parked before one. …" and `6.2.morning` is "Five a.m. … The one-to-five is over
and so is the sleep."

**Verified**: 188/188 vitest green, `tsc --noEmit -p drive/tsconfig.json` exit 0,
`scripts/test-manifest.js` ok, `validate-act-v.js` baseline unchanged
(V-006/V-008/V-013 fail exactly as before), `bench/baseline.json` restored after
the run, dialogue JSONs still CRLF. Bible updated for the radio, the Grandma row,
epilogue 49 and the "come home slow" callback row; the numbered problems #5, #10
and #20 are fixed in code and get marked fixed in Phase 6's re-audit.


### Next — Phase 5
- Credits final card toggles on `deac_answered` ("…Seatbelt." vs the static
  variant); drop `postgame.deacs_route` from the act8 `8.3.end` unlock list.
- Then Phase 6: a permanent full-chain test (0.1 → `game_complete` incl. both
  1.3.C / 3.3.C branches and exam fail → retest → pass), the drive-bundle build
  (`dialogue_act8` compiles/loads), `docs/STORY_BIBLE.md` re-audit (§10/§11:
  FIXED-with-commit / CHANGED / STILL OPEN — incl. #5, #10, #20 marked from this
  phase), and the II-009/III-027 plate redraws handed to art.


## 2026-10-29 — Phase 5 (the campaign's last card)

`8.3.end` unlocked `credits` and `postgame.deacs_route` — two strings nothing in
the repo implements (bible problems #14 and #8) — so the ending's final image was
whatever line happened to be on screen. The ending now ends on a card that
toggles on the run's own verdict: `8.3.13` (the chair, the hand flat on the desk)
→ `8.3.credits_gate` → `8.3.credits_deac` ("The last card is the radio: a man
across a pass, very faint, very far. …Seatbelt.") when `deac_answered`, else
`8.3.credits_static` ("The last card is the room: a chair, a desk, a hand flat on
the wood, and a radio that says nothing back."). `8.3.12b` used to jump straight
to `8.3.end`, so the static path skipped the desk beat *and* the card; it now
continues into `8.3.13` the way the answered path does. `postgame.deacs_route`
is removed from the unlock list — it promised a postgame that has never existed
— and `credits` stays.

**Permanent test** (`drive/test/ending.test.ts`, 4): walks 8.3 on a real
`DialogueRunner` both ways through the `respect >= 80` gate (answered → `8.3.12`
sets `deac_answered` and the card is Deac's; static → `8.3.silence`, the card is
the room), asserts `credits` is the last unlock and never
`postgame.deacs_route`, and scans every act-8 node for the removed string.

**Verified**: 192/192 vitest green (188 + 4 new), `tsc --noEmit -p
drive/tsconfig.json` exit 0, `validate-act-v.js` baseline unchanged,
`bench/baseline.json` restored after the run, act8 still CRLF. Bible: epilogue
50, the callback and flag tables, and questions #5, #6, #8, #9, #10, #15/#18 and
#20 are marked answered/fixed (the ones Phase 4 closed are marked there too).

### Next — Phase 6
- Permanent full-chain test 0.1 → `game_complete`, incl. both 1.3.C / 3.3.C
  branches and the exam fail → retest → pass path.
- The drive-bundle build (`dialogue_act8` compiles/loads).
- `docs/STORY_BIBLE.md` / `AUDIT.md` §10/§11 re-audit: FIXED-with-commit /
  CHANGED / STILL OPEN; hand the II-009/III-027 plate redraws to art.


## 2026-10-29 — Phase 6 (the whole campaign walks; the bundle builds; the re-audit)

**The campaign is walked by a test now.** `drive/test/fullchain.test.ts` (4) plays
scene `0.1` to `game_complete` on one real `DialogueRunner` loaded with all twelve
dialogue files. Earlier chain tests each proved one link — a `next_scene` has a
destination (`bundle.test.ts`), the chain-up loop closes (`chainup-loop.test.ts`),
8.3 ends (`ending.test.ts`). None walked the campaign.

It walks it without a driver: fires a `wait`'s own `wait_for`, answers choices from
a policy (the first option that can still reach a hand-off unless the test names
one), resolves `card` nodes correct, and when a gameplay scene idles at its `*.go`
resident end — or at a bark leaf with no `next` — fires the one trigger whose target
still reaches an end node that hands off. Retry/atmosphere events (`noise.*`,
`mission.fail.*`, `mission.complete.*`) are skipped: they re-enter the scene instead
of advancing it. Fired events are scoped per scene visit, because the same event
name can finish two scenes (`park.parallel.clean` ends 2.3d *and* 8.1's last park).
A scene with no advancing trigger fails the walk.

What it holds: one visit per scene, 37 deep (`0.1 … 8.3`) with `game_complete` set
and `credits` unlocked; **both forks** — 1.3.C wait vs. honk and 3.3.C keep-going
(→ 3.4a) vs. stop for the stall (→ 3.4) — both reaching Spokane; **the exam twice** —
passed at the terminal, and failed once → the retest week (4.3, `week.elapsed`) → 4.1
with `exam_attempts` → 4.2 passed → 6.1b, with `exam_passed`, `exam_failed_once`,
`exam_attempts === 1` and 4.3 bracketed by the two 4.2 visits; and no hand-off naming
a scene the runner cannot start.

**The bundle builds.** `npm run build` in `drive/` (Docker stage 1): 821 modules,
entry `index-*.js` 3,972.56 kB / 1,312.14 kB gzip, `dialogue_act8` 28.55 kB. The act8
chunk carries the Grandma beat, `credits_gate`, "…Seatbelt.", "Come home slow" and no
`postgame.deacs_route`; the entry chunk carries `GRANDMA_INITIALS: "— G."`.
`public/game/drive` is untracked build output, so the working tree stays clean.

**The re-audit** is `docs/STORY_BIBLE.md` §12 — every §10 problem and §11 question
marked FIXED (phase + mechanism), CHANGED (deliberately different) or STILL OPEN
(with the reason). `AUDIT.md` §13 records the walk, the build numbers and the
verification. The two story items this pass did not touch are I-009's placement in
1.2 and the Kent/Renton lot name — author calls, both listed with why.

**Verified**: 196/196 vitest across 21 files (192 + 4 new), `tsc --noEmit -p
drive/tsconfig.json` exit 0, `scripts/test-manifest.js` ok, `validate-act-v.js`
baseline unchanged (V-006/V-008/V-013 as before), `bench/baseline.json` restored.

### Next (nothing in this pass is open in code)
- A headed `?profileDrive` browser pass and a full-campaign playthrough on a device —
  still no hardware, so no frame-rate or draw-call number exists.
- The II-009 / III-027 plate redraws (the two stills still draw a lit tablet) —
  flagged in `AUDIT.md` §11 for the art pipeline.
- The 6.x / 7.x story barks a swarm retry loses (`AUDIT.md` §10), and the author calls
  the re-audit lists: I-009's placement in 1.2, the Kent/Renton lot name, IV-001.


## 2026-10-29 — I-009 moves to the aftermath (1.4)

The re-audit listed I-009's placement as an author call. The approved plan decided
it: the card opens where its own setup is true. `1.2.card_I-009` is gone and the
I-005 card node now hands straight to `1.2.4`, so 1.2's flow is unchanged (I-005 →
pull-in line → `1.2.go` park minigame → clean/curb bark → `1.2.end` → 1.3).
I-009 now hangs off `1.4.5` ("I'm going back for her. Tomorrow. With a plan."):
`1.4.card_I-009` → `1.4.radio`, in the carport aftermath, after 1.3 has set
`mya_lost`, which is where "The passenger seat beside you is empty" is true.

One continuity word in the card itself: `cards/I-009.json` scene opened "The
engine's on." — true over the DOL lot, false in the engine-off carport the scene
now plays in (`grandma_carport_night` / `carport_night_engine_off.png`). It is
"The engine's off." now; ids, options, correct flags, state_delta and citations
are untouched, and `drive/src/quietroads/data/cards.json` is re-exported for the
one changed string (no seed ran). Left as the author's call: the still is an
afternoon lot plate (`variation.time_of_day: "afternoon"`), so the *image* is now
a daylight shot in a night scene — an art-pipeline note, not a code one.

`drive/test/fullchain.test.ts` gained the walk's card log (`card_shown` +
`scene_started`) and a fifth test: I-009 opens exactly once, in 1.4, on
`1.4.card_I-009`; 1.2 shows only I-005 and still ends resident-then-1.3.

**Verified**: 197/197 vitest across 21 files, `tsc --noEmit` exit 0,
`validate-citations.js` ok, `bench/baseline.json` restored.


## 2026-10-29 — L-002 is Kent (the Lot is not in Renton)

The re-audit's second author call was the lot's city: cards say "the Kent licensing
lot" (`cards/I-005.json`) and the drive's location key is `kent_dol_lot`, while
the locked registry said "dead Fred Meyer, **Renton**". The plan decided Kent.
`pack/01_BIBLE.md` now reads "dead Fred Meyer parking lot, **Kent**" in §7's zone
map (line 121) and "### L-002 · The Lot — dead Fred Meyer, **Kent**", with a
*Location canon* line recording the correction and pointing at the card and the
scene key. `docs/STORY_BIBLE.md`'s location table row (§) drops the
"Renton (card canon) / Kent (card text)" split for a single Kent row.

The only remaining "Renton" in the fiction is `cards/II-007.json`'s "the rain has
been going since Renton" — a direction the weather comes from, not the lot — and
the audit's own §10.3 problem statement, which stays as the historical record
(its §12 row is marked FIXED in this pass).

**Verified**: 197/197 vitest, `validate-citations.js` ok, `test-manifest.js` ok.


## 2026-10-29 — IV-001 is a live card (Cover the brake)

The third author call. `cards/IV-001-brake.json` was a named-spot brief, not a
card: `card_type: "ride-along-still"` (not in the schema's enum), no `source`, no
`decision`, no options, and a `card_id` the seed's file filter
(`^(I|…|VII)-\d{3}\.json$`) never matched — so it had never been seeded, and
IV-002's "Yuna's car had two pedals" had nothing on the other side of the
comparison. P11's old closure ("nothing rejects the suffix") was wrong twice over:
the seed filter rejects it and `pack/04_card.schema.json`'s `card_id` pattern
rejects it, while the client's ride plate was already addressed at
`public/game/ride/IV-001/brake.webp` (`app.js:977` builds `/ride/<card_id>/…`).

It is `cards/IV-001.json` now: act IV / The Core / yuna, `card_type: "scene"`,
title and hook unchanged, a 530-char scene that sets the Encore up as a two-pedal
car with Ali on the welded rear bench, one decision ("The light is still green…
what does your right foot do?") and four options with exactly one correct
(`a`: cover the brake — off the gas, heel down, ball hovering; the failures are
"wait for yellow", "rest on the brake", "left foot on the brake"). Citation is
traceable: `Skill ten: city driving – part one` + `4.11 Traffic light signals`
(the `teaching_target` quotes the guide's Solid Yellow rule — "slow down and
prepare to stop"). `seq` is not stored: `scripts/card-seq.js` derives 4001, which
is what the schema wants (it forbids extra keys).

Assets confirmed on disk: master `cards/IV-001.png` (renamed from
`cards/IV-001-brake.png`, same bytes — it is a JPEG under a .png name, which
`encode-still.py` opens by content) and the ride plate
`public/game/ride/IV-001/brake.webp`. `cards/IV-001-brake.compile.txt` is
`cards/IV-001.compile.txt` with its header corrected.

Two brief corrections this needed: `variation.time_of_day` was `"overcast"`
(weather, not a time — schema enum), now `"afternoon"`; and `continuity` carried
`encore_footwell`, which is not a lock in `pack/09_REF_MAP.json` and has no file
in `refs/` (the compile aborted on it). The pedal box is documented by
`ref_encore_cockpit.png` itself ("two pedals (wide brake + narrow accel), empty
floor left of brake, no clutch", `refs/LOCKS.md:22`), so `continuity` is
`encore_cockpit` only and the camera_pose points there. `compile-images.js --card
IV-001` now compiles (attachments: `ref_encore_cockpit.png`).
`image_brief.camera_pose` stays: it is outside pack/04's `additionalProperties`
but `scripts/compile-prompt.js:188` reads it as the framing, and 7 seeded cards
carry it.

The deck bundle is re-exported for the entry (card_id IV-001, image
`/api/drive/image/IV-001`, options as id+text only). `drive/test/coverage.test.ts`
now expects `IV-001` and not `IV-001-brake`; new `drive/test/cards.test.ts` (6)
holds the seed name, the schema shape, one correct option, the citations, both
stills, and IV-002's two-pedal setup. Docs updated: `AUDIT.md` §2 Act IV + P11,
`PLAYTHROUGH.md:70`, `PLAYTEST.md:49`, `STORY_BIBLE.md`'s callback row.

No seed ran and nothing was deployed.

**Verified**: 203/203 vitest across 22 files, `tsc --noEmit` exit 0,
`validate-citations.js` now counts 121 cards (it used to skip the file), `node
scripts/compile-images.js --card IV-001` compiles; the full compile still aborts
on the pre-existing II-011 / IV-007 / V-006 / V-008 / V-013 findings, unchanged.


## 2026-10-29 — 6.2's clock, traced on both paths (no dialogue change needed)

The question was whether either path in 6.2 puts Ali behind the wheel between
1:00 and 5:00 a.m. (questions_v1 `c1_008`: first-year intermediate, no 1–5 a.m.
without a 25+ supervisor, and she drives home alone). Traced node by node:

| Step | Node | In-fiction clock |
|---|---|---|
| Dusk at the depot | `6.1.0` ("Ellensburg fuel depot. Dusk.") | dusk |
| Leave | `6.2.0` ("the horizon going orange") | dusk |
| Mission starts | `6.2.go` → `straight_night_drive` | — |
| Dark | `6.2.night` ("Dark. Lights on.") | night, before the rest stop |
| Fatigue | `6.2.fy_fx` / `6.2.3` / `6.2.fr_fx` / `6.2.4` | night, no hour named |
| Rest sign | `6.2.rest_prompt` ("REST AREA — 1 MILE.") | night, no hour named |
| **Stop path** | `6.2.pullin` → `rest_area_pullin` → `park.clean` → `6.2.9` → radio (`6.2.11`–`6.2.19`) | parks at the rest area |
| **Push-through** | `6.2.drive_on` → `6.2.drift` (microsleep) → `6.2.6` (rumble) → `6.2.8` → `6.2.forced` (`rest_area_forced`) → `park.clean` → `6.2.8b` → card III-020 | forced stop at the same area |
| Park | `6.2.sleep` ("Night. **Parked before one.**") | before 1:00 a.m. — both paths |
| Morning | `6.2.morning` ("**Five a.m.** Still dark… The one-to-five is over…") | 5:00 a.m. |
| Tire check | `6.2.tire_C` → `tire_yes`/`tire_no` → `6.2.end` → 6.3 | after 5:00 a.m. (6.3 is `vantage_bridge_predawn_wind`) |

Both paths converge on `6.2.sleep` before the 1:00 boundary and stay parked until
5:00, so **no path drives inside the window** and no dialogue changed. The one
thing that was weak was that the fact lived only in prose: nothing failed if a
later edit moved the drive-on → rumble → forced-stop leg after the park, or put a
time on a driving line. `drive/test/straight.test.ts` (6) is that guard now — it
walks both branches of `6.2.rest_C` through the graph, asserts the push-through
order (`drive_on` … `6.2.forced`, all before `6.2.sleep`), asserts the stop path
never touches the drive-on leg, asserts `6.2.sleep` and `6.2.morning` are the
*only* clock stamps in the scene, and fails if any line names an hour in 1–5 a.m.
(Negative-checked: injecting "It is 2:40 a.m." into `6.2.drive_on` fails it.)

**Verified**: 209/209 vitest across 23 files, `tsc --noEmit` exit 0,
`validate-citations.js` ok, `test-manifest.js` ok.


## 2026-10-29 — §12 marked: the three author calls FIXED, 6.2 pinned

Docs close-out for the follow pass. `docs/STORY_BIBLE.md` §12 now lists the three
items the six-phase re-audit had left as author calls under **FIXED**, each with
its commit and mechanism:

- §10.2 / §11.3 (I-009's placement) → `c6bb2fa`, node path named, and the card's
  opener change recorded.
- §10.3 (the Lot's city) → `58340d5`.
- §10.8 / §10.17 / §11.7 (IV-001) → `adb9ffc`, with the shape, the citations and
  the two assets named.

All three came out of STILL OPEN. §12's test inventory is 209/209 across 23 files
with `fullchain.test.ts` at 5, `cards.test.ts` (6) and `straight.test.ts` (6) new;
`AUDIT.md` §14 records the pass and `ROADMAP.md` moves the author calls to
closed (and notes the I-009 afternoon plate as the one art follow-up the move
creates). The 6.2 clock item is recorded there too (`2954a6b`) even though it was
not a §12 row: it was a question about a rule the exam teaches, answered with a
test.

**Verified**: 209/209 vitest, `tsc --noEmit` exit 0, `validate-citations.js` ok
(121), `test-manifest.js` ok, `validate-act-v.js` unchanged
(V-006/V-008/V-013), full `compile-images.js` unchanged
(II-011/IV-007/V-006/V-008/V-013), `bench/baseline.json` restored.


## 2026-10-29 — the clipboard is signed: A. Okonjo, not a blank

Item 2 was a question about `manifestFor()`'s `driver: "________"`: was the blank
deliberate, on the theory that Deac's initials at VI-013 fill it? Half yes, half
no, and the half that is no decides it.

- The blank was deliberate *as a blank*: Phase 4 removed the signed-in account's
  name from the paper because a stranger's name on a courier's manifest broke the
  frame.
- It is **not** filled by Deac's initials at VI-013. `cards/VI-013.json` has him
  turn the sheet around with "hours in the left column and a line at the bottom
  with his initials on it" — that is his own hand-ruled clearance log, the thing
  he has carried since Kent, not the run manifest the player sees. The Act VI end
  beat (`deliveryBeat(.., "VI")`, `src/manifest.js`) signs nothing: "The sheet
  goes in the glovebox with the affidavit and the log from Kent…". And nothing in
  the client writes the field: `public/game/feel.js:771` renders
  `row.driver || "________"`, and the start button (`#manifest-sign`) only closes
  the panel — it does not initial it.

So the blank had no in-fiction author, and a blank line is not a signature. The
paper now carries the courier the run belongs to: `driver: "A. Okonjo"`
(`pack/01_BIBLE.md:35` — "ALI OKONJO", canon, do not restyle). The account name
still cannot reach it: `manifestFor()` takes no arguments at all.
`scripts/test-manifest.js` was updated to lock the new contract — every act signs
"A. Okonjo", a stray `manifestFor("II", "Jordan Smith")` still returns
"A. Okonjo", and no row may contain an account-ish string.

**Verified**: `node scripts/test-manifest.js` ok, 209/209 vitest, `tsc --noEmit`
exit 0, `validate-citations.js` ok, `validate-act-v.js` unchanged
(V-006/V-008/V-013).


## 2026-10-29 — Act VII opens (cards only)

The author approved Act VII: *The Dark Hours — The Road Home*. Every rule/status
doc that said "closed" now says what is actually true, and the herd's art law is
carried forward unchanged.

- `pack/43_PACK_RULES_CONSOLIDATED.md` — the header no longer says "stays CLOSED";
  the `## Act VII — CLOSED` section is `## Act VII — OPEN (cards only)` and names
  what is allowed (VII cards, schema shape, citations from pack/07 + pack/08,
  `scripts/validate-act-vii.js`), what is not (VII stills, VII zone plates, VII
  seeds; `variation.forced: "Act VII scaffold — no still; do not seed"`), and what
  does not change (herd art law: posture and stillness, never gore, never filling
  the frame; Act V's own ban on VII material on a Ribbon card).
- `pack/00_README.md`, `README.md`, `pack/44_SEED_PROVENANCE.md` — same correction
  in the index, the front door, and the seed-provenance note.
- `docs/ACT_DRIVE_ALIGNMENT.md` and `docs/STORY_BIBLE.md` §1/§3 — the "herd lives
  on the pass, drive should not free it" sentences now say the drive never frees
  the herd while the act itself is open.
- `ROADMAP.md` (known risks) and `PLAYTEST.md` (scope line).

No card, still, seed, or drive code was touched in this commit.

**Verified**: 209/209 vitest, `tsc --noEmit` exit 0, `validate-citations.js` ok,
`test-manifest.js` ok.


## 2026-10-29 — the Act VII deck (10 cards, no stills, no seed)

`cards/VII-001` … `VII-010`, one card per teachable beat of the road home, each
cited from `pack/07_DOL_SECTIONS.json` / `pack/08_PSDP_SKILLS.json` only and each
carrying `variation.forced: "Act VII scaffold — no still; do not seed"`:

| Card | Beat | Type | Citation |
|---|---|---|---|
| VII-001 Thirty-Five in a Sixty | 5.1 climb | scene | 5.1 Speed (Adjusting speed for conditions) |
| VII-002 Sign Means Sign | 5.2 chain-up | hazard | 5.6 (Slippery roads) |
| VII-003 Walking Speed | 5.3 summit lot | scene | 2.5 (Headlights) |
| VII-004 That's the Goodbye | 6.1 Deac | beat (continue only) | n/a |
| VII-005 Four Hundred Feet of Light | 6.2 night straight | scene | 2.5 (Headlights) |
| VII-006 The Wind Lives Here | 6.3 bridge | scene | 5.1 (Adjusting speed) |
| VII-007 Four Seconds Behind | 7.1 escort | scene | 4.4 (large vehicles) |
| VII-008 No More Than Twelve | 8.1 park | scene | 4.18 (Parking) |
| VII-009 A Foot From the Line | 8.2 arrival | beat (continue only) | n/a |
| VII-010 The Voucher | 7.1 gate | ledger, `callback_of` VII-002 | 5.6 (Slippery roads) |

Wording is lifted from the drive's own lines so both surfaces match: the half-buried
60 and "Thirty-five" (5.1.0–5.1.3), "Sign says chains. Sign means chains." (5.2.6),
"lights off past the sign, walking speed" (5.2.brief) with the headlight law as the
card's answer, the headlight relay goodbye (6.1.jonah/6.1.flashback), "four hundred
feet" and the twenty-minute nap (6.2.1/6.2.5), "steer into it — small" (6.3.2),
"four seconds behind me" and the wide right turn (7.1.2c/7.1.9), the foot-from-the-line
park (8.1.gap_foot), and Division Street (8.2.pre).

Callbacks: VII-002 (`schedules_callback`) is billed by VII-010 at the Ritzville desk;
VII-007 (`callback_of: V-006`) re-bills the truck blind-spot lesson in the escort
without re-teaching the mirror — V-006 itself is untouched.

Schema: `pack/04_card.schema.json` gained a `beat` branch (`then: { required:
["debrief"] }`) because the client has always treated a decision-less beat as
read-and-continue (`CardOverlay.tsx:7`, `app.js:continueOnly`) while the schema
required decision+options. I-007 (a beat *with* options) stays valid.

New `scripts/validate-act-vii.js` (also wired into `npm run validate-cards`): deck
shape, enums, geometry, compile, seat, spoken, citations, one-correct and the 35%
answer-position cap, plus three Act VII checks — the no-still/do-not-seed contract
(forced string, no `winner`, no VII PNG on disk), the herd's art law in the brief
(no gore; figures do not fill the frame), and callback integrity (a scheduled miss
must have a later card that bills it). 10 cards, 7 decision cards, answers
a2/b1/c2/d2 (28.6% max).

`drive/src/quietroads/data/cards.json` re-exported: 131 cards, VII last, additive
only (+437 lines). **No seed, no still, no deploy.**

**Verified**: `validate-citations.js` ok (131), `validate-act-vii.js` ok,
`validate-act-v.js` unchanged (exit 1, same findings), `validate-act-ii.js`
unchanged (exit 1), `validate-act-iii.js` ok, 209/209 vitest, `tsc --noEmit`
exit 0.


## 2026-10-29 — VII cards wired into the drive, each in its beat

Ten card nodes, one per card, placed at the beat the card is written about. No
existing node was renumbered and no scene changed shape — each anchor's `next`
now names the card, and the card hands on to what the anchor used to point at:

| Card | Scene | Node | Opens after |
|---|---|---|---|
| VII-001 | 5.1 | `5.1.card_VII-001` | `5.1.3` ("Sign was posted in July. Thirty-five.") → `5.1.go` |
| VII-002 | 5.2 | `5.2.card_VII-002` | `5.2.1` ("Chain-up. Pull in.") → `5.2.2` |
| VII-003 | 5.3 | `5.3.card_VII-003` | `5.3.pre` (summit lot, lights off) → `5.3.hold` |
| VII-004 | 6.1 | `6.1.card_VII-004` | `6.1.flashback` (the headlight goodbye) → `6.1.end` |
| VII-005 | 6.2 | `6.2.card_VII-005` | `6.2.pre` ("Okay. Just us.") → `6.2.go` |
| VII-006 | 6.3 | `6.3.card_VII-006` | `6.3.2` ("Two hands. Slow down.") → `6.3.go` |
| VII-007 | 7.1 | `7.1.card_VII-007` | `7.1.2c` ("Four seconds behind me") → `7.1.go` |
| VII-010 | 7.1 | `7.1.card_VII-010` | `7.1.arrive` (Ritzville gate) → `7.1.report_branch` |
| VII-008 | 8.1 | `8.1.card_VII-008` | all three gap lines (`gap_foot`/`gap_ok`/`gap_far`) → `8.1.end` |
| VII-009 | 8.2 | `8.2.card_VII-009` | `8.2.out` (out of the car) → `8.2.walk` |

`7.1.card_V-006` (the existing truck-blind-spot card) is untouched and still sits
where it was; VII-007 is its callback, four beats later.

Tests: `fullchain.test.ts` gained a sixth case asserting the walk opens each VII
card exactly once, in its scene, on its node (ordered). `coverage.test.ts` adds
`VII` to `DRIVE_ACTS`, so "every card of the driving acts opens in-scene" now
covers the new deck. `straight.test.ts`'s depot-retry case learned the new node
(`6.2.pre → 6.2.card_VII-005 → 6.2.go`). `validate-act-vii.js` now also fails if a
card is placed zero or two times, or if a VII card node names no card.

**Verified**: 210/210 vitest across 23 files (209 + 1), `tsc --noEmit` exit 0,
`validate-act-vii.js` ok (placement printed), `validate-citations.js` ok (131),
`validate-act-v.js` / `validate-act-ii.js` unchanged, `validate-act-iii.js` ok.


## 2026-10-29 — the licensing exchange at 4.2, and Hank's grain line

The exam scene now says what the paper actually costs her. Five lines run straight
off `4.2.4` ("That stamp is good until the card comes in the mail") before the Mya
branch: `4.2.lic1` → `lic5`. Deac, dispatch cadence, Ali flat ("So the homework was
the paperwork.").

Every number is the guide's (DG 1.8):

- **lic1** — "Six months on the permit first… Forty hours daylight, ten after dark,
  with somebody who's held a license three years — fifty, attested, and the school
  enters the scores." (DG 1.8: permit ≥ 6 months; 40 day / 10 night supervised
  hours with a licensed driver 3+ years; parental authorization attests 50;
  "Have your instruction permit for at least 6 months.")
- **lic2** — "And it's logged. Not remembered. That clipboard is the log…" (the
  hours she drove under Deac are the attested log; ties the clipboard to the form)
- **lic4** — the intermediate restrictions: "One to five in the morning you need a
  parent, a guardian, or somebody licensed twenty-five or older in that seat. No
  passengers under twenty who aren't family for six months. Three after that."
  (DG 1.8 p.6, both stages)
- **lic5** — the in-fiction Authority emergency provision: it "waives the waiting
  period — the six months, not the exams, not the hours, not the night. One to five
  is still one to five, alone." Fiction is labelled as the Authority's, not the
  guide's; 6.2 already honors the night rule.

Scene `4.2.guide_refs` now carries the DG 1.8 lines (permit/hours, intermediate
night + passengers, temporary-license 45 days) beside the exam line.

**7.1, Hank** (`7.1.chat8` / `chat9`, at the end of the cruise-idle chat branch):
"Guide's got one exception and it's the one that fits me: agricultural. Grain
counts… Authority calls this a convoy; the mountain calls it a harvest." then
"Doesn't mean I run you in the dark. One to five in the morning is still one to
five, and you're alone in that car. Grain buys daylight, Bug. Not midnight."
That is DG 1.8 p.6's real exception — "Agricultural purposes. Intermediate driver
license holders may drive at any hour, with passengers, for agricultural purposes."
— followed by his refusal to use it at night.

New `drive/test/licensing.test.ts` (5) pins the chain, the numbers ("Six months",
"Forty hours daylight, ten after dark", "three years", "One to five",
"twenty-five or older", "No passengers under twenty", "waiting period", "not the
night") and Hank's line.

**Verified**: 215/215 vitest across 24 files (210 + 5), `tsc --noEmit` exit 0,
`validate-citations.js` ok (131), `validate-act-vii.js` ok, `test-manifest.js` ok.


## 2026-10-29 — 8.2 gm4: she didn't know Grandma was there

One line, author's call: `8.2.gm4` was "Nobody told me." and is now "Mom didn't
say you'd be here." `8.2.gm5` ("I told you. Come home slow.") is untouched, so the
beat still turns on Grandma having told her, not on nobody having mentioned it —
Ali is surprised by the *arrival*, not by the woman. Everything else in the beat
(gm1–gm3, gm6, the blanket, the end) is unchanged.

**Verified**: 215/215 vitest, `tsc --noEmit` exit 0, `validate-citations.js` ok,
`validate-act-vii.js` ok.


## 2026-10-29 — docs: Act VII recorded (§2, §6, §12; ROADMAP; AUDIT §15)

- `docs/STORY_BIBLE.md` §2: the epilogue heading no longer says "CLOSED at runtime";
  a new **Act VII — the card deck (opened 2026-10-29)** subsection lists all ten
  cards with their beat, node and citation, and states the no-still / no-seed
  contract and the herd art law. The three cross-references that still said 8.x was
  unreachable or VII deliberately closed now say the drive plays.
- §6 *Plot threads*: two new debts — the chain sign (VII-002 → VII-010) and the
  truck blind spot's second bill (V-006 → VII-007) — plus the licensing thread
  (4.2 `lic1`–`lic5`, 6.2's clock, Hank's agricultural line). The Quiet row keeps
  **UNRESOLVED by design**, now with the right reason: VII opened the road, not the
  pass.
- §12: five FIXED rows with this pass's commits (rules, deck, wiring, 4.2, gm4),
  the suite line moved to 215/215 across 24 files, and the validator inventory now
  includes `scripts/validate-act-vii.js` (with what it refuses).
- `ROADMAP.md`: in-scene card target now reads **VII 10/10**; the current-pass list
  names the five commits; "not open in code" adds VII stills as deliberately
  unproduced and notes VII is not seeded by design.
- `AUDIT.md`: §2 gains **Act VII — The Dark Hours (10/10 wired, cards only)** with
  the node table, the grades each card rides, the callbacks and the validator's
  refusals; §15 records the pass and its verification.

**Verified**: 215/215 vitest, `tsc --noEmit` exit 0, `validate-citations.js` ok
(131), `validate-act-vii.js` ok, `test-manifest.js` ok.















## 2026-10-29 — deck accuracy, the road-home clock, the permit, the seed (six items)

Six commits, one per item, on `story/act-vii-road-home`. No ID renumbered; every
taught rule is quoted from `docs/wa-driver-guide/guide_extracted.txt` and the
quote is asserted in a test.

1. **`9698514` — VII-002 chains.** Option a: "Chains on the drive wheels — the
   rear pair — before the car moves." DG 5.6 says only "Use snow tires or chains
   when it's required." and names no axle, so "all four" was invented. The
   debrief and `teaching_target` say the guide names no axle; VII-010's debrief
   restates the rule in the desk's voice (no "receipt is the equipment").
   `actvii-deck.test.ts` (13 across the pass) checks the copy, the citation and
   the live `data/cards.json` mirror.
2. **`c414a7d` — midday in Spokane.** 6.2 is awake at five; 6.3 is first light;
   7.1 is Moses Lake dawn; the escort + barter + "two hours" land at midday.
   VII-008: "flat white … coming up on noon" (`variation.time_of_day` midday);
   8.1.0: "gray sky going flat white, a little snow in the air"; 8.1.lights_a
   "Snow in the air counts"; 8.2.gm1 "waiting since before the sun"; 8.2.lights1
   "In all that snow"; 8.2.stall_b7 drops "tonight"; 7.2's three dark-two-hours
   lines rewritten; `7.3.location` `ritzville_lot_morning`; VII-009 midday.
   VII-008's debrief now teaches the park and the checkpoint speed as two
   separate rules. `clock.test.ts` (9) holds the order and forbids 1–5 a.m.
3. **`7aa8a69` — headlight numbers.** DG 2.5: 500 ft oncoming / 300 ft behind
   (dim); DG 5.6: stop within the glow, usually 400 ft. 6.2.night now says
   "four hundred feet of glow — stop inside it. Five hundred to oncoming before
   I dim." VII-005's scene says 400 is "the glow you have to be able to stop
   inside"; its debrief carries 500/300/400. Exam `c5_010` lost the unsourced
   182/350 beam-reach numbers.
4. **`6a40749` — permit supervision.** 2.2 `super1`–`super5` between the permit
   line and the cat: Deac names 1.1 plainly (drove herself to the licensing
   office, no permit, no licensed adult, alone, "the first thing I'd have failed
   you on"); Ali is flat ("It was four miles."); Deac: "It was a violation."
   Then the state's rule ("a licensed adult with three years in the seat") and
   the Authority's courier provision ("radio open and a licensed driver on the
   net; in the car for the first one, on the radio after"), labelled as the
   Authority's, not law. 2.3a remains the in-car delivery. `licensing.test.ts`
   13 (was 5).
5. **`2a888ae` — Hank.** 7.1.chat8: "Authority calls this a convoy. The county
   calls it harvest."
6. **`4a9a46f` — seed.** `scripts/seed-cards.js` now skips a card whose
   `variation.forced` says no still AND do not seed (the ten VII cards), throws
   if one is named explicitly, and still seeds IV-001. The matcher is the
   scaffold shape, not the substring, because IV-005/IV-028/V-001 carry
   rejected-take notes that say "do not seed". Act VI is live (13 stills) and
   stays seedable — the pass request's parenthetical said "all of Act VI", but
   the repo's VI cards are not scaffolds; skipping them would drop live cards.
   `seed.test.ts` (6). **No seed ran** (no DATABASE_URL; branch rule).

**Clock trace** (also in `AUDIT.md` §16): 6.2.sleep before 1:00 a.m. →
6.2.morning 5:00 a.m. → 6.3 first light → 7.1.0 Moses Lake dawn → 7.1.arrive
Ritzville gray sky → 7.2/7.3 same morning → 8.1.0 flat white + snow → 8.2.gm1
"since before the sun" (midday) → 8.3 one week later.

**Pre-4.2 driving** (also in `AUDIT.md` §16): 0.2 private carport, 1.1 the one
deliberate violation (named at 2.2), 1.2 private DOL lot, 2.3a Deac in the car,
2.3b/c/d + 2.4 + 2.5 + 3.2/3.3 on the Authority's radio provision.

**Verified**: 251/251 vitest across 27 files (baseline 215/24), `tsc --noEmit`
exit 0, `validate-citations.js` ok (131), `validate-act-vii.js` ok,
`node --check scripts/seed-cards.js` ok, `bench/baseline.json` restored.
Pre-existing baselines unchanged: `validate-act-v` (V-006/V-008/V-013),
`validate-act-ii`; `validate-act-iii` ok. Docs: `STORY_BIBLE` §2/§6/§12,
`ROADMAP`, `AUDIT` §1/§16. No seed, no still, no deploy.


## 2026-10-29 — permit timeline (one follow-up commit)

**Recon — what exists.**
- **No permit-issuance beat anywhere.** 1.3 is the DOL knowledge test and it is
  interrupted before she answers a question (`1.3.6` "Two minutes. Forty
  questions." → `1.3.latch` → rack → chase). `2.2.12` says only that Deac is the
  only one who can issue a permit. The state seal stamp is introduced at `4.1.0`
  and sits on the table at `4.2.0`. `4.2.pass` sets `permit_held` and unlocks
  `swag.permit`, but `4.2.4` says "Driver's license" and `4.2.lic4` starts the
  intermediate restrictions — so 4.2 is the license exam, not the permit.
- **No elapsed time between Act I and 4.2.** Only "tomorrow" (1.1 → 1.3),
  "Retest in a week" (4.2.fail → 4.3) and "a week later" (8.3). No dates, no
  seasons, no months. `pack/01_BIBLE.md:9` "Fourteen months after the Cascadia
  Quarantine" is world time, not story elapsed. `4.2.lic1`'s "You had seven" was
  the only permit-hold duration in the repo, and it was invented.

**What changed (one commit).**
- `2.2.permit1`–`permit3`, inserted after `super4` and before `super5`: Deac
  opens the drawer, uses the state seal stamp, and issues an **Authority courier
  permit** — "Not the state's instruction permit — that one wants six months and
  the test you didn't get to finish. This one wants somebody I've watched drive."
  / "I've watched. Stamped. Your hours start now, and every mile goes in the
  log." This puts the document before `super5`'s "courier on a permit" and before
  `2.3a`, the first delivery.
- `4.2.1`: "Phone off. Cats out. Forty questions. The license set, not the permit
  set." — 1.3 is the DOL permit knowledge test; 4.2 is the license exam.
- `4.2.lic1`: "Six months on the instruction permit first. You didn't have six
  months." — "You had seven" removed.
- `4.2.lic5`: "You didn't have the six months. You had the Grid. That's what the
  Authority's provision is for: it waives the waiting period — not the exams, not
  the hours, not the night. One to five is still one to five, alone."
- `licensing.test.ts` 13 → 17: the 2.2 chain includes the permit nodes; the
  permit is issued before `super5` and before `2.3a`; 1.3 and 4.2 stay different
  exams; no line claims a permit-hold duration the fiction never showed.

**Verified**: 255/255 vitest across 27 files, `tsc --noEmit` exit 0,
`validate-citations.js` ok (131), `validate-act-vii.js` ok, `validate-act-iii.js`
ok, `test-manifest.js` ok, `validate-act-v` unchanged (V-006/V-008/V-013),
`validate-act-ii` unchanged, `bench/baseline.json` restored. Docs: `STORY_BIBLE`
§2/§6/§12, `ROADMAP`, `AUDIT` §16. No seed, no still, no deploy.


## 2026-10-29 — live seed (production)

**Route.** The Railway CLI is logged in and the repo is linked to
`pink_menace` / `production` / `pink_menace`. `railway run` injects the internal
`DATABASE_URL` (`postgres.railway.internal`), which does not resolve from this
machine. The Postgres service exposes a TCP proxy, so the public URL was built
in-process from the proxy host and port plus the service credentials with
`System.UriBuilder`; neither the URL nor any credential was printed. `src/db.js`
already sets `rejectUnauthorized:false` for public hosts. A read-only `select 1`
succeeded first.

**Narrow seed.** `npm run seed -- IV-001` → `seeded IV-001`; Act IV still audit
`compared 22, match 22, mismatch 0`. IV-001 is live at seq 4001 with a
48,184-byte image and four options (`a` correct).

**Full seed.** `npm run seed` printed one skip line:

```
skipped (no still; do not seed) VII-001, VII-002, VII-003, VII-004, VII-005,
VII-006, VII-007, VII-008, VII-009, VII-010
seeded I-001 … VI-013
```

121 cards seeded (I 12, II 31, III 30, IV 22, V 13, VI 13); no VII id in the
seeded line. Six still audits, all 0 mismatches. The Act II audit's
`in_db_not_repo: ["II-031"]` is expected — `cards/II-031.json` has no still, so
the still audit has nothing to compare; the card seeded normally.

**Live DB verification.** 121 rows, zero `VII-%` rows. The run diffed against
`cards/*.json` is exactly the ten VII files.

**No code change.** Docs: `ROADMAP`, `AUDIT` §16 (seed + the known 40-question
compression). Suite remains 255/255, `tsc` 0.

**Next:** the art list in `AUDIT.md` §16, and a device playthrough of 5.1 → 8.3
(nobody has driven the Act VII scenes on hardware). Watch pacing between 6.2 and
7.1 — that stretch gained the most dialogue.



## 2026-10-30 - deploy + launch save for the Act VII device run

**Deploy.** Pushed 29 commits (9113d44..76e8ce9). Railway pink_menace
deployment of 76e8ce9 reached SUCCESS. card-updater was already CRASHED and
was left alone in this step.

**Launch save.** Production drive_progress had one row (00942cdb-...) at
2.3a / met_deac, no items. Backed up to drive_progress_backup_20261029
(1 row), then set that row to scene_id 5.1, checkpoint chainup_reached,
items ["chains"], flags.has_chains true, runner_state null. Reached the DB
over the Postgres TCP proxy (no URL or credential printed); temp script deleted.
No code change. To restore the old save: copy the row back from the backup table.

**Next:** open /drive on the phone (no stale tab open), play 5.1 -> 8.3, note FPS
and the 6.2 -> 7.1 pacing.

## 2026-10-30 — delete the crashed card-updater function

The function crash-looped on deployment a263a95e since 2026-10-25.
index.tsx line 1 was `import { Bun } from "bun"`, so Bun was undefined and
line 3 threw on Bun.env before any SQL. The body was a one-shot UPDATE of
II-017 (scene, decision, debrief, hook, option a). That text is already in
cards/II-017.json and went out with the Act II seed, so the function had
nothing left to write. Deleted it. `railway functions list` now reports no
functions in production. pink_menace and Postgres were not touched. This does
not seed VII-001, so the drive grade 404 is unchanged.

## 2026-10-30 — seed Act VII text so the drive can grade

`POST /api/drive/card-answers` 404s when the card is missing, and the overlay
calls any non-OK response "Couldn't reach the ledger." VII-001…VII-010 were
absent on purpose. `scripts/seed-cards.js` now writes that scaffold with a
null image. `deckWhere()` in `src/game.js` (and the parent catalog) keeps the
card game from dealing the same `variation.forced` sentence.

Seeded the ten against production. Live check: 10 rows, `image_bytes` null,
28 options on the seven decision cards (VII-004, VII-009, VII-010 have none).
Still audit for act VII: compared 0, `in_db_not_repo` is the ten ids, exit 0.
`validate-act-vii.js` ok. `drive/test/seed.test.ts` 6/6. No stills.

## 2026-10-31 — Act VII drive stills

Compiled each card with `assemblePrompt` and attached the locks from
`resolve-refs` (cabin, Beetle exterior, Gracie, Mya, Quiet plates, Deac's
clipboard ref). Generated `cards/VII-001.jpg` … `VII-010.jpg` and seeded
them. Live rows are `image/jpeg`, byte lengths matching the files. The
card-game hide stays: `variation.forced` still matches the scaffold sentence,
so `/` does not deal them. `validate-act-vii.js` now requires the still file.
`seed.test.ts` 6/6.

Known misses, not regenerated again: VII-001 and VII-003 dropped the
windshield mesh; VII-002's sky went warm; VII-008 is the door and mirror
rather than a seat-height look into the glass. The Beetle, the pink dash,
and Gracie in the carrier hold on the cockpit cards that kept the mesh
(VII-005, VII-006, VII-007).

## 2026-10-31 — the drive's card still was cropped to the viewport (II-019)

**Report.** "Green Light, Black Ice" (II-019, THE GRID · HAZARD) rendered
zoomed in until the traffic light filled the image box.

**Diagnosis (nothing changed before this point).**

1. *Data.* The master is `cards/II-019.png`, 1024x1536, 2,043,225 B, added
   once in `888e05f` and never modified. Both surfaces read the same
   `cards.image_bytes` row, encoded by `scripts/encode-still.py` to a
   768x1152 WebP (43,712 B, md5 `42282cb2c9d2c1fa1b80757596ad9366`): the card
   game via `/api/run/image/II-019?v=a88` (`src/game.js:236`), the drive via
   `/api/drive/image/II-019` (bundled `cards.json:1359`). The 2026-10-29 live
   seed's Act II still audit was `compared 30, match 30, mismatch 0` (II-031 has
   no still), so the prod bytes are the repo encode. Not a crop, not a plate.
2. *Card-game box* (`public/shared/app.css`). 390x844: `.shot-wrap`
   360.8x541.2 (`aspect-ratio: 2/3`), `.shot` `object-fit: contain`,
   `object-position: 50% 50%`, `.ken-object` push-in stops at `scale(1.10)`.
   1280x800: box 366x336 (`max-height: 42dvh`), contain letterboxes to
   224x336. Whole plate both times, checked on the real page (real `app.js` /
   `feel.js`, stubbed API) in headless Chromium.
3. *Presence.* `paintFear` only adds handprints/palm/vignette (opacity from
   `--quiet-loud`); nothing scales `#shot`. The `ride-look-*` pans (≤1.7) need
   `#run.riding` plus a ride-along card; II-019 has neither.
4. *Drive overlay.* `drive/src/components/Game3D/CardOverlay.tsx` painted the
   still `position:absolute; inset:0; objectFit:'cover'`. Measured: 390x844 →
   painted 562.7x844, 30.7% of the width gone (69.3% of the plate on screen);
   844x390 → painted 844x1266, 69.2% of the height gone (30.8% on screen);
   1280x800 → 58.3% of the height gone. That is the reported frame, and
   `THE GRID · HAZARD` is this overlay's kicker format.
5. *Regression.* `git log -S "objectFit: 'cover'"` → `2c1b107` "Redesign drive
   as a single immersive cockpit surface" (2026-09-26) replaced the
   `objectFit: 'contain'` of `1ec6ca8` with the full-bleed backdrop. It sits
   outside `9113d44..HEAD`, and nothing in that range touched the served card
   game (`git diff --stat 9113d44..HEAD -- public/` is empty), the image
   routes, or `cards/II-019.*`. The schema's new `beat` branch only relaxes
   required fields, and the `cards.json` re-export kept every `image` path.

**Fix.** New `drive/src/components/Game3D/cardStillStyle.ts` holds
`CARD_STILL_FIT = 'contain'` and the still's style; `CardOverlay.tsx` renders
that, and its `backdrop` entry is gone. The scrims and the dock stay — they
dim, they do not crop. II-019 after: 390x844 → painted 390x585, 844x390 →
260x390, 1280x800 → 533x800 — 100% of the plate at all three, letterboxed.

**Tests.** `drive/test/cardStill.test.ts` (5): the style is `contain` with no
transform/zoom, the whole plate at all three viewports, the `cover` numbers
above pinned as the regression, the overlay uses the shared style with no
inlined `objectFit: 'cover'`, and II-019 is the deck's Green Light, Black Ice
on `/api/drive/image/II-019`. `260/260` vitest across 28 files (255 + 5),
`tsc --noEmit` exit 0, `bench/baseline.json` restored. No seed, no deploy; the
cockpit bundle is rebuilt from source at deploy time (`Dockerfile` stage 1).

## 2026-10-31 — 5.2's chain-up could not be finished (Bug 1)

**Report.** The objective said to pick up the tensioner, nothing happened when
the car got there, and there was no way to tell where "there" was.

**The chain, as it was.** `5.2.entry` (branch: `has_item chains`) → `5.2.0`
(direction) → `5.2.1` (Deac: "Chain-up. Pull in. I'll watch the grass.") →
`5.2.card_VII-002` → `5.2.2` → `5.2.go` (`start_gameplay: chainup_qte`) →
`Simulation.startMission("chainup_qte")` → `ChainupRun`. Everything else hung
off two events that only `ChainupRun` emits:

| Trigger | Emitted when (before) | Node waiting on it |
|---|---|---|
| `chainup.qte.drop` | inside the pad AND (`throttle > 0.75` \|\| `horn` \|\| `brake > 0.92`) | `5.2.drop` → `5.2.drop2` (leaf) |
| `chainup.qte.success` | inside the pad AND `0.2 < brake < 0.85` AND `\|speed\| < 2` AND `throttle < 0.2` for 3.5 s | `5.2.3` → `5.2.end` → `5.3` |
| `noise.yellow` | the noise system | `pool:noise_yellow` |
| `mission.fail.swarm` | the Quiet | `5.2.swarm` → `5.1` |

**Root cause.** The success window excluded the only brake a player can make.
Keys and pads are binary and the pedal ramps to 1.0 in 0.6 s
(`KENT_BRAKE_UP = 1.6/s`), so holding the brake sits at 1.0 — above the 0.85
ceiling — and 1.0 is also above the 0.92 drop threshold, so stopping the car
fired "the tensioner hits the ice" every 4 s (`dropCd`) and `hold` could never
reach 3.5 s. Success was unreachable from a keyboard or a phone, and nothing on
screen named the gesture: the objective was "Tighten. Don't drop it." and the
only marker was the 6 m pink pad the car spawns on.

**Geometry.** `grade.chainPad` is `{ x: 2286, y: 1028, w: 28, h: 44 }` and the
pin (`markers.chainup`) is `(2300, 1050)`. `starts.chainup_pullout` is the pin,
so the car starts *inside* the pad; the miss was the gesture, not the drive.
Arrival was `rectHas(pad, pos)` only — no nose, no radius.

**Fix.** `chainup.ts`: arrive = inside the pad **or** within `CHAIN_ARRIVE_M`
(26 m) of the pin, no heading test; stopped = `|v| ≤ 1.5 m/s`; tighten =
**any** brake (`≥ 0.12`) with no throttle, held `1.6 s`; drop = throttle > 0.6,
horn, or a stab (`brake > 0.9` while still rolling above 3 m/s). Three stages
drive → stop → tighten, each with its own objective line in Deac's voice, the
distance while it matters, and a cockpit prompt while it bites:

- drive: "Chain-up is <n> m up the grade. Pull in at the sign and stop."
- stop: "You're in the pull-out. Stop it. Ease off — don't stab it."
- tighten: "Brake down and hold. Drape, hook, tighten. Don't drop it." +
  `CockpitQTE` ("HOLD THE BRAKE", progress bar, "HOLD ↓ / S · or pull the gas
  stick back") at `z 246`, above dialogue and card.

**Verified.** `drive/test/chainup.test.ts` (5) drives the real `Simulation`
into a real `DialogueRunner`: arrival at 40 m → stop → brake 1.0 → `success` →
`5.2.3` → `5.2.end` → `5.2->5.3` with `chains_mounted`; generous arrival (20 m,
nose down-grade) also finishes; a stab at 8 m/s and a rev both drop and never
succeed; no chains still routes `5.2->2.8` with `chainup_blocked`. `265/265`
vitest across 29 files, `tsc --noEmit` 0, headed Chromium screenshot at
390x844/844x390/1280x800 shows the prompt and the per-step objective.

## 2026-10-31 — the cockpit bands: no overlay sits on another (Bug 2)

**Report.** On a device the cockpit overlapped itself and was unusable.

**Diagnosis (headed Chromium, 390x844 / 844x390 / 1280x800, four states).**
Every surface placed itself with its own magic number, so the overlaps were
geometry, not z-order:

| pair | where | before |
|---|---|---|
| horn button ∩ dialogue box | 390x844, 844x390 | (310,684 64x64) over (16,567 359x253) |
| horn button ∩ first dialogue option | 390x844, 844x390 | (310,684) over "Chains on, then up. Slowly." |
| card still ∩ dock | all three | still box = the whole viewport (390x844 / 844x390 / 1280x800), painted full-bleed at `brightness(0.6)`, with the card's answers under the dock's scroll (D at y=898 on an 844-tall screen) |
| GracieQTE ∩ nav cluster | 844x390 | prompt (293,66 257x165) over the dash |
| quiz overlay ∩ HUD | all | quiz root z 100 < world HUD z 210 — the meter could paint over a quiz |

Layer stack before: hud 50 · scare 205 · world-hud 210 · nav 215 · sticks 220 ·
dialogue 220 · qte 230 · card 240 · debrief 245 · pause 250 · menu 300.

**Fix.** `cockpit/layout.ts` — three named bands (`top` HUD/objective, `body`
3D + still + QTE, `bottom` dialogue/dock/sticks), per shape (portrait 224 /
0.52 / 176 sticks; landscape 176 / 0.50 / 176; desktop 224 / 0.44 / 176) and a
`compound` frame (76 px top) for cards, quizzes, debriefs **and choices**, where
the driving HUD stands down. Then every surface moved onto a band and named
itself with `data-layer`:

- horn/lights → a right/left rail inside the body band (never the bottom band).
- dialogue → bottom band; above the sticks in portrait, between them in
  landscape (`padding: 0 168px`), `overflow-y: auto` with a band-derived max
  height.
- card → `still` band + `dock` band, stacked in portrait and side by side in
  landscape; the still keeps its own box (`contain`), the dock scrolls.
- QTE prompt → centred in the QTE band (top band → bottom edge), z 246.
- quiz root z 100 → 232 (above every HUD layer).
- safe-area insets on all three bands.

**Overlaps after: 0 in all twelve viewport×state combinations** (the spec below
fails on any pair). Card still is fully above/beside the dock at all three
shapes: 374x330 above 422 in portrait, 381x298 beside x416 in landscape,
1264x340 above 432 on desktop.

**Also from the same pass.** In landscape the act badge kept 	ranslateX(-50%) with
left: auto, which pushed half of it off screen, and the TP chip had been moved onto
the same corner — badge to the left column at 10 px, TP to the right of it at
right: 60, next to the pause chip.

**Found while verifying.** A cached still never fired `onLoad`, so `imgReady`
stayed false and the plate rendered at `opacity: 0` — an empty band on any
second viewing of the same card. The still no longer has an opacity gate.

**Tests.** `drive/e2e/cockpit-layout.spec.ts` — three tests (one per shape), four
states each: asserts no two interactive layers' boxes intersect, asserts the
card's still sits clear of the dock and that the plate actually decoded, and
stores 12 screenshots in `drive/e2e/cockpit-layout.spec.ts-snapshots/` (headed
Chromium, WebGL canvas hidden so the baseline is the layout, not the GPU).
`PW_HEADED=1` in `playwright.config.ts` runs the rest of the e2e suite with a
window; the config also points at the Chromium on disk when the default lookup
misses. Existing `mobile-layout.spec.ts` still passes (the nav cluster moved to
104 px, under the act badge with air). `265/265` vitest, `tsc --noEmit` 0,
`npm run build` 6.25 s / 3,993 kB (1,318 kB gzip).

## 2026-11-01 — a card could leave the driving HUD down (stuck in 5.2)

**Report (phone, portrait).** In 5.2 with the chains in the trunk the VII-002
card and the 5.2 dialogue play, `start_gameplay: chainup_qte` runs, and the
screen shows the car with no sticks and no dashboard. The player is stuck.

**Diagnosis (headed Chromium, 390x844, two ways in).** Run from a direct resume
into 5.2 *and* from the real arrival (`QuietRoads.startAct('5.1')` → climb →
`waypoint.reach:chainup` → `5.1.end` → 5.2 — which still carries
`missionId: climb_snoqualmie` and the climb objective at 5.2 entry until
`5.2.go` replaces them). Steps, both runs: 5.2.0 (direction) → 5.2.1 (Deac) →
`5.2.card_VII-002` → answer a / CONTINUE → 5.2.2 (Ali) → tap → `5.2.go`.

| read after `5.2.go` | direct resume | 5.1 arrival |
|---|---|---|
| `phase` | driving | driving |
| `missionId` | chainup_qte | chainup_qte |
| `objective` | "Brake down and hold. Drape, hook, tighten. Don't drop it." | same |
| `qte` | HOLD THE BRAKE, progress 0 | same |
| `sim.frozen` | false | false |
| layers | hud · pause · badge · nav · world-hud · lights · horn · sticks · qte | same |
| throttle 2.5 s | z 1050 → 1053.96 | z 1050 → 1054.03 |

So at HEAD the **answered** path is clean, and `start_gameplay` really does run
`chainup_qte` with the cockpit up. Two things were still wrong:

**(1) The hiding state is the phase flag itself.** `useCompoundCockpit()` read
`phase === 'card' | 'quiz'` as "a card is open", and `KentDash`, `QuietHUD` and
`TouchOverlay` each carried their own `phase` gate. A phase left at
`card` / `quiz` / `dialogue` with nothing on screen is exactly the reported
screen — the car, no sticks, no dash, no meter, no dialogue — because each
surface asks the flag, and no surface asks whether a mission is running.
Reproduced deterministically: force `phase: 'card'` on a live mission and the
pre-fix build leaves `[data-layer="sticks"]` **not in the DOM at all** (Playwright:
"element(s) not found"), and it never comes back. That is the bug's shape on
every close path that can leave a flag behind, not only 5.2's.

**(2) This client has no card timer.** `timeout_option_id` / `timeout_ms` live in
the deck (VII-002 = `b` / 12 000) and the card game honours them, but
`CardOverlay.tsx` and `DialogueRunner` never read them: left 12.5 s, VII-002 is
still open with `phase: 'card'`, and a hazard card with no grade renders no
CONTINUE, so there is no way to dismiss it at all. Recorded in AUDIT §20; not
changed here (it is a card-surface question, not a cockpit one).

**Sweep.** A script over every `dialogue_act*.json` finds 28 card → `start_gameplay`
pairs in 13 scenes: `0.2` (I-002/I-003/I-004 → tutorial_carport), `1.2`
(I-005 → minigame_park_dol), `1.3` (I-006 → chase_dol_gracie), `2.3a`, `2.3c`,
`2.5` (III-002…III-006), `3.1b` (V-001…V-012 → mission_ribbon_merge), `5.1`,
`5.2`, `6.1b` (VI-001…VI-012), `6.2`, `6.3`, `7.1`. **8.1 is not one of them**:
its card (VII-008) sits at the parking gap *after* `8.1.go` has already started
`spokane_home`, so it is measured from the mission side.

**Fix — one rule, no flags to clear.** `quietroads/cockpit.ts`:
`compoundOpen()` is the surfaces themselves (card / quiz / debrief / choice),
never the phase; `showDrivingHud()` is that plus `missionActive`, plus the
untouched free-roam/paused cases; `staleCockpitFlag()` names what is holding the
HUD down; `cockpitPhaseFor()` says which phase a running mission wants.
`qrHud.missionActive` has one writer, `QuietRoadsBridge.syncMission()`, keyed on
the scene the mission was started in (`missionScene`), so a mission left over
from the previous scene can never force a cutscene scene to drive. The bridge
reconciles once a frame (`reconcileCockpit()`, before the phase gate): mission
running + nothing on screen + a non-driving phase ⇒ `console.warn` naming the
flag, stale `freeze('card')` / `freeze('quiz')` released, and `enterDriving()` /
`enterWalking()`. `CockpitHUD` keeps a one-second watchdog that calls the same
path if anything ever outlives the reconcile. `KentDash`, `QuietHUD`,
`TouchOverlay` and `CockpitHUD` all read the rule. The sticks' rule only ever
*adds* them (a dialogue choice still keeps them, as it always did), so the
cockpit grid baselines did not move.

**Tests.** `drive/test/cockpit-hud.test.ts` (15) — the rule on the real
`qrHud` + `gameStore`: down while a card / quiz / debrief / choice / pause is
open; up after answered, timed-out and continue-only closes each followed by
`start_gameplay`; up with a stale `phase: 'card'` / `'dialogue'`, which is also
what `staleCockpitFlag` names and what `cockpitPhaseFor` repairs (to `walking`
for the walker missions). `drive/e2e/cockpit-restore.spec.ts` (10) — headed
390x844, one test per sweep scene (5.1, 5.2, 6.2, 6.3, 3.1b, 6.1b, 1.2, plus
5.2 timed out), 8.1 from the mission side, and the safety net: a forced stale
phase on a live mission must leave sticks + nav on screen, the phase repaired
and `[cockpit] phase="card" …` in the console. That safety-net test fails on the
pre-fix tree ("element(s) not found" for the sticks) and passes here.

**Verified.** `280/280` vitest across 30 files (265 + 15), `tsc --noEmit` exit 0,
`npm run build` 5.25 s / 3,996 kB (1,319 kB gzip), playwright headed
`cockpit-restore` 10/10, `cockpit-layout` 3/3 (all 12 stored screenshots
unchanged), `mobile-layout` 1/1, `smoke` 1/1. `bench/baseline.json` restored. No
seed, no deploy: the cockpit bundle is rebuilt from source at deploy time.

**Affected scenes (the sweep).** Every card node that hands into `start_gameplay`
— 28 pairs in 13 scenes (`0.2`, `1.2`, `1.3`, `2.3a`, `2.3c`, `2.5`, `3.1b`,
`5.1`, `5.2`, `6.1b`, `6.2`, `6.3`, `7.1`) — because the failure is the phase
flag, and all of them set it. Measured on 5.1, 5.2 (answered and timed out),
6.2, 6.3, 3.1b, 6.1b and 1.2, plus 8.1 from the mission side.

## 2026-11-01 — the drive's cards run the card game's clock (AUDIT §20)

**Report.** `CardOverlay` ignored `timeout_option_id` / `timeout_ms`, so a hazard
card left alone never resolved: VII-002's 12 s meant nothing, and a card that
never reached the ledger showed no CONTINUE at all.

**What was missing underneath.** The drive's deck copy
(`drive/src/quietroads/data/cards.json`) didn't carry the two fields: 17 of the
131 cards declare a clock in `cards/*.json` (I-007, II-005/014/019/026/030,
III-005/009/016/022/027, IV-005, V-006/011, VI-004/009, VII-002 — all 17 already
in the drive deck), and the bundle copy had none of them. The deck is now
carried with them: **34 added lines, no deletions** (both fields under each of
the 17 `card_id`s), so the client's data matches the card game's.

**Fix.** `quietroads/cardTimeout.ts` is the whole rule, no DOM: `cardClock(card)`
returns `{optionId, ms}` or null (`Number(card.timeout_ms) || 24000`, the card
game's default; an id the card cannot offer is *not* a clock), and
`CardCountdown` is a pure clock — it only moves when `advance()` is given running
time, so a paused clock simply isn't advanced and nothing fires twice.
`components/Game3D/useCardCountdown.ts` is the wiring: a 100 ms tick that pauses
when the cockpit is paused (`phase !== 'card'`) or the tab is hidden
(`visibilitychange`), and calls `onExpire` on the tick the clock hits zero.
`CardOverlay` runs it for graded cards only, draws the countdown bar in the dock
(`data-layer="card-clock"`, the option it will pick, whole seconds, the bar
1 → 0), and on expiry calls the **same** `pick(timeout_option_id)` the option
buttons call — so the grade, the verdict, the debrief and `finishCard` are
identical to a tap, and the story logs `card:VII-002:b`. Beat/continue-only
cards and cards with no timeout id have no clock at all. CONTINUE now renders
whenever the card is resolved *or* unreachable (`grade || !graded || offline`), so
a card can always be dismissed; the cockpit rule from `e88d78b` restores the HUD
afterwards because nothing about the close path changed.

**Tests.** `drive/test/cardTimeout.test.ts` (15): the clock the deck carries
(17 cards, VII-002 = b / 12 000), the 24 s fallback, "no timeout id, no clock",
the expiry picking the timeout option and it being a real gradable option, one
fire only, overshoot clamped, the bar 1 → 0 and the label, and a paused clock
that neither moves nor fires (a 30 s pause does not spend the decision).
`drive/e2e/cockpit-restore.spec.ts` — the 5.2 case is now the real clock, not an
emulation: it waits VII-002 out, checks the bar shrank, that the timed option's
own verdict and debrief are on screen, that CONTINUE is there and dismisses it,
that the record says `card:VII-002:b`, and that the chain-up mission starts with
the sticks and dash up. A second test holds the clock still while the cockpit is
paused and while the tab is hidden (`document.hidden` + `visibilitychange`), then
sees it resume — the pause only means anything if it is measured.

**Everything headless.** `cockpit-layout` and `cockpit-restore` no longer open a
window (`test.use({ headless: true })`). The layout baselines were headed
Chromium; the three **card** frames were re-recorded headless — the card state is
the only one whose pixels depend on the renderer (the still's resampling) and it
also now carries the clock bar. `hud`, `dialogue` and `qte` are byte-identical,
and the geometry assertions (no two interactive layers intersect, still clear of
the dock, plate decoded) pass unchanged at all three shapes.

**Verified.** `295/295` vitest across 31 files (280 + 15), `tsc --noEmit` exit 0,
`npm run build` 5.33 s / 4,000 kB (1,320 kB gzip), playwright **headless**
20/20 (cockpit-layout 3/3, cockpit-restore 11/11 — the real 12 s expiry and the
paused/hidden clock, mobile-layout 2/2, smoke 2/2). No seed, no deploy.

## 2026-11-01 — the card clock runs the card game's timing (AUDIT §22)

**The card game's grace, with line numbers** (`public/game/app.js`): `armHazardWindow`
(`:711-747`) arms only for `hazard`/`beat` cards that name a `timeout_option_id`
(`:552-560`), sets `const grace = 1750` (`:720`) and `const wind = 800` (`:721`),
hides the clock for the grace (`:726-729`), shows it full at 1 750 ms (`:731-739`),
and calls `startHazardWindow` at 2 550 ms (`:740-746`). `startHazardWindow`
(`:749-777`) spends time **only** while `choiceDockInView()` (`:765`), and
`choiceDockInView` (`:592-598`) is `box.top < runBox.bottom - 8 && box.bottom >
runBox.top + 8`. So: 2 550 ms before the decision starts, and never while the
answers are off screen.

**What changed in the drive.**
- `quietroads/cardTimeout.ts` — still pure, no DOM. `CARD_GRACE_MS` 1 750,
  `CARD_WIND_MS` 800, `CARD_ARM_MS` 2 550; `CardCountdown` gained `phase`
  (`grace` → `wind` → `running` → `done`), `shown` (false through the grace, so
  the bar is not on screen — the card game's `hidden` class) and `visible` (the
  decision is spent only while true; the grace and wind-up elapse regardless,
  because they are `setTimeout`s in the card game). `advance()` spends the delay
  first and only the overflow against the decision, so a 100 ms tick straddling
  2 550 ms charges the 50 ms past it. `optionsInView(options, viewport, slack = 8)`
  is `choiceDockInView()` as a pure box test; an unmeasurable box counts as
  visible, because a held clock with no answers on screen would strand the card.
- `Game3D/useCardCountdown.ts` — the wiring: measures the answers' box against the
  dock's box on every tick and sets `visible`; exposes `shown`/`armed`. The old
  pauses are untouched (`phase !== 'card'`, tab hidden).
- `Game3D/CardOverlay.tsx` — `dockRef` + `optionsRef` (the answers' block is now
  `data-layer="options"`), the gate passed to the hook, and the bar rendered only
  when `countdown.shown`.

**Tests.** `drive/test/cardTimeout.test.ts` 15 → **26**: the three phases and the
bar's visibility, nothing spent before the wind-up, expiry at grace + wind + ms, a
paused clock that does not spend the grace either, the `optionsInView` geometry
(inside / above / below / 8 px slack / unmeasurable), off-screen answers spending
nothing and resuming where they were, and a mid-decision scroll costing nothing.
`drive/e2e/cockpit-restore.spec.ts`: the 5.2 expiry now measures the grace from the
card opening with an in-page recorder (the walk's 600 ms poll is coarser than
1 750 ms), asserts `>= 1600 ms` and a full bar on arrival, and the spec gained a
scrolled-out-of-view case at 390x560 (hold 3.5 s off screen, count once scrolled to,
hold again back at the scene). `cockpit-layout`'s card state waits for the bar, so
the three card frames stay byte-identical.

**Verified.** `306/306` vitest across 31 files (295 + 11), `tsc --noEmit` exit 0,
`npm run build` 6.20 s / 4,001 kB (1,320 kB gzip), playwright **headless**
**21/21** (20 + the new gate case): `cockpit-layout` 3/3 with no screenshot diff,
`cockpit-restore` 12/12 (5.1, 5.2 answered, 6.2, 6.3, 3.1b, 6.1b, 1.2, 5.2 timed
out with the grace measured, 8.1, stale phase, paused/hidden, scrolled out of
view), `mobile-layout` 2/2, `smoke` 4/4 — run one batch at a time, because this
runner kills a command at 30 s. `bench/baseline.json` restored after the suite. No
seed, no deploy.

## 2026-11-01 — the deck copy cannot drift again (AUDIT §23)

**There was no export script.** `docs/DRIVE.md` said "re-export it when cards
change" and the bundle was maintained by hand — which is how it lost the 17 cards'
clocks (§21) and never carried `callback_of`/`schedules_callback` at all.

**One field list, one place.** `scripts/drive-card-fields.js` holds `CARD_FIELDS`
(20, in the bundle's own order), `OPTION_FIELDS` (`id`, `text` — the answer key
never ships), `SOURCE_FIELDS` (all four citation fields) and `imagePathFor`
(`/api/drive/image/<id>`, the rule `src/routes-drive.js:187` applies), plus
`bundleCard(raw, { hasStill })`. `scripts/export-drive-cards.js`
(`npm run export-drive-cards`) reads `cards/` with the seed's file filter, sorts by
file, refuses a missing/mismatched/duplicate `card_id`, and writes the bundle
1-space indented, CRLF, no trailing newline — the shape it already had, so a
re-export diffs only what changed.

**The guard.** `drive/test/deck-parity.test.ts` (5) loads all 131 `cards/*.json` and
the bundle: same cards and order, then every field the drive reads (`id`, `title`,
`scene`, `decision`, `options` id+text, `debrief`, `timeout_option_id`,
`timeout_ms`, `card_type`, `callback_of`, `schedules_callback`, `source`, image
path) with a failure that names the card and the field; the exact key shape, so a
hand-added field cannot survive; the image path against the stills on disk; and the
absence of the answer key (an option's keys must be exactly `id` + `text`).
`correct`/`result` are compared in the safe direction only — the deck has them, the
bundle must not.

**Drift it found on the bundle as it stood.** `schedules_callback` on all 131 cards
(`true`/`false` → absent) and `callback_of` on 8 (II-010 → II-007, II-031 → I-003,
III-010 → III-005, III-020 → III-016, IV-012 → IV-005, VI-011 → VI-004, VII-007 →
V-006, VII-010 → VII-002). Nothing else — title, scene, decision, option ids and
texts in order, debrief, card_type, both clock fields, `source` and every image path
already matched. The re-export is **262 added lines, no deletions, no id touched**
(131 + 131), and a second run changes nothing.

**The other path.** The card game reads Postgres only (`public/game/app.js` →
`/api/run/*` → `src/game.js` SELECTs `cards`/`card_options`), and
`scripts/seed-cards.js` carries all 25 top-level fields, all 5 option fields and the
whole `source` object inside `extra` (which is how `stat_cited`, not a column,
survives). Checked mechanically: no field is dropped, so no drift there.

**Verified.** `311/311` vitest across 32 files (306 + 5), `tsc --noEmit` exit 0,
`npm run build` 4.74 s / 4,006 kB (1,321 kB gzip), playwright **headless** 21/21
re-run after the data change (`cockpit-layout` 3/3, `cockpit-restore` 12/12,
`mobile-layout` 2/2, `smoke` 4/4). `bench/baseline.json` restored. No seed, no
deploy.



## 2026-11-03 — the summit deadlock, the missing texture, the saved names

Reported from a phone HAR: a save at scene 5.3 (`checkpoint: chains_on`,
`chains_mounted: true`) parked after the VII-003 card and ignored every control.
The chain-up was fine; the scene one later was not.

### 1. 5.3 could not be finished (`1f168d6`)

5.3 is a cutscene: `5.3.pre` (direction) → `5.3.card_VII-003` → `5.3.hold`
(`wait_for: "cutscene.summit_clear"`) → … → `5.3.end` → 6.1. Nothing emitted
`cutscene.summit_clear`, so the runner waited forever; no mission was running, so
the cockpit rule correctly hid the dashboard, and the save resumed into the same
trap every reload. 3.4's `cutscene.gracie_yell` was an orphan of the same shape.

- `quietroads/waitWatch.ts`: a `cutscene.*` wait with no mission this scene
  started and no card/quiz/debrief/choice open resolves after `CUTSCENE_WAIT_S`
  (2.5 s); any other wait that stands `STRANDED_WAIT_S` (8 s) logs
  scene/node/event and raises `qrHud.stranded`. The clock holds while paused or
  hidden. Spokane's 8.2 marks keep their gate: `Simulation.onStoryWait` answers
  them while `spokane_home` runs, and the rule requires `missionActive === false`.
- `StrandedContinue.tsx` (mounted beside `DialogueBox`, z 234 over the dialogue
  tap-catcher at 228) puts a Continue chip in the compound frame's body band;
  `QuietRoads.continueStranded()` fires the awaited event on the game bus.
- `test/deadlock.test.ts`: every `wait_for` and `triggers[].event` must name an
  event the source really emits. `test/emitInventory.ts` measures the emitter set
  from `drive/src` (event-shaped string literals, template prefixes cut at `${`,
  `SpokaneRun.onStoryWait`'s Set, the cutscene prefix). `test/fullchain.test.ts`
  now uses the same inventory and refuses to fire an event the game cannot emit —
  proof it catches the bug: with the cutscene prefix disabled it fails naming
  `5.3/5.3.hold -> cutscene.summit_clear` and `3.4/3.4.wait_yell -> cutscene.gracie_yell`.
- Orphans found and wired: `cruise.idle.night` (6.2, `BeatRun.straight`),
  `nozone.exit` (7.1, `EscortRun`), `mission.complete.quiet/loud` (4.3,
  `Simulation` at `week.elapsed`), `stall.pullup.quiet/squeal` (3.3,
  `ConvoyRun.afterStall`), and `shop.close` (an idle shop scene is treated as a
  wait on it, so 2.6/2.7/2.8/7.2 can hand off — a tap or the Continue chip closes
  the counter). `bridge.wait:*` (6.3) was a false negative (template literal).
  Still unported and allow-listed with a reason in `UNWIRED`: `shop.buy:*`,
  `shop.cant_afford` (the counter UI) and `qte.strap.*` (the tow-strap gesture).

### 2. The world's texture (`37f104f`)

Every Kenney GLB references `Textures/colormap.png`; the file never existed in the
repo or the build, so each load asked for it and the SPA fallback answered
`index.html` with a 200. `drive/scripts/build-model-colormaps.mjs`
(`npm run build:colormaps`) generates a deterministic 512×512 atlas from each
GLB's own TEXCOORD_0 bounds (zlib only) with per-model palettes, committed beside
the models; `test/model-textures.test.ts` fails on a missing/non-PNG reference;
`server.js` returns a real 404 under `/drive/models` and `/drive/assets`.

### 3. The canon names (`3746db3`)

The save carried `GRANDMA_INITIALS: "G.J."` / `GRANDMA_NAME: "June"`, and the
bridge applied the save over the defaults, so the corrected `— G.` never reached
an old save and Grandma's spoken name collided with June, the Act II neighbour.
`quietroads/placeholders.ts` owns the canon set; `qrStore` stops persisting
placeholders (version 2 + a canon-first `merge`); `DriveSync` stops sending them
and merges canon over the server copy. `GRANDMA_NAME` appears in
`dialogue_act2.json` ×5 and `dialogue_act4.json` ×1.

### 4. E2E (`8be4777`)

`drive/e2e/summit.spec.ts` (headless 390×844): a seeded save at 5.3 resumes, VII-003
answers, the story reaches 6.1 with no stranded state (11.4 s); a second case
renames 5.3.hold's event to `story.orphan_check`, waits out the 8 s net, sees the
Continue chip (`data-stranded-scene` 5.3, `data-stranded-event`), and the click
releases the wait (13.8 s).

### Verified

`332/332` vitest across 35 files (311 + 21: `waitWatch` 9, `deadlock` 10,
`model-textures` 2), `tsc --noEmit` 0, `npm run build` 5.76 s / 4,009.85 kB
(1,321.61 kB gzip), playwright **headless** 23/23 (`--workers=1`: summit 2/2,
cockpit-restore 12/12, cockpit-layout 3/3, mobile-layout 2/2, smoke 4/4).
`bench/baseline.json` restored after the suite. No seed, no deploy.

### Still open

- Act II's shop counter and 7.2's purchases are not ported; the scenes can be
  left, the buy branches cannot be reached (`UNWIRED`).
- The 3.3 tow-strap QTE is not ported (three allow-listed triggers).
- Unchanged: the 11 MB Beetle download, the deck bundle not regenerated at build.

## 2026-11-03 — follow pass: where the last session stopped, and the second way canon lost

**Step 0 (cold start).** `git status` clean, `main` level with `origin/main` at
`de2576f`; no playwright/vite process left from the earlier session, no
`drive\e2e-*.log`, `drive/test-results/` gitignored. All five items were **done and
committed** — `1f168d6` (1/2a/2b/2c), `37f104f` (3), `3746db3` (4), `8be4777` (5),
`de2576f` (docs). The session had stopped after the docs commit, before a final
verification pass; nothing was uncommitted.

**Verified the committed work (not re-done).** 332/332 vitest across 35 files, tsc
0, build 5.85 s / 4,009.85 kB, playwright headless `--workers=1` 23 passed in
4.6 min. The guards' honesty was re-proved independently by disabling the
cutscene rule itself: `deadlock` + `fullchain` then fail naming
`5.3/5.3.hold -> cutscene.summit_clear` and `3.4/3.4.wait_yell ->
cutscene.gracie_yell`, and pass once it is back. (Note for the next reader:
`cutscene.` is also a source literal in `waitWatch.ts`, so deleting only the
inventory's `out.set` proves nothing — the inventory still finds the literal.)

**Found — the canon names had a second way in (`4e6c354`).** §25 folded the save
under canon, but each act file carries `meta.placeholders`, four still said
`GRANDMA_INITIALS: "Grandma"`, and `DialogueRunner.load` merged a file *over* the
host's map — which the bridge fills with canon *before* the act is fetched. So
loading Act II (or 2.5 / 3.1b / 6.1b) put "Grandma" back on top of "— G." for
every scene in the act. No visible line uses the token there today, so the note
still read right; the next note line in Act II would have signed "Grandma".
`load()` now seeds a placeholder only where the host holds none (the rule it
already applied to vars and flags), the four files are corrected, and
`test/placeholders.test.ts` (12) pins the canon set, the save fold, every act's
defaults against canon, the `GRANDMA_NAME` inventory (act2 ×4, act4 ×1), the
runner's precedence in both orders (fails on the pre-fix `load()`), and
`qrStore` rehydrating a version-1 save with canon over it and no placeholders
written back.

**Found — the 404 had no guard (`6faafcb`).** `server.js`'s 404 for
`/drive/models` + `/drive/assets` is the half that keeps a missing texture from
being answered with `index.html`, and nothing held its order against the SPA
fallback. `model-textures.test.ts` +1 reads `server.js` and pins both.

**Docs.** AUDIT §26 records the above; §25's "`GRANDMA_NAME` ×5" corrected to ×4
(it counted the definition line); ROADMAP's current-pass block updated. §24/§25/§26
and the ROADMAP now carry the measured numbers below.

### Verified

`345/345` vitest across 36 files (332 + 13: `placeholders` 12, `model-textures`
+1), `tsc --noEmit` 0, `npm run build` 5.25 s / 4,009.89 kB (1,321.62 kB gzip),
playwright **headless** `--workers=1` **23 passed / 17 self-skipped / 0 failed**
in 4.7 min (both `summit.spec.ts` cases: 5.3 → 6.1 in 10.4 s, Continue on an
orphaned wait in 13.9 s). One run of this suite was invalid and discarded: the
dialogue JSON was edited under the running dev server, which hot-reloaded the
page mid-test (6 failures, every one `waiting for …` after a reload) — same
collision class as the `.playwright-artifacts` ENOENTs, so the suite was re-run
untouched and clean. `bench/baseline.json` restored after the suite. No seed, no
deploy.

**The seeded save is the reported save (`[e2e]`, after the docs commit).** The
spec's seed carried `items: ["chains"]` and `flags.chains_mounted` but not
`has_chains`, which the 2.8 purchase also sets — so the resumed save was one flag
short of the phone's. Added (`has_chains: true`); 5.3 does not read it, so it is
fidelity, not a behaviour change. `e2e/summit.spec.ts` alone, headless
`--workers=1`: 2 passed (11.1 s / 13.5 s), exit 0.

### Still open

- The shop counter (2.6/2.7/2.8/7.2 buys) and the 3.3 tow-strap QTE are still
  unported; `shop.buy:*`, `shop.cant_afford`, `qte.strap.*` stay allow-listed in
  `test/emitInventory.ts`.
- The 11 MB `vw_beetle.glb`; the deck bundle is not regenerated by the build.

## 2026-11-04 — the shop counter, the real atlases, the measured skips

**Step 0.** `git status` clean, `main` at `17a695c`, no dev server on 5173. Read
`AGENT_LOG`'s newest entry and `AUDIT` §25–§26 first, as asked.

### 1. The shop purchases were the chain-up loop (`43f628d`)

The guard's allow-list said `shop.buy:*` / `shop.cant_afford` were "not on any
forward path". They were. `5.2.block`'s `next_scene` is `2.8`; with no counter
the only exit from Tuna's was `2.8.end_reblocked` → `5.1` → `5.2.block` → 2.8,
forever. 7.2 could sell nothing, so `8.1.lights_branch` never took `lights_a`,
`8.1.cluster` never took `cluster_src`, `7.2.owned_branch` was dead, and
2.6/2.7's `has_gracie_toy` / `has_sori_card` (read at 5.3, 6.2, 6.3, 8.3) could
not be set. **And a ported counter alone would still have failed**: every
downstream check is `has_item`, and `2.8.buy_muffler` set only the flag,
`2.8.buy_leds` / `7.2.buy_leds` / `7.2.buy_muffler` / all four 2.7 buys granted
no items at all.

Ported the minimum: `quietroads/shop.ts` (catalogue: items, prices, the flag and
item each buy sets), `ShopCounter.tsx` (a list in the body band, only while the
runner is idle), and one bridge path — `buy(id)` checks `trade_points`, spends
them, writes the ledger, and fires the scene's own `shop.buy:<id>` trigger on
the same bus the sim uses; short → `shop.cant_afford`. `startGameplay('shop_*')`
opens the counter instead of toasting. Every buy node now grants the item its
consumers check. Tuna fronts the chains (`2.8.front_chains` /
`shop.front:chains`) when the loop is open and the set is out of reach — the
worst-case player has 134 TP against a 150 set, so without it the soft-lock
survives. `UNWIRED` is down to the tow strap.

`test/shop.test.ts` (9) + `e2e/shop.spec.ts` (3, headless 390x844). Negative
control: with the `shop_*` interception disabled the chain-up case fails at
"Tuna's counter is up" and the page shows the stranded Continue chip.

### 2. The atlases are the kits' own (`38e9ece`)

The GLBs are byte-identical to the Kenney packs on this machine (SHA-256, five
checked), so the packs are: **Car Kit 3.0**, **City Kit (Roads) 2.0**, **City
Kit (Suburban) 2.0**, **Modular Buildings 2.1** — versions and dates from each
pack's own `License.txt`, all CC0. The three `building-sample-*` GLBs are
Modular Buildings, not suburban, and the two packs ship different 512×512
atlases (three sampled pixels in four differ), so they moved to
`buildings-modular/` with their own atlas. The four atlases are the packs' files
now, replacing the 3 967 / 2 385 / 2 558 B stand-ins. `public/models/CREDITS.md`
records pack, version, date, licence, download URL, SHA-256 and byte length.
`build:colormaps` is the fallback and refuses to overwrite a present atlas.

`test/model-textures.test.ts` +6 (SHA-256 pins, the folder split, every
reference resolves) and `e2e/smoke.spec.ts` +1 (the wire: 200 + image/png + PNG
signature for all four). Negative control: rename `road/Textures/colormap.png`
away and the case fails with `200 text/html 657 B` — the original bug.

### 3. The 17 skips are measured (`fdd5c28`)

All 17 were the `mobile-portrait` run of a spec that sets its own viewport,
skipped with "viewport is set inside the test" — a claim. `e2e/skipDuplicate.ts`
now compares the project's viewport with the spec's and returns the reason only
when they are equal, so the report reads "the project is already 390x844, which
this spec sets itself" and the test runs the moment either number changes.
`cockpit-layout.spec.ts` no longer skips at all — the overlap rule runs on the
phone profile too (isMobile, DPR 2.75, Android UA), and only the DPR-scaled
`toHaveScreenshot` baseline stays in the 1x project.

### Verified

`360/360` vitest across 37 files, `tsc --noEmit` 0, `npm run build` 5.68 s /
4,015.89 kB (1,323.34 kB gzip), playwright **headless** `--workers=1` **48 tests
in 6 files: 31 passed / 17 skipped / 0 failed** in 5.8 min. `bench/baseline.json`
restored after the suite. No seed, no deploy.

### Still open

- The 3.3 tow-strap QTE is the last allow-listed surface (`qte.strap.*`).
- The 11 MB `vw_beetle.glb`; the deck bundle is not regenerated by the build.
- The road tiles and building facades still use the procedural maps on purpose
  (lane markings + the wet-surface pass).

## 2026-11-04 — the tab, the credits, the line endings

**Step 0.** `git status` clean, `main` level with `origin/main` at `9d027b4`, no
dev server on 5173.

### 1. Tuna's front is a debt, not a gift (`9398238`)

The front §27 added made the soft-lock exit *cheaper than buying* — no points,
same chains, and the one person nobody owes anything to handing over 150 TP of
stock. A gift is not a decision.

`quietroads/debt.ts` is the rule as one pure function: `settleDebt(award, debt)`
takes `min(award, debt)` out of a single award and clears the balance either
way. `qrStore.addVar` is the one writer of a Trade Point in the whole game
(dialogue `tp` effects, quiz answers, the Ritzville discount), so that is the one
call site — the tab cannot be dodged by earning somewhere the story did not
expect — and a spend (negative) and every other var are untouched.

`2.8.front_chains` now writes `set_vars.tuna_debt = 150` and hands off to
`2.8.front_chains_owe`: **"You'll owe me. Deac'll know."** Deac's line is
`5.2.debt_line` — **"Pay's in. Tuna's set came out of it. You're square with
her. Don't make a habit of it."** — reached from `5.2.3` (the pay that always
lands on the loop path) through `5.2.debt_branch`, which reads `tuna_debt_paid`.
Not an event: a trigger fired from the tick is dropped while a line is on screen
or interrupts `5.2.3` mid-sentence. The line clears `tuna_debt_paid` so a swarm
retry cannot replay it, and both vars are seeded in the act files' `variables`
so the branch can never read `NaN` (`NaN < 1` is false — it would have shown the
line to a player with no tab).

The soft-lock fix is intact: the front still grants the chains at 0 TP.

`test/shop.test.ts` 9 → 17 (catalogue price = the debt, the owe line's exact
text, `settleDebt`'s six cases, the front still hands over the chains, the 5.2
branch both ways, and the store's four cases) and `e2e/shop.spec.ts` +1 (a broke
player: front → owe line → 5.1 → chain-up → summit, `tuna_debt` 0, the dispatch
line recorded after `5.2.3`). Negative control: with the settlement disabled the
two store cases fail.

### 2. The CC-BY models are credited on screen (`acd6a5d`)

Two models are CC-BY-4.0 — the VW Beetle (LucasPresoto) and the low-poly cactus
(akaN0ob) — and a `CREDITS.md` beside the GLBs reaches nobody. The campaign also
ended on an unlock nothing showed: `8.3.end` unlocks `credits` and no screen
read it.

`quietroads/credits.ts` is the source of truth (title, author, source, licence,
deed per work, plus one Kenney line); `CreditsScreen.tsx` renders it as a panel
(not a phase) with a data hook per field; it opens on the `credits` unlock and
from the end-of-run screen. `CREDITS.md`'s "Not Kenney" table gained **Title**
and **Source** columns so the exact text is in one place.

`test/credits.test.ts` (4) pins the screen to that table field for field and
checks the component draws every field; `e2e/credits.spec.ts` walks the real
ending and reads the DOM against the markdown. Negative control: a one-character
title change fails the parity test.

### 3. One line ending per type (`299b751`, `0288383`)

`.gitattributes` first, on its own, then `git add --renormalize .` with nothing
else in it. The rules are the **measured** majority per type, not a preference:

    json 90/76 crlf   md 46/25 crlf   txt 40/22 crlf   html 2/2 crlf (247/89 lines)
    mts 12/0 crlf     mjs 1/0 crlf
    ts 74/62 lf       tsx 35/9 lf     js 33/25 lf      css 2/1 lf (1 658/436 lines)
    py 5/0 lf         sql 1/0 lf       svg 1/0 lf       dotfiles lf

`text=auto` is the floor; `png glb webp jpg jpeg gif ico pdf` are `binary`. The
renormalisation is 73 files, 30 311 insertions and 30 311 deletions, and
`git diff --ignore-cr-at-eol` over it is empty — every changed byte is a CR.
`git ls-files --eol` now reads `i/lf` for every text file and `w/crlf` / `w/lf`
per rule. The working tree was then refreshed (`git rm -r --cached .` +
`git reset --hard HEAD`) so the checkout matches; `git checkout-index -a -f`
does not apply the eol conversion, which is worth knowing.

### Verified

`372/372` vitest across 38 files, `tsc --noEmit` 0, `npm run build` 4.54 s /
4,020.27 kB (1,324.59 kB gzip), playwright **headless** `--workers=1` **52 tests
in 7 files: 33 passed / 19 skipped / 0 failed** in 6.1 min. The 19 skips are the
measured `mobile-portrait` duplicates (cockpit-restore 12, shop 4, summit 2,
credits 1). `bench/baseline.json` restored. No seed, no deploy.

### Still open

- The 3.3 tow-strap QTE is the last allow-listed surface (`qte.strap.*`).
- The 11 MB `vw_beetle.glb`; the deck bundle is not regenerated by the build.


## 2026-11-05 — the flood, the minute, the thumb (6.3's HAR)

**Step 0.** `git status` clean, `main` level with `origin/main` at `45c88fb`, no
dev server on 5173. Read the newest `AGENT_LOG` entry and `AUDIT` §20–§28 first.

### 1. Telemetry flood (`12870f3`)

The HAR: `speed.over:45` 1,693 times in 23 s, 466 POSTs to `/api/drive/events` in
the same span, `plow.used` 17 times in one instant. Two faults, both fixed.

**Emitters** (audited one by one in `sim/*.ts`): `speed.over:45` and
`steer.overcorrect` were level-triggered in `beats.bridgeCross` — now edge
(`>45` fires, `≤43` re-arms) and a held yank (0.35 s) reported once per 2 s;
`plow.used` fired every step in contact — now one row per contact episode, ended
by `PLOW_REARM_S` (1.5 s) of clear road. `noise.*`, `input.hard_*`, `shadow.*`,
`fatigue.*`, `skid.*`, `gracie.*`, `waypoint.reach:*` were already edge-triggered
or `once`. `waypoint.reach:rest_area` re-pings every 0.75 s on purpose; the
uploader collapses it.

**Uploader.** `systems/telemetryBatch.ts` owns the connection: one POST per 10 s
however often it is asked, an urgent floor of 5 s for crash/pagehide flushes,
identical rows collapsed into `data.repeats`, 50 rows and 60 events per batch.
`crashReport`, the bridge and the WebGL guard only queue now. Telemetry also left
`qrHud` — it was `[...rows, row]` per event, i.e. a 2,000-element copy every
frame at her rate. `client.stall` records `visibility`/`hidden`/`while_hidden`.

### 2. Hands-off overlay (`71baf67`)

`quietroads/handsoff.ts` (one wait: `bridge_engine_off_wait`, 60 s shared with
`sim/beats.ts` as `BRIDGE_WAIT_S`, marks read from the act file by the test, 4 s
tail so `6.3.clear` lands inside), `HandsOffOverlay.tsx` (title, countdown ring,
marks, the scene's line, cockpit body band, translucent), `setDriveInputLocked`
(sticks/keys/pad all merge to zero, `setStickAxes` refuses), sticks hidden,
`DialogueBox` down, `ScreenWakeKeeper` holding `navigator.wakeLock` with a
`visibilitychange` re-request and a silent absence path. The countdown is
`Simulation.waitElapsedS`, so pausing or a locked phone holds the ring.

Sweep: `park.clean`, `quiet.settle`, `gracie.*`, `waypoint.reach:*`,
`week.elapsed` are waits the player acts on; `cutscene.*` self-resolve in 2.5 s;
`quiet.reason_passed` is answered on the spot; 6.2's nap is dialogue. Only the
bridge is converted.

### 3. Wind assist (`bdc194a`)

`quietroads/assist.ts`, on touch and keyboard only: 40 mph hold (brake wins,
throttle cannot exceed it), steering 0.55 with a 0.04 dead zone,
`steer.into_wind` 0.05–0.40 held 0.45 s, `steer.overcorrect` 0.5 held 0.4 s,
`wind.gust.warn` 0.9 s early with its side, `WIND ASSIST · 40` in the HUD.
Measured: **there is no lateral gust force in the sim**, so "reduce the gust
force to 50–60 %" had nothing to reduce — recorded in the module rather than
invented. Pedal curve measured and replaced everywhere: `^0.95` (linear) → `^1.6`,
so 25/50/75/100 % travel is 7/29/60/100 % throttle instead of 18/46/77/100.

### 4. E2E (`99f520a`)

`e2e/bridge.spec.ts`: the whole of 6.3 from VII-006 to 7.1 on the real touch
stick, plus a 20 s POST budget and the panel at 440x956. **It found a soft lock**:
the wait clock stopped dead at 60 s, so the panel, the input lock and the wake
lock never let go — the clock runs past the minute now and the panel releases at
64 s, pinned by a test.

**The test clock, measured.** `page.clock.install()` + `runFor(66_000)` =
**90,073 ms** of wall time (4,125 mocked WebGL frames, serialized) and then the
rAF loop stayed paused, so the overlay never released. Slower than the wait and
wrong about it: the e2e waits 66 real seconds, with that number as the reason.
Two bridge runs before the green one were measurement, not luck: the first
overran the 90 s release window (that is how the soft lock was found), the second
died on `starts.bridge_end` — `bridge_end` is a marker, not a start.

### Verified

`420/420` vitest across 42 files (372 + 48 new), `tsc --noEmit` 0, `npm run
build` 6.85 s / 4,034.08 kB (1,328.60 kB gzip), playwright **headless**
`--workers=1` **37 passed / 21 skipped / 0 failed** in 8.8 min (58 tests; the two
new skips are `bridge.spec.ts` 1–2 in `mobile-portrait`, the measured 390x844
duplicate). `bench/baseline.json` restored. No seed, no deploy.

### Still open

- The assist covers `vantage_bridge_crossing` only; `bridge_after_sign_*` keeps
  the plain pedal at the 25 limit.
- No physical gust exists; if one ever does, `WIND` is where its scale goes.


## 2026-11-08 — The gust that did not push: a force, a grade, a slot

**The bug, measured first.** 6.3 says "When the wind pushes, steer into it —
small". On device nothing pushed. Headless, the real `VehicleController` on a stub
Rapier body (that integrates its own pose) at 40 mph with no input drifted
**0.000 m** and yawed **0.00°** across a gust. The cue and the physics were two
systems: `sim/beats.ts` fired `wind.gust` every 8 s, `assist.gustWarnings` warned
0.9 s earlier, `QuietRoadsBridge.showGust` drew the arrow — and the car was on
rails. Both grades were stick positions (`steer > 0.05` held 0.45 s, either side,
gust or not), so the lesson could be passed without ever feeling a gust, which is
the same defect seen from the other end.

**The force** (`drive/src/quietroads/wind.ts`, new): warn 0.9 s → ramp in 0.3 s →
hold 1.2 s → ramp out 0.4 s (1.9 s). `side` is where the wind comes FROM and the
push is the other way. Strength 0.97 m/s at full (a pad), × 0.68 on touch and
keyboard. `VehicleController` applies it as **lateral velocity on the car body**,
after the lateral damping, minus what it wrote last step (`gustLatPut`) so the
damping can neither eat the push (the original symptom) nor stack it; the nose
kick is a heading **offset** that returns to zero rather than a yaw rate, because
a rate is exactly what the steering's auto-centre eats; the shell rolls and
`GameCamera` leans on the same number (`getChassisPose().wind`). Measured, 40 mph,
no input: **assist −1.35 m / pad −1.84 m**, heading back to 0.00°, speed still
39.9 mph. A small correction (0.08 ≈ a fifth of the stick after the assist's 0.55
gain) held 0.5 s leaves **−0.08 m**; that same input in still air drifts the car
**1.9 m**; an oversized 0.5 held 1.2 s carries it past centre by **13 m**.

**The grades are the physics** (`sim/beats.ts`): the gust marks the car and both
events read the drift from that mark — `steer.into_wind` wants the input toward
the wind side, small, and the car inside ±0.5 m for 0.3 s; `steer.overcorrect`
fires when the correction carries the car past centre toward the wind side by more
than the band (the old held yank stays, as the same mistake made at the stick).
Doing nothing drifts the car and gets Ali's `pool:ali_gust` line — not a failure.

**Two bugs the new e2e found**, both fixed:

1. **The 40 mph hold could not pull away from rest.** The "don't creep" guard
   (`|v| < 0.15 → 0`) zeroed the hold's 1.8 cm/s every step, and
   `syncWindAssist` only asserted the hold on its own transition, so any teleport
   (a scene start, a retry, the e2e's own placement) dropped it as well. The guard
   now stands down while the hold is on, and the one writer re-asserts it every
   frame. `test/gust.test.ts` pins the pull-away and the brake.
2. **The WIND ASSIST chip had no slot.** Measured at 390x844 it sat at
   (129,104 132x22) on the nav cluster's objective (8,104 374x157); at 844x390 and
   1280x800 at (356,34 132x22) on the noise meter and its sub-label (338,6
   168x46). It has its own now — portrait: the left rail under the pause chip,
   label wrapped to two lines; landscape/desktop: the left rail between the act
   badge and the nav cluster.

**The cue**: the indicator sits on the side the wind comes FROM, with streaks that
run at the car while the push is on (`qrHud.gust.push`, set from `wind.gust`;
`prefers-reduced-motion` stops them) and the action in words — `GUST · steer left`
/ `GUST · steer right` — instead of "steer into it". `navigator.vibrate` buzzes on
the push where the platform has it (`buzzGust`; iOS has no API, and a refusal is
not a crash).

**Tests.** `drive/test/gust.test.ts` (12): the shape and the side convention, the
buzz's three cases, the push measured on the real car — 1.0–1.5 m downwind with no
input and a heading back to 0°, a small correction inside 0.4 m that fires
`steer.into_wind`, the same input in still air clearly further, an oversized one
past centre that fires `steer.overcorrect`, the pad's full strength — plus the
hold's pull-away and brake, and the bridge's wiring (the cue and the force are one
event). `e2e/cockpit-layout.spec.ts` now measures **four** shapes (390x844,
440x956, 844x390, 1280x800) and includes the chip and the gust cue as boxes that
may touch nothing (440x956 is overlap-only: its pixel baseline is not stored).
`e2e/bridge.spec.ts` gains the crossing at 440x956: no throttle at all (the hold
drives), the first gust measured bare (drift must be negative — downwind), every
gust after it answered by a thumb on the side the indicator names, a lane-keeper
that leads on the rate like a player's hand, then `bridge_mid` inside the lane.
Measured on that run: offsets `0.00 … -1.17 … 0.10 … -1.48 … -0.17 … -1.76 …
-0.45`, worst **1.76 m**, reached at x=800 in 1.0 min.

**Verified**: **432/432** vitest across 43 files (420 + 12 in `test/gust.test.ts`),
`tsc --noEmit -p drive/tsconfig.json` exit 0, `npm run build` 5.16 s /
4,037.41 kB (1,329.78 kB gzip), playwright **headless** `--workers=1` **41 passed /
21 skipped / 0 failed** in 10.6 min (was 37 / 21 / 0 in 8.8 min; +1 bridge case in
both projects and +1 cockpit-layout shape in both = 58 → 62 tests, 21 skips
unchanged). `bench/baseline.json` restored after the run. No seed, no deploy.

Commits: `f67feda` (the force, the grade, the hold fix, `test/gust.test.ts`),
`95ed3a2` (the cue, the chip's slot, the layout spec), `13ddbb6` (the crossing
e2e), `30815e2` (docs), `d10db20` (the module's own comment numbers, corrected to
what the runs measured).

**Still open**: the assist covers `vantage_bridge_crossing` only;
`bridge_after_sign_*` keeps the plain pedal at the 25 limit. The gust's push is
speed-independent (a 1.35 m drift whether the car is at 25 or 40), which is
deliberate — the steering's *authority* grows with speed, so the correction window
is widest near the hold.

## 2026-11-10 — The black screen, in a console: a shader that could not compile, and a bridge that thought it was noon

The report was 6.3 on an Android phone: the 3D view black, the HUD running, LOW
changing nothing. Both halves reproduced headless, and neither was the phone.

**The frame.** `HeadlightFlares` mounted postprocessing's `LensFlare` on the high
tier, gated on `night && headlights !== 'off'`. Its shader redeclares `vTexCoord`
against this three.js and fails:
`THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false / Material Name:
EffectMaterial / ... 'vTexCoord' : redefinition`. `EffectMaterial` is the
composer's own material, so the failure takes the *whole post pass* out. The glow
is now four additive sprites in the scene, mounted by `Game3D`, and the effect is
gone from `TIER_EFFECTS` — nothing a tier mounts can fail to compile. The bundle
lost 16 kB with it.

**The button.** The new sweep reads `timeOfDay` at every scene start: 6.2
(`i90_straight_dusk`) and 6.3 (`vantage_bridge_predawn_wind`) were entering as
`day`, because `onSceneStarted` only ever set the hour for 1.4/1.4b/2.1. Every
night gate — the spots, the beam, the flares, the sky — was therefore off, and
pressing LOW did nothing because the world believed it was midday.
`quietroads/sceneLight.ts` is the table now (6.2 sunset, 6.3 night), and
`test/lighting.test.ts` reads the act files' own `background` keys to prove the two
agree. Measured after: the road band responds to the beam switch (6.2 0.081 →
0.071, 6.3 0.043 → 0.036; before, the two readbacks were equal to four decimals).

**The diagnostics that found it.** `systems/diagnostics.ts`: `readGpuInfo` (GPU,
WebGL version, texture ceiling, DPR, CSS/buffer size, tier, memory, cores, UA —
one `client.gpu` per session), `meanLuminance` + `meanLuminanceRows` (16x16
readback), `stepDarkFrame` (0.012 floor, 3 s hold, one `client.frame_dark` per
episode, re-armed after 1 s of light) and `parseShaderError` (a program failure out
of `console.error`, with the material and stage). `Game3D/FieldDiagnostics.tsx`
wires them through `DriveSync.noteEvent` (the batched uploader: one POST per 10 s);
`?diag=1` adds the live board. The GL guard now sends `client.context_lost` /
`client.context_restored` with the scene id, shows "Restarting view…", parks R3F's
frame loop and retries `forceContextRestore()` once at 5 s.

Two defects the diagnostics found in themselves, both fixed: `readGpuInfo` read
`domElement` (the renderer's property) from a WebGL context and the throw unmounted
the Canvas; and the never-black assertion first measured the whole 16x16 frame,
where a sunset sky swamps the road, so the readback now reports the bottom third
too.



**The rest of the lighting.** `scene.background` is a per-hour gradient texture —
drawn before the scene, outside the post stack, impossible to cull — so a frame
with no meshes still reads as a night sky. `systems/lightFloor.ts` lifts the three
scene-wide lights to 0.14/0.10/0.06 (night + rain was 0.07/0.05/0.03) and leaves
every brighter preset alone. `systems/visibility.ts` clamps `FogExp2` so the road
at 80 m keeps 85 % of itself (measured: it already did; the ceiling protects future
tuning). Spots are `visible` only when the stalk is on.

**Cockpit BEFORE, measured** (`e2e/cockpit-inventory.spec.ts`,
`docs/cockpit/BEFORE.md`, screenshots in `docs/cockpit/before/`): 390x844 world
band **216 px (26 %)**, overlay coverage **39 %**, sticks **140×140** at y = 674,
nav cluster **374×143** at y = 104, LOW/HIGH **52×52** at (12, 230). 412x915:
252 px (28 %) / 35 %. 844x390: 183 px (47 %) / 37 %.

**Verified.** 458/458 vitest across 45 files (+16 diagnostics, +10 lighting), `tsc
--noEmit` 0, `npm run build` 4.76 s / **4,021.58 kB** (1,325.18 kB gzip; was
4,037.41 / 1,329.78), playwright headless `--workers=1` **recorded in RUNLOG.md**.
The new `e2e/never-black.spec.ts` runs nine gameplay scenes on Pixel 7 and iPhone 13
profiles with the canvas visible: no black frame (0.360–0.910), no context loss,
no shader row. Its forced-context-loss case is **BLOCKED** and marked `test.fixme`:
the loss still unmounts the React tree with three reading a null context attribute.

Commits: `[0.1]`, `[0.2]`, `[0.3]`, `[1.1]`, `[1.2]`, `[1.3]`, `[1.4]` on
`drive/portrait-rebuild`. No seed, no deploy. Phases 3–6 of the portrait rebuild are
untouched; `RUNLOG.md` carries the item table.

**Follow-up the same run (gate work, two commits).** `[0.4]` `drive/scripts/wait-log.ps1`:
one command waits on a run's log (10 s polls, 900 s cap) and prints the failures,
the skips and the summary — repeating an identical short wait tripped the loop
detector on the Phase 1 gate and killed the task while the run underneath was
healthy. `[1.3]` follow-up: the spots no longer toggle `visible`. three keys its
programs on the *visible light count*, so toggling a light rebuilds every material
in the Kent scene mid-drive — seconds under a software rasteriser, a hitch on a
phone. The stalk is carried by intensity/distance/decay/angle/penumbra, OFF is
still dark (intensity 0), and the light count never changes.

**The gate, in four full runs** (the honest version): run 1 43/25/**2** (both
never-black sweeps, scene isolation — fixed by clearing storage per case and
waiting 40 s); run 2 44/25/**1** and run 3 44/25/**1**, each time the long 440x956
crossing case timing out at 420 s waiting for `[data-gust-side]` (desktop in one,
mobile in the other; it passed in the other project in the same run and alone in
1.1 min). Run 4, after the light fix: **45 passed / 25 skipped / 0 failed** in
13.6 min — the Phase 1 gate. Final: vitest **458/458** (45 files), `tsc` 0, build
**4,021.58 kB / 1,325.18 kB gzip**. Phase 1 is merged to `main` (`0c018ef`) and
pushed.

**Phase 2.1, same run (branch only).** `[2.1]` `8961f9f`: `utils/qualityPick.ts`
chooses the tier from the unmasked GPU string, `deviceMemory` and cores — the old
rule was `hardwareConcurrency <= 4`, which called a four-core Adreno 6xx phone
low-end — with `?tier=` and a saved choice pinning it (an override is not
second-guessed by the adaptive step-down). DPR ceilings are 1.25 low / 1.5 mid and
high; shadows mount only on high, env maps below high, antialias off on low; a
device that cannot hold 50 ms for 3 s steps down once and sends `client.tier_down`.
20 unit tests plus `e2e/tier.spec.ts`, which measures the canvas buffer ratio under
`?tier=low` (1.25) and `?tier=high` (1.5). Measured: **467/467** vitest (46 files),
`tsc` 0, build **4,023.33 kB / 1,325.92 kB gzip**, tier e2e 2/2. Not merged: Phase 2
is incomplete — 2.2 (LODs; `vw_beetle.glb` is 10.55 MB, `@gltf-transform` is not
installed but the registry answers), 2.3 (code split) and 2.4 (throttled first
frame) are open, and they are listed in `RUNLOG.md`.

## 2026-11-10 — Phase 2: the twin, the split, and the first frame that stopped waiting for the car

Phase 1 shipped the diagnostics; this phase spends the budget they point at. The
phone the plan is written for is a teenager's on a 4G connection, and the two
numbers that mattered were "how many MB" and "how long until something moves".

### [2.2] The car a phone downloads is the car it needs

`vw_beetle.glb` was 10.55 MB — 17 1024×1024 PNGs (8.2 MB of it) and 64,188
triangles, all of it fetched before the first frame of a drive.
`drive/scripts/build-lods.mjs` is the pipeline, not a one-off: dedup → prune → a
per-material texture plan → 256–512 px resize → WebP → weld → meshoptimizer
`simplify` at 0.5 → `KHR_mesh_quantization`. **10.55 MB / 64,188 tris →
`vw_beetle.mobile.glb` 1.01 MB / 36,658 tris (1,030,792 B, 9.3 %)**, budget 1.5 MB.

The texture plan is the part that needed reading the code, not the asset:
`Vehicle.tsx` overwrites `Chassi`'s base colour with the procedural paint atlas and
forces `Details_02` to flat chrome, so those bytes were downloaded and never drawn —
they are dropped; `Chassi`'s normal/AO stay at 512 (panel lines), the lamp lenses at
256, the wheels at 512. Every **material name and node name survives**, because the
paint job is found by material name and the four wheels by node name: a renamed LOD
would lose both and still look fine in a screenshot. `test/model-lod.test.ts` (9)
checks the budget, the ratio, the names, the extensions (only ones `GLTFLoader`
reads) and that it is still the same car. `utils/modelLod.ts` picks the twin for
low/mid; `qualityPick.initialTier()` means the Canvas and the loader cannot start on
different tiers. The LOD toolchain brings `@types/node`, whose `setTimeout` shadowed
the DOM one and broke `ReturnType<typeof window.setTimeout>` in two files; the
client's tsconfig now names `vite/client` instead of accepting every `@types`.

### [2.3] The shell paints first, and the world it draws is the world it drives

Three splits, each measured:

| What | Before | After |
|---|---|---|
| entry chunk | 4,023.67 kB / **1,326.06 kB gzip** (everything) | 1,085.47 kB / **317.50 kB gzip** (auth, store, story bridge) |
| 3D stack | (in the entry) | 2,849.63 kB / **988.22 kB gzip**, its own chunk |
| post stack | (in the entry) | 75.11 kB / 18.56 kB gzip, lazy |
| models before the frame | Beetle + truck + suv + **15 Kenney highway GLBs** | the mobile Beetle only |

`App.tsx` no longer imports drei's `useProgress` (three.js was in the entry chunk for
a progress bar — the bar is a CSS sweep now) and lazies the 3D wrapper. `Game3D`
lazies `RoadChunks`/`TrafficRenderer`/`Collectibles`/`CollisionSystem`: those four
modules each preloaded their own GLBs *at import time*, so a Quiet Roads phone
fetched a highway it would never see. `Vehicle` preloads only the chassis the player
is in (the Ledger truck and the highway car start their fetch when they are chosen).

**The bug the measurement found.** First frame on a throttled Pixel 7: 13.9 s. The
scene, the frame loop and the car shared ONE Suspense boundary, and the car's GLB
suspends — so a 1 MB model held the first drawn frame. The frame loop, the context
guard, the diagnostics and the post stack now sit outside the boundary, and the car
has its own inside the scene: the road, the sky and the cockpit draw, the Beetle
arrives into it. **13.9 s → 7.56 s**, with the breakdown the spec prints itself:

```
shell JS    310 kB  @187 ms   +1,678 ms   (auth, stores, story bridge)
3D chunk    965 kB  @2,071 ms +4,865 ms   (three, R3F, rapier, the Kent world)
first frame         @7,557 ms             (412 ms after the last JS byte)
Beetle    1,031 kB  after the frame       (the car arrives into a drawn world)
```

"Not black" is Phase 1's rule and it still holds — a dark frame fails `never-black`;
*no car yet* is not a dark frame.

### [2.4] The budget, and what it measures

`e2e/first-load.spec.ts` serves the **built** output from an in-process http server
with gzip (dev serves three.js as ~600 modules over one 150 ms-RTT connection; that
measured 75 s and is a number about the dev server), then applies Lighthouse's mobile
weather — Slow 4G (1.6 Mbit, 150 ms RTT) + a 4x CPU slowdown — on a Pixel 7 profile,
and asserts the app's own first-frame mark (`window.__driveFirstFrameAt`, set by the
render loop) inside **10 s**. An 8 s budget was tried against the same bundle and is
not reachable: 7.556 / 7.577 / 7.708 s on a quiet desktop, 8.166 / 8.900 s in the
mobile-portrait project of the same run, 8.389 s alone in the mobile project and
8.889 s on a loaded desktop. The quiet-to-loaded spread alone is over a second, which
is more than the bytes left to shave, so 8 s measured the machine. 10 s holds across
every row and still catches the regressions this test exists for. Measured 2,318 kB on
the wire; one model request, `vw_beetle.mobile.glb`; no later act's chunk before the
frame *or* during the ten seconds of Act I it then plays; no highway chunk ever. The
same file logs the resource timeline above, so the next regression arrives with its
breakdown. `test/first-load.test.ts` (4) holds the byte budgets on the build output.
The lever that would reach 8 s — moving the 413 kB of story JSON out of the shell — is
ROADMAP's next performance item.

### Verified

vitest **510/510** across 50 files (8.1 s), `tsc --noEmit` 0, `npm run build` **1,085.47 kB
shell + 2,849.63 kB 3D chunk + 75.11 kB post stack (317.50 + 988.22 + 18.56 kB gzip)**
in 4.9 s, playwright headless `--workers=1` **recorded in RUNLOG.md**. (The first pass
through this entry wrote 480/480 and "8 s"; both were the numbers before the 2.4
constant and the later test files landed. The corrected figures are the ones below and
in RUNLOG's gate table.)

**Two things the gate caught, fixed in place.** The smoke case that guards the
Kenney colormaps ("a 200 with HTML in it is not a texture") had been passing on the
eager highway preload that 2.3 removed — it now mounts the highway world on purpose,
which is the only world that uses those atlases, so it proves the wire *and* that the
lazy chunk resolves. And the vitest run rewrites `drive/bench/baseline.json`; a gate
run committed this machine's timings (p50 171.6 µs against the committed 67.7 µs), so
the file is restored and the gate keeps restoring it.

