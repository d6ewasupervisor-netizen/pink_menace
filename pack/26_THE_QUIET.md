# 26 — TURNING THE QUIET ON

Playtest: *"a lot better, but I'd really like to see some zombies."* Third ask. The machine exists — `src/presence.js` sums, decays, sets handprints, fires the Quiet beat, and ships `presence / tier / handprints` to the client. The overlays exist too, and were hidden on Aug 26 (`dd18d13`) because they painted as blobs on the stills.

**This is not a new system. It is making the existing one paint, and paint as the Quiet.**

---

## 1. WHY THE BLOBS FAILED, AND THE FIX

A CSS shape composited onto a photograph reads as a sticker, because it has no depth, no grain, no light. And a *scene-placed* figure can't be generic: a silhouette at a fixed position lands on a treeline in one frame and in the sky on the next. 59 stills, 59 different depths.

**So stop placing the Quiet in the scene. Put them on the glass.**

Every cockpit, mirror, and chase frame in this game is shot through something — a windshield, mesh, a mirror. A mark on that glass is at a known depth (immediately in front of the camera), needs no knowledge of the still behind it, and works identically on all 59 cards.

It is also a scarier register. A figure at the treeline is *over there*. A handprint on the windshield is *on the car*.

**Two plate families, both photoreal PNGs with alpha — never CSS gradients:**

| Family | What it is | Placement |
|---|---|---|
| **Glass plates** | Handprints, drag smears, palm-and-fingers pressed flat, breath fog blooming and fading, a wet streak | Frame-level, over the whole shot wrap. Card-independent. |
| **Depth plates** | Distant figures, a herd at the vanishing point, eyeshine pairs | A single **horizon band** at 38–48% of frame height, where the road recedes on every forward-facing frame. Blurred, desaturated, at 20–35% opacity. |

Plates live in `public/game/quiet/`. Depth plates only apply where `camera` is forward-facing — `POV_COCKPIT`, `POV_CHASE`, `POV_MIRROR_*`. On `POV_OBJECT`, `POV_DIAGRAM`, and `POV_PORTRAIT`, nothing.

## 2. THRESHOLDS

| Tier | Presence | What paints |
|---|---|---|
| T0 | 0–3 | Whisper. Handprints at ~10% — barely there. |
| **T1** | **4–8** | A walker in the **rearview** (Menace) or door glass (Ledger). Watching, not attacking. Different still per card. |
| **T2** | **9–13** | Same walker, nearer in that glass. Vignette begins. Never a figure in the middle of a cockpit windshield — that reads as a toy on the dash. |
| **T3** | **14–22** | They got loud. Pose swaps to an attack still of that walker. Prints thicken with the **noise meter**, not a sticky on/off. Eyeshine at night/dusk cards. |
| **T4** | **23** | The Quiet beat (§3). |

A locked-in wrong answer is at least **+3 noise**, even when the option is a light or yaw miss. Authored noise above that still wins. Light and yaw still cost cargo. Timeout and dossier continue are not loud. Tapping the other choices after the card is scored does not count. She should cross T1 inside the first few loud cards of a sloppy run and never see an attack on a clean one.

**Same character per street, different pose when they get loud.** Door-mirror and rearview glass get **cutouts** (`/quiet/cutouts/`), not the 60 zone photographs. Those zone files are scenes — DOL interiors, hordes, trucks — and they read as a photograph taped to the cab, not a reflection. Watching vs attack still swaps among the six standing walkers.

Pink Menace uses the interior rearview (top center of the windshield). The Ledger has no rear window. **Only fill a door mirror that is already in the still.** If the still has no west-coast mirror (Arrow Then Circle, Mya on the dash, etc.), do not invent one. III-022's door glass is the lesson (the remnant in the cap) — leave it.

**Do not paste a zone photograph onto a card still.** Those 60 files are scenes, not stickers. Three legal uses:

1. **Glass** — a standing-walker cutout in a rearview or door mirror that is already in the still. Not a full zone photograph.
2. **Street** — rembg cutouts of standing figures only (`/quiet/cutouts/`), small, on the shoulder of `POV_ROADSIDE`, `POV_ROADSIDE_PROFILE`, and `POV_CHASE`. Never in the middle of the road. Never on the dash plane of a cockpit.
3. **Never on `POV_DIAGRAM`, `POV_OBJECT`, or `POV_PORTRAIT`.** An eye-level walker on a bird's-eye four-way is a toy. The teaching read (who was first, what the sign says, whose face) stays clean.

## 3. T4 IS NOT THE CARGO-FAIL COLLAPSE

The Quiet beat is not a fail. Presence hits 23 and:

- Glass plates flood — prints multiply across the windshield over ~2s
- Breath fog blooms from outside the glass
- Everything holds for three seconds
- Then it clears, presence clamps to 16, prints stay, **and she is still on the same card**

Cargo fail still uses the black `collapse` panel. `quiet` is a separate response flag.

## 4. THE LEDGER

`html[data-driver="deac"]` only paints a walker into a **door mirror that is already in the still** (III-004, III-005 right, III-006, III-009, III-017 right, III-019, III-027). Never a fake chrome box on a windshield that has no mirror. Never a rear window.

## 5. VIGNETTE

Vignette from presence runs only at T2+, and only when a plate is actually rendering. Hazard-clock vignette is separate.

## 6. WHAT TO WATCH

Not "is it scary." One thing: **does she connect the Quiet to her own driving.** The line that means it worked is some version of *"they showed up when I messed up"* — and the sharpest tell is whether she starts playing quieter on purpose.

If she sees them and it doesn't change how she drives, the tiers are firing but the causal link isn't legible, and the fix is timing: the plate should land in the same beat as the meter spike, not a card later.
