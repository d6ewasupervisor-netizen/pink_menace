# 40 — Six-act audit (Acts I–VI)

Research / muted-read report only. **No art regen. No Postgres seed. No Act VII. No pack-rules consolidation.**

Claude asked for this after Act VI wave-1 art closed. Standard for citations = Acts IV–VI **meaning-not-strings** (`pack/37_ACT_V_CITATION_AUDIT` style): allowlist string exact **and** DOL/PSDP body actually teaches the card. Stills check = live master / WAVE1 winner vs current card JSON `image_brief.read` + scene (after remaps/reseeds).

**Scope of card trees used**

| Act | Card JSON / masters | Notes |
|---|---|---|
| I–IV | `main` (`cards/`) | Live ship tip for I–IV |
| V | `cursor/ship-act-iv-v-playtest-c458` (+ WAVE1_MAP / remaps) | Ribbon not on `main` yet |
| VI | `cursor/act-vi-wave1-remainder-57e9` + seed tips (`seed-vi-*`) | Wave-1 open; **do not seed from this audit** |

**`npm run audit-stills`:** not run against production. Railway `DATABASE_URL` is sealed to OAuth/MCP (values hidden). Local `DATABASE_URL` is a stub. Repo-side hash compare of live PNG ↔ art-review `pick` + visual muted-read against JSON is what this report uses. Re-run `DATABASE_URL=… npm run audit-stills` when plaintext creds are available.

Sources checked: `source/driver-guide.pdf` (esp. **4.19 Animals**, **5.5 Focus**, **4.10 Keep right**, **5.3 Merging**), `source/25WAPSDP_LR_v3.pdf`, `pack/07` / `pack/08`, `cards/art-review-state.json`, `cards/takes/WAVE1_MAP.md` (V/VI branches), `PLAYTHROUGH.md`.

---

## 1. Executive summary

| Bucket | Count | Headline |
|---|---:|---|
| Seeded masters reviewed (I–IV main + V playtest + VI seed tips) | **116** card JSON / **106** PNG masters | II-031 text-only debt; VI-003 / VI-008 no master on seed tip |
| Stills ↔ JSON **hard mismatches** | **4** | IV-018, I-003, III-019 live≠pick, IV-028 camera/moment |
| Stills **residuals / soft** | **6+** | V-008 cones, IV-026 plow stub, III-002 clipboard seat, VI-013 HOLD conflict, PLAYTHROUGH IV residuals |
| Act III art-review **READ_MISSING** | **15** | Seeded from best-of; muted-read never closed |
| Citation FAIL (I–III) | **7** | See §3 (II-018 + I-006/007/008 + III-004/007/018) |
| Citation NEEDS-REVIEW (I–III) | **8** | See §3 |
| Citation PASS (I–III) | **58** | Allowlist strings valid on main for I–III |
| Process debt | **2** | Act II camera-cap validator fail; `DISABLED_TICKETS` missing camera-cap row; main `pack/07` missing IV allowlist children |

**Verdict for Claude / Tyson:** not a clean sweep. Cheapest wins are citation remaps + allowlist sync. Play-blocking still mismatch is **IV-018** (carrier+112 vs “two on the seat”). Do not open Act VII. Do not seed from this PR.

---

## 2. Stills ↔ card text

### 2.1 Hard mismatches

| Card | Live still claims… | Current JSON wants… | Flag |
|---|---|---|---|
| **IV-018** Two on the Seat | Both cats **in a closed carrier**; dash LCD **112.0** | `read`: both cats **on the seat**; speedometer **0**; correct option is *Clip both in the carrier…* | **WRONG_MOMENT** + **112 lock**. Still teaches the *after* state / IV-028 grammar. |
| **I-003** The Belt | Both cats on the **driver’s lap**; dash **112.0**; belt buckle in hand | `read`: belt from **left B-pillar / behind left shoulder**; both cats **loose on the seat** | **WRONG_PROPS** + **112**. Lap ≠ seat; 112 forbidden speedlike LCD. |
| **III-019** The Sign Talks First | Live `cards/III-019.png` **≠** art-review closest `c-take-2` (hash diverge) | `read`: sign already on SLOW; stalled pickup **far right**; only follower’s **left** headlight in glass | **LIVE_NE_PICK**. Board still tags READ_MISSING; pick not what shipped. |
| **IV-028** Both in the Carrier | Carrier framed as **rear-window / hatch** view; pedestrian in crosswalk **behind** | `camera: POV_COCKPIT`; person **mid-crossing ahead** through the windshield | **WRONG_CAMERA / WRONG_MOMENT**. Teaching (carrier + crosswalk person) is split across axes. |

### 2.2 Soft residuals (known or WAVE1-noted)

| Card | Note |
|---|---|
| **V-008** The Cone Line | WAVE1_MAP: cones read as longitudinal fog-line file, not a strong lateral pinch toward skip-dash. Lesson remap (work zone / move over early) still readable; residual is plate+card. |
| **V-013** Flashers on the Strip | Playtest master = take-7 Quiet dressing on Flashers card (**not** Hollis). Quiet is distant shoulder silhouette — easy to miss at 390px. Confirm muted-read still passes after QP-003. |
| **V-006** Beside the Trailer | Remap (blind spots / ease off) matches door-height rig still. Soft: not both mirrors crisp (WAVE1 residual). |
| **IV-026** Separate the Three | `PLAYTHROUGH`: old plow stub (take 110); later plow regen unmerged. Three-hazard read is soft. |
| **IV-007** Transit Only | `PLAYTHROUGH`: composition drift vs later MUTCD regen; live is seeded PASS — do not regen in this audit. |
| **III-002** Mya Has the Glass | Parked + cluster 0 + Mya loaf OK. Clipboard reads **dash-right / mesh-adjacent**, not doghouse (brief + D4 lock). Prop debt under READ_MISSING. |
| **VI-013** The Clipboard, Again | Seed tips carry Ali+Deac+clipboard+carrier masters; `hold-unseed-vi-013` marks cast-FAIL / Postgres unseeded. **Treat as HOLD** until Brad seed map is single-sourced. |
| **VI-003 / VI-008** | No `cards/VI-00x.png` on current seed tip — takes only. Not live. |
| **II-031** Into the Dash | JSON only (no PNG). Fallout card from I-003 — expected. |

### 2.3 Act III art-review inventory (honest debt)

From `cards/art-review-state.json` (Act III):

| Tag | Count | Cards |
|---|---:|---|
| **READ_MISSING** | **15** | III-002, 003, 004, 006, 007, 009, 011, 014, 016, 018, 019, 021, 022, 025, 027 |
| GEOMETRY_WRONG | 1 | III-012 |
| COPY | 2 | III-017, III-023 |
| PASS | 11 | (remainder of tagged set) |

Fourteen of fifteen READ_MISSING have **live PNG == closest pick**. They were seeded from best-of-four **without** muted-read closeout. Live through playtests; surface as remaining art debt, not “random wrong files.” **III-019** is the exception (live ≠ pick).

### 2.4 Carrier / Deac / Quiet / 112 locks (spot check)

| Lock | Finding |
|---|---|
| **112 speedlike LCD** | **Fail on I-003 and IV-018** masters. Act VI briefs explicitly ban 112; sampled VI-002 / VI-005 / VI-009 masters look clean. |
| **Carrier** | IV-018 wrongly shows carrier (should be loose on seat). IV-028 has carrier but wrong camera. VI wave-1 continuity (Gracie latched) holds on sampled VI-002 / VI-005 / VI-013. |
| **Deac** | Act III Ledger frames; VI-013 only for second person + clipboard (standing lock). Do not treat other VI cards as Deac seats. |
| **Quiet** | V-013 take-7 Quiet dressing only among Ribbon wave-1. Act I lot Quiet is narrative; do not expect Quiet paint on highway Ribbon at seventy (`pack/37`). |
| **II-018** | Cat on dash while teaching “box before you roll” — **legal exception** (pack/24). Citation is the FAIL, not the still. |

### 2.5 Repo vs Postgres

`scripts/audit-stills.js` compares WebP hashes of `cards/*.png` to `cards.image_bytes`. **Blocked here** (sealed Railway secrets). After creds: run per act, fix any `mismatch` / `in_repo_not_db` before trusting playtest DB vs git.

---

## 3. Citation audit — Acts I–III (meaning-not-strings)

Allowlist string check on main: **I–III all pass** `validate-citations.js`. (Main `pack/07` is **missing** Act IV children `4.5` / `4.15` / `4.19` / `5.0` — IV cards FAIL string validation on main until allowlist sync; that is IV pack debt, not I–III.)

`pack/10_ACT_II_CITATION_PATCH.json` fabricated PSDP names (`seeing habits`, `keeping a space cushion`, `communicating`) are **gone** from live II JSON. What remains is meaning drift — especially **5.5 Focus** catch-alls and **II-018**.

### 3.1 FAIL list (fix these)

| card_id | Current `psdp_skill` | Current `dol_section` | Problem | Exact fix (allowlist string) |
|---|---|---|---|---|
| **II-018** | `n/a` | `5.5 Focus` | Pet restraint / box the cat. DOL **4.19 Animals** is the home (“Animals that are loose in a vehicle… are a potential distraction”). Same class as IV-018. | Add/keep `4.19 Transporting (Animals)`; set II-018 `dol_section` → **`4.19 Transporting (Animals)`**. PSDP may stay `n/a` or pair Skill ten context later — not 5.5. |
| **I-006** | `n/a` | `5.5 Focus` | Lot / Quiet call-out. Not driving Focus. | `dol_section` → **`n/a`** |
| **I-007** | `n/a` | `5.5 Focus` | Lunge beat. Non-curriculum. | → **`n/a`** |
| **I-008** | `n/a` | `5.5 Focus` | Sound-draws-them story rule. | → **`n/a`** |
| **III-004** | Skill nine p1 | `5.5 Focus` | Mirror + over-shoulder is **Skill nine** looking procedure, not distraction Focus. | `dol_section` → **`n/a`** (PSDP carries it) |
| **III-007** | Skill nine p1 | `5.2 Space` | Gap so others need not swerve/slow/stop is verbatim **5.3 Merging**. | → **`5.3 Merging`** |
| **III-018** | Skill nine p2 | `5.2 Space` | “Whole front in glass” is Skill nine pass-complete cue; 5.2 does not teach it. | → **`n/a`** |
| *(Act II prior class, confirmed)* | | | Four fabricated skill names + catch-all DOL parents from early II audit | Already patched via `pack/10`; do not reintroduce |

### 3.2 NEEDS-REVIEW

| card_id | Cite | Why review |
|---|---|---|
| **I-009** | Skill one / `n/a` | Engine already on; aisle look may be Skill two territory. |
| **II-005** | Skill six / `4.6` | DOL 4.6 exact; Skill six “looking ahead” is a soft PSDP home for a pass-distance card. |
| **II-026** | Skill six / `4.6` | Dutch reach / door zone is 4.6; Skill six is a stretch. |
| **II-027** | Skill six / `5.5 Focus` | School-zone edge search — prefer **4.17 Zones (School zone)** REVIEW over Focus catch-all. |
| **II-029** / **II-030** | Skill seven / `4.14 Turning` | Skill seven is correct; Turning parent is a mild catch-all for turnaround / two-point. |
| **III-005** / **III-010** | Skill nine / `5.2 Space` | Blind-spot hold; Skill nine look is primary, 5.2 weak. |

### 3.3 Full tables

#### Act I (12)

| card_id | psdp_skill | dol_section | teaching_target (short) | Verdict |
|---|---|---|---|---|
| I-001 | n/a | n/a | Pass closed; cats; license | PASS |
| I-002 | Skill one: before you start the engine | 2.5 Vehicle Maintenance | Walk the car before start | PASS |
| I-003 | n/a | 2.6 Occupant Protection | Belt before move | PASS (cite) / still FAIL §2 |
| I-004 | Skill two: moving, steering, and stopping | n/a | Start / roll / stop | PASS |
| I-005 | n/a | n/a | Establish DOL lot | PASS |
| I-006 | n/a | 5.5 Focus | Quiet cut-off vs loud call | **FAIL** → `n/a` |
| I-007 | n/a | 5.5 Focus | Lunge | **FAIL** → `n/a` |
| I-008 | n/a | 5.5 Focus | Sound draws them | **FAIL** → `n/a` |
| I-009 | Skill one: before you start the engine | n/a | Look the aisle before roll | NEEDS-REVIEW |
| I-010 | Skill four: backing up | n/a | Back out over shoulder | PASS |
| I-011 | n/a | n/a | Mom on radio | PASS |
| I-012 | n/a | n/a | Act closer | PASS |

**Act I:** PASS 8 · FAIL 3 · NEEDS-REVIEW 1

#### Act II (31) — focus of Claude’s note

| card_id | psdp_skill | dol_section | teaching_target (short) | Verdict |
|---|---|---|---|---|
| II-001 | n/a | n/a | Establish The Grid | PASS |
| II-002 | Skill five p1 | 4.17 Zones (School zone) | Flashing school lamps / search edges | PASS |
| II-003 | Skill five p1 | 4.12 Signs | Complete stop at sign / limit line | PASS |
| II-004 | Skill five p2 | 4.14 Turning | Left turn; wheels straight in pocket | PASS |
| II-005 | Skill six | 4.6 Sharing with bicyclists | Three feet; mirror before occupy | NEEDS-REVIEW (PSDP) |
| II-006 | Skill five p2 | 2.5 Vehicle Maintenance (Hand signals) | Arm down = slow/stop | PASS |
| II-007 | Skill six | 4.2 Sharing with school buses | Amber → stop prep; red+arm = stop | PASS |
| II-008 | n/a | 2.5 Vehicle Maintenance | Oil / temp; leave lane | PASS |
| II-009 | Skill six | 5.5 Focus | Eyes on road; device later | PASS (legitimate Focus) |
| II-010 | Skill six | 4.2 Sharing with school buses | Red+arm both directions | PASS |
| II-011 | n/a | n/a | Hours written down | PASS |
| II-012 | Skill three | 5.4 Time (Count seconds) | Three-second following | PASS |
| II-013 | Skill six | 4.12 Signs | Orange SMV triangle | PASS |
| II-014 | Skill three | 5.2 Space | Tailgater; hold space in fog | PASS |
| II-015 | Skill five p2 | 4.14 Turning | Right turn; search sidewalk | PASS |
| II-016 | Skill five p2 | 2.5 Vehicle Maintenance (Hand signals) | Left-turn arm | PASS |
| II-017 | Skill five p1 | 4.16 Road markings | No pass on solid yellow | PASS |
| II-018 | n/a | **5.5 Focus** | Restrain pets before roll | **FAIL** → **`4.19 Transporting (Animals)`** |
| II-019 | Skill three | 5.6 Road and driving conditions (Slippery roads) | Ice; six seconds | PASS |
| II-020 | n/a | 2.5 Vehicle Maintenance (Headlights) | Headlights in pairs | PASS |
| II-021 | Skill eight p1 | 4.18 Parking | Search before backing | PASS |
| II-022 | Skill five p2 | 2.5 Vehicle Maintenance (Hand signals) | Right-turn bent arm | PASS |
| II-023 | Skill six | 4.17 Zones (Work zone) | Never stop in live work lane | PASS |
| II-024 | Skill five p2 | 4.13 Common intersections | All-way stop order | PASS |
| II-025 | n/a | n/a | Night does not suspend rules | PASS |
| II-026 | Skill six | 4.6 Sharing with bicyclists | Dutch reach / door zone | NEEDS-REVIEW (PSDP) |
| II-027 | Skill six | 5.5 Focus | Continuous school-zone edge search | NEEDS-REVIEW → prefer `4.17 Zones (School zone)` |
| II-028 | n/a | 2.6 Occupant Protection | Clip and tug belt | PASS |
| II-029 | Skill seven | 4.14 Turning | Around the block | NEEDS-REVIEW (DOL parent) |
| II-030 | Skill seven | 4.14 Turning | Two-point turn | NEEDS-REVIEW (DOL parent) |
| II-031 | n/a | 2.6 Occupant Protection | I-003 debt; Gracie on dash | PASS (cite) |

**Act II:** PASS 25 · FAIL 1 · NEEDS-REVIEW 5  
*(Fabricated-skill patch: applied. Meaning gaps remain; II-018 is the smoking gun Claude named.)*

#### Act III (30)

| card_id | psdp_skill | dol_section | teaching_target (short) | Verdict |
|---|---|---|---|---|
| III-001 | Skill nine p1 | 4.10 Traffic laws | Sweep; hold right; no late merge | PASS |
| III-002 | n/a | n/a | Parked Ledger; Mya on dash | PASS (cite) |
| III-003 | Skill nine p1 | 4.10 Traffic laws | Keep right except to pass | PASS (4.10 body verified) |
| III-004 | Skill nine p1 | 5.5 Focus | Mirror + OTS before lane change | **FAIL** → `n/a` |
| III-005 | Skill nine p1 | 5.2 Space | Blind-spot sliver | NEEDS-REVIEW |
| III-006 | Skill nine p1 | 2.5 Vehicle Maintenance (Turn signals) | Signal ≥100 ft | PASS |
| III-007 | Skill nine p1 | 5.2 Space | Merge gap | **FAIL** → `5.3 Merging` |
| III-008 | Skill nine p1 | 4.16 Road markings | Broken vs solid white | PASS |
| III-009 | Skill nine p1 | 5.2 Space | Tailgated → open YOUR gap | PASS |
| III-010 | Skill nine p1 | 5.2 Space | Cancel until blind empty | NEEDS-REVIEW |
| III-011 | Skill nine p1 | 4.4 Sharing with large vehicles | See truck mirrors or leave | PASS |
| III-012 | Skill nine p1 | 4.4 Sharing with large vehicles | Don’t linger beside | PASS |
| III-013 | n/a | n/a | Character beat | PASS |
| III-014 | Skill nine p2 | 4.11 Traffic light signals | Arrow vs circular green | PASS |
| III-015 | Skill nine p2 | 4.16 Road markings | TWLTL turns only | PASS |
| III-016 | n/a | 3.1 Impaired driving (Fatigue and drowsy driving) | Lane drift → rest | PASS |
| III-017 | n/a | 2.5 Vehicle Maintenance | Reset knocked mirror | PASS |
| III-018 | Skill nine p2 | 5.2 Space | Full front in glass | **FAIL** → `n/a` |
| III-019 | n/a | 2.5 Vehicle Maintenance (Hand signals) | Slow: sign + arm down | PASS (cite) / still debt §2 |
| III-020 | n/a | 3.1 Impaired driving (Fatigue and drowsy driving) | Second rumble → rest | PASS |
| III-021 | Skill nine p1 | 4.3 Sharing with transit buses | Yield transit reentry | PASS |
| III-022 | n/a | 4.9 Sharing with emergency vehicles | Pull right for siren | PASS |
| III-023 | Skill nine p1 | 4.16 Road markings (HOV / Carpool lane) | HOV not a dart lane | PASS |
| III-024 | Skill nine p1 | 5.6 Road and driving conditions (Slippery roads) | Wet → below posted | PASS |
| III-025 | n/a | n/a | Name the Drift | PASS |
| III-026 | Skill nine p1 | 5.3 Merging | Zipper | PASS |
| III-027 | Skill nine p1 | 5.5 Focus | No eyes to tablet mid-change | PASS (legitimate Focus) |
| III-028 | n/a | 2.5 Vehicle Maintenance (Tires) | Tread / soft tire | PASS |
| III-029 | Skill nine p2 | 4.10 Traffic laws | Don’t pass unless useful | PASS |
| III-030 | n/a | n/a | Cliffhanger | PASS |

**Act III:** PASS 25 · FAIL 3 · NEEDS-REVIEW 2

#### I–III totals

| Act | Cards | PASS | FAIL | NEEDS-REVIEW |
|---|---:|---:|---:|---:|
| I | 12 | 8 | 3 | 1 |
| II | 31 | 25 | 1 | 5 |
| III | 30 | 25 | 3 | 2 |
| **Total** | **73** | **58** | **7** | **8** |

*(Executive FAIL count 10 includes counting I-006/007/008 + II-018 + III-004/007/018 = 7 card FAILs; plus prior fabricated-skill class already fixed = documented as closed. If Claude’s “four fabricated + six catch-all” historical count is the yardstick: fabricated closed; catch-all remnants are the FAIL/NEEDS-REVIEW rows above.)*

---

## 4. Act III process debt — camera cap / DISABLED_TICKETS

| Item | Status |
|---|---|
| **Amended camera cap** (`pack/12` §4) | Non-exempt token ≤25%; window-of-6 ≤2; `camera_is_the_lesson` exempt |
| **`node scripts/validate-act-iii.js`** | **ok** on current main (denom 24; exempt ride-along / mirror lesson cards) |
| **`node scripts/validate-act-ii.js`** | **FAILS:** `POV_DIAGRAM: 8/26 non-exempt (30.8%) exceeds 25% cap` + multiple window-of-6 / consecutive-token errors. Comment in script: Act II “shipped as-is; do not regenerate” for portraits — **camera-cap failure is still live on main** |
| **`pack/DISABLED_TICKETS.md`** | **No camera-cap row.** Claude asked for a ticket; it was never written. Fear-overlay rows only. |

**Recommendation:** add a DISABLED_TICKETS row: *Act II camera-cap / window-of-6 — validator red on main; ship-as-is until a text-only camera-token pass; do not regen stills to satisfy percentages.* Act III is green; do not “fix” Act II with image spend.

Act III also predates Spokane spine / card-JSON-is-authority — that debt shows up as READ_MISSING + GEOMETRY_WRONG, not as citation string failures.

---

## 5. Acts IV–VI (stills context only; citations already audited upstream)

| Act | Citation docs | Stills note for this audit |
|---|---|---|
| IV | Shipped with Core text / citation PRs | **IV-018** still is the worst live mismatch. IV-028 camera. IV-026 / IV-007 residuals per PLAYTHROUGH. |
| V | `pack/37_ACT_V_CITATION_AUDIT` (+ remaps PR #199) | Wave-1 V-006 / V-008 / V-013 masters match remapped lessons; V-008 cone residual; V-013 Quiet subtle. |
| VI | `pack/39_ACT_VI_CITATION_AUDIT` (open #207) | Wave-1 maps + standing locks (carrier every card; Deac only VI-013; no 112). Seed map is multi-PR / HOLD on VI-013. **No seed from this audit.** |

Main `validate-citations.js` currently errors on IV-008 / IV-015 / IV-018 / IV-026 because `pack/07` on main lacks their DOL children — sync from Act V branch allowlist when convenient.

---

## 6. Recommended fix order (cheap first)

1. **Citation remaps (text only)** — II-018 → `4.19 Transporting (Animals)`; I-006/007/008 → `n/a`; III-004 → `n/a`; III-007 → `5.3 Merging`; III-018 → `n/a`. Add `4.19` to main `pack/07` if missing.  
2. **Allowlist sync** — merge Act V `pack/07` / `pack/08` children onto main so IV–VI validate.  
3. **DISABLED_TICKETS** — one row for Act II camera-cap validator red / ship-as-is.  
4. **IV-018 still** — regenerate or promote a take that shows **both cats on the seat**, speedo **0**, **no 112**, no carrier (decision beat). Highest play-blocker.  
5. **I-003 still** — belt from B-pillar; cats on **seat** not lap; strip **112**.  
6. **III-019** — either seed `c-take-2` or retag closest to live; finish muted-read.  
7. **IV-028** — cockpit-forward carrier + crosswalk ahead (or rewrite brief to match rear still — writer first if camera can’t show the read).  
8. **Act III READ_MISSING batch** — muted-read at 390px; no mass regen until tags say recompile.  
9. **Soft residuals** — V-008 cones, IV-026 plow, III-002 clipboard doghouse — only after 1–7.  
10. **Act VI seed map** — single WAVE1_MAP source of truth; resolve VI-013 HOLD; then Brad seed. Not this PR.

**Out of scope (per Claude):** pack-rules consolidation; Act VII; any seed from this agent.

---

## 7. How to re-verify

```bash
# Citations (string layer)
node scripts/validate-citations.js
node scripts/validate-act-ii.js   # expect camera-cap FAIL until ticketed
node scripts/validate-act-iii.js  # expect ok

# Stills vs Postgres (needs plaintext DATABASE_URL)
DATABASE_URL=… npm run audit-stills
DATABASE_URL=… npm run audit-stills -- --act IV

# Art board (localhost only)
npm run art-review
# http://127.0.0.1:3847/?act=III
```

---

*Report only. Ready for Claude muted-read / Tyson review.*
