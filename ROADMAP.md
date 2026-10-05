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
| Cards opened in-scene | I 12/12 · II 31/31 · III 30/30 · V 13/13 · VI 13/13, measured | every card in every act |
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
- **[tests] `vitest run` green** — 163 tests, 15 files (stop/gap/yield, follow-rule,
  card cues on the sim bus, **act-boundary chain**, **Deac's drive script + the
  witness gate on his beats**, exam gate, retest week, alloc identity, CCD, quality
  tiers + the 30 Hz recovery, scene-pass draw calls, instancing, accessibility,
  debrief incl. the Act IV week, bundle split, spoken lines, bench).

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
  **still open, not this pass.** The Quiet/Noise system is Act I–II only;
  `mission_jonah_intersection` is the one driving mission that reads awareness,
  and Acts III/V/VI do not. The natural reading is that the graded skill should
  move the noise rather than noise being ambient decoration — but that is a
  design decision about what Act III is *about*, and it wants an owner before code.
- One tone of voice / one UI / one audio palette across acts.
  **Still open — not this pass.**
- Lazy-load each act's level; preload the owning act during debrief; disposal on
  change. **Done.** Per-act dynamic imports with Act I eager in the first load;
  the act owning the scene's own `next_scene` preloads while the grade debrief is
  up - reading the scene, not the next act letter, since `nextAct('III')` answered
  'V' and walked 2.5 -> 3.1, skipping the exam at 4.1. Act-scoped
  geometries/materials are disposed on an act change and shared highway chunks
  are not. Act VI owns 6.x **and** 7.x, so the Act 6 -> 7 jump has a destination.

## Known risks / deliberately out of scope

- Act VII stays closed (Rule 8). Backend, auth, parent dashboard, DRIVE_ENABLED
  untouched (Rule 2).
- BD-1 and BD-2 are resolved (seconds feel, guide-led copy, §4.14 citations).
- Homogeneous GPU baselines still need the `?profileDrive` browser run. **No
  headed browser ran in this pass**, so the graphics changes are justified by unit
  tests and the build split rather than by a frame-rate claim. The old `30 / 29.6`
  figures were the sample window's own 30 Hz clock and are withdrawn.
- `bench/baseline.json` was restored rather than regenerated: no physics change
  landed, so 74.7 / 89.8 / 103.0 / 264.4 m still hold and re-recording would only
  churn step timings that move with machine load.



