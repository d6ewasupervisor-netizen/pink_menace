# Citation audit — string-match is not enough

Human citation audit. Text before pixels. No art. No frame seed. No Encore exterior compile.

**Allowlist authority:** PR #10 (`cursor/citation-encore-glass-8e42`) — `pack/07_DOL_SECTIONS.json` + `pack/08_PSDP_SKILLS.json` (Skill ten + the ch.4/5 headings Claude locked). Cite against that list. Do not undo it. Do not invent a substitute number because a parenthetical is missing.

PR #12 (`cursor/act-iv-core-text-29b1`) shipped a table of **allowlist string-match** (`ok` / `pending-allowlist`). Necessary. Not sufficient. This file adds the second test:

> Does the cited DOL / PSDP **section body** actually teach the card’s `teaching_target`?

A heading that merely exists on the allowlist can still be a dump. Nine fresh DOL parents on PR #10 are invent-risk until a card’s target is a sentence that section speaks.

Official body: WA Driver Guide text-only (dol.wa.gov). Checked 2026-09-11.

---

## How to read the flags

| Flag | Meaning |
|---|---|
| **SUPPORT** | Heading matches PR #10 (or `n/a` on a beat) **and** the section body states the target. |
| **FORM** | Teaching is in the official body, but the card’s heading string is not on PR #10 (invented parenthetical, slash-combine, or capitalization). Fix the string; do not invent a new number. |
| **WEAK** | Heading is on-list or pending, but the section does **not** clearly teach the target. Retarget or recite. |
| **WRONG** | Section body contradicts or does not contain the rule the card grades. |

---

## Nine fresh DOL parents (invent-risk)

PR #10 added these **parents** that were not on main. Using one as a catch-all is the II-016/II-022 failure class.

| Heading on PR #10 | What the body actually is | Dump risk |
|---|---|---|
| `4.0 Awareness and cooperation` | Courtesy / shared understanding. No maneuver. | High — never a specific yield or gap rule. |
| `4.1 Sharing with people` | Yield to pedestrians; wait an extra lane; search the hidden / distracted. | Low if the card is a person in the road. |
| `4.5 Sharing with motorcycles` | Full lane; never share the lane; shoulder-check. | Low if the card is a rider already in the lane. |
| `4.7 Sharing the road with trains` | Crossings, gates, do not beat the train. Light rail is a **subsection**. | Medium — freight ≠ street rail. |
| `4.8 Sharing with agricultural vehicles` | SMV triangle, patience. | Unused in Act IV so far. |
| `4.15 Other intersections` | Calming circles, roundabouts, diverging diamonds, uncontrolled. | High — see **IV-015**. |
| `4.19 Transporting` | Towing / secure load / **Animals** are separate subsections. | High if slashed together. |
| `4.20 Maritime` | Ferries + beaches. | Low if the card is the ferry line. |
| `5.0 Dangers of driving` | Chapter intro: risk awareness, hazard perception, situational awareness, hazard management **as prose inside 5.0**, not as numbered sections. | **Highest.** PR #10 added the parent only. Do not mint `5.0 (Hazard perception)` etc. |

PR #10 also added `5.7 Vehicle failures`, `5.9 Collisions`, `5.10 Law enforcement (Getting pulled over)`, and the 4.7 / 4.19 / 4.20 parentheticals listed in that PR. It **skipped** 4.15 parentheticals, 4.18 Parallel parking, 5.0 child headings, `5.7 (Headlight)`, 5.9 child headings, and `5.10 (Getting a ticket)`.

---

## Act IV — cite ↔ `teaching_target`

Cards live on PR #12 except **IV-017**, which this branch rewrites. IV-001 lines live only on PR #12 (`cards/drafts/IV-001-ridealong-lines.md`) — do not fork.

| Card | Cited DOL | Target (short) | vs PR #10 | Flag |
|---|---|---|---|---|
| IV-001 | `n/a` | Yuna ride-along (lines only) | `n/a` ok; Skill ten pending until #10 | SUPPORT (no DOL claim) |
| IV-002 | `n/a` | Encore cab: glass, no mesh | ok | SUPPORT |
| IV-003 | `5.0 Dangers of driving (Hazard perception)` | Cover the brake: lift off gas, hold over pedal, do not ride it | **Invented child.** #10 has `5.0 Dangers of driving` only | **WEAK** |
| IV-004 | `4.1 Sharing with people` | Search parked-car gaps; yield to a person already in the road | #10 adds this heading | SUPPORT |
| IV-005 | `4.1 Sharing with people` | Never pass a car stopped for a pedestrian (double threat) | same | SUPPORT |
| IV-006 | `4.7 Sharing the road with trains (Light Rail)` | Street rail cannot swerve; do not stop/pass on the tracks | #10 form is `(Light rail)` | **FORM** + partial: body says do not **stop/park/leave** on tracks and leave one car length — not “do not drive in a track lane” |
| IV-007 | `4.12 Signs` | Stacked downtown signs (one-way, no turn on red, transit only) | already on main | SUPPORT |
| IV-008 | `4.5 Sharing with motorcycles` | Treat a motorcycle as a full vehicle; do not change into a rider already there | #10 adds this; body: never move into the same lane alongside | SUPPORT |
| IV-009 | `n/a` | Do not use horn/PA to force a path in ordinary congestion | DOL n/a is honest; Skill ten is a thin fit (character more than city-driving skill) | WEAK (PSDP) |
| IV-010 | `n/a` | Yuna beat | ok | SUPPORT |
| IV-011 | `4.18 Parking` | Backing out of angled/perpendicular: yield to people in the street | parent already on main; body covers angled/perpendicular | SUPPORT (people-yield is also 4.1) |
| IV-012 | `n/a` | Callback of the double-threat | ok | SUPPORT |
| IV-013 | `4.18 Parking (Parallel parking)` | After parallel park, far-hand reach / check the bike lane before the door | #10 skipped this child. Body of parallel parking is **how to park**, not the door zone | **WEAK** — target is `4.6 Sharing with bicyclists` (already on main; II-026 already teaches it) |
| IV-014 | `5.0 Dangers of driving (Situational awareness)` | Delivery stop + door into the lane: brake in lane, do not swerve blind | Invented 5.0 child. 5.0 does not name a door-in-lane procedure | **WEAK** |
| IV-015 | `4.15 Other intersections (Uncontrolled Intersection)` | Simultaneous arrival: left yields to the right | #10 skipped the child. **4.15 uncontrolled body does not say yield-to-the-right.** It lists: already in the intersection; secondary onto a state highway; unpaved onto paved; left vs oncoming. Yield-to-the-right is the **all-way stop** rule (`4.13 Common intersections`, II-024) | **WRONG** |
| IV-016 | `n/a` | Deac parked; Mya on the dash because the bus is still | ok | SUPPORT |
| IV-017 | `n/a` | Handover. He decided. No quiz. | ok | SUPPORT (hand-written this PR; not an exam) |
| IV-018 | `4.19 Transporting (Secure your load / Animals)` | Secure both cats before you roll | **Invented slash-combine.** #10 has the two children as separate strings | **FORM** — target is `4.19 Transporting (Animals)` (loose animal / lap = distraction). Secure-your-load is straps and netting, not cats |
| IV-019 | `5.10 Law enforcement (Getting pulled over)` | Stay in the vehicle, hands on the wheel, dome on, wait | #10 adds this heading; body matches | SUPPORT |
| IV-020 | `5.10 Law enforcement (Getting a ticket)` | Ticket is a record that must be answered; not automatic suspension | #10 skipped this child. Body: sign the ticket (not guilt); follow the back **within 15 days** or privileges can be suspended | **FORM** + partial WEAK (“not permission to keep the behavior” is not in the section) |
| IV-021 | `5.9 Collisions (Witnessing a crash)` | Slow, give space, observe; do not become part of it | #10 has parent `5.9 Collisions` only. Witnessing subsection exists in the book: do not block responders; do not rubberneck | **FORM** (teaching is close) |
| IV-022 | `5.9 Collisions (Reporting a crash / Calling 911)` | Witness calls 911 with location, count, injuries, blockage — not fault | Invented slash-combine. Reporting / 911 in the book is for **drivers in the crash**, not a passerby | **WEAK** |
| IV-023 | `5.7 Vehicle failures (Headlight)` | Headlamp dies: hazards, off the travel lane, do not keep speed | #10 has parent only. Book **does** have a Headlights child: hazards, pull off | **FORM** (teaching matches the child) |
| IV-024 | `4.20 Maritime (Ferries)` | Ferry line: wait, crew, brake, engine off if told, stay with the vehicle | #10 adds this heading | SUPPORT (card adds “do not pass in the loading line,” which the body implies via line-cutting) |
| IV-025 | `n/a` | Callback of the open door / live hazard | ok | SUPPORT |
| IV-026 | `5.0 Dangers of driving (Hazard management)` | Multiple hazards: slow and separate; do not solve three with one steer | Invented 5.0 child. Body under 5.0 *does* say more than one hazard, pick the urgent one, drive slower | **FORM** (do not mint the child; cite `5.0 Dangers of driving` or retarget) |
| IV-027 | `5.0 Dangers of driving (Situational awareness)` | Hold a following gap in stop-and-go; do not close up for a tailgater | Invented child. 5.0 situational awareness is “observe and predict.” Following time is **`5.2 Space` / `5.4 Time (Count seconds)`** — already on main | **WEAK** |
| IV-028 | `n/a` | Both cats, parked; nobody names the lot | ok | SUPPORT |
| IV-029 | `n/a` | Decline a pass that gains nothing | DOL n/a. The rule is `4.10 Traffic laws` (keep right except to pass) / Skill nine — already taught on III-029 | WEAK (PSDP Skill ten as a pass-decline) |
| IV-030 | `n/a` | Cliffhanger; Act V locked | ok | SUPPORT |

Skill ten strings on PR #12 match PR #10 (`Skill ten: city driving – part one` / `part two`, U+2013). Those are allowlist-OK once #10 lands. They do not rescue a WEAK DOL.

---

## Weak / wrong flags (the list)

1. **IV-015 WRONG** — Uncontrolled 4.15 does not teach “left yields to right.” That is 4.13 all-way stop. Recite or rewrite the rule the card grades.
2. **IV-003 WEAK** — Cover-the-brake is a pedal skill (Skill two / Skill ten), not 5.0 hazard-perception prose. Do not invent `5.0 (Hazard perception)`.
3. **IV-013 WEAK** — Door-zone / far-hand reach is 4.6, not parallel-parking procedure.
4. **IV-014 WEAK** — 5.0 does not specify “brake in lane, do not swerve” for an opening door.
5. **IV-022 WEAK** — 5.9 reporting/911 is for involved drivers, not a witness call script.
6. **IV-027 WEAK** — Following gap is 5.2 / 5.4, not 5.0 situational awareness.
7. **IV-009 WEAK** — Horn/PA discipline has no DOL on the card; Skill ten is a stretch.
8. **IV-029 WEAK** — Pass-decline is 4.10 / Skill nine, not a Skill ten city-driving slot.
9. **IV-018 FORM** — Split to `4.19 Transporting (Animals)`. Do not keep the slash.
10. **IV-006 FORM** — Use `(Light rail)` as on PR #10. Do not overclaim “do not drive on street rail.”
11. **IV-020 FORM** — `5.10 (Getting a ticket)` is not on PR #10. Do not collapse to the bare parent if the slot needs the child — wait for a locked heading, or teach only what `Getting pulled over` already says.
12. **IV-021 / IV-023 / IV-026 FORM** — Cite the PR #10 parent, or wait. Do not mint Headlight / Witnessing / Hazard management as allowlist strings.

---

## Precedent (already shipped — same failure class)

String-match already passed these. Teaching-target does not.

| Card | Cite | Target | Flag |
|---|---|---|---|
| **II-018** | `5.5 Focus` | Restrain pets; loose animal is a distraction | **WEAK** once 4.19 exists. 5.5 is attention-in-general. The book names loose animals / lap under **`4.19 Transporting (Animals)`** (PR #10). Recite when #10 lands. |
| I-006 | `5.5 Focus` | How you get the cat; calling starts the noise | WEAK — 5.5 is driving attention, not the Quiet/sound rule. |
| I-007 | `5.5 Focus` | The lunge, lived, no grade | WEAK — story beat wearing a focus heading. |
| I-008 | `5.5 Focus` | Sound draws them; empty seat | WEAK — same dump as I-006. |
| III-001 | `4.10 Traffic laws` | Sweep, hold right, never take a late merge | Partial — keep-right is in 4.10; the late-merge consequence is `5.3 Merging`. |

Do not “fix” these in this PR. They are the pattern Act IV must not repeat.

---

## Coordination

| Path | Where | Do |
|---|---|---|
| `cards/drafts/IV-017-CONVERSATION.md` | this PR | Hand-written authority for the handover. |
| `cards/IV-017.json` | this PR | Replaces PR #12 generated copy. Do not seed. |
| `cards/drafts/IV-001-ridealong-lines.md` | **PR #12** | Already drafted. Cite, do not fork. |
| `CITATION_AUDIT.md` | this PR strengthens PR #12’s string-match table | |
| Skill ten + DOL allowlist | **PR #10** | Cite against it. Do not undo. |
| Encore exteriors | blocked | Separate agent. |
| I-009 / I-010 art | ART GATE | Do not touch. |
| IV-002…016, 018…030 generation | **PR #12** | Do not regenerate. |

Mock exam = Deac runs the real WA DOL from the book (pack/28 §5 on PR #9). Mya handover = IV-017, not a quiz.
