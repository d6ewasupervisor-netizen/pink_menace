# Encore cockpit — muted-read handoff

Claude chose **Option 1**: keep **Y4 take 1** as Encore cockpit authority.

Do **not** promote Y4 take 7. Take 7 has a **floor shifter** and conflicts with the locked **two-pedal** footwell (take 6).

## Authority

| | |
|---|---|
| Winner | **Y4 take 1** |
| Live plate | `refs/ref_encore_cockpit.png` |
| Original take-1 bytes | `cards/takes/Y4-take-1.png` (same file as `refs/ref_encore_cockpit_y4_take1.png`) |
| sha256 | `85bd45ee9765ab988622706412cbbbb80c50750db7b2a2609f1517e6e146dad9` |
| Prefix check | Matches `85bd45ee` |

These three paths are the **same bytes** as main’s live plate (commit that owns the plate: `8515c82`). Claude has not muted-read this plate. Brad uploads take 1 next.

The later enclosed-cabin series on `cursor/encore-batch-a-e489` (`cards/takes/Y4-take-1.png` there, sha `a6998274…`, switch-label text) is **not** this lock. Do not swap it in.

## Rejected

| | |
|---|---|
| Y4 take 7 | Floor shifter. Rain-glass / cluster / switch / cage cues only during footwell generation. **Never promoted.** Lives on other PRs (`cards/takes/Y4-take-7.png`); not copied here on purpose. |

## Unchanged

- **Encore footwell take 6** — two pedals (wide treadplate brake + narrow accelerator; empty floor left of brake; no clutch). Pedal-count lock. Not a card still.
- **IV-001-brake take 81** — stays seeded. Do not reseed or restage.
- **Menace stays three-pedal.** **Encore stays two-pedal.** Do not swap those boxes.

## What this plate is

Over-the-wheel windshield plate: four PA horns, mic on the right cage tube, guarded red switch, stripped dash, small suede wheel. Footwell is **out of frame** — do not read pedal count from take 1.

Muted-read question: is this the Encore cab we lock forever (glass / horns / mic / switch / cage), knowing pedals live on the footwell plate?
