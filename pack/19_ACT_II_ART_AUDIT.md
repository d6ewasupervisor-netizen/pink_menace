# 19 — ACT II ART AUDIT (all 30 frames vs. card text)

Method: every PNG read muted against its card's scene, `read`, camera token, cast, and world canon. Hash-matched frames already human-verified this session (004, 015, 028, 029) were not re-judged.

**Verdict: 24 pass · 2 fail (rebuild) · 4 minor (one-line fixes) · 0 blocked on curriculum.**

---

## FAIL — rebuild before these cards are considered done

### II-009 "A Voice You Know" — the read is not in the frame, and Kent has no ocean
The card is the Chorus: a distracted driver's eyes leaving a pedestrian for a screen. The frame shows the Menace at a crosswalk, a pedestrian crossing, distant traffic — and **nothing anywhere depicting distraction or a screen.** The stated read ("the driver's eyes are leaving the pedestrian for a screen") is physically absent. Also: the street is a **waterfront boulevard with open sea** on the right. The scene says a Kent collector. Kent is landlocked; that's a coastal drive.

Rebuild as a cockpit — distraction is an inside-the-cab phenomenon and can't be photographed from a chase camera:

> [style + LHD clause] Camera inside the cabin, over the wheel. Through the mesh and windshield, a pedestrian in dark rain clothes is mid-crosswalk directly ahead, roughly forty feet, clearly in the vehicle's path. On the dash, the aftermarket navigation tablet is LIT, its screen bright with a pattern of gray-white static, the only bright object inside the cab, pulling at the lower right of frame. The read: the pedestrian ahead and the lit screen below compete for the same pair of eyes, and both must be unmistakable.
> Negatives add: no ocean, no waterfront, no beach, no text on the screen.

### II-026 "Door Zone, Ice" — wrong driver, wrong cyclist, wrong camera, wrong geometry
Four defects in one frame: the arm and leg at the latch belong to a **middle-aged man in jeans** (this is Ali's card); the cyclist is a **man** (the card names Marisol); the camera is a direct window view, not the specified `POV_MIRROR_DOOR`; and the cyclist approaches **from the front** — visible without any mirror, which deletes the entire reason the Dutch Reach exists. Door-zone threats come from *behind*; that's why you check before opening. The door window also lacks the canon mesh.

Rebuild as the mirror, with the technique itself in frame — this card family has locked refs (`ref_dutch_reach*.png`, Ali refs); attach them:

> [style + LHD clause] Camera inside the cabin at the driver's position, looking left at the door. The left door mirror fills the upper left of frame; **in its glass, a woman on a bicycle approaches from behind**, close, one car length back, in the narrow lane beside the parked vehicles. Crossing the frame from the right, **a 17-year-old woman's arm in a faded pink hoodie sleeve — her RIGHT arm, reaching across her own body** — her hand resting on the door latch, the door still fully closed. Welded mesh over the door window glass. Icy lot surface outside. The read: the far hand on the latch and the rider already in the mirror — the door has not opened, and the reason it hasn't is visible in the glass.
> Negatives add: no man, no male driver, no bare window glass, no cyclist visible through the window ahead.

That frame teaches the Dutch Reach *and* shows why, in one image — stronger than what it replaces.

## MINOR — one-line fixes, no regeneration

| Card | Issue | Fix |
|---|---|---|
| **II-017** | Frame shows a **double solid** centerline; scene text still promises "a broken yellow for them." The updated `read` only claims solid-on-this-side, so image and read agree — the scene sentence is the leftover. | Edit the scene line to "a solid yellow centerline" (drop "broken for them"). Text edit, reseed. |
| **II-010** | Frame is coherent and strong — reds, extended arm, backpack in the lane, no child — but it places the Menace **oncoming**, stopped facing the bus. Legal and teachable (reds stop both directions on a two-lane), *if* the scene supports her approaching from the opposite direction this time. | Verify the full scene text doesn't say she's behind the bus again. If it does, one sentence fixes it — and "this time you're the oncoming car" is arguably a better callback beat. |
| **II-027** | The read is "the inch-open door at the edge" and the parked car's door **does not read as ajar** — it reads closed. Everything else lands. | Small inpaint: open the door a visible hand's width with the dome light spilling. Masked edit, not a regen. |
| **II-023** | Teaching read is perfect (one lane, occupied by a stopped repair, workers, cones). But the setting is a **mountain rock cut**, not a Kent mill-and-fill. | Accept or note. If accepted, register the location as a non-Kent stretch in bible §11 so later cards don't contradict it. Don't regenerate for this alone. |

## NOTES — no action required

- **II-002**: school-zone beacons render white; scene text also says white, so image and story agree. Real WA beacons are amber — if realism ever matters, both text and art change together.
- **II-018**: read says her eyes are "on the cat"; her gaze reads more forward-past-it. The blocking (cat on dash, in the sightline) still teaches. Fine.
- **II-025**: the teal streetlight is a second saturated color in an Ali frame — but it's *authored* ("the green is the world still working") and it's the grid-alive motif. Treat as the sanctioned exception; don't let the compiler generalize from it.
- **II-024** (new take): geometry correct, one legible STOP (hers), sedan fully behind its crosswalk. Arrival order remains genuinely unreadable from any still — accepted limitation; the scene text carries it.

## PASSES — verified clean this pass

001 (Ali canon exact, Gracie exact), 002, 003, 005, 006 (arm angled down = stop, unambiguous), 007 (locked take intact), 008, 010*, 011, 012 (the inverted-gap rule executed perfectly), 013, 014 (the spec'd mirror frame, exactly), 016 (arm straight out — pairs cleanly against 022's bent-up), 018, 019, 020, 021, 022 (new take: rear dominant, L-arm legible), 023*, 024, 025, 027*, 030 (driveway on the correct side of the mirror glass). Plus hash-verified 004, 015, 028, 029.
*\* = passes with the minor noted above.*

## The pattern worth keeping

The three signal-arm cards — 006 down, 016 straight out, 022 bent up — now read as three unmistakably different shapes from the same camera position. Side by side they are the DOL hand-signal table rendered as photographs. That trio is the proof the pipeline can do precision; hold future signal-state cards to it.
