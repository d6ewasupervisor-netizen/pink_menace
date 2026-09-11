# IV-004 — regen after Claude FAIL on take 103 / 74 (PR #84)

Branch from `cursor/iv-004-fullwidth-blade-2a62` so the nose-plow plate
stays attached. **This pass:** heading AWAY + a readable FAR-front blade
together. Prior batch (68–107) never landed both: the plate's front
three-quarter copied as a toward-camera car; dead-away hid the plate or
shrunk it to a flap; asking for width on an away car welded the plate
onto the rear.

Card JSON is sole brief authority. Overcast PNW daylight. Not seeded.
No Act I–III. IV-005 / IV-012 / IV-026 / IV-027 / 028 / 030 untouched.

## Attachments

| Card | Camera | Attach |
|---|---|---|
| IV-004 | `POV_ROADSIDE` | `ref_car_exterior.jpg` + `ref_car_nose_plow.png` (direct) |

`ref_cockpit.jpg` is banned. `ref_car_rear_plow.jpg` / flank / corner plow
plates are banned.

Take-76 was attached as **scene / heading / distance only**. Do not pick
it as a pass (narrow flap).

Compile check: IV-004 attachments are `ref_car_exterior.jpg`,
`ref_car_nose_plow.png`. Away Menace exteriors also compile the
rotate-the-plate clause (`MENACE_PLOW_AWAY`).

## FAIL this pass is fixing

| Card | Take-103 / 74 residual | Fix |
|---|---|---|
| **IV-004** | Full-width FRONT blade is correct — KEEP. Both 103 and 74 face toward camera. Card wants `away_from_camera` (plow toward top of frame / backside roadside like take-63 scene). Take-103 closer. | Rotate the attached plate onto the FAR front of an AWAY Beetle. Rear lid nearest camera. Keep take-63/103 scene mass + hazard distance (person between van and sedan). Squared in-lane, rolling, tire spray. Daylight. |

Do not use take-76 as a pass.

## Closest for Claude muted-read

| Card | Lesson | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-004** | a person is stepping out from between parked cars into the travel lane | `POV_ROADSIDE` | `cards/takes/IV-004-take-119.png` | take 127 |

### IV-004 take 119 (closest)

KEEP vs 103/74: heading is **away_from_camera**. Sloping rear engine lid
and rear mesh are nearest the camera. Near bumper is a thin tube — no
rear plow. Beetle is squared in-lane and MOVING (wet tire spray). Far
front wears a real snowplow plate (tall dozer face, not the take-63/76
narrow flap). Take-63/76 scene mass: houses, centerline, rusted van +
gray sedan, Beetle large / short of the pair. Mesh, riveted door,
knobbies. Overcast daylight.

Residuals: the far blade still reads as a **right-side plate**. The left
edge does not peek past the left front corner, so it is not yet the
plate's proven full-width span (both edges level with the front wheels).
Person walks in the open between the pair rather than occluded mid-step
from the gap. Pair still parallel-parked (take-63 scene).

### IV-004 take 127 (runner-up)

Same away heading, thin rear tube, tire spray, take-63 street, large
far-right dozer face. Slightly cleaner blade than 119. Same residuals
(right-side plate, not both edges; person in the open).

### Same-family keep

120, 125, 126 — away + large far-right plow + spray + take-63 street.
113 is the first take in the batch where the far blade grew past the
76 flap. 129 / 130 are away + large far plow from the **left** rear-¾
(wrong curb vs the brief's right-curb pose).

## Discard this pass

- Toward-camera, full-width front blade: 122, 123
- Rear plow / dual plow (wide plate on the near bumper): 114, 121, 124, 128
- Away, flap or no readable far blade (take-76 class): 108, 109, 112, 115, 116, 117, 118
- Plow jumped onto the sedan: 110, 111

Catalog probes (not card takes): empty-lot a–c welded the full blade
onto the rear; d was overhead flap-on-far; e–f copied the 76 flap.

## Compiler note

Take-76 as a heading lock stopped the toward-camera leak. Direct-attach
then either (a) widened the far-right plate into a real dozer face
(119 family) or (b) welded the plate onto the rear / the sedan.
Both edges of a full-width far blade still did not co-occur with away
heading. `MENACE_PLOW_AWAY` is the standing clause for that rotate.

## This pass (not seeded)

- IV-004: `cards/takes/IV-004-take-108.png` … `take-130.png`
- Closest: take 119
- Runner-up: take 127
- Same-family: 113, 120, 125, 126
