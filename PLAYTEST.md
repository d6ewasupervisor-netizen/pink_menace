# PINK MENACE — daughter playtest (Act IV + Act V)

**Play:** [https://ali.tactag.app](https://ali.tactag.app) — SMS login, then tap **Act IV · The Core** or **Act V · The Ribbon**.

Parents: [https://parents.tactag.app](https://parents.tactag.app).

Railway deploys `pink_menace` from `main`. Merge the ship PR to update the live host. Image cache `?v=a70`.

Both acts are unlocked without an I–III replay. Sequence skips unsown numbers.

No new art was generated for this ship. Stills are the already-seeded live Postgres plates.

## How to play

1. Log in as the student on [ali.tactag.app](https://ali.tactag.app).
2. On home, **Act IV · The Core** and **Act V · The Ribbon** both show Play.
3. Act IV starts on **IV-002**. Act V starts on **V-001**.
4. **V-009 is not in the run.** It is not seeded. The sequence jumps V-008 → V-010.

## Act IV — The Core (21 live cards)

Play order is `seq`. Gaps are unsown, not broken.

| Card | Title | Type | Live still | Repo↔DB |
|---|---|---|---|---|
| IV-002 | One Pedal at a Time | scene | take-19 · #146 | MATCH |
| IV-003 | Cover the Brake | scene | early PASS · #25 | MATCH |
| IV-004 | Between the Parked | scene | supplied parked-gap plate | MATCH |
| IV-005 | The Double Threat | hazard | take-97 · #101 / #107 | MATCH |
| IV-006 | Tracks in the Lane | scene | take-11 · #127 | MATCH |
| IV-007 | Transit Only | rule | take-30 · #119 | MATCH |
| IV-008 | The Bike in the Gap | scene | take-1 · #36 | MATCH |
| IV-009 | When Loud Is Right | convoy | take-11 · #129 / #146 | MATCH |
| IV-010 | Eleven Months | dossier | take-18 · #139 | MATCH |
| IV-011 | Backing Into People | scene | take-98 · #58 | MATCH |
| IV-012 | The Same Crosswalk | ledger | take-32 · #76 | MATCH |
| IV-013 | Door Before You Step | scene | take-4 · #30 | MATCH |
| IV-015 | Already In the Circle | scene | early PASS · #25 | MATCH |
| IV-016 | He Does Not Get Out | dossier | take-17 · #111 | MATCH |
| IV-017 | The Conversation | dossier | early PASS · #25 | MATCH |
| IV-018 | Two on the Seat | scene | early PASS · #25 | MATCH |
| IV-026 | Separate the Three | scene | take-230 · #145 | MATCH |
| IV-027 | Space With No Space | scene | take-49 · #82 | MATCH |
| IV-028 | Both in the Carrier | dossier | take-70 · #108 | MATCH |
| IV-029 | When Not To Be Loud | dossier | take-16 · #135 | MATCH |
| IV-030 | The Door to the Pass | dossier | take-65 · #106 | MATCH |

Unfinished / unseeded: IV-001 (ride assets only), IV-014, IV-019–025.

## Act V — The Ribbon (12 live cards)

Highway / Skill eleven. Ali. Relay kit cargo. Yuna is radio-only.

| Card | Title | Type | Live still | Repo↔DB |
|---|---|---|---|---|
| V-001 | Eyes Up the Ribbon | scene | take-5 · #168 | MATCH |
| V-002 | Tower 4 | dossier | take-29 · #177 | MATCH |
| V-003 | Three Pieces of Ramp | scene | take-5 · #168 | MATCH |
| V-004 | The Meter Is a Light | rule | take-11 · #191 | MATCH |
| V-005 | Match Them Before Paint | scene | take-5 · #184 | MATCH |
| V-006 | Keep Right Except to Pass | hazard | take-47 · #177 | MATCH |
| V-007 | Slow On the Ramp | rule | take-18 · #185 | MATCH |
| V-008 | Posted Before the Bend | scene | take-7 · #180 | MATCH |
| **V-009** | Small Hands at Speed | — | **NOT LIVE** | **MISSING** |
| V-010 | One Lane, Then Sit | rule | take-10 · #194 | MATCH |
| V-011 | Zipper at the Closure | hazard | take-7 · #159 | MATCH |
| V-012 | Three Seconds Here Too | rule | take-20 · #194 | MATCH |
| V-013 | Let Hollis Have It | scene | take-6 · #186 | MATCH |

### V-009 status

**Not seeded. Do not invent a still.** Hands-on-wheel regen is [PR #192](https://github.com/d6ewasupervisor-netizen/pink_menace/pull/192), awaiting Claude PASS. The run skips V-009. Card JSON is in the repo for the 13-card text set only — no `cards/V-009.png`, no live row.

## Left unmerged (on purpose)

DNM / unfinished regen — do not land:

- #173 rogue duplicate wave-1
- #189 V-012 take-6 (superseded by take-20)
- #193 duplicate V-010/V-012 seed
- #165 / #171 other DNM seeds
- #192 V-009 hands regen (no PASS yet)
- IV-026 older high-oblique waves (#125, #128) — live is take-230
- #130 parallel 018/010/029 regen leftovers
- #135 IV-009 take-12 — live stayed on take-11 after #146

## Residuals (play anyway)

- IV-007 composition drift vs later MUTCD regen (#114). Live still is take-30.
- IV-004 is the supplied parked-gap plate, not a later plow regen.
- V-009 hole in the Ribbon sequence.

Do not reseed live Postgres on merge unless a play-blocker appears. Stills are already in the DB.
