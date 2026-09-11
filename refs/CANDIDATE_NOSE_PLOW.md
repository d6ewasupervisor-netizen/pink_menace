# Candidate nose plow plate — NOT PROMOTED

Claude must **PASS** a muted-read on this plate before anyone wires it into `pink_menace_exterior`, `refs/LOCKS.md`, `pack/09_REF_MAP.json`, `pack/03_IMAGE_COMPILER_PROMPT.md`, or `scripts/compile-prompt.js`.

This PR is generate-only. Do not promote. Do not regen IV-026 from it. Leave PR #66 unmerged.

## Why a new plate

Claude rejected promoting Tyson’s rear photo (`refs/ref_car_rear_plow.jpg` on PR #66). That photo reads as a **left-flank blade on a side arm ahead of the front wheel**, with a **plain tube nose bumper**. That contradicts LOCKS text (wide nose blade on the black tube bull bar) and would poison `pink_menace_exterior` for Acts V–VII.

`refs/ref_car_exterior.jpg` already has the correct nose geometry, but it is golden-hour salt-flat light. Negative-block fights need a square plate in the game’s own overcast light.

## Pick

| Role | File | Take |
|---|---|---|
| Closest | `refs/ref_car_nose_plow_candidate.png` | 5 |
| Runner-up | `refs/ref_car_nose_plow_candidate_runnerup.png` | 6 |

Variants: `refs/candidates/nose-plow-take-1.png` … `take-6.png`. Prompt: `refs/candidates/nose-plow.prompt.txt`.

All takes are 1024×1024. Attached lock: `refs/ref_car_exterior.jpg`.

## Takes

| Take | Call | Notes |
|---|---|---|
| 1 | discard | Winged nose blade, empty horizon still reads salt-flat |
| 2 | discard | Bare trees (good light), blade too flat / rectangular |
| 3 | discard | Wettest pavement, blade flattest |
| 4 | discard | Winged blade, empty horizon |
| 5 | **closest** | Full-width winged blade on the black tube bull bar; wet lane; bare trees; flanks clean |
| 6 | **runner-up** | Same plow read, slightly more 3/4, wet lot |

## Brief vs residuals (Claude muted-read)

Required: overcast neutral light · low three-quarter FRONT · nose square to camera · blade full-width on the black tube bull bar · nothing on the flanks · Menace silhouette matching `ref_car_exterior.jpg` · square plate · game light · reference plate, not a card still.

Residuals on the pick (take 5):

- Camera is low front 3/4, not bumper-height. Nose is square enough that the blade reads as a full-width slab.
- Riveted **rear-quarter** plate is weaker than on `ref_car_exterior.jpg` — this angle shows the door plate.
- Still slightly CGI-smooth, same class as the existing exterior lock.
- Centerline on take 5 is setting, not card chrome.

Muted-read the plate must teach: **wide flat blade on the black tube bull bar at the nose; nothing on the flanks.**
