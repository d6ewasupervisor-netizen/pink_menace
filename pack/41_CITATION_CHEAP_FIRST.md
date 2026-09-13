# 41 — Citation cheap-first fixes (Acts I–III FAILs)

Text-only remaps from `pack/40_SIX_ACT_AUDIT` §3.1 / FINAL REPORT. **No stills regen. No Act VII. No I–III replay.**

## Card `source.dol_section` before → after

| card_id | before | after |
|---|---|---|
| **I-006** | `5.5 Focus` | `n/a` |
| **I-007** | `5.5 Focus` | `n/a` |
| **I-008** | `5.5 Focus` | `n/a` |
| **II-018** | `5.5 Focus` | `4.19 Transporting (Animals)` |
| **III-004** | `5.5 Focus` | `n/a` |
| **III-007** | `5.2 Space` | `5.3 Merging` |
| **III-018** | `5.2 Space` | `5.2 Space` (reverted — Claude) |

`psdp_skill` unchanged on all seven.

## n/a honesty (`teaching_target`)

Act VI style: null means the guide has **no home**, not that the right section was hard to find. Each remapped honest-`n/a` card (I-006/007/008, III-004) now carries a one-line why (and an explicit do-not-cite-parent):

| card_id | why `n/a` (in `teaching_target`) |
|---|---|
| **I-006** | No Driver Guide home for parking-lot pet recovery; do not cite `5.5 Focus` (not a driving-distraction lesson). |
| **I-007** | No DOL/PSDP home for the lot attack beat; do not stretch `5.5 Focus` as a catch-all. |
| **I-008** | Story rule (“sound draws them”), not a DOL distraction heading; do not cite `5.5 Focus` parent. |
| **III-004** | Skill nine looking procedure; DOL has no separate mirror/OTS heading; do not cite `5.5 Focus`. |

## Claude follow-up — III-018

**Reverted** `n/a` → **`5.2 Space`**. Pass-completion card; 5.2 was correct. Keep I-006/007/008 and III-004 as honest `n/a`. III-007 stays `5.3 Merging`.

## FLAG for Claude — III-007 → `5.3 Merging`

**Not reverted.** Audit remapped here because the teaching line is verbatim merge-gap language (“need not swerve, slow, or stop”).

**Review ask:** if the card mainly teaches gap-and-speed on a multi-lane road (Skill nine), `5.2 Space` may fit better than a third Merging cite (III-026 already owns zipper). Claude decides with the fifteen card texts — do not silent-revert in this PR.

## Allowlist

Added `4.19 Transporting (Animals)` to `pack/07_DOL_SECTIONS.json` so II-018 (and existing IV-018) validate.

## DISABLED_TICKETS

Added Act II camera-cap / window-of-6 row (`POV_DIAGRAM` 30.8% > 25%) — ship-as-is; no gameplay change.

## Left alone (per audit)

- **NEEDS-REVIEW** (not remapped): see `pack/40_SIX_ACT_AUDIT` §3 — II-005/026/027/029/030, I-011 soft homes, III soft residuals, etc.
- **Allowlist sync** for other IV children (`4.5`, `4.15`, `5.0`) — still missing on main; IV-008/015/026 still fail `validate-citations.js` until a later sync.
- Stills / hash drift / Act III READ_MISSING / Act VII — out of scope.

## Verify

- Fabricated Act II PSDP names from `pack/10_ACT_II_CITATION_PATCH.json`: **0 remain** in Acts I–III.
- Remapped cards pass string citation check; IV missing-child allowlist debt unchanged.
