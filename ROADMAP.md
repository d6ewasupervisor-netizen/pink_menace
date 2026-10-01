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
| Cards opened in-scene | I 12/12 · II 11/31 · III 7/31 · V 8/13 · VI 9/13 | every card in every act |
| Stop/gap/yield grade lock | already fires (baseline.json) | a scene passes only when its grade fired |

## P0 — Foundations (do first; they unblock everything else)

- **[perf] Move HUD speed/RPM to a throttled channel.** `publishVehiclePose`
  writes `velocityMph/engineRPM/…` to `gameStore` at 60 Hz, forcing
  `EngineHUD`/`GameHUD`/`Speedometer` re-renders at 60 Hz. Route them through the
  existing ~10 Hz `qrHud.frame` (or a 10 Hz velocity channel); keep a 60 Hz ref
  for camera/audio. (P5)
- **[latency] WebGL context-loss + restore.** Handle `webglcontextlost` (pause,
  present a resume prompt) and `webglcontextrestored`. (P6)
- **[teaching] Surface friction for gravel and wet** — set `vehicle.mu` from the
  corridor (gravel, wet on deck/rain, ice) so the stopping shadow stops lying on
  those surfaces. Behind a named config; record before/after on the shadow test.
  (P2)
- **[teaching] Expose the following-distance rule as a named config** resolving
  BD-1 (`FOLLOW_RULE: 'seconds' | 'vehicle_lengths'`). Default unchanged until the
  owner picks; document both in the debrief copy. (P1)
- **[config] One documented tuning file.** Move the scattered constants
  (`VehicleController`, `vehicleObserver`, `noise`, `quiet`, grader thresholds)
  into a single `drive/src/quietroads/config.ts` with old values as a named
  preset. (Rule 4)
- **[tests] Keep `vitest run` green** — grading tests already lock stop/gap/yield;
  extend to every grade event in gradient order.

## P1 — Structure (one place per act)

- **[II] Wire the 20 un-opened Act II cards** into the Grid's existing beats
  (each card opens in-scene at the moment its skill is graded). (P4)
- **[III] Central as its own arterial** — Deac's truck on three lanes long enough
  to hold a gap more than once, then a lane drop; wire the 24 un-opened III cards
  in-scene. (P4)
- **[act-select] Make act select work** from `ACT_ENTRY`, so a new run doesn't
  replay Act I. `MainMenu` renders an act list. (P3)
- **[IV] Route after the gate** — short street built only from the exam's missed
  questions (missed chapter → a beat on that road). (P4)
- **[V] wire V-002/V-004/V-008/V-009/V-011** in-scene on the Ribbon. (P4)
- **[VI] wire VI-003/VI-005/VI-009/VI-011/VI-013** in-scene on the Backcountry. (P4)

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
- **BD-1 / BD-2** block the two teaching-copy decisions until the owner replies.
- Homogeneous GPU baselines need the `?profileDrive` browser run before
  graphics/P0 changes land, so "before" is recorded.