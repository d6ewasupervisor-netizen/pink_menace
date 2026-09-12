# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
**Do not seed.** Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md) — muted-read only; no seed until PASS.

## Closest / runner (Gracie+Deac lock pass)

| Card | Closest | Runner | Lock note |
|---|---|---|---|
| VI-001 | `VI-001-take-3.png` | take-1 | take-3: Gracie **inside** latched strapped carrier; take-1/2 cat loose beside carrier |
| VI-002 | `VI-002-take-3.png` | take-1 | take-3 adds visible latched carrier + Gracie |
| VI-003 | `VI-003-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-004 | `VI-004-take-2.png` | take-3 | exterior profile — wheels already off; carrier continuity not the read |
| VI-005 | `VI-005-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-006 | `VI-006-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-007 | `VI-007-take-3.png` | take-1 | take-3 Gracie-in-carrier; Ali alone |
| VI-008 | `VI-008-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-009 | `VI-009-take-3.png` | take-1 | deer broadside in-lane dusk + Gracie-in-carrier |
| VI-010 | `VI-010-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-011 | `VI-011-take-2.png` | take-1 | exterior — lip + nothing happening |
| VI-012 | `VI-012-take-3.png` | take-1 | take-3 Gracie-in-carrier |
| VI-013 | `VI-013-take-5.png` | take-2 | take-5: Deac **passenger** + clipboard + Gracie-in-carrier; take-1 driver FAIL; take-3/4 seating FAIL |

**Inventory:** 40 take PNGs under `cards/takes/` (includes Gracie/Deac lock regens).



## All takes

| Card | Title | Camera | Takes |
|---|---|---|---|
| VI-004 | Off the Edge | POV_ROADSIDE_PROFILE | take-1…3 |
| VI-009 | Look for the Others | POV_COCKPIT | take-1…2 |
| VI-011 | Same Culvert | POV_ROADSIDE_PROFILE | take-1…2 |
| VI-013 | The Clipboard, Again | POV_COCKPIT | take-1…3 |
| VI-001 | Where the Blacktop Quits | POV_COCKPIT | take-1…2 |
| VI-012 | Crossbuck and Nothing Else | POV_COCKPIT | take-1…2 |
| VI-005 | Wide and Slow | POV_COCKPIT | take-1…2 |
| VI-002 | Loose Under You | POV_COCKPIT | take-1…2 |
| VI-003 | The Pile at the Edge | POV_COCKPIT | take-1…2 |
| VI-006 | Nobody's In Charge Here | POV_COCKPIT | take-1…2 |
| VI-007 | Five Easy Steps | POV_COCKPIT | take-1…2 |
| VI-008 | Pick Your Lane Before the Circle | POV_COCKPIT | take-1…2 |
| VI-010 | Over the Top | POV_COCKPIT | take-1…2 |

All under `cards/takes/VI-*-take-N.png`.

## Brief locks

- Every VI card: `continuity` includes `gracie`; **latched strapped** carrier named in brief (cockpit in-frame / exterior “not in frame”; wheels turning → Gracie inside).
- Deac / `deac_clipboard` only on **VI-013**; other cards negate Deac / second person / clipboard passenger.

## Continuity locks (Claude)

- **Gracie:** every Act VI still — carrier latched and strapped; when wheels turning, Gracie is in the carrier (continuity object).
- **Deac:** only VI-013 has a second person (passenger + metal clipboard). All other cards: Ali alone.

## TODO

- Formal Claude muted-read via `ACT_VI_WAVE1_MUTED_READ.md` (PASS before seed).
- Do **not** seed Postgres; no live `cards/VI-*.png`; no `imageUrl` bump.
- Inventory: **28** take PNGs under `cards/takes/`.
