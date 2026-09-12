# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md).

## Seeded (Claude PASS)

| Card | Live still | Source take | Notes |
|---|---|---|---|
| **VI-004** Off the Edge | `cards/VI-004.png` | **`VI-004-take-5.png`** | Claude PASS cockpit (hands on wheel; road left / grass shoulder right; motion blur verge; Gracie latched; analog cluster; no 112.0). Cache `?v=a79` → still live under `?v=a80`. **take-11 not seeded.** |
| **VI-009** Look for the Others | `cards/VI-009.png` | **`VI-009-take-2.png`** | Claude PASS. Cache `?v=a78` → still live under `?v=a80`. |
| **VI-011** Same Culvert | `cards/VI-011.png` | **`VI-011-take-12.png`** | Claude PASS Cascades-west profile (true curb-height profile; culvert lip lower third; clear gap tires-to-lip; Gracie through rear side mesh; nothing touching lip). Cache `?v=a80`. **take-13 not seeded.** |

## HOLD / not seeded

| Card | Status |
|---|---|
| **VI-013** The Clipboard, Again | **HOLD cast-FAIL take-2** (Overflow Claude 21aded1a: Deac solo / wrong cast). Tyson lock: **Ali + Deac** (+ clipboard). Live `cards/VI-013.png` cleared; Postgres unseeded. Ali+Deac regen in flight ([bc-11b91eab](https://cursor.com/agents/bc-11b91eab-feca-5403-accb-058edd57f55d)). take-1 FAIL (driver seat). take-3 FAIL (split panel). **Do not seed.** |

## Closest recommendations (remainder — provisional)

| Card | Closest | Runner-up / bank | Residual |
|---|---|---|---|
| _(none for priority PASS set)_ | | | Remainder cards still need formal Claude muted-read. |

Flat pack for Claude muted-read: `artifacts/act-vi-wave1-priority/` (same bytes as `cards/takes/` where present).

## All takes

| Card | Title | Camera | Takes |
|---|---|---|---|
| VI-004 | Off the Edge | POV_COCKPIT (regen; exterior takes 1–3 banked) | take-1…3 exterior bank + **take-5 seeded**; take-4…14 on regen PR #210 |
| VI-009 | Look for the Others | POV_COCKPIT | take-1…2 (**seeded take-2**) |
| VI-011 | Same Culvert | POV_ROADSIDE_PROFILE | take-1…2 bank + **take-12 seeded**; take-3…13 on regen PR #210 (**take-13 not seeded**) |
| VI-013 | The Clipboard, Again | POV_COCKPIT | take-1…3 (**HOLD cast-FAIL take-2 — not seeded**) |
| VI-001 | Where the Blacktop Quits | POV_COCKPIT | take-1…2 |
| VI-012 | Crossbuck and Nothing Else | POV_COCKPIT | take-1…2 |
| VI-005 | Wide and Slow | POV_COCKPIT | take-1…2 |
| VI-002 | Loose Under You | POV_COCKPIT | take-1…2 |
| VI-003 | The Pile at the Edge | POV_COCKPIT | take-1…2 |
| VI-006 | Nobody's In Charge Here | POV_COCKPIT | take-1…2 |
| VI-007 | Five Easy Steps | POV_COCKPIT | take-1…2 |
| VI-008 | Pick Your Lane Before the Circle | POV_COCKPIT | take-1…2 |
| VI-010 | Over the Top | POV_COCKPIT | take-1…2 |

All under `cards/takes/VI-*-take-N.png` (this branch carries VI-004-take-5 + VI-011-take-12 from regen #210; other regen takes remain on #210).

## Brief locks

- Every VI card: `continuity` includes `gracie`; **latched strapped** carrier named in brief (cockpit in-frame / exterior “not in frame”; wheels turning → Gracie inside).
- Deac / `deac_clipboard` only on **VI-013**; other cards negate Deac / second person / clipboard passenger.
- **VI-004** live brief is `POV_COCKPIT` mid-event (from #210 rewrite); exterior profile brief superseded.
- **VI-011** live brief is Cascades-west earn-the-lane `POV_ROADSIDE_PROFILE` (from #210 rewrite); Gracie readable through rear side mesh.

## Continuity locks (Claude)

- **Gracie:** every Act VI still — carrier latched and strapped; when wheels turning, Gracie is in the carrier (continuity object).
- **Deac:** only VI-013 has a second person (passenger + metal clipboard). All other cards: Ali alone.

## TODO

- Formal Claude muted-read for remainder cards (PASS before seed).
- **VI-013 take-2 cast-FAIL HOLD** — wait Ali+Deac regen (bc-11b91eab); do not reseed take-2.
- Do **not** seed VI-011-take-13. Do **not** seed VI-004-take-11.
- No Act VII.
