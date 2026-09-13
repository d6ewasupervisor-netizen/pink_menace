# WAVE1_MAP (Act VI + Act V playtest)

## Act VI

# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md).

## Seeded (Claude PASS)

| Card | Live still | Source take | Notes |
|---|---|---|---|
| **VI-004** Off the Edge | `cards/VI-004.png` | **`VI-004-take-5.png`** | Claude PASS cockpit (hands on wheel; road left / grass shoulder right; motion blur verge; Gracie latched; analog cluster; no 112.0). Cache `?v=a79` → still live under `?v=a85`. **take-11 not seeded.** |
| **VI-009** Look for the Others | `cards/VI-009.png` | **`VI-009-take-2.png`** | Claude PASS. Cache `?v=a78` → still live under `?v=a85`. |
| **VI-011** Same Culvert | `cards/VI-011.png` | **`VI-011-take-12.png`** | Claude PASS (Cascades-west; curb-height profile; culvert lower third; lane position as choice; Gracie through rear side mesh). Cache `?v=a80` → still live under `?v=a85`. **take-13 FAIL not seeded.** |
| **VI-013** The Clipboard, Again | `cards/VI-013.png` | **`VI-013-take-16.png`** | Claude PASS HANDOFF (clipboard toward Ali; ruled sheet no readable words; glasses on cord; Gracie latched; Cascades-west). Cache `?v=a81` → still live under `?v=a85`. **take-17 NOT seeded.** |
| **VI-007** Five Easy Steps | `cards/VI-007.png` | **`VI-007-take-9.png`** | Claude PASS (roundabout geometry reads). Cache `?v=a82` → still live under `?v=a85`. **take-8 FAIL not seeded.** |
| **VI-010** Over the Top | `cards/VI-010.png` | **`VI-010-take-8.png`** | Claude PASS (blind crest). Cache `?v=a82` → still live under `?v=a85`. **take-7 FAIL not seeded.** |
| **VI-012** Crossbuck and Nothing Else | `cards/VI-012.png` | **`VI-012-take-8.png`** | Claude PASS (crossbuck + rails). Cache `?v=a82` → still live under `?v=a85`. **take-7 FAIL not seeded.** |
| **VI-001** Where the Blacktop Quits | `cards/VI-001.png` | **`VI-001-take-6.png`** | Claude PASS (blacktop→gravel / pass notch; carrier+full-grid). Cache `?v=a83` → still live under `?v=a85`. **take-7 FAIL not seeded.** |
| **VI-002** Loose Under You | `cards/VI-002.png` | **`VI-002-take-8.png`** | Claude PASS (empty washboard ruts). Cache `?v=a83` → still live under `?v=a85`. **take-6 FAIL (112.0) not seeded.** |
| **VI-005** Wide and Slow | `cards/VI-005.png` | **`VI-005-take-7.png`** | Claude PASS (SMV grain truck ahead). Cache `?v=a83` → still live under `?v=a85`. **take-8 FAIL (112.0) not seeded.** |
| **VI-006** Nobody's In Charge Here | `cards/VI-006.png` | **`VI-006-take-6.png`** | Claude PASS (uncontrolled gravel cross). Cache `?v=a83` → still live under `?v=a85`. **take-7 FAIL (pickup L-to-R / yield-to-right gone) not seeded.** |
| **VI-003** The Pile at the Edge | `cards/VI-003.png` | **`VI-003-take-13.png`** | Claude PASS (continuous ridge of loose pale gravel along the right edge at road level; carrier inboard; no 112). Cache `?v=a84` → still live under `?v=a85`. **takes 10/11/12/14 FAIL not seeded.** |
| **VI-008** Pick Your Lane Before the Circle | `cards/VI-008.png` | **`VI-008-take-15.png`** | Claude PASS (multi-lane roundabout approach — two approach lanes + central island + circulating cross-traffic; carrier inboard; dark dash; no 112). Cache `?v=a85`. **take-16 FAIL not seeded.** |

## Not seeded / banked

| Card | Status |
|---|---|
| VI-013 take-17 | Runner — **not seeded** (take-16 PASS only). |
| VI-013 take-2 | Prior cast-FAIL HOLD — **not promoted**. |
| VI-007 take-8 | FAIL (flat painted island / widened junction) — **not seeded**. |
| VI-010 take-7 | FAIL (farm implement visible + 112 cluster) — **not seeded**. |
| VI-012 take-7 | FAIL (bare X, no rails in road) — **not seeded**. |
| VI-001 take-7 | FAIL (paved/no carrier) — **not seeded**. |
| VI-002 take-6 | FAIL (112.0) — **not seeded**. |
| VI-005 take-8 | FAIL (112.0) — **not seeded**. |
| VI-006 take-7 | FAIL (pickup L-to-R / yield-to-right gone) — **not seeded**. |
| VI-003 take-10/11/12/14 | FAIL (shoulder spill / earthen berm, not gravel windrow) — **not seeded**. |
| VI-008 take-16 | FAIL (single-lane / VI-007 geometry: yield triangles, no lane divider) — **not seeded**. |

Flat pack for Claude muted-read: `artifacts/act-vi-wave1-priority/` (same bytes as `cards/takes/` where present).

## All takes

| Card | Title | Camera | Takes |
|---|---|---|---|
| VI-004 | Off the Edge | POV_COCKPIT (regen; exterior takes 1–3 banked) | take-1…3 exterior bank + **take-5 seeded**; take-4…14 on regen PR #210 |
| VI-009 | Look for the Others | POV_COCKPIT | take-1…2 (**seeded take-2**) |
| VI-011 | Same Culvert | POV_ROADSIDE_PROFILE | take-1…2 bank + **take-12 seeded**; take-13 FAIL not promoted (regen on #210) |
| VI-013 | The Clipboard, Again | POV_COCKPIT | take-1…3 bank + handoff takes 11–18 on #216; **take-16 seeded**; take-17 runner not seeded |
| VI-007 | Five Easy Steps | POV_COCKPIT | take-1…2 bank + **take-9 seeded** from #217; take-8 FAIL not seeded |
| VI-010 | Over the Top | POV_COCKPIT | take-1…2 bank + **take-8 seeded** from #217; take-7 FAIL not seeded |
| VI-012 | Crossbuck and Nothing Else | POV_COCKPIT | take-1…2 bank + **take-8 seeded** from #217; take-7 FAIL not seeded |
| VI-001 | Where the Blacktop Quits | POV_COCKPIT | take-1…2 bank + **take-6 seeded** from #217; take-7 FAIL not seeded |
| VI-002 | Loose Under You | POV_COCKPIT | take-1…2 bank + **take-8 seeded** from #217; take-6 FAIL not seeded |
| VI-005 | Wide and Slow | POV_COCKPIT | take-1…2 bank + **take-7 seeded** from #217; take-8 FAIL not seeded |
| VI-006 | Nobody's In Charge Here | POV_COCKPIT | take-1…2 bank + **take-6 seeded** from #217; take-7 FAIL not seeded |
| VI-003 | The Pile at the Edge | POV_COCKPIT | take-1…2 bank + regen 10–14 on #222; **take-13 seeded**; takes 10/11/12/14 FAIL not seeded |
| VI-008 | Pick Your Lane Before the Circle | POV_COCKPIT | take-1…2 bank + regen 9–16 on #225; **take-15 seeded**; take-16 FAIL not seeded |

All under `cards/takes/VI-*-take-N.png` (this branch carries prior seeded takes + `VI-003-take-13.png` from #222 + `VI-008-take-15.png` from #225; FAIL runners remain on source PRs).

## Brief locks

- Every VI card: `continuity` includes `gracie`; **latched strapped** carrier named in brief (cockpit in-frame / exterior “not in frame”; wheels turning → Gracie inside).
- Deac / `deac_clipboard` only on **VI-013**; other cards negate Deac / second person / clipboard passenger.
- **VI-004** live brief is `POV_COCKPIT` mid-event (from #210 rewrite); exterior profile brief superseded.
- **VI-011** live brief is earn-the-lane Cascades-west curb-height profile + carrier through rear side mesh (from #210 rewrite).
- **VI-007 / VI-010 / VI-012** live briefs are Cascades-west remainder from #217.
- **VI-001 / VI-002 / VI-005 / VI-006** live briefs are Cascades-west remainder from #217.
- **VI-003** live brief is windrow + inboard carrier from #222; take-13 PASS only.
- **VI-008** live brief is multi-lane roundabout approach from #225; take-15 PASS only.

## Continuity locks (Claude)

- **Gracie:** every Act VI still — carrier latched and strapped; when wheels turning, Gracie is in the carrier (continuity object).
- **Deac:** only VI-013 has a second person (passenger + metal clipboard). All other cards: Ali alone.

## TODO

- Do **not** seed VI-008 take-16 (FAIL — single-lane / VI-007 geometry).
- Do **not** seed VI-003 takes 10/11/12/14 (FAIL — shoulder spill / earthen berm).
- Do **not** seed VI-013-take-17. Do **not** reseed cast-FAIL take-2.
- Do **not** seed VI-011-take-13. Do **not** seed VI-004-take-11.
- Do **not** seed VI-007-take-8 / VI-010-take-7 / VI-012-take-7.
- Do **not** seed VI-001-take-7 / VI-002-take-6 / VI-005-take-8 / VI-006-take-7.
- No Act VII.


## Act V playtest

# Act V Ribbon wave-1 take map (option A)

Card JSON is the sole brief. This file only names closest / runner / residual.
Claude-accepted 2026-09-12: compile authority matches the named Ribbon shots.
Seeded live: V-013←take-7 (Quiet silhouette PASS), V-008←take-3, V-006←take-3. V-008 take-1 not seeded. V-013 take-6 FAIL not seeded. Plates stay in their own PRs.

**Remap lock:** live V-013 is Skill 11 **Flashers on the Strip** (PR #199), **NOT Hollis**. QP-003 / take-7 Quiet silhouette dressing sits on the Flashers card.

| Card | Plate | Closest | Runner | Discard |
|---|---|---|---|---|
| V-013 | `ref_ribbon_deck` take-4 | **take 7 PASS (live Quiet dressing)** | take 5 (empty stretch, superseded) | take 6 FAIL (do not seed); take 2 (frontal / plow at lens); take 4 (wrong face, red lamps, wide pad) |
| V-008 | `ref_ribbon_workzone` C-1 | **take 3 PASS** | — | take 1 FAIL (do not seed); take 4 (rear bar / wrong side); take 5 (frontal plow) |
| V-006 | `ref_ribbon_rig` take-1 | **take 3 PASS** | take 1 | take 4 (3/4 front + plow at lens); take 2 (mirrors weaker) |

## Residuals already visible

- **V-013 take 7 (live):** Quiet dressing on the banked take-3 plate — two distant silhouettes at the far right shoulder / curve. Teaching read stays the stopped Menace on the narrow shoulder past the curve; flashers, mesh, steel door, fog-line squeeze hold. take-5 was the empty-stretch wave-1 PASS before QP-003. take-6 (take-5 plate + Quiet) FAIL — not seeded.
- **V-008 take 3:** camera is behind and right of a large Beetle; workers read as people; MUTCD orange holds; left gantry panel is blank at full crop. Cones still run as a longitudinal file along the fog line, not a strong lateral pinch toward the skip-dash. That is also how the live workzone plate reads — flag as plate-plus-card, not card-art-only.
- **V-006 take 3:** door-height, Beetle low, period rust, unmarked trailer, wet spray, a west-coast mirror arm in frame. Residual: not both mirrors crisp; some hood still in the left; not a pure gap-only crop.

## Pre-generation gates (all named closest / runner)

Holds: no legible route/exit number; no snow/ice/chains; no sun/warm cast; wet surface; no current-model hero fleet; no posterized flat-color; MUTCD orange not desaturated; left workzone gantry panel blank.

## Lessons remapped (2026-09-12, Tyson)

Card JSON is still the sole brief. Text now matches the Ribbon shots. Seeded to live playtest DB.

- **V-013** — EXACT Claude JSON (Skill 11 **Flashers on the Strip**, PR #199). **NOT Hollis.** Live master **take-7** Quiet silhouette (Claude overflow mute-read PASS + Brad promote) sits on the Flashers card. take-6 FAIL not seeded. take-5 empty stretch superseded. Master `cards/V-013.png`. No Quiet on V-006 / V-008.
- **V-008** — EXACT Claude JSON. Brad PASS promote take-3 (6x left-gantry weathered blank, CLEAR TO SEED). take-1 FAIL. Master `cards/V-008.png`.
- **V-006** — EXACT Claude JSON. Brad PASS promote take-3; take-1 banked. Master `cards/V-006.png`.
