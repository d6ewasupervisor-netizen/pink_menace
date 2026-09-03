# 27 — Act III closeout

Act III is playable, seeded, and playtested. This file closes the work-order checklist and names what ships next.

---

## §1 Quiet plates (handoff)

- **Palm print:** regenerated (4 takes, take 3 shipped). Flat grime displacement on glass — not a photographic hand. `mix-blend-mode: multiply`, higher opacity, ~10×9% frame.
- **Horizon band:** tier-1/tier-2 forward depth uses `herd.png` (legs, asymmetry) instead of the blob strip `distant.png`. Less blur so it reads as figures at 390px, not sky smudge.

Rain, drag marks, cold tag, spiked meters, and bus card legibility were not touched.

---

## §2 Audits

2. **Art-review board** — `sync-seeded-state.js` reconciles take names and clears "ungenerated / do not seed" notes. It does **not** stamp PASS. Human tags stay. No tag → `UNREVIEWED`. III-025 stays `READ_MISSING` with a visible `caveat` for the four-take accept.

3. **Still audit** — `npm run audit-stills` hashes encoded repo PNGs against Postgres `image_bytes`. Act III: III-005 was the only mismatch (bad seed); reseeded. III-023 copy reseeded. `python3` encoder on Linux.

### Disabled features leave a ticket

Standing rule (also in `00_README.md`): anything turned off for quality names what was disabled and why. See `pack/DISABLED_TICKETS.md`.

---

## §3 Act III open items — status

| Item | Status |
|---|---|
| **III-005 mirror side** | **Closed.** Live still restored to window-edge sliver; door mirror empty (`8554e5a`). Matches copy. Reseeded. |
| **III-025 face-critical** | **Accepted.** Policy (`12`) calls for eight takes; four c-takes shipped. Logged here — do not block the act on two more portrait rounds unless canon drifts in playtest. |
| **§5 closer sweep** | **Closed.** `scripts/validate-spoken.js` `checkClosers` on Act III: 1 aphoristic closer / cap 6. III-023 debrief last line rewritten to plain imperative. |

Nothing else blocks moving off Act III.

---

## §4 Ride-along (shipped this pass)

III-001 is playable: twelve Deac lines over the cockpit still, tap to advance, last line hands the wheel. Watch-card (dossier-class) for answers and the Hold. Still seeded.

Navigation shell (Log, Cast, Resume) stays next.
