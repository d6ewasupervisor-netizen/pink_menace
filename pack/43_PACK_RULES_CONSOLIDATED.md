# 43 — Pack rules consolidated

Standing rules hard-won across Acts I–VI, gathered in one place so **Act VII (when called) is cheaper**. This file is an index of locks — it does not replace the numbered pack sources it cites.

**Act VII stays CLOSED.** Do not scaffold Act VII cards, stills, or zone slots from this doc.

**After:** `pack/40_SIX_ACT_AUDIT.md` (six-act stills ↔ JSON + I–III citations). Consolidation was explicitly out of scope for that audit; this file is the follow-on Claude asked for.

---

## How to use this file

1. Before generating or regenerating: skim the locks below that touch your act/camera.
2. Follow the **source** link for full wording, examples, and tooling.
3. Card JSON remains the compile authority (`image_brief`). This doc does not override a locked card.

---

## 1. Plate verification / stills audit (MD5 catches checkout lag)

**Lock:** Before trusting “repo matches prod,” run byte-level still audit (`npm run audit-stills` / WebP MD5 via `scripts/encode-still.py`). Compare the checkout’s `cards/<id>.png` to prod.

**Why it matters:** Checkout lag is a real failure class — tip winners can be live in prod while `main` masters lag. That is not bit-rot and not a wrong seed encoder. MD5 **does catch** tip lag: main master ≠ prod shows as MISMATCH.

**Do not:** Treat a MISMATCH as an automatic regen ask. Promote/reconcile the tip first; regen only when muted-read fails picture↔text.

**Source:** [`pack/42_STILL_DRIFT_RECONCILE.md`](42_STILL_DRIFT_RECONCILE.md) (Batch A five-card reconcile), [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §2.5.

**Related:** Vehicle plates themselves must be human-verified before any card compiles against them (Menace / Ledger / Encore). See [`pack/00_README.md`](00_README.md) standing locks, [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md), [`refs/LOCKS.md`](../refs/LOCKS.md).

---

## 2. Frame-relative placement

**Lock:** Never pass role-relative spatial terms into a compiled prompt. Banned: *driver's side, passenger side, near side, off side, driver's window/door.*

Convert every one to **frame-relative** language and state what the viewer sees (`left of frame`, `mirror on the left side of the vehicle`, …). Append the left-hand-drive clause on every vehicle compile. `npm run validate-cards` rejects role-relative strings in `image_brief`.

**Source:** [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md) § “THE DRIVE-SIDE PROBLEM”; [`pack/02_CARD_GENERATOR_PROMPT.md`](02_CARD_GENERATOR_PROMPT.md) (frame-relative + LHD); schema `traffic_positions` / geometry in [`pack/04_card.schema.json`](04_card.schema.json).

---

## 3. Card JSON is the sole brief authority

**Lock:** Wave briefs, stills-batch briefs, and parallel stills prompts list **card IDs only**. They are not a source of frame descriptions. `image_brief` and the frame description are always read from `cards/<id>.json` at compile time. Stale parallel briefs must not override the locked card.

A take map (closest / runner / residual) is not a wave brief — name it `*_MAP.md`. Do not paste `image_brief` into a wave file as if it were the compile source.

**Source:** [`pack/39_WAVE_BRIEFS.md`](39_WAVE_BRIEFS.md); [`pack/24_ART_REVIEW_RUBRIC.md`](24_ART_REVIEW_RUBRIC.md) §0; [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md); `scripts/validate-wave-briefs.js`, `scripts/compile-images.js`.

---

## 4. Moment-not-topic

**Lock:** Titles, hooks, scenes, and `image_brief` describe the **decision moment**, frozen — not a curriculum topic label.

- Title: never a topic label. *“Bus 12, Amber”* not *“School Bus Safety.”* ([`pack/02_CARD_GENERATOR_PROMPT.md`](02_CARD_GENERATOR_PROMPT.md))
- `image_brief`: freeze the hook/scene beat the player decides in — not the skill name, not the DOL heading. Act VI wave-1: briefs written from card moments (hook/scene), not topic labels. Wrong moment = `WRONG_MOMENT` on muted-read (see IV-018 / IV-028 in the six-act audit).

**Source:** [`pack/02_CARD_GENERATOR_PROMPT.md`](02_CARD_GENERATOR_PROMPT.md) (IMAGE_BRIEF = decision moment); Act VI moment-locked briefs (PR #209 / commit *Write Act VI image_briefs from card moments…*); [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §2.1.

---

## 5. Interior mods out of exterior briefs

**Lock:** Exterior cameras stay exterior. Do **not** inject cockpit / interior mods into roadside or profile briefs: dash cluster rewrites, pedal boxes, cabin motion, interior switchgear candy, “absence as cockpit hold,” etc.

Teaching case: **VI-011** — static exterior culvert lip + carrier through rear **side** mesh (`POV_ROADSIDE_PROFILE`). Absence stays exterior; **not** cockpit POV. “Through rear cage” means near-flank rear-quarter mesh in the same profile shot — not a hatch / backward camera.

Related (world grade): MUTCD-correct color is legal only on **exterior** street signage. Interior cabin switchgear stays world-graded — desaturated; not a sign. ([`pack/00_README.md`](00_README.md) Rule 2.)

**Source:** [`cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md) (VI-011 camera clarification); Act VI WAVE1 maps; [`pack/00_README.md`](00_README.md) Rule 2 / [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md).

---

## 6. Cat plates don’t govern collars

**Lock:** `ref_cat_mackerel.png` / `ref_cat_ginger.png` are **face-only** identity plates (in-carrier framing). They do **not** authorize collar, body, or pose. Collar / body / pose require card JSON or an explicit LOCKS body rule. Silent on a cat collar → **no collar**.

Studio portraits (`ref_gracie.jpg`, `ref_mya.jpg`) win on coat. Attach in-carrier crops **alongside** studio, never instead. Do not attach in-carrier plates on out-of-carrier frames.

V-002 “faded pink collar” is Ali’s hoodie, not a collar on Mya.

**Source:** [`refs/LOCKS.md`](../refs/LOCKS.md) (cat plate rows); [`pack/00_README.md`](00_README.md) Rule 3; [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md); PR #174.

---

## 7. Mechanical objects never on characters

**Lock:** A card’s mechanical object (switch, lever, gauge, guarded PA rocker) never appears **on** a character. Portraits carry people only: face, hair, clothes, body. If the object matters, it belongs in a cockpit or `POV_OBJECT` frame. Compiler appends the people-only clause on every `POV_PORTRAIT`.

**Source:** [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md) §8; [`pack/00_README.md`](00_README.md) (wave-one standing locks / PR #29).

---

## 8. Gracie carrier lock (SPEC — verbatim)

**Lock (verbatim string — do not paraphrase):**

> hard-sided, wire grille door facing inboard, Gracie's orange tabby markings visible behind the grille, belt routed through the handle

Reject: soft-sided / leather / LED variants; “ginger tabby” paraphrase; grille facing outboard toward camera unless the brief explicitly says otherwise; empty carrier with no cat visible; belt not routed through the handle; hood / exterior-windshield carrier.

Where cabin or cage is readable in Act VI wave-1, the carrier SPEC is mandatory. Distant empty-road may omit. Studio refs = appearance; in-carrier plates = framing-only.

**Source:** [`cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md); Act VI `image_brief` extras; [`refs/LOCKS.md`](../refs/LOCKS.md) (charcoal / in-carrier crops); IV-028 / IV-018 carrier grammar.

---

## 9. Deac only where cast requires

**Lock:** Do not drop Deac (or a second occupant + clipboard) into frames that don’t cast him.

- Act III: Ledger / Deac seat rules as written for that act.
- Act VI wave-1: **VI-013 only** for second person + metal clipboard (Ali LHD + Deac passenger). All other VI cards: Ali alone. Negatives: `no Deac`, `no second person`, `no clipboard passenger`.
- Never attach a Menace lock on a Deac card; never invent Ledger rear glass / interior mirror.

**Source:** [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §2.4; [`cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md); [`pack/12_IDENTITY_AND_CAMERA_POLICY.md`](12_IDENTITY_AND_CAMERA_POLICY.md); [`pack/24_ART_REVIEW_RUBRIC.md`](24_ART_REVIEW_RUBRIC.md) (Ledger mirror rule).

---

## 10. No 112 / speedlike readout · dark dash · full-grid cage

**Locks:**

| Rule | Detail |
|---|---|
| **No 112 / speedlike** | Ban digital speed readouts that read as live speed (`112.0` class). Hard FAIL on I–VI masters when present. Odo/trip may remain if not speedlike. |
| **Dark dash** | Default dash **DARK / UNLIT**. Lit green turn arrows out; no both turn indicators lit by default; no brightly lit dash by default. |
| **Full-grid cage** | When windshield mesh applies: **FULL-GRID** welded steel mesh over the entire windshield (VI-009 cage canon). Low dash-level mesh band only = FAIL; missing windshield cage = FAIL. |

**Source:** Act VI briefs + [`cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md); [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §2.4 (112 spot check).

---

## 11. Act VI geography — western WA wet/close

**Lock:** Act VI Backcountry = **Cascades-west PNW** — wet, close, overgrown, short sightlines, second-growth fir crowding the shoulder, blackberry and alder in the ditch. Restricted sightlines; vegetation close to the road.

Compiler skew: “rural” → open western landscapes (sage, dry grass, long straight highways). That kills the lesson. Reject high desert / sage / arid canyon / eastern-WA open country / NYC–Spokane urban drift.

Wired into compile as `ACT_VI_GEOGRAPHY` for every VI card (`scripts/compile-prompt.js` on Act VI tips).

**Source:** [`cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md); [`pack/40_ACT_VI.md`](40_ACT_VI.md) (scaffold); PR #217 remainder standing locks.

---

## 12. Muted-read: send fuller take sets (not closest+runner only)

**Lock:** For muted-read relay / Claude grade, send a **fuller take set** when the debt is hard — not only closest + runner. Closest+runner alone is for routine waves; hard-debt cards need the banked cluster so the wrong moment / wrong camera class can be rejected with alternatives in view.

Example (IV hard debt): IV-018 takes 9–11 (all); IV-028 takes 79–82 (all) — not just the two labeled closest/runner.

Routine take-send hygiene still applies: every send names `card_id` + one-line lesson + shot token; waves of eight then four; review batches in threes ([`pack/00_README.md`](00_README.md) take-send standing / PR #52).

**Source:** Claude process note on IV-018/028 hard-debt muted-read relay; [`pack/24_ART_REVIEW_RUBRIC.md`](24_ART_REVIEW_RUBRIC.md); take-send standing in [`pack/00_README.md`](00_README.md) / [`pack/03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md).

---

## 13. Meaning-not-strings citations · honest `n/a` teaching_targets

**Lock:** Citation PASS means allowlist string **exact** *and* the DOL/PSDP body actually teaches the card (Acts IV–VI standard; apply back to I–III). Fabricated PSDP names and catch-all parents are FAIL class.

When there is no honest DOL home, set `dol_section` to **`n/a`** and say why in `teaching_target` (schema has no separate cite-note field). Do not stretch Focus / Space / Zones parents to absorb narrative or procedure that lives only in PSDP (or nowhere).

Honest `n/a` teaching examples (FAIL remaps): I-006 / I-007 / I-008 (lot Quiet / lunge / story-rule); III-004 (Skill nine look — PSDP carries it).

**Source:** [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §3; [`pack/42_CITATION_FIFTEEN.md`](42_CITATION_FIFTEEN.md); [`pack/41_CITATION_CHEAP_FIRST.md`](41_CITATION_CHEAP_FIRST.md); [`pack/10_ACT_II_CITATION_PATCH.json`](10_ACT_II_CITATION_PATCH.json); `scripts/validate-citations.js`.

---

## 14. IV-018 — carrier solution in brief (Claude lock)

**Lock:** IV-018 teaches securing animals (DOL `4.19 Transporting (Animals)`). The `image_brief` shows the **solution** frame: closed hard-shell carrier, **both cats** visible through the grille, speedo 0 — clip both, stow, then roll.

**Not** the loose-on-seat violation as the still subject. Negatives forbid loose/outside cats, open/unlatched/empty carrier, one-cat-only.

(Six-act audit flagged live still vs older seat-cats brief as hard debt; Claude lock is brief → solution / carrier.)

**Source:** PR #235 (`cursor/iv-018-image-brief-fix-c74d`); [`pack/40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) §2.1 (historical mismatch); card `cards/IV-018.json`.

---

## 15. II-027 — Skill six + dol `n/a` (school zone = setting)

**Lock (Claude accepted):**

| field | value |
|---|---|
| `psdp_skill` | `Skill six: looking ahead` |
| `dol_section` | **`n/a`** |
| `teaching_target` | Skill six looking-ahead search loop; **school zone is setting, not lesson**. `dol n/a`: `4.17 Zones (School zone)` would cite the rule option (c) marks wrong (“watch the speedo until 20”). |

Reject remapping to `4.17` or `5.5 Focus` catch-alls.

**Source:** PR #234 (`cursor/ii-027-citation-na-f965`); [`pack/42_CITATION_FIFTEEN.md`](42_CITATION_FIFTEEN.md); `cards/II-027.json`.

---

## 16. Seed provenance — approval ≠ seed verification

**Lock:** Muted-read / Claude **approval** and **seed verification** are separate gates. Never attribute a live seed to Claude PASS unless `check_cursor_reply` / muted-read actually showed him **that** take. Prefer log **`reviewed-after-seed`** when correcting a seed that landed before review.

False attributions (Claude never saw the frames): IV-028 take-82; IV-002 take-29; IV-006 take-47; V-013 take-5.

Teaching case: **IV-028 take-87** is the live strapped-carrier winner (PR #239). Take-82 was unreviewed then replaced — do not re-attribute it to Claude PASS.

**Source:** [`pack/44_SEED_PROVENANCE.md`](44_SEED_PROVENANCE.md); PR #239 (`cursor/seed-iv-028-take-87-b93d`).

---

## Act VII — CLOSED

Do not open Act VII from this consolidation. Chains / Snoqualmie / snow / night / Gravy stay parked for Act VII when someone explicitly calls that act. No VII card scaffold, no VII stills, no VII seed.

---

## Source index (do not delete these files)

| Path | Owns |
|---|---|
| [`00_README.md`](00_README.md) | Pipeline index + standing locks (world grade, cat plates, take-send, wave briefs) |
| [`01_BIBLE.md`](01_BIBLE.md) | World / cast / camera grammar |
| [`02_CARD_GENERATOR_PROMPT.md`](02_CARD_GENERATOR_PROMPT.md) | L2; moment titles; image_brief = decision moment |
| [`03_IMAGE_COMPILER_PROMPT.md`](03_IMAGE_COMPILER_PROMPT.md) | L3; frame-relative; portraits/people-only; wave-brief refuse |
| [`12_IDENTITY_AND_CAMERA_POLICY.md`](12_IDENTITY_AND_CAMERA_POLICY.md) | Identity budget; whose-seat; Ledger mirrors |
| [`24_ART_REVIEW_RUBRIC.md`](24_ART_REVIEW_RUBRIC.md) | Muted-read order; sole-brief §0 |
| [`39_WAVE_BRIEFS.md`](39_WAVE_BRIEFS.md) | IDs-only wave briefs |
| [`39_ACT_VI_CITATION_AUDIT.md`](39_ACT_VI_CITATION_AUDIT.md) | Skills twelve / thirteen allowlist research |
| [`40_ACT_VI.md`](40_ACT_VI.md) | Act VI scaffold / slot table |
| [`40_SIX_ACT_AUDIT.md`](40_SIX_ACT_AUDIT.md) | Six-act stills ↔ JSON + I–III citations |
| [`41_CITATION_CHEAP_FIRST.md`](41_CITATION_CHEAP_FIRST.md) | Citation FAIL remaps |
| [`42_CITATION_FIFTEEN.md`](42_CITATION_FIFTEEN.md) | teaching_target enrichment; II-027 decision |
| [`42_STILL_DRIFT_RECONCILE.md`](42_STILL_DRIFT_RECONCILE.md) | MD5 checkout-lag reconcile |
| [`44_SEED_PROVENANCE.md`](44_SEED_PROVENANCE.md) | Approval vs seed-verification; Claude PASS attribution; IV-028 take-87 |
| [`../cards/takes/ACT_VI_STANDING_LOCKS.md`](../cards/takes/ACT_VI_STANDING_LOCKS.md) | Cascades-west · carrier SPEC · cage · dash · Deac |
| [`../refs/LOCKS.md`](../refs/LOCKS.md) | Plate winners; cat face-only |
| [`DISABLED_TICKETS.md`](DISABLED_TICKETS.md) | Features turned off for quality |

Number collisions (`39_*`, `40_*`, `42_*`) are historical — keep both files; this consolidated index is the map.

---

*Encode what’s true. Don’t rediscover it on Act VII.*
