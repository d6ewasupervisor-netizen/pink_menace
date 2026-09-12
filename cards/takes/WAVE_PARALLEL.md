# Act IV parallel stills — IV-018 / 009 / 010 / 029

Relay turn f57ec0a0. Repo main. Not seeded. No Act I–III. No Encore exterior card stills.
Card JSON is the sole brief authority. Plate / LOCKS.md changes are **not** in this PR.

| Card | Lesson (`read`) | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-018** | both cats are on the seat; the speedometer reads 0 | `POV_COCKPIT` | TBD | TBD |
| **IV-009** | the PA switch is still off; the block ahead is a cone pinch, not a dying street | `POV_COCKPIT` | TBD | TBD |
| **IV-010** | both in-ears are out; the taped schedule is on the door behind her | `POV_PORTRAIT` | TBD | TBD |
| **IV-029** | both in-ears are out; the PA switch behind her is still off | `POV_PORTRAIT` | TBD | TBD |

Takes land at `cards/takes/IV-0NN-take-N.png` after generation (this file updates with picks).

## Driver token (IV-009) — confirmed before compile

`cards/IV-009.json` `"driver": "yuna"`. Continuity: `encore_cockpit` only.
Encore interior → live Y4 b-take-2 `ref_encore_cockpit.png` (PR #122) attached at generate time.
Menace plow plate (PR #121) not attached. No Encore exterior compiled.

## IV-018 plates — attached vs held

JSON brief (PR #22): cats **on the passenger seat**, `no carrier in frame`.
First pair frame since I-003. Keystone, both cats.

Live plates inspected, **not attached**:

- `refs/ref_carrier.png` — both cats already inside the grate. Would contradict `no carrier in frame`.
- `refs/ref_cat_ginger.png` / `refs/ref_cat_mackerel.png` — in-carrier grate crops. Mesh is baked in. JSON has cats **outside** the carrier; attaching them ghosts mesh onto the face.

Studio refs `ref_gracie.jpg` / `ref_mya.jpg` attached as appearance authority.
Live Menace cabin `ref_menace_cabin.png` (PR #75) attached at generate time. Poisoned `ref_cockpit.jpg` not attached.

`refs/LOCKS.md` on **main** does **not** yet record (a) studio-wins / in-carrier-only precedence or (b) which cat is Mya. Those lines are on PR #118. **Not bundled here.** Plate/LOCKS changes need their own PR (#110 carrier, #117 crops, #118 LOCKS).

## Carry-forward A — IV-016 take-17 yellow curb

**No reshoot. No JSON conflict.**

JSON (`cards/IV-016.json` on PR #109 / seed #111):

- Lesson / teaching_target: Deac returns parked; Mya on the dash **because the Ledger is still**; he does not get out.
- Read: `the bus is parked; the cat is loafed on the dash; the door is shut`
- Foreground: `wet downtown curb and a strip of paint`
- Geometry: parked at the right curb. No hydrant, no yellow zone, no no-parking, no legality option.

The card never teaches parking legality. A painted yellow strip at the curb is unused staging next to “a strip of paint,” not an argument the JSON makes. Leave take-17. Do not regen for curb color.

## Carry-forward B — IV-007 PR #114 vs seeded take-25

**Take-30 is the same composition family as seeded take-25. Take-28 is not. #114 is safe to merge only if take-30 stays the pick.**

Diff, pixels:

| | take-25 (seeded) | take-28 (#114) | take-30 (#114 closest) |
|---|---|---|---|
| Poles | two: TRANSIT ONLY on a **left stub**, stack+signal on the **right** pole | **one** pole, all three faces + signal stacked | two: TRANSIT ONLY on a **left stub**, stack+signal on the **right** pole |
| Camera | mid-block, foggy empty approach, stop line low | tight object crop, building right | mid-block, brick downtown, stop line low |
| Weather | wet overcast, heavy fog | wet overcast, rain beads | wet overcast, rain beads, less fog |

Take-30 vs take-25: same two-pole layout, same empty wet approach, same red signal, same stop line. Residuals are weather/grade (less fog, more brick, TRANSIT ONLY larger) — that is a weather regen, not a silent reframe.

Take-28 vs take-25: single-pole tight crop. Materially different composition. Do not treat 28 as the weather-regen winner.

Letter-doubling persists on all three (`TRANSITONLYLY` / `NOTURNONREDD`). Not in this batch’s scope.

**Verdict:** #114 may merge with take-30 as closest. If a later seed picks take-28, that is a reframe and needs a fix first.
