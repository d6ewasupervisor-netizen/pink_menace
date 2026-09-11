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
| Encore cockpit | Y4 take 1 | `ref_encore_cockpit.png` | Four PA horns, mic on the cage, guarded red switch. Takes 2 and 4 turned horns into spotlights. Glass may read as missing — compiler still forces intact glass on exteriors. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Pink Menace cabin — CANDIDATE (not promoted)

Claude has **not** muted-read PASS on this plate. Brad will muted-read with Claude next. Do **not** treat the candidate as human-verified. Do **not** swap `pink_menace_interior` off `ref_cockpit.jpg` in this PR.

| Role | File | Take | Notes |
|---|---|---|---|
| Closest (candidate) | `ref_menace_cabin_candidate.png` | 7 | Same bytes as `candidates/menace-cabin-take-7.png`. `sha256:b11425c8…`. Type 1 cracked faded-pink dash; worn three-spoke, blank hub (no VW roundel); single analog gauge, ticks only; welded square mesh; tunnel shifter; **no screen**. |
| Runner-up | `ref_menace_cabin_candidate_runnerup.png` | 8 | Fuller square mesh + rocker bank. Residual: gauge numerals. |

Variants: `refs/candidates/menace-cabin-take-1.png` … `take-8.png`. Brief: `refs/CANDIDATE_MENACE_CABIN.md`. Handoff: `refs/NEXT.md`.

**`ref_cockpit.jpg` is the poisoned interior** — desert GPS tablet, three-gauge gibberish, VW-ish hub. Same failure Claude named on IV-027 take-11 / take-19, IV-028 take-5. Keep it as the live `pink_menace_interior` attachment only until Claude PASSes take 7; then replace it (Encore cockpit / Ledger cockpit pattern) and stop attaching the old file.

After PASS, winners-table row should read:

| Asset | Winner | File | Notes |
|---|---|---|---|
| Pink Menace cabin | candidate take 7 (pending Claude) | `ref_menace_cabin.png` | **Do not write this row until Claude PASSes.** Dash, cluster, wheel, square mesh, shifter. No tablet / touchscreen. |

## Daylight lock (Act IV / non-night)

Wave-two (`cursor/wave-two-stills-batch2-724a`) had **no standing night negative**. `MASTER_STYLE` says overcast daylight, but IV-030 takes 5–6 compiled full night (blue-black city, streetlights). Night/dusk is Act VII. Compiler now appends `DAYLIGHT_NEGATIVE` unless `variation.time_of_day` is `night` / `dusk` / `dark_hours`. Dawn / morning / midday / afternoon stay daylight-class (IV-027 ice-at-dawn is pale winter light, not night).
