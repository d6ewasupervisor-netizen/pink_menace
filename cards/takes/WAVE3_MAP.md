# Act V wave-3 take map (not a compile brief)

Card JSON is the sole brief. This file only names closest / runner / residual.

PR #173 V-008 take-5 / take-6 FAIL (Claude): wrong shot token (chase / work-zone). Do not reuse those pixels. Fresh V-008 pool below is `POV_COCKPIT` from `cards/V-008.json`.

| Card | Title | Camera | **Closest** | **Runner** |
|---|---|---|---|---|
| **V-004** | The Meter Is a Light | `POV_OBJECT` | **take 2** `V-004-take-2.png` | take 1 `V-004-take-1.png` |
| **V-005** | Match Them Before Paint | `POV_COCKPIT` | **take 1** `V-005-take-1.png` | take 4 `V-005-take-4.png` |
| **V-007** | Slow On the Ramp | `POV_OBJECT` | **take 5** `V-007-take-5.png` | take 2 `V-007-take-2.png` |
| **V-008** | Posted Before the Bend | `POV_COCKPIT` | **take 8** `V-008-take-8.png` | take 7 `V-008-take-7.png` |

## Residuals already visible

- **V-004 take 2:** two-head red over a white stop line; ramp rises away. Residual: rural two-lane, not a clearly freeway on-ramp foot; pole sits on the line.
- **V-005 take 1:** cabin lock + mesh + handheld on the floor + a truck ahead. Residual: already reads as highway, not an on-ramp; no plow bar; truck is a distant box, not a dirty day-cab in a right-lane merge; two-lane yellow.
- **V-007 take 5:** `EXIT ONLY` spelled; rain; lanes below still moving. Residual: one panel, not a full gantry face; lanes are two, not three.
- **V-008 take 8:** cockpit + mesh + large advisory **25**; pavement under the hood still straight; no I-5 beside the hood; no second occupant. Residual: cluster needle not high; no plow bar; 25 sits in the mesh (near) rather than down the ramp; no bend visible yet.

Do not seed. Do not live-DB. Do not merge.
