# AUDIT — Quiet Roads (the /drive 3D game)

Phase 1 reconnaissance, 2026-09-30. Branch `agent/overhaul-2026-09-30`.

Scope: the 3D teaching drive at `/drive` (repo: `drive/`, built into
`public/game/drive`). The card game at `/` and the backend are out of scope
(HARD RULE 2). Source of truth for teaching: `docs/wa-driver-guide/`.

---

## 1. Architecture

```
drive/src/
  main.tsx ─▶ App.tsx (auth + DriveSync.hydrate) ─▶ ZombieRoadWarrior ─▶ Game3D
  Game3D.tsx         Canvas (dpr [1,1.5], fov 75) + <Physics gravity=-9.71,
                     timeStep=1/60, interpolate> ─▶ Scene (KentWorld/RoadChunks,
                     Vehicle, GameCamera, TrafficRenderer, QuietSwarm,
                     StoppingShadow, HeadlightBeam, …) + HTML overlays
  quietroads/
    data/*.json      cards.json (122), dialogue_act*.json, questions_v1/2/3
    dialogue/        DialogueRunner (trigger/wait/card/branch node engine),
                     host.ts (DialogueHost iface), types.ts
    sim/             Simulation (mission router + world stepper) +
                     graders: dol, grid, ledger, ribbon, convoy, climb, rural,
                     beats, escort, chainup, pharmacy; quiet.ts (swarm),
                     noise.ts (sound falloff), vehicleObserver.ts (shadow/slip),
                     kentMap.ts + corridors.ts (geometry)
    study/           QuestionBank, SM-2 mastery, exam_40, CardDeck, CARD_FOR_TRIGGER
    actChallenges.ts  act↔scene↔mission registry (ACT_CHALLENGES, SCENE_ACT, MISSION_ACT)
  stores/            gameStore (vehicle/game, zustand+persist), qrStore (story
                     progress, persisted), qrHud (transient HUD + telemetry)
  systems/           QuietRoadsBridge (singleton: dialogue↔sim↔store↔server),
                     VehicleController (arcade setLinvel/angvel), TrafficManager
                     (highway NPCs), AudioManager, DriveSync, QuizManager,
                     RoadChunkManager, StepEventQueue, headlights, physicsStep
  input/             driveInput.ts (key/gamepad/touch merge)
  hooks/             useTouchControls, useQuiz, useGameProgress, useCompactHud
```

### Execution model

- **Physics** is Rapier on a fixed 1/60 s step with `interpolate`. The car is a
  `RigidBody` (mass 1200, `ccd`, `enabledRotations=[false,true,false]`,
  `colliders=false`) with a single `CuboidCollider` of `friction=0`. Motion is
  programmatic: `VehicleController.tickVehicle` runs in `useBeforePhysicsStep`
  and writes `setLinvel`/`setAngvel`; `publishVehiclePose` runs in
  `useAfterPhysicsStep` and writes one coherent snapshot to `gameStore`.
- **Story** is dialogue-file driven. `DialogueRunner` executes `line/wait/card/
  branch/choice/jump/end` nodes and fires/receives events. A `card` node shows a
  PINK MENACE card; a `start_gameplay` effect hands control to `Simulation`.
- **Missions** are pure graders. `Simulation.step(dt, sample)` feeds a
  `VehicleSample` to the active mission grader, which emits `*` events the
  dialogue waits on. Graders do not drive the car.
- **HUD** updates at ~10 Hz. `qrHud.frame` and the store copy of
  `velocityMph`/`engineRPM` are both throttled. Camera, audio, and wheel spin
  read `liveDrive`, which updates every physics step.

```mermaid
flowchart TD
    subgraph Entry
      A[App.tsx] --> B["DriveSync.hydrate()"]
      B --> C[QuietRoads.start]
      C --> G[Game3D Canvas + Physics]
    end
    subgraph Story
      D["DialogueRunner (dialogue_act*.json)"]
      E["card node → CardOverlay"]
      F["start_gameplay → Simulation.startMission"]
    end
    subgraph Drive
      H[useBeforePhysicsStep → VehicleController.tickVehicle]
      I[Rapier step 1/60 interpolate]
      J["useAfterPhysicsStep → publishVehiclePose + QuietRoads.tick"]
      K[Simulation.step → mission grader → events]
      L[GameCamera / StoppingShadow / QuietSwarm / HUD]
    end
    subgraph Persistence
      M[DriveSync → /api/drive/*]
      N[qrStore + gameStore persisted]
    end
    D -->|card_shown| E
    D -->|gameplay_requested| F
    F --> K
    H --> I --> J --> D
    J --> L
    K -->|fires events| D
    D --> N --> M
```

---

## 2. Card → trigger → grade, per act

Legend: **DIALOG** = a `card` node in a dialogue scene (type in parentheses);
**TRIG** = an in-world `CARD_FOR_TRIGGER` event fired by a sim grader while
driving; **—** = never opened in the drive (briefing-only / card host).

### Act I — The Lot (12/12 wired) ✓ reference model
- DIALOG: 0.2 gameplay → I-002, I-003, I-004 · 0.3 radio → I-001 ·
  1.2 gameplay → I-005, I-009 · 1.3 gameplay → I-006, I-007, I-008, I-010 ·
  1.4 still → I-011 · 1.4b still → I-012
- Grades: `tutorial_carport`, `mission_dol_drive`, `minigame_park_dol`
  (`park.clean`/`park.curb`), `stealth_dol_interior` + `chase_dol_gracie` (QTE).

### Act II — The Grid (11/31 wired)
- DIALOG: II-001, II-004, II-024 (gameplay); II-006, II-012 (still)
- TRIG: II-002 `sign.prompt:school`, II-003 `sign.prompt:regulatory`,
  II-005 `backing.mirror`, II-006 `signal.arm`, II-010 `bus.stop_arm`,
  II-012 `follow.close`, II-024 `stop.approach`, II-027 `zone.school.enter`,
  II-030 `driveway.turn`
- Grades: `mission_delivery_1_insulin`/`dropoff_pharmacy`,
  `mission_delivery_2_catfood` (`park.back_in.*`), `mission_delivery_3_radio`
  (`lanechange.*`), `mission_delivery_4_filters` (`park.parallel.*`),
  `mission_jonah_intersection` (`jonah.blowthrough`, `stop.approach`, `follow.close`)
- **Cued in-scene (20):** II-007, II-008, II-009, II-011, II-013, II-014, II-015,
  II-016, II-017, II-018, II-019, II-020, II-021, II-022, II-023, II-025,
  II-026, II-028, II-029, II-031. `CardCues` fires `card.cue:<id>` on the Grid
  beat that practises the skill; the bridge opens one card at a time.

### Act III — Central (7/31 wired)
- DIALOG: III-002, III-003, III-004, III-006 (2.5 gameplay); III-007 (3.2); III-016, III-020 (6.2)
- Grades: `mission_central_ledger` (`ledger.lanechange.clean|no_signal`,
  `ledger.crossed_solid`, `ledger.wrong_lane`, `ledger.follow.close`, `ledger.merge.*`)
- **Cued in-scene (23):** III-001, III-005, III-008, III-009, III-010, III-011,
  III-012, III-013, III-014, III-015, III-017, III-018, III-019, III-021,
  III-022, III-023, III-024, III-025, III-026, III-027, III-028, III-029, III-030.
  (The earlier "24" count listed 23 ids.) South of `solidY` the Ledger is wet,
  so III-024's rain stretch lengthens the stopping shadow.

### Act IV — The Core (1/22 wired by card node; exam otherwise)
- DIALOG: IV-018 (4.2 exam). The act is `study_terminal` (10 questions) →
  `exam_40` (40 questions, 32 to pass) → `local_loop_week`.
- **Not wired (21):** IV-001-brake, IV-002…IV-017, IV-026…IV-030 (IV stills live
  in the card game; only IV-018 opens inside the drive).

### Act V — The Ribbon (8/13 wired)
- DIALOG: V-001, V-003, V-005 (3.2); V-006 (7.1); V-007, V-010, V-012 (3.1b); V-013 (3.3)
- Grades: `mission_ribbon_merge` (`ribbon.*`), `mission_convoy_issaquah`
  (`merge.*`, `follow.green|red`), `chainup_qte`, `climb_snoqualmie`
  (`ice.enter`, `speed.over:35`, `input.gentle_streak`, `skid.worsening`)
- **Cued in-scene (5):** V-002, V-004 (`ramp.enter`), V-008 (on the ramp),
  V-009, V-011 (`ribbon.merge` / `merge.gap_open`).

### Act VI — The Backcountry (9/13 wired)
- DIALOG: VI-001, VI-002, VI-004, VI-006, VI-010, VI-012 (6.1b)
- TRIG: VI-007, VI-008 `roundabout.approach`
- Grades: `mission_backcountry_run` (`rural.shoulder`, `rural.crest.*`,
  `rural.uncontrolled.*`, `rural.crossbuck.*`, `roundabout.*`), `straight_night_drive`,
  `vantage_bridge_crossing`, `bridge_*`, `escort_ritzville` (`nozone.*`, `moveover.*`)
- **Cued in-scene (5):** VI-003 (`rural.shoulder` / no-zone), VI-005 (crest or
  wide turn), VI-009 (uncontrolled), VI-011 (crossbuck), VI-013 (rural end or
  Ritzville). The earlier "(4)" counted these five ids.

---

## 3. Problems found (tagged: area · severity S1–S4 · effort S/M/L)

| # | Area | Sev | Effort | Finding (evidence) |
|---|---|---|---|---|
| P1 | Teaching | S1 | S | **Following distance — resolved.** Graders read `followFullGapM` (`config.ts`). Default feel is still 3 s dry / 4 s truck. `FOLLOW.rule = "vehicle_lengths"` grades §5.2 literally (8 m / 14 m). Cards II-012, V-012, II-014 and the mission objectives lead with the guide's sentence. |
| P2 | Teaching | S2 | S | **Surface friction — resolved for gravel and the Ledger rain stretch.** Gravel μ 0.5 on the backcountry and escort (beetle 55 mph stop 89.8 m). Wet μ 0.4 south of `ledger.solidY` (beetle wet 103.0 m). Ice stays 264.4 m. |
| P3 | UX | S2 | M | **No act select.** `MainMenu.tsx` offers only CONTINUE / START NEW RUN. `actChallenges.ACT_ENTRY` and `challengeForAct` exist but the menu never surfaces them, so a new run replays from Act I. |
| P4 | Story | S2 | L | **Unwired cards — cued.** The 20/23/5/5 cards in §2 open from `CardCues` while that act's mission is running. The bridge queues them and shows one at a time. |
| P5 | Perf | S2 | M | **HUD speed/RPM — throttled.** `liveDrive` updates every physics step for camera, audio, and wheel spin. `publishVehiclePose` copies mph/RPM into `gameStore` at 10 Hz. Pose still publishes every step. |
| P6 | Latency | S2 | M | **No WebGL context-loss handling.** `Game3D` handles tab visibility (pause) but not `webglcontextlost`/`restored`. |
| P7 | Perf/Script | S2 | M | **No automated test runner.** 12 `.mts` mission scripts exist but need a manual esbuild+node step; no Vitest/Playwright; no benchmark harness. |
| P8 | Graphics | S2 | M | **Binary quality only.** `LOW_END` boolean + dpr clamp `[1,1.5]`; no `PerformanceMonitor`/`AdaptiveDpr`, no postprocessing tier ladder at runtime (PostProcessing takes `lowEnd` but doesn't swap effect count by measured FPS). |
| P9 | Physics | S2 | M | **No tunneling/CCD metrics.** CCD is on (`Vehicle.tsx:562`) but no telemetry proves zero tunneling at top speed on any surface; no CCD-threshold config value. |
| P10 | Data | S3 | S | **`art-review-state` — stripped from the client deck.** The review file stays at `cards/art-review-state.json`. |
| P11 | Data | S3 | S | **`IV-001-brake` non-standard card id** (lowercase suffix). Present in the deck but only wired as a `ride-along-still`. |
| P12 | UX/a11y | S3 | M | **Accessibility gaps.** No remappable keys, no text-size setting, no reduced-motion / camera-shake toggle (shake is hard-coded in `GameCamera.tsx`), no explicit colorblind affordance in HUD. |
| P13 | Perf | S3 | M | **Per-frame allocations in hot paths.** Camera reuses vectors (`GameCamera`), but `QuietRoadsBridge`/`Simulation` step allocate event objects per tick (spread sample, `{...s}` in `vehicleObserver.ts:121`). Acceptable at 10 Hz events; worth a pass. |
| P14 | Graphics | S3 | M | **Kent geometry not merged/instanced.** `KentWorld.tsx` + `ContinuousRoad.tsx` render per-segment fixed `RigidBody` colliders; buildings not merged. Highway already uses instancing (`RoadChunks`). |
| P15 | Story | S3 | S | **Act III scene borrows II-006/II-012** from a `still` (briefing) scene `3.1`, so those two cards never open *on the road* — they're read in briefing, not driven. |

---

## 4. Decisions (owner: fix them)

- **BD-1 — Following distance. Resolved.** Drive feel stays the seconds count
  (`FOLLOW.rule = "seconds"`, 3 dry / 4 truck) so the gap still grows with
  speed. Teaching copy on II-012, V-012, II-014, the Ledger/convoy/escort
  objectives, and the fallback quiz leads with the guide's sentence: leave at
  least twice the length of your vehicle. `followFullGapM(..., "vehicle_lengths")`
  grades that distance literally (car 8 m, truck 14 m) if the switch is flipped.
  II-012 and V-012 now cite §5.2 Space, not §5.4 Time.

- **BD-2 — Hand-signal citation. Resolved.** Cards that cited "2.5 Vehicle
  Maintenance (Hand signals)" now cite "4.14 Turning" (II-006, II-016, II-022,
  III-019, and the same strings in `cards/`). The practised rule is unchanged.

## 5. Baselines

The browser baseline (average FPS, 1% low, frame time, draw calls, triangles,
JS heap, time-to-first-frame, act load, input-to-response) requires the
instrumented client (`?profileDrive`) on a real/emulated device; those numbers
are captured by the harness in `drive/bench/` and will be appended here after a
measured run. The **sim/grader-level** deterministic baseline (event correctness,
stopping distances, per-mission step cost) is recorded in §6.

## 6. Deterministic sim baselines (headless)

Source of truth: `drive/bench/baseline.json` (regenerated 2026-10-01T07:46:58Z).
Step times move between runs; the JSON file is the number to diff.

Sim step CPU cost (µs) — one scripted lap per act, fixed 1/60 s step:

| Mission (act) | steps | step µs p50 | p95 | max |
|---|---|---|---|---|
| mission_delivery_1_insulin (II) | 1200 | 54.8 | 127.7 | 1240.5 |
| mission_central_ledger (III) | 1200 | 55.6 | 84.4 | 542.3 |
| mission_ribbon_merge (V) | 1200 | 53.7 | 65.3 | 573.4 |
| mission_backcountry_run (VI) | 2000 | 50.8 | 65.6 | 317.0 |

(max values include the first-step/JIT warm-up.)

Stopping distance at 55 mph (m) — `stoppingDistanceM` (reaction 1.5 s + braking):

| config | m |
|---|---|
| beetle_dry | 74.7 |
| highway_dry | 85.6 |
| truck_dry | 102.6 |
| beetle_gravel | 89.8 |
| beetle_wet | 103.0 |
| highway_ice | 264.4 |

Grade events confirmed to fire on the scripted laps: `stop.approach`,
`stop.rolled`, `ledger.follow.close`, `rural.uncontrolled.rolled`,
`rural.crossbuck.rolled`, `roundabout.rolled`, `ramp.enter` (see baseline.json).

---

## 7. Phase 3 progress (this session)

| Item | Area | Commit |
|---|---|---|
| Gravel surface friction — stopping shadow correct on unpaved (§5.6/§4.15) | P2 ✅ | `1bf0d52` |
| Act select on the title screen — no forced Act I replay, I–III replayable | P3 ✅ | `bc83818` |
| WebGL context-loss handled (pause on loss, clear on restore) | P6 ✅ | `6b75a9b` |
| Test/bench harness (Vitest + Playwright + deterministic bench) | P7 ✅ | `08f9153` |
| Following-distance config + guide-led teaching copy | P1 ✅ | this session |
| Hand-signal citations → §4.14 Turning | BD-2 ✅ | this session |
| Wet μ on the Ledger south of solidY | P2 ✅ | this session |
| In-scene cues for the previously unopened II/III/V/VI cards | P4 ✅ | this session |
| HUD speed/RPM store writes at 10 Hz (`liveDrive` stays 60 Hz) | P5 ✅ | this session |

| Stripped `art-review-state` from the client deck | P10 ✅ | this session |

Still open: P8, P9, P11–P15 (quality tiers, CCD telemetry, the `IV-001-brake` id,
accessibility, per-frame allocations, instancing), the Act IV missed-question
road, and a browser `?profileDrive` pass. Headless tests: 14/14. `tsc --noEmit` exit 0.

<!-- CONTINUED -->