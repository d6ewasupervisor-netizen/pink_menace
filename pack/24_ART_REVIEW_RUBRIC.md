# 24 — ART REVIEW RUBRIC

For the review tool. The goal is that a note leaves the screen as a **work order**, not an impression. "Confusing and misdirecting" is a true reaction and an unactionable ticket — Cursor cannot fix it, and the next generation makes the same mistake.

---

## 1. THE ORDER — text before pixels, every card

Check in this sequence and **stop at the first failure.** Most bad frames are downstream of a bad card, and regenerating art on a broken card is wasted money.

**A. Is the card coherent?** Read scene → decision → correct option → read → geometry, and ask whether they describe one situation. III-011 failed here: the scene puts the truck ahead-right, the geometry puts it behind, and the camera shows neither. No image can satisfy a self-contradictory brief.

**B. Is the camera capable of the read?** Can the specified camera physically show the thing the card turns on? A forward camera cannot show a following vehicle. A rearview cannot show a truck you are overtaking. Relative position of two vehicles is geometry and wants an overhead. **On Deac, `POV_MIRROR_REAR` is always `WRONG_CAMERA`** — the Ledger is a cutaway with a plate-steel cargo box: no rear window, no interior mirror. Hazard behind resolves to `POV_MIRROR_DOOR`.

**C. Does the frame execute the brief?** Only now judge the pixels: is the subject present, is the read legible muted, is the geometry right, is anything invented.

**D. Does it look good?** Last, and least. A frame that teaches and looks plain beats a beautiful one that doesn't.

## 2. VERDICT TAGS — pick one, not prose

Replace the free-text note with a required tag plus an optional line. The tag routes the work; the line adds detail.

| Tag | Means | Who fixes | Cost |
|---|---|---|---|
| `PASS` | Teaches muted, geometry correct | — | — |
| `CARD_BROKEN` | Scene / decision / read / geometry contradict each other | Writer, then compiler | Rewrite + recompile |
| `WRONG_CAMERA` | Camera cannot show the read | Writer changes token | Recompile |
| `READ_MISSING` | Brief is fine; the subject didn't render | Compiler — **after** the `read` is a static photographable fact | Recompile. If the read is a process or a mood, rewrite it first (writer). |
| `GEOMETRY_WRONG` | Wrong lane, wrong facing, wrong side, ego confusion | Compiler | Recompile with geometry clause |
| `CANON_DRIFT` | Off-model vehicle, character, or a lookalike vehicle | Compiler | Recompile with locks attached |
| `INVENTED` | Object in frame the brief didn't ask for | Compiler | Recompile |
| `COPY` | Art fine, wording unclear / jargon / aphorism | Writer | Text-only, no recompile |
| `STYLE` | Teaches correctly, looks weak | Optional | Lowest priority |

**`CARD_BROKEN` and `WRONG_CAMERA` must never be sent to image generation.** They go back to the writer first. That single routing rule is most of the money this tool saves.

## 3. THE MUTED READ — the one test that decides PASS

Cover the text. Ask: **what does this picture teach?** If the answer isn't the card's `read`, it fails, however good it looks.

Three questions, in order:

1. Whose seat am I in, and is that vehicle the act's driver's vehicle?
2. Where is the hazard — ahead, behind, beside, oncoming — and does the camera agree?
3. Is the one fact the decision turns on unmistakable at phone size?

## 4. REVIEW AT PHONE SIZE

The review pane shows the still large. **Add a phone-width toggle (390px) and judge there.** Half of what looks wrong at full size vanishes, and half of what reads fine at full size disappears at 390px. The card is only ever seen small.

## 5. WHAT THE COUNTER SHOULD SAY

`0 pass · 1 fix · 28 open` treats every fix as equal work. Split it by tag so the queue shows what it actually costs:

> `3 pass · 2 rewrite · 6 camera · 13 recompile · 4 copy · 0 style · 0 open`

`WRONG_CAMERA` is **camera**, not recompile. It is writer-first. Counting it as recompile is how 13 generation tickets look like 20.

Rewrites and camera changes are the expensive ones and should be visible as their own numbers.

## 6. BATCHING

Review all 29 before fixing any. Two reasons: fixes cluster (one compiler rule usually clears several `GEOMETRY_WRONG` at once), and reviewing after fixing means re-reviewing. Tag the whole act, then group by tag, then fix by group.

## 7. WORKED EXAMPLE — III-011

**Tag: `CARD_BROKEN`** (not `STYLE`, not `READ_MISSING`).

- Scene puts Old Ninety ahead-right; geometry says beside-and-behind; camera is `POV_MIRROR_REAR`. Three different situations.
- His mirrors are the subject of the card and are absent from the frame.
- Hook is elliptical: *"If you cannot see his mirrors, he cannot."* Cannot what.
- *"Nowhere wants you first"* — aphoristic closer; §5 didn't reach Act III.

**Fix:** rewrite geometry to match the scene (truck ahead-right, same direction, ego overtaking in the left lane), change camera to an overhead, rewrite the hook plainly — *"You're beside his trailer. He can't see you here."* Then recompile:

> [style + LHD clause] Elevated overhead, angled about twenty degrees off vertical, looking down a wet two-lane northbound highway. In the right lane, a semi tractor-trailer traveling away from camera. In the left lane, alongside the rear half of its trailer, an ex-transit cutaway shuttle bus, also traveling away from camera. The tractor's door mirror is visible far forward on its cab, clearly many trailer-lengths ahead of the bus. Overcast, bare trees, flat gray sky. The read: the bus sits beside the trailer's rear half while the truck's mirror is far ahead — the distance between them makes it obvious the bus cannot appear in that mirror.

## 8. THE STANDING RULE

A review note that doesn't name **what** is wrong and **who** fixes it isn't a review, it's a feeling. Feelings are useful — they're how III-011 got caught — but they have to be converted before they leave the screen.

## 9. LEDGER REAR VISION

`POV_MIRROR_REAR` is only valid when the ego vehicle has a rear window. **The Ledger does not.** On any Deac card, a hazard behind is `POV_MIRROR_DOOR`. Never write "rear glass," "rearview," "interior mirror," or "the center mirror" into a Ledger frame or a Ledger card's copy.

This is also why his act is about mirrors and blind zones. Ali can glance at a center mirror; Deac has two side mirrors and a wall. A mirror contact in his act appears in a door mirror, or it does not appear until it is beside him.

Five Act III cards carried the default through: III-004, III-009, III-011, III-018, III-022. Tag **`WRONG_CAMERA`** for the four; III-011 stays **`CARD_BROKEN`** (situation is three-way broken and heads to overhead). Do not generate any of them until the writer changes the JSON. `POV_MIRROR_REAR` + `driver: deac` is a hard validator reject.

## 10. CLIPBOARD AND CAT

The cockpit lock (`ref_ledger_cockpit.png`) mounted the clipboard on the passenger mesh. Every `ledger_cockpit` attach copies that into the generation. **The clipboard never sits in the windshield.** Doghouse, thigh, or hands. Tag stills that put it in the glass as `INVENTED` (or keep a stronger first-failure tag and name the clipboard in the note). Do not recompile Ledger cockpits until D4 is retaken without it.

**Mya is not loose in a moving vehicle.** Dash loaf only when the Ledger is parked. III-002 teaches the opposite (Central is already moving; cat on the dash) — that is `CARD_BROKEN`, not a missing paw. Rewrite it parked, then the dash loaf is legal. Same check on other Mya frames (III-017 already COPY). Gracie on the dash while the Menace is rolling is the same class except II-018, which *teaches* box her before you roll.

## 11. SAME-DIRECTION TRAFFIC AND UNPHOTOGRAPHABLE READS

On any multi-lane roadway, do not describe position by role or by half. `ego_lane_side` is a two-lane concept and is invalid where lanes run the same direction. Compile **left of frame / right of frame** with both headings and a longitudinal offset. Abstract rules ("passing occurs on the left") never appear in the positive prompt. `frame_side: same` means the opposite half is empty. Lateral headings use `POV_ROADSIDE_PROFILE`. State each spatial fact once. III-012 is the proof take: trailer right-of-frame, shuttle left-of-frame, still alongside (the question, not the answer).

A `read` that names a process, a gap you have to count, a hood "walking," a smear as psychology, or a tablet "mid-change" is the same class that killed II-009. Rewrite it to a static fact before generating. Recompiling against an unphotographable read buys another take of the same miss.

Do not generate III-014 or III-025 until D4 (`ref_ledger_cockpit.png`) is retaken without the clipboard on the mesh. Other `ledger_cockpit` attaches wait on that lock too.

## 12. PERSIST THE VERDICTS

The review state is the most expensive artifact in this phase. It lives at `cards/art-review-state.json` and **is committed**. A server restart must not wipe a full act. `node tools/art-review/apply-verdicts.js` writes that file, then refreshes the live board.
