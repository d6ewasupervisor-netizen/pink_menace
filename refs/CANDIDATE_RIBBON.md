# Ribbon plates — deck + rig + workzone PROMOTED

Claude locked three NEW plate briefs on 2026-09-12. Candidates compiled on PR #149. Claude muted-read (image-review chat) then:

1. **`ref_ribbon_deck` — PASS promote take-4** (not take-2). Streetlight standards along the deck needed for V-013 dusk grade. Live: `refs/ref_ribbon_deck.png`. Token `ribbon_deck`.
2. **`ref_ribbon_rig` — PASS promote take-1** (not take-2). Period-aged, no legible livery, rain/spray, passenger car at right scale, mirrors visible for V-006. take-2 FAIL (car too far / hero angle / faint red markings). Live: `refs/ref_ribbon_rig.png`. Token `ribbon_rig`.
3. **`ref_ribbon_workzone` — PASS promote wave-C take-1.** Wave-A takes FAIL (longitudinal cone line). Wave-C take-2 **PASS** as runner — keep, do not attach. Live: `refs/ref_ribbon_workzone.png`. Token `ribbon_workzone`.

Pack rule 4: plates travel in their own PR. No card art. No Act I–III. No seed. Act V draft cards on #132 / #141 / #151 do not yet name these tokens; REF_MAP + compiler attachment map are wired so compile can consume them when those cards do.

## Promoted (live)

| Plate | Take | File | sha256 |
|---|---|---|---|
| deck | **4** | `refs/ref_ribbon_deck.png` | `889a6d98409b4992eb4fee3c18421ed4934ead494b9c8b9c15334365ff7d823c` |
| rig | **1** | `refs/ref_ribbon_rig.png` | `939b0c29e60d52c0945d7dd1abcf6eebbf43c0b8dcc3c1b0493eeb39b890148e` |
| workzone | **C-1** | `refs/ref_ribbon_workzone.png` | `bf9d9462be460ea6e655ca8596a5734cb624bd2cbeadb5932434c1eaeee116a6` |

Exact bytes of `refs/candidates/ribbon-deck-take-4.png`, `refs/candidates/ribbon-rig-take-1.png`, and `refs/candidates/ribbon-workzone-c-take-1.png`. Candidate closest/runner copies stay in the pool (deck closest remains take-2; Claude promoted the runner). Workzone runner is wave-C take-2.

## Serves

| Plate | Cards |
|---|---|
| `ref_ribbon_deck` | V-002, V-003, V-004, V-005, V-012. V-013 depends on this shoulder width. |
| `ref_ribbon_rig` | V-006, V-007 (scale / blind-spot; must feel able to push a Beetle) |
| `ref_ribbon_workzone` | V-008, V-009 (shoulder / emergency) |

## Pick for muted-read

Wave A (PR #149) closest/runner copies stay in `refs/candidates/` as `ribbon-{deck,rig,workzone}-take-N.png`. Live deck/rig/workzone are listed under Promoted.

| Plate | Role | File | Take | sha256 |
|---|---|---|---|---|
| deck | **PROMOTED** | `refs/ref_ribbon_deck.png` | 4 | `889a6d98409b4992eb4fee3c18421ed4934ead494b9c8b9c15334365ff7d823c` |
| deck | wave-A closest (not lock) | `refs/ref_ribbon_deck_candidate.png` | 2 | `069a7dc3a7d9fa5effa9d31371454b5e97f8561888c29c84b4bfe731298152c0` |
| rig | **PROMOTED** | `refs/ref_ribbon_rig.png` | 1 | `939b0c29e60d52c0945d7dd1abcf6eebbf43c0b8dcc3c1b0493eeb39b890148e` |
| rig | wave-A runner (FAIL) | `refs/ref_ribbon_rig_candidate_runnerup.png` | 2 | `a674de7f9992d5a0ee4829e2008a8aa58772b0f1fc567d60054aac31e14de8cb` |
| workzone C | **PROMOTED** | `refs/ref_ribbon_workzone.png` | c-1 | `bf9d9462be460ea6e655ca8596a5734cb624bd2cbeadb5932434c1eaeee116a6` |
| workzone C | closest copy (same bytes) | `refs/ref_ribbon_workzone_candidate.png` | c-1 | `bf9d9462be460ea6e655ca8596a5734cb624bd2cbeadb5932434c1eaeee116a6` |
| workzone C | **Runner-up PASS** | `refs/ref_ribbon_workzone_candidate_runnerup.png` | c-2 | `5750120efc39dfef2dc8347ed2eca5461cfe16cc8112467e85a98dd246521de1` |

Variants: `refs/candidates/ribbon-{deck,rig,workzone}-take-1.png` … `take-8.png`. Extra probes: `ribbon-deck-b-take-1.png`, `ribbon-workzone-b-take-1.png`. Wave C: `ribbon-workzone-c-take-1.png` … `take-8.png`. Prompts: `refs/candidates/ribbon-*.prompt.txt`. All takes 16:9.

Cone style was read from seeded stills, not attached: II-023 / II-013 / II-003 / IV-009 (tall MUTCD orange + white collar). World grade from IV-026 / IV-007 / IV-011 (wet, overcast, brick, no warm cast). `ref_hov_median_diamond.png` is a **fail example** — legible city names on green guide signs.

## Takes — deck

| Take | Call | Notes |
|---|---|---|
| 1 | keep | 3 lanes, blank gantry, city drop-off, period pair. Shoulder tight. |
| 2 | wave-A closest | Cleanest 3-lane + four blank panels + brick city below. Period sedan/pickup. Unnamed corridor holds. Claude did **not** promote — missing streetlight run. |
| 3 | keep | Same class; sedan a hair newer. |
| 4 | **PROMOTED** | 3 lanes, blank gantry, streetlight standards receding. Shoulder still tight. Claude PASS for V-013 dusk grade. |
| 5 | discard | Open car door invented; 3-lane weaker. |
| 6 | discard | Hood crop is true driver-eye and shoulder is wide, but only 2 lanes + double yellow. |
| 7 | discard | 2 lanes + double yellow. |
| 8 | discard | Best wet sheen and widest shoulder; 2 lanes + double yellow. |
| b-1 | discard | Wide shoulder + blank gantry; 2 lanes + double yellow. Same miss as 6–8. |

## Takes — rig

| Take | Call | Notes |
|---|---|---|
| 1 | **PROMOTED** | Period conventional cab, rust, west-coast mirrors, plain trailer, wet spray, hatchback scale — rig can shove that car. Deck-level 3/4, not worm's-eye. |
| 2 | FAIL | Same cab class; sedan scale on the same plane. Claude: car too far / hero angle / faint red markings. Do not attach. |
| 3 | keep | Same family; scale car smaller/farther. |
| 4 | keep | More nose-on; still not hero-low. |
| 5 | keep | Same family. |
| 6 | keep | Same family; blank gantry in frame. |
| 7 | keep | Strong wet; hatchback far. |
| 8 | keep | Period COE instead of conventional — valid aging, weaker as the scale lock. |

## Takes — workzone

| Take | Call | Notes |
|---|---|---|
| 1 | FAIL | True MUTCD orange + white-collar cones. Taper is a longitudinal line along the skip-dash (shoulder closure). |
| 2 | keep | Same cone language; barrels at head. |
| 3 | keep | Portable concrete barrier + barrel. |
| 4 | keep | 4-lane deck match; barrier. |
| 5 | keep | Same family. |
| 6 | FAIL | Three workers, more city, 3-lane, barrel + barrier. Same longitudinal taper. |
| 7 | keep | Fewer cones; 2-lane. |
| 8 | keep | Barrier + barrel; wet. |
| b-1 | discard | Cones hug the barrier — shoulder line, not a lane closure. |

## Residuals vs pre-generation gate

Hard gates that **hold** on the three closest + three runners: no legible route/exit/city; no snow/ice/chain signage; no sun / no warm cast; wet surface; no current-model hero fleet; MUTCD orange not desaturated; no posterized flat-color.

Still on the picks:

- **Deck take 2 / 4:** right shoulder is present (solid white to Jersey) but not a full emergency-lane width. Takes that won width (6, 8, b-1) lost the ≥3-lane one-direction read (double yellow / two-lane). Camera is standing-in-the-lane more than seated hood-line. Gantry panels are blank white rectangles — weathered-illegible, not peeling green.
- **Rig take 1 / 2:** trailer sides are clean-plain rather than heavily weathered; cab aging reads. Scale car is a 1990s compact, not a Beetle (correct — do not lock a wrong Menace into a location plate). Slight CGI smoothness, same class as other locks.
- **Workzone wave A take 1 / 6:** cone **style** matches the rain stills; the **taper** is a longitudinal channelizing line. Claude FAIL. Regen is wave C below.

Muted-read (workzone C) must teach, with text covered: a diagonal cone pinch pulling traffic across the closed lane, workers past the taper, true-orange devices on a wet unnamed deck.

## LOCKS

Deck take-4, rig take-1, and workzone wave-C take-1 are live. Take/sha filled in `refs/LOCKS.md` from promoted file bytes. No blanks.

## Workzone regen — wave C (promoted take-1)

Wave A (takes 1–8 + b-1) failed the diagonal-taper hard gate. Wave C is eight new takes against the locked brief plus that gate. Claude muted-read 2026-09-12: **c-1 PASS PROMOTE**; **c-2 PASS runner** (not attached). Live `refs/ref_ribbon_workzone.png`. Token `ribbon_workzone` is in REF_MAP.

HARD GATE: the cone row must be a **diagonal pinch** across the closed lane — each successive cone steps laterally from the right-edge line toward the skip-dash as it recedes. A row parallel to the skip-dash is a FAIL (shoulder closure). Workers sit past the taper in the closed lane. Portable barrier / barrels at the closure head. Tall MUTCD orange + white collar (Act IV rain still language). Unnamed corridor.

Pure generation kept collapsing to a longitudinal shoulder line (same fail as wave A). Pack/03 field-tested fix 6 (hand-assembly) is the path that actually produced a pinch: generated clean deck+head, then seated wave-A cone sprites along a steep diagonal aimed at the in-lane barrier. Prompt: `refs/candidates/ribbon-workzone-c.prompt.txt`.

### Wave C takes

| Take | File | Call | Notes |
|---|---|---|---|
| c-1 | `ribbon-workzone-c-take-1.png` | **PASS PROMOTED** | Assembly. Steep pinch: near cone on the right-edge / shoulder, mid cones in the right-lane asphalt, far cones meet the barrel/barrier. Workers + portable barrier + barrels already in the closed lane. Unnamed gantry, streetlights, period sedan in an open lane. |
| c-2 | `ribbon-workzone-c-take-2.png` | **runner-up PASS** | Photorealize of the same layout. Cones look seated; pinch is milder than c-1 (model pulled the row a hair toward the edge). Same head language. Keep; do not attach. |
| c-3 | `ribbon-workzone-c-take-3.png` | keep | Assembly. Steeper / fewer cones. Same class as c-1. |
| c-4 | `ribbon-workzone-c-take-4.png` | keep | Assembly. Seven-cone slash. |
| c-5 | `ribbon-workzone-c-take-5.png` | keep | Assembly. Longer row; pinch still readable. |
| c-6 | `ribbon-workzone-c-take-6.png` | discard | Raw gen. Good head (barrier in-lane, workers, blank diamond) but cone row is still mostly longitudinal. |
| c-7 | `ribbon-workzone-c-take-7.png` | discard | Raw gen. Classic wave-A fail: cones parallel to the skip-dash. |
| c-8 | `ribbon-workzone-c-take-8.png` | discard | Raw gen. Same longitudinal prior. |

### Wave C residuals

- **c-1 / c-3 / c-4 / c-5:** assembly tells — one hero cone sprite reused, distant cones a little crisp vs the plate grain. Geometry is the reason they exist.
- **c-2:** most photographic; pinch milder than c-1. Claude PASS as runner — keep in the pool, do not attach.
- Shoulder width still inherited from the deck lock (present, not a full emergency lane).
- Closure head sits in the right-center of the deck, not only against the Jersey — that is the lesson.
