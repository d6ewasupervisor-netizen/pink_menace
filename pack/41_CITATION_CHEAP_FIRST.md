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
| **III-018** | `5.2 Space` | `n/a` |

`psdp_skill` unchanged on all seven.

## Allowlist

Added `4.19 Transporting (Animals)` to `pack/07_DOL_SECTIONS.json` so II-018 (and existing IV-018) validate.

## DISABLED_TICKETS

Added Act II camera-cap / window-of-6 row (`POV_DIAGRAM` 30.8% > 25%) — ship-as-is; no gameplay change.

## Left alone (per audit)

- **NEEDS-REVIEW** citation rows from `pack/40_SIX_ACT_AUDIT` (e.g. II-027 Focus; soft PSDP homes) — documented only, not remapped here.
- Stills / hash drift / Act III READ_MISSING / Act VII — out of scope.

## Verify

- Fabricated Act II PSDP names from `pack/10_ACT_II_CITATION_PATCH.json`: **0 remain** in Acts I–III.
- `node scripts/validate-citations.js` should pass for remapped cards once `4.19` is on the allowlist. (IV cards citing other missing DOL children remain pre-existing main debt.)
