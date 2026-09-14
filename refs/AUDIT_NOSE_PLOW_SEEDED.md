# AUDIT — seeded Menace nose plow vs take-8

**2026-09-12. Audit only. No live-seed. No regen.**

PR #121 promoted `refs/candidates/nose-plow-fullwidth-take-8.png` to live `refs/ref_car_nose_plow.png` (`sha256:c6c8ec1fe709ddb8329e7b5def830dae0959002bf838ba1afcdbaf51d63d1133`). Anything compiled against the superseded take-5 plate (PR #69, `sha256:940077d1…`) can now disagree with live authority.

This note inventories **file-seeded** Act IV Menace frames (and flags other acts) where the car nose / plow is visible, then recommends KEEP or RE-SEED. Act I–III are out of scope for replay.

## Authority (take-8)

Muted-read teaches: **one flat blade spanning the entire nose on the black-tube bull bar; nothing on the flanks.**

| Must | Must not |
|---|---|
| Full-width nose-mounted blade | Asymmetric / corner stub |
| Blade on the front bull bar | Side outrigger / flank-mounted blade |
| Clean flanks | Rear-mounted blade |
| Readable span across both front tires when the nose is in frame | Empty bull bar with a left-front flap |

Take-5 (PR #69) is out of the reference pool. `diag_nose_plow_front.png` (PR #116) stays diagnostic only.

## Method

Main has no Act IV stills. Seeded bytes were read from the open seed / regen PRs listed below (same files PR #107 treated as the Act IV seed map, plus later seeds). Each still was judged at card size against take-8, not against the card’s other residuals (weather, heading, cats).

`DATABASE_URL` is not set here. Live Postgres membership follows PR #107’s audit (`in_db_not_repo` for most Act IV rows). This PR does not write the database.

## Headline

| Priority | Card | Take | Rec | One line |
|---|---|---|---|---|
| **1** | **IV-026** Separate the Three | **110** | **RE-SEED** | Owner-override corner stub, compiled on take-5. Now contradicts take-8. |
| 2 | IV-006 Tracks in the Lane | 1 | **RE-SEED** | Overhead shows a wide blade on the **rear** (oval window). Wrong end. |
| — | IV-004 Between the Parked | **177** (179 runner-up) | **KEEP** | No real contradiction. Soft far-nose edge from rear-¾ is the accepted away read. |

---

## 1. IV-026 take-110 — RE-SEED

**Seed:** `cards/takes/IV-026-take-110.png` → `cards/IV-026.png` (PR #72). Owner (Tyson) override 2026-09-11. Not a Claude PASS.

**Plate at compile:** take-5 (`940077d1…`) via PR #71. Brief already demands take-8 geometry: *“full-width flat plow blade spanning both front tires”* and negatives *“no small black blade on the left-front corner”*.

**Pixels:** away rear-¾, wet downtown, three hazards ~two lengths. Rear bumper is a black tube bar. On the **left-front corner** a vertical black stub stands in for the plow. The far nose does not carry a continuous blade across both front tires. Same residual PR #71 recorded on take-110 / take-107.

That stub is the old corner-plow residual. It is not take-8. `refs/LOCKS.md` on PR #72 already says: do not treat the away-POV stub as the plow lock. Live authority is now take-8, so the override is stale.

**RE-SEED** when Brad compiles against take-8. Keep the accepted scene (away, daylight, motion, two-length stack). Do not promote take-110’s stub. Do not flip the car toward camera to “get the plate” (PR #71 take-113 pattern).

---

## 2. IV-004 takes 177 / 179 — KEEP

**Seed:** take **177** (PR #112). Take **179** is runner-up — not seeded. Claude muted-read PASS (177 over 179). PR #121 already left both PASSED.

**Brief (PR #112):** rear-¾ away; *“a dark nose-plow shape on the FAR front… a soft or implied plow is acceptable on this rear-¾.”*

**Pixels:**

| Take | What the nose shows |
|---|---|
| **177** (live) | Thin dark vertical at the left-front corner — the near edge of a nose blade from rear-¾. Flanks otherwise clean. No door-line outrigger. |
| **179** (runner-up) | Same class, slightly more 3D / wrapped. Still not a side plow along the quarter. Do not seed. |

From this camera a full-width bull-bar blade **cannot** span the frame the way take-8’s head-on plate does. You get the near edge. That is perspective, not a corner-plow identity. No real contradiction with take-8.

**KEEP** take-177. Do not unseed. Do not seed 179. Do not regenerate for plow.

---

## Table — plow / nose visible (judgeable)

| Card | Title | Seed take | Source PR | Compiled on | Match take-8? | Rec | Why |
|---|---|---|---|---|---|---|---|
| **IV-026** | Separate the Three | **110** | #72 (on #71) | take-5 plate | **No** — left-front corner stub | **RE-SEED** | Owner override; residual now illegal vs live plate. |
| **IV-004** | Between the Parked | **177** | #112 (takes on #109) | take-5 plate | **Yes, for this camera** — soft far-nose edge | **KEEP** | Explicit PASS. No side outrigger. 179 stays runner-up. |
| **IV-006** | Tracks in the Lane | **1** | #34 | pre-plate (exterior lock only) | **No** — wide blade on the **rear** (oval window / engine lid) | **RE-SEED** | Plow is the orientation anchor. Rear mount teaches the wrong end. Front is a thin hoop. |
| **IV-015** | Already In the Circle | **1** | #25 | pre-plate | **No** — overhead nose is a thin hoop, no full-width blade | **KEEP** | Wave-one PASS. Lesson is the uncontrolled / circle, not plow identity. Do not treat as plow authority. Recompile only if the diagram is redone for other reasons. |
| **IV-012** | The Same Crosswalk | **32** | #76 | after take-5 | **N/A** — nose hidden; clean rear; maybe a bull-bar tick | **KEEP** | Plow not readable. Not a corner-plow still. |
| **IV-030** | The Door to the Pass | **65** | #106 (on #103) | after take-5 | **N/A** — receding overhead, stock Beetle nose | **KEEP** | Blade not readable at this distance. Not a stub. |
| **IV-011** | Backing Into People | **98** | #58 | pre-plate | **N/A** — rear-out; no nose | **KEEP** | Plow not in frame. Brief wanted nose-in / plow to the wall — that is a camera/read issue, not this plate audit. |

## Table — seeded, plow not in frame

These are live (or file-seeded) Act IV cards. Nose / plow is not visible. **KEEP** for this audit. Do not regenerate for take-8.

| Card | Title | Seed take | Source PR | Camera | Note |
|---|---|---|---|---|---|
| IV-003 | Cover the Brake | 1 | #25 | `POV_OBJECT` | Footwell. |
| IV-005 | The Double Threat | 97 | #107 / #101 | `POV_COCKPIT` | Mesh + sedan + ped. No hood / blade. |
| IV-007 | Transit Only | 30 | #119 (replaces 25) | `POV_OBJECT` | Sign faces. Brief: plow not in frame. |
| IV-008 | The Bike in the Gap | 1 | #36 / #37 | `POV_MIRROR_DOOR` | Mirror + flank. No nose. |
| IV-010 | Eleven Months | 7 | #25 | `POV_PORTRAIT` | Yuna. Encore, not Menace plow. |
| IV-013 | Door Before You Step | 4 | #30 | `POV_MIRROR_DOOR` | Bike in glass. No nose. |
| IV-016 | He Does Not Get Out | 17 | #111 | `POV_ROADSIDE_PROFILE` | Ledger. No Menace. |
| IV-017 | Because He Decided / The Conversation | 1 | #25 | `POV_PORTRAIT` | Deac. No Menace. |
| IV-018 | Two on the Seat | 1 | #25 | `POV_COCKPIT` | Dash + carrier. No hood / blade. |
| IV-027 | Space With No Space | 49 | #82 | `POV_MIRROR_REAR` | Truck in interior glass. No Menace nose. No rear plow on ego. |
| IV-028 | Both in the Carrier | 70 | #108 | `POV_COCKPIT` | Carrier + crosswalk through mesh. Brief allows a thin sliver; none readable. |

IV-001 named-spot WebPs (count-in / handoff / brake) are not scored `npm run seed` rows. None show the nose plow.

## Not seeded — nose would matter later

Do **not** seed from this PR. When Brad compiles, attach take-8 (`ref_car_nose_plow.png`), never take-5.

| Card | Why the nose matters |
|---|---|
| IV-014 Driver in the Lane | Cockpit; plow through mesh is the aim point. |
| IV-022 Who You Call | Roadside Menace on a pad. |
| IV-023 One Lamp Dark | **Headlamp housing is the subject** — closest thing to a take-8 lock card in the deck. |
| IV-024 Colman Dock | Profile; plow toward the boat. |
| IV-025 The Same Truck | Roadside; plow toward the crate. |
| IV-029 The Pass She Leaves | Overhead; plow at the leading end. |
| IV-002 / 009 | Encore glass — hatchback nose, **no Menace plow**. |

## Act I–III (no replay)

Compiled against `ref_car_exterior.jpg` only. Never saw take-5 or take-8. **Do not replay this PR.**

Noted only so the inventory is complete: several Act II overheads (e.g. II-017) show a front hoop / wing and no full-width nose blade, same class as IV-015. Treat as accepted legacy unless an Act II stills pass is reopened.

## Next compile (not this PR)

1. **IV-026 first.** Same brief family as PR #71 (away, daylight, two-length three-hazard stack) with **take-8** attached. Reject any left-front stub and any toward-camera “plate proof.”
2. **IV-006** when convenient. Overhead, plow at the **leading** end, rear clean. Wave-one take-1 teaches the wrong end.
3. Leave **IV-004 take-177** on the plate. Leave **179** unseeded.

No Act I–III work. No `npm run seed`. No stills in this tree.
