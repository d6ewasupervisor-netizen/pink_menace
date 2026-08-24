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
| 6 | `camera` | 7 tokens | **Never twice in a row.** No token >25% of any act. |
| 7 | `tone` | procedural, tense, quiet, wry, grim, warm, urgent | No repeat within 3 cards |
| 8 | `failure_mode` | 11 values (schema) | Each act must hit ≥4 distinct modes |

**Hard rule across all of it:** the triple `(location_type + weather + time_of_day)` may not repeat within **six** cards. That single constraint is what kills the eighty-sunny-afternoon-intersections problem.

## Additional anti-groove rules

- **Cast spacing.** No recurring cast member appears twice within 4 cards.
- **Opening shape.** No two consecutive cards may open with the same sentence structure. Track the first three words of each scene.
- **Answer position.** The correct option must be uniformly distributed across a/b/c/d. Track the running count; if any position exceeds 35% of cards in an act, force a rebalance.
- **Distractor reuse.** No distractor may be reused verbatim anywhere in the deck.
- **Antagonist spacing.** No antagonist appears in consecutive cards. `none` is a valid and frequent value — not every card needs a monster.

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
| II-001 | dossier | — | — | none |
| II-002 | scene | Skill 5 pt 1 | 4.10 Traffic laws | inexperience |
| II-003 | rule | Skill 5 pt 1 | 4.12 Signs | none |
| II-004 | scene | Skill 5 pt 2 | 4.14 Turning | inexperience |
| II-005 | hazard | Skill 6 | 4.6 Bicyclists | distraction |
| II-006 | convoy | Skill 5 pt 2 | 2.5 Hand signals | passengers |
| II-007 | scene | Skill 6 | 4.2 School buses | speed |
| II-008 | wrench | — | 2.5 Vehicle maintenance | vehicle_failure |
| II-009 | scene | Skill 6 | 5.5 Focus | distraction |
| II-010 | ledger | — | 4.2 School buses | speed |
| ... | | | | |

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
