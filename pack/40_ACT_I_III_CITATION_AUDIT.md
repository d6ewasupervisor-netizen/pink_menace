# 40 — Acts I & III citation audit (meaning-not-strings)

Research only. Text/pack report. **No art. No stills. No seeding.**

Standard match: Acts IV–VI / `pack/37_ACT_V_CITATION_AUDIT` style.

- Exact allowlist strings must be valid (`pack/07_DOL_SECTIONS.json`, `pack/08_PSDP_SKILLS.json`).
- **Meaning:** `teaching_target` + scene/debrief must actually be taught by that DOL section / PSDP skill — not a catch-all parent.
- Catch-all smells: `4.10 Traffic laws`, `4.12 Signs`, `5.5 Focus` when a more specific heading exists.
- Act I narrative/lot: `n/a` / `n/a` can be **PASS** if truly non-curriculum.
- Act III keep-right citing `4.10`: legitimate if DOL body teaches keep-right there (verified).
- Lane-change eyes-off (**III-004**, **III-027**) citing `5.5 Focus`: verify vs Skill nine looking habits.
- **III-002** Mya on dash while parked: citation only; art debt is separate.

Sources checked: `source/25WAPSDP_LR_v3.pdf` (Skill one / two / four / six / nine), `source/driver-guide.pdf` (bodies as cited). Cards: live `cards/I-*.json` and `cards/III-*.json` (`*-NNN.json` only).

**Allowlist:** all 42 cards pass `scripts/validate-citations.js` string checks.

Verdicts: **PASS** = string OK + body teaches the target. **FAIL** = clearly wrong (wrong section, catch-all for non-curriculum, or verbatim mismatch). **NEEDS-REVIEW** = ambiguous / weak pairing.

---

## Key source checks

| Claim | Source |
|---|---|
| Keep right except to pass (multi-lane same direction) | DOL **4.10** General driving guidance — exact |
| Signal 100 feet before you move | DOL **2.5** Turn signals — exact |
| Merge gap: no swerve / slow / stop | DOL **5.3 Merging** — exact (not 5.2) |
| Mirror + over-shoulder before lane change | PSDP **Skill nine** p1 Lesson four — exact |
| Do not change lanes / pass unnecessarily | PSDP **Skill nine** p1 Lesson four + p2 Lesson three |
| Whole front of passed vehicle in mirror before recover | PSDP **Skill nine** p2 Lesson three — exact |
| Phone / in-car entertainment off; distraction | DOL **5.5 Focus** — exact |
| Blind zones: if you can't see truck mirrors… | DOL **4.4** — exact |
| Zipper: both lanes then alternate | DOL **5.3** Zipper merging — exact |
| Wet: drive below posted | DOL **5.6** Slippery roads — exact |

**III-004 vs III-027:** Skill nine teaches the **procedural look** (mirrors + shoulder). 5.5 Focus teaches **distraction / mental presence** (phones, entertainment). III-004 is procedure → 5.5 is catch-all. III-027 is a screen mid-maneuver → 5.5 is correct.

---

## Act I — I-001 … I-012

| card_id | title | psdp_skill | dol_section | teaching_target (short) | verdict | notes |
|---|---|---|---|---|---|---|
| I-001 | The Pass Is Closed | n/a | n/a | Goal in miles; pass closed; cats; license today | PASS | Narrative frame. Non-curriculum. |
| I-002 | Before the Engine | Skill one: before you start the engine | 2.5 Vehicle Maintenance | Walk the car before start (tires, glass, ground) | PASS | Skill one Lesson one walk-around. 2.5 parent covers tires + glass; no better child for full walk. |
| I-003 | The Belt | n/a | 2.6 Occupant Protection | Fasten her belt before the car moves | PASS | 2.6 seat belts. |
| I-004 | Roll and Stop | Skill two: moving, steering, and stopping | n/a | Start, roll, stop on a picked line; smooth | PASS | Skill two lot start/stop. DOL n/a fine. |
| I-005 | Licensing Office, Kent | n/a | n/a | Establish DOL lot; license; both cats; building wrong | PASS | Narrative establish. Non-curriculum. |
| I-006 | Gracie's Out | n/a | 5.5 Focus | Quiet cut-off vs loud call to retrieve cat | FAIL | Lot/horror beat, not driving focus. 5.5 catch-all. Prefer `n/a` / `n/a`. |
| I-007 | The One You Didn't See | n/a | 5.5 Focus | The lunge; lived attempt; no grade | FAIL | Non-curriculum attack beat. 5.5 does not teach this. Prefer `n/a` / `n/a`. |
| I-008 | One of Them Comes Back | n/a | 5.5 Focus | Sound draws them; she watched the wrong thing | FAIL | Story rule, not DOL attention-while-driving. 5.5 catch-all. Prefer `n/a` / `n/a`. |
| I-009 | Before the Wheels | Skill one: before you start the engine | n/a | Look the aisle before she rolls | NEEDS-REVIEW | Engine already on in scene. Blind-spot look fits Skill one Lesson three, but skill title is pre-start; Skill two also coaches look before direction change. |
| I-010 | Out of the Stall | Skill four: backing up | n/a | Back out looking over the shoulder; slow; one motion | PASS | Skill four: turn and look through rear window; mirror not enough. |
| I-011 | The Window | n/a | n/a | Mom on radio; cats/pass; not how driving is going | PASS | Narrative. Non-curriculum. |
| I-012 | The Street | n/a | n/a | Close Act I; quiet streets first | PASS | Act closer. Non-curriculum. |

**Act I counts:** PASS **8** · FAIL **3** · NEEDS-REVIEW **1**

---

## Act III — III-001 … III-030

| card_id | title | psdp_skill | dol_section | teaching_target (short) | verdict | notes |
|---|---|---|---|---|---|---|
| III-001 | Your Wheel | Skill nine: multi-lane roads – part one | 4.10 Traffic laws | Sweep, hold right; never take a late merge | PASS | 4.10 keep-right verified in body. Sweep/late-merge carried by Skill nine (late merge shown as negative). |
| III-002 | Mya Has the Glass | n/a | n/a | Parked Ledger cab: cluster 0, Mya on dash, clipboard, mirrors | PASS | Parked establish; non-curriculum. Citation correct. Art debt separate. |
| III-003 | Stay Right Until You Pass | Skill nine: multi-lane roads – part one | 4.10 Traffic laws | Right lane; left to pass; return right | PASS | **4.10 legitimate** — body: “Keep right except to pass.” |
| III-004 | Sweep Before You Change | Skill nine: multi-lane roads – part one | 5.5 Focus | Mirror sweep + over-shoulder before lane change | FAIL | Skill nine p1 Lesson four is the looking procedure. 5.5 is distraction, not blind-spot cadence. Prefer DOL `n/a` (Skill nine carries). |
| III-005 | The Van You Cannot See | Skill nine: multi-lane roads – part one | 5.2 Space | Blind-spot sliver; do not finish change until visible | NEEDS-REVIEW | Meaning is Skill nine blind-spot look. 5.2 is space cushion, not “see him first.” Weak DOL. |
| III-006 | A Hundred Feet of Amber | Skill nine: multi-lane roads – part one | 2.5 Vehicle Maintenance (Turn signals) | Signal ≥100 ft before lane change | PASS | 2.5 Turn signals: “Signal 100 feet before you make your move.” |
| III-007 | Count the Gap First | Skill nine: multi-lane roads – part one | 5.2 Space | Gap large enough others need not swerve, slow, or stop | FAIL | Teaching_target is **verbatim 5.3 Merging**, not 5.2. Remap DOL → `5.3 Merging`. |
| III-008 | Broken White, Solid White | Skill nine: multi-lane roads – part one | 4.16 Road markings | Cross broken white; do not cross solid into restricted | PASS | 4.16 dashed vs solid white — exact. |
| III-009 | Hollis on Your Bumper | Skill nine: multi-lane roads – part one | 5.2 Space | If tailgated, open YOUR gap ahead; no brake-check | PASS | 5.2 keep space / room to act. Acceptable meaning fit. |
| III-010 | The Panel Again | Skill nine: multi-lane roads – part one | 5.2 Space | Cancel/hold until adjacent blind spot empty | NEEDS-REVIEW | Same as III-005: Skill nine looking; 5.2 weak. |
| III-011 | See His Mirrors or Leave | Skill nine: multi-lane roads – part one | 4.4 Sharing with large vehicles | If you can’t see truck mirrors, you’re invisible | PASS | 4.4 Blind zones — exact. |
| III-012 | Do Not Live Beside | Skill nine: multi-lane roads – part one | 4.4 Sharing with large vehicles | Don’t linger beside; finish pass; leave stopping room | PASS | 4.4 “Avoid driving alongside… too long” + Skill nine pass complete. |
| III-013 | Twenty-Six, None Preventable | n/a | n/a | Deac beat: record ≠ permission for a late gap | PASS | Character ledger. Non-curriculum. |
| III-014 | Arrow, Then Circle | Skill nine: multi-lane roads – part two | 4.11 Traffic light signals | Green arrow protected; circular green = yield then nearest lane right of yellow | PASS | 4.11 Green Arrow + Solid Green left-yield. Skill nine p2 protected left. |
| III-015 | The Center Lane Turns Only | Skill nine: multi-lane roads – part two | 4.16 Road markings | TWLTL for turns only; don’t tour/pass in it | PASS | 4.16 shared center lane + 300 ft / not for passing. Parent correct (not HOV child). |
| III-016 | The Hood Line Walks | n/a | 3.1 Impaired driving (Fatigue and drowsy driving) | Lane drift / missing stretch → stop and rest | PASS | 3.1 fatigue signs include lane drift. |
| III-017 | The Side Mirror Points Up | n/a | 2.5 Vehicle Maintenance | Reset knocked mirror before another gap | PASS | Parent OK (no Mirrors child on allowlist). Maintenance/view. |
| III-018 | The Whole Front in Glass | Skill nine: multi-lane roads – part two | 5.2 Space | Recover only when full front of passed vehicle is in mirror | FAIL | Skill nine p2 Lesson three exact. 5.2 does not teach that recover cue. Prefer DOL `n/a`. |
| III-019 | The Sign Talks First | n/a | 2.5 Vehicle Maintenance (Hand signals) | Slow/stop: sign + left-arm-down backup | PASS | 2.5 Hand signals: left arm, fingers to ground. |
| III-020 | The Straight Again | n/a | 3.1 Impaired driving (Fatigue and drowsy driving) | Second rumble/drift → stop and rest | PASS | Same 3.1 fatigue body. |
| III-021 | Reyna Off-Route | Skill nine: multi-lane roads – part one | 4.3 Sharing with transit buses | Yield to transit that signaled and is reentering | PASS | 4.3 exact. Skill nine is act-context multi-lane. |
| III-022 | Siren First | n/a | 4.9 Sharing with emergency vehicles | Pull right, stop, wait; reenter in order | PASS | 4.9 exact. |
| III-023 | Hold the General Lane | Skill nine: multi-lane roads – part one | 4.16 Road markings (HOV / Carpool lane) | HOV not a dart-through pass; solid vs broken | PASS | Specific HOV child — not 4.10 catch-all. |
| III-024 | Slow for the Water | Skill nine: multi-lane roads – part one | 5.6 Road and driving conditions (Slippery roads) | Below posted on wet so following time stays real | PASS | 5.6 Slippery: drive below posted. |
| III-025 | What He Sees at the Edge | n/a | n/a | Name the Drift; don’t stare at the smear | PASS | Antagonist beat. Non-curriculum (fatigue shape, not 3.1 lesson). |
| III-026 | Use Both Lanes, Then Zipper | Skill nine: multi-lane roads – part one | 5.3 Merging | Both lanes to merge point, then alternate | PASS | 5.3 Zipper merging — exact. |
| III-027 | The Tablet Wakes | Skill nine: multi-lane roads – part one | 5.5 Focus | No eyes to screen mid lane-change; cancel first | PASS | **Legitimate 5.5** — distraction mid-maneuver. Skill nine carries the lane-change hold. Unlike III-004. |
| III-028 | The Right Rear Tire Is Soft | n/a | 2.5 Vehicle Maintenance (Tires) | Tread ≥2/32; pressure; don’t roll on soft tire | PASS | 2.5 Tires — exact. |
| III-029 | The Pass That Gains Nothing | Skill nine: multi-lane roads – part two | 4.10 Traffic laws | Don’t pass unless the pass does useful work; keep right | PASS | Skill nine “don’t change/pass unnecessarily” + **4.10 keep-right** verified. |
| III-030 | The Core From Here | n/a | n/a | Cliffhanger: Core visible; Act IV locked; Yuna tease | PASS | Act closer. Non-curriculum. |

**Act III counts:** PASS **25** · FAIL **3** · NEEDS-REVIEW **2**

---

## Summary

| Act | Cards | PASS | FAIL | NEEDS-REVIEW |
|---|---:|---:|---:|---:|
| I | 12 | 8 | 3 | 1 |
| III | 30 | 25 | 3 | 2 |
| **Total** | **42** | **33** | **6** | **3** |

### FAIL list (fix remaps)

| Card | Problem | Suggested cite |
|---|---|---|
| I-006 | 5.5 catch-all on lot/horror | `n/a` / `n/a` |
| I-007 | 5.5 catch-all on attack beat | `n/a` / `n/a` |
| I-008 | 5.5 catch-all on story rule | `n/a` / `n/a` |
| III-004 | 5.5 for Skill nine looking procedure | Skill nine p1 + DOL `n/a` |
| III-007 | 5.2 but target is 5.3 Merging body | Skill nine p1 + `5.3 Merging` |
| III-018 | 5.2 for Skill nine p2 pass-recover cue | Skill nine p2 + DOL `n/a` |

### NEEDS-REVIEW list

| Card | Ambiguity |
|---|---|
| I-009 | Skill one vs Skill two once engine is already on |
| III-005 | Blind-spot hold under 5.2 vs Skill-nine-only |
| III-010 | Same as III-005 (callback) |

### Verified keep-right / 5.5 decisions

- **III-003, III-029 (and III-001 keep-right thread):** `4.10 Traffic laws` **PASS** — DOL body teaches keep-right except to pass.
- **III-004** `5.5 Focus` **FAIL** — procedural look is Skill nine, not Focus.
- **III-027** `5.5 Focus` **PASS** — eyes-off to a screen is Focus.
- **III-002** `n/a` / `n/a` **PASS** — parked cab establish; art separate.
