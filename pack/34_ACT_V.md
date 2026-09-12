# 34 — Act V draft: The Ribbon

First outline only. No stills. Do not seed. Do not touch Act IV art or takes.

**Citation accounting:** `pack/35_ACT_V_ACCOUNTING.md` — which V-001–V-013 use which Skill eleven / DOL string, unused allowlist entries, and the end-of-run beat (not a V-014 card).

**Constraint (authoritative):** Act V = **The Ribbon** (I-5 / I-90) + **Skill eleven** highway material. Driver: **Ali alone in the Menace**. **Yuna on radio**, not in the cab. Daylight.

**Not this act:** chains, snow, ice, fog, night, Snoqualmie Pass, Gravy the plow (Act VII). Rural / roundabouts (Act VI). **No tow, flatbed, drums, sway `load_state`, insulin, or cooler fiction.** Load is the relay kit. Act is **13 cards + the existing end-of-run beat** (no new V-014). **III-001 stays the only ride-along.**

---

## Closest existing docs

| Doc | What it already said |
|---|---|
| `pack/01_BIBLE.md` §7 | Zone is **The Ribbon** — I-5 / I-90. Skill column was stale (`13–14`). Corrected to WA Skill eleven. Driver cell this pass: **Ali**. DOL cell includes 4.4, 4.12, 5.1, 5.2, 5.3, 5.4. |
| `pack/08_PSDP_SKILLS.json` | Skill eleven: official TOC / Skill ten style uses en-dash; Claude’s hyphen twins are also allowlisted. |
| `pack/07_DOL_SECTIONS.json` | Added `4.11 Traffic light signals (Freeway ramp meters)` and `5.6 Road and driving conditions (Curves)` from `source/driver-guide.pdf`. |
| `pack/35_ACT_V_ACCOUNTING.md` | Used / unused skill and DOL strings. No V-014. |
| `pack/20_ACT_III_PLAN.md` | Slot-table pattern this draft copies. |
| `pack/04_card.schema.json` | Card shape. `zone` already includes The Ribbon; `location_type` already includes `highway`. `presence` optional integer ≥ 0. |
| `PLAYTHROUGH.md` | Act IV is the live ship. Leave it. |
| `src/game.js` `ACT_ZONES` | Already lists Act V · The Ribbon. Unseeded = not playable. |
| WA PSDP `source/25WAPSDP_LR_v3.pdf` | **Skill eleven: highway driving – part one** / **part two** (TOC; printed pp. 31–32). En-dash. |
| IV-015 `teaching_target` | Already notes Skill thirteen is not on the allowlist (roundabouts → Act VI). |
| IV-030 | Eastbound Core cliffhanger; the pass stays closed. Act V takes the freeway, not the pass. |
| `pack/21_THE_MANIFEST.md` + `src/manifest.js` | Act II keeps June / insulin. **Act V** `MANIFESTS.V` + `deliveryBeat` / fail / radio use the relay kit. Radio voice is **Yuna**. End-of-run closer is still the existing beat, not a new card. |
| `pack/04_card.schema.json` `presence` | Canonical Quiet live field on the card. Do not invent `load_state`. |
| `src/presence.js` | Run-state presence still sums from noise. Card JSON `presence` is the authored starting/situation value (0 on this daylight highway draft). |

Act IV live cards cite **Skill ten: city driving**, not 11–12. The bible’s old Act IV = 11–12 / Act V = 13–14 map was the generic booklet, not the WA headings this pack copies.

---

## Ribbon role

The Ribbon is the limited-access highway after The Core. I-5 south of downtown, then I-90 east only as far as the **valley floor** (Issaquah / the last urban interchanges). The mountain is visible. The pass is not open to this run.

Ali has the wheel. She is alone. Yuna is a radio, not a passenger. No Deac, no jump seat, no cats loose on the highway. The Menace has a rear window — following traffic may use `POV_MIRROR_REAR`.

Teaching job: enter, travel, and leave a highway at speed without planting the Menace, pinching a ramp, or yawing the Beetle.

---

## Vehicle, load, presence (locked)

**Vehicle** is the Menace as already locked (Ali). No Ledger on this run. No hitch, no flatbed, no drums.

**Load (Claude lock):** relay hardware — **repeater set, antenna, mast clamps**. Already sized for the Menace; lashed behind the seats. Cargo, not a new roof mark and not a second vehicle. V-001 / V-002 name it. No insulin. No cooler fiction on the Ribbon.

**Live field:** `presence` is canonical on the card JSON (`pack/04_card.schema.json`). All thirteen stubs ship `presence: 0` (daylight highway, Quiet not in the situation). Do not add `load_state` or any parallel live field.

**Cast:** Ali alone / Yuna radio. Hollis (V-011) and Old Ninety (V-013) are other vehicles, not cab occupants.

**Count:** Act V = **thirteen cards (V-001…V-013) + the existing end-of-run beat** (`deliveryBeat` / locked door after the last card). **V-014 is not a new card.**

---

## Skill eleven teaching targets

### Part one — enter and leave

| PSDP lesson | Target |
|---|---|
| Observation (eyes up) | Name interchanges, highway signs, lane lines; eyes up, not on the bumper. Yuna can name them on the radio. |
| On-ramp segments | Entrance (search) → acceleration (match flow) → merge (take the gap). |
| Merging | Signal, match speed, check glass and blind spots; do not stop on the ramp unless there is no other choice. If the gap is late, change speed until one appears. |
| Exiting | Pick the exit early. Do not dump speed on the highway. Signal four to six seconds before the ramp. On the ramp, tap the brakes and be at the posted ramp speed before the curve. |

### Part two — travel at speed

| PSDP lesson | Target |
|---|---|
| Steering | Small wheel. Sharp steer at highway speed is yaw. |
| Lane changing | One lane at a time. Move one lane left to make space for a merger when you have it. Move over for a tailgater; do not brake-check. |
| Three-second rule | Same count as Skill six, now for merge / lane change / exit at highway speed. |
| Conditions | Daylight rain only if we keep it. Snow, ice, night, the pass → Act VII. |

DOL already mapped for this zone: **4.4** large vehicles, **4.12** signs, **5.1** speed, **5.2** space, **5.3** merging, **5.4** time.

---

## ACCOUNTING (short)

Exact locked strings and the unused allowlist live in `pack/35_ACT_V_ACCOUNTING.md`.

| Card | Type | Skill / DOL |
|---|---|---|
| V-001 | scene | eleven p1 · 4.12 Signs |
| V-002 | dossier | n/a |
| V-003 | scene | eleven p1 · 5.3 Merging |
| V-004 | scene | eleven p1 · 5.3 Merging |
| V-005 | hazard | eleven p1 · 5.3 Merging |
| V-006 | rule | eleven p1 · 4.12 Signs |
| V-007 | scene | eleven p1 · 5.1 Speed (Adjusting speed for conditions) |
| V-008 | scene | eleven p2 · 5.1 Speed |
| V-009 | rule | eleven p2 · 5.3 Merging |
| V-010 | hazard | eleven p2 · 5.3 Merging |
| V-011 | scene | eleven p2 · 5.2 Space |
| V-012 | rule | eleven p2 · 5.4 Time (Count seconds) |
| V-013 | scene | eleven p2 · 4.4 Sharing with large vehicles |
| — | existing end-of-run beat | Engine `deliveryBeat` / locked door after V-013. Not a new card. |

Thirteen stubs. Play order is `seq`. The closer is the beat the game already fires when an act completes.

---

## Beat order (V-001 … V-013 + existing end beat)

| Card | Type | Shot | Lesson one-liner | Skill / DOL |
|---|---|---|---|---|
| V-001 | scene | `POV_COCKPIT` | Ali alone. Yuna radio names the Ribbon. Kit already lashed. | eleven p1 · 4.12 Signs |
| V-002 | dossier | `POV_PORTRAIT` | Kit named: repeater, antenna, mast clamps. Fits the Menace. No cooler. | n/a |
| V-003 | scene | `POV_DIAGRAM` | A ramp is three pieces. Use each for its job. | eleven p1 · 5.3 Merging |
| V-004 | scene | `POV_COCKPIT` | Match their speed in the acceleration stretch, then take the gap. | eleven p1 · 5.3 Merging |
| V-005 | hazard | `POV_COCKPIT` | No gap yet — change speed. Do not plant the Menace. | eleven p1 · 5.3 Merging |
| V-006 | rule | `POV_OBJECT` | Hold highway speed until the ramp. Signal early. | eleven p1 · 4.12 Signs |
| V-007 | scene | `POV_COCKPIT` | Posted ramp speed before the curve, not on the freeway. | eleven p1 · 5.1 Speed (conditions) |
| V-008 | scene | `POV_ROADSIDE_PROFILE` | Small hands at speed. A yank is yaw. | eleven p2 · 5.1 Speed |
| V-009 | rule | `POV_DIAGRAM` | One lane, sit, then the next. | eleven p2 · 5.3 Merging |
| V-010 | hazard | `POV_MIRROR_DOOR` | Merger on the right — give them a lane if you have one. | eleven p2 · 5.3 Merging |
| V-011 | scene | `POV_MIRROR_REAR` | Hollis on the tail — move over. Let him have it. | eleven p2 · 5.2 Space |
| V-012 | rule | `POV_DIAGRAM` | Count three on the pavement before you take a highway gap. | eleven p2 · 5.4 Time |
| V-013 | scene | `POV_CHASE` | Old Ninety needs more than a car length at this speed. | eleven p2 · 4.4 Large vehicles |
| — | existing end-of-run beat | — | Engine `deliveryBeat` / locked door after V-013. Not a new card. | n/a |

---

## Explicitly deferred to Act VII

- Snoqualmie Pass, chain-up, snowplow / Gravy, never-pass-a-plow
- Night, deep night, dusk-as-dark, fog, ice, heavy snow
- Fatigue microsleep on a long wet pass (the Drift can cameo; the pass cannot)
- Recurring lots at night (bible § visual accumulation)

## Explicitly deferred to Act VI

- Skill twelve: driving on rural roads (gravel, farm equipment, drop-offs)
- Skill thirteen: roundabouts (IV-015 already borrowed city Skill ten for a downtown circle)

## Not a replay of I–III

No lot start, no quiet-street backing, no Central zipper / HOV diamond / two-way left. Those cards stay where they are. Highway versions of merge / three-second / truck no-zones are new situations at new speed, not rewritten III copy.

---

## Pack table changes this draft

- `pack/08_PSDP_SKILLS.json` — both Skill eleven headings (verbatim WA PSDP TOC).
- `pack/07_DOL_SECTIONS.json` — `5.1 Speed`, `5.1 Speed (Adjusting speed for conditions)`, plus this pass: `4.11 Traffic light signals (Freeway ramp meters)`, `5.6 Road and driving conditions (Curves)`.
- `pack/01_BIBLE.md` §7 Act V — Skill eleven; driver **Ali**; DOL 4.4 / 4.12 / 5.1 / 5.2 / 5.3 / 5.4.
- `scripts/authoring-seat.js` — Act V ego lock is Ali (Menace).
- `pack/04_card.schema.json` — optional `presence` (canonical live field).
- `scripts/seed-cards.js` — persists `presence` in `extra` (do not seed this draft).
- `src/manifest.js` — `MANIFESTS.V` + act-aware `deliveryBeat` / fail / radio (relay kit; **Yuna** radio; Act II June copy unchanged).
- `pack/35_ACT_V_ACCOUNTING.md` — used / unused citations; no V-014.

---

## OPEN — DOL headings not in the Driver Guide

Do **not** invent these as `dol_section` strings. Verified sources: `source/driver-guide.pdf`, `source/25WAPSDP_LR_v3.pdf`. Detail + quotes: `pack/35_ACT_V_ACCOUNTING.md`.

1. **On-ramp segments** — PSDP Skill eleven p1 lesson title. DOL has no heading with this name. Cards use `5.3 Merging`.
2. **Exiting a highway** — PSDP Skill eleven p1 lesson four. DOL has no heading “Exiting a highway”. V-006 uses `4.12 Signs`; V-007 uses `5.1 Speed (Adjusting speed for conditions)`.
3. **Steering gently at highway speed** — PSDP Skill eleven p2 (“steer gently on highways”). DOL has no heading with this name. Nearest verified subsection added: `5.6 Road and driving conditions (Curves)`. V-008 still cites `5.1 Speed`.

**Freeway ramp meters** is **not** OPEN. Locked allowlist string: `4.11 Traffic light signals (Freeway ramp meters)`. No V-card cites it yet.

## Open questions for Claude

Load, `presence`, card count, Ali alone / Yuna radio, and the Skill eleven allowlist are **locked** (above + ACCOUNTING). Still open:

1. **Rain on the Ribbon.** Skill eleven part two lesson four asks for highway practice in rain. Act IV locked dusk/night to VII. Is one daylight rain card (V-006 / V-010) legal, or is all weather except overcast VII?
2. **Eastbound cutoff.** Issaquah / Front Street / the last urban I-90 interchange — which painted place is “valley floor, pass not yet”?
3. **Skill twelve/thirteen allowlist.** Add them now for Act VI stubs, or wait?
4. **Old Ninety / Hollis budget.** One each this draft. Recur, or save Hollis for VII night tailgating?
5. **Generic bible leftovers.** §2 yaw line still says “PSDP Skill 13”. Update that string, or leave the locked bible alone beyond the zone-map cell?
6. **OPEN DOL topics above.** Cite the verified parent headings, or wait for a later official heading — do not invent.

Closed this pass: ride-along reprise (III-001 stays the only one). Ali as decider (she has the wheel the whole run).

---

## Production (not this PR)

1. Claude answers the open questions and rewrites any CARD_BROKEN copy.
2. Human citation pass before pixels.
3. Compile stills in one Ribbon batch. Attach Menace locks only. No Ledger lock on Ali cards.
4. Seed only after a muted-read pass. Never seed from this draft.
