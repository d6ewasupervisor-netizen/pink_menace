# Act V wave-4 take map (not a compile brief)

Card JSON is the sole brief. This file only names closest / runner / residual.

V-004 / V-005 / V-007 stay on the muted-read regen PR. Out of scope. Do not reuse those pixels.

| Card | Title | Camera | **Closest** | **Runner** |
|---|---|---|---|---|
| **V-009** | Small Hands at Speed | `POV_ROADSIDE_PROFILE` | **take 2** `V-009-take-2.png` | take 3 `V-009-take-3.png` |
| **V-010** | One Lane, Then Sit | `POV_DIAGRAM` | **take 3** `V-010-take-3.png` | take 1 `V-010-take-1.png` |
| **V-012** | Three Seconds Here Too | `POV_DIAGRAM` | **take 5** `V-012-take-5.png` | take 6 `V-012-take-6.png` |
| **V-013** | Let Hollis Have It | `POV_MIRROR_REAR` | **take 6** `V-013-take-6.png` | take 4 `V-013-take-4.png` |

## Residuals already visible

- **V-009 take 2:** true left-to-right profile; long flank; nose plow at the right; mesh + riveted plate; body not leaning. Residual: two-lane read (one near line), not a clear center of three; slight product-render cleanliness.
- **V-009 take 3 (runner):** same profile class, cleaner still. Residual: same missing third lane.
- **V-010 take 3:** Beetle and box stacked in one lane; Menace sitting; concrete median; not a lane-closure sign. Residual: two travel lanes, not three; black bar on the tail (nose plow weak).
- **V-010 take 1 (runner):** closer to three lanes; same-lane stack. Residual: yellow left edge; plow language on the tail.
- **V-012 take 5:** sedan + Beetle + box; dark pavement stain as a fixed count mark; no speedometer / sign icons; no caption. Residual: two-lane + yellow; stain sits in the sedan's lane, not a third middle lane; gap shorter than four lengths.
- **V-012 take 6 (runner):** three lanes, concrete median, sedan in the middle, Beetle/box in the right. Residual: no stain; sedan almost even with the Beetle (gap weaker).
- **V-013 take 6:** lifted truck fills the interior rearview; rain; cabin mesh + faded pink dash; no second occupant. Residual: a sliver of road still countable under the bumper; nacelle faces the camera; dusk copper rim is weak (gray/fog).
- **V-013 take 4 (runner):** same class, slightly more road around the truck.

## Discard (keep in pool, do not pick)

- **V-009 take 1 / take 4:** 3/4 front, headlights toward camera — not `POV_ROADSIDE_PROFILE`.
- **V-010 take 2:** box in a different lane. **Take 4:** second pink Beetle + one facing the camera.
- **V-012 take 1:** Beetle facing the camera. **Take 4:** burned-in caption text.
- **V-013 take 3:** more countable gap; warmer sunset wash.

Do not seed. Do not live-DB. Do not merge.
