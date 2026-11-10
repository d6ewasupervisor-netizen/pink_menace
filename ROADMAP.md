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
| Gust drift, no input, 40 mph (assist) | **0.000 m** (no force existed) | 1.0–1.5 m, and the correction cancels it |
| Cards whose comment names a beat the code doesn't listen to | 1 found (III-013) | 0 |
| Stop/gap/yield grade lock | already fires (baseline.json) | a scene passes only when its grade fired |

**On the old FPS row.** The 2026-10-01 run recorded "30 / 29.6", and it was not a
frame rate — it was the sample window's own 30 Hz clock. Those numbers are
withdrawn. **No headed browser ran in this pass**, so the FPS rows above are
deliberately empty rather than filled with a guess.

## Current pass — the portrait rebuild, Phase 1 (2026-11-10)

Branch `drive/portrait-rebuild`; `RUNLOG.md` is the item table. Phase 0 (baseline +
measured cockpit inventory) and Phase 1 (never black) are done:

- **The black 3D view in 6.3 had two causes, both reproduced headless.** The high
  tier's `LensFlare` effect fails to compile against three 0.183 (`EffectMaterial`,
  `'vTexCoord' : redefinition`) and takes the whole post pass with it — the glow is
  in-scene sprites now. And 6.2/6.3 were entering with `timeOfDay = 'day'`, so every
  night gate (spots, beam, flares, sky) was off: `quietroads/sceneLight.ts` sets the
  hour from the scene, with the act files' `background` keys as the check.
- **The phone can now say what it sees**: `client.gpu` once, `client.frame_dark`
  once per dark episode (16x16 readback, 0.012 floor, 3 s hold), `client.shader_error`
  with the material, `client.context_lost` / `_restored` with the scene id, and
  `?diag=1` for the live board. All through the batched uploader.
- **The sky cannot be culled** (gradient `scene.background` per hour), the scene-wide
  lights have a floor, and the fog density is clamped so the road at 80 m survives.
- **Measured cockpit BEFORE** (`docs/cockpit/BEFORE.md`): 390x844 world band 26 %,
  overlay coverage 39 %, sticks 140 px, nav cluster 143 px tall. Phase 3's target is
  a world band ≥ 55 % with 110–120 px sticks.

**Still open here:** a forced WebGL context loss still unmounts the React tree
(three reads a null context attribute); HIGH beams are a different frame from OFF
but not measurably brighter in the readback. Both are in `RUNLOG.md` BLOCKED.

**Phase 2 (done):** the phone now downloads what it drives. 2.1 picks the tier from the
device (`utils/qualityPick.ts`) with `?tier=` and a saved choice pinning it; 2.2 built
`drive/scripts/build-lods.mjs` and the Beetle twin (`vw_beetle.glb` 10.55 MB / 64,188
tris → `vw_beetle.mobile.glb` 1.01 MB / 36,658 tris, material and node names preserved);
2.3 split the entry chunk (4,023.67 kB / 1,326.06 kB gzip → 317.50 kB shell + 988.22 kB
3D + 18.56 kB post, the legacy highway world lazy, only the car you are in preloaded)
**and moved the car into its own Suspense boundary**, because the first frame had been
waiting for a 1 MB model; 2.4 measures it: `e2e/first-load.spec.ts` serves the built app
under Slow 4G + 4x CPU and holds the first frame to **10 s** (measured 7.556–8.889 s
across quiet and loaded machines), with no later act and no highway chunk on the wire.
**8 s was tried and is not reachable on this machine — the quiet-to-loaded spread alone
is over a second.** See `RUNLOG.md` DECISIONS 8.

**Next performance item, if 8 s is ever required:** the shell still carries 413 kB of
story JSON (`cards.json` + three question banks, ~110 kB gzipped) that the first frame
never needs. Moving the deck and bank behind the first card is worth ~0.5 s of download
plus ~0.2 s of parse on the throttled profile. It is a story-bridge refactor — the deck
and bank are built in `QuietRoadsBridge`'s constructor — so it belongs with Phase 3/4
work rather than a budget change.

**Next: Phase 3 — the portrait cockpit.** The measured BEFORE (world band 26 % at
390x844, overlay 39 %, 140 px sticks) is in `docs/cockpit/BEFORE.md`; the target is a
48 px top rail, a 6 px noise bar, a 56 px nav strip with the assist as a tag, a 40 px
objective that hides, a world band ≥ 55 %, 110–120 px corner sticks and 44 px
lights/horn — with the minimap, the clock and the HP/FUEL bars gone from the
always-on HUD.



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
- **[tests] `vitest run` green** — 265 tests, 29 files (stop/gap/yield, follow-rule,
  card cues on the sim bus, **act-boundary chain**, **Deac's drive script + the
  witness gate on his beats**, exam gate, retest week, alloc identity, CCD, quality
  tiers + the 30 Hz recovery, scene-pass draw calls, instancing, accessibility,
  debrief incl. the Act IV week, bundle split, spoken lines, bench; plus the
  **Act VII deck's citations and numbers**, the **road-home clock**, the **4.2/2.2
  licensing thread** and the **seed's do-not-seed contract**).

## Current pass — the flood, the minute, the thumb (2026-11-05)

From a HAR of scene 6.3 on an iPhone (440x956).

- **The bridge reports crossings, not frames.** `speed.over:45` fired every frame
  over the limit (1,693 rows in 23 s) and `steer.overcorrect` fired every frame
  the stick was pinned; both are edge-triggered now (speed re-arms 2 mph under,
  the yank has to be held and reports once per 2 s), `plow.used` is one row per
  contact episode, and the client cannot POST per row: `systems/telemetryBatch.ts`
  dedupes into `data.repeats`, caps a batch at 50 rows, and lets one POST through
  per 10 s (urgent flushes at most one per 5 s). Telemetry left `qrHud`, so a
  flood is one `Map` update per event. `client.stall` records the page's
  visibility, so a locked phone no longer reads as a freeze.
  `test/telemetry.test.ts` (10), `test/bridge-telemetry.test.ts` (11).
- **The engine-off minute is a screen you cannot touch.**
  `quietroads/handsoff.ts` + `HandsOffOverlay.tsx`: ENGINE OFF · HANDS OFF, a
  60 s ring, the 15/30/45/60 marks and the scene's own line, in the cockpit body
  band; every driving input is locked (`setDriveInputLocked`), the sticks are
  hidden, the dialogue box stands down, and `ScreenWakeKeeper` holds the screen
  awake (release on exit, re-request on `visibilitychange`, silent where the API
  is missing). The countdown is the sim's own clock, so a pause or a locked phone
  holds it. Swept: every other `wait_for` is a wait the player acts on or
  self-resolves in 2.5 s, so only the bridge is converted.
  `test/handsoff.test.ts` (16).
- **Wind assist for a thumb.** `quietroads/assist.ts`, on touch and keyboard
  only: the car holds 40 mph by itself (brake wins, throttle cannot push past),
  steering is 0.55 of the stick with a 0.04 dead zone, both grading windows are
  reachable by a thumb, a gust warns 0.9 s early with its side, and the HUD says
  `WIND ASSIST · 40`. The pedal is a curve everywhere now (`^1.6` instead of
  `^0.95`): 25/50/75/100 % travel is 7/29/60/100 % throttle.
  `test/windassist.test.ts` (11). **The gust had no force** — closed in the next
  entry.
- **`e2e/bridge.spec.ts`:** 6.3 from VII-006 to 7.1 on the real touch stick, a
  20 s POST budget (≤ 3, measured 2), and the panel at 440x956. It found a soft
  lock: the wait clock stopped at 60 s so the panel never released. The
  Playwright test clock was measured at 90,073 ms for 66 s of game — the wait is
  real time.

### The gust, 2026-11-08 — a force, a grade, a slot

- **A gust that pushes.** `quietroads/wind.ts`: warn 0.9 s → ramp 0.3 → hold 1.2 →
  ramp out 0.4, with `side` the side the wind comes FROM. `VehicleController`
  applies it as lateral velocity on the body (after the tyres' damping, minus last
  step's push), a heading offset that returns to zero, and a roll the camera leans
  on. Measured at 40 mph: **0.000 m → −1.35 m** (assist) / **−1.84 m** (pad), the
  heading back to 0.00°. Done.
- **The grades read the car.** `steer.into_wind` = input into the wind, small, and
  the drift inside ±0.5 m for 0.3 s; `steer.overcorrect` = the correction carrying
  the car past centre toward the wind side. Doing nothing drifts and gets Ali's
  gust line. Done.
- **The cue names the action.** `GUST · steer left/right` on the side the wind
  comes from, streaks that run while the push is on, a buzz where the platform has
  one. Done.
- **The chip has its own slot** at 390x844 / 440x956 / 844x390 / 1280x800, measured
  by `e2e/cockpit-layout.spec.ts` against every other box. Done.
- **The hold could not pull away from rest** (the don't-creep guard ate it every
  step) **and a teleport dropped it**. Both fixed. Done.
- Still open: the assist covers `vantage_bridge_crossing` only;
  `bridge_after_sign_*` keeps the plain pedal at the 25 limit.

## Previous pass — the tab, the credits, the line endings (2026-11-04)

- **Tuna's front is a debt.** The soft-lock exit was cheaper than buying: no
  points, same chains. `quietroads/debt.ts` (pure `settleDebt`) plus one call
  site in `qrStore.addVar` — the only writer of a Trade Point — takes
  `min(award, debt)` out of the next pay and clears the tab. `2.8.front_chains`
  writes `tuna_debt = 150` and Tuna adds "You'll owe me. Deac'll know.";
  `5.2.debt_line` has Deac name it at the pay that settles it, reached by a
  branch on `tuna_debt_paid` (never by an event — a tick-fired trigger is
  dropped behind a line or interrupts one). The broke player still leaves with
  the chains. `test/shop.test.ts` 9 → 17, `e2e/shop.spec.ts` +1.
- **The CC-BY models are credited on screen.** `quietroads/credits.ts` +
  `CreditsScreen.tsx`, opened by the `credits` unlock at `8.3.end` (an unlock
  nothing showed until now) and from the end-of-run screen: VW Beetle /
  LucasPresoto and Low Poly Cactus / akaN0ob with title, author, source and the
  CC-BY-4.0 deed, plus a Kenney line. `test/credits.test.ts` (4) pins the screen
  to `CREDITS.md`; `e2e/credits.spec.ts` reads the DOM against that file.
- **One line ending per type.** `.gitattributes` names the measured majority
  (json/md/txt/html/mts/mjs CRLF; ts/tsx/js/css/py/sql/svg LF; png/glb/webp/jpg/
  gif/ico/pdf binary), then `git add --renormalize .` in its own commit: 73
  files, all of it CRs, `--ignore-cr-at-eol` empty. `git ls-files --eol` is
  `i/lf` everywhere and `w/` follows the rules.

## Previous pass — the shop counter, the real atlases, the measured skips (2026-11-04)

- **The shop counter is ported** (`quietroads/shop.ts` + `ShopCounter.tsx`). The
  deadlock guard had allow-listed `shop.buy:*` / `shop.cant_afford` as "not on
  any forward path"; they were the chain-up loop. 5.2 without chains →
  `5.2.block` → 2.8, and with no counter the only exit was
  `2.8.end_reblocked` → 5.1 → `5.2.block` again, forever. 7.2's muffler and LED
  lights were unreachable, so `8.1.lights_branch` never took `lights_a`,
  `8.1.cluster` never took `cluster_src`, and 2.6/2.7's `has_gracie_toy` /
  `has_sori_card` could not be set. Every buy node now also grants the item its
  downstream `has_item` checks read (2.8's muffler and LEDs, 7.2's both, all four
  2.7 buys). Tuna fronts the chains when the loop is open and the set is out of
  reach. `UNWIRED` is down to the tow strap. `test/shop.test.ts` (9) +
  `e2e/shop.spec.ts` (3). 360/360 vitest.
- **The kits' own colormaps** — the four atlases are the packs' files now (Car
  Kit 3.0, City Kit (Roads) 2.0, City Kit (Suburban) 2.0, Modular Buildings 2.1),
  pinned by SHA-256 in `test/model-textures.test.ts` and recorded with their
  download URLs in `drive/public/models/CREDITS.md`. The three modular samples
  moved to `buildings-modular/` because that pack ships a different atlas.
  `build:colormaps` is the fallback and refuses to overwrite a present atlas.
  `e2e/smoke.spec.ts` +1 holds the wire (200 + image/png + PNG signature).
- **The 17 skips are measured** — `e2e/skipDuplicate.ts` skips a project only
  when its viewport equals the one the spec drives, and says so in the report;
  `cockpit-layout.spec.ts` no longer skips at all (the overlap rule runs on the
  phone profile too, only the DPR-scaled pixel baseline stays in the 1x project).
  Headless `--workers=1`: 48 tests, 31 passed / 17 skipped / 0 failed, 5.8 min.

## Previous pass — the summit deadlock, the texture, the saved names (2026-11-03)

- **5.3 could not be finished** — its `5.3.hold` waited on `cutscene.summit_clear`
  and nothing emitted it, so the cockpit (correctly) stayed down and every reload
  resumed into the same parked car. Fixed by one rule
  (`quietroads/waitWatch.ts`): a `cutscene.*` wait with no mission behind it
  resolves after 2.5 s; any other stranded wait names itself after 8 s and offers a
  Continue control. `test/deadlock.test.ts` measures every emitter from the source
  and fails on an orphan wait/trigger; `test/fullchain.test.ts` may now only walk
  through events the game really emits. 3.4's `cutscene.gracie_yell` and 7.2's
  shop exit were orphans on the same walk. 345/345 vitest, 23/23 headless.
- **The world's texture** — the Kenney GLBs reference `Textures/colormap.png` that
  was never bundled, and the SPA fallback answered it with `index.html`. The atlas
  is generated from each GLB's own UVs (`npm run build:colormaps`) and checked by
  `test/model-textures.test.ts`; `/drive/models` and `/drive/assets` now 404, and
  the 404's order relative to the SPA fallback is pinned by the same test.
- **Saved names** — `placeholders` are canon code now, never saved state, so
  Grandma's note signs `— G.` and `GRANDMA_NAME` is `Grandma` on an old save too.
  Follow pass: the act files' own `meta.placeholders` could still override canon
  because `DialogueRunner.load` merged a file over the host, and four of them
  said `GRANDMA_INITIALS: "Grandma"`. `load()` now only seeds a name the host
  does not hold, the four files are corrected, and
  `test/placeholders.test.ts` (12) holds the inventory and the precedence.

## Next (in order)

1. **The 3.3 tow-strap QTE.** `qte.strap.start/success/fail` are the last
   allow-listed hooks; the tow path does not wait on them, so it is a beat, not a
   gate. Porting it empties `UNWIRED` and lets the guard drop the allow-list.
2. **The 11 MB `vw_beetle.glb`** downloads on every load (existing item).
3. The deck bundle is still not regenerated by the build (AUDIT §23).
4. The road tiles and building facades still use the procedural maps on purpose
   (lane markings + the wet-surface pass). If the art direction ever moves to the
   kits' own road tile, `getSharedRoadMaterial` and `setRoadSurfaceWetness` have
   to move with it.

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
- **The cockpit is a three-band grid (2026-10-31).** `cockpit/layout.ts` owns
  `top` (HUD/objective), `body` (3D + still + QTE) and `bottom`
  (dialogue/dock/sticks) per shape, plus a `compound` frame that stands the
  driving HUD down for cards, quizzes, debriefs and choices. The horn/lights rail
  moved out of the bottom band, the card's still got its own band above (or
  beside) the dock, the QTE prompt is centred in the body band at z 246, and the
  quiz root went from z 100 to 232. Overlaps: 3 → 0 at 390x844 and 844x390
  (headed Chromium, four states). 12 stored screenshots in
  `drive/e2e/cockpit-layout.spec.ts-snapshots/`, guarded by
  `drive/e2e/cockpit-layout.spec.ts` (no two interactive layer boxes may
  intersect; the still must sit clear of the dock and decode).
- **Next, from the grid.** A landscape-compact nav cluster (map only, ~96 px)
  would give the landscape middle its 100-odd pixels back (the driving body band
  there is only 19 px: 390 − 176 top − 195 bottom). The QTE prompt and the
  `HOLD THE BRAKE` copy should get a device read.
- **Who owns the cockpit is one rule (2026-11-01).** `quietroads/cockpit.ts`
  derives `showDrivingHud` from the surfaces that are open plus
  `qrHud.missionActive` (one writer: `QuietRoadsBridge.syncMission()`), so a
  phase left behind by a card can no longer hide the sticks and the dash — the
  5.2 stuck report. The bridge reconciles it every frame and `CockpitHUD` keeps a
  one-second watchdog. `drive/test/cockpit-hud.test.ts` (14) and
  `drive/e2e/cockpit-restore.spec.ts` (10, headed 390x844) hold it; the twelve
  layout screenshots are unchanged. Suite is **280/280** across 30 files.
- **Next, from the rule:** the drive has no card timer at all
  (`timeout_option_id`/`timeout_ms` are deck data the cockpit never reads), and a
  hazard card that never got a grade shows no CONTINUE — so a card can still
  trap a player on the card itself (AUDIT §20). That is the next bug in this
  family, and the fix belongs in `CardOverlay`/`DialogueRunner`, not in the
  cockpit. VII-008 in 8.1 also needs the parking gap driven before its card can
  be reached in a test.
- **The card clock is in the cockpit (2026-11-01).** The drive's deck copy now
  carries the 17 clocks (`cards.json`, 34 lines, no deletions), and
  `quietroads/cardTimeout.ts` + `useCardCountdown` + `CardOverlay` run them: the
  bar in the dock, the pause with the cockpit and the tab, the expiry picking
  `timeout_option_id` through the same `pick()` a tap takes, and CONTINUE after
  any resolution (including a card that never reached the ledger). 295/295
  vitest, tsc 0, playwright 20/20 **headless** (the three card frames of the
  layout baseline re-recorded headless). Suite is **295/295** across 31 files.
- **Next, from the clock:** the drive starts the clock when the card opens, where
  the card game waits 1 750 ms + 800 ms and pauses while the options are off
  screen — a device read decides whether the grace belongs in the cockpit
  (AUDIT §21). VII-008 in 8.1 still needs the parking gap driven before its card
  can be reached in a test.
- **The clock is the card game's clock, not the drive's (2026-11-01).** The grace
  and the gate AUDIT §21 left open are in: `CARD_GRACE_MS` 1 750 + `CARD_WIND_MS`
  800 (the card game's `armHazardWindow`), the bar hidden through the grace and
  full through the wind-up, and `CardCountdown.visible` holding the decision while
  the dock is scrolled away from the answers (`optionsInView`, the card game's
  `choiceDockInView`). `useCardCountdown` measures the answers against the dock on
  every tick, so a scroll costs nothing and a paused/hidden clock still spends
  nothing. `drive/test/cardTimeout.test.ts` (26) and `cockpit-restore`'s 5.2
  expiry (grace measured from the card opening, in the page) plus a new
  scrolled-out-of-view case hold it. Suite is **306/306** across 31 files.
- **Next, from the grace:** a beat card with a timeout id (`cards/*.json` carries
  none today) would arm a clock with no decision to answer — the overlay only runs
  the clock for graded cards, so that combination is untested by data. VII-008 in
  8.1 still needs the parking gap driven before its card can be reached in a test.
- **The deck copy cannot drift (2026-11-01).** `drive/src/quietroads/data/cards.json`
  is written by `scripts/export-drive-cards.js` from one field list
  (`scripts/drive-card-fields.js`) and checked against all 131 `cards/*.json` by
  `drive/test/deck-parity.test.ts` (5), which names the card and the field. The
  first run found `schedules_callback` missing on all 131 cards and `callback_of`
  missing on 8 (II-010, II-031, III-010, III-020, IV-012, VI-011, VII-007,
  VII-010); the re-export is 262 added lines, no deletions, no id touched. The
  JSON → Postgres path (`scripts/seed-cards.js`, what the card game actually reads)
  was checked the same way and carries every field. Suite is **311/311** across 32
  files.
- **Next, from the deck:** the build does not regenerate the bundle (the test
  catches a stale one; the build does not). `callback_of`/`schedules_callback` are
  now in the drive's copy and read by nothing yet.
- **5.2's chain-up is finishable (2026-10-31).** The QTE's pass window
  (`0.2 < brake < 0.85`) excluded the only brake a key or pad makes (`1.0`), and
  `brake > 0.92` fired the drop branch, so stopping the car fired the failure
  every 4 s and success was unreachable. Now: arrive (26 m disc or the pad, no
  heading), stop (≤ 1.5 m/s), hold any brake 1.6 s; three stage objectives in
  Deac's voice with the distance, plus a `HOLD THE BRAKE` cockpit prompt.
  `drive/test/chainup.test.ts` (5) drives the sim into the runner and lands on
  `5.2->5.3`; no chains still routes `5.2->2.8`. Suite **265/265**, 29 files.


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



