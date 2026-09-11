# IV-004 — regen after Claude FAIL on take 63 (PR #79)

Branch from `cursor/iv-004-nose-plow-pool-da02` so the nose-plow pool
fix stays. **This pass:** `ref_car_nose_plow.png` is attached DIRECTLY on
every IV-004 GenerateImage call (plus pool + `ref_car_exterior.jpg`).
Rear / flank / corner plow plates stay banned.

Card JSON is sole brief authority. Overcast PNW daylight. Not seeded.
No Act I–III. IV-005 / IV-012 / IV-026 / IV-027 / 028 / 030 untouched.

## Attachments

| Card | Camera | Attach |
|---|---|---|
| IV-004 | `POV_ROADSIDE` | `ref_car_exterior.jpg` + `ref_car_nose_plow.png` (direct) |

`ref_cockpit.jpg` is banned. `ref_car_rear_plow.jpg` / flank / corner plow
plates are banned.

Compile check: IV-004 attachments are `ref_car_exterior.jpg`,
`ref_car_nose_plow.png`.

## FAIL this pass is fixing

| Card | Take-63 residual | Fix |
|---|---|---|
| **IV-004** | Narrow flap (~1/3 width) on the right of the bull bar, not the plate's full-width blade; Beetle parked-diagonal, nose toward curb, no motion | Direct-attach nose plow plate; blade spans full bull-bar width, edges ~level with front wheels; Menace squared in-lane and moving (tire spray, nose straight); keep take-63 hazard distance |

Take 67: same flap + diagonal; hazards further away. Keep take 63's scene.

## Closest for Claude muted-read

| Card | Lesson | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-004** | a person is stepping out from between parked cars into the travel lane | `POV_ROADSIDE` | `cards/takes/IV-004-take-103.png` | take 74 |

### IV-004 take 103 (closest)

KEEP vs take 63: the attached nose plate reached the pixels. Full-width
blade is on the FRONT bull bar — one continuous wide flat plate, outer
edges roughly level with the front wheels, matching `ref_car_nose_plow.png`.
Beetle is squared in-lane and MOVING (wet tire spray). Person is between
the rusted van and the gray sedan, one foot toward the travel lane.
Beetle is large / short of a distant horizon (take-63 closeness class).
Mesh, riveted door, knobbies. Overcast daylight. Clean of a rear plow.

Residuals: heading is **toward camera** (geometry wants `away_from_camera`,
plow toward the top of the frame). Person reads more in the open between
the pair than occluded mid-step from the gap. Pair still parallel-parked
(take-63 scene, which Claude called OK).

### IV-004 take 74 (runner-up)

KEEP: same full-width FRONT blade + in-lane tire spray. Street is closer
to take 63 (houses, centerline, van+sedan at the right curb, Beetle large).
Mesh / knobbies / overcast.

Residuals: also toward-camera. Person walking in the open rather than
mid-step from the gap. Sedan and van more separated than a tight gap.

### Away-family keep (if heading is a hard reject)

`cards/takes/IV-004-take-76.png` — take-63 scene and hazard distance,
squared in-lane, visible tire spray, clean rear. Residual: the far-front
blade is still the take-63 **narrow flap**. This is the parked-diagonal
fix without the plate's blade. Do not pick over 103 unless toward-camera
is an automatic fail.

## Discard this pass

- Rear plow / dual plow (wide plate on the near bumper): 68, 71, 73, 89, 99, 100, 102, 105, 107
- Toward-camera, full-width front blade, weaker than 103/74: 69, 72, 75, 104
- Away, motion, flap or no readable front blade: 70, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 91, 92, 93, 94, 95, 96, 97, 98, 101, 106
- 76 kept as the away-family note above

## Compiler note

Away + full-width front blade did not co-occur in 40 takes (68–107). The
plate's front three-quarter is copied as a toward-camera car; dead-away
hides the plate or shrinks it to a flap; asking for the plate's width on
an away car often welds that plate onto the rear. Direct-attach fixed
*what* the blade is when the nose faces the lens. It did not rotate that
blade onto the far end of an away Beetle.

## This pass (not seeded)

- IV-004: `cards/takes/IV-004-take-68.png` … `take-107.png`
- Closest: take 103
- Runner-up: take 74
- Away-family keep: take 76
