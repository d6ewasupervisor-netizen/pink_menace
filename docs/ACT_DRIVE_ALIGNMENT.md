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
| III | Central | deac — the Ledger | Deac's cargo | *(none dedicated)* | commercial run in a box truck on Central | ❌ |
| IV | The Core | ali — the Menace | Relay kit | `4.1`–`4.3` | the forty-question licensing gate | ❌ (exam/shop, not a vehicle challenge) |
| V | The Ribbon | ali — the Menace | Relay kit | `3.1`–`3.5`, `5.1`–`5.3` | highway merge + mountain grade / chain-up | ❌ |
| VI | The Backcountry | ali — the Menace | Clearance clipboard | `6.1`–`7.3` | rural straight, bridge, passive crossing | ❌ |
| VII | The Dark Hours | — | herd | `8.1`–`8.3` (Spokane epilogue) | stays closed | ❌ |

## Scene → act

Drive scenes map to the **dominant** card act they carry (see
`actChallenges.ts` `SCENE_ACT`). The one deliberate exception worth keeping in
view:

- `3.1` "Briefing" opens on Deac (borrowing II-006 / II-012) but the leg that
  follows is I-90 Eastbound **in the Menace**, which is Act V "The Ribbon", not
  Act III "Central". Act III has **no dedicated drive scene today** — its cards
  (III-007, III-016, III-020) are borrow-woven into `3.2` and `6.2`.

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

2. **Act III — build the Ledger challenge.** New ego vehicle (cutaway shuttle,
   no rear window) run on a Central corridor. This is the act's own unique
   challenge and the largest missing piece; it should reuse the vehicle observer
   with a swapped length/width/turn profile rather than the Beetle. Mirror sweep
   is the graded skill (III-003 "Sweep Before You Change", III-005 "The Van You
   Cannot See").

3. **Act IV — make the exam the challenge.** `4.2` "Forty Questions" is the
   study `exam` scene (already exists). Close the loop by gating the relay-kit
   beat on `exam.pass`, then hand to the Act V highway challenge.

4. **Act V — build the highway.** I-90 Eastbound is dialogued but not simulated;
   the game currently needs a highway world mode + merge/ramp grading (V-001,
   V-003, V-005, V-008, V-010, V-011, V-012) and the `5.2` chain-up area.

5. **Act VI — build the backcountry.** Rural straight/soft shoulder, Vantage
   bridge, and the passive railroad crossing (VI-009 "Crossbuck and Nothing
   Else", VI-004/VI-011 soft-shoulder ledger). Reuse the Kent map approach with
   a rural road generator + rail zone.

Act VII stays closed — the herd lives on the pass and the drive should not free it.

## Wiring that is already in place

- `actForScene` / `actForMission` / `challengeForAct` (registry).
- `QuietRoads` bridge tracks `currentAct` on `scene_started` and on mission
  start, emits `act.enter` telemetry, and exposes `currentChallenge`.
- `MainMenu` reads the registry so the drive greets the player by the card act
  ("ACT I · THE LOT"), not an internal scene number.