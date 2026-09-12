# 36 — YUNA RADIO VOICE (Act V)

Copy authority for Yuna on the radio in Act V. **Not a stills job.** Do not regenerate stills. Do not seed.

Claude lock from the primary Pink Menace chat (“YUNA — RADIO VOICE RULES”). Encode as written. Do not invent new policy. Do not mint a fifth appearance, a fourth band, or a synonym for the engine states.

Americanization stays `pack/23_THE_SPOKEN_DICTIONARY.md`. This file is who speaks, how often, and how the channel thins.

---

## Sister docs

| Doc | Job |
|---|---|
| `pack/34_ACT_V.md` | Beat skeleton (PR #132 / #141 stack). Points here. |
| `pack/35_ACT_V_RESEARCH.md` | Research gates + reseat locks (PR #141). Points here. |
| `pack/37_ACT_V_CITATION_AUDIT.md` | Citation audit. Does not change these four appearances. |
| `pack/ACT_V_13CARD_MUTED_READ.md` | 13-card player copy for Claude text review. V-013 one schedule-dusk scene. |
| `pack/21_THE_MANIFEST.md` | Manifest, mid-run radio, end-of-run beat. Act II Reyna lines stay there. |
| `pack/23_THE_SPOKEN_DICTIONARY.md` | Swap column. Player copy never says “Skill eleven.” |
| `pack/01_BIBLE.md` §3.3 | Yuna the person (Encore, in-ears, reflectivity). This file is Act V channel only. |
| `pack/26_THE_QUIET.md` / `pack/29_QUIET_RENDER_PROBE.md` | Presence canonical. T4 is not cargo-fail. Quiet herd is VII. |
| `scripts/validate-act-v.js` | On the #141 stack: rejects Yuna / Encore in the still; Ali / Menace ego. |

**One-liner (already in pack/34 and pack/35):**

> Yuna radio voice (four appearances; `cargo_rough` bands a successful end beat; `daylight_fail` ends the run and wins when both are set): `pack/36_YUNA_RADIO_VOICE.md`.

---

## Standing locks (do not contradict)

These are the same Act V locks as pack/35. This file does not reopen them.

- **Ali alone on the Ribbon.** She has every wheel. Nobody else is in the Menace.
- **Yuna is never seen and never in the car (Act V).** Radio-only. Cast may list `yuna`. She is not in the still. Encore is not in frame.
- **Load = relay hardware for Tower 4** — repeater, antenna, clamps. Lashed in the back. Not a new roof mark.
- **`presence` is canonical.** Daylight stubs ship `presence: 0`.
- **No Acts I–III replay.** No lot start, no quiet-street backing, no Central zipper / HOV diamond / two-way left.
- **Chains / Snoqualmie = Act VII.** No chain-up, snow, ice, fog, night, Gravy, mountain pass on a Ribbon teaching card.

---

## Appearances — four, locked

Yuna speaks on **four** Act V beats. Not a fifth.

| # | Beat | What the draft already locked |
|---|---|---|
| 1 | **V-001** | Full check-in. She is on the handheld. She will not be here. |
| 2 | **V-004 result** | The appearance is the **result**. Not a second driver. Not a meter lecture. |
| 3 | **V-011** | A radio beat on the highway zipper card. |
| 4 | **the end beat** | Existing `deliveryBeat` / `radioCheckin` — not a new V-014. |

V-007 on the #141 stubs already states the negative: *“Yuna does not come back on for this.”* That is not an appearance. Do not add her to V-002…V-003, V-005…V-010, V-012, or V-013.

---

## Channel bands — `cargo_rough`

Three bands. No fourth. Do not rename them.

Thresholds locked this pass. Cut points reuse presence T0 / T1 edges (`src/presence.js`, `pack/26` §2 / Doc 29 overlay cadence) so a sloppy run scuffs the kit on the same count the Quiet appear. T4 collapse (23) stays Quiet, not cargo-fail.

`cargo_rough` is a run-state integer. If the field is missing, read accumulated `yaw` (bible §2 — the Ribbon "rough" meter). Light / noise stay on `presence`.

| Band | `cargo_rough` | Channel |
|---|---|---|
| **CLEAN** | **0–3** | Full check-in. |
| **SCUFFED** | **4–8** | Shorter. Still hers. |
| **THINNED** | **9+** | Quietest, not harshest. Hardware thinned the relay. |

`src/cargo-rough.js` is the helper.

**`daylight_fail`** (`time_cost >= 130`, same budget as `COLD_PACK`): **ends the run.** It is the end-of-run fail state. It does **not** force V-013 and does **not** push the player onto that card. V-013 dusk is the on-schedule grade-pass only.

**If both `cargo_rough` and `daylight_fail` are set:** `daylight_fail` **wins and terminates.** Do not play a THINNED closer. She does not speak a fail closer that blames her.

- She **never mentions cargo condition.**
- She **never grades the driving.**
- Degraded relay hardware makes the **channel** thin. That is the hardware, not her mood and not the kit’s grade in her mouth.
- **Cursor / writer rule:** no line blames Yuna.
- The **thinned** version is **quietest, not harshest.**

Do not write a line where she sounds angry because the band is THINNED. Do not write a line where she scolds Ali for scuffing the load. Do not write a line that treats a thin channel as her failing the radio.

---

## Engine state names (already locked elsewhere)

Do not mint synonyms. Do not print these names on a card face.

| State | |
|---|---|
| `cargo_rough` | Selects the CLEAN / SCUFFED / THINNED band. |
| `daylight_fail` | Clock-out. Ends the run. Wins when both flags are set. |

**If both are set:** `daylight_fail` wins and terminates. Do not blend a cargo-band closer into the fail.

---

## Locked wording from the Act V draft cards

Quotes only. Do not regenerate the cards in this file. Do not “improve” them here. When a later pass writes the V-004 result / V-011 radio line / end-beat variants, stay inside this voice and these quotes.

### V-001 — she will not be here

From `cards/V-001.json` on the #141 stack:

- Hook: *“Yuna on the radio. The highway starts.”*
- Scene: *“You have the wheel of the Menace. Nobody else is in the car. […] The handheld on the floor crackles: Yuna. She will not be here. She wants the interchange, the green panels, and the paint named before you spend the ramp.”*
- Decision: *“Where do your eyes go on the approach?”*
- Correct result: *“You call the stack, the green boards, and the skip-dash. She clicks once.”*
- Wrong result (c): *“The radio is a check, not a second driver. You missed a panel waiting for a voice that will not sit in this seat.”*
- Debrief: *“Interchange, signs, paint — eyes up, not on the bumper.”*
- Teaching target: *“Ali already has the wheel; Yuna is radio-only.”*
- Still: handheld on the floor; **no second person / no second occupant.** She is not in the glass.

### V-004 result — she clicks; the white line teaches

The locked appearance is the **result**. Scene may still name the click; the result is the lock.

- Scene: *“Yuna clicks once and does not explain the rest. The kit in the back does not care if you roll a red here. The white line does.”*
- Correct result (this audit): *“She clicks once. […] The white line did the teaching.”*

That click is the voice: short, not a lecture, not a grade. The meter rule stays on the white line. Do not move her into the still (`POV_OBJECT` is the signal and the line). Cast may list `yuna`.

### V-011 — zipper card; radio beat

The appearance lock is on this card. Citation audit copy (do not put her in the still):

- Hook: *“The right dies. Both lanes still run.”*
- Scene: *“The zipper wants both lanes used until the teeth, then one-for-one. […] The handheld clicks once — Yuna, short, not a lecture.”*
- Correct result: *“You use the lane until it ends. At the teeth you take one, give one. […] She clicks once and stays quiet.”*
- Debrief: *“Use both lanes until the closure, then take turns.”*
- Cast: `["ali", "yuna"]`

She does not grade the driving. She does not mention cargo condition. If the channel is THINNED, she is quieter, not harsher.

### End beat — existing closer, not a new card

From `src/manifest.js` / `pack/21_THE_MANIFEST.md` on the #141 stack. Radio voice is **Yuna**. Thin-net: late still delivers.

Mid-run radio (`radioCheckin`, act `V`):

> *Tower 4, checking. How far out?*

> *The relay kit is late. Tower 4 still wants it. How far out?*

`deliveryBeat` (act `V`):

> *Relay kit delivered. Repeater, antenna, clamps. Tower 4. N minutes to spare.*

> *Relay kit delivered. N minutes. Repeater, antenna, clamps. Tower 4.*

> *The relay kit is late. Repeater, antenna, clamps. Tower 4 still takes it.*

Fail dispatch stays thin-net (*“The kit is late. Tower 4 still takes it.”*). Do not write “the kit sat” / “tomorrow.” Do not hand these lines to Reyna. Do not put Yuna at the door.

---

## Prior tease (not an Act V appearance)

III-030 already put her on the radio as a voice, not a face:

> *“The radio, which has been trash for two acts, carries a young voice — a count-in, then a laugh, then static. Yuna, not yet a face.”*

That is Act III’s cliffhanger. It does not add a fifth Act V beat and it does not put her in the Menace.

---

## Writer checklist

1. Is this V-001, a V-004 **result**, V-011, or the existing end beat? If not, she does not speak.
2. Is she in the still, in the car, or in Encore? Stop. Radio only.
3. Does the line mention cargo condition or grade the driving? Cut it.
4. Does the line blame Yuna for a thin channel? Cut it. Hardware thinned the relay. She is quieter.
5. If `daylight_fail` is set, the run ends. Do not write V-013 as a continuing dusk-force card and do not push the player onto it. Do not blend a fail closer into a cargo band. She does not speak on the fail.
6. Swap-column words still fail (`pack/23`). “hole” is gap. Never print “Skill eleven.”
7. No I–III replay language. No chains / Snoqualmie / pass.
8. Do not seed. Do not regenerate stills from this file.
