# IV-005 — regen after double-threat brief fix (PR #94)

Branch from `cursor/fix-iv-005-double-threat-f6a6`. Card JSON is sole
brief authority. Overcast afternoon daylight. Seeded take 97
(`cards/IV-005.png`). Pack allowlists `4.1 Sharing with people` and
`Skill ten: city driving – part one` so `npm run seed -- IV-005` can
write (PR #101 live seed failed that check). No Act I–III.

## Claude muted-read (a8a5ebe4)

Take 97 — PASS. Sedan ahead in her lane with brake lights lit,
crosswalk bars visible, pedestrian mid-crossing at the sedan's right
rear — partly behind it. Double threat reads. Seeded take-97.

Take 95 — FAIL (do not seed 95).

## Why this pass

PR #91 / #81 / #85 patched this card as a cover-the-brake / brake-81
foot frame. That belongs to IV-001-brake and IV-028. PR #94 rewrote
the brief: **POV_COCKPIT looking forward through the windshield. No
pedals in the shot.**

LOCKED SET is one block in `cards/takes/IV-005.prompt.txt`. Discard any
take that shows pedals / boot / footwell / brake pad / cover_the_brake
/ brake-81.

## Attachments

- `ref_menace_cabin.png` (promoted take 16, sha256
  `3576270ee32f8759060cf63cfdf7a74e4ed32308f3907696bce0de4ef24c5a46`)
  for wheel / dash / coarse mesh. Generation used a forward crop that
  cuts the plate's pedal box so this card cannot inherit the downward
  cabin camera.
- `ref_car_exterior.jpg` (plow if glimpsed). Ignore salt-flat sunset.

`ref_cockpit.jpg` is banned. `ref_brake_cover.png` is not attached.

## Closest for Claude muted-read

| Card | Lesson | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-005** | the sedan is stopped for a pedestrian still in the paint; the empty left lane is a trap, not a pass | `POV_COCKPIT` forward | `cards/takes/IV-005-take-97.png` (Claude PASS a8a5ebe4, live) | take 90 |

### IV-005 take 97 (Claude PASS a8a5ebe4 — seeded live)

Same cabin, no pedals. Sedan ahead in her lane with brake lights lit,
crosswalk bars visible, pedestrian mid-crossing at the sedan's right
rear — partly behind it. Double threat reads. Live still:
`cards/IV-005.png` (`cmp` identical to take-97).

### IV-005 take 95 (Claude FAIL — do not seed)

KEEP vs every prior IV-005 wave: camera looks forward through the
windshield. Cabin lock holds (painted dash, single nacelle, unbranded
wheel, coarse mesh). **No pedals, no boot, no footwell.** Sedan stopped
ahead, brake lamps lit. Pedestrian is only a head / shoulder / bag on
the right of the sedan. Empty left travel lane with a white dashed
line.

Claude FAIL: crosswalk bars missing; peek sits at the sedan's
rear-right more than a mid-crossing stride in worn paint. Do not seed.

### IV-005 take 90

Closer sedan, person nearer the body, white dashed trap lane, no
pedals. Residual: full figure; invented plate numerals.

## This pass (take 97 seeded live)

`cards/takes/IV-005-take-85.png` … `take-100.png`

Discard:
- Pedals / boot / footwell: **none** (whole batch)
- 89 / 94: no pedestrian
- 91: lost the mesh; full figure in the open
- 99: person in the empty left (wrong half — teaches the trap as the path)
- 85 / 86 / 88: yellow centerline (two-way, not same-direction trap)
- 87: invented black bar in the glass
- 92 / 96 / 98 / 100: person a full figure well clear of the nose
- 93: coat sliver only — hide is right, too small at 390px
- 95: Claude FAIL (do not seed)

Winner: 97 (Claude PASS a8a5ebe4, live). Person-findable sibling: 90.

## Out of scope

IV-004. IV-012. IV-026 take-110. IV-027 / 028 / 030. Act I–III.
