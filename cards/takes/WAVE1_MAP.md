# Act VI Backcountry — wave-1 map

Card JSON is the sole brief. Stills from each card's MOMENT (hook/scene), not the topic label.
Continuity: **Gracie in latched strapped carrier on every card**; **Deac only on VI-013**.

**Muted-read pack:** [`ACT_VI_WAVE1_MUTED_READ.md`](./ACT_VI_WAVE1_MUTED_READ.md).

## Seeded (Claude PASS)

| Card | Live still | Source take | Notes |
|---|---|---|---|
| **VI-009** Look for the Others | `cards/VI-009.png` | **`VI-009-take-2.png`** | Claude PASS. Cache `?v=a78`. |

## HOLD / not seeded

| Card | Status |
|---|---|
| **VI-013** The Clipboard, Again | **HOLD cast-FAIL take-2** (Overflow Claude 21aded1a: Deac solo / wrong cast). Tyson lock: **Ali + Deac** (+ clipboard). Live `cards/VI-013.png` cleared; Postgres unseeded. Ali+Deac regen in flight ([bc-11b91eab](https://cursor.com/agents/bc-11b91eab-feca-5403-accb-058edd57f55d)). take-1 FAIL (driver seat). take-3 FAIL (split panel). **Do not seed.** |
| **VI-004** Off the Edge | Do not seed (FAIL / not in this PASS set). |
| **VI-011** Same Culvert | Do not seed (FAIL / not in this PASS set). |

## Closest recommendations (remainder — provisional)

| Card | Closest | Runner-up / bank | Residual |
|---|---|---|---|
| **VI-004** Off the Edge | **`VI-004-take-2.png`** | take-3; take-1 bank | Prefer 2/3 for mid-event drop (wheels already off). Take-1 more approach-ish. **Do not seed.** |
| **VI-011** Same Culvert | **`VI-011-take-2.png`** | take-1 | Lip + culvert + all tires on pavement; nothing happening. **Do not seed.** |

Flat pack for Claude muted-read: `artifacts/act-vi-wave1-priority/` (same bytes as `cards/takes/`).

## All takes

| Card | Title | Camera | Takes |
|---|---|---|---|
| VI-004 | Off the Edge | POV_ROADSIDE_PROFILE | take-1…3 |
| VI-009 | Look for the Others | POV_COCKPIT | take-1…2 (**seeded take-2**) |
| VI-011 | Same Culvert | POV_ROADSIDE_PROFILE | take-1…2 |
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

All under `cards/takes/VI-*-take-N.png`.

## Brief locks

- Every VI card: `continuity` includes `gracie`; **latched strapped** carrier named in brief (cockpit in-frame / exterior “not in frame”; wheels turning → Gracie inside).
- Deac / `deac_clipboard` only on **VI-013**; other cards negate Deac / second person / clipboard passenger.

## Continuity locks (Claude)

- **Gracie:** every Act VI still — carrier latched and strapped; when wheels turning, Gracie is in the carrier (continuity object).
- **Deac:** only VI-013 has a second person (passenger + metal clipboard). All other cards: Ali alone.

## TODO

- Formal Claude muted-read for remainder cards (PASS before seed).
- **VI-013 take-2 cast-FAIL HOLD** — wait Ali+Deac regen (bc-11b91eab); do not reseed take-2.
- Do **not** seed VI-004 / VI-011.
- No Act VII.
- Inventory: **28** take PNGs under `cards/takes/`.
