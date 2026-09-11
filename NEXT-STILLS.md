# NEXT-STILLS — queue after Encore glass lock

**This pass produced no stills.** Act I is closed (12/12). Do not reshoot Act I. Do not replay Acts II or III.

Encore exterior / glass briefs were the ask. They are **not ready**. The four-view lock is on **PR #14** (`ref_encore_sheet.png` = Y3 take 12, stock-glass-first). No card in Acts I–IV asks for an Encore *exterior* compile. The only Encore-named briefs are cockpits and a Yuna portrait, and those live on **PR #12** (not on `main`).

---

## 0. Decision — why no pixels

| Question | Answer |
|---|---|
| Is the Encore four-view locked? | **Yes, on PR #14 only.** Take 12: intact factory glass on all four views. Take 3 (open cabin) is history. Not merged to `main` — `refs/LOCKS.md` on `main` still names take 3 and the old glass caveat. |
| Does the compiler allow Encore exteriors? | **On PR #14.** `scripts/compile-prompt.js` no longer aborts. It appends *intact window glass in all openings, no mesh, no bars, no open cabin* on any Yuna/Encore compile, plus *do not describe stripping / gutting / roll cage / seats* on exterior cameras only. On `main` the pack/03 caveat still says “until the sheet is rerun.” |
| Is there an Encore exterior `image_brief`? | **No.** Zero cards with `continuity: encore` or `driver: yuna` on an exterior camera (`POV_CHASE`, `POV_ROADSIDE`, `POV_ROADSIDE_PROFILE`, `POV_DIAGRAM`, `POV_TOPDOWN_PHOTO`). |
| Closest Encore cards? | **IV-002** and **IV-009** — `POV_COCKPIT` + `encore_cockpit`. **IV-010** — `POV_PORTRAIT` + `yuna`. All on PR #12. IV-009 `extra_negatives` include `no Encore exterior`. IV-010 forbids readable chevron / horn flares as the subject. |
| Stock-glass-first rule (PR #14 / pack/07 Y3) | Exterior briefs start from an intact factory hatchback, then tape, chevrons, four PA horns. Interior facts (strip, gut, cage, bucket, welded bench) belong only in Y4 / cockpit compiles. Putting them in an exterior brief pulls the glass out. |

**Do not generate an Encore exterior until a writer opens a brief that names the hatchback from outside.** The sheet lock unblocks the compiler. It does not invent a card.

---

## 1. Priority for Claude

Do these in order. Do not skip to pixels.

1. **Human confirm PR #14 take 12** and merge (or reject; fallback named on that PR is take-9 composite B). Until merge, `main` still ships the open-cabin sheet.
2. **Writer — Encore exterior slot.** None exists. If the Core needs the wedge readable at card size, open one brief (likely a parked roadside or chase of Encore, not a cockpit). Stock-glass-first. Attach `encore` → `ref_encore_sheet.png`. Do **not** retarget IV-002 / IV-009; those reads are interior (naked glass / PA switch off).
3. **Writer — citation pass on Act IV** (PR #12 + PR #13 flags) before any IV compile. Skill ten + several DOL headings are pending-allowlist; PR #13 marks IV-015 wrong-cite and several others weak/form.
4. **IV-001** still has no card JSON (ride-along lines only on PR #12). Not a still.
5. **First still on `main` that is actually missing:** **II-031** — brief complete, no PNG, no takes. Menace cockpit, not Encore. Only generate if someone explicitly wants that card; it is not an Encore exterior.
6. **Act III board tags** are reshoots / copy, not first stills. Do not replay the act unless a human picks a tag group.
7. **Act V / VI / VII** — no card JSON. Yuna returns in VI. No briefs to compile.

---

## 2. Encore / Yuna cards (the glass ask)

| Card | Where | Driver | Camera | Continuity | `image_brief` | Still | Notes |
|---|---|---|---|---|---|---|---|
| Y3 four-view | PR #14 | — | sheet 16:9 | `ref_encore_sheet.png` | **LOCKED take 12** | sheet only | Stock-glass-first. Not a card. |
| Y4 cockpit | `main` | — | cockpit lock | `ref_encore_cockpit.png` | locked Y4 take 1 | lock only | Glass at risk. Not an exterior lock. |
| III-030 | `main` | deac | `POV_ROADSIDE_PROFILE` | `the_ledger` | complete | live PNG | Yuna is radio only. Ledger parked. Not Encore. |
| IV-001 | PR #12 draft | yuna | — | — | **no JSON** | none | Twelve lines. Not compileable. |
| IV-002 | PR #12 | ali | `POV_COCKPIT` | `encore_cockpit` | complete + geometry | **none** | “The Naked Glass.” Lesson camera. Ali on the bench. **Cockpit, not exterior.** |
| IV-009 | PR #12 | yuna | `POV_COCKPIT` | `encore_cockpit` | complete + geometry | **none** | PA switch off; cone pinch. `extra_negatives`: no Encore exterior, no horn flares in frame. |
| IV-010 | PR #12 | yuna | `POV_PORTRAIT` | `yuna` | complete, no geometry (portrait) | **none** | Hatchback flank OOF; **no readable chevron / no horns as subject.** |
| IV-029 | PR #12 | ali | `POV_DIAGRAM` | `pink_menace_exterior` | complete | **none** | Copy mentions Yuna’s thesis. Ego is the Menace. Not an Encore compile. |

No Act V/VI cards. Pack/08: Encore four-view only gates Encore *exterior* cards; none of those are in The Grid (Act II).

---

## 3. Act II — still status + brief status

Live PNGs are git-tracked for **II-001–II-030**. Almost no takes archived (`cards/takes/II-018-take-1.png` only). No art-review board for Act II. Pack/19 is the human audit (24 pass / 2 rebuild / 4 minor).

| Card | Camera | Continuity | Brief | Still | Queue |
|---|---|---|---|---|---|
| II-001 | `POV_PORTRAIT` | menace interior, ali, gracie | complete | live | keep |
| II-002 | `POV_COCKPIT` | menace interior | complete | live | keep |
| II-003 | `POV_OBJECT` | — | complete | live | keep |
| II-004 | `POV_DIAGRAM` | menace exterior | complete + geo | live | keep |
| II-005 | `POV_ROADSIDE_PROFILE` | menace exterior, marisol | complete + geo | live | keep |
| II-006 | `POV_CHASE` | ledger, menace, deac, hand_signals | complete | live | keep |
| II-007 | `POV_COCKPIT` | menace interior, bus_12 | complete | live | keep (locked take 2) |
| II-008 | `POV_OBJECT` | menace interior | complete | live | keep |
| II-009 | `POV_COCKPIT` | menace interior | complete | live | pack/19 **FAIL rebuild** (read was missing; JSON is now cockpit — pixels not re-audited here) |
| II-010 | `POV_ROADSIDE` | menace, bus_12, L-001 | complete + geo | live | pack/19 minor (oncoming vs behind) |
| II-011 | `POV_COCKPIT` | menace interior, ali, clipboard | **complete fields; compile FAIL** | live | `image_brief describes a roadway but omits geometry` — writer/compiler, not a first still |
| II-012 | `POV_COCKPIT` | menace interior | complete | live | keep |
| II-013 | `POV_COCKPIT` | menace interior | complete | live | keep |
| II-014 | `POV_MIRROR_REAR` | menace interior, hollis | complete | live | keep |
| II-015 | `POV_DIAGRAM` | menace exterior | complete + geo | live | keep |
| II-016 | `POV_CHASE` | ledger, menace, deac, hand_signals | complete | live | keep |
| II-017 | `POV_DIAGRAM` | menace exterior | complete + geo | live | pack/19 minor (scene leftover); later “dead slow” copy on #5 |
| II-018 | `POV_PORTRAIT` | gracie, menace, ali | complete | live + 1 take | keep |
| II-019 | `POV_OBJECT` | — | complete | live | keep |
| II-020 | `POV_ROADSIDE_PROFILE` | menace exterior | complete + geo | live | keep |
| II-021 | `POV_DIAGRAM` | menace exterior | complete + geo | live | keep |
| II-022 | `POV_CHASE` | ledger, menace, deac, hand_signals | complete | live | keep |
| II-023 | `POV_DIAGRAM` | menace, L-006 | complete + geo | live | pack/19 minor (mountain vs Kent) |
| II-024 | `POV_DIAGRAM` | menace exterior | complete + geo | live | keep |
| II-025 | `POV_PORTRAIT` | ali, menace interior | complete | live | keep |
| II-026 | `POV_ROADSIDE` | menace, ali, marisol | complete + geo | live | pack/19 **FAIL rebuild** (wanted `POV_MIRROR_DOOR`; JSON still roadside) |
| II-027 | `POV_ROADSIDE` | menace exterior | complete + geo | live | pack/19 minor (door ajar inpaint note) |
| II-028 | `POV_OBJECT` | menace interior | complete | live | keep |
| II-029 | `POV_DIAGRAM` | menace, L-001 | complete + geo | live | keep |
| II-030 | `POV_DIAGRAM` | menace, L-001 | complete + geo | live | keep |
| **II-031** | `POV_COCKPIT` | menace interior, gracie | **complete + geo** | **NONE** | **Only Act II card with no still.** Ledger callback of I-003. Not in the II-001…020 / 029 / 030 / 021…028 play order. |

---

## 4. Act III — still status + brief status

All **III-001–III-030** have live PNGs and (except III-001’s board row) takes under `cards/takes/`. Briefs on `main` are complete. This is **review / reshoot**, not first-still. Do not replay unless a human picks a tag group.

Board: `cards/art-review-state.json`. III-001 has **no verdict**.

| Card | Camera | Continuity | Brief | Still | Board tag | Pick |
|---|---|---|---|---|---|---|
| III-001 | `POV_COCKPIT` | ledger_cockpit | complete | live | — (unreviewed) | — |
| III-002 | `POV_COCKPIT` | ledger_cockpit, mya | complete | live | `READ_MISSING` | d-take-2 |
| III-003 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | `READ_MISSING` | take-4 |
| III-004 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-2 |
| III-005 | `POV_MIRROR_DOOR` | the_ledger | complete | live | `PASS` | — |
| III-006 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | b-take-2 |
| III-007 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-2 |
| III-008 | `POV_OBJECT` | ledger_cockpit, hov_geometry | complete | live | `PASS` | take-1 |
| III-009 | `POV_MIRROR_DOOR` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-1 |
| III-010 | `POV_ROADSIDE_PROFILE` | the_ledger | complete | live | `PASS` | e-take-1 |
| III-011 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | `READ_MISSING` | d-take-1 |
| III-012 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | **`GEOMETRY_WRONG`** | c-take-2 |
| III-013 | `POV_PORTRAIT` | deac, clipboard, ledger_cockpit | complete | live | `PASS` | c-take-2 |
| III-014 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-1 |
| III-015 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | `PASS` | live |
| III-016 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-2 |
| III-017 | `POV_MIRROR_DOOR` | ledger_cockpit | complete | live | `COPY` | b-take-2 |
| III-018 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | `READ_MISSING` | e-take-2 |
| III-019 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-2 |
| III-020 | `POV_ROADSIDE_PROFILE` | the_ledger | complete | live | `PASS` | c-take-1 |
| III-021 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | e-take-1 |
| III-022 | `POV_MIRROR_DOOR` | ledger_cockpit | complete | live | `READ_MISSING` | b-take-1 |
| III-023 | `POV_OBJECT` | ledger_cockpit, hov_geometry | complete | live | `COPY` | b-take-2 |
| III-024 | `POV_ROADSIDE_PROFILE` | the_ledger | complete | live | `PASS` | c-take-2 |
| III-025 | `POV_PORTRAIT` | deac, clipboard, ledger_cockpit | complete | live | `READ_MISSING` | c-take-1 |
| III-026 | `POV_DIAGRAM` | diagram_style, the_ledger | complete | live | `PASS` | b-take-1 |
| III-027 | `POV_COCKPIT` | ledger_cockpit | complete | live | `READ_MISSING` | c-take-2 |
| III-028 | `POV_OBJECT` | the_ledger | complete | live | `PASS` | b-take-2 |
| III-029 | `POV_CHASE` | the_ledger | complete | live | `PASS` | b-take-3 |
| III-030 | `POV_ROADSIDE_PROFILE` | the_ledger | complete | live | `PASS` | b-take-2 |

`PASS` count on the board: 11. `READ_MISSING`: 15. `GEOMETRY_WRONG`: 1 (III-012). `COPY`: 2. Untagged: III-001.

Routing (pack/24): `CARD_BROKEN` / `WRONG_CAMERA` / `READ_MISSING` are writer-first — **do not generate** until the JSON is one situation and the read is a static photographable fact. III-012 is compiler-legal to regen only after the geometry clause matches a left-side pass.

---

## 5. Act IV — still status + brief status

Text on **PR #12** (`IV-002`–`IV-030`) and **PR #13** (hand-written `IV-017`). **No PNGs. No takes. Do not seed.** PR #12 title line: text-only; Encore exteriors blocked (that block is the missing brief, not the sheet — the sheet is now locked on #14).

`image_brief` on every IV-002–030 JSON is field-complete (camera, subject, fg/mg/bg, read). Road frames carry geometry except true object/portrait cards. **Cards are not on `main`.** Citations are not all allowlisted. PR #13 cite flags are in `CITATION_AUDIT.md` on that branch.

| Card | Type | Driver | Camera | Continuity | Geo | Brief | Still | Blocker |
|---|---|---|---|---|---|---|---|---|
| IV-001 | ride-along | yuna | — | — | — | **no JSON** | none | write the card first |
| IV-002 | dossier | ali | `POV_COCKPIT` | encore_cockpit | yes | complete | none | citations + merge; **cockpit** (glass lesson) |
| IV-003 | scene | ali | `POV_OBJECT` | menace interior | n/a | complete | none | PR #13 weak cite (5.0) |
| IV-004 | scene | ali | `POV_ROADSIDE` | menace exterior | yes | complete | none | pending-allowlist 4.1 |
| IV-005 | hazard | ali | `POV_COCKPIT` | menace interior | yes | complete | none | pending-allowlist 4.1 |
| IV-006 | scene | ali | `POV_DIAGRAM` | diagram + menace | yes | complete | none | PR #13 form (Light Rail) |
| IV-007 | rule | ali | `POV_OBJECT` | — | yes | complete | none | 4.12 ok |
| IV-008 | scene | ali | `POV_MIRROR_DOOR` | menace interior | yes | complete | none | pending-allowlist 4.5 |
| IV-009 | convoy | yuna | `POV_COCKPIT` | encore_cockpit | yes | complete | none | **cockpit**; PR #13 weak (horn/PA) |
| IV-010 | dossier | yuna | `POV_PORTRAIT` | yuna | n/a | complete | none | portrait, not exterior |
| IV-011 | scene | ali | `POV_DIAGRAM` | diagram + menace | yes | complete | none | 4.18 ok |
| IV-012 | ledger | ali | `POV_ROADSIDE` | menace exterior | yes | complete | none | n/a cites ok |
| IV-013 | scene | ali | `POV_MIRROR_DOOR` | menace, dutch_reach, marisol | yes | complete | none | PR #13 weak (4.18 vs 4.6) |
| IV-014 | hazard | ali | `POV_COCKPIT` | menace interior | yes | complete | none | PR #13 weak (5.0) |
| IV-015 | scene | ali | `POV_DIAGRAM` | diagram + menace | yes | complete | none | **PR #13 WRONG cite** (4.15 ≠ left-yields-right) |
| IV-016 | dossier | ali | `POV_ROADSIDE_PROFILE` | the_ledger, mya | yes | complete | none | parked Ledger; n/a cites |
| IV-017 | dossier | deac | `POV_PORTRAIT` | deac, clipboard, mya, ledger_cockpit | n/a | complete (PR #13 copy) | none | **do not seed** (conversation) |
| IV-018 | scene | ali | `POV_COCKPIT` | menace, gracie, mya | yes | complete | none | PR #13 form (4.19 slash) |
| IV-019 | scene | ali | `POV_COCKPIT` | menace interior | yes | complete | none | pending 5.10 parenthetical |
| IV-020 | rule | ali | `POV_OBJECT` | menace interior | n/a | complete | none | PR #13 form (Getting a ticket) |
| IV-021 | hazard | ali | `POV_COCKPIT` | menace interior | yes | complete | none | PR #13 form (Witnessing) |
| IV-022 | scene | ali | `POV_ROADSIDE` | menace exterior | yes | complete | none | PR #13 weak (5.9 witness vs involved) |
| IV-023 | wrench | ali | `POV_OBJECT` | menace exterior | n/a | complete | none | PR #13 form (Headlight) |
| IV-024 | scene | ali | `POV_ROADSIDE_PROFILE` | menace exterior | yes | complete | none | pending 4.20 |
| IV-025 | ledger | ali | `POV_ROADSIDE` | menace exterior | yes | complete | none | n/a cites |
| IV-026 | scene | ali | `POV_DIAGRAM` | diagram + menace | yes | complete | none | PR #13 form (5.0 Hazard management) |
| IV-027 | scene | ali | `POV_MIRROR_REAR` | menace interior | yes | complete | none | PR #13 weak (gap is 5.2/5.4) |
| IV-028 | dossier | ali | `POV_COCKPIT` | menace, gracie, mya | yes | complete | none | n/a cites |
| IV-029 | scene | ali | `POV_DIAGRAM` | diagram + menace | yes | complete | none | PR #13 weak (pass-decline is 4.10 / Skill nine) |
| IV-030 | dossier | ali | `POV_TOPDOWN_PHOTO` | menace exterior | yes | complete | none | n/a cites |

Ali drives most of The Core. Yuna drives 009–010. Deac speaks 017. Encore appears as **glass from inside**, not as a four-view on the street.

---

## 6. What a ready Encore exterior brief looks like

When a writer opens one, the compile must:

- Use an exterior camera (not `POV_COCKPIT` / `POV_PORTRAIT`).
- Set `continuity` to include `encore` (sheet), never dump Y4 cage/seats into the exterior subject lines.
- Follow PR #14 Y3 language: intact factory glass in every opening; tape; chevrons; four chrome PA horn flares on a roof frame; 1990s three-door wedge. No stripped / gutted / roll cage / bucket / welded bench in the exterior prompt.
- Carry `geometry` if a roadway is in frame (II-011 is the warning).
- Attach `ref_encore_sheet.png` (take 12). Do not attach take 3 or take 11.
- Expect the compiler (PR #14) to append the intact-glass clause and the no-interior-hardware sentence.

Until that JSON exists, generating “the next Encore exterior card” would be inventing a card. Card JSON is the authority. This file is the queue.

---

## 7. Out of scope this pass

- Act I (closed). I-009 / I-010 work is on other PRs — do not touch.
- Playthrough / replay gating.
- Frame seeding.
- Merging #12 / #13 / #14 from this branch.
