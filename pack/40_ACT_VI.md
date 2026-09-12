# 40 — Act VI scaffold: The Backcountry (CLEARED ending)

Text/structure only. **No art. No stills. No seeding.** Empty authoritative card shells for Claude copy.

**Citation research:** `pack/39_ACT_VI_CITATION_AUDIT.md` (from PR #207).

**Count:** thirteen cards **VI-001…VI-013** plus the existing engine end-of-run beat (`deliveryBeat` / locked door). **VI-014 is not a card.**

**Locks:** Ali alone in the Menace. Yuna radio-only if at all. Skills **twelve + thirteen**. Chains / Snoqualmie / snow / night / Gravy = **Act VII**.

**Allowlist (exact):**

```
Skill twelve: driving on rural roads
Skill thirteen: roundabouts
```

---

## Slot table (scaffold)

| Card | Type | Title | PSDP | DOL |
|---|---|---|---|---|
| VI-001 | dossier | Where the Blacktop Quits | twelve | n/a |
| VI-002 | scene | Loose Under You | twelve | n/a (honest null — do not cite parent 5.6) |
| VI-003 | scene | The Pile at the Edge | twelve | n/a |
| VI-004 | hazard | Soft Shoulder | twelve | n/a — arms ledger **VI-011**; timeout = yank |
| VI-005 | scene | Grain Truck | twelve | `4.8 Sharing with agricultural vehicles` |
| VI-006 | scene | Uncontrolled Intersection | twelve | `4.15 Other intersections (Uncontrolled Intersection)` |
| VI-007 | rule | Roundabout Five Steps | thirteen | n/a (PSDP Lesson one – five easy steps) |
| VI-008 | scene | Two-Lane Roundabout | thirteen | n/a (Lesson three – two or more lane roundabouts) |
| VI-009 | hazard | Do Not Swerve | twelve | n/a — Animals; timeout = swerve |
| VI-010 | scene | Blind Crest Then Curve | twelve | `5.6 Road and driving conditions (Curves)` |
| VI-011 | ledger | The Shoulder Again | n/a | n/a — `callback_of: VI-004` |
| VI-012 | scene | Unmarked Rail Crossing | twelve | `4.7 Sharing the road with trains` (parent, not Light rail) |
| VI-013 | scene | Clearance Drive | twelve | n/a — Deac clipboard; she is cleared |
| — | end beat | Cleared — and the pass is shut | — | `src/manifest.js` `deliveryBeat(…, "VI")` — not a card |

Play order is `seq`. JSON lives at `cards/VI-*.json`. `variation.forced` on every stub: `Act VI scaffold — no still; do not seed`.

---

## Pipeline stubs

- `src/game.js` `ACT_ZONES` already lists Act VI · The Backcountry.
- `pack/08_PSDP_SKILLS.json` — Skills twelve / thirteen added this pass.
- `pack/07_DOL_SECTIONS.json` — 4.7 parent, 4.8, 4.15 parent + Uncontrolled child, 5.6 Curves.
- `cards/takes/WAVE1_MAP.md` — Act VI wave map placeholder (no takes).
- `PLAYTEST.md` — scaffold note only; do not seed.
- `scripts/authoring-seat.js` — `ACT_DRIVER.VI = ali`.
