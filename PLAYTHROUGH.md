# PINK MENACE — playable now (Act IV + Act V)

Daughter playtest build. No new stills. No Act I–III replay required.

**Play:** [https://ali.tactag.app](https://ali.tactag.app) — SMS login, then tap **Act IV · The Core** or **Act V · The Ribbon**.

Live vs missing, V-009 status, and residual notes: **[PLAYTEST.md](PLAYTEST.md)**.

Railway deploys `pink_menace` from `main`. Merge the ship PR to update the live host.

## How to start

1. Log in as the student on [ali.tactag.app](https://ali.tactag.app).
2. On home, **Act IV · The Core** and **Act V · The Ribbon** are unlocked (they no longer wait on I–III).
3. Act IV starts on **IV-002**. Act V starts on **V-001** and runs all 13 Ribbon cards.

Parents: [https://parents.tactag.app](https://parents.tactag.app).

## Live Act IV cards (21, all stills in Postgres)

Play order is `seq`. Gaps are unsown, not broken.

| Card | Title | Type | Live still (repo / PR) |
|---|---|---|---|
| IV-002 | One Pedal at a Time | scene | take-19 · #146 |
| IV-003 | Cover the Brake | scene | early PASS · #25 |
| IV-004 | Between the Parked | scene | supplied parked-gap plate |
| IV-005 | The Double Threat | hazard | take 97 · #101 / #107 |
| IV-006 | Tracks in the Lane | scene | take 11 · #127 |
| IV-007 | Transit Only | rule | take 30 · #119 |
| IV-008 | The Bike in the Gap | scene | take 1 · #36 |
| IV-009 | When Loud Is Right | convoy | take 11 · #129 / #146 |
| IV-010 | Eleven Months | dossier | take 18 · #139 |
| IV-011 | Backing Into People | scene | take 98 · #58 |
| IV-012 | The Same Crosswalk | ledger | take 32 · #76 |
| IV-013 | Door Before You Step | scene | take 4 · #30 |
| IV-015 | Already In the Circle | scene | early PASS · #25 |
| IV-016 | He Does Not Get Out | dossier | take 17 · #111 |
| IV-017 | The Conversation | dossier | early PASS · #25 |
| IV-018 | Two on the Seat | scene | early PASS · #25 |
| IV-026 | Separate the Three | scene | take 230 · #145 |
| IV-027 | Space With No Space | scene | take 49 · #82 |
| IV-028 | Both in the Carrier | dossier | take 70 · #108 |
| IV-029 | When Not To Be Loud | dossier | take 16 · #135 |
| IV-030 | The Door to the Pass | dossier | take 65 · #106 |

Dossiers are continue-only (no quiz options). That is intended.

## Live Act V cards (13, complete)

| Card | Title | Type | Live still (repo / PR) |
|---|---|---|---|
| V-001 | Eyes Up the Ribbon | scene | take 5 · #168 |
| V-002 | Tower 4 | dossier | take 29 · #177 |
| V-003 | Three Pieces of Ramp | scene | take 5 · #168 |
| V-004 | The Meter Is a Light | rule | take 11 · #191 |
| V-005 | Match Them Before Paint | scene | take 5 · #184 |
| V-006 | Beside the Trailer | hazard | take 3 · Ribbon wave-1 (#198/#199) |
| V-007 | Slow On the Ramp | rule | take 18 · #185 |
| V-008 | The Cone Line | scene | take 3 · Ribbon wave-1 (#198/#199; take-1 FAIL not seeded) |
| V-009 | Small Hands at Speed | scene | take 37 · #197 (PR #192 PASS; take-31 not used) |
| V-010 | One Lane, Then Sit | rule | take 10 · #194 |
| V-011 | Zipper at the Closure | hazard | take 7 · #159 |
| V-012 | Three Seconds Here Too | rule | take 20 · #194 |
| V-013 | Flashers on the Strip | scene | take 7 · Quiet silhouette (#204 PASS; take-6 not seeded) |

## Known residuals (play anyway)

- **IV-007** — composition drift on take 30 vs later weather/MUTCD regen (#114). Live still is the seeded PASS. Do not regenerate.
- **IV-001** — not a live card. Ride stills (`count-in`, `handoff`, `brake`) exist as assets only. The Core opens at IV-002.
- **Unfinished / unseeded** — IV-014, IV-019–025. PR #130 (parallel 018/010/029) stays unmerged except the IV-029 take-16 seed already live.

## Art regen

**Stopped for this playtest.** Do not open stills jobs, do not merge DNM PRs (#173, #189, #193, etc.), do not reseed live Postgres unless a play-blocker forces it.
