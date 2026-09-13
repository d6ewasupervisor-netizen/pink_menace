# 44 — Seed provenance / verification gate

Approval (muted-read PASS) and **seed verification** are separate gates. A take may be live in prod without Claude having seen that frame; a Claude PASS may exist without the live plate matching the take he graded. Do not collapse the two.

**Act VII stays CLOSED.** This note does not open Act VII or authorize stills regen.

---

## Two gates

| Gate | What it proves | What it does **not** prove |
|---|---|---|
| **Approval** (muted-read / art review) | Claude (or human) graded **this take** against card copy | That the live master / DB row is that take |
| **Seed verification** | Live `cards/<id>.png` + DB WebP match the intended take bytes (`npm run seed`, `npm run audit-stills`) | That Claude passed the take |

Both must be true before a seed note may say **Claude PASS**.

---

## Attribution rule

**Never** attribute a seed to Claude PASS unless `check_cursor_reply` / muted-read **actually showed him that take** (same take id, same bytes / filename in the relay he graded).

Do not:

- Copy “Claude PASS” from an older take onto a newer live seed
- Infer PASS from geometry / strap / “closest” labels without a reply that names the take
- Treat a human pick or encode success as Claude approval

False attributions Claude flagged (examples — he never saw those frames):

- IV-028 take-82
- IV-002 take-29
- IV-006 take-47
- V-013 take-5

When a wrong attribution is found, **prefer log `reviewed-after-seed`** on the correction (seed first if needed, then muted-read the live take, then record the post-seed review) rather than rewriting history as if PASS preceded the seed.

---

## Teaching case — IV-028 strapped carrier

| Take | Status |
|---|---|
| **take-87** | **Live strapped-carrier winner** (PR #239). Claude muted-read PASS after seed path; carrier strapped (black belt). |
| take-82 | Was live **unreviewed** (no Claude PASS on that frame), then **replaced** by take-87. Do not re-attribute take-82 to Claude PASS. |
| takes 83–86, 88 | Claude FAIL (latched, unstrapped) — do not seed. |

Source: PR #239 seed / wave notes (`cards/takes/WAVE_IV-028-take-87-seed.md` once that PR lands).

---

## Checklist before writing “Claude PASS” on a seed

1. Muted-read / `check_cursor_reply` names **this** take id.
2. Live master bytes match that take (`cmp` / MD5).
3. `variation.winner` / `variation.forced` point at that take.
4. If the take was seeded before review: log **`reviewed-after-seed`**, do not backdate approval.

Indexed from [`43_PACK_RULES_CONSOLIDATED.md`](43_PACK_RULES_CONSOLIDATED.md) §16.
