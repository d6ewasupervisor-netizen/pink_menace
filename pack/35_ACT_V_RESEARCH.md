# 35 — Act V research gates (Claude)

Verbatim pull for Act V text. Do not invent headings. Do not mint Skill fourteen. Stacks on PR #132 (`pack/34_ACT_V.md` + `cards/V-*.json`). This pass reseats the stubs on the locks below.

**Locks (do not contradict):** Ali alone on the Ribbon; Yuna radio-only; load = relay hardware for **Tower 4**; `presence` canonical; 13 cards + existing end-of-run beat; cargo = thin-net (late still delivers — not a hard fail); no truck tire/axle framing; no Acts I–III replay; chains / Snoqualmie = Act VII.

---

## 1) Skill eleven — exact strings

**Present on this branch in `pack/08_PSDP_SKILLS.json`.** Absent from `pack/08` on `main`. Copy the allowlist string exactly (lowercase after the colon; en-dash **U+2013** before `part`). Never print the skill name on a card face.

From WA PSDP `source/25WAPSDP_LR_v3.pdf` printed TOC (PDF page 7):

> Skill eleven: highway driving – part one

> Skill eleven: highway driving – part two

Same two strings, already on the allowlist:

```
pack/08_PSDP_SKILLS.json
  "Skill eleven: highway driving – part one"
  "Skill eleven: highway driving – part two"
```

Printed body pages **31** / **32** (PDF pages 38 / 39). Banner on those pages:

> SKILL ELEVEN:
> HIGHWAY DRIVING – PART ONE

> SKILL ELEVEN:
> HIGHWAY DRIVING – PART TWO

There is no Skill fourteen in this edition. Next headings in the same TOC:

> Skill twelve: driving on rural roads
> Skill thirteen: roundabouts
> Continuing education
> Practice in other conditions

Park twelve / thirteen / `Practice in other conditions` for Acts VI / VII. Do not add them to `pack/08` for this act.

WA vs stale bible: `pack/01_BIBLE.md` §7 used to say Act IV = 11–12 and Act V = 13–14 (national booklet). Live Act IV cards cite **Skill ten: city driving**. Act V cites **Skill eleven**. This branch already corrected the Act V skill column.

---

## 2) Body section + heading for the four highway lessons

These four are **not** four DOL numbers. Three live only in the PSDP. Ramp meters live only in the Driver Guide.

### On-ramp segments

| | |
|---|---|
| Doc | `source/25WAPSDP_LR_v3.pdf` printed p. 31 |
| Pack heading to cite | `Skill eleven: highway driving – part one` (`pack/08_PSDP_SKILLS.json`) |
| Body heading | **Lesson two – on-ramp segments** |
| Pair DOL | `5.3 Merging` (`pack/07_DOL_SECTIONS.json`) — parent already used once (III-026) |

Verbatim (p. 31):

> Lesson two – on-ramp segments
> Explain the three segments of on-ramps, and how they’re used:
> • Entrance area: This stretch allows the driver time to search the highway and evaluate how much space they have to enter and what speed is needed.
> • Acceleration area: The driver brings the vehicle up to the speed of highway traffic flow.
> • Merge area: The driver uses this space to merge into the traffic flow.

DOL body that actually says the merge (`source/driver-guide.pdf` **5.3 \| MERGING**, printed ~p. 160):

> When you’re merging, enter traffic with enough space so you don’t cause the people around you to swerve, slow, or stop.
> Drivers already on the interstate have the right-of-way, so creating space to merge might require you to adjust your speed, faster or slower. Use the entire on-ramp, your turn signal, and your mirrors to merge into a safe space on the interstate.

PSDP sidebar, same page:

> There is plenty of time to merge. If a gap doesn’t present itself immediately, adjust your speed as early as possible in order to find one.

Also on p. 31, **Lesson three – merging**: “Do not completely stop in the entrance area unless absolutely necessary.”

### Exiting

| | |
|---|---|
| Doc | `source/25WAPSDP_LR_v3.pdf` printed p. 31 |
| Pack heading to cite | `Skill eleven: highway driving – part one` |
| Body heading | **Lesson four – exiting** |
| Pair DOL | `4.12 Signs` (exit panels) and/or `5.1 Speed (Adjusting speed for conditions)` (posted ramp speed) |

Verbatim (p. 31):

> Lesson four – exiting
> Teach the steps for exiting a highway:
> • Identify the exit well ahead of time.
> • Scan traffic for problems when approaching the exit, but don’t slow down on the highway.
> • Start to signal four to six seconds before reaching the ramp.
> • Upon entering the ramp, tap the brakes and begin to slow down to the posted exit ramp speed limit before reaching the curve. On some ramps, be prepared to rapidly reduce your speed.

There is **no** Driver Guide section titled Exiting. Do not mint `5.x Exiting`.

### Ramp meters

| | |
|---|---|
| Doc | `source/driver-guide.pdf` ch. 4 TOC + body |
| TOC | `4.11 Traffic light signals` → child **Freeway ramp meters** (printed TOC p. 11) |
| Body heading | **FREEWAY RAMP METERS** (printed ~p. 113) |
| Pack string to add before seed | `4.11 Traffic light signals (Freeway ramp meters)` — this pass adds it to `pack/07_DOL_SECTIONS.json` |
| Parent already used | `4.11 Traffic light signals` once (III-014). Cite the **child** on the meter card. |

Verbatim:

> FREEWAY RAMP METERS
> Ramp meters work like regular traffic signals. When the light is red, stop at the white stop line. When the signal turns green, you can continue along the on-ramp.

PR #132 had **no** ramp-meter card. This pass spends it on V-004.

### Steering gently at speed

| | |
|---|---|
| Doc | `source/25WAPSDP_LR_v3.pdf` printed p. 32 |
| Pack heading to cite | `Skill eleven: highway driving – part two` |
| Body heading | **Lesson one – steering technique** |
| Pair DOL | `5.1 Speed` (first unused parent; added on PR #132) |

Verbatim (p. 32):

> Lesson one – steering technique
> Once on the highway, coach your teen on steering technique. At fast highway speeds, excessive steering can be dangerous and lead to loss of control. Remind your teen to steer gently on highways.

There is **no** Driver Guide heading “steering gently.” Do not mint one. `5.1 Speed` is the pairing, not a new number.

---

## 3) After Acts I–IV — unused vs used-once

Counted on **`main` live `cards/{I,II,III,IV}-*.json`** (93 cards). Act IV cards that exist only on unmerged PRs are not in this count. `n/a` omitted.

### PSDP (`pack/08_PSDP_SKILLS.json` on this branch)

| String | I–IV count | Cards | Act V? |
|---|---|---|---|
| `Skill eight: parking – part two` | **unused** | — | **No.** Leftover from II. |
| `Skill eleven: highway driving – part one` | unused (not on `main` allowlist) | — | **Yes.** |
| `Skill eleven: highway driving – part two` | unused | — | **Yes.** |
| `Skill four: backing up` | **once** | I-010 | No. Lot. |
| `Skill eight: parking – part one` | **once** | II-021 | No. |
| `Skill one: before you start the engine` | 2 | I-002, I-009 | No. |
| `Skill two: moving, steering, and stopping` | 2 | I-004, IV-002 | No. (IV-002 is a pedal rule, not highway.) |
| `Skill seven: turning around` | 2 | II-029, II-030 | No. |
| `Skill three: how close are you?` | 3 | II-012, II-014, II-019 | No. |
| `Skill five: driving on a quiet street – part one` | 3 | II-002, II-003, II-017 | No. |
| `Skill five: driving on a quiet street – part two` | 6 | II-004, II-006, II-015, II-016, II-022, II-024 | No. |
| `Skill ten: city driving – part two` | 5 | IV-006, IV-011, IV-013, IV-015, IV-018 | No. Core done. |
| `Skill ten: city driving – part one` | 7 | IV-003–005, IV-007, IV-008, IV-026, IV-027 | No. |
| `Skill six: looking ahead` | 8 | II-005, II-007, II-009, II-010, II-013, II-023, II-026, II-027 | Review only via Skill eleven p2 three-second. |
| `Skill nine: multi-lane roads – part two` | 4 | III-014, III-015, III-018, III-029 | No. |
| `Skill nine: multi-lane roads – part one` | 16 | most of III | No. |

WA headings **not in `pack/08` yet** (do not add this act):

| Heading (TOC verbatim) | Park |
|---|---|
| `Skill twelve: driving on rural roads` | Act VI |
| `Skill thirteen: roundabouts` | Act VI. IV-015 already taught DOL `4.15 Other intersections` under Skill ten. The **PSDP heading** is still unused. |
| `Continuing education` | Not a skill. |
| `Practice in other conditions` | Act VII |

### DOL — unused / used-once that matter for V

| Heading | I–IV | Act V? |
|---|---|---|
| **`5.1 Speed`** (+ children Excessive / Speed limits / Adjusting speed for conditions) | **unused parent.** Not on `main` `pack/07`. PR #132 added both pack strings. | **Yes — first unused parent.** |
| **`4.11 Traffic light signals (Freeway ramp meters)`** | unused child. Parent used **once** (III-014). | **Yes.** This pass adds the child string. |
| **`5.3 Merging` child Zipper merging** | unused child. Parent used **once** (III-026). | Optional leftover. Not spent this pass (13-card lock). |
| `5.3 Merging` | **once** (III-026) | Review at highway speed. Legal. |
| `5.4 Time (Count seconds)` | **once** (II-012) | Review at highway speed (Skill eleven p2 lesson three). Legal. |
| `4.4 Sharing with large vehicles` | 2 (III-011, III-012) | Bible lists 4.4 on V. **Do not** spend it as truck tire/axle. Old Ninety following-distance can wait; this pass drops the V-013 trailer-stop card. |
| `4.12 Signs` | 3 | Exit / guide panels. Review OK. |
| `5.2 Space` | 7 | Tailgater / move over (Skill eleven p2). Review OK. |
| `5.10 Law enforcement` | **unused** on this `main` count (IV-019/020 are not on `main`) | Not Ribbon. |
| `5.8 Communicating risks` | unused parent, not in `pack/07` | Low. Mentions highways. Not Skill eleven’s lesson list. |

DOL cited on live IV cards but **missing from `main` `pack/07`**: `4.5 Sharing with motorcycles` (IV-008), `4.15 Other intersections` (IV-015), `4.19 Transporting (Animals)` (IV-018), `5.0 Dangers of driving` (IV-026). Not Act V work.

### Not Act V (park)

| Material | Where it lives | Park |
|---|---|---|
| Chains / chain-advisory tile | `5.6` snowy-roads bullet; `4.12` sign gallery tile only | **Act VII** |
| Snowplows | `4.4` body **SNOWPLOWS** | **Act VII** (Gravy) |
| Night / ice / fog / snow | `5.6` children; PSDP `Practice in other conditions` p. 36 | **Act VII** |
| Skill twelve / rural / `4.8` ag | PSDP p. 33; DOL 4.8 | **Act VI** |
| Skill thirteen / roundabouts | PSDP p. 34; DOL 4.15 leftover children | **Act VI** |
| `Skill eight: parking – part two` | `pack/08` | leftover II |

Exact Act VII chain quote (`source/driver-guide.pdf` **5.6** / Slippery roads):

> Use snow tires or chains when it’s required.
> During winter months, you can improve traction by adding chains to your tires or changing to studded tires.

**The Driver Guide has no section titled mountain pass, Snoqualmie, or chain-up.** IV-030’s locked “pass” is a door, not permission to teach chains on the Ribbon.

---

## 4) Other in-repo prerequisites Claude needs for 13 cards + end beat

| Doc | Why it is a prerequisite |
|---|---|
| `pack/34_ACT_V.md` | Beat skeleton. This pass overrides driver (Ali), load (Tower 4), and V-004 (ramp meter). |
| `pack/01_BIBLE.md` §7 | Zone **The Ribbon** — I-5 / I-90. DOL 4.4 / 5.1 / 5.3 / 5.4. Driver column on this pass: **Ali** (IV-030 already leaves her eastbound in the Menace). |
| `pack/01_BIBLE.md` §3 / §8 | Menace lock. Ali accent. No second ego marks on other vehicles. |
| `pack/04_card.schema.json` | `presence` is the only canonical Quiet live field. Zone already includes The Ribbon. `location_type` already includes `highway`. |
| `pack/21_THE_MANIFEST.md` + `src/manifest.js` | End beat is **not** a fourteenth card. Act V closer / radio / fail must name the relay kit + Tower 4. June / insulin / cooler stay Act II. **Thin-net:** late still delivers (`Tower 4 still takes it`). Fail copy must not hard-stop the kit as “tomorrow / sat.” |
| `pack/26_THE_QUIET.md` | Presence sums from noise. **T4 is not the cargo-fail collapse.** Daylight stubs ship `presence: 0`. |
| `pack/29_QUIET_RENDER_PROBE.md` | Quiet never fill the frame; never side-window close-up; never eye contact. Placement table: Act I lot, Act II one at distance, **the herd on the pass** (VII). Not a Ribbon still. Attach `ref_quiet.png` only if a later card puts the Quiet in the situation. |
| `pack/16_FEAR_AND_SOUND.md` | Presence is a sum, never a score. Hearing not required to drive. |
| `pack/12_IDENTITY_AND_CAMERA_POLICY.md` + `scripts/authoring-seat.js` | Act V ego is now **Ali / Menace**. `POV_MIRROR_REAR` is legal on the Menace (illegal on the Ledger). Clipboard not in the glass. Mya not loose while rolling. |
| `pack/23_THE_SPOKEN_DICTIONARY.md` | Swap column. Player copy never says “Skill eleven.” “hole” → gap. No bare doghouse. Debrief close-shapes rotate. |
| `pack/03_IMAGE_COMPILER_PROMPT.md` | Highway paint: real freeways use single or double solid, not invented skip patterns. Multi-lane geometry needs numbered lanes + `frame_side`. |
| `pack/09_REF_MAP.json` | Ali cockpit = `pink_menace_interior`. Exterior = `pink_menace_exterior`. Do not attach `ledger_cockpit` / `the_ledger` / `encore`. |
| `cards/IV-030.json` | Cliffhanger: Ali, Menace, eastbound, pass closed. Act V takes the **freeway**, not the pass. |
| `cards/IV-015.json` | Notes Skill thirteen is not on the allowlist. Do not “fix” that here. |
| `src/game.js` `ACT_ZONES` | Already lists Act V · The Ribbon. Unseeded = not playable. Do not seed this draft. |
| `scripts/validate-act-v.js` | 13 ids; rejects V-014, cooler/insulin, missing `presence`, Act VII weather, I–III replay language. |

### Skill eleven lesson → card (this pass)

| PSDP lesson | Card | DOL |
|---|---|---|
| p1 Lesson one – observation | V-001 (Yuna radio; Ali already has the wheel) | 4.12 Signs |
| — load lock | V-002 dossier | n/a |
| p1 Lesson two – on-ramp segments | V-003 | 5.3 Merging |
| DOL FREEWAY RAMP METERS | V-004 | 4.11 Traffic light signals (Freeway ramp meters) |
| p1 Lesson three – merging (match / signal) | V-005 | 5.3 Merging |
| p1 “do not stop” + sidebar gap | V-006 | 5.3 Merging |
| p1 Lesson four – exiting (don’t slow on highway) | V-007 | 4.12 Signs |
| p1 Lesson four – posted ramp speed before the curve | V-008 | 5.1 Speed (Adjusting speed for conditions) |
| p2 Lesson one – steering technique | V-009 | 5.1 Speed |
| p2 Lesson two – one lane at a time | V-010 | 5.3 Merging |
| p2 Lesson two – move left for a merger | V-011 | 5.3 Merging |
| p2 Lesson three – three-second rule | V-012 | 5.4 Time (Count seconds) |
| p2 Lesson two – tailgater, move over | V-013 | 5.2 Space |

Dropped from PR #132: Deac ride-along, Ledger ego, Old Ninety trailer-stop (truck stopping-distance / axle-adjacent). Zipper leftover. Rain is legal on Skill eleven p2 lesson four; this pass keeps two daylight-rain cards (V-007, V-011) and does not use snow.

---

## 5) PR #132 gaps this pass closes

1. Driver was Deac / Ledger. Lock + IV-030 continuity: **Ali alone in the Menace.**
2. No Yuna. Lock: **radio-only** (cast may list `yuna`; she is never in the still).
3. Load was “valley drop.” Lock: **Tower 4** (same kit: repeater, antenna, mast clamps).
4. Missing unused highway child: **ramp meters.**
5. V-013 taught a trailer’s stopping distance — too close to truck tire/axle framing. Replaced with Hollis / move-over.
6. Cargo-fail copy said the kit “sat” / “tomorrow.” Thin-net: late still delivers.
7. `pack/08` on `main` still stops at Skill ten — Skill eleven lives on this stack only until merge.
