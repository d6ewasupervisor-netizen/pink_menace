# IV-001 — Batch D stills map

Draft authority: `cards/drafts/IV-001-ridealong-lines.md`. Not a scored card. No `cards/IV-001.json`. **Brake still brief authority is `cards/IV-001-brake.json` only.** Other named-spot briefs plus the notes below stay the brief for those frames.

Five frames, each a named spot — same job as III-001's left / merge / horn stills. Not a text slideshow on one cockpit. Bike (line 9) is a later tap, not this batch. This pass reshoots **brake / person / tracks only**. Count-in and handoff stay presumed PASS pending seed.

Driver: `yuna`. Continuity: Encore cockpit (**Y4 take 7** glass lock = `refs/ref_encore_cockpit.png`) + stock-glass-first sheet (Y3 take 12). Overcast PNW daylight through intact glass. No cooler / COLD. No Quiet. Dead in-ears around Yuna's neck, **both out**. Ali on the welded rear bench; she does not touch the wheel until frame 5.

Attachments on every compile: `ref_encore_cockpit.png` (Y4 take 7 — do not attach take 1 or take 4). Add `ref_encore_sheet.png` on person / tracks. Brake attaches Y4 take 7 + `IV-001-brake-take-18.png` for rain-on-glass / wiper lighting only — **not** IV-003-take-1 (Menace pink mat). Add `ref_yuna.png` / `ref_yuna_sheet.png` on count-in. Add `ref_ali2.png` on handoff. Stock-glass-first if any exterior peek; never put cage, bench, or stripped dash in an exterior clause. Never attach a Menace ref on this still.

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
| count-in | `IV-001-count-in-take-5.png` | Presumed PASS pending seed. Not reshot this pass. |
| brake | pending takes 22+ | Take 21 FAIL: magenta posterization in the lower third; heel off the floor; foot between pedals not over the brake; mat riding toward the pedal box. Claude wants three pedals; heel on the floor; ball of the foot above the brake with the gap silhouetted on the pad; same footwell; keep take-18 rain-on-glass / wiper lighting. |
| person | `IV-001-person-take-16.png` | Person in the bumper gap between two plain sedans; travel lane left is empty; intact glass/dash. Not an open-lane walker. Remaining: cars still read mid-block, person not half-occluded. Take 17 if you want a stiller gap. Discard 6–9 (chevrons) and 12 (person in cab). |
| tracks | `IV-001-tracks-take-7.png` | Streetcar rails in this lane, distant car, both hands, intact glass/dash. Not freight flanking. Take 5 if you want the rails larger. |
| handoff | `IV-001-handoff-take-1.png` | Presumed PASS pending seed. Not reshot this pass. |

**Reshoot notes (brake — takes 22+):**
- Take 21 FAIL (do not repeat): magenta posterization in the lower third; heel off the floor; foot between the pedals not over the brake; mat riding toward the pedal box.
- Claude wants: three pedals in frame; heel on the floor; ball of the foot above the brake with a clear gap silhouetted on the pedal pad; same Encore footwell; keep take-18 rain-on-glass / wiper lighting.
- Sole brief: `cards/IV-001-brake.json`. Do not attach IV-003-take-1 (pink Menace mat). Do not attach Menace refs.
- Covering the brake is heel-down, ball hovering — not a mid-air float and not a plant on the mat away from the pedals.
- Person take 16 / tracks take 7 stay from PR #27 — not reshot here.
- Not seeded.

**Prior blockers (history):**
- Brake takes 1–10: hover. Count-in: Yuna lock kept one IEM in. Person takes 1–5: open-lane walker. Tracks takes 1–4: missing or freight-style rails. All also inherited Y4 take 4's open tube-frame cockpit.

---

## Shared lock (every frame)

Encore cockpit match (Y4 take 7): small suede-wrapped racing wheel on the **left** (LHD), a real dashboard under intact glass (analog cluster, guarded red switch, radio — wiring only as loomed on that dash, never a nest instead of a dash), welded roll-cage tubes at the A-pillars inside the enclosed cabin, solid roof, dead wireless mic on the right cage tube. Intact windshield is a real glass plane with raindrops on the outside — not an open hole, not mesh, not a bar cage over the glass, not an open tube frame. Do not show roof PA horns from inside.

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

Sole brief: `cards/IV-001-brake.json` (do not compile from this block if the JSON disagrees).

```json
{
  "slug": "IV-001-brake",
  "camera": "POV_OBJECT",
  "camera_pose": "Camera is low in the left-hand-drive driver footwell of Encore, same footwell as take 18, looking down and slightly forward at the pedal box. THREE pedals in frame. Brake pedal center of the FRAME. Rain-on-glass / wiper lighting in the top fifth only. No faces.",
  "subject": "a right foot in a black high-top covering the BRAKE. Heel planted on the painted floor. Ball of the foot held directly above the center brake pedal with a clear air gap silhouetted on the pedal pad. Clutch left empty. Gas right empty.",
  "foreground": "three worn metal pedals with rubber covers; painted dark Encore floor; planted heel; roll-cage tube at the left. Mat if any stays flat and back — not riding toward the pedal box.",
  "midground": "the covering foot and ankle, sliver of black track pant; empty clutch and gas; the silhouetted gap on the brake pad",
  "background": "soft rain-dotted intact windshield and Y4 take 7 analog dash; overcast wiper-path light; distant traffic light, no readable signs",
  "read": "three pedals; heel on the floor; ball of the foot covers the brake with a clear gap on the pad; gas empty",
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
  "subject": "through rain-dotted intact glass, an ordinary living adult in a dark raincoat, still half-hidden, stepping OUT of the gap BETWEEN two parked sedans along the right curb — emerging from concealment, not walking the open travel lane. Not slack-shouldered, not filthy, not the Quiet. A person who might walk out.",
  "foreground": "suede racing wheel; Yuna's hands at ten-and-two (light-medium skin, black windbreaker cuffs, retroreflective piping). Ali's hands on her knees on the bench at the bottom edge — not on the wheel.",
  "midground": "rain-dotted windshield, roll-cage A-pillar at the right of the FRAME, two parked sedans on the right curb with a body-width gap",
  "background": "overcast downtown block, wet pavement, no readable signs",
  "read": "a living person is emerging from between parked cars on the right; Encore is looking at them through intact glass",
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
  "subject": "wet grooved light-rail tracks EMBEDDED FLUSH in the asphalt of the lane Encore is in — asphalt between and outside the rails, not a freight spur, not rails flanking the lane. The rails catch the overcast sky. They run straight. They do not swerve.",
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
