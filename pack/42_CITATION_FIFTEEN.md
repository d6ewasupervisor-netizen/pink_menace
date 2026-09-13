# 42 — Citation fifteen (I–III texts for Claude muted-read)

Text-only follow-on to `pack/41_CITATION_CHEAP_FIRST` / PR #230. Enriches the seven FAIL remaps + decides the eight NEEDS-REVIEW rows from `pack/40_SIX_ACT_AUDIT` §3. **No stills. No seed. No Act VII. No Act I–III art replay. No POV_DIAGRAM / READ_MISSING.**

Standard: meaning-not-strings (Act IV–VI / `pack/37` style). `teaching_target` carries the cite honesty (schema has no separate cite-note field; `source.additionalProperties: false`).

Guide bodies checked: `source/driver-guide.pdf` **5.2 Space** (p.159), **5.3 Merging** (p.160), **4.6** / **4.14** / **4.17**; `source/25WAPSDP_LR_v3.pdf` Skill nine look / pass-complete.

---

## FAIL remaps (already on #230 — text enriched here)

| card_id | before → after | Reasoning |
|---|---|---|
| **I-006** | `5.5 Focus` → **`n/a`** | Lot Quiet call-out / how you get the cat back. Narrative non-curriculum beat. Not distraction Focus. |
| **I-007** | `5.5 Focus` → **`n/a`** | Lunge beat once — lived experience, no grade. Antagonist/narrative; no DOL home. |
| **I-008** | `5.5 Focus` → **`n/a`** | Sound-draws-them story rule; end on empty seat. Lot closer, not Focus attention. |
| **II-018** | `5.5 Focus` → **`4.19 Transporting (Animals)`** | Pet restraint before roll. DOL 4.19 body (loose animals distract). Same class as IV-018. PSDP stays `n/a`. |
| **III-004** | `5.5 Focus` → **`n/a`** | Mirror + OTS before lane change is **Skill nine** look procedure (p1 Lesson four). Not distraction Focus. PSDP carries it. |
| **III-007** | `5.2 Space` → **`5.3 Merging`** | **Confirmed 5.3.** See §III-007 below. |
| **III-018** | `5.2 Space` → **`n/a`** | “Whole front in glass” is Skill nine p2 pass-complete cue. 5.2 Space does not teach that mirror recovery. PSDP-only. |

### III-007 — why `5.3 Merging`, not `5.2 Space`

Card decision: *A gap just opened between them. Do you take it?* Teaching language: accept only a merge gap large enough that other drivers need not **swerve, slow, or stop**.

| Guide | Body (abridged) | Fit |
|---|---|---|
| **5.3 Merging** | “enter traffic with enough space so you don’t cause the people around you to **swerve, slow, or stop**.” | **Verbatim match.** Card is gap-acceptance to enter adjacent traffic. |
| **5.2 Space** | Keep space around you; ≥2 vehicle lengths ahead; merging mentioned only as room for the hazard-management routine. | Following-distance / cushion chapter. Not the swerve-slow-stop merge rule. |

`5.2` would be honest for III-009 (open YOUR front gap when tailgated). III-007 is merge-gap selection → **keep `5.3 Merging`**. Zipper stays on III-026 (also 5.3).

---

## NEEDS-REVIEW decisions

| card_id | before → after | Decision | Reasoning |
|---|---|---|---|
| **I-009** | Skill one / `n/a` → **same** | **PASS keep** + review note | Teaching is pre-roll aisle look. Engine-already-on is I-008 continuity, not a Skill two moving lesson. No DOL home; do not stretch. |
| **II-005** | Skill six / `4.6` → **same** | **PASS keep** | **4.6** exact (≥3 ft). Skill six is a soft look-ahead wrapper for finding Marisol in the mirror — acceptable, not fabricated. |
| **II-026** | Skill six / `4.6` → **same** | **PASS keep** | **4.6** bike-lanes body: look before opening the door. Dutch reach is the PSDP-flavored procedure; Skill six soft. |
| **II-027** | Skill six / `5.5 Focus` → Skill six / **`4.17 Zones (School zone)`** | **Light remap** | Continuous school-zone edge search. Focus was catch-all. 4.17 School zone is the honest DOL home (same family as II-002). |
| **II-029** | Skill seven / `4.14` → **same** | **Leave + review note** | Skill seven is correct (around-the-block). 4.14 Turning body is **intersection** lane choice — soft parent only. No DOL turnaround child; do not mint one. |
| **II-030** | Skill seven / `4.14` → **same** | **Leave + review note** | Skill seven Lesson two (two-point). Same soft 4.14 parent as II-029. |
| **III-005** | Skill nine / `5.2` → **same** | **Leave + review note** | Blind-spot sliver / cancel-hold. Skill nine look is primary (same class as III-004). 5.2 is weak cushion pairing — REVIEW, not FAIL. |
| **III-010** | Skill nine / `5.2` → **same** | **Leave + review note** | III-005 debt callback. Same: Skill nine primary; 5.2 weak REVIEW. |

---

## Five honest `n/a` teaching_targets (FAIL class)

| card | Why no DOL home (in `teaching_target`) |
|---|---|
| **I-006** | Narrative Quiet call-out / non-curriculum lot beat — not Focus. |
| **I-007** | Antagonist lunge beat — lived experience; no curriculum home. |
| **I-008** | Story rule (sound draws them) / lot closer — not Focus attention. |
| **III-004** | Skill nine look procedure carries mirror+OTS; no separate DOL glance heading. |
| **III-018** | Skill nine pass-complete cue; 5.2 does not teach “whole front in glass.” |

---

## Out of scope (unchanged)

- Stills / hash drift / Act III READ_MISSING
- Act II camera-cap / POV_DIAGRAM (ticketed on #230)
- Act IV–VI art; Act VII
- Fabricating DOL children for turnarounds or blind-spot glance

## Verify

```bash
node scripts/validate-citations.js
# II-027 should cite 4.17; seven FAIL remaps remain n/a or 4.19 / 5.3 as above
```
