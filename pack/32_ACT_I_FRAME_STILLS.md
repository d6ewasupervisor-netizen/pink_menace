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
| I-002 | take 5 | **seeded** — exterior, door closed, empty wet lot, low warehouse. Confirmed still `cards/I-002.png` == `cards/takes/I-002-take-5.png`. Do not unseed. |
| I-003 | take 9 | seeded — belt from left B-pillar + both cats on seat |
| I-004 | take 2 | **seeded** — empty aisle, dark tablet. Confirmed still `cards/I-004.png` == `cards/takes/I-004-take-2.png`. Do not unseed. |
| I-009 | take 8 | **do not seed** — live still is the old forward cockpit lap shot. New inside-cabin door-mirror takes are queued below. Wait for a Claude muted-read pass. |
| I-010 | take 9 | **seeded in repo** — empty-aisle rearward OTS (`cards/I-010.png` == `cards/takes/I-010-take-9.png`). Claude muted-read: PASS; takes 9–12 correct; take 9 crispest. Avoid 11/12 stray mesh artifact. **Postgres seed blocked:** `DATABASE_URL` was not set in this environment. Live site still needs `npm run seed -- I-010` once a database is available. |
| I-011 | take 5 | seeded — keyed handset, lit LED |
| I-012 | take 5 | seeded — Gracie alone, 25 sign, full roof and windshield cage |

Lot cards I-005–I-008 untouched.

## I-009 take history (do not overwrite)

| Takes | Verdict | Notes |
|-------|---------|-------|
| 1–8 | superseded | Old locked plates. Live `cards/I-009.png` is still take 8 until a pass. |
| 9–12 | old brief (PR #6) | Gracie-on-lap door-mirror reshoot. Not this brief. Files live on [PR #6](https://github.com/d6ewasupervisor-netizen/pink_menace/pull/6). |
| 13–16 | **FAILED — camera outside the car** | Leave as failed history. Same miss on all four: camera left the cabin. 13/15 on asphalt beside the front fender; 14 outside an open door; 16 closest but still angled from the right looking in, Gracie on the left seat. Do not seed. Do not overwrite. |
| 17–20 | **muted-read (Claude, 11 Sep)** | Camera inside the cabin is fixed on all four. **17 / 18 / 20 FAIL** — Gracie on the left seat in front of the wheel. **19 CAMERA PERFECT, cat missing** — left-seat eye height, left door mirror, empty aisle in the glass; no passenger seat in frame. Do not seed. |
| 21–24 | **not generated** | Inpaint of take 19 aborted. The passenger seat is not in those pixels; adding Gracie there is a recompose (forbidden fifth round). See `cards/I-009.inpaint.md`. Claude offered to accept take 19 with a scene-copy adjustment. |

## I-010 takes 9–12

Claude muted-read: **PASS.** All four are correct empty-aisle rearward OTS. Seed take 9 (crispest). Takes 10–12 remain as the passed batch; prefer 9 over 11/12 if choosing among them (stray mesh artifact).
