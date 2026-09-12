# PINK MENACE — playable now (Act IV)

Art regen is **paused** pending daughter feedback. No new stills. No Act I–III replay required.

**Play:** [https://ali.tactag.app](https://ali.tactag.app) — SMS login, then tap **Act IV · The Core**.

Railway deploys `pink_menace` from `main`. Merge the ship PR to update the live host.

## How to start Act IV

1. Log in as the student on [ali.tactag.app](https://ali.tactag.app).
2. On home, **Act IV · The Core** is unlocked (it no longer waits on I–III).
3. Tap it. The run starts on **IV-002** (first seeded Core card). Sequence skips unsown numbers.

Parents: [https://parents.tactag.app](https://parents.tactag.app).

## Live Act IV cards (20, all stills in Postgres)

Play order is `seq`. Gaps are unsown, not broken.

| Card | Title | Type | Live still (repo / PR) |
|---|---|---|---|
| IV-002 | One Pedal at a Time | scene | supplied footwell plate |
| IV-003 | Cover the Brake | scene | early PASS · #25 |
| IV-004 | Between the Parked | scene | supplied parked-gap plate |
| IV-005 | The Double Threat | hazard | take 97 · #101 / #107 |
| IV-006 | Tracks in the Lane | scene | take 11 · #127 |
| IV-007 | Transit Only | rule | take 30 · #119 |
| IV-008 | The Bike in the Gap | scene | take 1 · #36 |
| IV-009 | When Loud Is Right | convoy | take 11 · #129 |
| IV-010 | Eleven Months | dossier | early PASS · #25 |
| IV-011 | Backing Into People | scene | take 98 · #58 |
| IV-012 | The Same Crosswalk | ledger | take 32 · #76 |
| IV-013 | Door Before You Step | scene | take 4 · #30 |
| IV-015 | Already In the Circle | scene | early PASS · #25 |
| IV-016 | He Does Not Get Out | dossier | take 17 · #111 |
| IV-017 | The Conversation | dossier | early PASS · #25 |
| IV-018 | Two on the Seat | scene | early PASS · #25 |
| IV-026 | Separate the Three | scene | take 230 · #142 |
| IV-027 | Space With No Space | scene | take 49 · #82 |
| IV-028 | Both in the Carrier | dossier | take 70 · #108 |
| IV-030 | The Door to the Pass | dossier | take 65 · #106 |

Dossiers are continue-only (no quiz options). That is intended.

## Known residuals (play anyway)

- **IV-026** — take 230 seeded (Claude muted-read PASS on PR #142). Nose-toward from ahead; take-8 plow. Take 110 (plow stub) superseded. Do not regenerate.
- **IV-007** — composition drift on take 30 vs later weather/MUTCD regen (#114). Live still is the seeded PASS. Do not regenerate.
- **IV-001** — not a live card. Ride stills (`count-in`, `handoff`, `brake`) exist as assets only. The Core opens at IV-002.
- **Unfinished / unseeded** — IV-014, IV-019–025, IV-029. PR #130 (parallel 018/010/029) stays unmerged. Sequence skips them.

## Plates / LOCKS stacked with this ship

- Switchgear / MUTCD grade = exterior signs only (#115)
- Cat identity: studio wins, grate plates in-carrier only (#118)
- Full-width nose plow take 8 (#121)
- Encore cockpit Y4 b-take-2 (#122)

## Art regen

**Stopped.** Wait for the playthrough notes. Do not open stills jobs, do not merge unfinished regen PRs, do not reseed live Postgres unless a play-blocker forces it.
