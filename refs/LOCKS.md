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
| Encore cockpit | Y4 take 1 | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Glass may read as missing — compiler still forces intact glass on exteriors. Over-the-wheel windshield plate — **footwell out of frame; do not read pedal count from this shot.** Cockpit lock authority remains this take. Y4 take 7 supplied rain-glass / cluster / switch / cage continuity cues during footwell generation only — take-7 bytes were never promoted on main. |
| Encore footwell | Y4/Encore footwell take 6 | `ref_encore_footwell.png` | Human-verified PASS by Claude 2026-09-11. Same file as `cards/takes/encore-footwell-take-6.png`. **pedal_count: 2.** Wide treadplate brake + narrow ribbed accelerator; empty floor left of brake; no clutch. Dark painted heel zone — no Menace pink/magenta mat. Empty plate: no foot. Not a card still. Cockpit authority remains Y4 take 1 (`ref_encore_cockpit.png`). Do not treat IV-001-brake take-21 (or any IV-001-brake take) as this plate. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Encore footwell — locked plate

Y4 take 1 / `ref_encore_cockpit.png` is the cockpit lock (over-the-wheel windshield plate). Pedal count cannot be read from it. Dedicated empty footwell takes were generated against Y4 take 7 rain-glass / cluster / switch / cage continuity cues (`cards/takes/Y4-take-7.png`); those take-7 bytes were never promoted as the cockpit lock on main. Claude locked **automatic / two pedals only** before this plate: wide treadplate brake + narrow ribbed accelerator; empty floor left of the brake; no clutch.

Human-verified PASS by Claude 2026-09-11. Winner: `cards/takes/encore-footwell-take-6.png` → `refs/ref_encore_footwell.png`.

Do not treat IV-001-brake take-21 (failed generation) or any IV-001-brake card take as this plate. Those are cover-the-brake stills, not the pedal-box lock.

| Take | File | pedal_count | Notes |
|---|---|---|---|
| 1 | `cards/takes/encore-footwell-take-1.png` | 2 | Correct layout. Invents a crisp unused rectangular mat. |
| 2 | `cards/takes/encore-footwell-take-2.png` | 2 | Pedals too small / same width. Discard. |
| 3 | `cards/takes/encore-footwell-take-3.png` | 2 | Letterboxed; wheel in. Discard. |
| 4 | `cards/takes/encore-footwell-take-4.png` | 2 | Brake not a wide treadplate. Discard. |
| 5 | `cards/takes/encore-footwell-take-5.png` | 2 | Mini showroom mat. |
| **6 (LOCKED)** | `cards/takes/encore-footwell-take-6.png` | **2** | Human-verified PASS by Claude 2026-09-11. Wide diamond brake + narrow ribbed gas. Empty floor left of brake. Painted heel zone, no pink mat. |
| 7 | `cards/takes/encore-footwell-take-7.png` | 2 | Runner-up — slightly more floor scuff. |
| 8 | `cards/takes/encore-footwell-take-8.png` | 2 | Same layout; pedals a bit smaller. |

**Residual on take 6:** horizontal cage bar across the dash is extra vs Y4 take 7; pedals sit mid-dash rather than a tight pedal-box crop; floor is cleaner than a gutted race cab. Pedal count and identities are unambiguous.

Do not seed live. Do not run IV-001-brake regen in this lock — Brad unlocks that after LOCKS lands.
