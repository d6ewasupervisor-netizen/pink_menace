# Citation audit — after Act IV fixes (POST-FIX)

Human citation audit. Text before pixels. No art. No frame seed. No Encore exterior compile. No Act I/II/III replay.

**POST-FIX 29-row list (live JSON):** `ACT_IV_CARD_AUDIT_LIST.md`.

**Allowlist authority:** PR #10 (`cursor/citation-encore-glass-8e42`) — `pack/07_DOL_SECTIONS.json` + `pack/08_PSDP_SKILLS.json`. This branch copies those two files and adds **one** real TOC child:

- `5.10 Law enforcement (Getting a ticket)` — official WA Driver Guide TOC (dol.wa.gov, checked 2026-09-11). Not minted.

Official body: WA Driver Guide text-only. Rechecked 2026-09-11.

**IV-017 is ACCEPTED AS WRITTEN.** Do not soften, lengthen, or add curriculum. Scene field is the same words in order, broken into staging / nine Deac lines / Ali — not a wall paragraph.

---

## Claude audit paths (full text)

| # | What | Path |
|---|---|---|
| 1 | IV-001 twelve lines | `cards/drafts/IV-001-ridealong-lines.md` |
| 2 | IV-017 card + Deac dialogue verbatim | `cards/IV-017.json` (scene, line-broken) · `cards/drafts/IV-017-CONVERSATION.md` (nine lines) |
| 3 | This audit | `CITATION_AUDIT.md` |
| 4 | IV-018 full card copy | `cards/IV-018.json` · `cards/drafts/IV-018-card.md` — carrier not in scene |
| 5 | All 29 Act IV cards (002–030) POST-FIX | `ACT_IV_CARD_AUDIT_LIST.md` · `cards/drafts/IV-CARD-INDEX.md` |
| 6 | Hazard→scene flip | **IV-026** — see below |
| 7 | Act II camera-cap ticket | `pack/DISABLED_TICKETS.md` (GitHub Issues API not writable from this agent) |

---

## How to read the flags

| Flag | Meaning |
|---|---|
| **SUPPORT** | Heading matches the allowlist (or `n/a` on a beat) **and** the section body states the target. |
| **FORM** | Teaching is in the official body; heading string was wrong. Fixed this PR. |
| **WEAK** | Heading existed; body did not teach the target. Recited or replaced this PR. |
| **WRONG** | Section body contradicted the graded rule. Rewritten this PR. |
| **FIXED** | Was WRONG / WEAK / FORM; now SUPPORT. |

---

## IV-014 cite choice

**`5.2 Space`**, not `4.6 Sharing with bicyclists`.

The correct option is *Cover, brake, stop short of the open door, wait until he is back inside.* What it grades is space ahead (stop short) and not taking unchecked space beside (no blind swerve / no left without a look).

4.6 is the door-zone / Dutch-reach rule for **your** door and a bike — that is IV-013. IV-014 is someone else's door opening into **your** lane. 5.2: keep space around the vehicle; leave room to act when something is in the path of travel.

---

## Hazard → scene flip (13/4 specced vs 14/3)

**IV-026** is the slot. It did not change type in JSON.

PR #12's user prompt said `DISTRIBUTION: 13 scene, 4 hazard, …` and also typed the numbered row `IV-026 · scene · Hazard management`. Hazards in that table were only **005, 014, 021**. The generator followed the per-row types (14 scene / 3 hazard), not the summary line. IV-026 stayed a scene because the slot table said scene; the implied fourth hazard was never a numbered `hazard` row.

This PR does not flip it to hazard. 5.0 is used here because the card teaches the named 5.0 skill (more than one hazard: slow, separate, do not solve three with one steer).

After IV-029 → dossier: **13 scene, 3 hazard, 2 rule, 1 convoy, 1 wrench, 2 ledger, 7 dossier** (IV-002…030).

---

## Act IV — cite ↔ `teaching_target` (after fixes)

| Card | Cited DOL | Target (short) | Flag |
|---|---|---|---|
| IV-001 | `n/a` | Yuna ride-along (lines only) | SUPPORT |
| IV-002 | `n/a` | Encore cab: glass, no mesh | SUPPORT |
| IV-003 | `5.5 Focus` | Cover the brake (Skill ten primary) | **FIXED** (was invented `5.0 (Hazard perception)`) |
| IV-004 | `4.1 Sharing with people` | Yield to a person already in the road | SUPPORT |
| IV-005 | `4.1 Sharing with people` | Never pass a car stopped for a pedestrian | SUPPORT |
| IV-006 | `4.7 Sharing the road with trains (Light rail)` | Do not stop/park/leave on the tracks; leave the track lane | **FIXED** (lowercase r; no overclaim) |
| IV-007 | `4.12 Signs` | Stacked downtown signs | SUPPORT |
| IV-008 | `4.5 Sharing with motorcycles` | Motorcycle is a full vehicle | SUPPORT |
| IV-009 | `n/a` | Horn/PA convoy-story; not Skill ten | **FIXED** (`psdp` now `n/a`) |
| IV-010 | `n/a` | Yuna beat | SUPPORT |
| IV-011 | `4.18 Parking` | Backing out: yield to people in the street | SUPPORT |
| IV-012 | `n/a` | Callback of the double-threat | SUPPORT |
| IV-013 | `4.6 Sharing with bicyclists` | Door zone / far-hand; parallel-park maneuver kept | **FIXED** |
| IV-014 | `5.2 Space` | Brake in lane; do not take unchecked space | **FIXED** (see cite choice) |
| IV-015 | `4.15 Other intersections` | Roundabout: yield to traffic already in; look left; no lane change inside; signal on exit | **FIXED** (was WRONG 4.13-class yield-to-right). Parent only — PR #10 skipped 4.15 children. Skill thirteen not on allowlist → Skill ten p2. |
| IV-016 | `n/a` | Deac parked; Mya on the dash because still | SUPPORT |
| IV-017 | `n/a` | Handover. He decided. No quiz. | SUPPORT — **accepted as written** (scene line-broken only) |
| IV-018 | `4.19 Transporting (Animals)` | Secure both cats before you roll | **FIXED** (exact string) |
| IV-019 | `5.10 Law enforcement (Getting pulled over)` | Stay in the vehicle, hands, dome, wait | SUPPORT |
| IV-020 | `5.10 Law enforcement (Getting a ticket)` | Sign (not guilt); follow the back within 15 days | **FIXED** (real TOC child added to pack/07) |
| IV-021 | `5.9 Collisions` | Slow, give space; do not become part of it | **FIXED** (plain parent) |
| IV-022 | `5.9 Collisions` | Emergency kit (triangles, first aid, paper numbers, water) | **FIXED** — **replaced**. Witnessing a crash has **no** passerby 911 script (do not block; do not stare). Not Crashing a vehicle (that is the involved driver; would fight IV-021). |
| IV-023 | `5.7 Vehicle failures` | Dead headlamp: hazards, off the lane, fix | **FIXED** (plain parent) |
| IV-024 | `4.20 Maritime (Ferries)` | Ferry line | SUPPORT |
| IV-025 | `n/a` | Callback of the open door | SUPPORT |
| IV-026 | `5.0 Dangers of driving` | Multiple hazards: slow and separate | **FIXED** (plain parent; 5.0 only because the card teaches that named skill) |
| IV-027 | `5.2 Space` | Hold a following gap in stop-and-go | **FIXED** |
| IV-028 | `n/a` | Both cats, parked; nobody names the lot | SUPPORT |
| IV-029 | `n/a` | Yuna thesis: when **not** to be loud. Dossier. | **FIXED** — **replaced** (was III-029 pass-decline duplicate) |
| IV-030 | `n/a` | Cliffhanger; Act V locked | SUPPORT |

Skill ten strings match PR #10 (`Skill ten: city driving – part one` / `part two`, U+2013) except IV-009 / IV-017 / dossiers on `n/a`.

---

## Fixes applied (the list)

1. **IV-015 WRONG → rewritten** — Roundabout under `4.15 Other intersections`. Not II-024's 4.13 left-yields-to-right.
2. **IV-003** — Skill ten primary; `dol_section` → `5.5 Focus`.
3. **IV-013** — `4.6 Sharing with bicyclists`; parallel-park maneuver kept.
4. **IV-014** — `5.2 Space` (see cite choice).
5. **IV-022** — Replaced with **5.9 Emergency kit** (not Crashing a vehicle). Witnessing has no call script.
6. **IV-027** — `5.2 Space`.
7. **IV-009** — `dol_section` n/a, `psdp_skill` n/a.
8. **IV-029** — Replaced: Yuna thesis, `n/a` / `n/a`, `card_type` dossier.
9. **IV-018** — `4.19 Transporting (Animals)` exactly.
10. **IV-006** — `(Light rail)` lowercase r.
11. **IV-020** — `5.10 Law enforcement (Getting a ticket)` added to pack/07 (real TOC).
12. **IV-021 / IV-023 / IV-026** — plain parents: `5.9 Collisions`, `5.7 Vehicle failures`, `5.0 Dangers of driving`.

**Precedent (text-only this PR):** II-018 `dol_section` → `4.19 Transporting (Animals)`. I-006 / I-007 / I-008 left on `5.5 Focus`.

---

## Coordination

| Path | Where | Do |
|---|---|---|
| `cards/drafts/IV-017-CONVERSATION.md` | PR #13, untouched | Hand-written authority. Accepted as written. |
| `cards/IV-017.json` | PR #13 words; line breaks this PR | Do not seed. Same words, same order. |
| `cards/drafts/IV-001-ridealong-lines.md` | from PR #12 | Cite, do not fork. |
| IV-002…016, 018…028, 030 | from PR #12; cites/rewrites this PR | |
| Skill ten + DOL allowlist | from PR #10 + Getting a ticket | |
| Act II camera-cap | `pack/DISABLED_TICKETS.md` | Do not regenerate Act II. |
| Encore exteriors | blocked | |
| I-009 / I-010 art | ART GATE | Do not touch. |

Mock exam = Deac runs the real WA DOL from the book (pack/28 §5 on PR #9). Mya handover = IV-017, not a quiz.
