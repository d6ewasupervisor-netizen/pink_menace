# IV-006 Tracks in the Lane — regen against take-8 nose plow

Authority: `cards/IV-006.json` `image_brief` only. Base PR #121
(`cursor/promote-plow-take-8-db6b`) so `refs/ref_car_nose_plow.png` is
take-8 (`sha256:c6c8ec1fe709ddb8329e7b5def830dae0959002bf838ba1afcdbaf51d63d1133`).

Audit PR #123: seeded take-1 puts a wide blade on the **REAR** (oval
window). Plow is the orientation anchor. Wrong end.

This pass attaches take-8 and recompiles. Closest must have the plow on
the **NOSE**, not the rear. Rear (oval engine lid / rear window nearer
camera) stays clean.

Not seeded. No `cards/IV-006.png`. No Act I–III. IV-004 / IV-026
untouched.

## Locked brief

- `POV_DIAGRAM`, away. Rear nearer camera; plow at the far leading end
  (toward the top of the frame).
- RIGHT of frame: pink Beetle in the right travel lane, rails in that
  lane, light-rail car two lengths ahead on those rails.
- LEFT of frame: empty travel lane.
- Wet skip-dashed white between the two lanes. LEFT edge is a curb, not
  a yellow line.
- Wind, night, downtown lamps.
- Read: the rails and the train occupy the Beetle's lane; the left
  travel lane is empty.
- Take-8 plow: one flat blade spanning the entire nose on the black-tube
  bull bar; clean flanks; **no blade on the rear**.

## Closest for Claude muted-read

| Card | Lesson (`read`) | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-006** | the rails and the train occupy the Beetle's lane; the left travel lane is empty | `POV_DIAGRAM` | `cards/takes/IV-006-take-11.png` | take 10 |

### IV-006 take 11

KEEP: night wet downtown. Oval rear window + chrome bumper nearer the
camera — **no blade on the rear**. A dark rectangular plow plate sits on
the FAR nose (black-tube bar, toward the top of the frame). Beetle right
of the skip-dashed line; left travel lane empty. Two rails inset in the
Beetle's lane. Light-rail car ahead, lamps on, same direction. Streetlamps
and brick edges. No yellow centerline.

Residuals: more nadir than 15–20° oblique. Train sits left of the
Beetle's centerline (almost on the lane line) — same-lane stack is
softer than take 8. Blade is a left-front plate + bar, not a perfect
take-8 full-width span at 390px. Mesh readable on the rear glass only.
Knobbies / riveted door plate weak from overhead. Train farther than two
lengths.

### IV-006 take 10 (runner-up)

KEEP: same night-downtown family. Plow on the FAR nose; rear oval +
chrome bumper clean. Rails in the right-hand lane; left lane empty wet
asphalt. Streetlamps, wet reflections, brick. No destination garbage.

Residuals: train more centered than the Beetle (weaker same-lane read
than 11). Blade still a bar/plate, not a full take-8 rectangle. Same
nadir / identity-from-overhead residuals.

Discard:
- 5 — plow on the nose, but train in a different lane; invented pavement
  arrow; no downtown
- 6 — no train; invented sign text (`WILPFOLT`)
- 7 — plow on the nose; train offset; less downtown
- 8 — best same-lane rail stack, but plow reads as a thin hoop; street
  is highway more than downtown night
- 9 — same family as 10/11; train too centered / not clearly same lane
- 12 — garbled destination board (`BB4SEMEM`); otherwise 10/11 family
