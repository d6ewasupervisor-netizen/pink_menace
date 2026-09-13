# 42 — Still drift reconcile (main ↔ prod)

Seed/checkout reconcile for PR audit order (`pack/40_SIX_ACT_AUDIT.md`). No regen.

## Batch A — main↔prod MISMATCH (before reseed)

Hashes = encoded WebP MD5 (`scripts/encode-still.py` / `npm run audit-stills`).

| Card | Repo winner (promoted) | Winner WebP MD5 | Prod MD5 before | Cause | Would `audit-stills` catch? |
|---|---|---|---|---|---|
| **I-009** | `I-009-take-19.png` | `0570afbd17b754a21aa96264e727ac99` | `0570afbd17b754a21aa96264e727ac99` | **Checkout drift** — tip seeded live (`i-009-accept-take-19`); main master stayed on older plate | **Yes** — main master ≠ prod until tip promoted |
| **I-010** | `I-010-take-9.png` | `a72a8c59a96c36d0b60267d9e51f6854` | `a72a8c59a96c36d0b60267d9e51f6854` | **Checkout drift** — live is take-9; main master was take-8 | **Yes** |
| **IV-002** | `IV-002-take-19.png` | `4926452cf208f40cd2d7486463bd2844` | `4926452cf208f40cd2d7486463bd2844` | **Checkout drift** — playtest tip take-19 live; main still had supplied footwell plate | **Yes** |
| **IV-010** | `IV-010-take-18.png` | `6266ebcc50e7159ecd1d8695258555ec` | `6266ebcc50e7159ecd1d8695258555ec` | **Checkout drift** — tip #139 take-18 live; main early PASS (take-7 era) | **Yes** |
| **IV-026** | `IV-026-take-230.png` | `aca03fc69cf61682569129426b7e8f84` | `aca03fc69cf61682569129426b7e8f84` | **Checkout drift** — tip #145 take-230 live; main plow-stub take-110 (`PLAYTHROUGH` warned) | **Yes** |

**Class:** not bit-rot / corruption. Live already held tip winners; `main` masters lagged unmerged tips. Byte MD5 audit catches this whenever the compared tree is `main` (or any checkout whose `cards/<id>.png` is not the tip).

Prod hashes above equal tip winners — Batch A reseed is idempotent MATCH after promote.

## Batch B — picture↔text

| Card | Action | Notes |
|---|---|---|
| **I-003** | Reseed `take-1` | Seat cats + B-pillar belt; no 112. Replaces lap+112 take-9 |
| **III-019** | Reseed art-review pick `c-take-2` | Was live≠pick. Tag stays READ_MISSING (muted-read open) |
| **IV-018** | **STOP — no correct winner** | All repo takes are carrier (+ often 112). Brief wants cats on seat, speedo 0, no carrier |
| **IV-028** | **STOP — no correct winner** | Live/take-70 is rear-hatch (WRONG_CAMERA). Forward takes lack floor carrier + ahead pedestrian together |

No Act VI winners touched. No Act VII. No Act III READ_MISSING muted-read batch beyond III-019 pick reseed.
