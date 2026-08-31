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

Same pattern for the Ledger (tall square box on a van nose, oversize side mirrors on long arms, amber dot-matrix destination sign, bar cage with cut wiper slot) and Encore (low wide wedge, four chrome PA horn flares on a roof frame, retroreflective chevron striping, intact glass and no mesh).

## 3. Per-image QA rubric — ten seconds per card

Reject and regenerate on any miss. Do not accept "close enough"; drift compounds across an act.

**Ali (face-critical only):** round wire-rim glasses present · cranberry-red hair · braided at the crown · gold hoops · flat affect, not smiling
**Menace:** mesh cages · plow blade · riveted door plate · knobby tires on slot wheels
**Ledger:** box on van nose · big side mirrors both sides · amber destination sign · windshield bar cage
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

Hand-signal cards belong on a following-driver view (`POV_CHASE`, `camera_is_the_lesson`). Following-distance cards belong on `POV_MIRROR_REAR` when the ego has a rear window (Ali). On Deac they belong on `POV_MIRROR_DOOR` — the Ledger has no rear glass. Do not steal a rearview from a hazard-behind card to satisfy a percentage, and do not invent one on a cutaway.

Add both checks to `npm run validate-cards` so the ledger is enforced by the validator rather than by review.

---

## 5. Whose seat — runs before compile

The generator does not reliably track whose cab the player is in. Act II never surfaced it: one driver, one car, thirty cards. Act III is the first handoff. Acts IV through VII have two more.

III-006 authored the ego from a following seat. III-026 carried a Menace into Deac's act. Three frames rendered other traffic with the Ledger's four canon marks. Same class of error.

`scripts/authoring-seat.js` answers five questions from the JSON alone — `driver`, `camera`, and a regex on the brief — and **aborts compile** if any fail. Do not generate, then notice.

1. **Ego matches the act's driver.** Act II is Ali / the Menace. Act III is Deac / the Ledger. A card may not put another playable vehicle in the ego seat, and a Ledger act may not carry Menace marks (pink Beetle, plow blade).
2. **Camera is consistent with sitting in it.** `POV_CHASE` of the player's own vehicle from a following cab (`following cab`, follower A-pillar) is illegal unless `camera_is_the_lesson` is set — hand signals, and only those. The player's signaling language is shot from inside their cab. **`POV_MIRROR_REAR` + `driver: deac` is a hard reject** — the Ledger has no rear window and no interior mirror. Hazard behind on a Deac card is `POV_MIRROR_DOOR`.
3. **No other vehicle shares the ego's canon marks.** Ledger: cutaway body, amber destination sign, roof cargo rack, west-coast arms. Menace: plow, pink Beetle, bull bar, knobby tires. Encore: horn flares, chevron. Those marks belong to one vehicle. Other traffic is a panel van, a dump, a sedan — factory mirrors only.
4. **Clipboard is not in the glass.** It lives on the doghouse, on the thigh, or in his hands. Never on the dash, never clipped to the mesh. The D4 cockpit lock currently violates this — retake before attaching `ref_ledger_cockpit.png` to a recompile.
5. **No unrestrained cat in a moving Ledger.** Mya on the dash only when parked.

The compiler already appends the other-vehicle clause on Deac cards. This check is the gate that keeps a bad brief from spending a generation.
