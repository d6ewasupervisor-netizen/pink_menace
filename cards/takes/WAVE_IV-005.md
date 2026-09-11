# IV-005 — regen after Claude FAIL on takes 65/60 (PR #81)

Branch from `cursor/regen-iv-005-brake-719d` so the promoted Menace
cabin lock (take 16) and the take-51–66 pool are present. Card JSON is
sole brief authority. Overcast PNW daylight. Not seeded. No Act I–III.

Claude said take 60 is closer — KEEP base is take 60.

## FAIL this pass is fixing

Claude muted-read FAIL on `cards/takes/IV-005-take-65.png` /
`cards/takes/IV-005-take-60.png` (PR #81):

| | |
|---|---|
| **KEEP (take 60)** | Cabin, bent-knee hover, sedan, empty left, daylight. |
| **FAIL take 65** | Boot further left/higher over floor; brake pad unused to its right; pedestrian at far side of the stopped car’s rear (door-stander, not crosswalk). |
| **FAIL take 60** | Boot on bare floor left of the pedal box; brake pad unused to its right; pedestrian past the nose mid-crossing (yield already made). |
| **FIX** | Take 60 unchanged for cabin / leg geometry / scene. ONLY move the boot right and center it over the brake pad: heel planted below the pad’s lower edge, ball hovering with daylight between sole and pad. Pedestrian before/at the yield — not past the nose, not at the car door. |

## Attachments

- `refs/ref_menace_cabin.png` — cabin lock (take 16)
- `cards/takes/IV-005-take-60.png` — FRAME KEEP
- `cards/takes/IV-001-brake-take-81.png` — seeded cover-the-brake hover (Claude PASS, PR #56). Posture only. Attached at generate time.
- `refs/ref_car_exterior.jpg` — plow if glimpsed
- `ref_cockpit.jpg` banned
- `refs/ref_encore_footwell.png` exists on the Encore lock PRs (empty two-pedal automatic). Not attached as cabin authority — wrong vehicle / pedal_count 2.

Compiler: `COVER_THE_BRAKE` now names heel-below-pad and forbids boot-on-empty-floor-left-of-box.

## This pass (not seeded)

`cards/takes/IV-005-take-67.png` …

Closest / residuals: pending review.

## Out of scope

Live seed. IV-004. IV-012. IV-026 take-110. IV-027 / 028 / 030. Act I–III.
