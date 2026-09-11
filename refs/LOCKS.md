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
| Encore four-view | **BLOCKED** — no glass winner | `ref_encore_sheet.png` | Y3 take 3 kept as failed history: open cabins on all four views. Bible: intact window glass, no mesh. Do not compile Encore exteriors. Glass rerun takes 5–10 below. Closest: take 9. Not locked. |
| Convoy silhouette | G1 take 2 | `ref_convoy.png` | Round / box / wedge reads at a glance. Only take that kept Encore's PA horns; 1, 3, 4 turned them into spotlights. Overcast PNW, no salt-flat bleed. |
| II-007 card art | take 2 | `../cards/II-007.png` | Amber lamps lit; enough pavement that the open left lane reads. Invented fallen tree is compiler drift — do not carry into later Kent cards. Takes 3–4 lit the reds/brakes and are unusable. |
| Ledger cockpit | D4 take 2 | `ref_ledger_cockpit.png` | Locked from `cards/takes/D4-take-2.png` (1 Sep 2026). Match this cab: worn three-spoke wheel, analog cluster, bar cage, thermos in the right cup, no clipboard on the mesh. Never the old poisoned cockpit. Never a Menace ref on Deac cards. |
| Encore cockpit | Y4 take 1 (glass at risk) | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Same open-cabin risk as the four-view — windshield may read as missing. Not a glass lock. Exterior compiles stay blocked independently. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Encore Y3 glass rerun (not locked)

Positive: intact window glass in all openings, no mesh, no bars, no open cabin. Negatives: no stripped glass, no open cabin, no missing windows, no roll-cage-only body. Prompt: `pack/07_CHARACTER_LOCK_PROMPTS.md` Y3 (glass clause rewritten; old "bare glass" wording was the failure). Compiler abort: `scripts/compile-prompt.js` throws on `encore` / Yuna exterior cameras until a winner is named here.

| Take | File | Glass | Notes |
|---|---|---|---|
| Y3 take 3 (old lock) | `ref_encore_sheet.png` | FAIL | Open cabins, all four views. History only. |
| Y3 take 5 | `ref_encore_sheet_y3_take5.png` | FAIL | Dark voids, cage in open air. |
| Y3 take 6 | `ref_encore_sheet_y3_take6.png` | FAIL / maybe tint | Darker window fills than take 3; no specular. Side horn count drops to one. |
| Y3 take 7 | `ref_encore_sheet_y3_take7.png` | FAIL | Golf silhouette, empty openings. |
| Y3 take 8 | `ref_encore_sheet_y3_take8.png` | FAIL | Front/side open. Horns became spotlights. |
| Y3 take 9 | `ref_encore_sheet_y3_take9.png` | CLOSEST — not locked | Studio reflection on the three-quarter windshield; side/rear read as dark tinted glass. Front-on windshield still a black void. Do not lock. |
| Y3 take 10 | `ref_encore_sheet_y3_take10.png` | FAIL | Front 3/4 reflection only; other views open. |

Encore exterior compiles stay **blocked** until a take passes visual check on all four views and this table names a winner.
