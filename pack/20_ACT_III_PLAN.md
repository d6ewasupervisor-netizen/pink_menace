# 20 — ACT III: THE ARTERIAL

Playtest verdict: "it's okay, tired of the same stage." The complaint moved from quality to quantity — the content gate is cleared. Two workstreams: fix the fail-loop grind (§A, small, Cursor), and write Act III (§B–D, the generation pipeline at full strength).

---

# §A — RECAP-AND-RETRY (fix the grind we shipped)

The run-fail checkpoint currently replays five cards whose answers the player already knows. That converts failure into data entry.

**New restart behavior:**
- Cards answered **correctly** in any prior run replay as auto-beats: image + hook + her recorded answer highlighted, ~2s each, tap to skip, no interaction. The run economy (cargo, presence) still accrues their state deltas as originally earned.
- Cards **missed or timed out** re-ask fresh (new attempt_no, new run row).
- Ledger callback debts persist across the restart — a debt is not erased by dying.
- Parent-facing first-try accuracy remains keyed to each card's first-ever attempt. Unchanged.
- Never auto-beat a card the player has never answered.

Failure becomes: fast-forward through what you know, second look at what you don't. Tedium out, pedagogy in.

Also, while in there: when an **act is fully complete**, "play again" must not silently loop the act. Completed act → cliffhanger card → locked door for Act III with its title visible. A visible locked door says "more is coming"; a silent loop says "this is all there is."

---

# §B — WHY ACT III WON'T FEEL LIKE "THE SAME STAGE"

Everything below is already designed and paid for; Act III is where it deploys.

| Axis | Act II | Act III |
|---|---|---|
| Driver | Ali | **Deac** — first driver swap of the game. She meets him here; Act II she drove alone (pack/28). |
| Vehicle / cockpit | Menace: light, quick, fragile | **The Ledger**: heavy, slow, huge blind zones, high seat, west-coast mirrors |
| Accent | Cranberry | **Transit amber** — UI, meters, timer ring all change color |
| Weakness / antagonist | Speed / the Splitter | **Fatigue / The Drift** — input-lag pressure, a different kind of dread |
| Zone | Residential Grid | **Central** — multi-lane, speed, merging traffic |
| Signature mechanic | Noise discipline | **Mirrors and blind zones** — the Ledger can't see what the Menace could |
| Opening | Cold start | **Ride-along debut** (watch layer §1): Deac drives the first three cards, talks, makes one deliberate mistake, hands over the wheel |
| New faces | — | **Old Ninety** (the rogue semi, no-zones) debuts; Hollis recurs at speed on Central |

The ride-along opening is deliberately placed here: new driver = the natural demonstrate-first moment, and it's her mode.

**The Drift, mechanically:** Deac's fatigue is not a lecture — it's pressure. As the run lengthens, timed windows shrink slightly and the vignette breathes on long straights. Two clean stops (his thermos beats) reset it. The player *manages* his weakness the way Act II managed noise.

---

# §C — SLOT TABLE (30 slots)

Driver: `deac` throughout. Zone: `Central`. PSDP anchor: **Skill nine: multi-lane roads** (verbatim from the guide). DOL sections marked **[V]** are already in `pack/07_DOL_SECTIONS.json` from the Act II patch; sections marked **[VERIFY]** must be exact-matched against the guide TOC before seeding — the validator will reject them otherwise, which is the system working.

| Slot | Type | Teaching target | Source anchor | Fail mode | Cast/notes |
|---|---|---|---|---|---|
| III-001 | ride-along | Deac demonstrates: mirror sweep, lane hold, one deliberate late merge + consequence | Skill nine | none | Watch-layer debut; ends "Your wheel." |
| III-002 | dossier | The Ledger's cab: the log, the thermos. Mya on the dash only if parked | — | none | Parked idle. Clipboard on the doghouse, never in the glass. |
| III-003 | scene | Choosing a lane: through traffic keeps right except to pass | 4.10 Traffic laws [V] | inexperience | First live card |
| III-004 | scene | Mirror sweep cadence + the Ledger's blind zones | 5.5 Focus [V] | fatigue | POV_MIRROR_DOOR |
| III-005 | hazard | Vehicle in the right-side blind spot during a lane change | 5.2 Space [V] | inexperience | Timed; timeout = drift into them checked by the convex mirror |
| III-006 | convoy | Signal early: signal distance before a lane change | 2.5 Vehicle Maintenance (Turn signals) [V] | none | Amber language card |
| III-007 | scene | The gap you accept: minimum safe gap to merge into | 5.2 Space [V] | inexperience | |
| III-008 | rule | Lane markings on a multi-lane: white broken vs solid white | 4.16 Road markings [V] | none | POV_OBJECT |
| III-009 | hazard | Hollis tailgating at speed on Central — increase YOUR front gap | 5.2 Space [V] | speed | Hollis recurs; six-second echo |
| III-010 | ledger | Callback slot (armed by III-005 or III-009 miss) | — | — | Same street, same weather |
| III-011 | scene | Old Ninety debuts: the no-zones of a large truck | Sharing with trucks [VERIFY] | inexperience | Overhead: you're beside his trailer. He can't see you here. Never POV_MIRROR_REAR on the Ledger. |
| III-012 | rule | Never linger beside a truck; pass and clear | Sharing with trucks [VERIFY] | none | POV_DIAGRAM |
| III-013 | dossier | Deac beat: 26 years, never a preventable; what the schedule means now | — | none | |
| III-014 | scene | Left turn types: protected green arrow vs permissive circular green | Traffic light signals [VERIFY] | inexperience | POV_COCKPIT high seat |
| III-015 | scene | Two-way left-turn lane: enter only to turn, never to travel | 4.16 Road markings [V] | inexperience | POV_DIAGRAM; pairs with II-004's pocket |
| III-016 | hazard | Fatigue microsleep: lane drift on a long straight | 3.1 [VERIFY — fatigue/drowsy heading] | fatigue | The Drift debuts as mechanic; timeout = the drift itself |
| III-017 | wrench | Convex mirror knocked out of alignment; what the Ledger now cannot see | 2.5 Vehicle Maintenance [V] | vehicle_failure | |
| III-018 | scene | Passing on a multi-lane: complete the pass, clear, return with the full vehicle in mirror | Skill nine | speed | |
| III-019 | convoy | The destination sign: telling the column behind what's coming | 2.5 (Hand signals) [V] | passengers | Rear sign canon card |
| III-020 | ledger | Callback slot (armed by III-014/III-016 miss) | — | — | |
| III-021 | scene | Transit stop: bus pulling out, yield to the merging bus | Sharing with transit [VERIFY] | inexperience | Reyna cameo off-route |
| III-022 | hazard | Emergency vehicle behind in traffic: move right, stop | 5.10 / emergency vehicles [VERIFY] | distraction | Officer Dunn debuts; siren = audio-first cue |
| III-023 | rule | HOV / restricted lane markings | 4.16 Road markings [V] | none | POV_OBJECT |
| III-024 | scene | Speed for conditions vs posted: rain at speed on Central | 5.6 Road and driving conditions [V] | weather | Six-second rule restated at speed |
| III-025 | dossier | The Drift, named: what Deac sees at the edge of his vision | — | none | Presence-tier T1 baked into the art |
| III-026 | scene | Blocked lane ahead: early merge vs late merge, and why the zipper exists | Skill nine [+ VERIFY merge heading] | inexperience | POV_DIAGRAM |
| III-027 | hazard | The Chorus at speed: screen lights up mid-lane-change | 5.5 Focus [V] | distraction | Callback to II-009's tablet |
| III-028 | wrench | Fuel discipline: the Central detour math | — | vehicle_failure | Cargo-clock pressure card |
| III-029 | scene | Choosing when NOT to pass: the pass that gains nothing | Skill nine | speed | Deac's thesis card |
| III-030 | cliffhanger/dossier | The Core visible ahead; downtown skyline; act out on a presence image | — | none | Locked door to Act IV; Yuna teased on the radio |

Distribution check against the ledger: 12 scene, 5 hazard, 3 rule, 3 convoy, 2 wrench, 2 ledger, 4 dossier/ride-along/cliffhanger — dossier-class ≥13%, no type 3-in-a-row when sequenced as numbered, ≥4 distinct failure modes (inexperience, fatigue, speed, distraction, weather, vehicle_failure). Camera spread to be enforced by the ledger at generation, with the two blind-zone cards declaring `camera_is_the_lesson` on their mirrors.

---

# §D — PRODUCTION ORDER

1. **§A ships first.** It's small, it fixes the live complaint, and it must exist before Act III lands or the same grind meets her at the first Act III fail.
2. Verify the [VERIFY] section headings against the guide TOC, add to `07_DOL_SECTIONS.json`. Never card an unverified heading — the validator enforces it, let it.
3. Generate III-001's ride-along script by hand (12–15 commentary lines, Deac's dispatch cadence, one deliberate mistake — the late merge — played to consequence).
4. Generate III-002 → III-030 through Layer 2 in slot order with ledger state, exactly the Act II process — hooks and timeout options are schema fields now, so they generate rather than retrofit.
5. Human citation audit before any image (the II-016/II-022 rule: text before pixels).
6. Compile art in one batch: attach Deac + Ledger locks, muted human read on every frame, geometry validator on every road brief.
7. Seed behind the locked door. She discovers Act III exists by finishing Act II — the locked door with a title is the announcement.

The Act II pipeline cost weeks because every rule was found by failing. Act III inherits all of it: citation validator, geometry block, camera derivation, mirror sub-tokens, sign-facing rule, no-detached-limbs, drive-side clause, rhetoric caps, muted-read gate. This act is where the system pays for itself — budget days, not weeks.
