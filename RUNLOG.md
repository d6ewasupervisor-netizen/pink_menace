# RUNLOG — the portrait rebuild of the 3D drive

Branch: `drive/portrait-rebuild` (from `main` @ `dd56f45`). One commit per item,
message prefixed `[id]`. Phases merge to `main` only when every gate is green.

Baseline at the start of this run (from `AGENT_LOG.md` 2026-11-08): vitest
**432/432** across 43 files, `tsc --noEmit` 0, `npm run build` 5.16 s /
**4,037.41 kB** (1,329.78 kB gzip), playwright headless `--workers=1`
**41 passed / 21 skipped / 0 failed** in 10.6 min.

## Items

| Item | Status | Notes |
|---|---|---|
| 0.1 branch, clean tree, RUNLOG | DONE | main == origin/main @ dd56f45, tree clean, `drive/portrait-rebuild` created from main |
| 0.2 baseline gates | DONE | vitest **432/432** (43 files, 12.3 s), tsc 0, build **4,037.41 kB / 1,329.78 kB gzip** (5.35 s), playwright **41 passed / 21 skipped / 0 failed** (10.5 min) |
| 0.3 cockpit inventory + BEFORE.md + screenshots | DONE | `e2e/cockpit-inventory.spec.ts` (opt-in `COCKPIT_INVENTORY=1`); `docs/cockpit/BEFORE.md` + `docs/cockpit/before/*.png` written |
| 1.1 field diagnostics (GPU, context loss, shader, dark frame, ?diag=1) | DONE | `systems/diagnostics.ts` (+16 unit tests), `Game3D/FieldDiagnostics.tsx`, `DiagPanel`, guard rows + chip + 5 s retry; the shader-error row immediately found the 6.3 cause (findings 1) |
| 1.2 sky that always renders + floor lighting | DONE | gradient `scene.background` per time of day (never culled), `systems/lightFloor.ts` (night floor 0.14/0.10/0.06), fog density ceiling in `systems/visibility.ts` |
| 1.3 headlights that light the road, fog vs camera | DONE | spots visible only when the stalk is on, LOW/HIGH differ in intensity/distance/angle; `quietroads/sceneLight.ts` fixes the real cause (6.2/6.3 entered as `day`) |
| 1.4 never-black e2e + detector unit tests | DONE | `e2e/never-black.spec.ts` (Pixel 7 + iPhone 13, 9 scenes, luminance, context, shader) green; context-loss case BLOCKED (see below) |
| 2.1 quality tier picker | TODO | not started this run |
| 2.2 model LODs (`scripts/build-lods.mjs`) | TODO | not started |
| 2.3 lazy loading / code split | TODO | not started |
| 2.4 tier + throttled first-frame e2e | TODO | |
| 3.1 design tokens | TODO | |
| 3.2 layout spec rewrite | TODO | |
| 3.3 top rail, noise bar, nav strip, objective | TODO | |
| 3.4 world-band cues | TODO | |
| 3.5 dialogue box | TODO | |
| 3.6 controls | TODO | |
| 3.7 compound surfaces re-skin | TODO | |
| 3.8 dead UI removal + REMOVED.md | TODO | |
| 3.9 cockpit overlap/budget tests + baselines | TODO | |
| 4.1 settings panel | TODO | |
| 4.2 tilt steering | TODO | |
| 4.3 tilt tests | TODO | |
| 5.1 haptics, shake, reduced motion | TODO | |
| 5.2 7.3/8.1 daylight keys | TODO | |
| 5.3 feel tests | TODO | |
| 6.1 full chain + guards | TODO | |
| 6.2 scene sweep e2e | TODO | |
| 6.3 performance numbers | TODO | |
| 6.4 docs (AFTER.md, AUDIT, ROADMAP, AGENT_LOG) | TODO | |
| 6.5 final merge, push, clean | TODO | |

## Findings so far (they change the plan)

1. **The black screen reproduces, and it has a cause.** A headless Chromium prints,
   the moment a night drive mounts the high tier's flares:
   `THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false / Material Name:
   EffectMaterial / Program Info Log: Fragment shader is not compiled. / ERROR:
   0:668: 'vTexCoord' : redefinition`. `EffectMaterial` is postprocessing's own
   composer material, so *the whole post pass* fails whenever `LensFlare` is
   mounted — which is exactly `night && headlights !== 'off'`, i.e. 6.3 right after
   LOW. The flares are now four additive sprites in the scene and the effect is out
   of the tier table, so no tier can mount a pass that cannot compile.
2. **A lost context took the whole React tree down.** `WEBGL_lose_context` →
   three throws `Cannot read properties of null (reading 'alpha')` from the render
   loop, and the Canvas unmounts (measured: `#root` empty, no HUD, no pause menu).
   The guard now parks R3F's frame loop (`setFrameloop('never')`) for the duration
   of the loss and restores it on `webglcontextrestored`.
3. **The cockpit's own numbers (BEFORE).** 390x844 driving state: world band
   **216 px (26 %)**, overlay coverage **39 %**; sticks are **140×140** each at
   y = 674 (bottom 814); the nav cluster is **374×143** at y = 104; LOW/HIGH is a
   **52×52** button at (12, 230) in the left rail. 412x915: 252 px (28 %) / 35 %.
   844x390: 183 px (47 %) / 37 %. Full table in `docs/cockpit/BEFORE.md`.

## Gates (after Phase 1)

| Gate | Baseline | Now |
|---|---|---|
| `npx vitest run` | 432/432, 43 files (12.3 s) | **458/458, 45 files** (5.0 s) — +16 diagnostics, +10 lighting |
| `npx tsc --noEmit` | 0 | **0** |
| `npm run build` | 4,037.41 kB / 1,329.78 kB gzip (5.35 s) | **4,021.58 kB / 1,325.18 kB gzip** (4.76 s) — the LensFlare effect left the bundle |
| `npx playwright test --workers=1` | 41 passed / 21 skipped / 0 failed (10.5 min) | **45 passed / 25 skipped / 0 failed** (13.6 min) — +2 never-black sweeps, +2 `test.fixme` skips, +1 inventory skip, +21 duplicated viewport skips as before |

## DECISIONS

1. **The diagnostics ship off by default.** The GPU row, the dark-frame row and
   the shader row are queued through `DriveSync.noteEvent` (the batched uploader:
   one POST per 10 s, deduped), so they cost a row each and never a request each.
   The live board is `?diag=1` only; nothing else reads it.
2. **The dark-frame threshold is 0.012 mean luminance, held 3 s, sampled every
   2 s.** A night frame under a lit sky reads 0.02–0.06, so the floor sits below
   the dimmest honest frame rather than at "looks dark to me". A black render is
   0.000 exactly, which is what makes the assertion falsifiable.
3. **The cockpit inventory is an opt-in spec** (`COCKPIT_INVENTORY=1`) because it
   writes `docs/cockpit/**`; a normal gate run must not modify the tree.
4. **The never-black sweep measures the app's own detector**, not a screenshot
   average: one readback path, so the test and the phone's own row cannot disagree
   about what "black" means.

## NEEDS_HUMAN

(none yet)

## BLOCKED

1. **A forced WebGL context loss still unmounts the React tree.** Reproduced with
   `WEBGL_lose_context.loseContext()` in headless Chromium, twice:
   - `#root` is empty afterwards — no HUD, no pause menu, no canvas;
   - the store *did* get the toast (`toast: "Restarting view…"`), so the guard ran;
   - three throws `Cannot read properties of null (reading 'alpha')` from the
     render loop, once per frame it manages to run.
   What was tried: `e.preventDefault()` on the loss (already there), a
   `client.context_lost` row with the scene id, the on-screen chip, parking R3F's
   frame loop (`setFrameloop('never')`) for the duration, and a 5 s
   `gl.forceContextRestore()` retry. The loop parking did not stop the throw — the
   next step is an error boundary around `<Canvas>` (so the cockpit survives a 3D
   failure) plus finding which component reads context attributes off a dead
   context. `e2e/never-black.spec.ts` marks the case `test.fixme` with this text,
   so the gate stays honest and the failure stays visible.
2. **HIGH measures darker than OFF in the road band** (6.2 sunset: 0.081 → 0.071;
   6.3 night: 0.043 → 0.036) while being clearly a different frame. The cause is
   not measured: the cone narrows at HIGH (`angle` 0.62 → 0.40) and the car moves
   between the two readbacks. The test asserts "different", which is the bug that
   was reported ("LOW changed nothing" measured exactly 0.0000 difference before
   the scene hour was fixed).

## REPORT

### Per phase

| Phase | State | Commits |
|---|---|---|
| 0.1 branch + RUNLOG | DONE | `ecd7823` |
| 0.2 baseline gates | DONE (no source change; recorded in “Gates”) | — |
| 0.3 cockpit inventory | DONE | `f69d3eb` |
| 1.1 diagnostics | DONE | `89a5984` |
| 1.2 sky + light floor + fog ceiling | DONE | `a9132ea` |
| 1.3 headlights + scene hour + flares | DONE | `1e791af` |
| 1.4 never-black e2e + guard | DONE (loss case BLOCKED) | `3f5dcc6` |
| 2.x–6.x | TODO (nothing started) | — |

### What the diagnostics say about the black screen

Reproduced under emulation, twice, with two separate causes:

1. **`LensFlare`'s shader does not compile** against three 0.183 —
   `Shader Error 0 - VALIDATE_STATUS false`, `Material Name: EffectMaterial`,
   `'vTexCoord' : redefinition`. `EffectMaterial` is postprocessing's composer
   material, so the whole post pass dies. It mounts exactly when a night scene has
   the lights on (6.3 after LOW). Replaced with in-scene additive sprites; the
   effect is out of the tier table.
2. **6.2/6.3 entered as `timeOfDay='day'`**, so spots, beam, flares and sky were
   all gated off — pressing LOW did nothing because the world thought it was noon.
   `quietroads/sceneLight.ts` sets the hour from the scene, checked against the act
   files' own `background` keys.

Lighting changes: gradient sky background per hour (uncullable), light floor
0.14/0.10/0.06 for the three scene-wide lights, fog density clamped for 85 %
road visibility at 80 m, spots visible only when the stalk is on and LOW/HIGH
distinct in intensity/distance/angle.

### Numbers

- Tier rules: unchanged this pass (Phase 2 owns them) — DPR ≤ 1.5, low tier 1.0,
  effect table low/mid/high.
- LODs: not produced (Phase 2.2 TODO). Beetle GLB still 11 MB.
- First-load: **4,021.58 kB / 1,325.18 kB gzip** (was 4,037.41 / 1,329.78) — the
  LensFlare shaders left. Time to first frame: not measured (Phase 2.4 owns it).
- Cockpit budgets before (after = Phase 3): 390x844 world band **216 px (26 %)**,
  coverage **39 %**; 412x915 252 px (28 %) / 35 %; 844x390 183 px (47 %) / 37 %.
- Removed UI: none yet (Phase 3.8). `docs/cockpit/BEFORE.md` lists every layer.
- Screenshots: `docs/cockpit/before/portrait-390x844.png`,
  `android-412x915.png`, `landscape-844x390.png`.
- Tilt: not implemented (Phase 4).

### Gates, honestly

Three full-suite runs after Phase 1, and the count they gave:

| Run | Result | What happened |
|---|---|---|
| 1 | 43 passed / 25 skipped / **2 failed** (13.5 min) | both never-black sweeps: `6.2: the scene started — Received: 5.3` (a reloaded page resumed the campaign from localStorage and `startAct` fought it). Fixed: `bootScene` clears storage on every navigation and waits 40 s for the scene id |
| 2 | 44 passed / 25 skipped / **1 failed** (19.5 min) | `bridge.spec.ts:425` (440x956 crossing) timed out at 420 s waiting for `[data-gust-side]` — desktop project |
| 3 | 44 passed / 25 skipped / **1 failed** (13.1 min) | the same case, mobile project this time; it passed in the desktop project **of the same run**, and alone in 1.1 min (worst offset 1.77 m, `reached true at x=800`) |
| 4 | **45 passed / 25 skipped / 0 failed** (13.6 min) | green after the light-stays-mounted fix — this is the gate |

The 440x956 crossing case is long (a full span at 40 mph) and load-sensitive. It
was measured before and after the night-scene change and it is slower now: 6.3 runs
at night, which adds two spot lights, a large additive beam plane and four sprites
to every frame. One of those changes was avoidable — toggling `spotLight.visible`
makes three rebuild every material program in the scene (its programs are keyed on
the visible light count), so the lights now stay mounted and carry the state in
their intensity instead. The gate is recorded with the measured flake rather than
rounded up: the branch is merged only when a full run is green.


### Final gates

| Gate | Baseline | Final |
|---|---|---|
| vitest | 432/432, 43 files | **458/458, 45 files** |
| tsc | 0 | **0** |
| build | 4,037.41 kB / 1,329.78 kB gzip | **4,021.58 kB / 1,325.18 kB gzip** |
| playwright | 41 passed / 21 skipped / 0 failed | filled in below when the run ends |

