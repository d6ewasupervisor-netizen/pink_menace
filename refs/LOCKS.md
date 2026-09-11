# Locked references

Never mix panels across takes. Winners only.

| Asset | Winner | File | Notes |
|---|---|---|---|
| Ali portrait | lock sheet | `ref_ali2.png` | Wire-rim rounds, cranberry lattice braid, gold hoop / nose ring, raglan hoodie. Canon face. Do not mix with `ref_ali1.jpg` frames. |
| Pink Menace exterior | lock sheet + plow plate | `ref_car_exterior.jpg`, `ref_car_nose_plow.png` | `ref_car_exterior.jpg` = silhouette and build (salt-flat sunset is **not** game lighting). `ref_car_nose_plow.png` = Claude PASS take 5 (2026-09-11), overcast square plate. **Plow:** a full-width nose blade on the front bull bar; no flank-mounted blade. **Preserve:** welded mesh on side glass and windshield; riveted metal door panel; knobby tires on chrome wheels; faded pink + bare-metal body. Never attach `ref_car_rear_plow.jpg` / `ref_car_rear_plow.png` — out of the compile pool (caused flank-blade drift). Lossless exterior copy: `ref_car_exterior.png`. |
| Hand signals | lock plate | `ref_hand_signals.png` | Three panels from directly behind, LHD: arm out the window on the left side of the frame — straight (left), down (stop), bent up (right). Right flank closed, no arm. No labels. Reuse forever; do not improvise limb geometry. |
| Diagram language | style lock | `ref_diagram_style.png` | Optional. Overhead photoreal look. Ali diagrams attach `ref_car_exterior.jpg` and `ref_car_nose_plow.png` for Beetle build and nose plow. Deac diagrams attach `ref_ledger_sheet.png` and never a Menace ref. |
| Deac turnaround | D1 take 2 | `ref_deac_sheet.png` | Glasses on cord in all three panels; vest taped at the shoulder. |
| Deac portrait | D2 take 2 | `ref_deac.png` | Clipboard is the PSDP log; glasses on chest; amber vest only saturated color. |
| Yuna turnaround | Y1 take 6 | `ref_yuna_sheet.png` | First four takes put the braid on her left. Take 6: braid at her right temple, right IEM in, left dangling, platinum under-layer. |
| Yuna portrait | Y2 take 1 | `ref_yuna.png` | Right IEM in, left dangling; retroreflective piping flares; matches take-6 sheet. |
| Ledger four-view | D3 take 2 | `ref_ledger_sheet.png` | Oversize convex mirrors are the silhouette; amber destination sign with no readable text. |
| Encore four-view | Y3 take 3 | `ref_encore_sheet.png` | Wedge + four roof horns + chevrons; no mesh. All four takes stripped the glass — bible wants glass with no mesh. Silhouette still reads. Rerun before cockpit lock if glass matters. |
| Convoy silhouette | G1 take 2 | `ref_convoy.png` | Round / box / wedge reads at a glance. Only take that kept Encore's PA horns; 1, 3, 4 turned them into spotlights. Overcast PNW, no salt-flat bleed. |
| II-007 card art | take 2 | `../cards/II-007.png` | Amber lamps lit; enough pavement that the open left lane reads. Invented fallen tree is compiler drift — do not carry into later Kent cards. Takes 3–4 lit the reds/brakes and are unusable. |
| IV-026 card art | take 110 | `../cards/IV-026.png` | Owner (Tyson) override 2026-09-11: seed despite residual left-front corner stub on this away heading. Scene (distance + camera) accepted. **Full-width plate authority remains `ref_car_nose_plow.png`** for front/identity — do not treat the away-POV stub as the plow lock. |
| Ledger cockpit | D4 take 2 | `ref_ledger_cockpit.png` | Locked from `cards/takes/D4-take-2.png` (1 Sep 2026). Match this cab: worn three-spoke wheel, analog cluster, bar cage, thermos in the right cup, no clipboard on the mesh. Never the old poisoned cockpit. Never a Menace ref on Deac cards. |
| Encore cockpit | Y4 take 1 | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Glass may read as missing — compiler still forces intact glass on exteriors. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Pink Menace exterior — locked plate

`pink_menace_exterior` attaches `ref_car_exterior.jpg` and `ref_car_nose_plow.png` only.

**Plow:** a full-width nose blade on the front bull bar. No flank-mounted blade.

**Preserve on the plate and every compile:**

- welded mesh cages on side glass and windshield
- riveted metal door panel
- knobby tires on chrome wheels
- faded pink + bare-metal body treatment

`ref_car_rear_plow.jpg` and `ref_car_rear_plow.png` are **out of the compile pool**. Do not attach. Claude rejected that photo (left-flank blade / drift). PR #66 stays unmerged.

**IV-026 residual (documented, not a lock change):** live still is take 110 (`cards/IV-026.png`, copied from `cards/takes/IV-026-take-110.png`). Away POV may show a left-front corner stub. That stub is not the identity plate. Front/identity plow remains `ref_car_nose_plow.png` only.
