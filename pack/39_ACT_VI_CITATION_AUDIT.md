# 39 — Act VI citation audit

Research only. Text/pack report. **No art. No stills. No seeding. No 13-slot table.** Claude (relay `6f4009f9`) locked the Act VI frame and needs paste-ready citation strings before writing cards.

Style match: Act V citation stack (`pack/37_ACT_V_CITATION_AUDIT.md` / `pack/35_ACT_V_RESEARCH.md` on PR #151). Audited against `source/25WAPSDP_LR_v3.pdf` (printed pp. 33–34 = PDF 40–41) and `source/driver-guide.pdf` (TOC + bodies as cited). Spend counted from live `cards/*.json` on **`main`** (`source.psdp_skill` / `source.dol_section`). Act V card cites from the open Act V stack (PR #151) are noted where they touch leftovers; they are not on `main` yet.

## Locked frame (do not redesign)

- Act VI: **Backcountry**, valley floor east of the Ribbon. **Ali alone** (Yuna radio-only if at all).
- Skills **twelve + thirteen** (both unspent). Last act before the pass.
- Chains and Snoqualmie stay **Act VII**.
- **13 cards + end beat**, same shape as Act V.
- No Acts I–III work. **V-013** stays Flashers / Skill 11 / take-7.

`01_BIBLE.md` §7 still shows national skill numbers (Act IV = 11–12, Act V = 13–14). WA edition in the repo PDF:

| WA PSDP (verbatim TOC) | Printed p. | Campaign |
|---|---|---|
| Skill ten … part one / part two | 29 / 30 | Act IV |
| Skill eleven … part one / part two | 31 / 32 | Act V |
| **`Skill twelve: driving on rural roads`** | **33** | **Act VI** |
| **`Skill thirteen: roundabouts`** | **34** | **Act VI** |
| Practice in other conditions | 36 | Act VII |

There is **no Skill fourteen**. Do not mint one.

---

## 1) Allowlist strings — Skill twelve / thirteen

House style (locked by Act IV/V citation work): lowercase after the colon; en-dash **U+2013** before `part` when a skill has parts.

| Paste string | Parts? | In `pack/08` on `main`? | In Act V stack (`pack/08` on PR #151)? |
|---|---|---|---|
| `Skill twelve: driving on rural roads` | **No.** Single printed page. No part one / part two. | **No** (stops at Skill ten) | **No** (stops at Skill eleven) |
| `Skill thirteen: roundabouts` | **No.** Single printed page. No part one / part two. | **No** | **No** |

Claude’s expected bodies (**confirmed**, TOC + page titles):

- twelve → **driving on rural roads**
- thirteen → **roundabouts**

Printed page headers (all-caps banners, not allowlist strings):

- `SKILL TWELVE:` / `DRIVING ON RURAL ROADS`
- `SKILL THIRTEEN:` / `ROUNDABOUTS`

Body title lines under the banners: `Driving on rural roads` · `Roundabouts`.

**Add both strings to `pack/08_PSDP_SKILLS.json` before any Act VI seed.** No hyphen aliases. No `Skill 12` / `Skill 13` numeric forms.

---

## 2) PSDP Skill twelve — exact printed lesson / hazard headings

Printed p. **33**. Structure: **Lesson one**, then **Lesson two** with colon-led hazard labels (not separate Lesson numbers).

| # | Exact printed heading | Notes |
|---|---|---|
| Lesson one | `Lesson one – gravel roads` | En-dash in “Lesson one – …”. Topic Claude called “gravel.” |
| Lesson two | `Lesson two – driving hazards` | Wrapper only; hazards below are the teachable heads. |
| Hazard | `Large/slow vehicles:` | Slash, no spaces around `/`. |
| Hazard | `Sharp drop-offs and gravel shoulders:` | Exact; not “drop-offs and gravel shoulders” alone. |
| Hazard | `Restricted visibility:` | |
| Hazard | `Uncontrolled intersections:` | Plural “intersections.” |
| Hazard | `Animals:` | Wildlife / deer on the road — **not** DOL 4.19 pet transport. |
| Hazard | `Hills and curves:` | |
| Hazard | `Railroad crossings:` | Rural unmarked / yellow round + white X. |

Paste block (hazard labels without the trailing colon if you want display titles; the guide prints them **with** the colon):

```
Lesson one – gravel roads
Lesson two – driving hazards
Large/slow vehicles
Sharp drop-offs and gravel shoulders
Restricted visibility
Uncontrolled intersections
Animals
Hills and curves
Railroad crossings
```

---

## 3) PSDP Skill thirteen — exact printed lesson headings

Printed p. **34**.

| # | Exact printed heading | Claude shorthand → correction |
|---|---|---|
| Lesson one | `Lesson one – five easy steps` | Not “five-step entry.” Guide title is **five easy steps**. |
| Lesson two | `Lesson two – emergency vehicles` | |
| Lesson three | `Lesson three – two or more lane roundabouts` | Not hyphenated `two-or-more-lane`. |

Five easy steps (body bullets under Lesson one): Slow down · Yield · Don’t stop, stay in lane · Follow signs · Exit.

---

## 4) DOL leftovers after Acts I–V (`main` spend)

Counted from live card JSON on `main`. Act V stack cites (PR #151) noted in italics where they change the leftover picture after merge.

### Requested parents / children

| Heading | Official? | `main` spend | Verdict for Act VI |
|---|---|---|---|
| **`4.8 Sharing with agricultural vehicles`** | Yes. Body `4.8 \| SHARING WITH AGRICULTURAL VEHICLES`. **Not in `pack/07` yet.** | **Unused (0)** | **NEW.** Pair with Skill twelve Large/slow vehicles / Grange convoy. Add parent before seed. |
| **`4.15 Other intersections`** | Yes. Parent. | **Once** — **IV-015** (downtown roundabout; Skill ten p2). | Parent **spent once**. See §5 for children. |
| **`4.15` Roundabouts** (TOC child) | Yes. Body `ROUNDABOUTS`. Never allowlisted as a child string. | Material taught under the **parent** on IV-015; **no** `(Roundabouts)` child string exists. | Decide in §5. |
| **`4.15` Diverging diamonds** | Yes. TOC + body `DIVERGING DIAMONDS`. | **Unused** | **NEW child** if you write a DDI card: `4.15 Other intersections (Diverging diamonds)`. |
| **`4.15` Uncontrolled Intersection** | Yes. TOC capital **I**. Body `UNCONTROLLED INTERSECTION`. | **Unused** | **NEW child:** `4.15 Other intersections (Uncontrolled Intersection)`. Pairs Skill twelve hazard. |
| **`4.7 Sharing the road with trains (Light rail)`** | Child only on allowlist. | **Once** — **IV-006** (street light rail). | Light-rail **child spent**. Rural railroad crossings (Skill twelve) need the **parent** body, not a Light Rail re-cite. |
| **`4.7 Sharing the road with trains`** (parent) | Yes. Body `4.7 \| SHARING THE ROAD WITH TRAINS`. **Not in `pack/07`.** | Never cited as bare parent. | **Add parent** for rural RR / gates / unmarked crossings — or go PSDP-only for Skill twelve railroad. Do **not** stretch `(Light rail)`. |
| **`4.0 Awareness and cooperation`** | Yes. Body `4.0 \| AWARENESS AND COOPERATION`. **Not in `pack/07`.** | **Unused (0)** | Available. Soft courtesy/awareness chapter — not a Skill twelve/thirteen lesson. Add only if a card truly teaches it. |
| **`5.6 Road and driving conditions (Slippery roads)`** | Yes. In `pack/07`. | **Twice** — **II-019** (ice / six seconds), **III-024** (wet / below posted). | Parent-child **spent**. Do not pretend it is fresh. |
| **`5.6` other TOC children** | Night driving · Curves · Skidding · Hydroplaning | **None cited on `main`.** Act V stack allowlists **`(Curves)`** but leaves it **unspent** (V-009 is `n/a`). | Still unspent: **Night driving**, **Curves**, **Skidding**, **Hydroplaning**. Night/snow/chains → **Act VII**. Curves may serve a Skill twelve hills-and-curves card if you want a DOL pair; gravel/run-off is **not** a 5.6 child. |

### Animals / gravel / soft shoulder

| Topic | Where it lives | Spent? | Act VI cite |
|---|---|---|---|
| **Wildlife / deer on rural roads** | PSDP Skill twelve `Animals:` | PSDP unused. | **PSDP twelve.** No DOL wildlife section. |
| **Pets in the cabin** | `4.19 Transporting (Animals)` | **Once** — **IV-018** (also II-018 teaches pet distraction under `5.5 Focus`). | **Not Act VI.** Do not re-spend 4.19 for deer. |
| **Gravel / traction / windrows** | PSDP Lesson one – gravel roads | Unused. | **PSDP-only** (`n/a` DOL) unless you only use 4.12 sign flavor. |
| **Run off / soft shoulder / overcorrect** | PSDP `Sharp drop-offs and gravel shoulders:` | Unused. | **PSDP-only.** Driver Guide has a **Soft shoulder** tile in the **4.12** sign gallery only — no body paragraph. **Do not mint** `4.12 Signs (Soft shoulder)` or a fake 5.6 gravel child. |
| **Deer crossing sign** | 4.12 sign gallery tile | Sign parent used (II-003, II-013, IV-007). | Optional photo read under existing `4.12 Signs`; rule text stays PSDP Animals. |

### Other useful unused / thin for Backcountry (optional)

| Heading | Note |
|---|---|
| `4.9 Sharing with emergency vehicles` | **Once** — III-022. Skill thirteen Lesson two may **REVIEW** or stay PSDP-only. |
| `4.4 Sharing with large vehicles` | **Twice** — III-011, III-012. Prefer **4.8** for farm/slow triangle, not another 4.4. |
| Traffic calming circles | Body under 4.15 parent; **not** a TOC child. Do not mint a child string. |

---

## 5) Repeat risk vs Act II / III — and what is left of **4.15**

### What IV-015 actually spent

From `cards/IV-015.json` + Act IV `CITATION_AUDIT.md` (PR #22 / #17):

- Cite: **`4.15 Other intersections`** (parent only).
- PR #10 **skipped 4.15 children** — there was never an allowlisted `(Roundabouts)` child.
- Teaching: yield to traffic already in; look left; no lane change inside; signal on exit. Downtown Seattle under **Skill ten p2** because Skill thirteen was not on the allowlist.

So: the **roundabout lesson under the parent** is spent once. The **named TOC children were never added**. Calling IV-015 “the roundabout child” is conceptual, not a child-string spend.

### Leftover 4.15 inventory

| Piece | Status after IV-015 |
|---|---|
| Parent `4.15 Other intersections` | **Used once** (roundabout). Further parent cites = **REVIEW**, same class as V-005 reviewing `5.3 Merging`. |
| Child Roundabouts | Material taught; **string never existed**. Adding `4.15 Other intersections (Roundabouts)` would be a **new child heading** for the same body IV-015 already used — legal by ramp-meter / zipper precedent, but **not a fresh lesson**. |
| Child Diverging diamonds | **Fully unused.** |
| Child Uncontrolled Intersection | **Fully unused.** |
| Traffic calming circles | Body only; not TOC. |

### Act VI roundabouts: DOL or PSDP-only?

**Recommendation (matches Act V “do not stretch / do not fake a new heading”):**

| Skill thirteen lesson | Prefer | Why |
|---|---|---|
| Lesson one – five easy steps | **`n/a` (PSDP-only)** or parent **REVIEW** `4.15 Other intersections` | Same DOL body IV-015 already graded. Prefer PSDP-only for the five-step drill so Act VI is clearly Skill thirteen, not a Core replay. |
| Lesson two – emergency vehicles | PSDP-only, or **REVIEW** `4.9 Sharing with emergency vehicles` (III-022) | DOL roundabout emergency text is inside the Roundabouts body (“pull over if an emergency vehicle approaches…”), not a new section. |
| Lesson three – two or more lane roundabouts | **PSDP-only** (`n/a`) | Multi-lane lane-choice arrows are Skill thirteen teaching; IV-015 already covered yield/look-left/no lane change. Do not mint a new DOL number. |

**True NEW 4.15 DOL for Act VI:** spend the unused children —

- `4.15 Other intersections (Diverging diamonds)`
- `4.15 Other intersections (Uncontrolled Intersection)`

Uncontrolled pairs Skill twelve; DDI is a Backcountry/highway-interchange beat that is not Skill thirteen.

### Act II / III collision map (do not re-teach as NEW)

| Prior card | Cite | Topic | Act VI risk |
|---|---|---|---|
| **II-024** | `4.13 Common intersections` | All-way stop / yield-to-right | Different from **uncontrolled**. Uncontrolled is 4.15 child + Skill twelve — safe as NEW if worded as no signs. |
| **III-022** | `4.9 Sharing with emergency vehicles` | Pull right for lights/siren | Skill thirteen Lesson two is roundabout-specific; mark REVIEW if you cite 4.9. |
| **III-011 / III-012** | `4.4 Sharing with large vehicles` | Truck blind zones / pass | Skill twelve Large/slow → use **4.8**, not another 4.4. |
| **II-019 / III-024** | `5.6 … (Slippery roads)` | Ice / wet speed | Do not hang gravel or soft-shoulder on Slippery roads. |
| **IV-006** | `4.7 … (Light rail)` | Leave the track lane | Rural RR ≠ light rail. Parent 4.7 or PSDP-only. |
| **IV-015** | `4.15 Other intersections` | Roundabout yield | Skill thirteen cards must not re-grade the same downtown yield as NEW DOL. |
| **IV-018** | `4.19 Transporting (Animals)` | Secure pets | Not deer. |

No Act II or Act III card cites `4.15`, `4.8`, or `4.0`.

---

## 6) Paste-ready allowlist adds (when seeding — not this PR)

**`pack/08_PSDP_SKILLS.json`** (append after Skill eleven once that lands, or after Skill ten on bare `main`):

```
Skill twelve: driving on rural roads
Skill thirteen: roundabouts
```

**`pack/07_DOL_SECTIONS.json`** (only real TOC/body headings; house style = Title case after the number, child in parentheses):

```
4.0 Awareness and cooperation
4.7 Sharing the road with trains
4.8 Sharing with agricultural vehicles
4.15 Other intersections
4.15 Other intersections (Diverging diamonds)
4.15 Other intersections (Uncontrolled Intersection)
```

Optional (only if you choose the child-string path for Skill thirteen, knowing the body was already taught):

```
4.15 Other intersections (Roundabouts)
```

Optional 5.6 children still unused (Curves already on Act V stack allowlist):

```
5.6 Road and driving conditions (Night driving)
5.6 Road and driving conditions (Curves)
5.6 Road and driving conditions (Skidding)
5.6 Road and driving conditions (Hydroplaning)
```

Park **Night / Skidding / Hydroplaning / chains** for Act VII unless a single daylight curve card needs Curves.

---

## 7) Sources

| Source | Path | Used for |
|---|---|---|
| WA PSDP 2025 | `source/25WAPSDP_LR_v3.pdf` | TOC lines 237–238; bodies printed pp. 33–34 |
| WA Driver Guide | `source/driver-guide.pdf` | Ch. 4/5 TOC; 4.0 / 4.7 / 4.8 / 4.15 / 5.6 bodies |
| Act V research / citation audit | PR #151 `pack/35`, `pack/37` | Style + Skill eleven numbering + park of twelve/thirteen |
| Act IV citation audit | PR #22 / #17 `CITATION_AUDIT.md` | IV-015 parent-only 4.15; children skipped |
| Live cards | `cards/I-*.json` … `IV-*.json` on `main` | Spend counts |

---

## Not this PR

- No Act VI card JSON.
- No `pack/07` / `pack/08` edits (document only — add at seed time).
- No art, stills, compile, or seed.
- No Acts I–III / V-013 changes.
- No chains / Snoqualmie (Act VII).
