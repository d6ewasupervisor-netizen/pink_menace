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
- **[tests] `vitest run` green** — 36 tests (stop/gap/yield, follow-rule,
  card cues, exam gate, retest week, bench).

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

- **[perf] No per-frame allocations** — reuse vectors/quaternions in
  `QuietRoadsBridge`/`Simulation`/`vehicleObserver` (P13).
- **[graphics] Quality tiers** — `PerformanceMonitor` + `AdaptiveDpr`, DPR clamp
  ~1.5 mobile, postprocessing ladder gated by tier (P8).
- **[graphics] Kent static merge / InstancedMesh** for buildings, lane markings,
  Quiet crowds (P14).
- **[ux-touch] Analog-feeling touch steering** — explicit dead zone + sensitivity
  curve; pointer events, no passive lag, prevent scroll/zoom/pull-to-refresh.
- **[ux] Debrief per scene** — what was graded, passed/missed, which card, which
  guide section (this "she learns" loop is required).
- **[a11y] remappable keys, text size, reduced-motion/shake toggle,** colorblind
  HUD, subtitles for all spoken lines (P12).
- **[audio] unlock on first gesture (iOS Safari)** — already wired; verify.

## P3 — Story / cohesion + polish

- Deac's on-road behaviour matches the story; Quiet pressure tied to the graded
  skill (reinforce, don't add chaos).
- One tone of voice / one UI / one audio palette across acts.
- Lazy-load each act's level; preload next act during debrief; disposal on change.

## Known risks / deliberately out of scope

- Act VII stays closed (Rule 8). Backend, auth, parent dashboard, DRIVE_ENABLED
  untouched (Rule 2).
- BD-1 and BD-2 are resolved (seconds feel, guide-led copy, §4.14 citations).
- Homogeneous GPU baselines need the `?profileDrive` browser run before
  graphics/P0 changes land, so "before" is recorded.