# NEXT STILLS — IV-010 portrait regen (takes 12–19)

**Seeded.** Claude muted-read PASS on PR #136 take-18 (primary chat a8a5ebe4). Live plate is byte-identical to `cards/takes/IV-010-take-18.png`. Take-13 FAIL (garbled/placeholder schedule + crop) — not seeded. `imageUrl` bumped `?v=a69`. No plate overwrite. No IV-018. No IV-029. No Act V.

Card JSON is sole brief authority. Plates attached: `refs/ref_yuna.png` (Y2 take 1) + `refs/ref_yuna_sheet.png` (Y1 take 6). PR #134 re-verify **PLATES OK keep** — plates not regenerated.

Judged against **those plates + previous live take-7** (`64cd6a2878ee5dc364bc10c528ee8b38bf82364ed5daf0849ac2bd462f3001c5`). **Not** against PR #130 takes 11 / 9 (Claude FAIL, cousin faces).

Every take send: **card_id** + **lesson** + **shot token**.

| Card | Lesson | Shot | Seeded (Claude PASS) | Runner-up (FAIL) |
|---|---|---|---|---|
| **IV-010** | both in-ears are out; the taped schedule is on the door behind her | `POV_PORTRAIT` | `cards/takes/IV-010-take-18.png` | `cards/takes/IV-010-take-13.png` |

`variation.winner` / art-review pick lock take-18. Take-7 superseded.

---

## Brief lines followed (sole authority)

`cards/IV-010.json` `image_brief`:

- camera: `POV_PORTRAIT`
- subject: Yuna chest-up beside a dark hatchback, asymmetric chin-length bob with platinum under-layer, retroreflective tape in the right-temple braid, dead in-ears around her neck **both out**
- foreground: cropped black windbreaker with retroreflective sleeve piping, high-tops out of frame
- midground: her face, no glasses, chin level, faintly amused, not still
- background: overcast studio-house driveway, taped paper on a door, wet pavement, hatchback flank out of focus with no readable chevron
- read: both in-ears are out; the taped schedule is on the door behind her
- extra_negatives: no Encore four-view · no horn flares as the subject · no chevron readable · no mesh

Compile: `cards/IV-010.compile.txt` / `cards/takes/IV-010.prompt.txt`. Assembler `scripts/compile-images.js` still emits Ali cranberry on this card; this wave used the pack/03 Yuna expansion + silver-white accent + both-out override (same path as PR #130).

---

## Identity vs plates + take-7

This is the check that failed 11 / 9.

| Mark | plates / take-7 | this wave (all eight) |
|---|---|---|
| Same face as Y2 / take-7 (not a cousin) | lock | **holds** — bone, eyes, mouth, hairline match the plates |
| Asymmetric chin-length bob | yes | yes |
| Platinum under-layer | yes | yes |
| Thin braid at **her right** temple | yes | yes |
| Cropped black windbreaker + reflective piping | yes | yes |
| Dead in-ears | plates: right in / left dangling · take-7: both out | split — see takes |

Costume checklist is not a face lock. Face lock held this wave.

---

## Seeded — take 18 (Claude PASS)

KEEP vs the brief + plates + take-7: (1) **same face** as Y2 / take-7. (2) **Both ears empty.** Both buds dangling on the cord. (3) House door with a taped schedule sheet behind her — Claude: door schedule resolved/coherent. (4) Dark hatchback flank left of frame, no chevron. (5) Braid at her right temple, platinum under-layer, cropped piped windbreaker. (6) Colder flatter world grade. Identity matches Yuna plates.

Claude muted-read preferred take-18. Live still: `cards/IV-010.png` (`cmp` identical to take 18). `variation.winner` = `take-18`.

## Runner-up — take 13 (Claude FAIL)

Same face lock. **Both ears empty.** Both buds on the cord. Hatchback flank clearer than 18. Taped schedule on the door. Braid side / platinum / jacket hold.

Claude: garbled/placeholder schedule + crop. Do not seed.

## Same-family

- **16** — both ears empty, hatchback, schedule on the door, face lock. Stiller than 18. Same lettering residual.
- **14** — both ears empty, face lock, faintly amused. **No hatchback.** Lettered schedule on a garage door.

## Discard this wave

Y2 lock bleed (right IEM in the ear) — same miss as PR #130 take 8 / 10:

- **12** — right earpiece in. No hatchback. Lettered schedule.
- **15** — right earpiece in. Hatchback present. Lettered schedule.
- **17** — right earpiece in. Hatchback present. Lettered schedule + denser fake list.
- **19** — right earpiece in. Hatchback present. Lettered schedule (tape corners at least read as taped paper).

---

## Live plate (this seed)

| File | Bytes | MD5 | SHA256 | Size |
|---|---|---|---|---|
| `cards/takes/IV-010-take-18.png` / `cards/IV-010.png` | 232868 | `7ecf49c82d91859d8e9d372a85617c8f` | `4db9119ffff129d132c4b362f1cc4ed1bd9736c63c5815f878d43dcd4f7975fc` | 864×1152 |

Encoded WebP (`scripts/encode-still.py`): IV-010 `6266ebcc50e7159ecd1d8695258555ec` (42798 B). Live Postgres MATCH on the public Railway proxy.

Take-7 (`64cd6a28…`) superseded. Take-13 stays in the takes pool — FAIL, do not promote.

## Out of scope (untouched)

- `refs/ref_yuna.png` / `refs/ref_yuna_sheet.png`
- IV-018 (seeded take 1)
- IV-029 (take-16 PASS)
- Act V
- No art regen
