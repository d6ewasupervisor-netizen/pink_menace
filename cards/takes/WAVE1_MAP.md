# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
**Do not seed.** Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md) — muted-read only; no seed until PASS.

## Closest recommendations (provisional muted-read)

| Card | Closest | Runner-up / bank | Residual |
|---|---|---|---|
| **VI-004** Off the Edge | **`VI-004-take-11.png`** (in-car regen) | take-4…6; exterior 1–3 bank | Claude FAIL on parked exterior → `POV_COCKPIT` mid-event. Avoid take-8 (dash text), take-10 (112.0), take-7/12/13/14 glitch. |
| **VI-009** Look for the Others | **`VI-009-take-1.png`** | take-2 | Deer broadside in-lane at dusk. Watch 112.0 cluster on some cockpit takes. |
| **VI-011** Same Culvert | **`VI-011-take-4.png`** (in-car regen) | take-5/6; exterior 1–2 bank | Claude FAIL on parked exterior → `POV_COCKPIT` hold. Avoid take-3 (112.0). |
| **VI-013** The Clipboard, Again | **`VI-013-take-2.png`** | — | Passenger + clipboard. **take-1 FAIL** (driver seat). **take-3 FAIL** (split panel). |

Flat pack for Claude muted-read: `artifacts/act-vi-wave1-priority/` (same bytes as `cards/takes/`).

## All takes

| Card | Title | Camera | Takes |
|---|---|---|---|
| VI-004 | Off the Edge | POV_COCKPIT (regen; exterior takes 1–3 banked) | take-1…14 |
| VI-009 | Look for the Others | POV_COCKPIT | take-1…2 |
| VI-011 | Same Culvert | POV_COCKPIT (regen; exterior takes 1–2 banked) | take-1…7 |
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
