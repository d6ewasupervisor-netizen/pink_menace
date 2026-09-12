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
| Gracie studio portrait | appearance lock | `ref_gracie.jpg` | **Appearance authority for Gracie.** Orange/ginger tabby, pink nose, amber eyes, cream chest. Studio wins over any in-carrier grate crop. |
| Mya studio portrait | appearance lock | `ref_mya.jpg` | **Appearance authority for Mya.** Brown mackerel tabby, dark nose, green eyes, hard-striped forehead, heavier. Studio wins over any in-carrier grate crop. |
| Cat in-carrier — ginger | IV-028 take 70 crop | `ref_cat_ginger.png` | In-carrier framing only (PR #117). Wire grate baked into the plate. Coat = Gracie. Attach **alongside** `ref_gracie.jpg`, never instead. Studio wins if they disagree. Do not attach on out-of-carrier frames. |
| Cat in-carrier — mackerel | IV-028 take 70 crop | `ref_cat_mackerel.png` | In-carrier framing only (PR #117). Wire grate baked into the plate. Coat = Mya. Attach **alongside** `ref_mya.jpg`, never instead. Studio wins if they disagree. Do not attach on out-of-carrier frames. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Cat identity plates — CONDITIONAL PROMOTE (PR #117)

Claude muted-read: promote `ref_cat_ginger.png` / `ref_cat_mackerel.png` **only** after these lines are written. Crop index lives on PR #117 (`refs/CAT_PLATES.md`). This file is the attachment authority. `pack/09_REF_MAP.json` is **not** rewritten — `gracie` → `ref_gracie.jpg`, `mya` → `ref_mya.jpg`. Do not swap grate crops in as compile locks.

### PRECEDENCE

Studio portraits (`ref_gracie.jpg` / `ref_mya.jpg`) remain the appearance authority for Gracie and Mya. `ref_cat_ginger.png` and `ref_cat_mackerel.png` are in-carrier framing references only — attach alongside studio refs, never instead of them. If a compile would pull both and they disagree, studio wins.

### SCOPE

Scope `ref_cat_ginger.png` and `ref_cat_mackerel.png` to in-carrier frames only. Both crops are shot through the wire grate; mesh is baked into the plate. Do NOT attach them to out-of-carrier frames (e.g. Mya on the dash in IV-016) or the generator may ghost mesh onto the face.

### IDENTITY MAPPING (coat → name)

Filenames stay coat-descriptive (ginger / mackerel), not name-based.

- **Mya** = mackerel (brown mackerel tabby, dark nose, green eyes, hard-striped forehead) → `ref_cat_mackerel.png`
- **Gracie** = ginger (orange/ginger tabby, pink nose, amber eyes) → `ref_cat_ginger.png`

### IV-018 gating

With the above written, these plates + `refs/ref_carrier.png` (charcoal, PR #110) are the gating set for IV-018. `ref_carrier.png` remains the charcoal lock. IV-028 take-72 olive stays discarded — never attach it.

### IV-016 residual

The dash cat in IV-016 take-17 is **Mya** (mackerel) per this mapping. That card is out-of-carrier — studio `ref_mya.jpg` only; do not attach the grate plates. Closes the identity residual on the parked-dash loaf.
