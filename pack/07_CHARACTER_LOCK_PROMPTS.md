# 07 — CHARACTER LOCK PROMPTS (ready to run)

Ten generations. Run them, pick one winner each, name it, and add it to the reference map in `03_IMAGE_COMPILER_PROMPT.md`. Nothing else in the pipeline runs until these exist.

## Technique note — read before you burn credits

Do **not** generate a single portrait and hope it holds. The approach that actually survives 150 cards:

1. **Generate a three-panel turnaround first** (front / three-quarter / profile in one 16:9 frame). A model referencing a turnaround stays on-model dramatically better than one referencing a single angle, because you've given it the parts of the head it would otherwise invent.
2. **Then generate the hero portrait** with the turnaround attached. That's your primary ref.
3. Vehicles get a **four-view** (front three-quarter / rear three-quarter / side / front) plus a cockpit.
4. Run each prompt **4 times**, pick one, discard the rest. Do not mix panels from different generations — that's how you get a character whose ears change.
5. Once locked, **never paraphrase the canonical description.** Same words, every call, forever. Paraphrase is the mechanism of drift.

Every prompt below already carries the master style token and the negative block. Paste as-is.

---

## D1 — DEAC turnaround

> Cinematic photoreal still, character reference sheet. Three panels in one frame, evenly spaced, plain flat gray studio backdrop: front view, three-quarter view, and left profile of the same man, identical clothing and lighting in all three. 50mm equivalent, f/4, even soft studio lighting, low contrast, desaturated. Subject: a broad tall-shouldered 54-year-old man with dark brown skin, close-cut gray hair receding at the temples, a short gray beard, deep-set tired eyes with reddened lids, wearing a faded charcoal transit operator's jacket with a worn-off patch over a dulled amber high-visibility safety vest grimy and taped at one shoulder, half-frame reading glasses hanging on a cord against his chest. Chest-up framing in all three panels. Steady, tired, patient expression. The amber vest is the only saturated color in the image. Fine grain, no HDR, no glow.
>
> *[negative block]* · Aspect ratio 16:9

## D2 — DEAC hero portrait
*(attach the chosen D1)*

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only saturated color in frame is transit amber. Chest-up portrait, subject centered, background compressed. Subject: a broad tall-shouldered 54-year-old man with dark brown skin, close-cut gray hair receding at the temples, a short gray beard, deep-set tired eyes with reddened lids, wearing a faded charcoal transit operator's jacket with a worn-off patch over a dulled amber high-visibility safety vest grimy and taped at one shoulder, half-frame reading glasses hanging on a cord against his chest. He holds a metal clipboard against his chest with a hand-ruled log sheet clipped to it, ruled columns visible but text illegible. Behind him, far out of focus, the gray flank of a large boxy vehicle and wet pavement. Fine grain, slight vignetting, no HDR, no glow, no lens flare.
>
> *[negative block]* · Aspect ratio 2:3

## D3 — THE LEDGER four-view

> Cinematic photoreal still, vehicle reference sheet. Four views of the same vehicle in one frame on a plain flat gray backdrop, evenly spaced, identical lighting: front three-quarter, rear three-quarter, full side profile, and straight-on front. Even soft daylight, low contrast, desaturated. Subject: an ex-transit cutaway shuttle bus, a tall square passenger box on a van nose, roughly 24 feet long, faded green and white transit livery ghosting under gray primer, plate steel skirting the lower body panels, expanded metal mesh over every side window, a welded bar cage over the windshield with a cut wiper slot, a roof cargo rack with lashed water cans and a folded aluminum ramp, oversize convex west-coast mirrors on long arms on both sides, an amber dot-matrix destination sign above the windshield, a passenger-side wheelchair lift door, heavy dual rear wheels. Weathered, functional, maintained. The amber destination sign is the only saturated color in the image. Fine grain, no HDR, no glow.
>
> *[negative block]* · Aspect ratio 16:9

## D4 — THE LEDGER cockpit
*(attach the chosen D3)*

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field. Overcast Pacific Northwest daylight through the windshield — soft, diffuse, low-contrast, gray-blue. Desaturated palette; the only saturated color is transit amber. Camera inside the vehicle, over the wheel, looking forward. A large flat commercial steering wheel across the bottom of frame, worn smooth at ten and two. A tall upright dashboard with square analog gauges, a bank of labeled toggle switches, and a dented steel thermos in the cup holder. No clipboard on the dash. No clipboard in the windshield or on the mesh — the right half of the road is visible through the cage. The clipboard lives on the doghouse between the seats, below the glass, not in frame unless the brief names it there. Through the windshield, a welded bar cage in a coarse grid with a cut slot for the wipers, and beyond it wet empty four-lane road under flat gray sky. High seating position, hood line low and far below. The huge convex west-coast mirror visible at the left edge of frame. Fine grain, slight vignetting, no HDR, no glow, no lens flare.
>
> *[negative block]* · Aspect ratio 2:3

---

## Y1 — YUNA turnaround

> Cinematic photoreal still, character reference sheet. Three panels in one frame, evenly spaced, plain flat gray studio backdrop: front view, three-quarter view, and right profile of the same young woman, identical clothing and lighting in all three. 50mm equivalent, f/4, even soft studio lighting, low contrast, desaturated. Subject: a 17-year-old woman with light-medium skin and no glasses, an asymmetric chin-length bob, jet black on top with a platinum under-layer visible where the hair falls away, a single thin braid at her right temple with retroreflective silver tape woven into it, wearing a cropped black windbreaker with retroreflective silver piping down both sleeves, squared stage-trained posture with chin level, dead in-ear monitors around her neck with one earpiece in and one dangling. Chest-up framing in all three panels. Alert, restless, faintly amused expression. The retroreflective silver is the only bright element in the image. Fine grain, no HDR, no glow.
>
> *[negative block]* · Aspect ratio 16:9

## Y2 — YUNA hero portrait
*(attach the chosen Y1)*

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only bright element in frame is retroreflective silver-white. Chest-up portrait, subject centered, background compressed. Subject: a 17-year-old woman with light-medium skin and no glasses, an asymmetric chin-length bob, jet black on top with a platinum under-layer, a single thin braid at her right temple with retroreflective silver tape woven into it, wearing a cropped black windbreaker with retroreflective silver piping down both sleeves, squared stage-trained posture, dead in-ear monitors around her neck with one earpiece in and one dangling. Head turned slightly, mid-motion, caught between one thing and the next. Behind her, far out of focus, wet pavement and the low dark shape of a car. Fine grain, slight vignetting, no HDR, no glow, no lens flare.
>
> *[negative block]* · Aspect ratio 2:3

## Y3 — ENCORE four-view

> Cinematic photoreal still, vehicle reference sheet. Four views of the same vehicle in one frame on a plain flat gray backdrop, evenly spaced, identical lighting: front three-quarter, rear three-quarter, full side profile, and straight-on front. Even soft daylight, low contrast, desaturated. Subject: a stripped compact hatchback with a low wide wedge silhouette, matte black with tape-patched panels, retroreflective silver chevron striping salvaged from highway signs running across both doors and the tailgate, gutted interior visible through bare glass with an exposed welded roll cage, one bucket seat and a mismatched welded-in rear bench from a different car, a tubular roof frame carrying four chrome PA horn flares aimed forward and outward, no window mesh, no armor plating, wide low-profile tires, ride height dropped. Fast, fragile, loud. Fine grain, no HDR, no glow.
>
> *[negative block]* · Aspect ratio 16:9

## Y4 — ENCORE cockpit
*(attach the chosen Y3)*

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field. Overcast Pacific Northwest daylight through the windshield — soft, diffuse, low-contrast, gray-blue. Desaturated palette; the only bright element is retroreflective silver-white. Camera inside the vehicle, over the wheel, looking forward. A small suede-wrapped racing steering wheel across the bottom of frame. Stripped dashboard, bare metal, exposed wiring loomed and taped, a single aftermarket tachometer, a toggle-switch panel with one large guarded red switch clearly separate from the others. Welded roll cage tubing crossing the A-pillars. Bare clean windshield with no mesh — wide open view. Beyond the glass, wet empty city street under flat gray sky. A dead wireless handheld microphone clipped to the cage tube at the right edge of frame. Fine grain, slight vignetting, no HDR, no glow, no lens flare.
>
> *[negative block]* · Aspect ratio 2:3

---

## Group shots — generate last, after all singles are locked
*(attach all locked refs)*

## G1 — the three vehicles, convoy order
*(attach locked vehicle sheets: Pink Menace exterior, Ledger four-view, Encore four-view)*

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. Fine grain, slight lens vignetting, no HDR, no glow, no lens flare. Camera at roadside, slightly low, looking along a wet four-lane arterial. Front three-quarter of all three vehicles in staggered convoy formation on wet pavement under flat gray overcast. Leading: a Baja-converted VW Beetle in faded matte pink with oxidation, riveted raw steel plating over the door and rear quarter panel, welded steel mesh cages over every window and the windshield, a black tube bull bar with a wide flat plow blade, oversize knobby tires on chrome slot wheels. Second: an ex-transit cutaway shuttle bus, a tall square passenger box on a van nose, faded green and white transit livery ghosting under gray primer, plate steel skirting the lower body, expanded metal mesh over every side window, a welded bar cage over the windshield with a cut wiper slot, oversize convex west-coast mirrors on long arms on both sides, an amber dot-matrix destination sign above the windshield. Trailing: a stripped compact hatchback with a low wide wedge silhouette, matte black with tape-patched panels, retroreflective chevron striping salvaged from highway signs across both doors and the tailgate, a roof frame carrying four chrome PA horn flares, no window mesh and no armor. Three completely distinct silhouettes — round, box, wedge — immediately readable at thumbnail size. Wet empty four-lane road, bare maples, flat gray sky. Each vehicle keeps its own signature accent: faded cranberry on the Beetle, transit amber on the shuttle, retroreflective silver-white on the hatchback. Group-shot exception: three vehicles, three accents, each locked to its owner.
>
> *[negative block]* · Aspect ratio 16:9

Use G1 as a silhouette test. If you can't tell the three apart at thumbnail size in a mirror, the vehicle designs failed and it's cheaper to fix now than at card 90.

---

## The negative block (paste into every prompt above)

> No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No gore, no wounds, no blood on skin, no corpses. No text, no captions, no watermarks, no UI overlay. No crowds. No firearms. No anime, no illustration, no painterly rendering, no 3D render look — this is a photograph.

## Reference map to update in `03` once locked

| Asset | File to save as |
|---|---|
| Deac turnaround | `ref_deac_sheet.png` |
| Deac portrait | `ref_deac.png` |
| Ledger four-view | `ref_ledger_sheet.png` |
| Ledger cockpit | `ref_ledger_cockpit.png` |
| Yuna turnaround | `ref_yuna_sheet.png` |
| Yuna portrait | `ref_yuna.png` |
| Encore four-view | `ref_encore_sheet.png` |
| Encore cockpit | `ref_encore_cockpit.png` |
| Convoy silhouette test | `ref_convoy.png` |

Ali face / exterior locks exist. The Menace **cabin** lock does not — `ref_cockpit.jpg` is the poisoned tablet still. Candidate plate (not promoted): `refs/ref_menace_cabin_candidate.png` (take 16). Claude muted-read PASS required before this becomes the live interior. See `refs/CANDIDATE_MENACE_CABIN.md`.

## M4 — PINK MENACE cabin (CANDIDATE — do not treat as locked)

Pinned: flat painted-metal period dash · single instrument nacelle · nacelle angled away (no glyphs) · unbranded wheel · manual floor shifter, ball knob · `pedal_count: 3` · coarse Menace panel mesh (not Encore’s fine full-windshield grid) · no place for a screen.

> Cinematic photoreal still. 35mm full-frame equivalent, f/2.8, cabin sharp. Overcast Pacific Northwest daylight through the windshield — soft, diffuse, low-contrast, gray-blue. Desaturated palette; the only saturated color is cracked faded pink. Camera inside the Baja Beetle, slightly offset over an unbranded worn black leather wheel (plain hub, no logo, no VW roundel), looking forward. A flat painted-metal dash of the period — one continuous Type 1 shelf, no recess, no tablet bay. A single instrument nacelle, angled away from the camera so no glyphs render. A manual floor shifter with a black ball knob on the tunnel. Three pedals visible: clutch, brake, accelerator. Coarse Menace panel mesh — thick welded panels, large openings — over intact glass; not a fine full-windshield grid. Wet empty street beyond the panels. Empty plate: no person, no cats. No tablet, no touchscreen, no infotainment — the dash has nowhere to put one.
>
> *[negative block + MENACE_CABIN_NEGATIVES + DAYLIGHT_NEGATIVE]* · Aspect ratio 2:3 / tool 3:4
