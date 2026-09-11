# 32 — Act I frame stills

Eight cards need art. The lot sequence (I-005 through I-008) is compiled and seeded — do not touch it.

**Act I is parked.** No clock, no closing hazard, and — except the lot — no Quiet. That is the act's whole visual identity.

**Standing rules for all eight:**
- `driver: ali` — the Menace, never the Ledger
- Overcast Pacific Northwest daylight, wet asphalt, cranberry as the only saturated accent
- **No Quiet in any of these frames**
- No cargo, no cooler, no COLD tag
- Presence overlay stays on for these eight (suppressed only on the four lot cards)
- **Both cats only in I-001 and I-003.** After the lot: Gracie alone, empty seat.

**Brief authority:** card JSON is the only authority for a card's brief. This pack file is how the briefs were written the first time; once a card is in `cards/`, the JSON wins and this file is history. See pack/00_README.md.

See card JSON `image_brief` blocks for the locked briefs. I-010 uses `POV_ROADSIDE` from inside turned rearward — not a mirror token. `camera_pose` overrides the exterior roadside framing for that card.

## Live plates (11 Sep 2026)

Hashes against `cards/<id>.png`. Take numbers are the matching file in `cards/takes/`.

| Card | Live | Status |
|------|------|--------|
| I-001 | take 4 | seeded — both cats on the seat, Cascades, closed cabin |
| I-002 | take 5 | **seeded** — exterior, door closed, empty wet lot, low warehouse |
| I-003 | take 9 | seeded — belt from left B-pillar + both cats on seat |
| I-004 | take 2 | **seeded** — empty aisle, dark tablet |
| I-009 | take 8 | **do not seed** — live still is a cockpit lap shot; awaiting new takes under `cards/I-009.json` (`POV_MIRROR_DOOR`, Gracie on the passenger seat, empty aisle in the left glass, warehouse lot) |
| I-010 | take 8 | **do not seed** — fails continuity (parked cars in an empty lot). Needs empty-aisle reshoot, same rearward OTS framing |
| I-011 | take 5 | seeded — keyed handset, lit LED |
| I-012 | take 5 | seeded — Gracie alone, 25 sign, full roof and windshield cage |

Lot cards I-005–I-008 untouched.

I-009 and I-010 new takes (take 9+) stay in `cards/takes/` until a human pass. Do not copy them to `cards/I-009.png` or `cards/I-010.png`.
