# ACT ↔ DRIVE ALIGNMENT

The card game (`/`) owns the story and the card canon (Acts I–VI, `cards/*.json`).
The drive (`/drive`, "Quiet Roads") re-enacts it in 3D. This doc is the working
map between the two, and the build order for closing the gaps.

The machine-readable registry is `drive/src/quietroads/actChallenges.ts`
(`ACT_CHALLENGES`, `actForScene`, `actForMission`, `challengeForAct`). Authors
edit that file — not the dialogue files — when the two surfaces drift.

## Canonical act table

| Act | Zone | Driver / ego | Cargo | Drive scenes | Driving challenge | Built |
|---|---|---|---|---|---|---|
| I | The Lot | ali — the Menace | — | `0.1`–`1.4b` | carport tutorial, DOL drive, parking, stealth interior, Gracie chase | ✅ |
| II | The Grid | ali — the Menace | Insulin, cold-packed | `2.1`–`2.8` | quiet city grid: pharmacy, Bea's dock, Priya's lane, Tuna's parallel, Jonah's four-way | ✅ |
| III | Central | deac — the Ledger | Deac's cargo | `2.5` | commercial run in a box truck on Central: stay right, signal, 3-second gap, merge | ✅ |
| IV | The Core | ali — the Menace | Relay kit | `4.1`–`4.3` | forty-question licensing gate; relay kit only on a pass | ✅ |
| V | The Ribbon | ali — the Menace | Relay kit | `3.1b`, `3.1`–`3.5`, `5.1`–`5.3` | on-ramp merge, Issaquah convoy, chain-up pull-out | ✅ |
| VI | The Backcountry | ali — the Menace | Clearance clipboard | `6.1b`, `6.1`–`7.3` | gravel run, roundabout, night straight, Vantage Bridge | ✅ |
| VII | The Dark Hours | — | herd | `8.1`–`8.3` (Spokane epilogue) | stays closed | ❌ |

## Scene → act

Drive scenes map to the **dominant** card act they carry (see
`actChallenges.ts` `SCENE_ACT`). The one deliberate exception worth keeping in
view:

- `3.1` "Briefing" opens on Deac (borrowing II-006 / II-012) but the leg that
  follows is I-90 Eastbound **in the Menace**, which is Act V "The Ribbon", not
  Act III "Central". Act III now has its own scene, `2.5` "Central — Deac's Cargo",
  inserted between the Jonah four-way (`2.4`) and the I-90 briefing (`3.1`).

## What "play the cards, then drive" means here

A card act is aligned when, in one play session, the student:

1. **Plays the act's cards** — every card of the act is either a `card` node in
   the act's dialogue scenes, or an in-world prompt (`CARD_FOR_TRIGGER` /
   sim zone) that fires while driving that act.
2. **Drives the act's challenge** — a `start_gameplay` mission in `Simulation.ts`
   that carries the act's objective and grades the act's skill.

Act I is the completed translation of that loop, and the worked example to copy:

```
0.1 Cold Open ──▶ 0.2 Carport (cards I-002/003/004, tutorial_carport)
             ──▶ 0.3 Radio (card I-001)
 1.1 The Drive (mission_dol_drive)
 1.2 Parking   (cards I-005/009, minigame_park_dol)
 1.3 Inside    (cards I-006/007/008/010, stealth_dol_interior, chase_dol_gracie)
 1.4 Aftermath (card I-011)  ·  1.4b Rumor Board (card I-012)
```

## Gaps (build order, one act at a time)

1. **Act II — the Grid run.** Shipped. Insulin (`mission_delivery_1_insulin` +
   `dropoff_pharmacy`), cat food (`mission_delivery_2_catfood` + Bea's door),
   radio parts (`mission_delivery_3_radio`), fuel filters (`mission_delivery_4_filters`),
   and the Jonah four-way (`mission_jonah_intersection`). Cards II-004/005/006/010/012/024/030
   ride those beats. Next act is III.

2. **Act III — Central (the Ledger).** Shipped. `mission_central_ledger` puts the
   player in a wider/longer ego on Central's three southbound lanes with a moving
   box-truck lead: stay right (`III-003`), signal every move (`III-006`), hold the
   three-second space (`III-009`), don't cross solid white (`III-008`), and take
   the lane-drop merge with a gap (`III-007`). Cards `III-002/003/004/006` open the
   scene. Remaining polish: swap the visible ego model from the Beetle to a box
   truck and retune stopping distance for the longer wheelbase.

3. **Act IV — the exam is the challenge.** Shipped. `study_terminal` is a
   10-question set the night before. `exam_40` is forty questions, 32 to pass.
   A pass stamps the permit, puts the relay kit in the car, and the existing
   `4.2` ending hands her to `5.1`. A fail (or standing up for good) leaves
   the kit and sends her through `4.3`, then back to the terminal.

4. **Act V — The Ribbon.** On-ramp, Issaquah convoy, and the chain-up pull-out
   (`chainup_qte`, scene `5.2`) are shipped. A steady brake mounts the chains; a
   hard stab drops the tensioner. Remaining polish: the visible ego is still the
   Beetle rather than a highway chassis.

5. **Act VI — The Backcountry.** Gravel run, the roundabout on that road
   (`VI-007/008`), the night straight (`straight_night_drive` and the rest-area
   park), and Vantage Bridge (wind, the sign, Gracie, engine-off wait) are
   shipped. Remaining: the `7.1` Ritzville escort is still dialogue only, and the
   visible ego is still the Beetle.

Act VII stays closed — the herd lives on the pass and the drive should not free it.

## Wiring that is already in place

- `actForScene` / `actForMission` / `challengeForAct` (registry).
- `QuietRoads` bridge tracks `currentAct` on `scene_started` and on mission
  start, emits `act.enter` telemetry, and exposes `currentChallenge`.
- `MainMenu` reads the registry so the drive greets the player by the card act
  ("ACT I · THE LOT"), not an internal scene number.