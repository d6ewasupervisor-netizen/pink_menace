# 12 — IDENTITY EXPOSURE POLICY + AMENDED CAMERA CAP

Two ledger amendments and one shot-design rule, adopted after the Act II art pass. Fold into `05_VARIATION_LEDGER.md` and `03_IMAGE_COMPILER_PROMPT.md` before Act III.

---

## 1. Identity drift is a shot-design problem, not a generation problem

Attaching reference sheets gives the model soft conditioning, not identity lock. There is no setting that fixes this and no prompt phrasing that reliably beats it. Fighting it card by card is unbounded work with no finish line.

The Act II data already contains the answer. The frames that read cleanest are diagrams, isolated objects, and interior rearviews: a sign, a sign, a schematic, a mirror. They did not need a photoreal character reference, so they could not drift. `POV_DIAGRAM` is the default for lane law; `POV_TOPDOWN_PHOTO` is establishing only.

**The rule: identity only has to be consistent where identity is visible.**

Ali is the player character. In a driving game she is behind the camera for most of the deck. Her face needs to be recognizable in a small number of frames, not in thirty.

### Identity-exposure budget, per act

| Exposure class | Cameras | Budget | Handling |
|---|---|---|---|
| **Face-critical** — Ali, Deac, or Yuna recognizable | `POV_PORTRAIT`, `POV_ROADSIDE` at close range | **≤ 10% of act** (3 cards in 30) | 8 takes, hand-curate 1. Never accept a first take. |
| **Vehicle-critical** — the Menace, Ledger, or Encore identifiable | `POV_CHASE`, `POV_ROADSIDE` at distance, `POV_TOPDOWN_PHOTO` | ≤ 25% | 4 takes, curate. Feature checklist mandatory (§2). |
| **Identity-free** | `POV_COCKPIT`, `POV_MIRROR_REAR`, `POV_MIRROR_DOOR`, `POV_OBJECT`, `POV_DIAGRAM` | remainder | 1–2 takes. No faces in frame. Diagrams are overhead photographs of the Menace; attach `ref_car_exterior.jpg` for build. |

`POV_COCKPIT` shows no driver at all — it is over the wheel, looking out. That is the single most drift-proof camera in the set and it is also the most narratively correct one for a decision moment. Use it freely.

Cutting face-critical frames from a third of the deck to a tenth turns an unwinnable consistency problem into three images you curate properly.

## 2. Vehicle feature checklist — beats reference attachment

Silhouette drift responds better to an explicit feature list than to a reference image. Two changes to the compiler:

**Name the base vehicle the model already knows, then the modifications.** "Baja-converted VW Beetle" drifts because the conversion is the unfamiliar part and the model averages it away. Compile as: *a classic VW Beetle, unmistakably a Beetle in silhouette — round fenders, sloping rear engine cover, domed roof — modified with…*

**Append a mandatory feature clause to every Menace compile**, phrased as a requirement rather than description:

> All four of the following must be clearly visible and unmistakable: welded steel mesh cages over the windows, a black tube bull bar carrying a wide flat plow blade at the front, riveted raw-steel plating over the driver's door and rear quarter panel, and oversize knobby tires on chrome slot wheels.

Same pattern for the Ledger (tall square box on a van nose, oversize convex west-coast mirrors on long arms, amber dot-matrix destination sign, bar cage with cut wiper slot) and Encore (low wide wedge, four chrome PA horn flares on a roof frame, retroreflective chevron striping, intact glass and no mesh).

## 3. Per-image QA rubric — ten seconds per card

Reject and regenerate on any miss. Do not accept "close enough"; drift compounds across an act.

**Ali (face-critical only):** round wire-rim glasses present · cranberry-red hair · braided at the crown · gold hoops · flat affect, not smiling
**Menace:** mesh cages · plow blade · riveted door plate · knobby tires on slot wheels
**Ledger:** box on van nose · big convex mirrors both sides · amber destination sign · windshield bar cage
**Encore:** four horn flares (not spotlights) · chevron striping · glass present, no mesh
**Every frame:** overcast, no golden hour · only the driver's signature accent is saturated · no text or UI · nothing invented that the brief didn't name · `read` element legible with the text muted

That last line is the one that matters. If you mute the card text and the image no longer teaches, the image failed regardless of how on-model it is.

## 4. Amended camera cap

**Old rule:** no camera token exceeds 25% of an act.
**Problem:** three hand-signal cards belong on a following-driver view for a diegetic reason — the signal is left-arm precisely because that is what a following driver sees. A rule that forces a card off its correct camera is a bad rule. Those cards are `POV_CHASE` with `camera_is_the_lesson`.

**New rule:**

- A card may declare `image_brief.camera_is_the_lesson: true` when the camera position is itself the teaching content. Declared cards are **exempt from the cap** and excluded from the denominator.
- The 25% cap applies to non-exempt cards only.
- The consecutive rule still applies to **all** cards, exempt or not — never the same token twice in a row.
- New hard rule, replacing the cap as the real anti-monotony guard: **no more than 2 uses of any token in any window of 6 cards.** Clustering is what reads as monotonous. A token spread evenly at 27% does not.

Hand-signal cards belong on a following-driver view (`POV_CHASE`, `camera_is_the_lesson`). Following-distance cards belong on `POV_MIRROR_REAR`. Do not steal a rearview from a hazard-behind card to satisfy a percentage.

Add both checks to `npm run validate-cards` so the ledger is enforced by the validator rather than by review.
