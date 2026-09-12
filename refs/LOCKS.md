# Locked references

Never mix panels across takes. Winners only.

| Asset | Winner | File | Notes |
|---|---|---|---|
| Ali portrait | lock sheet | `ref_ali2.png` | Wire-rim rounds, cranberry lattice braid, gold hoop / nose ring, raglan hoodie. Canon face. Do not mix with `ref_ali1.jpg` frames. |
| Pink Menace exterior | lock sheet | `ref_car_exterior.jpg` | Silhouette and build only — plow, mesh, riveted door plate, knobbies. The salt-flat sunset in this frame is **not** the game's lighting. Lossless copy: `ref_car_exterior.png`. |
| Hand signals | lock plate | `ref_hand_signals.png` | Three panels from directly behind, LHD: arm out the window on the left side of the frame — straight (left), down (stop), bent up (right). Right flank closed, no arm. No labels. Reuse forever; do not improvise limb geometry. |
| Diagram language | style lock | `ref_diagram_style.png` | Optional. Overhead photoreal look. Ali diagrams attach `ref_car_exterior.jpg` for Beetle build. Deac diagrams attach `ref_ledger_sheet.png` and never a Menace ref. |
| Deac turnaround | D1 take 2 | `ref_deac_sheet.png` | Glasses on cord in all three panels; vest taped at the shoulder. |
| Deac portrait | D2 take 2 | `ref_deac.png` | Clipboard is the PSDP log; glasses on chest; amber vest only saturated color. |
| Yuna turnaround | Y1 take 6 | `ref_yuna_sheet.png` | First four takes put the braid on her left. Take 6: braid at her right temple, right IEM in, left dangling, platinum under-layer. |
| Yuna portrait | Y2 take 1 | `ref_yuna.png` | Right IEM in, left dangling; retroreflective piping flares; matches take-6 sheet. |
| Ledger four-view | D3 take 2 | `ref_ledger_sheet.png` | Oversize convex mirrors are the silhouette; amber destination sign with no readable text. |
| Encore four-view | Y3 take 3 | `ref_encore_sheet.png` | Wedge + four roof horns + chevrons; no mesh. All four takes stripped the glass — bible wants glass with no mesh. Silhouette still reads. Rerun before cockpit lock if glass matters. |
| Convoy silhouette | G1 take 2 | `ref_convoy.png` | Round / box / wedge reads at a glance. Only take that kept Encore's PA horns; 1, 3, 4 turned them into spotlights. Overcast PNW, no salt-flat bleed. |
| II-007 card art | take 2 | `../cards/II-007.png` | Amber lamps lit; enough pavement that the open left lane reads. Invented fallen tree is compiler drift — do not carry into later Kent cards. Takes 3–4 lit the reds/brakes and are unusable. |
| Ledger cockpit | D4 take 2 | `ref_ledger_cockpit.png` | Locked from `cards/takes/D4-take-2.png` (1 Sep 2026). Match this cab: worn three-spoke wheel, analog cluster, bar cage, thermos in the right cup, no clipboard on the mesh. Never the old poisoned cockpit. Never a Menace ref on Deac cards. |
| Pink Menace cabin | take 16 (human-verified) | `ref_menace_cabin.png` | Claude muted-read PASS 2026-09-11 on PR #73 candidate take 16. Promoted bytes: `sha256:3576270ee32f8759060cf63cfdf7a74e4ed32308f3907696bce0de4ef24c5a46`. Flat painted-metal period dash (no screen bay); single nacelle; unbranded wheel; coarse panel mesh. **Menace = manual, floor shifter, three pedals.** `ref_cockpit.jpg` is the poisoned interior (tablet / gibberish cluster / VW-ish hub) — out of the compile pool. Do not attach it. **IV-028 brief cut (2026-09-12):** carrier CLOSE — strap, latch, both faces at the grate, ordinary street through the glass. Footwell / pedals / boot / hover are out of that card. Do not attach `ref_brake_cover.png` or `ref_encore_footwell.png` on IV-028. Cabin plate only, for glass/dash/mesh. |
| Encore cockpit | Y4 take 1 | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Glass may read as missing — compiler still forces intact glass on exteriors. Over-the-wheel windshield plate — footwell out of frame; do not read pedal count from this shot. **Encore = automatic, two pedals, no clutch** (already locked via footwell take-6 / this cockpit authority). **Y4 take 7 is not cockpit authority** — floor shifter conflicts with the two-pedal footwell. Leave take-1 authority work to PR #74; do not promote take 7. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Pedal boxes — adjacent, deliberate (not a contradiction)

| Vehicle | Transmission | Pedals | Shifter | Authority |
|---|---|---|---|---|
| **Menace** | **manual** | **three** (clutch, brake, accelerator) | **floor shifter**, ball knob | Cabin take 16 / `ref_menace_cabin.png` — human-verified 2026-09-11 |
| **Encore** | **automatic** | **two** (brake + accelerator; **no clutch**) | no manual floor shifter | Footwell take 6 (`ref_encore_footwell.png` on the footwell lock PR) + cockpit Y4 take 1. Do not lock Y4 take 7. |

These two lines are the pair. Menace three-pedal and Encore two-pedal are both correct.

## Daylight lock (Act IV / non-night)

Night and dusk are Act VII. Compiler appends `DAYLIGHT_NEGATIVE` unless `variation.time_of_day` is `night` / `dusk` / `dark_hours`. Dawn / morning / midday / afternoon stay daylight-class (IV-027 ice-at-dawn is pale winter light, not night). Wave-two IV-030 takes 5–6 went full night because there was no standing night negative.
