# 42 — Still drift reconcile (main ↔ prod)

Seed/checkout reconcile for Claude audit order (`pack/40_SIX_ACT_AUDIT.md`). **No regen.**

Hashes = encoded WebP MD5 via `scripts/encode-still.py` (same path as `npm run audit-stills` / seed).

## Batch A — five main↔prod MISMATCH cards

**Class for all five: checkout drift (tip seeded to prod; `main` master never promoted).** Not bit-rot, not a wrong seed encoder path. Prod already held the tip winner; `cards/<id>.png` on `main` lagged.

| Card | Repo winner (promoted) | Winner WebP MD5 | Prod MD5 before reseed | Old `main` master MD5 | Likely cause | `audit-stills` MD5 catch? |
|---|---|---|---|---|---|---|
| **I-009** | `takes/I-009-take-19.png` | `0570afbd17b754a21aa96264e727ac99` | `0570afbd17b754a21aa96264e727ac99` | `91c7493b167741662947c65f71304130` | Checkout drift — accept-take-19 tip live; main stayed on older cage plate | **Yes** — main master ≠ prod |
| **I-010** | `takes/I-010-take-9.png` | `a72a8c59a96c36d0b60267d9e51f6854` | `a72a8c59a96c36d0b60267d9e51f6854` | `6d95fbded82607b3395cbd8be62e2a06` | Checkout drift — live take-9; main master was take-8 | **Yes** — main master ≠ prod |
| **IV-002** | `takes/IV-002-take-19.png` | `4926452cf208f40cd2d7486463bd2844` | `4926452cf208f40cd2d7486463bd2844` | `62d8a9cdc10eeb83ffab919a5853bed9` | Checkout drift — playtest tip take-19 live; main still had supplied footwell plate | **Yes** — main master ≠ prod |
| **IV-010** | `takes/IV-010-take-18.png` | `6266ebcc50e7159ecd1d8695258555ec` | `6266ebcc50e7159ecd1d8695258555ec` | `d903360c48aa398f4c17d066647ca37e` | Checkout drift — tip #139 take-18 live; main early PASS | **Yes** — main master ≠ prod |
| **IV-026** | `takes/IV-026-take-230.png` | `aca03fc69cf61682569129426b7e8f84` | `aca03fc69cf61682569129426b7e8f84` | `f3adfb69c3c630ec5fe3d2c6267e8567` | Checkout drift — tip #145 take-230 live; main plow-stub take-110 (PLAYTHROUGH warned) | **Yes** — main master ≠ prod |

**Verdict for Claude:** byte-level MD5 audit **does catch this class**, as long as the compared tree is `main` (or any checkout whose `cards/<id>.png` is not the tip). It is not limited to corruption — any seed/checkout tip lag shows as MISMATCH.

Batch A reseed after promote is **idempotent MATCH** (prod already == tip winner).

Wrong-winner-pointer / bad seed-path were **not** the cause here: prod bytes already equal the tip take WebP.

## Batch B — picture↔text

| Card | Action | Prod MD5 before | Winner WebP MD5 | Notes |
|---|---|---|---|---|
| **I-003** | Reseed `take-1` | `eed4e30ad71ce45f329959bfbfe2e0db` | `bc7645e3f31f1d24063210338a6d90b7` | Seat cats + B-pillar belt; no 112. Replaces lap+112 take-9 |
| **III-019** | Reseed pick `c-take-2` | `4656df525c679f176e43e04bb96b3cf6` | `54365408a62db0bf709b6c8c184277a6` | live≠pick. Art-review stays READ_MISSING (muted-read open) |
| **IV-018** | **STOP — no correct winner** | (unchanged) | — | All repo takes are carrier (+ often 112). Brief wants cats on seat, speedo 0, no carrier. Regen takes 9–11 on hard-debt stills branch — not seeded |
| **IV-028** | **STOP — no correct winner** | (unchanged) | — | Live/take-70 is rear-hatch (WRONG_CAMERA). Regen takes 79–82 (forward floor-carrier + pedestrian) on hard-debt stills branch — not seeded |

No Act VI winners touched. No Act VII. No Act III READ_MISSING muted-read batch beyond III-019 pick reseed.
