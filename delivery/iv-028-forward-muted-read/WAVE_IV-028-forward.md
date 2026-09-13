# IV-028 — forward-camera only regen (WRONG_CAMERA clear)

**Scope:** IV-028 only. No IV-018. No live seed. No Acts I–III / VII.

Claude (2026-09-13): live/take-70 rear-hatch is `WRONG_CAMERA`. No correct forward take in repo with floor carrier + ahead pedestrian together. Brief authority = `cards/IV-028.json` `image_brief`, **except** camera must stay forward / cockpit-forward (override any rear-hatch / looking-back geometry).

## This wave

| Takes | Camera | Locked content |
|---|---|---|
| **83–88** | `POV_COCKPIT` forward through windshield mesh | charcoal floor carrier + both faces at grate + pedestrian mid-crossing marked zebra |

Attachments: `ref_menace_cabin.png`, `ref_gracie.jpg`, `ref_mya.jpg`, `ref_carrier.png`. In-carrier grate crops present on disk but not attached (tiny crops previously 400'd).

## Closest for Claude muted-read

| Lesson (`read`) | Closest | Runner |
|---|---|---|
| both cats' faces at the grate of the closed strapped floor carrier; person mid-crossing ahead | **take-85** | **take-88** |

### KEEP on take-85

- Forward cabin: left wheel, flat pink dash, single nacelle, coarse mesh — cannot read as rear-hatch
- Charcoal hard-shell on true floor / footwell plant
- Orange + brown coats at grate
- Pedestrian mid-crossing marked zebra through mesh
- Overcast downtown brick street

### KEEP on take-88 (runner)

Same forward geometry + downtown brick canyon + mid-crossing pedestrian; slightly different pedestrian gait / shoe read.

### Residuals (all takes)

- Seat-post body strap can still read as top wrap more than a clear post tie
- Carrier height can kiss seat-base on some frames (85/88 strongest floor plant)
- Latch readability varies; Mya cream-chest / bulk do not fully read in grate crop

## Out of pool

- Live `cards/IV-028.png` / take-70 rear-hatch — **do not seed** from this PR
- Take-83 weaker coat separation (both can drift ginger)

## Files

- `cards/takes/IV-028-take-83.png` … `IV-028-take-88.png`
- `cards/IV-028.compile.txt`
- `delivery/iv-028-forward-muted-read/`
- Plates wired: `refs/ref_menace_cabin.png`, `refs/ref_carrier.png`, cat identity crops + LOCKS / `pack/09_REF_MAP.json` (`pink_menace_interior` → cabin plate)

**Do not seed.** Live still unchanged until Claude muted-read PASS.
