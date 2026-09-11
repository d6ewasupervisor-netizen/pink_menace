# IV-001 — Batch D stills map

Draft authority: `cards/drafts/IV-001-ridealong-lines.md`. Not a scored card. No `cards/IV-001.json`.

Five frames, each a named spot — same job as III-001's left / merge / horn stills. Not a text slideshow on one cockpit. Bike (line 9) is a later tap, not this batch.

Driver: `yuna`. Continuity: Encore cockpit (Y4 take 4) + stock-glass-first sheet (Y3 take 12). Overcast PNW daylight through intact glass. No cooler / COLD. No Quiet. Dead in-ears around Yuna's neck, **both out**. Ali on the welded rear bench; she does not touch the wheel until frame 5.

Attachments on every compile: `ref_encore_cockpit.png`, `ref_encore_sheet.png`. Add `ref_yuna.png` / `ref_yuna_sheet.png` on count-in. Add `ref_ali2.png` on handoff. Stock-glass-first if any exterior peek; never put cage, bench, or stripped dash in an exterior clause.

| Frame | Slug | Line | Named spot | Camera (explicit) |
|---|---|---|---|---|
| 1 | `IV-001-count-in` | 1 | the count-in | On the welded rear bench, looking forward-left. Yuna occupies the **left third of the FRAME**; rain-dotted windshield + street occupy the **right two-thirds**. |
| 2 | `IV-001-brake` | 3 | covering the brake | Low in the driver footwell, looking down at the pedals. Brake pedal **center of the FRAME**. Windshield + light only in the **top fifth**, soft. |
| 3 | `IV-001-person` | 5 | the person between parked cars | On the bench, looking forward-right through glass. The living pedestrian is **right-center of the FRAME**, curb distance. Wheel + Yuna's hands **lower-left**. |
| 4 | `IV-001-tracks` | 7 | tracks in the lane | On the bench, looking forward and slightly **down** through glass. Wet rails **center of the FRAME**, running away in this lane. Wheel **bottom-left**. |
| 5 | `IV-001-handoff` | 12 | the empty seat / wheel | On the bench, looking forward-left at the empty driver seat. Empty seat **left-center**. Empty suede wheel **lower-left**. Ali reaching from the **right** of the FRAME. |

Takes: `cards/takes/<slug>-take-N.png`. Prompts: `cards/takes/<slug>.prompt.txt`.

## Closest take (1 of 4+)

Muted-read pick. Not a PASS stamp. Reviews do not gate this batch.

| Frame | Closest | Why |
|---|---|---|
| count-in | `IV-001-count-in-take-5.png` | Two-beat hand + street through rain glass. Take 3 is the same gesture. |
| brake | `IV-001-brake-take-5.png` | Foot overlaps a pedal; yellow light in the top fifth. Covering is still a hover — see blockers. |
| person | `IV-001-person-take-5.png` | Living pedestrian + two cars through intact glass. Person is beside the cars, not in the bumper gap. Take 2 if you want one car and a cleaner lane. |
| tracks | `IV-001-tracks-take-4.png` | Rails in this lane, both hands on the wheel. Take 2 if you want the rails larger. |
| handoff | `IV-001-handoff-take-1.png` | Empty seat is in frame; Ali reaches the empty wheel. Takes 2–4 sit her in the driver seat — not the handoff. |

**Blockers (do not invent a scored card around these):**
- Brake: the model will not plant the sole on the pedal. Takes hover. Covering the brake is the named spot and it is weak.
- Count-in: Yuna lock has a right IEM in. Every take kept one earpiece in. Line 2 wants both out.
- Person: “between parked cars” did not land. Person walks the travel lane. Takes 6–8 discarded (other traffic wore Encore chevrons).
- No `cards/IV-001.json` — prompts are hand-assembled from the Yuna / Encore cockpit template. `compile-images.js --card IV-001` was not run.

---

## Shared lock (every frame)

Encore cockpit match: small suede-wrapped racing wheel on the **left** (LHD), stripped metal dash, exposed taped wiring, one aftermarket tach, toggle panel with one large guarded red switch left off, welded roll-cage tubes at the A-pillars, enclosed solid roof, dead wireless mic on the right cage tube. Intact windshield is a real glass plane with raindrops on the outside — not an open hole, not mesh, not a bar cage over the glass. Do not show roof PA horns from inside.

Ali, frames 1–4: on the mismatched welded rear bench. Hands on her knees. Not on the wheel.

---

## Frame 1 — the count-in (line 1)

**Line:** Count me in. One — two. Watch the street, not my mouth.

```json
{
  "slug": "IV-001-count-in",
  "camera": "POV_COCKPIT",
  "camera_pose": "Camera sits on the mismatched welded rear bench, slightly left of cabin center, looking forward and a little left. Yuna in the driver seat occupies the left third of the FRAME, seen from behind her right shoulder (three-quarter from behind). Intact rain-dotted windshield and the wet downtown street occupy the right two-thirds of the FRAME. The suede wheel sits in the lower-left quadrant under her left hand.",
  "subject": "Yuna mid count-in: right hand raised at chest height on a two-beat, mouth barely open, eyes on the street through the glass not at camera. Dead in-ear monitors around her neck, both earpieces out and dangling on the cropped black windbreaker. Asymmetric chin-length bob, platinum under-layer, thin braid at her right temple with retroreflective tape.",
  "foreground": "welded rear-bench cushion along the bottom edge; Ali's hands rest on her own knees — they do not touch the wheel; a cage tube at the right edge",
  "midground": "Yuna in the left seat, count-in hand, empty right half of the stripped dash, guarded red switch off",
  "background": "overcast downtown Seattle through rain-dotted intact glass, wet pavement, no readable signs",
  "read": "Yuna is counting in with her hand; both in-ears are out around her neck; the street is visible through intact glass",
  "continuity": ["encore_cockpit", "encore", "yuna"]
}
```

## Frame 2 — covering the brake (line 3)

**Line:** Cover the brake before the light even thinks about yellow. Foot off the gas. Held. Not riding it.

```json
{
  "slug": "IV-001-brake",
  "camera": "POV_OBJECT",
  "camera_pose": "Camera is low in the left-hand-drive driver footwell, near the dead pedal, looking down and slightly forward at the pedal box. The brake pedal occupies the center of the FRAME. Intact windshield and a distant traffic light occupy only the top fifth of the FRAME, out of focus. No faces.",
  "subject": "a right foot in a black high-top covering the brake pedal, held still, not pumping, not riding the pedal. The gas pedal to the right of the brake is empty — no foot on it.",
  "foreground": "worn metal pedals with rubber covers, painted floor, a roll-cage tube at the left edge of the FRAME",
  "midground": "the covering foot and ankle, a sliver of black track pant; the empty gas pedal",
  "background": "soft rain-dotted windshield; a yellow traffic light far ahead through glass, no readable sign legend",
  "read": "the right foot covers the brake and is held; the gas is empty",
  "continuity": ["encore_cockpit"]
}
```

## Frame 3 — the person between parked cars (line 5)

**Line:** Person between the parked cars. I do not own the right of way. I own the stop.

Living pedestrian. Not the Quiet. Upright, ordinary clothes, mid-block.

```json
{
  "slug": "IV-001-person",
  "camera": "POV_COCKPIT",
  "camera_pose": "Camera sits on the welded rear bench looking forward and slightly right through the intact windshield. The named spot — a living person in the gap between two parked cars — occupies the right-center of the FRAME, at curb distance beyond the glass. The suede wheel and Yuna's hands occupy the lower-left of the FRAME.",
  "subject": "through rain-dotted intact glass, an ordinary living adult in a dark raincoat, upright and mid-step, appearing in the gap BETWEEN two parked sedans along the right curb. Not slack-shouldered, not filthy, not the Quiet. A person who might walk out.",
  "foreground": "suede racing wheel; Yuna's hands at ten-and-two (light-medium skin, black windbreaker cuffs, retroreflective piping). Ali's hands on her knees on the bench at the bottom edge — not on the wheel.",
  "midground": "rain-dotted windshield, roll-cage A-pillar at the right of the FRAME, two parked sedans on the right curb with a body-width gap",
  "background": "overcast downtown block, wet pavement, no readable signs",
  "read": "a living person is in the gap between parked cars on the right; Encore is looking at them through intact glass",
  "continuity": ["encore_cockpit", "encore"]
}
```

## Frame 4 — tracks in the lane (line 7)

**Line:** Tracks in this lane. The train does not swerve. We do.

```json
{
  "slug": "IV-001-tracks",
  "camera": "POV_COCKPIT",
  "camera_pose": "Camera sits on the welded rear bench looking forward and slightly down through the intact windshield. Wet streetcar rails in THIS travel lane occupy the center of the FRAME, starting at the hood line and running away. The suede wheel occupies the bottom-left of the FRAME.",
  "subject": "wet steel streetcar tracks set into the asphalt of the lane Encore is in. The rails catch the overcast sky. They run straight. They do not swerve.",
  "foreground": "suede racing wheel, Yuna's hands holding it; a sliver of silver chevron on the hood seen through the glass",
  "midground": "two wet rails in the travel lane, rain-dotted windshield, painted lane line",
  "background": "downtown Seattle street under overcast, no readable signs; if a streetcar exists it is distant and small, never filling the frame",
  "read": "the tracks run in this lane; the train would not swerve",
  "continuity": ["encore_cockpit", "encore"]
}
```

## Frame 5 — the handoff with the empty seat (line 12)

**Line:** Your wheel.

Only frame Ali may touch the wheel. Yuna is not in the seat.

```json
{
  "slug": "IV-001-handoff",
  "camera": "POV_COCKPIT",
  "camera_pose": "Camera sits on the welded rear bench looking forward-left at the empty driver seat and the empty suede wheel. The empty seat occupies the left-center of the FRAME. The empty wheel occupies the lower-left. Ali occupies the right of the FRAME as she reaches from the bench.",
  "subject": "the driver seat is empty. The suede racing wheel has no hands on it until Ali's reaching hand. This is the handoff.",
  "foreground": "mismatched welded rear bench; Ali (medium-brown skin, wire-rim glasses, cranberry lattice braid, gold hoop, pink raglan hoodie) leaning forward from the bench, right hand reaching the empty wheel",
  "midground": "empty driver seat, empty suede wheel, stripped dash, guarded red switch off, dead in-ears left on the cage tube",
  "background": "overcast street through rain-dotted intact glass. Yuna is not in the seat. If she appears at all it is only a sliver of black windbreaker at the left door, mostly out of frame.",
  "read": "the driver seat is empty; Ali is taking the wheel from the bench",
  "continuity": ["encore_cockpit", "encore", "ali"]
}
```
