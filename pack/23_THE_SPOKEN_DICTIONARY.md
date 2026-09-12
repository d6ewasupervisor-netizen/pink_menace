# 23 — THE SPOKEN DICTIONARY

Authority for the Americanization pass. Cards, chrome, barks, manifest, ride-along, compile prompts, and the bible all draw from this file. Fix the cards alone and the next compile writes the old words straight back in.

**The test, applied to every word:** not *"is this common?"* but **"can she tell what it means from the sentence she's reading?"** Convex fails. *The big mirror on his door* passes. Keep the shop talk where context carries it; kill it wherever the correct answer depends on knowing it.

---

## 1. HARD SWAPS — always, everywhere

| We wrote | Say | Notes |
|---|---|---|
| convex / convexes | **side mirror**, the big mirror, the right mirror | Every instance. Titles too. |
| flat glass | **the inside mirror**, the regular mirror | Ali only. The Ledger has no interior mirror — Deac cards say the left door mirror, never "the inside mirror." |
| mill / millings / mill-and-fill | **work zone**, torn-up road, *they're grinding it* | See §4 — II-023 is a content fix, not a word fix |
| collector | **side street**, two-lane, neighborhood street | |
| arterial | **the main road**, the four-lane, Central | Zone rename in §3 |
| queue / queued | **line up**, wait behind, get in line | British |
| the room / right-side room | **blind spot** | Nickname OK once established (§2); never in an option or a title |
| skirting | **the side of the bus** | |
| knobbies | **tires** | |
| the well | **the floor**, next to the seat | |
| paddle | **cone** | |
| the dual | **the right rear tire** | |
| hole (a gap) | **gap**, opening | 20+ instances |
| the Ejection | **the belt**, thrown out | Keep the antagonist's mechanical role; lose the proper noun in player copy |
| "Skill nine" | *(cut)* | Citations stay in JSON internals; never printed |

## 2. KEEP — this is character, not jargon

Deac is a 26-year transit operator. Strip his vocabulary and he becomes a driving manual with a name. **Keep these when the sentence carries the meaning:**

- **west-coast mirror** — allowed as *"the big west-coast mirror on his door."* Bare "west-coast glass" is not.
- **doghouse** — allowed as *"the doghouse between the seats."* Never as a bare location.
- **cadence**, **the schedule**, **the log** — his idiom, all plain English.
- **blind spot as "the room"** — allowed *after* one card has said blind spot plainly, and never as the hinge of a correct answer. III-005's title is the jargon and must change.

Also keep: the Ledger, the Menace, Ali, Deac, Yuna, Gracie, Mya, **The Grid** (a place, not a road class), **The Quiet**, COLD / WARMING, and *pavement* in the three-second following line — that phrasing is real US driver ed.

**Ledger rear vision (hard, same ratchet as §1):** the cargo box is plate steel. No rear window, no interior mirror. Never print "rear glass," "rearview," "interior mirror," "the center mirror," or "the inside mirror" on a Deac card. The side mirrors are the only rearward vision. A look behind is the left door mirror, or it is a wall.

## 3. ACT III RENAME — Central

"The Arterial" is a traffic engineer's road classification, and it sits on the locked door, the clipboard, and eleven cards.

**Act III is now `Central`.** It's an actual Kent street, it's what a person would say, and it makes the act's name a *place* the way The Grid is. Change in: `src/game.js` ACT_ZONES, the home act list, the manifest clipboard line, every card's `zone`, and the Act IV cliffhanger copy.

## 4. II-023 IS A CONTENT FIX, NOT A WORD FIX

The Act II audit re-set this card's location to a rock cut (L-006), but the copy still calls it a mill and `src/manifest.js` still names `FAIL_PLACE = "the mill"`. So the text says mill, the frame shows a mountain cut, and the failure screen names a place that doesn't exist.

Rewrite the card to the location it actually has — a slide cut, one lane, crew and cones — and set the fail place to match. Title "Do Not Block the Mill" goes with it.

## 5. THE CLOSER RULE — the tonal fix no dictionary makes

The deeper problem isn't nouns. It's that nearly every debrief and bark ends on a *written line*: **the Ejection is a statistic with a buckle · time is a lane · streets that think they are arterials · the mill keeps being a mill.** That is the MFA-not-Kent voice, and swapping words won't touch it.

Extend the existing "X is not Y" cap to **all** closers:

- **No more than one aphoristic closer per five cards**, tracked in ledger state alongside the existing shape counter.
- The last sentence of a debrief rotates among: a consequence, a named person, a plain imperative, a concrete image. Track the previous three; never repeat a shape twice running.
- **No metaphor where a plain statement works.** "Time is a lane" → *"You lost four minutes."* The clock is visible now; let it do the talking.
- Barks stay short and spoken. *"Cadence, Kilo"* and *"Paint's still paint"* are lines nobody says out loud — cut them.

## 6. AUTHOR LAYER — same pass, or it returns

| File | Fix |
|---|---|
| `scripts/compile-prompt.js` | "oversize convex west-coast mirrors" → "oversize side mirrors on long arms" |
| `pack/01_BIBLE.md` §3.2, §8 | same silhouette-lock language |
| `pack/12_IDENTITY_AND_CAMERA_POLICY.md` | same |
| `pack/22_III_001_RIDE_ALONG.md` | line 11 "The convex." → "The side mirror." |
| every `image_brief` | convex / mill-and-fill / arterial / west-coast |
| `src/manifest.js` | `FAIL_PLACE` II-023 |
| `src/game.js` | ACT_ZONES III |
| `pack/02_CARD_GENERATOR_PROMPT.md` | add: "Voice follows `23_THE_SPOKEN_DICTIONARY.md`. Never use a word from its swap column." |

Compile prompts describing **physical build** may keep precise shape language where it aids the render — the constraint is on *player-facing copy*. But drop "convex" even there; "oversize side mirrors on long arms" renders the same and keeps one vocabulary across the project.

## 7. ORDER

1. This file lands in the pack; generator prompt points at it.
2. Act III rename → Central, everywhere.
3. Player-facing rewrite on all **59** cards in one pass — hooks, scenes, decisions, options, results, debriefs, titles. Not just the 34 with hard nouns: the other 25 share the voice, and a split pass comes out half-British.
4. Chrome: home, cast lines, barks, manifest, fail places, reward toasts, ride-along line 11.
5. Author layer per §6.
6. Validator addition: reject any card whose player-facing fields contain a swap-column word.
7. **Read it on the handset, cold, from card one, before she sees it.**

## 8. THE STANDING RULE

Every player-facing line has to survive being read aloud by a sixteen-year-old in Kent without her stopping to wonder what a word means. If she'd stop, it's wrong — no matter how correct, how technical, or how well it scans.

## 9. ACT V YUNA RADIO

This file stays the Americanization pass. Act V radio voice — who speaks, how many times, how the channel thins — is `pack/36_YUNA_RADIO_VOICE.md`.

Yuna is never seen and never in the car on the Ribbon. Four appearances only. No line blames her. Swap-column words still fail on those lines.
