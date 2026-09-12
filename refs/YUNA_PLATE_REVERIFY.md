# Yuna plates — re-verify (12 Sep 2026)

**Verdict: PLATES OK keep.** No plate regen. No card-art regen in this PR.

Claude muted-read on PR #130 failed IV-010 takes 11 / 9 for identity drift (wrong face / bob / jacket vs Yuna canon). Seeded IV-010 take-7 **STANDS**. This pass re-checks the live plates before any further portrait work.

## Wiring (`yuna`)

| Path | Status |
|---|---|
| `pack/09_REF_MAP.json` token `yuna` | `ref_yuna_sheet.png`, `ref_yuna.png` — both present |
| `scripts/resolve-refs.js` on `IV-010.json` | attaches both files; no errors |
| `pack/03` attach map / pack/07 lock names | same two files |
| Plate git history | unchanged since `3adfb3a` (24 Aug 2026 lock) |

## Canon checklist (bible §3.3 / pack/07 Y1–Y2)

| Mark | `ref_yuna.png` (Y2 take 1) | `ref_yuna_sheet.png` (Y1 take 6) |
|---|---|---|
| Asymmetric chin-length bob | yes | yes, all three panels |
| Platinum under-layer | yes, flashes at the fall-away | yes |
| Thin braid at **her right** temple (viewer's left, facing) | yes; silver tape woven | yes; first four lock takes had put it on her left — take 6 corrected |
| Cropped black windbreaker + reflective sleeve piping | yes | yes |
| Dead in-ears — one in, one dangling | right IEM in, left dangling | same in all panels |
| Light-medium skin, no glasses | yes | yes |

Sheet and portrait are the same person. Braid side is consistent (her right). Do not mix with the discarded left-braid Y1 takes.

## vs seeded IV-010 take-7

Take-7 is the live still. Bytes match:

- `cards/IV-010.png` = `0ec0273:cards/takes/IV-010-take-7.png`
- sha256 `64cd6a2878ee5dc364bc10c528ee8b38bf82364ed5daf0849ac2bd462f3001c5`

Take-7 is the same face as the plates (same bob, platinum, right-temple braid, cropped piped windbreaker). Card-correct difference only: **both in-ears out** (IV-010 brief: "both out for once"). Plate default remains one-in / one-dangling.

PR #130 takes 11 / 9 keep the costume marks and still fail identity — cousin faces, not the locked plate. Costume checklist is not a face lock.

## Do not

- Regenerate `ref_yuna.png` or `ref_yuna_sheet.png`
- Promote PR #130 take 11 or 9
- Bundle plate work with IV-010 / IV-018 / IV-029 card art
- Accept a first take on a face-critical Yuna card

## Brad — next step

Keep the plates. Keep live IV-010 = take-7.

The next portrait job (IV-010 regen or IV-029, **separate card-art PR**) must:

1. Attach both verified plates (`yuna` → `ref_yuna_sheet.png` + `ref_yuna.png`).
2. Run **eight takes** (pack/12). Never ship a first take.
3. Judge face against **these plates + take-7**, not against take 11 / 9.
4. Send the eight for Claude muted-read. Do not promote or seed without Claude.
