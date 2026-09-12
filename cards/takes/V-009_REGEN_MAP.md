# V-009 regen map (PR #188 FAIL → Small Hands at Speed)

Card JSON is the sole brief (`cards/V-009.json`, citation-audit ≡ wave4). `image_brief` unchanged.

**Seeded live:** take-31 (`cards/V-009.png`). Claude overflow PASS d748b5d7 (~8:45 AM PDT 2026-09-12) — hands readable. **Do not seed take-37** (Claude FAIL — hands smudged by door frame). PR #192 labeled take-37 closest / take-31 runner; seed the PASS take.

| | File | Note |
|---|---|---|
| **Winner (seeded)** | `V-009-take-31.png` | Claude overflow PASS. Same occupancy + true profile + empty near / empty far. Hands readable through near glass. Far skip-dash weaker than 37 |
| **FAIL — do not seed** | `V-009-take-37.png` | PR #192 closest. Hands + wheel + three-lane center, but Claude FAIL: hands smudged by door frame |
| Same class (multi-lane + driver) | `V-009-take-28.png` | Occupied, empty near + empty far, but slight 3/4 and an extra far lane |

## Why #188 failed

Take-20 / take-21 (and Wave4 take-2 / take-3) were true profile + plow-right + no lean, but **empty cabins** — no hands, no wheel, no driver. Same ground on occupancy. #188 also fixed the two-lane residual; that stack is kept.

## What landed

Wave D (takes 23–38). Menace plates + Ali plate (`ref_ali2.png`) for the person in the seat. Ban `ref_cockpit.jpg`. No Ribbon deck. Occupied-cabin clause replaced the old “radio voice only” line that was emptying the glass.

Take-37 is the first still that shows **hands + wheel + three-lane center** in true `POV_ROADSIDE_PROFILE`. Claude muted-read FAILed it (hands smudged by door frame). Take-31 PASSed — that is the live still.

## Discard (keep in pool)

- **#188 take-20 / take-21; Wave4 take-2 / take-3:** empty roadside profile. Do not pick as closest.
- **take-23 / take-25 / take-26 / take-35:** 3/4 front, headlights toward camera.
- **take-24 / take-27 / take-29 / take-30 / take-32 / take-33 / take-34 / take-36 / take-38:** occupied profile, hands/wheel readable, still two-lane (one near skip-dash, barrier hugging the far flank). Best occupancy in this band: take-32 / take-36.
- **take-19 and earlier 3/4 / two-lane / empty-cabin takes:** stay discarded per prior maps.

## Residuals (take-37 FAIL — do not seed)

- Door-window mesh stripped so the hands read — windshield and rear mesh stay. Model would not keep door mesh *and* readable hands in this pool.
- Far travel lane a little tight vs a full interstate lane (same class as #188 take-21).
- Full-width take-8 plow is hard to diff in true profile.
- Slight product-render cleanliness.

## Attachments

- LOCKS: `ref_car_exterior.jpg` (Menace lock sheet — there is no separate `ref_car_sheet` file), `ref_car_nose_plow.png`.
- Ali identity for the occupied cabin: `ref_ali2.png` (already mapped for Menace exteriors).
- BAN: `ref_cockpit.jpg`.
- Takes 31 / 27 / 21 / 28 used as composition refs on 31–37 only.

No Yuna. No Tower 4 kit. No flat rack. `presence` 0.
