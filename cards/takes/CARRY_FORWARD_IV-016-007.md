# Carry-forward checks — IV-016 yellow curb / IV-007 weather composition

Report only. No reshoot. No merge. No composition fix.

Source stills pulled from the seed / weather-regen branches for inspection; not added to this PR's reference pool.

---

## A. IV-016 take-17 — yellow curb vs card JSON

**Live seed:** `cards/takes/IV-016-take-17.png` (PR #111).  
**Card JSON inspected:** latest `cards/IV-016.json` on `cursor/seed-iv-016-take-17-ce21`.

Take-17 stages the Ledger on a downtown curb with a **painted yellow** strip along the near pavement edge.

| JSON field | Value | Parking-legality? |
|---|---|---|
| `source.psdp_skill` | `n/a` | no |
| `source.dol_section` | `n/a` | no |
| `source.teaching_target` | Deac returns: parked in sight, Mya on the dash because the Ledger is still, he does not get out | no curb-color / loading-zone rule |
| `image_brief.read` | the bus is parked; the cat is loafed on the dash; the door is shut | parked / cat / door |
| `image_brief.foreground` | wet downtown curb and **a strip of paint** | paint is named; color and legality are not |
| `image_brief.subject` | Ledger parked at the curb, destination sign dark, Mya a brown loaf on the dash | no legality |
| `decision` / options | dossier — none | — |

**Verdict:** card JSON does **not** teach parking legality or loading-zone rules. A yellow curb does not argue against the lesson. **No reshoot.**

Accepted residuals (unchanged): more front ¾ than true `POV_ROADSIDE_PROFILE`; cat sitting up rather than loafed; Deac silhouette not eyeline-to-cat. Out-of-carrier dash cat — studio `ref_mya.jpg` only (do not attach grate plates).

Prior note on PR #111 (`0f194bc`) reached the same conclusion. This check re-read the JSON independently and agrees.

---

## B. IV-007 weather regen — take-28 / take-30 vs seeded take-25

**Approved composition:** take-25 (PR #107 seed; Claude muted-read PASS).  
**Weather regen:** PR #114 (`cursor/regen-iv-007-weather-ddb3`) take-28 and take-30.  
**Later seed:** PR #119 take-30 as live still.

A weather regen must not silently reframe an approved card. Pixel comparison:

### Take-25 (seeded / approved)

- Deep recession down a foggy wet one-way: street is the center mass.
- **Two spatial groups:** `TRANSIT ONLY` on a **distant left** pole over the empty left of the frame; `ONE WAY` + `NO TURN ON RED` + the signal clustered on a **near right** pole.
- Stop line across the lower frame.
- Fog canyon, towers as tone, little brick detail.
- Matches brief geometry: TRANSIT ONLY over the LEFT of the FRAME; general pavement RIGHT.

### Take-28 (weather regen)

- **Different photograph.** Tight pole portrait: all three faces + the signal stacked on **one near pole**.
- No distant left transit-over-lane.
- Building fills the right. No fog recession.
- The transit-lane spatial read is gone.

### Take-30 (weather regen / later seed)

- Two-pole street, but **not take-25's frame**.
- `TRANSIT ONLY` is a **mid-near left** sign on its own pole (large, equal weight), not a far-left face over an empty lane.
- Brick blocks both sides; more architecture, less fog; camera lower/wider.
- Stop line still present. Letter doubling (`TRANSITONLYLY`, `NOTURNONREDDED`, `ONEWAYWAY`) persists — same class as take-25, not a weather-only change.

**Verdict:** take-28 and take-30 are **materially different compositions** from approved take-25. The weather regen reframed the card (pole grouping, camera distance, left-lane recession). Documented only — not fixed, not merged, not reseeded from this PR.
