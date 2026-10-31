# ROADMAP — Quiet Roads overhaul (`agent/overhaul-2026-09-30`)

Ordered by **(player impact ÷ effort)**, foundations first. Each item is one
commit (message `[area] what — why — measured result`), played on both viewports,
checked against `docs/wa-driver-guide/`, and logged in `AGENT_LOG.md` + `INDEX.md`.

## Targets (measured, 2026-10-01)

| Metric | Current | Target |
|---|---|---|
| Sim step CPU | ~59 µs p50 (headless) | no regression; log after each physics change |
| Desktop FPS | **not measured** | needs a headed `?profileDrive` run |
| Mobile portrait FPS | **not measured** | needs a device |
| Input→response | not measured | ≤ 1 frame (16.7 ms) |
| Time-to-first-frame (mobile 4G) | not measured | < 4 s |
| CCD/tunneling | threshold asserted both ways | zero at top speed on all surfaces |
| Cards opened in-scene | I 12/12 · II 31/31 · III 30/30 · V 13/13 · VI 13/13 · **VII 10/10**, measured | every card in every act |
| Act-boundary handoffs | 26 covered, incl. `7.1.card_V-006` | every `next_scene` has a destination |
| Cues on the skill, not a timer | 0 on a timer/coordinate | stays 0 |
| Cards whose comment names a beat the code doesn't listen to | 1 found (III-013) | 0 |
| Stop/gap/yield grade lock | already fires (baseline.json) | a scene passes only when its grade fired |

**On the old FPS row.** The 2026-10-01 run recorded "30 / 29.6", and it was not a
frame rate — it was the sample window's own 30 Hz clock. Those numbers are
withdrawn. **No headed browser ran in this pass**, so the FPS rows above are
deliberately empty rather than filled with a guess.

## P0 — Foundations (do first; they unblock everything else)

- **[perf] HUD speed/RPM at 10 Hz.** Done. `liveDrive` stays at the physics
  rate for camera/audio/wheels; the store copy is 10 Hz. (P5)
- **[latency] WebGL context-loss + restore.** Done. (P6)
- **[teaching] Surface friction for gravel and wet.** Done. Gravel on the
  backcountry and escort; wet south of `ledger.solidY`. Ice unchanged. (P2)
- **[teaching] Following-distance config.** Done. `FOLLOW.rule` defaults to
  `seconds`. Teaching copy leads with §5.2. (P1, BD-1, BD-2)
- **[config] Teaching-rule file.** `drive/src/quietroads/config.ts` holds the
  follow rule. Vehicle feel stays in `VehicleController` on purpose.
- **[tests] `vitest run` green** — 260 tests, 28 files (stop/gap/yield, follow-rule,
  card cues on the sim bus, **act-boundary chain**, **Deac's drive script + the
  witness gate on his beats**, exam gate, retest week, alloc identity, CCD, quality
  tiers + the 30 Hz recovery, scene-pass draw calls, instancing, accessibility,
  debrief incl. the Act IV week, bundle split, spoken lines, bench; plus the
  **Act VII deck's citations and numbers**, the **road-home clock**, the **4.2/2.2
  licensing thread** and the **seed's do-not-seed contract**).

## Current pass — the overhaul's six phases (2026-10-28)

- **Phases 1–6 done** (`48b0c49`, `4fa2229`, `960317c`, `289c0de`, `13c5ec7`, `16ecbb4`,
  this session): chain reorder
  `4.2→6.1b→5.1→5.2→5.3→6.1→6.2→6.3→7.1→7.2→7.3→8.1→8.2→8.3` + the
  `spokane_home` mission with Act VII opened; I-90 cargo insulin → relay kit +
  the 3.5 night-radio beat; the chain-up loop and every shop close now continue
  the campaign (`drive/test/chainup-loop.test.ts`); the Chorus is on the radio
  (tablet gone from II-009/III-027/III-022 prose, stills flagged in
  `AUDIT.md` §11); Grandma on screen at 8.2 with the gray blanket and the
  "Come home slow" payoff (`voice.ts` + act-8 characters + `— G.` signature);
  `manifestFor()` no longer signs the clipboard with the account name, Act VI
  carries the ridge plows' diesel (`scripts/test-manifest.js`); 6.2's clock
  pinned outside 1–5 a.m.; the ending's last card toggles on `deac_answered`
  and `postgame.deacs_route` is gone (`drive/test/ending.test.ts`); the whole
  campaign is walked 0.1 → `game_complete` including both 1.3/3.3 forks and the
  exam fail → retest week → pass (`drive/test/fullchain.test.ts`), the drive
  bundle builds (821 modules, act8 chunk 28.55 kB), and `docs/STORY_BIBLE.md` §12
  re-audits every problem and open question as FIXED / CHANGED / STILL OPEN.
- **The re-audit's author calls are closed (same day, follow pass).** I-009 now
  opens in the 1.4 aftermath (`c6bb2fa`), L-002 is Kent (`58340d5`), IV-001 is a
  live card (`adb9ffc`), and 6.2's clock is held by a test (`2954a6b`). Suite is
  **209/209** across 23 files; see `docs/STORY_BIBLE.md` §12.
- **Act VII is open, with a deck** (third pass the same day): `1681345` opens the act
  in every rule/status doc (cards allowed; no VII stills, no zone plates, no seed;
  herd art law unchanged), `bb78ac4` writes `cards/VII-001`…`VII-010` plus
  `scripts/validate-act-vii.js`, `e343149` wires all ten into 5.1–8.2 and extends
  `fullchain.test.ts` / `coverage.test.ts`, `1aadc80` gives 4.2 the guide's real
  licensing path and Hank the agricultural exception, `a456637` fixes `8.2.gm4`.
  Suite is **215/215** across 24 files; deck 131 cards; no seed, no still.
- **The deck's accuracy and the clock are closed** (fourth pass the same day):
  `9698514` puts VII-002's chains on the drive wheels (the guide names no axle) and
  restates the rule in VII-010, `c414a7d` makes the Spokane arrival midday and
  fixes VII-008 / 8.1 / 8.2, `7aa8a69` separates the 400-foot glow from the
  500/300-foot dim marks (6.2, VII-005, exam `c5_010`), `6a40749` has Deac name
  the 1.1 violation and state the Authority's courier supervision at 2.2,
  `2a888ae` moves Hank's harvest to the county, and `4a9a46f` makes the seeder
  refuse the VII scaffold. Suite is **251/251** across 27 files.
- **The permit timeline is closed** (follow-up, one commit): no permit-issuance
  beat and no elapsed-time statement existed, so 2.2 `permit1`–`permit3` now
  stamps the Authority courier permit and starts the log, 4.2 drops "You had
  seven", and the Authority provision at `lic5` is what waives the six months.
  1.3 is the DOL permit test; 4.2.1 calls 4.2 "the license set, not the permit
  set." Suite is **255/255** across 27 files.
- **Seed is live (2026-10-29).** `npm run seed -- IV-001` then `npm run seed`
  against production through the Railway public proxy: IV-001 live (seq 4001,
  image + four options), 121 cards seeded, one `skipped (no still; do not seed)`
  line for VII-001…VII-010, and six still audits with 0 mismatches.
  **2026-10-30:** those ten rows are seeded with a null image so `/drive` can
  grade them. The card game still does not deal that scaffold sentence.
- **Not open in code.** Left for hardware and the art pipeline: a headed
  `?profileDrive` browser pass, a full-campaign playthrough on a device
  (5.1 → 8.3 has never run on hardware; note pacing drags between 6.2 and 7.1),
  the II-009 / III-027 plate redraws (`AUDIT.md` §11), an afternoon-lot plate for
  I-009 if the 1.4 night placement wants one, the `7.3`/`8.1` `dusk`/`night`
  asset keys now that the scenes are daylight. VII stills are on disk for the
  drive (`cards/VII-001.jpg` … `VII-010.jpg`); the card game still does not
  deal them.
- **Card stills are read whole again (2026-10-31).** The drive's cockpit card
  painted its 2:3 still full-bleed with `object-fit: cover` (since `2c1b107`),
  so II-019 "Green Light, Black Ice" lost 69% of its height on a landscape phone
  — the traffic-light housing filled the frame. `cardStillStyle.ts` puts the
  still back on `contain` (whole plate, letterboxed, world still visible behind
  it) and `drive/test/cardStill.test.ts` pins the geometry. The `/` card game was
  never cropped (`AUDIT.md` §17). Suite is **260/260** across 28 files.
- **Next, from this fix.** If the still should read *above* the dock rather than
  behind its scrim on a landscape phone, that is a layout decision for the
  cockpit, not a fit change. No screenshot baseline exists yet — the headed
  `?profileDrive` pass is what would add one.


## P0b — the campaign has to be able to change scenes

- **[story] Act boundaries** — done. `quietroads/dialogue/sceneRouter.ts` owns
  "load the act that owns this scene, wait for it, then start it"; the bridge uses
  it on the `scene_finished` handoff and in `open()`. Act VI now carries
  `dialogue_act7.json` (Act 6 ends on `next_scene 7.1`, where V-006 lives), and
  `dialogue_act8.json` stays on the closed Act VII, which `loadAct` refuses. The
  7.3 → 8.1 handoff ends the playable campaign instead of throwing.
  `test/bundle.test.ts` walks all 26 handoffs and asserts each destination is
  present **and started**, including `7.1.card_V-006`.
- **[ux] Act select** — it was dead: `open()` asked `hasScene` before loading, so
  every act fell back to `0.1`. All five `ACT_ENTRY` scenes now start.
- **[perf] Preload the act that owns the upcoming `next_scene`** — replaces
  `nextAct`, which answered `"V"` for Act III and walked 2.5 → 3.1, skipping the
  exam at 4.1. Reading the scene's own `next_scene` names 3.5 → 4.1 correctly.
- **[teaching] Cues open on the skill** — done. No Act III card is on a duration or
  a bare coordinate any more; four new Ledger beats (`alongside`, `pass.clear`,
  `wet.enter`, `rumble.ride`) carry the sharing cluster. Card coverage is
  **measured** by driving the missions (`test/observedCues.ts`), not a hardcoded
  id list, and `test/teaching.test.ts` asserts each id both fires on the skill and
  stays shut without it.
- **[ux] The grade panel reads real events** — done. It listened for
  `week.grade.pass` / `week.grade.miss`, which nothing emits; it now reads the
  verdict off the one `week.elapsed` the retest already fires. A grade with no
  cued card still shows PASS/MISS (the card is the citation, not the verdict).
- **[graphics] One pixel ratio, and a 30 Hz panel that can recover** — done.
  `<AdaptiveDpr>` (a second DPR writer) and a no-op `<PerformanceMonitor>` are
  gone; the Canvas `dpr` prop is the only writer and the tier's ratio is re-applied
  once on a context restore. The reducer had two thresholds — demote over 33.4 ms,
  recover under 18.2 ms — which pinned a 30 Hz panel at `low` forever, since it can
  never produce an 18.2 ms frame; there is now one threshold and the high → mid →
  low ladder is unchanged. Draw calls are sampled from the Kent scene pass, not
  the postprocessing blit.
- **[sim] CCD threshold proven both ways** — done. "Zero tunnels at top speed" could
  not fail (a legal step is ~0.55 m against a 1.5 m threshold). The suite now
  asserts a step larger than the threshold emits `ccd.tunnel`, that a legal 1/60
  step at top speed does not, and that the margin is wide.

## P1 — Structure (one place per act)

- **[II] The 20 Act II cards** open from `CardCues` on the Grid beats. (P4)
- **[III] The 23 unwired Act III cards** open along the Ledger on the beat that
  practises each one — follow start, alongside, pass-clear, lane change, solid
  white, wrong lane, merge, wet, the rumble, and the run's end. None is on a
  duration or a bare coordinate. (P4)
- **[act-select]** Done and verified. Acts I–VI from `ACT_ENTRY`; all five entry
  scenes actually start (it used to fall back to `0.1` for every act not already
  in the entry chunk). (P3)
- **[IV] Route after the gate** — done. `local_loop_week` is a Kent drive.
  Missed guide refs pick the beat (school 20, four-way, stall, right lane,
  §5.2 gap, or the Meeker stop). A license miss stays on the book and still
  drives the stop. The week ends on `week.elapsed` only after the grade.
- **[V] V-002/V-004/V-008/V-009/V-011** open on the ramp and the merge grade. (P4)
- **[VI] VI-003/VI-005/VI-009/VI-011/VI-013** open on the backcountry grades. (P4)

## P2 — Latency / graphics / UX

- **[perf] No per-frame allocations** — done. The 60 Hz sample path copies into
  one owned previous-sample object instead of `{ ...s }`; `Simulation`, the
  bridge and `ZoneField` reuse their per-step objects. (P13)
- **[graphics] Quality tiers** — done. A pure `stepQuality` reducer picks high/mid/low
  from the measured frame time; one DPR writer (the Canvas `dpr` prop, with the
  tier's ratio re-applied once on a context restore); postprocessing mounts only
  the tier's effects; mobile DPR capped at 1.5. Recovery uses the same threshold as
  demotion, so a panel locked at 30 Hz is not pinned at `low` after one stall.
  (P8)
- **[graphics] Kent static merge / InstancedMesh** — done for buildings, lane
  markings and the ContinuousRoad segments. Colliders stay one per building and
  one per solid segment. (P14)
- **[ux-touch] Analog-feeling touch steering** — dead zone + sensitivity curve
  already in `TouchOverlay.shapeAxis`; the drive root now also carries
  `overscroll-behavior: none` so nothing scroll-chains behind it.
- **[ux] Debrief per scene** — done. A grade event opens one short panel:
  GRADE, PASS or MISS, the card id that just opened, and that card's
  `source.dol_section`. Closes on the existing continue control; emits nothing.
  The verdict comes from events the sim actually emits: the Act IV week reads its
  own `week.elapsed` payload, and a grade with no cued card still shows PASS/MISS
  (the card rows are simply omitted).
- **[a11y] remappable keys, text size, reduced-motion/shake toggle,** — done.
  A persisted `binds` table (`mergeDriveInput` reads it; defaults are the
  shipped arrows/WASD set, Esc cancels a capture, a reset row restores), and
  three persisted text-size steps applied to dialogue, card and HUD type as a
  CSS variable. Colorblind HUD on, pass/miss carries a word and a shape, not
  colour alone. (P12)
- **[a11y] subtitles for all spoken lines** — not needed: every `line` node in
  every dialogue file already carries text, so `DialogueBox` prints it. Nothing
  added.
- **[audio] unlock on first gesture (iOS Safari)** — verified and completed.
  `AudioManager.init()` ran inside the first click/keydown/touchstart; it did
  not resume the context there, so `resume()` now runs in that same gesture.

## P3 — Story / cohesion + polish

- **Deac's on-road behaviour matches the story** — **done.** III-001 "Your Wheel"
  is hand-written and has him *"sweep the glass, hold the lane, then take one
  merge late on purpose so you can watch what that costs."* He used to be a
  straight line at constant speed that never changed lane, with a heading
  hardcoded to `Math.PI / 2` — the merge both III-001 and III-013 are written
  about did not exist on the road. `DEAC` in `sim/ledger.ts` is now his drive
  script (arm out, hold, one *late* merge), position is a pure function of
  distance along the corridor so it is reproducible, and heading comes from real
  displacement. III-013 moved from the player's `ledger.merge.slow` onto
  `deac.merge.late` — the beat its own comment had always named. Both beats are
  witness-gated: the card is about what you *saw*, so a player parked 100 m back
  never gets it. `test/deac.test.ts`, 12 two-sided tests.
- **Quiet pressure tied to the graded skill** (reinforce, don't add chaos) —
  **done, owner decision 2026-10-05.** The Quiet are the zombies: one herd
  (`QuietField` / `QuietSwarm`, spawns in `kentMap.ts`). A missed grade — the
  fail events the graders already fire (`GRADE_MISSES` in `sim/pressure.ts`) —
  wakes the herd within sight toward the car, or moves existing dormant Quiet
  onto the roadside ahead so the sprites are on screen. A pass raises nothing;
  decay is untouched; a miss alone stops at ALERT so the swarm stays the noise
  system's verdict. `test/pressure.test.ts`, 5 two-sided tests driven through
  the real graders.
- One tone of voice / one UI / one audio palette across acts.
  **Done, owner decision 2026-10-05.** One accent (`SCENE_ACCENT`, the Menace
  pink), one cockpit on every act, the Quiet meter on every playable act
  (`sceneSpec.ts` + `CockpitHUD`/`QuietHUD`), one speaker voice table for
  radio/CB beds and the in-cab treatment (`dialogue/voice.ts`, per-line
  `voice_bed` still wins), and AudioManager stays the one procedural sound set.
  `test/voice.test.ts`. Card copy and `pack/23` untouched.
- Lazy-load each act's level; preload the owning act during debrief; disposal on
  change. **Done.** Per-act dynamic imports with Act I eager in the first load;
  the act owning the scene's own `next_scene` preloads while the grade debrief is
  up - reading the scene, not the next act letter, since `nextAct('III')` answered
  'V' and walked 2.5 -> 3.1, skipping the exam at 4.1. Act-scoped
  geometries/materials are disposed on an act change and shared highway chunks
  are not. Act VI owns 6.x **and** 7.x, so the Act 6 -> 7 jump has a destination.

## Known risks / deliberately out of scope

- Act VII is **open** (author-approved 2026-10-29): the 2026-10-28 overhaul opened
  scenes 5.1–8.3 (`48b0c49`). Drive stills are `cards/VII-001.jpg` …
  `VII-010.jpg`, seeded as image bytes. No VII zone plates. The card game
  hides the `variation.forced` sentence and does not deal them.
  `drive/test/seed.test.ts` still pins the ten as that shape, and IV-001 stays
  seedable. Backend, auth, parent dashboard, DRIVE_ENABLED untouched (Rule 2).
- BD-1 is **signed off** (owner, 2026-10-05): `FOLLOW.rule` stays `seconds`
  (3 s dry / 4 s truck), the grader does not switch to `vehicle_lengths`, and the
  guide-led teaching copy stays as it is. BD-2 is resolved (§4.14 citations).
- Homogeneous GPU baselines still need the `?profileDrive` browser run. **No
  headed browser ran**, so there is no frame-rate number. The old `30 / 29.6`
  figures were the sample window's own 30 Hz clock and are withdrawn.
- `bench/baseline.json` was regenerated on 2026-10-05, not restored. Stopping
  distances are unchanged (74.7 / 85.6 / 102.6 / 89.8 / 103.0 / 264.4 m). The
  committed step timings are the slower run. Central p50 in the file is 67.7 µs.
  The 60 µs figures quoted in the log are not in the file.
- P19 is not an open mirror. Lane index 0 is the right lane. Index 2 is the left,
  passing lane. Do not flip it.
- Stage destinations are the pink pad on `navTarget()`. The pharmacy handoff on foot is that pad (3.2 m), not the 1.55 m door circle. Stop signs grade the facing semicircle only (`ZoneDef.approach`). The carport return is the pad under the bay, not `x < 30`.



