# Act V prep — The Ribbon (highway / Skill eleven)

Text only. No art. No Act I–III replay. Does not rewrite Act IV.

**Act V is the Ribbon and Skill eleven.** Highway material from the WA Parent’s Supervised Driving Program (PSDP) and leftover Driver Guide headings that still teach freeway speed, merge, exit, and ramp control.

**Act VII is Snoqualmie / chains / mountain-pass weather.** The Driver Guide has no numbered “mountain pass” section. The only chain *requirement* in the book sits under **5.6** snowy roads (`Use snow tires or chains when it’s required`) plus a **4.12** sign tile named `Chain advisory`. Park that whole slice — and Gravy / snowplows / night-snow — for **The Dark Hours**. Do not seed those as Act V cards.

---

## Sources (repo, not invented)

| Source | Where | Used for |
|---|---|---|
| WA PSDP 2025 | `source/25WAPSDP_LR_v3.pdf` (on Act IV text PRs #10 / #12 / #22; printed TOC pp. 29–36) | Exact skill headings and Skill eleven body |
| WA Driver Guide | `source/driver-guide.pdf` (same PRs) | Ch. 4 / 5 TOC + body. Section ids are the printed `N.N \| TITLE` headings |
| Act IV spend | PR #22 `cards/drafts/IV-CARD-INDEX.md` + `CITATION_AUDIT.md` | What Core already cited |
| Act IV prep (research only) | cloud agent `bc-cea5ea3f` — no files landed | WA-vs-national numbering; ch. 4/5 inventory |
| Zone map | `pack/01_BIBLE.md` §7 | Ribbon = I-5 / I-90, Deac. **Skill numbers in that table are stale** (national, not WA) |
| Allowlists | `pack/08_PSDP_SKILLS.json`, `pack/07_DOL_SECTIONS.json` | Main still stops at Skill nine. Act IV PRs add Skill ten + city DOL. **Skill eleven is not on any allowlist yet** |

House style for new PSDP strings (locked by Act IV citation work): lowercase after the colon; en-dash **U+2013** before `part`.

`01_BIBLE.md` §7 still says Act IV = skills 11–12 and Act V = skills 13–14. That is the **national** numbering. The WA edition in the repo PDF is:

| WA PSDP (verbatim TOC) | Printed p. | Campaign |
|---|---|---|
| `Skill ten: city driving – part one` / `part two` | 29 / 30 | **Act IV / The Core** (already written) |
| `Skill eleven: highway driving – part one` / `part two` | 31 / 32 | **Act V / The Ribbon** |
| `Skill twelve: driving on rural roads` | 33 | Act VI / Backcountry |
| `Skill thirteen: roundabouts` | 34 | Act VI (DOL 4.15 already used once on IV-015) |
| `Continuing education` | 35 | Unnumbered. Not a skill. |
| `Practice in other conditions` | 36 | **Act VII / Dark Hours** |

**There is no Skill fourteen** in the WA edition. Do not mint `Skill fourteen: …`.

---

## 1. Unspent PSDP after Acts I–IV

Spent (verbatim strings that appear on I–IV cards; Act IV from PR #22):

| Skill | Where it was spent |
|---|---|
| Skill one … four | Act I (lot). Skill two / four thin; not Ribbon work |
| Skill three: how close are you? | Act II |
| Skill five part one / part two | Act II |
| Skill six: looking ahead | Act II |
| Skill seven: turning around | Act II (II-029 / II-030) |
| Skill eight: parking – part one | Act II (II-021 only) |
| Skill nine part one / part two | Act III |
| Skill ten part one / part two | Act IV Core (city). **Done.** |

Still unspent — **labels that exist in the WA guide:**

| Heading (copy exactly) | In `pack/08` today? | Act |
|---|---|---|
| `Skill eight: parking – part two` | yes (main) | Leftover from II. Not Ribbon. Do not spend it here. |
| `Skill eleven: highway driving – part one` | **no** — add before seed | **Act V** |
| `Skill eleven: highway driving – part two` | **no** — add before seed | **Act V** |
| `Skill twelve: driving on rural roads` | no | Act VI |
| `Skill thirteen: roundabouts` | no | Act VI. IV-015 already taught the DOL roundabout under Skill ten + `4.15 Other intersections`. The **PSDP heading** is still unused. |
| `Continuing education` | no | Not a skill string. Do not add unless a later act needs the unnumbered chapter. |
| `Practice in other conditions` | no | **Act VII** (night, wet, fog, snow) |

**PSDP 11 / 12 / 13:** those labels **do** exist in the pack/refs, but only as spelled-out headings in `source/25WAPSDP_LR_v3.pdf` (TOC pp. 31–34). They are **not** in `pack/08_PSDP_SKILLS.json` on main, and Act IV PRs only added Skill ten. There is no `Skill 11` / `Skill 12` / `Skill 13` numeric form. Use `Skill eleven` / `Skill twelve` / `Skill thirteen`.

Act V spends **only** the two Skill eleven strings.

---

## 2. DOL leftovers after Act IV (ch. 4 / 5)

### What Act IV already covered (PR #22 index)

| Card | Cited DOL |
|---|---|
| IV-003 | `5.5 Focus` |
| IV-004, IV-005 | `4.1 Sharing with people` |
| IV-006 | `4.7 Sharing the road with trains (Light rail)` |
| IV-007 | `4.12 Signs` |
| IV-008 | `4.5 Sharing with motorcycles` |
| IV-011 | `4.18 Parking` |
| IV-013 | `4.6 Sharing with bicyclists` |
| IV-014, IV-027 | `5.2 Space` |
| IV-015 | `4.15 Other intersections` (roundabout) |
| IV-018 | `4.19 Transporting (Animals)` |
| IV-019 | `5.10 Law enforcement (Getting pulled over)` |
| IV-020 | `5.10 Law enforcement (Getting a ticket)` |
| IV-021, IV-022 | `5.9 Collisions` |
| IV-023 | `5.7 Vehicle failures` |
| IV-024 | `4.20 Maritime (Ferries)` |
| IV-026 | `5.0 Dangers of driving` |
| IV-002, 009, 010, 012, 016, 017, 025, 028–030 | `n/a` |

IV-030 (`The Door to the Pass`) is a dossier cliffhanger: Core behind, road east, **Act V locked**. It names “the pass” as a locked door. That is **not** permission to teach chains or Snoqualmie on the first Ribbon cards. The next *skill* is highway driving.

### Parents already used in I–III (do not pretend they are fresh)

`4.2, 4.3, 4.4, 4.6, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.16, 4.16 HOV, 4.17 School, 4.17 Work, 4.18, 5.2, 5.3, 5.4 Time (Count seconds), 5.5, 5.6 (Slippery roads)`.

`4.4` and `5.3` are on Bible §7’s Act V row. The **parent strings** are already spent (III-011 / III-012 = large vehicles; III-026 = merging). Ribbon may reuse a parent only when the **unused child** is the lesson (ramp meter, zipper, steep-grade trucks) — or cite a still-unused parent (`5.1`).

### Unused or leftover after I–IV — prioritize for Act V

| Heading | Official? | Act V? | Why |
|---|---|---|---|
| **`5.1 Speed`** (+ TOC children Excessive speeds / Speed limits / Adjusting speed for conditions) | Yes. Body `5.1 \| SPEED`. **Not in `pack/07` yet.** | **Yes — first unused parent. Add before seed.** | Bible §7 lists 5.1 on Act V. Skill eleven is high-speed. Ali’s weakness is SPEED (`01_BIBLE.md` §3). |
| **`5.3 Merging`** parent already used; **`Zipper merging`** child unused | TOC child of 5.3 | **Yes** | Skill eleven part one *is* the merge lesson. Zipper is the unused 5.3 child. |
| **`4.11` Freeway ramp meters** | TOC child of 4.11; body heading `FREEWAY RAMP METERS` | **Yes** | Highway on-ramp control. Parent `4.11 Traffic light signals` already used (III-014). Add child string only if seeding the child (same precedent as IV-020 / Getting a ticket). Until then cite the parent. |
| **`5.4 Time`** | In `07` as `5.4 Time (Count seconds)` | Optional | Bible lists 5.4 on Act V. Already taught on II-012. Skill eleven part two *reviews* the three-second rule at highway speed — usable as a review cite, not a new heading. |
| **`4.4` Long, steep grades** (body under large vehicles) | Not a separate TOC number | Optional highway | “When traveling up or down steep roads, large vehicles travel slowly. Be prepared to encounter slow vehicles in the right lane.” Cite parent `4.4 Sharing with large vehicles` — do not mint `4.4 (Steep grades)`. |
| **`5.8 Communicating risks`** | Body `5.8 \| COMMUNICATING RISKS`. Not in `07`. | Low | Unused parent. Mentions highways. Not Skill eleven’s primary lessons. Add only if a later Ribbon card needs horn/lights as communication. |

### Leftovers that are **not** Act V

| Heading | Park |
|---|---|
| `4.4` **Snowplows** body | **Act VII** (Gravy / Snoqualmie). See §4. |
| `5.6` children Night driving / Curves / Slippery / Skidding / Hydroplaning; snow + **chains** bullets | **Act VII** + `Practice in other conditions`. Skill eleven part two Lesson four allows *rain* on a highway as a light conditions card; that is not snow, not chains, not the pass. |
| `4.12` **Chain advisory** sign tile | **Act VII**. No body paragraph. Do not mint `4.12 Signs (Chain advisory)`. |
| `4.8 Sharing with agricultural vehicles` | Act VI |
| `4.15` leftover children Diverging diamonds / Uncontrolled Intersection | Act VI (roundabout child already used on IV-015) |
| `4.17 Zones (Emergency zone)` | Unused TOC child. Not highway-primary. |
| `4.19` Towing / Secure your load | Unused siblings of IV-018 Animals |
| `4.20` Beaches | Sibling of IV-024 Ferries |
| `5.7` / `5.9` / `5.10` | Parents spent on Act IV. Remaining children (if any) stay later-act. |

Do **not** mint DOL section numbers. If a string is not in `pack/07_DOL_SECTIONS.json`, add it only when it is a real TOC or body heading, then seed.

---

## 3. Skill eleven — what the guide actually teaches

Printed pages **31–32** of `25WAPSDP_LR_v3.pdf`. Verbatim headings for `pack/08`:

- `Skill eleven: highway driving – part one`
- `Skill eleven: highway driving – part two`

### Part one (p. 31) — enter and exit

> Goal: Teach your teen highway basics and how to safely enter and exit a highway.
> Location: Start on a multi-lane highway with easily accessible exits, at a time when traffic is light, such as a weekend morning.

Lessons (body headings in the guide, **not** DOL numbers):

1. **Observation** (passenger first): interchanges; highway signs and signals; lane lines and markings.
2. **On-ramp segments:** Entrance area (search the highway, evaluate space and speed) / Acceleration area (match traffic flow) / Merge area (enter the flow).
3. **Merging:** check on-ramp speed signs; glance and scan for gaps; signal in the acceleration area; merge checking mirrors and blind spots; kill the signal; look ahead; **“Do not completely stop in the entrance area unless absolutely necessary.”**
4. **Exiting:** identify the exit well ahead; **don’t slow down on the highway**; signal four to six seconds before the ramp; on the ramp, tap brakes and slow to the posted ramp speed before the curve.

Sidebar: “There is plenty of time to merge. If a gap doesn’t present itself immediately, adjust your speed as early as possible in order to find one.”

### Part two (p. 32) — speed and complexity

> Goal: Teach your teen to maneuver safely in complex highway driving environments at higher speeds.

1. **Steering:** “At fast highway speeds, excessive steering can be dangerous and lead to loss of control. Remind your teen to steer gently on highways.”
2. **Lane changing:** practice Skill nine passing/lane-change **at highway speeds**; one lane at a time; move left for merging traffic; watch tailgaters; check blind spots.
3. **Three-second rule** (review Skill six): add more following distance at higher speeds; also use three seconds for merging, changing lanes, and exiting.
4. **Challenging road conditions:** adjust speed and position; practice on highways in **rain**; conditions change quickly. *(Rain only here. Snow/ice/chains → Act VII.)*
5. **Road trips:** two-to-three-hour day trips. Campaign color, not a graded rule.

### Driver Guide pairing (already in the book)

Skill eleven does not invent law. Pair it with existing or addable DOL:

| Skill eleven lesson | DOL that actually says it | Allowlist note |
|---|---|---|
| Merge onto a highway | `5.3 \| MERGING` — “Drivers already on the interstate have the right-of-way… Use the entire on-ramp, your turn signal, and your mirrors…” | Parent already in `07` as `5.3 Merging` |
| Zipper at a closure | `5.3` child **ZIPPER MERGING** | Add child only if you seed it |
| Ramp meter | `4.11` **FREEWAY RAMP METERS** — “When the light is red, stop at the white stop line. When the signal turns green, you can continue along the on-ramp.” | Parent in `07`; child not yet |
| Speed / conditions | `5.1 \| SPEED` + SPEED LIMITS + ADJUSTING SPEED FOR CONDITIONS | **Add `5.1 Speed` before seed** |
| Following at speed | `5.2 Space` / `5.4 Time (Count seconds)` | Already used; review OK |
| Don’t cut a truck | `4.4` merging/stopping-distance body (III already used the parent) | Review / Old Ninety, not a new number |
| Rain on the ribbon | Skill eleven p. 32 Lesson four. DOL rain text lives under `5.6`. | If used, cite existing `5.6 Road and driving conditions (Slippery roads)` and keep it **rain**, not snow |

---

## 4. Parked for Act VII — mountain pass / chains / Snoqualmie

Exact finding, so nobody re-opens this as an Act V card:

**The Driver Guide has no section titled mountain pass, Snoqualmie, or chain-up.** A search of `source/driver-guide.pdf` hits only:

1. **4.12 Other traffic signs** — a sign tile labeled `Chain advisory` (no explanatory paragraph). Printed with Advisory speed / Light rail in the sign gallery. **Not** a TOC child. Do not mint `4.12 Signs (Chain advisory)`.
2. **5.6 Road and driving conditions → Snowy roads** (body under `SLIPPERY ROADS`):

> Use snow tires or chains when it’s required.
> During winter months, you can improve traction by adding chains to your tires or changing to studded tires.

3. **4.4 SNOWPLOWS:**

> Use caution when driving near snow removal equipment. Snowplows can force snow up and off the road, causing blizzard-like conditions. This can reduce visibility for drivers following too closely.

4. PSDP **Practice in other conditions** p. 36 **Snow** (clear snow/ice, gentle acceleration, 10× stopping distance, bridges/shade ice). **No chain sentence** in the PSDP.

Bible already parks this: §5 Gravy = “Snowplow operator, Snoqualmie Pass”; §7 Act VII = “night, rain, fog, Snoqualmie snow” / `Practice in other conditions` / 5.6. IV-030’s locked “pass” is the door **to** that later act, not the Skill eleven lesson.

**Chains card: warranted for Act VII, not Act V.** Cite `5.6 Road and driving conditions (Slippery roads)` when that act is written. The chain-advisory sign can be the photographable read without a new section number.

---

## 5. Recommended first Act V cards

Zone `The Ribbon`. Driver `deac` (`01_BIBLE.md` §7). Suggested ids only — not seeded. V-001 follows the III-001 / IV-001 ride-along slot.

| Suggested id | Title | Type | Why (one line) |
|---|---|---|---|
| V-001 | *(ride-along, lines later)* | ride-along | Skill eleven part one Lesson one: passenger observation of interchanges, highway signs, lane lines before she takes the wheel. |
| V-002 | **The Acceleration Area** | scene | First graded Ribbon card. Three on-ramp segments + merge. Skill eleven p. 31 + `5.3 Merging`. |
| V-003 | **Don’t Stop on the Entrance** | scene | Explicit part-one rule: do not completely stop in the entrance area unless necessary; adjust speed to find a gap. |
| V-004 | **Ramp Meter** | rule | Unused 4.11 child: red = stop on the white line; green = continue up the on-ramp. |
| V-005 | **Posted Is Ideal** | scene | First use of **`5.1 Speed`**. Speed limits are the maximum under ideal conditions; reduce when the road asks. |
| V-006 | **Don’t Slow on the Highway** | scene | Exit lesson: identify early, signal 4–6 seconds out, slow **on the ramp** to the posted ramp speed. |
| V-007 | **One Lane at a Time** | scene | Skill eleven part two lane-change at highway speed; move over for merging traffic. |
| V-008 | **Three Seconds Faster** | scene | Part two review: add following distance at speed; three seconds also for merge / lane-change / exit. |
| V-009 | **Zipper** | scene | Unused `5.3` child. Stay in lane to the merge point; take turns. |
| V-010 | **Gentle at Speed** | scene | Part two Lesson one: excessive steering at highway speed loses the vehicle. |

**Not on this list:** chains, chain-advisory, snowplow / Gravy, Snoqualmie, black ice, studded tires, Skill twelve, Skill thirteen.

Skinny stubs for the three highest-confidence openers: `V-002-acceleration-area.md`, `V-004-ramp-meter.md`, `V-005-posted-is-ideal.md`.

---

## 6. Allowlist work before any Act V seed

Add to `pack/08_PSDP_SKILLS.json` (copy from the PDF TOC, U+2013):

```
Skill eleven: highway driving – part one
Skill eleven: highway driving – part two
```

Add to `pack/07_DOL_SECTIONS.json` only what you are about to cite:

```
5.1 Speed
```

Optional children, **only if a card grades that child** (real TOC, same pattern as IV-020):

```
5.3 Merging (Zipper merging)
4.11 Traffic light signals (Freeway ramp meters)
```

Do not add Skill twelve / thirteen / `Practice in other conditions` until those acts. Do not add a mountain-pass or chains heading.

---

## 7. Coordination

| Thing | Do |
|---|---|
| Act IV text / cites | PRs #12, #17, #22. Do not rewrite. |
| Act IV Batch D stills | PR #23. Do not block. Do not touch takes. |
| `01_BIBLE.md` §7 skill numbers | Stale. Do not copy 13–14 onto Act V cards. Fix the table in a later pack PR if someone is editing the bible; this prep does not. |
| Encore / I-009 art | Untouched. |
| Act VII prep | Separate pass: 5.6 snow + chains quote, 4.4 snowplows, `Practice in other conditions`, Gravy. |

---

## 8. Quote appendix (highway only)

**5.3 Merging** (`driver-guide.pdf` body):

> Drivers already on the interstate have the right-of-way, so creating space to merge might require you to adjust your speed, faster or slower. Use the entire on-ramp, your turn signal, and your mirrors to merge into a safe space on the interstate.

**4.11 Freeway ramp meters:**

> Ramp meters work like regular traffic signals. When the light is red, stop at the white stop line. When the signal turns green, you can continue along the on-ramp.

**5.1 Speed / Speed limits:**

> Speed limits indicate the maximum speed legal under ideal conditions. Washington law also requires you to drive at speeds that are safe for current road conditions. This means reducing your speed when conditions are poor. You can drive below the speed limit, but exceeding it is illegal.
> You’re responsible for always driving at a safe speed, regardless of the posted limit.
