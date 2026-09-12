# Act V wave-3 FAIL regen take map (not a compile brief)

Fresh compiles after Claude FAIL on PR #179 Wave 3. Card JSON is the sole brief.
Do not reuse PR #179 or PR #173 pixels. **V-008 is out of scope** (take-7 already PASS elsewhere).

| Card | Title | Camera | **Closest** | **Runner** |
|---|---|---|---|---|
| **V-004** | The Meter Is a Light | `POV_OBJECT` | **take 1** `V-004-take-1.png` | take 5 `V-004-take-5.png` |
| **V-005** | Match Them Before Paint | `POV_COCKPIT` | **take 9** `V-005-take-9.png` | take 5 `V-005-take-5.png` |
| **V-007** | Slow On the Ramp | `POV_OBJECT` | **take 1** `V-007-take-1.png` | take 9 `V-007-take-9.png` |

## Residuals already visible

- **V-004 take 1:** two-head red on the right shoulder beside a wet lane; white stop line; I-5 mainline with traffic beyond a barrier. Residual: the “ramp” still reads as a collector/parallel lane more than an arterial-foot on-ramp; no sedan already past the meter.
- **V-004 take 5 (runner):** clearest *separate* ramp rising toward a freeway; meter beside; stop line; mainline beyond. Residual: ramp is path-narrow; dry brown verge, less PNW wet.
- **V-005 take 9:** plow bar at the bottom of the glass; left amber lit; truck receding on the left; chevron/merge paint ahead. Residual: no cabin mesh; box trailer not a day-cab; chevrons sit in-lane rather than a gore still ahead of a separate ramp; modern cluster glyphs.
- **V-005 take 5 (runner):** mesh + truck from behind + chevrons + hood signal. Residual: still same-roadway, not a distinct on-ramp; truck is a trailer not a day-cab; no plow bar.
- **V-007 take 1:** EXIT ONLY gantry; Menace in frame; other traffic at speed; ramp peeling right. Residual: plow mounted on the *rear*; pedestrian plaque invented; two-lane not three; tail lamps read a little hot.
- **V-007 take 9 (runner):** rear engine lid nearest the camera, **no rear plow**; mesh; rain; traffic still at speed under EXIT ONLY. Residual: no clear gore/ramp peel; two-lane.

## Discard (keep in pool, do not pick)

- **V-004 take 2:** L-shaped stall paint. **Take 3:** green aspect reads lit. **Take 4:** signal on a freeway shoulder, not a separate ramp. **Take 6:** same class as take 1, weaker stop-line/ramp read.
- **V-005 takes 1–2, 6, 8, 10:** Wave-3-class empty highway / distant truck (do not promote). **Take 3:** invented pavement word `MERGE`. **Take 4:** second pink Beetle ahead; radio on the dash. **Take 7:** truck grille toward camera; gauge gibberish. **Take 11:** wrong cabin (modern VW, diamond mesh, logo).
- **V-007 take 2:** warm sky. **Take 3:** overhead diagram, rear plow. **Take 4 / 5:** plow on the tail. **Take 6:** no ramp; red pavement artifact. **Take 7:** invented `DOWNTOWNST` text. **Take 8:** Menace facing the camera. **Take 10:** black (not MUTCD-green) panel; brake lamps.

Do not seed. Do not live-DB. Do not merge. Do not touch V-008.
