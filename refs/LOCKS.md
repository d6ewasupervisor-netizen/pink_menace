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
| Cat carrier | IV-028 take 70 crop | `ref_carrier.png` | Cropped from `cards/takes/IV-028-take-70.png` (Claude muted-read PASS, PR #108). Do not regenerate the scene. **Charcoal / near-black hard-shell**, not olive. Wire grate door with a visible latch block. Top-run webbing strap across the shell. Both cats' faces at the grate are in the source crop; color + hardware are the lock. **IV-028 take 72 (olive) is discarded** — not superseded-but-available. Never attach take-72. |
| Encore cockpit | Y4 take 1 — REJECTED as plate | `ref_encore_cockpit.png` | Live bytes are still Y4 take 1 (`sha256` prefix `85bd45ee`). **Rejected as cockpit authority:** stripped bare-metal open-air interior contradicts seeded Encore card frames (IV-002). Do not attach this plate as the interior reference for a cockpit rerun. Do not promote Y4 take 7 (floor shifter vs automatic two-pedal lock). Rerun candidates: `cards/takes/Y4-cockpit-rerun-take-*.png`. **Closest for Claude muted-read: take 3.** Live file is not overwritten. Encore = automatic, two pedals, no clutch, no floor shifter, LHD. Attach `ref_encore_sheet.png` (PR #14 / Y3 take 12 glass lock) on that compile. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Carrier lock (charcoal)

`refs/ref_carrier.png` is the only carrier in the generator pool.

Locked attributes:
- charcoal / near-black hard-shell carrier, **not olive**
- wire grate door with a visible latch block
- top-run strap across the shell

IV-028 take 72 (olive drab) is **discarded**. It leaves the generator pool. It is not superseded-but-available. Path: `cards/takes/IV-028-take-72.png` — listed in `pack/09_REF_MAP.json` `discarded` and `cards/takes/DISCARDED.md`. Do not attach it. Same brief coin-flipped charcoal (take 70) and olive (take 72); IV-018 will flip again if olive stays attachable.

## Plate PRs and discarded takes

Plate locks travel in their own PR(s). Do not bundle plate promotions with card-art stills.

A discarded take is removed from the generator pool. A superseded take may stay in `cards/takes/` as review history but is not an attachment. Discarded ≠ superseded-but-available.
