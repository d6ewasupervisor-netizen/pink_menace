# 27 — Act III closeout

Act III is playable, seeded, and playtested. This file closes the work-order checklist and names what ships next.

---

## §1 Quiet plates (handoff)

- **Palm print:** scaled in CSS (`.fear-palm` ~10×9% frame). Same hand plate; driver-distance scale.
- **Horizon band:** tier-1/tier-2 forward depth uses `herd.png` (legs, asymmetry) instead of the blob strip `distant.png`. Less blur so it reads as figures at 390px, not sky smudge.

Rain, drag marks, cold tag, spiked meters, and bus card legibility were not touched.

---

## §2 Audits

### Art-review board

`node tools/art-review/sync-seeded-state.js` re-tags `cards/art-review-state.json` from the seeded deck manifest (Postgres when `DATABASE_URL` is set). Stale `READ_MISSING`, "do not seed," and mismatched take notes are replaced. **The seeded deck is the deck.**

### Disabled features leave a ticket

Standing rule (also in `00_README.md`): anything turned off for quality names what was disabled and why. See `pack/DISABLED_TICKETS.md`.

---

## §3 Act III open items — status

| Item | Status |
|---|---|
| **III-005 mirror side** | **Closed.** Live still restored to window-edge sliver; door mirror empty (`8554e5a`). Matches copy. Reseed required after push. |
| **III-025 face-critical** | **Accepted.** Policy (`12`) calls for eight takes; four c-takes shipped. Logged here — do not block the act on two more portrait rounds unless canon drifts in playtest. |
| **§5 closer sweep** | **Closed.** `scripts/validate-spoken.js` `checkClosers` on Act III: 1 aphoristic closer / cap 6. III-023 debrief last line rewritten to plain imperative. |

Nothing else blocks moving off Act III.

---

## §4 Build moves next (recommendation)

1. **Watch layer / III-001 ride-along** (`22`, `18`) — script is written; machinery is one screen. Demonstrate-first, opening beat she played without.
2. **Navigation shell** (`13` §B, `14` §3) — Log, Cast, Resume, review-only back. Server rejection of resubmits is already in.

Act IV stays parked until the shell is finished. Sixty cards in a complete loop beats ninety in an incomplete one.
