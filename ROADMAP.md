# ROADMAP — Quiet Roads overhaul (`agent/overhaul-2026-09-30`)

Ordered by **(player impact ÷ effort)**, foundations first. Each item is one
commit (message `[area] what — why — measured result`), played on both viewports,
checked against `docs/wa-driver-guide/`, and logged in `AGENT_LOG.md` + `INDEX.md`.

## Targets (measured, 2026-10-01)

| Metric | Current | Target |
|---|---|---|
| Sim step CPU | ~59 µs p50 (headless) | no regression; log after each physics change |
| Desktop FPS | to measure (`?profileDrive`) | ≥ 60 |
| Mobile portrait FPS | to measure | ≥ 30 with steady frame times |
| Input→response | to measure | ≤ 1 frame (16.7 ms) |
| Time-to-first-frame (mobile 4G) | to measure | < 4 s |
| CCD/tunneling | on, unmeasured | zero at top speed on all surfaces |
| Cards opened in-scene | I 12/12 · II 31/31 · III 30/30 · V 13/13 · VI 13/13 | every card in every act |
| Stop/gap/yield grade lock | already fires (baseline.json) | a scene passes only when its grade fired |

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
- **[tests] `vitest run` green** — 111 tests (stop/gap/yield, follow-rule,
  card cues, exam gate, retest week, alloc identity, CCD, quality tiers,
  instancing, accessibility, debrief, bundle split, spoken lines, bench).

## P1 — Structure (one place per act)

- **[II] The 20 Act II cards** open from `CardCues` on the Grid beats. (P4)
- **[III] The 23 unwired Act III cards** open along the Ledger, including a
  second follow-close and the wet stretch south of `solidY`. (P4)
- **[act-select]** Done. Acts I–VI from `ACT_ENTRY`. (P3)
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
- **[graphics] Quality tiers** — done. `PerformanceMonitor` + a pure
  `stepQuality` reducer; one DPR owner (the Canvas `dpr` prop); postprocessing
  mounts only the tier's effects. Mobile DPR capped at 1.5. (P8)
- **[graphics] Kent static merge / InstancedMesh** — done for buildings, lane
  markings and the ContinuousRoad segments. Colliders stay one per building and
  one per solid segment. (P14)
- **[ux-touch] Analog-feeling touch steering** — dead zone + sensitivity curve
  already in `TouchOverlay.shapeAxis`; the drive root now also carries
  `overscroll-behavior: none` so nothing scroll-chains behind it.
- **[ux] Debrief per scene** — done. A grade event opens one short panel:
  GRADE, PASS or MISS, the card id that just opened, and that card's
  `source.dol_section`. Closes on the existing continue control; emits nothing.
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

- Deac's on-road behaviour matches the story; Quiet pressure tied to the graded
  skill (reinforce, don't add chaos). **Still open — not this pass.**
- One tone of voice / one UI / one audio palette across acts.
  **Still open — not this pass.**
- Lazy-load each act's level; preload next act during debrief; disposal on
  change. **Done.** Per-act dynamic imports with Act I eager in the first load;
  the next act preloads while the grade debrief is up; act-scoped
  geometries/materials are disposed on an act change and shared highway chunks
  are not.

## Known risks / deliberately out of scope

- Act VII stays closed (Rule 8). Backend, auth, parent dashboard, DRIVE_ENABLED
  untouched (Rule 2).
- BD-1 and BD-2 are resolved (seconds feel, guide-led copy, §4.14 citations).
- Homogeneous GPU baselines need the `?profileDrive` browser run before
  graphics/P0 changes land, so "before" is recorded.