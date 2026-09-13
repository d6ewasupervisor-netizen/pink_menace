# Act VI Backcountry — wave-1 muted-read pack

**Muted-read.** **VI-004 take-5**, **VI-009 take-2**, **VI-011 take-12**, **VI-013 take-16**, **VI-007 take-9**, **VI-010 take-8**, **VI-012 take-8**, **VI-001 take-6**, **VI-002 take-8**, **VI-005 take-7**, **VI-006 take-6** already seeded. **VI-008 take-15** is **seeded** (Claude PASS — multi-lane roundabout approach). Do **not** seed VI-003 (FAIL). Do **not** seed VI-008 take-16 (FAIL — single-lane VI-007 geometry). No Act VII.

Map: [`WAVE1_MAP.md`](./WAVE1_MAP.md). Card JSON is the sole brief. All take paths under `cards/takes/`.

Priority stills also staged at `artifacts/act-vi-wave1-priority/` (same bytes as `cards/takes/` — Brad direct-uploads; agents do not attach/post reply images).

---

## Instruction

1. Cover the card text. Judge each still at **390px** against the brief `read`.
2. Tag + closest take only (`PASS` / fail tags per `pack/24_ART_REVIEW_RUBRIC.md`).
3. **No seed** until a card is `PASS` with a picked take.
4. Prefer takes that keep mesh + pink dash readable (cabin lock drift / invented GPS on some cockpit takes).

---

## Priority (hard notes from Claude)

| Card | Title | Prefer | Takes | Hard note |
|---|---|---|---|---|
| **VI-004** | Off the Edge | **take-5 seeded** (cockpit PASS) | `VI-004-take-5.png` (+ exterior bank 1–3; other regen takes on #210) | Claude PASS: cockpit, hands on wheel, road left / grass shoulder right, motion blur verge, Gracie latched, analog cluster, **no 112.0**. `POV_COCKPIT`. **take-11 not seeded.** |
| **VI-009** | Look for the Others | take-1 / take-2 | `VI-009-take-1.png` `VI-009-take-2.png` | Deer **BROADSIDE IN THE LANE** at dusk, close — not roadside grazing. `POV_COCKPIT`. **take-2 seeded.** |
| **VI-011** | Same Culvert | **take-12 seeded** (PASS) | `VI-011-take-12.png` (+ bank 1–2; take-13 FAIL on #210) | Claude PASS: Cascades-west, curb-height profile, culvert lower third, lane position as choice, Gracie through rear side mesh. Car reads stationary — accepted. `POV_ROADSIDE_PROFILE`. **take-13 FAIL not seeded.** |
| **VI-013** | The Clipboard, Again | **take-16 seeded** (HANDOFF PASS) | `VI-013-take-16.png` (+ bank 1–3; handoff 11–18 on #216) | Claude PASS: Deac turning clipboard toward Ali; sheet ruled lines no readable words; glasses on cord; Gracie latched between them; Cascades-west. Composition note OK. `POV_COCKPIT`. **take-17 NOT seeded.** |
| **VI-007** | Five Easy Steps | **take-9 seeded** (PASS) | `VI-007-take-9.png` (from #217) | Claude PASS: roundabout geometry reads. **take-8 FAIL** (flat painted island / widened junction) not seeded. |
| **VI-010** | Over the Top | **take-8 seeded** (PASS) | `VI-010-take-8.png` (from #217) | Claude PASS: blind crest. **take-7 FAIL** (farm implement visible + 112 cluster) not seeded. |
| **VI-012** | Crossbuck and Nothing Else | **take-8 seeded** (PASS) | `VI-012-take-8.png` (from #217) | Claude PASS: crossbuck + rails. **take-7 FAIL** (bare X, no rails in road) not seeded. |
| **VI-001** | Where the Blacktop Quits | **take-6 seeded** (PASS) | `VI-001-take-6.png` (from #217) | Claude PASS: blacktop→gravel / pass notch; carrier+full-grid. **take-7 FAIL** (paved/no carrier) not seeded. |
| **VI-002** | Loose Under You | **take-8 seeded** (PASS) | `VI-002-take-8.png` (from #217) | Claude PASS: empty washboard ruts. **take-6 FAIL** (112.0) not seeded. |
| **VI-005** | Wide and Slow | **take-7 seeded** (PASS) | `VI-005-take-7.png` (from #217) | Claude PASS: SMV grain truck ahead. **take-8 FAIL** (112.0) not seeded. |
| **VI-006** | Nobody's In Charge Here | **take-6 seeded** (PASS) | `VI-006-take-6.png` (from #217) | Claude PASS: uncontrolled gravel cross. **take-7 FAIL** (pickup L-to-R / yield-to-right gone) not seeded. |
| **VI-008** | Pick Your Lane Before the Circle | **take-15 seeded** (PASS) | `VI-008-take-15.png` (from #225) | Claude PASS: two approach lanes + dashed divider + L/R painted arrows + raised planted island + circulating sedan; carrier inboard; no 112. **take-16 FAIL** (single-lane VI-007 geometry) not seeded. |

Closest: VI-004→take-5 (**seeded**), VI-009→take-2 (**seeded**), VI-011→take-12 (**seeded**), VI-013→take-16 (**seeded**), VI-007→take-9 (**seeded**), VI-010→take-8 (**seeded**), VI-012→take-8 (**seeded**), VI-001→take-6 (**seeded**), VI-002→take-8 (**seeded**), VI-005→take-7 (**seeded**), VI-006→take-6 (**seeded**), VI-008→take-15 (**seeded**).

---

## Remainder (not seeded this pass)

| Card | Title | Takes | Status |
|---|---|---|---|
| VI-003 | The Pile at the Edge | (takes on #217 / #224) | **FAIL — do not seed** (separate regen) |

**Inventory:** prior seeded takes + `VI-008-take-15.png` from #225. FAIL runners remain on source PRs.

---

## Continuity locks (Claude)

### Gracie

Every Act VI still: **carrier latched and strapped**. When wheels are turning, **Gracie is in the carrier** (continuity object — readable on cockpit floors; exterior profile stills keep it as continuity even if not in frame).

### Deac

**Only VI-013** has a second person: Deac in the **passenger** seat with the **metal clipboard**. All other cards: **Ali alone** (`no Deac` / `no second person in the car` / `no clipboard passenger`).

---

## Out of scope

No Act VII. No VI-003 seed. No VI-008-take-16 seed. No FAIL-runner seeds for VI-001/002/005/006/007/010/012. No VI-013-take-17 / VI-011-take-13 / VI-004-take-11 seed. Citations / `source` blocks untouched.
