# NEXT STILLS — IV-010 portrait regen (takes 12–19)

Not seeded. No live Postgres. No `imageUrl` bump. No plate overwrite. No IV-018. No IV-029. No Act V.

Card JSON is sole brief authority. Plates attached: `refs/ref_yuna.png` (Y2 take 1) + `refs/ref_yuna_sheet.png` (Y1 take 6). PR #134 re-verify **PLATES OK keep** — plates not regenerated.

Judged against **those plates + seeded take-7** (`cards/IV-010.png`, sha256 `64cd6a2878ee5dc364bc10c528ee8b38bf82364ed5daf0849ac2bd462f3001c5`). **Not** against PR #130 takes 11 / 9 (Claude FAIL, cousin faces).

Every take send: **card_id** + **lesson** + **shot token**.

| Card | Lesson | Shot | Closest | Runner-up |
|---|---|---|---|---|
| **IV-010** | both in-ears are out; the taped schedule is on the door behind her | `POV_PORTRAIT` | `cards/takes/IV-010-take-18.png` | `cards/takes/IV-010-take-13.png` |

Live still stays take-7 until Claude muted-read PASSes a new take. Do not promote without Claude.

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

Costume checklist is not a face lock. Face lock held this wave. IEM state and door lettering are the residuals.

---

## Closest — take 18

KEEP vs the brief + plates + take-7: (1) **same face** as Y2 / take-7. (2) **Both ears empty.** Both buds dangling on the cord. (3) House door with a taped schedule sheet behind her. (4) Dark hatchback flank left of frame, no chevron. (5) Braid at her right temple, platinum under-layer, cropped piped windbreaker. (6) Faintly amused, chin level.

Residual: the door sheet is a printed grid with garbled title-card letters (`WEEKLYLY REHEARSAL SCHEDDELLE` / `MONNESTION`). Same text/UI class that discarded PR #130 take 10. Readable as a taped schedule at 390px; letters are invented. Expression stiller than “not still.”

## Runner-up — take 13

Same face lock. **Both ears empty.** Both buds on the cord. Hatchback flank clearer than 18. Taped schedule on the door. Braid side / platinum / jacket hold.

Residual: same lettered garbled poster. Door reads more garage-blank than a house door. Slightly broader smile than “faintly amused.”

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

## Wave residuals (for Claude)

1. **Text / UI on the door** — all eight printed a readable schedule and invented letters. Take-7’s blank taped sheet is cleaner against the negative block; this wave is more obviously a schedule. Claude should decide whether garbled title-card type fails the muted read.
2. **Y2 one-in bleed** — 12 / 15 / 17 / 19. Do not promote.
3. **Hatchback missing** — 12 / 14.
4. Live `cards/IV-010.png` = take-7 **STANDS**. Do not seed. Do not bump `imageUrl`.

---

## Out of scope (untouched)

- `refs/ref_yuna.png` / `refs/ref_yuna_sheet.png`
- IV-018 (seeded take 1)
- IV-029 (take-16 PASS)
- Act V
- Live Postgres
