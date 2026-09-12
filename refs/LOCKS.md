# Locked references

Never mix panels across takes. Winners only.

| Asset | Winner | File | Notes |
|---|---|---|---|
| Ali portrait | lock sheet | `ref_ali2.png` | Wire-rim rounds, cranberry lattice braid, gold hoop / nose ring, raglan hoodie. Canon face. Do not mix with `ref_ali1.jpg` frames. |
| Pink Menace exterior | lock sheet | `ref_car_exterior.jpg` | Silhouette and build only — plow, mesh, riveted door plate, knobbies. The salt-flat sunset in this frame is **not** the game's lighting. Lossless copy: `ref_car_exterior.png`. **Plow authority:** `ref_car_nose_plow.png` (take 8). |
| Pink Menace nose plow | take 8 | `ref_car_nose_plow.png` | Claude muted-read **PASS** (overflow d748b5d7) on PR #120 take 8. Authority full-width nose-mounted bull-bar blade; clean flanks. Exact promote of `refs/candidates/nose-plow-fullwidth-take-8.png`. Take-2 / runner-up **FAIL** — out of the reference pool. Old take-5 plate (PR #69) superseded — out of the pool. `diag_nose_plow_front` is not a ref. |
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
| Encore cockpit | Y4 b-take-2 | `ref_encore_cockpit.png` | Locked from PR #113 `cards/takes/Y4-cockpit-rerun-b-take-2.png` (Claude muted-read PASS 12 Sep 2026). Match this cab: moulded dash intact, handheld mic on the right cage tube at take-1 height, two pedals (wide brake + narrow accel), empty floor left of brake, no clutch, no floor shifter. Y4 take 1 (`85bd45ee`, stripped tub) is superseded — not in the generator pool. b-take-1 FAIL (tighter footwell crop only) stays in the takes pool on PR #113; do not promote or attach. |
| The Quiet — register lock | A3 take 3 | `ref_quiet.png` | Attach on every Quiet compile. Filthy, slack-shouldered, head canted, doing nothing, seen through dirty glass. Wrongness of posture and stillness — not damage. Same file as `ref_quiet_a3.png`. |
| Quiet plates | probe keeps | `ref_quiet_a1.png` `ref_quiet_a2.png` `ref_quiet_a3.png` `ref_quiet_a4.png` `ref_quiet_a5.png` | A1 take 3 still, facing away. A2 take 1 head tilt. A3 take 3 the register. A4 take 1 lot, spread, not converging. A5 take 3 the lunge — near-legible, once in the game. A1, A2, A4 are reference, not card art. |
| Gracie studio portrait | appearance lock | `ref_gracie.jpg` | **Appearance authority for Gracie.** Orange/ginger tabby, pink nose, amber eyes, cream chest. Studio wins over any in-carrier grate crop. |
| Mya studio portrait | appearance lock | `ref_mya.jpg` | **Appearance authority for Mya.** Brown mackerel tabby, dark nose, green eyes, hard-striped forehead, heavier. Studio wins over any in-carrier grate crop. |
| Cat in-carrier — ginger | IV-028 take 70 crop | `ref_cat_ginger.png` | In-carrier framing only (PR #117 / #118). Wire grate baked into the plate. Coat = Gracie. Attach **alongside** `ref_gracie.jpg`, never instead. Studio wins if they disagree. Do not attach on out-of-carrier frames. |
| Cat in-carrier — mackerel | IV-028 take 70 crop | `ref_cat_mackerel.png` | In-carrier framing only (PR #117 / #118). Wire grate baked into the plate. Coat = Mya. Attach **alongside** `ref_mya.jpg`, never instead. Studio wins if they disagree. Do not attach on out-of-carrier frames. |
| Ribbon elevated deck | take 4 | `ref_ribbon_deck.png` | Claude muted-read **PASS** (image-review chat) on PR #149 take 4 — not take 2. Streetlight standards along the deck for V-013 dusk grade. Exact promote of `refs/candidates/ribbon-deck-take-4.png`. `sha256:889a6d98409b4992eb4fee3c18421ed4934ead494b9c8b9c15334365ff7d823c`. Serves V-002–V-005, V-012 (V-013 shoulder/dusk). Continuity token `ribbon_deck`. |
| Ribbon tractor-trailer | take 1 | `ref_ribbon_rig.png` | Claude muted-read **PASS** (image-review chat) on PR #149 take 1 — not take 2. Period-aged, no legible livery, rain/spray, passenger car at right scale, west-coast mirrors for V-006. Exact promote of `refs/candidates/ribbon-rig-take-1.png`. `sha256:939b0c29e60d52c0945d7dd1abcf6eebbf43c0b8dcc3c1b0493eeb39b890148e`. Serves V-006, V-007. Continuity token `ribbon_rig`. Take-2 FAIL (car too far / hero angle / faint red markings) — do not attach. |

Ali face: prefer `ref_ali2.png` (wire-rim rounds + raglan hoodie). `ref_ali1.jpg` has thick black frames — do not mix.

## Pink Menace plow — authority (take 8)

The Menace plow is a **standard full-width nose-mounted bull-bar blade** on the black-tube bull bar. Clean flanks — nothing on the sides. Full-width IS canon. Do **not** revise toward an asymmetric or side-mounted blade.

**Live plate:** `refs/ref_car_nose_plow.png` — exact bytes of PR #120 take 8. Claude muted-read PASS, overflow d748b5d7.

Out of the reference pool (winners only):

- PR #120 take 2 / `ref_car_nose_plow_candidate_runnerup.png` — **FAIL**. Do not attach.
- Old take-5 live plate (PR #69) — superseded. Do not attach those bytes.
- `refs/diag_nose_plow_front.png` (PR #116) — diagnostic only. Not a lock. Not a compile attachment. Do not promote.

## Cat identity plates — studio wins, in-carrier only (PR #118)

Studio portraits (`ref_gracie.jpg` / `ref_mya.jpg`) remain the appearance authority for Gracie and Mya. `ref_cat_ginger.png` and `ref_cat_mackerel.png` are in-carrier framing references only — attach alongside studio refs, never instead of them. If a compile would pull both and they disagree, studio wins.

Scope the grate plates to in-carrier frames only. Do **not** attach them to out-of-carrier frames (e.g. Mya on the dash in IV-016) or the generator may ghost mesh onto the face.

- **Mya** = mackerel → `ref_cat_mackerel.png`
- **Gracie** = ginger → `ref_cat_ginger.png`

Art regen is paused pending daughter feedback. Do not generate new stills from these plates until that pass.

## WAVE — Act V Ribbon plates (2026-09-12)

Claude locked three NEW plate briefs. Deck + rig promoted after muted-read. Workzone still candidates — both submitted takes FAIL (longitudinal cone line, not a diagonal pinch). Do **not** copy a live `refs/ref_ribbon_workzone.png`. Do **not** attach `ribbon_workzone` in `pack/09_REF_MAP.json` or compile-prompt until a later muted-read PASS.

```
# ref_ribbon_deck      take-4   sha 889a6d98409b4992eb4fee3c18421ed4934ead494b9c8b9c15334365ff7d823c  PROMOTED. Streetlight standards. Unnamed corridor.
# ref_ribbon_rig       take-1   sha 939b0c29e60d52c0945d7dd1abcf6eebbf43c0b8dcc3c1b0493eeb39b890148e  PROMOTED. Period tractor-trailer. Scale + mirrors.
# ref_ribbon_workzone  take-__  sha ________  Ribbon work zone. MUTCD orange exempt from world grade. NOT PROMOTED.
```

Pool: `refs/candidates/ribbon-*-take-N.png` plus closest/runner copies `refs/ref_ribbon_*_candidate.png`. Workzone wave C closest `ribbon-workzone-c-take-1.png` / runner `c-take-2.png` — muted-read only, not live. Brief: `refs/CANDIDATE_RIBBON.md`.

