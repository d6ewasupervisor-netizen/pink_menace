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
| T0 | 0–3 | Nothing. The reward state. |
| **T1** | **4–8** | One depth plate: distant figures at the horizon band, heavily blurred. |
| **T2** | **9–13** | Wrong-gait figure, nearer. Mirror-slot contact. Vignette begins. |
| **T3** | **14–22** | Glass plates: handprints appear and **persist for the rest of the run**. Eyeshine at night/dusk cards. |
| **T4** | **23** | The Quiet beat (§3). |

A wrong answer runs +3 to +4. She should cross T1 inside the first few cards of a sloppy run and never see it on a clean one.

## 3. T4 IS NOT THE CARGO-FAIL COLLAPSE

The Quiet beat is not a fail. Presence hits 23 and:

- Glass plates flood — prints multiply across the windshield over ~2s
- Breath fog blooms from outside the glass
- Everything holds for three seconds
- Then it clears, presence clamps to 16, prints stay, **and she is still on the same card**

Cargo fail still uses the black `collapse` panel. `quiet` is a separate response flag.

## 4. THE LEDGER

`html[data-driver="deac"]` puts the mirror slot on a door mirror. Never a rear window.

**III-005 specifically: the right door glass** (`slot-right`).

## 5. VIGNETTE

Vignette from presence runs only at T2+, and only when a plate is actually rendering. Hazard-clock vignette is separate.

## 6. WHAT TO WATCH

Not "is it scary." One thing: **does she connect the Quiet to her own driving.** The line that means it worked is some version of *"they showed up when I messed up"* — and the sharpest tell is whether she starts playing quieter on purpose.

If she sees them and it doesn't change how she drives, the tiers are firing but the causal link isn't legible, and the fix is timing: the plate should land in the same beat as the meter spike, not a card later.
