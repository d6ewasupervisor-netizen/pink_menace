# Locked references

Never mix panels across takes. Winners only.

| Asset | Winner | File | Notes |
|---|---|---|---|
| Ali portrait | lock sheet | `ref_ali2.png` | Wire-rim rounds, cranberry lattice braid, gold hoop / nose ring, raglan hoodie. Canon face. Do not mix with `ref_ali1.jpg` frames. |
| Pink Menace exterior | lock sheet | `ref_car_exterior.jpg` | Front three-quarter silhouette and build. **nose_plow: standard plate equipment** — wide flat blade on the black tube bull bar at the far leading / nose end. Not scene-optional. Not left-flank / side-mounted. Also mesh, riveted door plate, knobbies. The salt-flat sunset in this frame is **not** the game's lighting. Lossless copy: `ref_car_exterior.png`. Compiles always attach `ref_car_rear_plow.jpg` with this file so behind / left-rear / `POV_DIAGRAM` shots can see the blade at the far nose. |
| Pink Menace rear plow | Tyson plate | `ref_car_rear_plow.jpg` | Rear three-quarter salt-flat plate. Rear mesh nearer the camera; **wide flat blade on the black tube bull bar readable at the far leading / nose end.** Rear-angle / left-rear / `POV_DIAGRAM` plow authority — this is the plate IV-026-class shots must see. Salt-flat golden hour is **not** the game's lighting. Lossless copy: `ref_car_rear_plow.png`. |
| Pink Menace four-view | sheet take 1 | `ref_car_sheet.png` | Same file as `cards/takes/menace-sheet-take-1.png`. Gray-studio four-view archive. Rear-angle plow authority is now `ref_car_rear_plow.jpg`, not this sheet. Takes 2–3 put a residual blade on the rear/flank — discard. Take 4 runner-up. |
| Hand signals | lock plate | `ref_hand_signals.png` | Three panels from directly behind, LHD: arm out the window on the left side of the frame — straight (left), down (stop), bent up (right). Right flank closed, no arm. No labels. Reuse forever; do not improvise limb geometry. |
| Diagram language | style lock | `ref_diagram_style.png` | Optional. Overhead photoreal look. Ali diagrams attach `ref_car_exterior.jpg` and `ref_car_rear_plow.jpg` for Beetle build and rear-angle plow. Deac diagrams attach `ref_ledger_sheet.png` and never a Menace ref. |
| Deac turnaround | D1 take 2 | `ref_deac_sheet.png` | Glasses on cord in all three panels; vest taped at the shoulder. |
| Deac portrait | D2 take 2 | `ref_deac.png` | Clipboard is the PSDP log; glasses on chest; amber vest only saturated color. |
| Yuna turnaround | Y1 take 6 | `ref_yuna_sheet.png` | First four takes put the braid on her left. Take 6: braid at her right temple, right IEM in, left dangling, platinum under-layer. |
| Yuna portrait | Y2 take 1 | `ref_yuna.png` | Right IEM in, left dangling; retroreflective piping flares; matches take-6 sheet. |
| Ledger four-view | D3 take 2 | `ref_ledger_sheet.png` | Oversize convex mirrors are the silhouette; amber destination sign with no readable text. |
| Encore four-view | Y3 take 3 | `ref_encore_sheet.png` | Wedge + four roof horns + chevrons; no mesh. All four takes stripped the glass — bible wants glass with no mesh. Silhouette still reads. Rerun before cockpit lock if glass matters. |
| Convoy silhouette | G1 take 2 | `ref_convoy.png` | Round / box / wedge reads at a glance. Only take that kept Encore's PA horns; 1, 3, 4 turned them into spotlights. Overcast PNW, no salt-flat bleed. |
| II-007 card art | take 2 | `../cards/II-007.png` | Amber lamps lit; enough pavement that the open left lane reads. Invented fallen tree is compiler drift — do not carry into later Kent cards. Takes 3–4 lit the reds/brakes and are unusable. |
| Ledger cockpit | D4 take 2 | `ref_ledger_cockpit.png` | Locked from `cards/takes/D4-take-2.png` (1 Sep 2026). Match this cab: worn three-spoke wheel, analog cluster, bar cage, thermos in the right cup, no clipboard on the mesh. Never the old poisoned cockpit. Never a Menace ref on Deac cards. |
| Encore cockpit | Y4 take 1 | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Glass may read as missing — compiler still forces intact glass on exteriors. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Pink Menace exterior — locked plate

The nose plow is standard Menace plate equipment, same class as Encore `pedal_count: 2`. Every `pink_menace_exterior` compile carries it. Not per-card. Not scene-optional.

**Required:** wide flat plow blade mounted on the black tube bull bar at the far leading / nose end of the Beetle.

**Forbidden:** missing plow; left-flank-only or side-mounted blade (IV-026 take 5 residual); thin bar without a blade (IV-026 take 15 residual).

A text lock is not enough. Compiles must **see** the plow on the attached plate.

| File | What the model sees |
|---|---|
| `ref_car_exterior.jpg` | Front 3/4 hero. Silhouette and build (plow, mesh, riveted door plate, knobbies). Salt-flat sunset is **not** the game's lighting. |
| `ref_car_rear_plow.jpg` | Rear 3/4. Wide flat blade on the black tube bull bar at the far leading / nose end — the IV-026 / behind / left-rear camera. Salt-flat golden hour is **not** the game's lighting. Always attach with the front 3/4. |

Do not attach a rear-mounted plow plate. Dedicated rear takes 4–5 put the blade on the engine lid — that is the wrong end. `ref_car_rear_plow.jpg` is a rear *camera* of a *nose* plow, not a plow on the tail.
