# Act IV card audit list — POST-FIX

Verified against live `cards/IV-002.json` … `cards/IV-030.json` on this branch (PR #17 citation fixes + e8424f65 text pass). These are the values in the card JSON. **Not pre-fix.**

IV-001 is ride-along lines only (`cards/drafts/IV-001-ridealong-lines.md`) and is not one of the 29 rows.

Precedent already on this branch: **II-018** `dol_section` is `4.19 Transporting (Animals)`.

---

## Fixed-cite confirmation (live JSON)

| Card | Live `dol_section` / type | Required POST-FIX | Match |
|---|---|---|---|
| IV-003 | `5.5 Focus` · Skill ten: city driving – part one | 5.5 Focus (not 5.0 Hazard perception); Skill ten p1 primary | YES |
| IV-006 | `4.7 Sharing the road with trains (Light rail)` | (Light rail) lowercase r | YES |
| IV-013 | `4.6 Sharing with bicyclists` | 4.6 Sharing with bicyclists (not 4.18 Parallel parking) | YES |
| IV-014 | `5.2 Space` | 5.2 Space (not 5.0 Situational awareness) | YES |
| IV-015 | `4.15 Other intersections` · title Already In the Circle · roundabout | Rewritten as roundabout under 4.15 (NOT "The One on the Left" / uncontrolled / yield-to-left). Correct: yield to traffic already in, look left, no lane change inside, signal on exit | YES |
| IV-018 | `4.19 Transporting (Animals)` | exact string, no slash form | YES |
| IV-021 | `5.9 Collisions` | plain `5.9 Collisions` | YES |
| IV-022 | `5.9 Collisions` · title What You Carry · emergency kit | 5.9 Emergency kit content (not Reporting/911) | YES |
| IV-023 | `5.7 Vehicle failures` | plain `5.7 Vehicle failures` | YES |
| IV-026 | `5.0 Dangers of driving` | plain `5.0 Dangers of driving` | YES |
| IV-027 | `5.2 Space` | `5.2 Space` | YES |
| IV-029 | dossier · `n/a` / `n/a` · title When Not To Be Loud | dossier Yuna thesis when NOT to be loud (n/a cites), not a scene | YES |
| II-018 | `4.19 Transporting (Animals)` | same exact string if not already | YES |

---

## 29 rows (IV-002–IV-030)

| card_id | title | card_type | psdp_skill | dol_section | correct option |
|---|---|---|---|---|---|
| IV-002 | The Naked Glass | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-003 | Cover the Brake | scene | Skill ten: city driving – part one | 5.5 Focus | Lift off the gas and hold your foot over the brake without pressing it yet |
| IV-004 | Between the Parked | scene | Skill ten: city driving – part one | 4.1 Sharing with people | Cover, slow, stop if you must. Let them finish or go back |
| IV-005 | The Double Threat | hazard | Skill ten: city driving – part one | 4.1 Sharing with people | Hold behind them until the person is gone and the sedan moves |
| IV-006 | Tracks in the Lane | scene | Skill ten: city driving – part two | 4.7 Sharing the road with trains (Light rail) | Signal, leave the track lane, give the train the rails, then hold |
| IV-007 | Transit Only | rule | Skill ten: city driving – part one | 4.12 Signs | Stay out of the transit lane, no turn on red, go the way the one-way points |
| IV-008 | The Bike in the Gap | scene | Skill ten: city driving – part one | 4.5 Sharing with motorcycles | Cancel, hold your lane, let them show or pass, then take a swept gap |
| IV-009 | When Loud Is Right | convoy | n/a | n/a | Leave the PA dead. Count a gap, take it, keep the horns for a block that is dying |
| IV-010 | Eleven Months | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-011 | Backing Into People | scene | Skill ten: city driving – part two | 4.18 Parking | Wait them out, check both ways, creep, and be ready to plant it the whole reverse |
| IV-012 | The Same Crosswalk | ledger | n/a | n/a | Hold behind the sedan until they are gone and the car moves |
| IV-013 | Door Before You Step | scene | Skill ten: city driving – part two | 4.6 Sharing with bicyclists | Far hand on the latch so your body turns, look, then open a crack |
| IV-014 | Driver in the Lane | hazard | Skill ten: city driving – part one | 5.2 Space | Cover, brake, stop short of the open door, wait until he is back inside |
| IV-015 | Already In the Circle | scene | Skill ten: city driving – part two | 4.15 Other intersections | Look left, yield to the SUV already in, enter the gap, stay in your lane, signal when you leave |
| IV-016 | He Does Not Get Out | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-017 | The Conversation | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-018 | Two on the Seat | scene | Skill ten: city driving – part two | 4.19 Transporting (Animals) | Clip both in the carrier, stow it, then roll |
| IV-019 | Hands and the Dome | scene | Skill ten: city driving – part two | 5.10 Law enforcement (Getting pulled over) | Hands on the wheel, dome on, stay in the car, wait for him to ask |
| IV-020 | What a Ticket Is | rule | Skill ten: city driving – part two | 5.10 Law enforcement (Getting a ticket) | A record you answer by the date, and a habit you change now |
| IV-021 | Not Your Collision | hazard | Skill ten: city driving – part one | 5.9 Collisions | Slow, give a wide gap, look enough to remember, do not become the next car |
| IV-022 | What You Carry | scene | Skill ten: city driving – part two | 5.9 Collisions | Confirm the kit — triangles, first aid, paper numbers, water — then roll when the pad is clear |
| IV-023 | One Lamp Dark | wrench | Skill ten: city driving – part one | 5.7 Vehicle failures | Hazards on, crawl to the next legal pad, stop, and fix or swap the lamp |
| IV-024 | Colman Dock | scene | Skill ten: city driving – part two | 4.20 Maritime (Ferries) | Hold the brake, wait for the vest, roll when they point, then set it and shut down if they say |
| IV-025 | The Same Truck | ledger | n/a | n/a | Cover, brake, stop short of the crate, wait until he is back inside |
| IV-026 | Separate the Three | scene | Skill ten: city driving – part one | 5.0 Dangers of driving | Dump speed first, hold, let the person and the bike declare, then creep past the door |
| IV-027 | Space With No Space | scene | Skill ten: city driving – part one | 5.2 Space | Lift until you can count three seconds off a mark, even if the truck hates it |
| IV-028 | Neither Names the Lot | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-029 | When Not To Be Loud | dossier | n/a | n/a | (dossier — no scored answer) |
| IV-030 | The Door to the Pass | dossier | n/a | n/a | (dossier — no scored answer) |

## Type counts (002–030)

13 scene · 3 hazard · 2 rule · 1 convoy · 1 wrench · 2 ledger · 7 dossier.

## e8424f65 text pass (this PR)

- **IV-017** scene: same words, same order. Staging first, each of Deac’s nine accepted lines on its own line, Ali’s action last. Not a wall paragraph.
- **IV-018** scene: carrier not mentioned (she has to think of it). Ice, two weights, option (a) “invent a lap,” and debrief kept. `image_brief` no longer requires an open carrier in frame.
