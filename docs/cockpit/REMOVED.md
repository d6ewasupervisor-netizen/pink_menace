# What left the driving HUD, and why

Item 3.8: "anything not named in the spec is gone from the driving state."

The spec for the portrait cockpit — a 48 px top rail, a 6 px noise bar, a 56 px nav
strip with the assist as a tag, a 40 px objective that hides, in-world cues inside
the world band, a two-line dialogue box at the foot of the world band, and 110–120 px
corner sticks with 44 px lights/horn — is the whole list of what may be on screen
while the player is driving. These are the things that were on screen anyway, the
measurement that condemned them, and where their information went.

| Removed | Measured BEFORE (390x844) | Where it went |
|---|---|---|
| **Minimap strip** (the canvas painted behind the nav cluster) | the whole 374×143 nav cluster at (8,104), of which the map was the left third | The nav strip names the next manoeuvre and the distance ("0.4 mi · Vantage Bridge"). The map drew a road with one turn in it, in the band that had the least room. |
| **Clock** (`07:20` in the speed card) | inside the same 374×143 cluster | Gone. The story owns time of day; a wristwatch in a driving test is a distraction. |
| **HP bar** | inside the same 374×143 cluster | `cockpit/objective.ts` → the HP/FUEL tag, which shows under 30 % or for 4 s after a change. |
| **FUEL bar** | inside the same 374×143 cluster | Same tag. A full bar is not information. |
| **Standalone `WIND ASSIST · 40` chip** | 88×31 at (12,54), **on the act badge**, and at 844x390 it sat at (356,34) on the noise meter's sub-label | The nav strip's assist tag: `AUTO 40` beside the speed. Same fact, its own slot, and the gas stick hides while it is true (3.6). |
| **The gust indicator's own absolute position** | 130×70 at (250,388) — centred on nothing in particular | A world-band cue: mid-height, on the side the wind comes from, in the cue stack (3.4). |
| **The body-band lights/horn rail** (`bottom: 312px`, left edge in portrait) | 52×52 at (12,230) for LOW, (12,290) for HORN — under the nav panel, on the far side from the right thumb | 44 px buttons inside the control band, above the right stick (3.6). |
| **`GameHUD` / `EngineHUD` / `Speedometer`** | not mounted in quiet roads, and nothing imported them (the highway world mounts `CockpitHUD`/`QuietHUD`/`TouchOverlay` too, and `CockpitHUD` returns null outside `kent`) | **Deleted** in 3.8, not disabled: `src/components/Game3D/{GameHUD,EngineHUD,Speedometer}.tsx` are gone. A component nothing mounts is not a feature; it is a future bug with a stylesheet. |
| **The noise meter's label row** (`● QUIET   22 dB` + a `nobody's looking` sub-label) | 46 px tall under the act badge | The 6 px bar keeps the value; the words fade in for 2.5 s after a change and leave. `<div data-noise-sub-label>` still exists for the tests and for a screen reader. |
| **The act chip's ego line** (`· the Menace` in 10 px under the act) | inside the 143 px nav cluster | The ego is the act's own card, not always-on furniture. The rail is `ACT VII · The Dark Hours` and TP. |
| **The 36 px pause chip's absolute corner** | `top:10; left:12` in portrait, `right:12` in landscape | Inside the rail as a flex child, same 36 px target, one place that owns the row. |

## What stays, and is not negotiable

- **The cockpit rule** (`quietroads/cockpit.ts`): the driving HUD shows only when a
  mission is active and no card / quiz / choice / debrief is open. This file removes
  *elements*; it does not touch *who owns the screen*.
- **The act chip and TP** (top rail, right) — the player's stake and where they are.
- **The noise meter's meaning** — colour, shape and word, so it reads without colour.
  It loses its label row and keeps a 6 px bar plus a value that fades in on change.
- **The pause control** — 36 px in the rail, still the only way out.

## The rule this file is an instance of

`pack/00_README.md`: *"A feature turned off for quality must leave a ticket — in the
pack or the repo, naming what was disabled and why. A silent `display: none` is not a
decision; it is a disappearance."* Every row above is a ticket.
