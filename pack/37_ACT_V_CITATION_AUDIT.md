# 37 — Act V citation audit

Text/pack only. No stills. Do not seed. Do not compile Ribbon plates.

## Claude (Building engaging) confirms — baked this pass

Screenshot of the numbered list cut off mid-item 3. Item 4+ inferred from the same lock line + pack.

| # | Confirm | Bake |
|---|---|---|
| 1 | `4.11 Traffic light signals (Freeway ramp meters)` exactly (TOC sub-entry / child of 4.11, not its own top-level section) | In `pack/07` next to the parent. V-004 cites the **child**. Validator requires the exact string. |
| 2 | V-009 exiting: `dol_section: "n/a"` (PSDP-only). Do **not** stretch a DOL parent. | V-009 is `n/a`. Validator accepts `null` or `"n/a"` (`pack/07` + `scripts/validate-citations.js`). On this stack V-009 *teaches* PSDP p2 steering (no DOL heading — same class as no Exiting heading). Exiting copy stays V-007 (4.12 REVIEW) + V-008 (5.1 conditions). No minted Exiting heading. |
| 3 | Propose concrete `cargo_rough` bands (clean → scuffed → thinned on the Tower 4 channel) | **Proposed for lock:** CLEAN **0–3** · SCUFFED **4–8** · THINNED **9+**. Same edges as presence T0/T1. End-beat degrade only — not an instant fail. |
| 4 | `daylight_fail` | **Ends the run.** It is the end-of-run fail state. Does **not** force V-013 dusk as a continuing card. V-013 dusk remains the grade-pass card path (geometry unchanged). |
| both set | Priority | **`daylight_fail` wins and terminates.** Do not play a THINNED closer. |
| also locked | `presence` canonical · highway vs lot (**Quiet at seventy**) · V-013 dusk = grade pass over the deck plate (geometry unchanged) · load = Tower 4 relay hardware · Yuna radio-only · 13 cards + existing end beat · engine names `cargo_rough` + `daylight_fail` | All thirteen `presence: 0`, `location_type: highway`. Quiet herd is VII — they do not paint on the Ribbon at seventy the way they paint in the lot. |

Audited against `source/25WAPSDP_LR_v3.pdf` (printed pp. 31–32 = PDF 38–39) and `source/driver-guide.pdf` (TOC PDF 11 / 13; bodies as cited). Stack continues PR #141. Yuna radio voice: `pack/36_YUNA_RADIO_VOICE.md`. Beat skeleton: `pack/34_ACT_V.md`. Research gates: `pack/35_ACT_V_RESEARCH.md`. Muted-read copy: `pack/ACT_V_13CARD_MUTED_READ.md`. Quiet placement (Doc 29): herd stays Act VII; all thirteen stubs keep `presence: 0` and no Quiet in `image_brief`.

`image_brief` on each card JSON stays the sole brief authority. This pass does not rewrite briefs.

---

## Claude’s five settles (locked this pass)

| Flag | Verified home | Locked string | What we did |
|---|---|---|---|
| **5.3 twice (on-ramp segments + zipper)** | On-ramp segments live only in PSDP p1 Lesson two. DOL body that says the on-ramp is **5.3 \| MERGING** (PDF 160). There is **no** DOL heading “On-ramp segments.” Zipper is the TOC child under 5.3 (PDF 13 / body PDF 160–161). | `5.3 Merging` (parent, already on pack). `5.3 Merging (Zipper merging)` (child, added this pass). | **Do not mint** `5.3 Merging (On-ramp segments)`. V-003 is the NEW parent spend. V-005 / V-006 are REVIEW of the same parent (PSDP Lessons three + sidebar), not a second heading. Zipper child is **allowlisted and unspent** — III-026 already taught zipper at city speed under the parent; a highway lane-closure zipper is leftover, not a 14th card and not V-011 (courtesy move-over is not take-turns). |
| **4.11 ramp-meter child** | TOC: `4.11 Traffic light signals` → **Freeway ramp meters**. Body heading **FREEWAY RAMP METERS** (PDF 113). Not in Skill eleven. | `4.11 Traffic light signals (Freeway ramp meters)` | V-004 cites the **child**, not the parent (parent already used once on III-014). |
| **5.1 for gentle steering, or 5.6 Curves** | PSDP p2 Lesson one is the highway-speed teaching: “steer gently on highways.” DOL has **no** “steering gently” heading. **5.6 Curves** (PDF 167–168) is the nearest official *quote* (“Gentle steering. Steer smoothly…”) but that subsection is **in the curve**, not a straight-lane gust. 5.1 Speed (PDF 157) is a stretch. | V-009 `dol_section: "n/a"`. `5.6 Road and driving conditions (Curves)` remain on the allowlist, **unused**. | Building-engaging confirm: do not stretch a parent. Same rule as exiting. Curves stays locked for a later curve card. |
| **Exiting on PSDP alone (do not mint DOL Exiting)** | PSDP p1 Lesson four – exiting (printed p. 31). Driver Guide has **no** numbered Exiting / exit-ramp heading. PDF hits for “Exiting” are **parking** (pp. 146–147) and **Exiting the curve** (p. 168). | none new | Do **not** add `5.x Exiting`. On the #141 stack the exiting lesson is V-007 + V-008, not V-009 (V-009 is steering). V-007 pairs REVIEW `4.12 Signs` (exit panel). V-008 pairs `5.1 Speed (Adjusting speed for conditions)` (posted ramp speed). |
| **V-007 is review, not a new lesson claim** | `4.12 Signs` is already used three times in I–IV. The **new** lesson on V-007 is PSDP exiting. | `4.12 Signs` | `teaching_target` now says REVIEW of 4.12 / NEW exiting. Player copy still teaches the exit. |

---

## Card → cite (after this pass)

| Card | PSDP | DOL | Status | Notes |
|---|---|---|---|---|
| V-001 | eleven p1 | `4.12 Signs` | REVIEW pairing / NEW observation | Lesson one. Ali driving; Yuna radio. |
| V-002 | `n/a` | `n/a` | load lock | Dossier. Tower 4 kit. No curriculum claim. |
| V-003 | eleven p1 | `5.3 Merging` | **NEW** parent | On-ramp segments. First 5.3 home. |
| V-004 | eleven p1 (context) | `4.11 Traffic light signals (Freeway ramp meters)` | **LOCKED** child | Rule is DOL-only. Yuna click lives in the **result**. |
| V-005 | eleven p1 | `5.3 Merging` | REVIEW | Lesson three – merging (same parent as V-003). |
| V-006 | eleven p1 | `5.3 Merging` | REVIEW | “Do not stop” + speed-to-gap sidebar. |
| V-007 | eleven p1 | `4.12 Signs` | REVIEW cite / NEW exiting | PSDP Lesson four. Not a new signs lesson. |
| V-008 | eleven p1 | `5.1 Speed (Adjusting speed for conditions)` | LOCKED pairing | Posted ramp speed before the curve. Still no Exiting heading. |
| V-009 | eleven p2 | `n/a` | **NEW** / PSDP alone | Gentle steer at speed. No stretched 5.1. Not Curves. |
| V-010 | eleven p2 | `n/a` | **NEW** / PSDP alone | One lane at a time. No DOL lane-change heading. Was a false 5.3. |
| V-011 | eleven p2 | `5.2 Space` | NEW pairing | Move left for a merger. Not zipper. Yuna radio beat. |
| V-012 | eleven p2 | `5.4 Time (Count seconds)` | REVIEW | Three-second at highway speed (II-012 already spent the parent). |
| V-013 | eleven p2 | `5.2 Space` | REVIEW | Tailgater / move over. Dusk grade pass. Hollis once. `daylight_fail` does not rewrite this card. |
| — | existing end beat / fail | n/a | engine | Successful closer banded by `cargo_rough`. `daylight_fail` is the fail state and terminates. Not V-014. |

`5.3` parent is cited **three times on one heading** (one NEW + two REVIEW), not as two invented children. The second **heading** Claude named is the zipper **child**, which is locked on the allowlist and not spent.

---

## Open vs locked

### Locked (do not reopen)

- Skill eleven strings (en-dash, TOC verbatim) in `pack/08_PSDP_SKILLS.json`. No hyphen aliases. No Skill twelve / thirteen / fourteen.
- `4.11 Traffic light signals (Freeway ramp meters)` — V-004 only.
- `5.3 Merging` parent for on-ramp / merge. No `5.3 Merging (On-ramp segments)`.
- `5.3 Merging (Zipper merging)` as an allowlist heading. Unspent on V-001…V-013.
- V-009 `n/a` (highway gentle steer / no DOL heading). Validator accepts `null` or `"n/a"`.
- `5.6 Road and driving conditions (Curves)` as a verified heading. Unspent. Quote home for curve steering, not V-009.
- No DOL `Exiting` heading. V-007 / V-008 pair existing strings only.
- `presence` canonical. **Quiet at seventy** (highway vs lot). Thirteen cards + existing end beat. Ali alone. Yuna radio-only. Load = relay kit for Tower 4. Chains / Snoqualmie = VII.
- Card JSON `image_brief` is the brief. Doc 29 Quiet plates are not Ribbon stills.

### Open leftovers (not a Tyson block)

| Heading | Why it is open | Default |
|---|---|---|
| `5.3 Merging (Zipper merging)` | Verified child; III-026 already taught zipper under the parent. | Leave unspent. Recite III-026 later if wanted. Do not steal a Skill eleven card. |
| `5.6 Road and driving conditions (Curves)` | Verified; wrong situation for V-009. | Hold for a curve card in a later act, or a V-008-adjacent regen if a curve *technique* card is ever split out. |
| V-004 `psdp_skill` | Ramp meters are not in Skill eleven. Part one is on-ramp context only. | Keep eleven p1 as context. Do not invent a PSDP ramp-meter lesson. |
| Printed DOL page numbers | Bodies extracted from PDF pages 113 / 157–160 / 167–168. TOC printed numbers match the section numbers, not always the folio. | `stat_cited` uses `DOL p.113` / `PSDP p.31` / `PSDP p.32` as the research stack did. |

Nothing here needs Tyson. Zipper and Curves stay on the pack so a later writer cannot mint a near-miss string.

---

## Image briefs / Doc 29

Walked all thirteen `image_brief` blocks against Doc 29 and the plate map:

- No Quiet in subject / read / continuity. `presence: 0` on every stub.
- No Yuna, no Encore, no Ledger lock. V-002 is an Ali portrait, not a Yuna plate.
- V-011 stays `POV_MIRROR_DOOR` (right glass = right-side merger). V-013 `POV_MIRROR_REAR` is legal on the Menace.
- Briefs were not rewritten. Citation status lives in `source`.

---

## Copy touched (not art)

- V-004 correct **result**: Yuna’s click (pack/36 appearance lock).
- V-011 scene + correct result: radio beat; `cast` includes `yuna`. She does not grade the driving or mention cargo.
- `teaching_target` / `stat_cited` on the teaching cards.

---

## Validate

```
node scripts/validate-act-v.js
node scripts/validate-citations.js
```

Do not seed. Do not promote plates.
