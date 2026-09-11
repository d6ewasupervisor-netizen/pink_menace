# IV-004 — regen after Claude FAIL on take 43 (PR #77)

Branch from `cursor/promote-menace-cabin-6b66` so cabin lock + daylight
negatives stay. **Plate-pool fix:** `pink_menace_exterior` now attaches
`ref_car_nose_plow.png` (PR #69 take 5) on every Menace exterior compile.
Rear / flank / corner plow plates are banned.

Card JSON is sole brief authority. Overcast PNW daylight. Not seeded.
No Act I–III. IV-005 / IV-012 / IV-026 / IV-027 / 028 / 030 untouched.

## Attachments

| Card | Camera | Attach |
|---|---|---|
| IV-004 | `POV_ROADSIDE` | `ref_car_exterior.jpg` + `ref_car_nose_plow.png` |

`ref_cockpit.jpg` is banned. `ref_car_rear_plow.jpg` / flank / corner plow
plates are banned.

Compile check: IV-004 attachments are `ref_car_exterior.jpg`,
`ref_car_nose_plow.png`.

## FAIL this pass is fixing

| Card | Take-43 residual | Fix |
|---|---|---|
| **IV-004** | Plow on the rear; person walking in the open; pair parallel | Attach nose plow plate; Menace moving in-lane, still short of the person; pedestrian mid-step from the gap (occluded); clean rear |

## Closest for Claude muted-read

| Card | Lesson | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-004** | a person is stepping out from between parked cars into the travel lane | `POV_ROADSIDE` | `cards/takes/IV-004-take-63.png` | take 67 |

### IV-004 take 63

KEEP vs take 43: the promoted nose plate reached the compile. Full-width
blade is on the FRONT bull bar; rear engine lid is clean (thin bumper only).
Beetle is in the travel lane and SHORT of the person. Daylight, mesh, riveted
door, knobbies. Street reads.

Residuals: heading is more rear-right three-quarter / profile than dead-away
(nose points right, not straight at the top). Person still walking in the
open between the van and sedan, not mid-step out of a gap. Beetle still
reads parked-ish. Pair still parallel. Extra roof cage bar.

### IV-004 take 67

KEEP: away-er heading (rear nearer camera); front blade peeks at the
far/right-front corner; clean rear; Beetle short of the person; daylight /
mesh / street.

Residuals: front blade can read as a corner peek rather than a full-width
nose plate. Person still in the open. Pair parallel. Stationary stance.

## Discard this pass

- Rear plow (take-43 class): 51, 52, 58, 60, 61
- Clean rear, no visible front blade, person in the open: 53, 54, 55, 57, 62, 65
- Person in the sedan/van gap but Beetle even with them, no front blade: 56, 59
- Front blade + clean rear but person at an open van door / wrong heading: 64
- 66: similar to 67, weaker

## This pass (not seeded)

- IV-004: `cards/takes/IV-004-take-51.png` … `take-67.png`
- Closest: take 63
- Runner-up: take 67
