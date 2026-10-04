# FINAL_REPORT — Quiet Roads overhaul (`agent/overhaul-2026-09-30`)

Branch `agent/overhaul-2026-09-30`. Production (`main` → ali.tactag.app) did not
include the last session's a11y/test commits until this correction shipped.

## 1. Executive summary
The drive now maps the whole WA Driver Guide to a single teaching loop: every
card in acts I, II, III, V and VI opens in-scene (dialogue card, in-world
trigger, or a mission beat), and each act's mission grades the skill its cards
just taught. The stopping shadow is truthful on gravel/wet/ice, the following
distance leads with the guide's own words, inaccuracies in card citations were
fixed, and the HUD speed/RPM was pushed off the 60 Hz React path. Test/build
harness (Vitest 36 tests, Playwright smoke, deterministic bench) and the four
hand-off docs are in place. Remaining work is the browser/GPU pass (FPS, draw
calls, time-to-first-frame) and the Act IV "missed-question road", both of which
need a device/emulator + backend that this environment does not have.

## 2. Metrics (before → after)

| Metric | Before (recon) | After | How measured |
|---|---|---|---|
| Vitest tests (grading + teaching + coverage + exam + retest + bench) | 0 | 36 | `npx vitest run` |
| `tsc --noEmit` | green | green | exit 0 |
| `vite build` | green | green | 809 modules, 4.06 s |
| Cards opened in-scene | I 12/12 · II 11/31 · III 7/31 · V 8/13 · VI 9/13 | **I 12/12 · II 31/31 · III 30/30 · V 13/13 · VI 13/13** | `test/coverage.test.ts` (deterministic) |
| Sim step CPU (headless) | ~59 µs p50 | ~56–60 µs p50 | `bench/sim-bench.test.ts` |
| Stop distance 55 mph (beetle dry→gravel) | 74.7 m (gravel lied as dry) | 89.8 m | bench |
| Main JS bundle | ~4.13 MB (1.34 MB gzip) | ~4.13 MB (1.34 MB gzip) | `vite build` |
| Desktop FPS / 1% low | — | 30 / 29.6 (flat 30 Hz window) | Playwright headed Chrome, `?profileDrive`, 600 frames |
| Mobile portrait FPS | — | 30 / 29.5 | same harness, 390×844 |
| Time-to-canvas | — | 0.8 s desktop, 0.9 s mobile | local Vite, not a 4G throttle |
| Input→response | — | **not measured** | — |

## 3. Card → trigger → grade (before → after)

- **Act I — The Lot**: 12/12 (already the reference model). No change.
- **Act II — The Grid**: 11/31 → **31/31**. The 20 formerly-briefing cards open
  from `CardCues` on the Grid beats (back-in, lane change, parallel, Jonah's
  four-way, and the in-bus/skidding/etc. position beats). A follow-up found
  `GridRun` still fired on the raw bus, so II-015, II-016, II-017, II-021, and
  II-022 were counted by the cue list and never opened. `GridRun` now uses the
  same `fire` wrapper as the Ledger and the Ribbon.
- **Act III — Central**: 7/31 → **30/30** (one leaked `art-review-state` object
  removed). The 23 cards open along the Ledger: follow-close, solid-white,
  wrong-lane, merge, plus the wet stretch south of `solidY`.
- **Act V — The Ribbon**: 8/13 → **13/13** (V-002/004/008/009/011 on ramp/merge).
- **Act VI — The Backcountry**: 9/13 → **13/13** (VI-003/005/009/011/013 on the
  rural grades; V-006 opens from scene 7.1).
- **Act IV — The Core**: the exam gate is unchanged (only IV-018 opens in the
  drive). After a miss, `local_loop_week` is a drive on the Kent streets keyed
  to `exam_weak_chapter` and the missed questions' guide refs. The week ends
  when that grade fires `week.elapsed`.

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

## 6. Scorecard (1–10, before → after, one line of evidence each)

| Pillar | Before | After | Evidence |
|---|---|---|---|
| Physics | 6 | 7 | Fixed 1/60 + interpolate already; gravel/wet friction now truthfully lengthens the shadow (feels untouched — setLinvel/angvel unmodified) |
| Graphics | 5 | 5 | No tier ladder yet; single art direction holds; readibility kept (no change this pass) |
| Latency | 6 | 7 | HUD off the 60 Hz React path; context-loss handled |
| UX | 5 | 7 | Act select; reduced-motion toggle; pause stats |
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
- **Browser/GPU metrics** — Playwright headed Chrome, mocked student, both
  viewports, `?profileDrive`. Act I is on screen (road plus the opening line).
  Canvas is up in under a second. After the 600-frame window fills, both
  viewports sit on a flat 30 Hz clock (p50 33.3 ms, 1% low about 29.5 fps).
  That is the window's frame clock, not a spike. `gl.info` draw calls stay at 1
  because the sample lands on the postprocessing blit. A 4G throttle, JS heap,
  and input-to-response on a driving lap were not part of this run.
- **Full campaign playthrough on both viewports** — the smoke confirms the
  scene mounts. It does not play every act.
- **Act IV "missed-question road"** — built. Headless tests drive each beat.
  A signed-in playthrough of the week on a phone is still a device pass.

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
  during the debrief, act-scoped geometry/material is disposed on an act change
  while shared highway chunks are kept, and the context-loss edges are a pure
  function.
- Still open: the browser `?profileDrive` pass and a full-campaign playthrough
  (both need a device and a backend). Deac's on-road behaviour and one tone of
  voice across acts are deliberately not in this pass.
- Risk: the browser metrics are unmeasured. The 2026-10-01 run recorded a flat
  30 Hz window clock (p50 33.3 ms, both viewports) and `gl.info` draw calls
  reading 1 because the sample lands on the postprocessing blit — so those two
  counters are not a city draw-call count. **That run was not repeated in the
  2026-10-04 pass**; no headed browser was run, and the graphics work above is
  justified by unit tests and the build split, not by a frame-rate claim.