# Candidate Ribbon plates — NOT PROMOTED

Claude locked three NEW plate briefs on 2026-09-12. This PR is generate-only. **Muted-read pending.** Do not overwrite live `refs/ref_ribbon_deck.png`, `refs/ref_ribbon_rig.png`, or `refs/ref_ribbon_workzone.png` (those files do not exist yet and must stay absent until PASS). Do not wire any of these into `pack/09_REF_MAP.json`, `pack/03_IMAGE_COMPILER_PROMPT.md`, or `scripts/compile-prompt.js`.

Pack rule 4: plates travel in their own PR. No card art. No Act I–III. No seed. No live LOCKS promote — take/sha stay blank.

## Serves (after promote — not this PR)

| Plate | Cards |
|---|---|
| `ref_ribbon_deck` | V-002, V-003, V-004, V-005, V-012. V-013 depends on this shoulder width. |
| `ref_ribbon_rig` | V-006, V-007 (scale / blind-spot; must feel able to push a Beetle) |
| `ref_ribbon_workzone` | V-008, V-009 (shoulder / emergency) |

## Pick for muted-read

| Plate | Role | File | Take | sha256 |
|---|---|---|---|---|
| deck | **Closest** | `refs/ref_ribbon_deck_candidate.png` | 2 | `069a7dc3a7d9fa5effa9d31371454b5e97f8561888c29c84b4bfe731298152c0` |
| deck | **Runner-up** | `refs/ref_ribbon_deck_candidate_runnerup.png` | 4 | `889a6d98409b4992eb4fee3c18421ed4934ead494b9c8b9c15334365ff7d823c` |
| rig | **Closest** | `refs/ref_ribbon_rig_candidate.png` | 1 | `939b0c29e60d52c0945d7dd1abcf6eebbf43c0b8dcc3c1b0493eeb39b890148e` |
| rig | **Runner-up** | `refs/ref_ribbon_rig_candidate_runnerup.png` | 2 | `a674de7f9992d5a0ee4829e2008a8aa58772b0f1fc567d60054aac31e14de8cb` |
| workzone | **Closest** | `refs/ref_ribbon_workzone_candidate.png` | 1 | `4dc1d0b211005eda622fa53cb2ea9b43b76ff1a8e9b3f6caf93798e65f588f90` |
| workzone | **Runner-up** | `refs/ref_ribbon_workzone_candidate_runnerup.png` | 6 | `840a59e60ceb3eac0421d9867e9b7cc3cba5baed14a152ea4575029f54af70b1` |

Variants: `refs/candidates/ribbon-{deck,rig,workzone}-take-1.png` … `take-8.png`. Extra probes: `ribbon-deck-b-take-1.png`, `ribbon-workzone-b-take-1.png`. Prompts: `refs/candidates/ribbon-*.prompt.txt`. All takes 16:9. No lock attachments (location plates; attaching Act IV stills would bleed card subjects).

Cone style was read from seeded stills, not attached: II-023 / II-013 / II-003 / IV-009 (tall MUTCD orange + white collar). World grade from IV-026 / IV-007 / IV-011 (wet, overcast, brick, no warm cast). `ref_hov_median_diamond.png` is a **fail example** — legible city names on green guide signs.

## Takes — deck

| Take | Call | Notes |
|---|---|---|
| 1 | keep | 3 lanes, blank gantry, city drop-off, period pair. Shoulder tight. |
| 2 | **closest** | Cleanest 3-lane + four blank panels + brick city below. Period sedan/pickup. Unnamed corridor holds. |
| 3 | keep | Same class; sedan a hair newer. |
| 4 | **runner-up** | 3 lanes, blank gantry, more city lights receding. Shoulder still tight. |
| 5 | discard | Open car door invented; 3-lane weaker. |
| 6 | discard | Hood crop is true driver-eye and shoulder is wide, but only 2 lanes + double yellow. |
| 7 | discard | 2 lanes + double yellow. |
| 8 | discard | Best wet sheen and widest shoulder; 2 lanes + double yellow. |
| b-1 | discard | Wide shoulder + blank gantry; 2 lanes + double yellow. Same miss as 6–8. |

## Takes — rig

| Take | Call | Notes |
|---|---|---|
| 1 | **closest** | Period conventional cab, rust, west-coast mirrors, plain trailer, wet spray, hatchback scale — rig can shove that car. Deck-level 3/4, not worm's-eye. |
| 2 | **runner-up** | Same cab class; sedan scale on the same plane. Slightly more frontal. |
| 3 | keep | Same family; scale car smaller/farther. |
| 4 | keep | More nose-on; still not hero-low. |
| 5 | keep | Same family. |
| 6 | keep | Same family; blank gantry in frame. |
| 7 | keep | Strong wet; hatchback far. |
| 8 | keep | Period COE instead of conventional — valid aging, weaker as the scale lock. |

## Takes — workzone

| Take | Call | Notes |
|---|---|---|
| 1 | **closest** | True MUTCD orange + white-collar cones matching Act II/IV rain stills. Workers, barrels, blank diamond, city below, 3 lanes. |
| 2 | keep | Same cone language; barrels at head. |
| 3 | keep | Portable concrete barrier + barrel. |
| 4 | keep | 4-lane deck match; barrier. |
| 5 | keep | Same family. |
| 6 | **runner-up** | Three workers, more city, 3-lane, barrel + barrier. |
| 7 | keep | Fewer cones; 2-lane. |
| 8 | keep | Barrier + barrel; wet. |
| b-1 | discard | Cones hug the barrier — shoulder line, not a lane closure. |

## Residuals vs pre-generation gate

Hard gates that **hold** on the three closest + three runners: no legible route/exit/city; no snow/ice/chain signage; no sun / no warm cast; wet surface; no current-model hero fleet; MUTCD orange not desaturated; no posterized flat-color.

Still on the picks:

- **Deck take 2 / 4:** right shoulder is present (solid white to Jersey) but not a full emergency-lane width. Takes that won width (6, 8, b-1) lost the ≥3-lane one-direction read (double yellow / two-lane). Camera is standing-in-the-lane more than seated hood-line. Gantry panels are blank white rectangles — weathered-illegible, not peeling green.
- **Rig take 1 / 2:** trailer sides are clean-plain rather than heavily weathered; cab aging reads. Scale car is a 1990s compact, not a Beetle (correct — do not lock a wrong Menace into a location plate). Slight CGI smoothness, same class as other locks.
- **Workzone take 1 / 6:** cone **style** matches the rain stills; the **taper** reads as a longitudinal channelizing line along the skip-dash, not a MUTCD diagonal pinch from the shoulder. Portable barrier is thin or missing on take 1 (barrels carry the head). One more regen wave if Claude wants the diagonal.

Muted-read must teach, with text covered:

1. Elevated wet multi-lane deck, city below a concrete barrier, unnamed corridor (blank gantry), a usable right shoulder.
2. Period-aged full tractor-trailer with visible mirrors, towering a passenger car.
3. True-orange cone closure with workers on a wet deck.

## LOCKS

`refs/LOCKS.md` WAVE note only. Take/sha blank. Candidates are **not** live refs.
