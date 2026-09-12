# 34 — Act V draft: The Ribbon

First outline only. No stills. Do not seed. Do not touch Act IV art or takes.

Research gates (verbatim quotes + unused table): `pack/35_ACT_V_RESEARCH.md`.

Citation audit (open vs locked, Claude settles): `pack/37_ACT_V_CITATION_AUDIT.md`.

Yuna radio voice (four appearances; `cargo_rough` bands a successful end beat; `daylight_fail` ends the run and wins when both are set): `pack/36_YUNA_RADIO_VOICE.md`.

Muted-read packet (paste to Claude): `pack/ACT_V_13CARD_MUTED_READ.md`.

**Constraint (authoritative):** Act V = **The Ribbon** (I-5 / I-90) + **Skill eleven** highway material. Driver: **Ali / the Menace. Alone.** Yuna is radio-only. Daylight.

**Not this act:** chains, snow, ice, fog, night, Snoqualmie Pass, Gravy the plow (Act VII). Rural / roundabouts (Act VI). **No tow, flatbed, drums, sway `load_state`, insulin, or cooler fiction.** No Deac in the cab. No Encore in frame. No truck tire/axle lesson. Load is relay hardware for **Tower 4**. Act is **13 cards + the existing end-of-run beat** (no new V-014). `cargo_rough` bands a successful closer; `daylight_fail` ends the run.

---

## Closest existing docs

| Doc | What it already said |
|---|---|
| `pack/35_ACT_V_RESEARCH.md` | Verbatim Skill eleven + DOL highway headings; unused/once table; Doc 29 / presence prereqs. |
| `pack/01_BIBLE.md` §7 | Zone is **The Ribbon** — I-5 / I-90, DOL 4.4 / 5.1 / 5.3 / 5.4. Skill column is WA Skill eleven. Driver column this pass: **Ali**. |
| `pack/08_PSDP_SKILLS.json` | Both Skill eleven headings (verbatim WA PSDP TOC, U+2013). |
| `pack/07_DOL_SECTIONS.json` | `5.1 Speed` + conditions child. This pass adds `4.11 Traffic light signals (Freeway ramp meters)`. |
| `pack/29_QUIET_RENDER_PROBE.md` | Quiet never fill the frame. Herd is the pass (VII). Stubs ship `presence: 0`. |
| `pack/26_THE_QUIET.md` | T4 is not cargo-fail. Thin-net on the kit. |
| `pack/04_card.schema.json` | `presence` canonical. Zone already includes The Ribbon; `location_type` already includes `highway`. |
| `PLAYTHROUGH.md` | Act IV is the live ship. Leave it. |
| `src/game.js` `ACT_ZONES` | Already lists Act V · The Ribbon. Unseeded = not playable. |
| WA PSDP `source/25WAPSDP_LR_v3.pdf` | **Skill eleven: highway driving – part one** (p. 31) / **part two** (p. 32). |
| IV-015 `teaching_target` | Skill thirteen is not on the allowlist (roundabouts → Act VI). |
| IV-030 | Ali, Menace, eastbound; the pass stays closed. Act V takes the freeway, not the pass. |
| `pack/21_THE_MANIFEST.md` + `src/manifest.js` | Act II keeps June / insulin. **Act V** names the relay kit and **Tower 4**. End-of-run closer is the existing beat. |
| `pack/01_BIBLE.md` §3 | Menace lock. Kit rides in the existing Beetle — not a new roof mark. |
| `src/presence.js` | Run-state presence still sums from noise. Card JSON `presence` is authored (0 on this daylight draft). |

Act IV live cards cite **Skill ten: city driving**, not 11–12. The bible’s old Act IV = 11–12 / Act V = 13–14 map was the generic booklet.

---

## Ribbon role

The Ribbon is the limited-access highway after The Core. I-5 south of downtown, then I-90 east only as far as the **valley floor** (Issaquah / the last urban interchanges). The mountain is visible. The pass is not open to this run. Tower 4 is a valley-floor drop, not a pass site.

Ali has the wheel. Nobody else is in the Menace. Yuna talks on the radio. Mya is not loose while rolling. The Menace has an interior mirror — `POV_MIRROR_REAR` is legal if a later card needs it.

Teaching job: enter, travel, and leave a highway at speed without planting the Beetle, pinching a ramp, or yawing at a yank.

---

## Vehicle, load, presence (locked)

**Vehicle** is the Menace as already locked. Yaw is the Beetle. No hitch, no flatbed, no drums. No Ledger this act.

**Load:** relay hardware for **Tower 4** — repeater set, antenna, mast clamps. Fits the existing Menace. Lashed in the back. Not a new roof mark. V-001 / V-002 name it. No insulin. No cooler.

**Live field:** `presence` is canonical. All thirteen stubs ship `presence: 0`. Do not add `load_state`.

**Quiet at seventy:** highway vs lot. The Quiet that work in the lot do not paint on the Ribbon at highway speed. These thirteen stay `presence: 0` and keep Quiet out of `image_brief`. The herd is Act VII.

**Location:** every card is `location_type: highway`. Not `mountain_pass`.

**Light:** daylight on V-001…V-012. **V-013 is dusk** — grade pass over the deck plate (geometry unchanged). Not dusk-as-dark (VII). That is the dusk **card path**. `daylight_fail` does **not** rewrite V-013 into a continuing overrun card.

**Count:** **thirteen cards (V-001…V-013) + the existing end-of-run beat.** V-014 is not a new card.

**Cargo:** `cargo_rough` still bands a **successful** closer (CLEAN / SCUFFED / THINNED). `daylight_fail` is the fail state.

### Clock-out vs `cargo_rough` (`daylight_fail` wins)

| Flag | When | What it does | What it does not do |
|---|---|---|---|
| `daylight_fail` | `time_cost >= 130` | **Ends the run.** It *is* the end-of-run fail state. `fail_kind: daylight`. | Does not force V-013 dusk as a continuing card. Does not become a cargo band. |
| `cargo_rough` | integer (else `yaw`) | CLEAN 0–3 / SCUFFED 4–8 / THINNED 9+ on a **successful** end-of-run beat. Proposed for Claude to lock. | Does not end the run. Does not change V-013. |
| **both set** | — | **`daylight_fail` wins and terminates.** | Do not play a thinned closer. Do not continue V-013. |

---

## Skill eleven teaching targets

### Part one — enter and leave

| PSDP lesson | Target |
|---|---|
| Observation | Name interchanges, highway signs, lane lines; eyes up, not on the bumper. Yuna radios the list. Ali already has the wheel. |
| On-ramp segments | Entrance (search) → acceleration (match flow) → merge (take the gap). |
| Ramp meters | Red = stop on the white line. Green = continue up the on-ramp. |
| Merging | Signal, match speed, check glass and blind spots; do not stop on the ramp unless there is no other choice. If the gap is late, change speed until one appears. |
| Exiting | Pick the exit early. Do not dump speed on the highway. Signal four to six seconds before the ramp. On the ramp, tap the brakes and be at the posted ramp speed before the curve. |

### Part two — travel at speed

| PSDP lesson | Target |
|---|---|
| Steering | Small wheel. Sharp steer at highway speed is yaw. |
| Lane changing | One lane at a time. Move one lane left to make space for a merger when you have it. Move over for a tailgater; do not brake-check. |
| Three-second rule | Same count as Skill six, now for merge / lane change / exit at highway speed. |
| Conditions | Daylight rain is legal (Skill eleven p2 lesson four). Snow, ice, night, the pass → Act VII. |

---

## Beat order (V-001 … V-013 + existing end beat)

| Card | Type | Shot | Lesson one-liner | Skill / DOL |
|---|---|---|---|---|
| V-001 | scene | `POV_COCKPIT` | Yuna on the radio. Eyes up: interchange, signs, paint. | eleven p1 · 4.12 Signs (REVIEW pairing) |
| V-002 | dossier | `POV_PORTRAIT` | Kit named for Tower 4: repeater, antenna, clamps. | n/a |
| V-003 | scene | `POV_DIAGRAM` | A ramp is three pieces. Use each for its job. | eleven p1 · 5.3 Merging (NEW parent) |
| V-004 | rule | `POV_OBJECT` | Ramp meter: red on the white line, green continues. | eleven p1 · 4.11 (Freeway ramp meters) |
| V-005 | scene | `POV_COCKPIT` | Match their speed in the acceleration stretch, then take the gap. | eleven p1 · 5.3 Merging (REVIEW) |
| V-006 | hazard | `POV_COCKPIT` | No gap yet — change speed. Do not plant it. | eleven p1 · 5.3 Merging (REVIEW) |
| V-007 | rule | `POV_OBJECT` | Hold highway speed until the ramp. Signal early. | eleven p1 · 4.12 Signs (REVIEW; exiting is PSDP) |
| V-008 | scene | `POV_COCKPIT` | Posted ramp speed before the curve, not on the freeway. | eleven p1 · 5.1 Speed (conditions) |
| V-009 | scene | `POV_ROADSIDE_PROFILE` | Small hands at speed. A yank is yaw. | eleven p2 · n/a (no DOL heading; do not stretch 5.1) |
| V-010 | rule | `POV_DIAGRAM` | One lane, sit, then the next. | eleven p2 · n/a (no DOL lane-change heading) |
| V-011 | hazard | `POV_MIRROR_DOOR` | Merger on the right — give them a lane if you have one. | eleven p2 · 5.2 Space (not zipper) |
| V-012 | rule | `POV_DIAGRAM` | Count three on the pavement before you take a highway gap. | eleven p2 · 5.4 Time (REVIEW) |
| V-013 | scene | `POV_MIRROR_REAR` | Hollis on the tail — move over. Dusk grade pass. | eleven p2 · 5.2 Space (REVIEW) |
| — | existing end-of-run beat | — | Engine `deliveryBeat` / locked door after V-013. Not a new card. | n/a |

Thirteen stubs. Play order is `seq`. The closer is the beat the game already fires when an act completes.

---

## Explicitly deferred to Act VII

- Snoqualmie Pass, chain-up, snowplow / Gravy, never-pass-a-plow
- Night, deep night, **dusk-as-dark**, fog, ice, heavy snow. V-013 dusk is a grade pass over the deck plate, not VII dark. Not the Quiet herd. `daylight_fail` is a separate fail state — it does not rewrite this card.
- Fatigue microsleep on a long wet pass (the Drift can cameo; the pass cannot)
- Recurring lots at night (bible § visual accumulation)
- Quiet herd (Doc 29 placement)

## Explicitly deferred to Act VI

- Skill twelve: driving on rural roads (gravel, farm equipment, drop-offs)
- Skill thirteen: roundabouts (IV-015 already borrowed city Skill ten for a downtown circle)
- `5.3 Merging (Zipper merging)` — child is now on `pack/07`, unspent. III-026 already taught zipper under the parent. Not a 14th Ribbon card.

## Not a replay of I–III

No lot start, no quiet-street backing, no Central zipper / HOV diamond / two-way left. Those cards stay where they are. Highway versions of merge / three-second are new situations at new speed, not rewritten III copy.

---

## Pack table changes

- `pack/08_PSDP_SKILLS.json` — both Skill eleven headings (PR #132).
- `pack/07_DOL_SECTIONS.json` — `5.1 Speed` + conditions (PR #132); **Freeway ramp meters** child (PR #141); **Zipper merging** child + **5.6 Curves** restored this pass (unspent).
- `pack/36_YUNA_RADIO_VOICE.md` / `pack/37_ACT_V_CITATION_AUDIT.md` — radio voice + citation audit.
- `pack/01_BIBLE.md` §7 — Act V driver **Ali**. §2 yaw line cites Skill eleven part two, not “Skill 13”.
- `scripts/authoring-seat.js` — Act V ego lock is Ali.
- `pack/04_card.schema.json` — optional `presence`.
- `src/manifest.js` — Tower 4 + Yuna radio + thin-net fail. Act II June copy unchanged.
- `pack/35_ACT_V_RESEARCH.md` — research gates.

---

## Closed questions (this pass)

1. **Rain.** Legal as daylight rain (Skill eleven p2 lesson four). V-007 / V-011. Snow/ice/fog/night stay VII.
2. **Ride-along.** III-001 stays the only Deac ride-along. V-001 is a scene: Ali driving, Yuna radio.
3. **Valley floor.** Tower 4 is the named drop. Painted cutoff stays Issaquah / last urban I-90 interchange — not the pass.
4. **Ali as decider.** She has every wheel. No Ledger handoff.
5. **Skill twelve/thirteen.** Wait for VI.
6. **Hollis / Old Ninety.** Hollis once (V-013). Old Ninety parked — no trailer-stop / tire / axle card.
7. **Bible §2 yaw.** Updated to Skill eleven part two.

---

## Production (not this PR)

1. Citation audit is `pack/37_ACT_V_CITATION_AUDIT.md`. Still no pixels from this stack.
2. Muted-read copy packet is `pack/ACT_V_13CARD_MUTED_READ.md`. Text only. No stills. Paste to Claude.
3. Compile stills in one Ribbon batch. Attach **Menace** locks only. No Ledger lock on Ali cards. No Encore in frame.
4. Seed only after a muted-read pass. Never seed from this draft.
