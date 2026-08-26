# WORKED EXAMPLE — one card, end to end

Proof the pipeline produces something worth playing. Read this before you generate at volume.

---

## Step 1 — the slot request

```json
{
  "card_id": "II-007",
  "act": "II",
  "zone": "The Grid",
  "driver": "ali",
  "card_type": "scene",
  "psdp_skill": "Skill six: looking ahead",
  "dol_section": "4.2 Sharing with school buses",
  "teaching_target": "Amber lamps mean the bus is preparing to stop; red lamps plus extended stop arm require a full stop from both directions.",
  "ledger_state": { "...": "trimmed" }
}
```

## Step 2 — Layer 2 output

```json
{
  "card_id": "II-007",
  "act": "II",
  "zone": "The Grid",
  "driver": "ali",
  "card_type": "scene",
  "title": "Bus 12, Amber",
  "scene": "Fourth Ave South, Kent, and the rain has been going since Renton. Half a block up, Bus 12 rolls at maybe fifteen. Reyna runs the last shelter route and she runs it on time. The amber lamps come on above her rear window. Gracie stands up in the passenger footwell. You are carrying insulin that has been out of cold for ninety minutes, and there is a clear lane to Reyna's left.",
  "decision": "The amber lamps are on and the left lane is open. What do you do?",
  "options": [
    {
      "id": "a",
      "text": "Take the left lane and get past her before the reds come on",
      "correct": false,
      "result": "You are alongside the front bumper when the reds fire and the stop arm swings into your door line. The plow catches it. Steel on steel, and the sound goes out across four blocks of flat wet street. Reyna does not blow the horn. She does not have to.",
      "state_delta": { "noise": 4, "damage": 1, "yaw": 1, "time_cost": 6 }
    },
    {
      "id": "b",
      "text": "Ease off and start slowing now, staying behind her",
      "correct": true,
      "result": "You lift and let the gap open to four car lengths. The reds come on, the arm swings out, and a kid in a yellow shell comes around the front of the bus at a dead sprint without looking once. He is across before you have finished counting him. Reyna gives you two fingers off the wheel.",
      "state_delta": { "noise": -1, "time_cost": 4 }
    },
    {
      "id": "c",
      "text": "Hold your speed and stay behind — you'll stop when the reds come on",
      "correct": false,
      "result": "You are still at twenty-eight when the reds fire. Hard on the brakes, wet asphalt, and the Menace squats and squeals to a stop with the plow eight feet off her bumper. You stopped legally. You also just rang a bell on a quiet street, and something moves at the treeline four blocks down.",
      "state_delta": { "noise": 3, "yaw": 2, "time_cost": 3 }
    },
    {
      "id": "d",
      "text": "Flash your headlights so Reyna knows you're behind her",
      "correct": false,
      "result": "The flash bounces off the wet street and every window on the block. Reyna's hand comes out the window, flat, palm down — cut it. The reds fire anyway, and you brake late because you were watching her hand instead of her lamps.",
      "state_delta": { "light": 4, "noise": 1, "time_cost": 5 }
    }
  ],
  "debrief": "Amber lamps mean the bus is preparing to stop — that is your cue to slow, not your last chance to pass. Red lamps plus the extended stop arm require a full stop from both directions until the arm retracts. Tobin does not check for you. He is seven.",
  "source": {
    "psdp_skill": "Skill six: looking ahead",
    "dol_section": "4.2 Sharing with school buses",
    "teaching_target": "Amber lamps signal an approaching stop; red lamps and extended stop arm require a full stop from both directions."
  },
  "cast": ["ali", "gracie", "reyna_solis", "bus_12", "tobin"],
  "antagonist": "none",
  "callback_of": null,
  "schedules_callback": true,
  "image_brief": {
    "camera": "POV_COCKPIT",
    "subject": "the rear of Bus 12 half a block ahead, amber lamps lit above the rear window",
    "foreground": "the worn black leather steering wheel rim across the bottom of frame and welded steel mesh across the top of the windshield",
    "midground": "wet two-lane residential street, an open and empty left lane, water beading and running on the glass",
    "background": "flat gray overcast, bare maples, single-story Kent houses receding, wipers mid-sweep",
    "read": "the two amber lamps are lit and the red lamps directly beside them are dark — the distinction must be unmistakable at a glance",
    "continuity": ["pink_menace_interior", "bus_12"],
    "aspect": "2:3"
  },
  "variation": {
    "location_type": "residential",
    "weather": "rain",
    "time_of_day": "afternoon",
    "tone": "tense",
    "failure_mode": "speed"
  }
}
```

**What to notice.** No option is a joke. Option C is *legally defensible and still wrong* — she stops in time, but the noise is the consequence, and that is a lesson about smooth braking hiding inside a lesson about buses. Option D is a good instinct applied wrongly, which is exactly how new drivers actually fail. The debrief names the rule once, cites it, and ends on Tobin instead of on a warning. And the correct answer's payoff is Tobin sprinting — the student sees *why* before they are ever told why.

## Step 3 — Layer 3 output

Attach `ref_cockpit.jpg`. Compiled prompt:

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only saturated color in frame is cranberry/pink. Fine grain, slight lens vignetting, no HDR, no glow, no lens flare. Camera is inside the vehicle, over the wheel, looking forward through the windshield. Across the bottom of frame, a worn black leather steering wheel rim with a chrome center hub; across the top of the windshield, welded steel mesh in a coarse grid. Beyond the glass, rain beading and running, wipers caught mid-sweep. Half a block ahead in the same lane, the rear of a yellow school bus, weathered and streaked, with two amber warning lamps lit above the rear window and the red lamps beside them clearly dark and unlit. The left lane beside the bus is open and empty. Wet two-lane residential street, bare maple trees, low single-story houses receding into flat gray overcast. Faded pink dashboard edge visible at the lower right, an aftermarket navigation tablet dark in its mount. The lit amber lamps and the unlit red lamps must be unmistakably distinguishable at a glance and are the compositional focus.
>
> No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No gore, no wounds, no blood on skin, no bodies. No infected in sharp focus or close range. No text, no captions, no watermarks, no UI overlay. No crowds. No firearms. No anime, no illustration, no painterly rendering, no 3D render look — this is a photograph.
>
> Aspect ratio 2:3.

## Step 4 — the callback this queues

`schedules_callback: true`, so a wrong answer here queues a ledger card later in Act II — same street, same rain, Reyna and Bus 12, showing the fallout. That is the retention mechanism. The student does not get told they were wrong. They get to meet it again.

---

## Before you generate 150 of these

1. Lock Deac, Yuna, the Ledger, and Encore with reference portraits and three-quarter vehicle shots. Add them to the reference map in `03`.
2. Build the full slot table for all seven acts.
3. Generate Act II first, not Act I. Act I is parking-lot fundamentals and it is the hardest act to make fun — write it after you have the voice, or you will conclude the whole system is boring when it is just Skill One.
