# VARIATION LEDGER — the anti-monotony engine

Asking a model for "more variety" produces variety for about six cards and then it settles into a groove. Variety has to be a constraint the generator cannot satisfy by trying harder. This is that constraint.

Inject this file plus the running state into every Layer 2 call.

---

## The eight axes

| # | Axis | Values | Rotation rule |
|---|---|---|---|
| 1 | `driver` | ali, deac, yuna | Locked by act, but Act VII rotates every card |
| 2 | `card_type` | scene, hazard, rule, convoy, wrench, ledger, dossier | Never 3 of the same type in a row. ≥1 dossier per 7. |
| 3 | `location_type` | 12 values (schema) | No repeat within 4 cards |
| 4 | `weather` | 8 values | No repeat within 4 cards |
| 5 | `time_of_day` | 7 values | No repeat within 4 cards |
| 6 | `camera` | 9 tokens (`POV_MIRROR_REAR`, `POV_MIRROR_DOOR`, `POV_DIAGRAM`, `POV_TOPDOWN_PHOTO`; never `POV_MIRROR` or `POV_TOPDOWN`) | **Never twice in a row**, except when either card is `camera_is_the_lesson` or ego-seat (`POV_COCKPIT` / `POV_MIRROR_DOOR`). No non-exempt token >25% of the act. **No more than 2 uses of any token in any window of 6** (lesson cameras omitted from the count). |
| 7 | `tone` | procedural, tense, quiet, wry, grim, warm, urgent | No repeat within 3 cards |
| 8 | `failure_mode` | 11 values (schema) | Each act must hit ≥4 distinct modes |

**Hard rule across all of it:** the triple `(location_type + weather + time_of_day)` may not repeat within **six** cards. That single constraint is what kills the eighty-sunny-afternoon-intersections problem.

## Camera cap and clustering (pack/12)

The 25% cap was the wrong anti-monotony guard. A token at 27% spread evenly reads fine; the same token at 15% bunched in one stretch reads terrible.

- A card may set `image_brief.camera_is_the_lesson: true` when the camera position is itself the teaching content (Act II: the three left-arm hand-signal cards on `POV_CHASE`; Act III: III-006 signaling from Deac's cab). Those cards are **exempt from the 25% cap** and excluded from its denominator. Consecutive-token **skips** a pair when either card is a lesson camera or an ego-seat camera (`POV_COCKPIT`, `POV_MIRROR_DOOR`). The seat outranks the consecutive check.
- The 25% cap is computed on **non-exempt cards only**. Do not steal a `POV_MIRROR_REAR` from a hazard-behind card to satisfy a percentage. On Deac there is no `POV_MIRROR_REAR` to steal: hazard-behind is `POV_MIRROR_DOOR`, and the door is the one on the hazard's side.
- Lane law (`read` is lane position, turn geometry, right-of-way, passing, merging, parking, or road markings) is `POV_DIAGRAM`. A photoreal aerial cannot teach lane law.
- Replacing the cap as the real guard: **no more than 2 uses of any token in any window of 6 cards.** Lesson-camera cards occupy a slot in that window but are omitted from the token count — otherwise a required camera would force a neighboring card off the shot the lesson needs. `npm run validate-cards` enforces both checks.

## Identity exposure (pack/12)

Identity only has to be consistent where identity is visible. Face-critical frames (`POV_PORTRAIT`, close `POV_ROADSIDE`) are **≤ 10% of an act** — three cards in thirty — eight takes, hand-curate one. Vehicle-critical (`POV_CHASE`, distant roadside, `POV_TOPDOWN_PHOTO`) ≤ 25%, four takes, feature checklist mandatory. Everything else is cockpit, mirror, object, or `POV_DIAGRAM`: one or two takes, because there is nothing to drift.

Do not fight attachment into identity lock card by card. There is no finish line.

## Additional anti-groove rules

- **Cast spacing.** No recurring cast member appears twice within 4 cards.
- **Opening shape.** No two consecutive cards may open with the same sentence structure. Track the first three words of each scene.
- **Answer position.** The correct option must be uniformly distributed across a/b/c/d. Track the running count; if any position exceeds 35% of cards in an act, force a rebalance.
- **Distractor reuse.** No distractor may be reused verbatim anywhere in the deck.
- **Antagonist spacing.** No antagonist appears in consecutive cards. `none` is a valid and frequent value — not every card needs a monster.
- **Debrief close.** Cap the "X is not Y" construction at **one in five** debriefs in an act. Track `act_x_is_not_y` in ledger state. Cap all aphoristic closers at one per five cards (`act_aphorism`). Rotate the last sentence among: consequence, named person, plain imperative, concrete image. Do not repeat a close-shape in the previous three. Voice authority: `23_THE_SPOKEN_DICTIONARY.md` §5.
- **Metaphor families.** Grammar, music, and weather-as-mood metaphors may appear at most **twice per act**. Track `act_metaphor_families`.

## Ledger state object

Pass this into every generation. Update it after every card.

```json
{
  "cards_written": 13,
  "current_act": "II",
  "recent": [
    {
      "card_id": "II-013",
      "card_type": "rule",
      "camera": "POV_OBJECT",
      "location_type": "residential",
      "weather": "rain",
      "time_of_day": "afternoon",
      "tone": "procedural",
      "failure_mode": "inexperience",
      "cast": ["ali", "marisol"],
      "antagonist": "none",
      "opening_words": "The rain has"
    }
  ],
  "act_camera_counts": { "POV_COCKPIT": 4, "POV_MIRROR": 2, "POV_TOPDOWN": 3, "POV_OBJECT": 2, "POV_ROADSIDE": 1, "POV_CHASE": 1, "POV_PORTRAIT": 0 },
  "act_answer_positions": { "a": 3, "b": 4, "c": 4, "d": 2 },
  "act_failure_modes_hit": ["inexperience", "distraction", "speed"],
  "act_x_is_not_y": 2,
  "act_debrief_close_shapes": ["named_person", "imperative", "image"],
  "act_metaphor_families": { "grammar": 0, "music": 0, "weather_as_mood": 1 },
  "cast_last_seen": { "marisol": 13, "reyna_solis": 9, "hollis": 6 },
  "used_distractors": ["Flash your high beams to warn them", "..."],
  "pending_callbacks": [
    { "from_card": "II-007", "act": "II", "cast": ["reyna_solis", "tobin"], "location": "Kent, 4th Ave S at Willis", "weather": "rain", "miss": "passed Bus 12 on amber" }
  ]
}
```

`recent` holds the last 8 entries. Trim as you go — the generator only needs the window the rules reference.

## Slot planning

Do not let the generator choose slots. Build the slot list up front from the Zone Map in bible §7, then walk it in order. A suggested Act II spread (28 cards):

| Slot | Type | PSDP | DOL | Failure mode |
|---|---|---|---|---|
| II-001 | dossier | n/a | n/a | none |
| II-002 | scene | Skill five: driving on a quiet street – part one | 4.17 Zones (School zone) | inexperience |
| II-003 | rule | Skill five: driving on a quiet street – part one | 4.12 Signs | none |
| II-004 | scene | Skill five: driving on a quiet street – part two | 4.14 Turning | inexperience |
| II-005 | hazard | Skill six: looking ahead | 4.6 Sharing with bicyclists | distraction |
| II-006 | convoy | Skill five: driving on a quiet street – part two | 2.5 Vehicle Maintenance (Hand signals) | passengers |
| II-007 | scene | Skill six: looking ahead | 4.2 Sharing with school buses | speed |
| II-008 | wrench | n/a | 2.5 Vehicle Maintenance | vehicle_failure |
| II-009 | scene | Skill six: looking ahead | 5.5 Focus | distraction |
| II-010 | ledger | Skill six: looking ahead | 4.2 Sharing with school buses | speed |
| ... | | | | |

Headings must be copied verbatim from pack/07_DOL_SECTIONS.json and pack/08_PSDP_SKILLS.json. Never invent a subtitle. Act II play order inserts II-029 / II-030 (Skill seven: turning around) between II-020 and II-021 by `seq` without renaming the earlier IDs.

Ten minutes building this table saves you from a deck that teaches right turns eleven times and roundabouts never.

## Coverage audit

After generation, run a coverage check before you build anything:

- Every PSDP skill (1 through 14, plus rural, roundabouts, other conditions) has ≥3 cards
- Every DOL chapter (1–5) is represented
- No `dol_section` has >8 cards
- Every antagonist A1–A7 appears in ≥4 cards
- Every recurring cast member appears in ≥3 cards
- Dossier cards are ≥12% of the deck
- Fatal outcomes are ≤5% of all option outcomes — if death is common it stops meaning anything

That audit is also your licensing artifact. A CSV of card_id → psdp_skill → dol_section is exactly what a driver training school's curriculum coordinator will ask for.
