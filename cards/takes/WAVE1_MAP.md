# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md).

## Seeded (Claude PASS)

| Card | Live still | Source take | Notes |
|---|---|---|---|
| **VI-004** Off the Edge | `cards/VI-004.png` | **`VI-004-take-5.png`** | Claude PASS cockpit (hands on wheel; road left / grass shoulder right; motion blur verge; Gracie latched; analog cluster; no 112.0). Cache `?v=a79` → still live under `?v=a82`. **take-11 not seeded.** |
| **VI-009** Look for the Others | `cards/VI-009.png` | **`VI-009-take-2.png`** | Claude PASS. Cache `?v=a78` → still live under `?v=a82`. |
| **VI-011** Same Culvert | `cards/VI-011.png` | **`VI-011-take-12.png`** | Claude PASS (Cascades-west; curb-height profile; culvert lower third; lane position as choice; Gracie through rear side mesh). Cache `?v=a80` → still live under `?v=a82`. **take-13 FAIL not seeded.** |
| **VI-013** The Clipboard, Again | `cards/VI-013.png` | **`VI-013-take-16.png`** | Claude PASS HANDOFF (clipboard toward Ali; ruled sheet no readable words; glasses on cord; Gracie latched; Cascades-west). Cache `?v=a81` → still live under `?v=a82`. **take-17 NOT seeded.** |
| **VI-007** Five Easy Steps | `cards/VI-007.png` | **`VI-007-take-9.png`** | Claude PASS (roundabout geometry reads). Cache `?v=a82`. **take-8 FAIL not seeded.** |
| **VI-010** Over the Top | `cards/VI-010.png` | **`VI-010-take-8.png`** | Claude PASS (blind crest). Cache `?v=a82`. **take-7 FAIL not seeded.** |
| **VI-012** Crossbuck and Nothing Else | `cards/VI-012.png` | **`VI-012-take-8.png`** | Claude PASS (crossbuck + rails). Cache `?v=a82`. **take-7 FAIL not seeded.** |

## Not seeded / banked

| Card | Status |
|---|---|
| VI-013 take-17 | Runner — **not seeded** (take-16 PASS only). |
| VI-013 take-2 | Prior cast-FAIL HOLD — **not promoted**. |
| VI-007 take-8 | FAIL (flat painted island / widened junction) — **not seeded**. |
| VI-010 take-7 | FAIL (farm implement visible + 112 cluster) — **not seeded**. |
| VI-012 take-7 | FAIL (bare X, no rails in road) — **not seeded**. |
| VI-008 | BOTH FAIL — **not seeded** (separate regen). |

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
| VI-001 | Where the Blacktop Quits | POV_COCKPIT | take-1…2 |
| VI-005 | Wide and Slow | POV_COCKPIT | take-1…2 |
| VI-002 | Loose Under You | POV_COCKPIT | take-1…2 |
| VI-003 | The Pile at the Edge | POV_COCKPIT | take-1…2 |
| VI-006 | Nobody's In Charge Here | POV_COCKPIT | take-1…2 |
| VI-008 | Pick Your Lane Before the Circle | POV_COCKPIT | take-1…2 (BOTH FAIL — regen separate) |

All under `cards/takes/VI-*-take-N.png` (this branch carries VI-004-take-5 + VI-011-take-12 + VI-013-take-16 + VI-007-take-9 + VI-010-take-8 + VI-012-take-8 from #217; FAIL runners remain on source PRs).

## Brief locks

- Every VI card: `continuity` includes `gracie`; **latched strapped** carrier named in brief (cockpit in-frame / exterior “not in frame”; wheels turning → Gracie inside).
- Deac / `deac_clipboard` only on **VI-013**; other cards negate Deac / second person / clipboard passenger.
- **VI-004** live brief is `POV_COCKPIT` mid-event (from #210 rewrite); exterior profile brief superseded.
- **VI-011** live brief is earn-the-lane Cascades-west curb-height profile + carrier through rear side mesh (from #210 rewrite).
- **VI-007 / VI-010 / VI-012** live briefs are Cascades-west remainder from #217.

## Continuity locks (Claude)

- **Gracie:** every Act VI still — carrier latched and strapped; when wheels turning, Gracie is in the carrier (continuity object).
- **Deac:** only VI-013 has a second person (passenger + metal clipboard). All other cards: Ali alone.

## TODO

- Do **not** seed VI-008 (BOTH FAIL — separate regen).
- Do **not** seed VI-013-take-17. Do **not** reseed cast-FAIL take-2.
- Do **not** seed VI-011-take-13. Do **not** seed VI-004-take-11.
- Do **not** seed VI-007-take-8 / VI-010-take-7 / VI-012-take-7.
- No Act VII.
