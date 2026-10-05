# FINAL_REPORT — Quiet Roads overhaul (`agent/overhaul-2026-09-30`)

Branch `agent/overhaul-2026-09-30`. Production (`main` → ali.tactag.app) did not
include the last session's a11y/test commits until this correction shipped.

## 1. Executive summary
The drive now maps the whole WA Driver Guide to a single teaching loop: every
card in acts I, II, III, V and VI opens in-scene (dialogue card, in-world
trigger, or a mission beat), and each act's mission grades the skill its cards
just taught. The campaign can cross act boundaries, act select starts the act you
pick, and every cue opens on the beat that practises its card. The stopping
shadow is truthful on gravel/wet/ice, the following distance leads with the guide's
own words, inaccuracies in card citations were fixed, and the HUD speed/RPM was
pushed off the 60 Hz React path. Test/build harness (Vitest 151 tests, Playwright
smoke, deterministic bench) and the four hand-off docs are in place. Remaining
work is the browser/GPU pass and the Act IV device pass, both of which need a
device/emulator + backend that this environment does not have.

**What changed most recently (the campaign / cues / debrief / graphics pass).**
The 111-test suite green at the previous HEAD was not a campaign proof: nothing
in it crossed an act boundary, card coverage was a hardcoded id list rather than a
measurement, and six cards were still cued from timers or bare coordinates. All
three are now measured — see §2 and §3.

## 2. Metrics (before → after)

| Metric | Before (recon) | After | How measured |
|---|---|---|---|
| Vitest tests | 0 | **151** | `npm test` (14 files) |
| `tsc --noEmit` | green | green | exit 0 |
| `vite build` | green | green | **818 modules**, 5.68 s, entry 3,957 kB |
| Cards opened in-scene | I 12/12 · II 11/31 · III 7/31 · V 8/13 · VI 9/13 | **I 12/12 · II 31/31 · III 30/30 · V 13/13 · VI 13/13** | `test/coverage.test.ts`, over a **measured** cue set |
| Cards cued on the skill, not a timer | 6 cards on timers/coordinates (II-012, II-019, II-025, II-026, III-008, VI-003) | **0** | `test/teaching.test.ts`, two-sided per id |
| Act-boundary jumps covered | **0** | **26 scene handoffs**, incl. `7.1.card_V-006` | `test/bundle.test.ts` |
| Act select entry scenes reachable | 0 of 5 (all fell back to `0.1`) | **5 of 5** | `test/bundle.test.ts` |
| Sim step CPU (headless) | ~59 µs p50 | ~56–60 µs p50 | `bench/sim-bench.test.ts` |
| Stop distance 55 mph (beetle dry→gravel) | 74.7 m (gravel lied as dry) | 89.8 m | bench |
| Stop distances | 74.7 / 89.8 / 103.0 / 264.4 m | **unchanged** | `test/ccd.test.ts`, `bench/baseline.json` |
| Main JS bundle | ~4.13 MB | 3,957 kB entry + 10 act dialogue chunks | `vite build` |
| Desktop / mobile FPS | — | **not measured this pass** | see §9 |
| Input→response | — | **not measured** | — |

`bench/baseline.json` was **restored, not regenerated**: no physics change landed
in this pass, so the stopping-distance contract is untouched and re-recording the
file would only have churned step timings that move with machine load.

## 3. Card → trigger → grade (before → after)

- **Act I — The Lot**: 12/12 (already the reference model). No change.
- **Act II — The Grid**: 11/31 → **31/31**. The 20 formerly-briefing cards open
  from `CardCues` on the Grid beats (back-in, lane change, parallel, Jonah's
  four-way, and the in-bus/skidding/etc. position beats). A follow-up found
  `GridRun` still fired on the raw bus, so II-015, II-016, II-017, II-021, and
  II-022 were counted by the cue list and never opened. `GridRun` now uses the
  same `fire` wrapper as the Ledger and the Ribbon.
- **Act III — Central**: 7/31 → **30/30** (one leaked `art-review-state` object
  removed). The 23 cards open along the Ledger on the beats that practise them:
  follow start, alongside, pass-clear, lane change, solid white, wrong lane, the
  merge, the wet stretch south of `solidY`, and the run's end.
- **Act V — The Ribbon**: 8/13 → **13/13** (V-002/004/008/009/011 on ramp/merge).
- **Act VI — The Backcountry**: 9/13 → **13/13** (VI-003/005/009/011/013 on the
  rural grades; V-006 opens from scene 7.1).
- **Act IV — The Core**: the exam gate is unchanged (only IV-018 opens in the
  drive). After a miss, `local_loop_week` is a drive on the Kent streets keyed
  to `exam_weak_chapter` and the missed questions' guide refs. The week ends
  when that grade fires `week.elapsed`.

### 3.1 The campaign can actually change scenes

`DialogueRunner.startScene` throws `Dialogue scene missing: <id>` for any scene
whose act has not been fetched, and only Act I ships in the entry chunk. Every
campaign handoff therefore landed on that throw: 1.4b → 2.1, 2.4 → 2.5, 2.5 → 3.1,
the Ribbon → 4.1, the exam → 5.1, and 6.3 → 7.1.

`quietroads/dialogue/sceneRouter.ts` is the one place that closes the gap. It owns
"load the act that owns this scene, **wait** for it, then start it", and the bridge
routes both the `scene_finished` handoff and `open()` through it. It is pure over
`(runner, sceneId)` — no store, no React, no window — so the chain is unit-tested
headlessly on a real `DialogueRunner`.

- **Act VI now owns 7.x.** Act 6 ends on `next_scene 7.1`, and V-006 lives in
  `7.1.card_V-006`; the act7 file had been on the closed Act VII loader, so that
  jump had no destination. `dialogue_act8.json` stays on Act VII and `loadAct`
  refuses it, so Act VII is unreachable by construction.
- **The 7.3 → 8.1 handoff ends the campaign.** `gotoScene('8.1')` returns false,
  the bridge shows a toast and stops. No throw, and Act VII is never fetched.
- **Act select works.** `open()` used to ask `hasScene(which)` *before* loading,
  so every act that was not already in the entry chunk fell through to `'0.1'`.
  It now resolves the requested id and lets the router fetch what it needs:
  `startAct("2.1")`, `("2.5")`, `("4.1")`, `("3.1b")` and `("6.1b")` all start
  that scene.
- **Preload follows the scene, not the act order.** `nextAct("III")` answered
  `"V"`, which walked 2.5 → 3.1 and skipped the exam at 4.1 — no single
  act-order chain can name 3.5 → 4.1. The debrief now warms the act that owns the
  current scene's own `next_scene`.

`test/bundle.test.ts` walks all 26 playable handoffs, asserts each destination is
present **and started**, asserts `7.1.card_V-006` resolves inside scene 7.1, and
asserts the 8.1 jump ends rather than throws.

### 3.2 Cues open on the skill, not on a timer

`coverage.test.ts` no longer carries a hardcoded id list. It consumes
`test/observedCues.ts`, which drives the real `Simulation` over each cue's beat
and collects the `card.cue:<id>` events that actually reach the bus. A cue rewired
to a beat the grader never fires now fails coverage with nobody editing a list.

`test/teaching.test.ts` holds the two-sided contract per card — it fires on the
skill **and** stays shut on a drive that never performs it. That second half is
what the old id list could not express. Six cards were open on a timer or a bare
coordinate, and each is now on the beat it teaches:

| Card | Was | Now |
|---|---|---|
| II-012, III-005, III-009 | `ledger.follow.close` — the *too close* grade, so holding the gap correctly never showed them | `ledger.follow.start`, when she rolls behind the truck with room |
| III-010 | first `follow.close` | the `follow.close` grade event, where the grader put it |
| II-019 | 4 s of dry motion at Jonah's four-way | `p.onIce` / `ice.enter` — the actual ice |
| II-026 | the back-in grading | `dropoff.walk`, when the door meets traffic |
| II-025 | 2 s of `straight_night_drive` | a reverse (`speedMs < -0.3`) |
| III-008 | `pos.y > 120` | `ledger.crossed_solid` — actually crossing the line |
| VI-003 | `rural.shoulder` / `nozone.enter`, i.e. after leaving the road | `rural.edge`, a new event while still on the road at the gravel edge |

Two new Ledger events carry the sharing cluster, all derived from real geometry:
`ledger.alongside` (out of his mirrors, §4.4 → III-011/III-012),
`ledger.pass.clear` (his whole front back in the mirror, §5.2 → III-018),
`ledger.wet.enter` (south of the solid white, §5.6 → III-024/III-025), and
`ledger.rumble.ride` (riding the line, a soft tyre, §2.5 → III-028). No Act III
card is reachable from a bare coordinate or a duration any more.

## 3.3 The grade panel reads events the sim emits

The debrief listened for `week.grade.pass` / `week.grade.miss`. Nothing emits
them: `RetestWeek.step` returns a boolean and `Simulation` fires `week.elapsed`. The
week could grade and the panel could never open.

`RetestWeek` now records the result it already decided — `pass` on a clean run,
`miss` the moment a rule is blown (a rolled stop, an over-speed, a closed gap) —
and `week.elapsed` carries it as data. There is **no second week-end event**, so
the panel and the story cannot disagree, and closing the panel still emits nothing.

`maybeDebrief` also returned early when `lastCuedCard` was null, which meant a
grade with no cue behind it showed nothing at all. The card is the citation, not
the verdict: the model now builds without one and the UI omits the card rows. The
Act IV week is exactly that case, and it now reads PASS or MISS.

### 3.4 One pixel ratio, and a 30 Hz panel that can recover

- **One DPR writer.** `Game3D` mounted drei's `<AdaptiveDpr>` beside the Canvas
  `dpr` prop. `<AdaptiveDpr>` calls R3F's own `setDpr()` on its own schedule, so
  the pixel ratio was written from two places and neither owned the value. It is
  gone, and the no-op `<PerformanceMonitor>` went with it — the frame time it
  measured is the `delta` `PerfRecorder` already reads on the same frame. The
  Canvas `dpr` prop is the sole writer, and on a context restore `GLContextGuard`
  writes the tier's ratio once.
- **A 30 Hz panel could fall to `low` and never climb back.** The reducer carried
  two thresholds: demote over 33.4 ms (~30 fps), recover under 18.2 ms (~55 fps).
  A display locked at 30 Hz delivers ~33.3 ms frames and can never produce an
  18.2 ms frame, so one transient stall pinned the tier at `low` for the rest of
  the session. There is now **one** threshold: a frame is slow if it is over
  `SLOW_FRAME_MS` and recovered if it is not. A panel sitting at its own refresh
  rate is by definition keeping up. The high → mid → low reducer, the hold times
  and the demotion behaviour are unchanged, and a genuinely slow panel still walks
  all the way down and stays there.
- **The draw-call sample was the postprocessing blit.** `gl.info.render.calls`
  read from a `useFrame` callback returned 1 every frame: three resets `gl.info`
  at the start of every `renderer.render`, and `EffectComposer` renders once per
  post pass with a fullscreen blit last. The count is now taken from the Kent
  scene pass itself (`KentWorld`'s `onAfterRender`, via `attachScenePassProbe` in
  `utils/performance`), where those numbers are still the scene's.
- **The CCD "0 tunnels" result could not fail.** At 1/60 s the Beetle's ~33 m/s
  covers ~0.55 m a step against a 1.5 m threshold, so the headline lap proved
  nothing about whether the check was alive. The suite now asserts a step *larger*
  than the threshold emits `ccd.tunnel`, that a legal 1/60 step at top speed does
  not, and that the margin between them is wide. The four-surface lap stays as a
  regression net and is labelled as such.

## 4. Guide coverage (final `INDEX.md` summary)
- **Taught in-scene or by card**: 2.7, 2.8, 2.9, 2.11, 2.12, 4.2, 4.4, 4.7, 4.9,
  4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18, 5.1, 5.2, 5.3, 5.6, 3.0, 3.1
  (plus their exam channels).
- **Exam-only** (no drive practice): all of Chapter 1, 2.4, 2.10, 2.13, 3.4, 3.5,
  3.6, 4.1, 4.3, 4.5, 4.6, 5.4, 5.7–5.10.
- **Not taught anywhere**: 1.16 Additional services, 4.20 Maritime.
- **Game lessons the guide does NOT support**: none remaining — the "3-second"
  rule now leads with the guide's "twice the length of your vehicle" wording and
  is exposed behind `FOLLOW.rule`; hand-signal citations point to §4.14.

## 5. Changes by area (commit refs)

| Area | What | Commit |
|---|---|---|
| Docs | INDEX, AUDIT, ROADMAP, AGENT_LOG, FINAL_REPORT | `506f14d`, `b165dcc`, … |
| Test/build | Vitest + Playwright + esbuild, grading/teaching/coverage tests, deterministic bench | `08f9153`, `bbb36e9` |
| Teaching | Gravel + wet surface friction; stopping shadow correct | `1bf0d52`, `9982d8e` |
| Teaching | Follow-distance rule behind `FOLLOW.rule`; guide-led copy; §4.14 hand-signal cites | `9982d8e` |
| Story | `CardCues` opens every unwired card on its beat; `art-review-state` removed | `9982d8e` |
| Perf | HUD speed/RPM at 10 Hz (`liveDrive` 60 Hz channel) | `9982d8e` |
| Latency | WebGL context-loss handled | `6b75a9b` |
| UX | Act select on the title screen | `bc83818` |
| A11y | Reduced-motion / camera-shake toggle, honours `prefers-reduced-motion` | `04f4b6a` |
| Story | Scene routing across act boundaries; Act VI owns 7.x; act select works | this pass |
| Teaching | Every cue moved off a timer onto the beat that practises it | this pass |
| UX | The grade panel reads `week.elapsed`'s own verdict | this pass |
| Graphics | One DPR writer; a 30 Hz panel can recover; draw calls sampled from the Kent pass | this pass |
| Sim | CCD threshold proven both ways; `nozone`/rumble/edge beats | this pass |

## 6. Scorecard (1–10, before → after, one line of evidence each)

| Pillar | Before | After | Evidence |
|---|---|---|---|
| Physics | 6 | 7 | Fixed 1/60 + interpolate already; gravel/wet friction now truthfully lengthens the shadow (feels untouched — setLinvel/angvel unmodified) |
| Graphics | 5 | 6 | A three-rung quality ladder does exist (high/mid/low post stacks, one DPR writer, a panel that can climb back out of `low`); art direction unchanged. Frame rate still unmeasured — see §9 |
| Latency | 6 | 7 | HUD off the 60 Hz React path; WebGL context loss handled (pause on loss, re-apply the tier's ratio once on restore, no auto-resume) |
| UX | 5 | 8 | Act select starts the act you pick; every cue fires on the skill; the week grade panel reads PASS or MISS |
| Interaction | 6 | 7 | Touch dead-zone + sensitivity already present; handedness schemes intact |
| Story | 5 | 8 | Every card now opens in-scene on the beat that practises it |
| Cohesion | 5 | 8 | One registry (`actChallenges` + `config.ts`) ties card↔scene↔mission↔guide; citations align to the guide |

## 7. Teaching-accuracy fixes (guide citation for each)
1. **Following distance** — cards II-012 / V-012 and the Ledger/convoy/escort
   objectives led with a "3-second" rule the text-only guide never states. Fixed
   by leading with §5.2 *"leave a distance that's at least twice the length of
   your vehicle"* and exposing the seconds count behind `FOLLOW.rule`. (guide
   §5.2 Space)
2. **Hand-signal citation** — cards II-006/016/022, III-006/019 cited "2.5
   Vehicle Maintenance (Hand signals)" (not in the text-only guide). Recited to
   **4.14 Turning** ("Put on your turn signal at least 100 feet…"). (guide §4.14)
3. **Gravel surface** — Act VI stopping shadow showed a dry stop on gravel;
   guide §5.6 and §4.15 (paved-from-unpaved) require longer stopping on bad
   surface. `MU.gravel=0.5` lengthens the stop (74.7 m → 89.8 m at 55 mph).
4. **Wet surface** — Ledger south of `solidY` now uses μ 0.4 (guide §5.6
   slippery roads).
5. **`art-review-state`** leaked as a card in the client deck — removed (not a
   teaching fix, but keeps the deck honest).

## 8. Physics config changes (old → new, with telemetry)
- Added `VEHICLE.MU.gravel = 0.5` (new; was treated as dry 0.7). Beetle 55 mph
  stop 74.7 m → **89.8 m**. Ice unchanged (264.4 m). Wet 0.4 applied south of
  `ledger.solidY` (beetle wet 103.0 m).
- Added `FOLLOW.rule = "seconds"` (dry 3 s, truck 4 s; alt `vehicle_lengths` =
  2 × vehicle). No telemetry change while `"seconds"` is the default — the
  grader's gap in metres is computed through `followFullGapM`.
- **The owner's tuned setLinvel/angvel feel is unchanged** — the controller and
  its constants were not modified for feel; only the surface μ and follow-rule
  read-through changed.

## 9. What failed / could not be verified, and why
- **No headed `?profileDrive` lap was run in this pass.** No browser ran at all.
  Every graphics claim below is a unit test or a code fact, not a measurement.
- **No frame rate is claimed, and none can be read from the old numbers.** The
  2026-10-01 run reported "30 / 29.6". That was a 30 Hz window clock — the sample
  window's own cadence — not the build's frame rate, and it should never have been
  written as a result. The draw-call sample of 1 in the same run was the
  postprocessing blit (now fixed, §3.4). Time-to-canvas, a 4G throttle, the JS
  heap, and input-to-response on a driving lap are all still unmeasured.
- **The 30 Hz recovery fix is verified headlessly, not on a panel.** The reducer is
  a pure function and the test drives it at a flat 33.4 ms, but no 30 Hz display
  was available to watch climb back out of `low` in the flesh.
- **Full campaign playthrough** — the smoke confirms the scene mounts. The act
  boundary chain is now covered headlessly on a real `DialogueRunner`
  (`test/bundle.test.ts`), but no browser has played Act I → 7.3 end to end.
- **Act IV "missed-question road"** — built, and the week's PASS/MISS is now
  asserted headlessly. A signed-in playthrough of the week on a phone is still a
  device pass.

## 10. BLOCKED DECISIONS (need the owner)
- **BD-1 (resolved, pending owner sign-off)**: the guide §5.2 "twice the length
  of your vehicle" vs the canonical "3-second" rule. The drive keeps the seconds
  *feel* (default) but leads all teaching copy with the guide's wording, and the
  rule is a one-line config switch (`FOLLOW.rule`). Owner should confirm whether
  to leave `seconds` (current) or switch the grader to `vehicle_lengths`.
- **BD-2 (resolved)**: hand-signal citations now read §4.14 Turning.

## 11. Remaining backlog + risks
- P1: **Act IV missed-question road** — done. `local_loop_week` grades the
  missed guide section on an existing Kent street and then fires `week.elapsed`.
- P2: done in the 2026-10-04 pass. Quality tiers (one DPR owner + a pure
  frame-time reducer), Kent static merge/InstancedMesh with colliders left one
  per building and per solid segment, per-frame allocation cleanup on the 60 Hz
  physics path, the debrief-per-scene panel, and the remaining a11y (remappable
  keys, three text-size steps, colorblind cue).
- P3: done in the 2026-10-04 pass. Act dialogue is a per-act dynamic import
  (Act I eager), 10 chunks split out of the entry bundle, the next act preloads
  during the debrief (now following the scene's own `next_scene`), act-scoped
  geometry/material is disposed on an act change while shared highway chunks are
  kept, and the context-loss edges are a pure function.
- P4 (this pass): the campaign can change scenes, act select works, cues fire on
  the skill, the week grade panel reads a real event, DPR has one writer, a 30 Hz
  panel can recover, and the CCD threshold is proven both ways.
- Still open: the browser `?profileDrive` pass and a full-campaign playthrough
  (both need a device and a backend). Deac's on-road behaviour and one tone of
  voice across acts are deliberately not in this pass.
- Risk: the browser metrics are still unmeasured, and **this pass did not run a
  headed browser either**. The graphics work above is justified by unit tests and
  the build split, not by a frame-rate claim. The counters are now read from the
  right place (the Kent scene pass) but nobody has looked at them on real
  hardware, so no draw-call or frame-rate number is quoted anywhere in these docs.