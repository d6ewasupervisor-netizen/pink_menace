# Candidate Menace cabin plate — NOT PROMOTED

Claude confirmed the **plate plan** (2026-09-11). Claude must still **PASS** a
muted-read on the pixels before anyone wires this into `pink_menace_interior`,
the winners table in `refs/LOCKS.md`, `pack/09_REF_MAP.json`
`locks.pink_menace_interior`, the live pack/03 PINK MENACE INTERIOR string, or
`scripts/compile-prompt.js` attachment / `POV_COCKPIT` path.

This PR is generate-plus-gate. Do not promote. Do not regen IV-027 / IV-028 /
IV-030 until Brad muted-reads with Claude and gets PASS. Do not reopen IV-026
(take-110 stays seeded on PR #72).

## Why a new plate

`refs/ref_cockpit.jpg` is the poisoned Menace interior. Claude's muted-read
on IV-027 take-11 / take-19, IV-028 take-5, and IV-030 named the same invented
cabin: pink-painted modern dash, three-gauge cluster with gibberish text,
VW-roundel wheel, rectangular touchscreen / infotainment. That is the old
cockpit lock. The compiler improvises because no Menace interior plate exists
in the Encore-cockpit / Ledger-cockpit sense.

Card JSON is sole art brief authority when it conflicts with pack notes.

## Pinned plate brief (Claude 2026-09-11) — encode this

### Positive layout (not just negatives)

These objects **are** the cabin. The dash is a continuous painted-metal shelf,
so a screen has nowhere to live and falls out naturally.

| Object | What it is |
|---|---|
| Dash | Flat painted metal dash of the period (Type 1 shelf). No recess, no tablet bay, no rectangle. |
| Cluster | **Single instrument nacelle.** One housing only. |
| Wheel | Unbranded — worn leather, plain hub, no logo, no VW roundel. |
| Shifter | Manual floor shifter, ball knob on the tunnel. |
| Pedals | **Three** — clutch, brake, accelerator. Beetle-plausible. (`pedal_count: 3`) |
| Mesh | Menace **coarser panel mesh** — thick welded panels, large openings. **Not** Encore’s fine full-windshield grid. **Not** a flyscreen. |

Explicitly no touchscreen / infotainment.

### Gauge treatment (pinned — do not leave unstated)

**Prefer (plate default):** the single nacelle is **angled away from the camera**
so no glyphs render. That is how we avoid gibberish-artifact fails.

**Alternate acceptable:** legible **period-correct** dials only (one nacelle).

Never a three-gauge modern cluster. Never invented numerals / "112.0" / GPS text.

On **card** compiles after promote: card JSON wins. If the brief names a
readable needle (`cluster at 0` on IV-028), show that one period-correct dial.
Otherwise keep the nacelle angled away.

### Shifter decision (pinned)

Menace is **manual**. Floor shifter, ball knob, **three pedals**. Take 5 showed
the ball-knob manual; it is Beetle-plausible. This is not Encore (`pedal_count: 2`).

## Pick

| Role | File | Take |
|---|---|---|
| Closest | `refs/ref_menace_cabin_candidate.png` | **16** |
| Runner-up | `refs/ref_menace_cabin_candidate_runnerup.png` | 10 |

Variants: `refs/candidates/menace-cabin-take-1.png` … `take-17.png`.
Prompt: `refs/candidates/menace-cabin.prompt.txt`.

Portrait 3:4. Attached while generating: `ref_car_exterior.jpg` plus earlier
cabin takes for continuity. **Did not attach `ref_cockpit.jpg`.**

`sha256` take 16: `3576270ee32f8759060cf63cfdf7a74e4ed32308f3907696bce0de4ef24c5a46`

## Takes

| Take | Call | Notes |
|---|---|---|
| 1–4 | discard | Fine or diamond mesh; two pedals; some gauge numerals. |
| 5 | continuity only | Ball-knob manual; Type 1 dash; speedo numerals; fine mesh. |
| 6–8 | discard | Fine or mixed mesh; two pedals. Take 7 was the prior closest (fine grid, two pedals). |
| 9 | discard | Single nacelle facing camera with numerals; fine mesh; two pedals. |
| **10** | **runner-up** | Coarse panel mesh; three pedals; ball-knob; flat dash; unbranded wheel; no screen bay. **Nacelle missing.** |
| 11–12 | discard | Coarse mesh; nacelle gone; pedal count weak. |
| 13–15, 17 | discard | Coarse mesh + three pedals; nacelle dropped again. |
| **16** | **closest** | Flat period dash (no screen bay); **single nacelle present**; unbranded wheel; ball-knob floor shifter; **three pedals**; **coarse panel mesh**; no touchscreen. |

## Residuals on take 16 (for Claude muted-read)

- Nacelle is **present** and single, but it still **faces** the camera rather than
  angling away. Face is small; glyphs do not read as text. Prefer-angled is not
  fully executed.
- Mesh is coarse thick welded grid (correct family) still spanning the
  windshield, not discrete armor panels.
- Dash paint is cleaner / more showroom than a beaten Baja.

Muted-read the plate must teach the **positive** cabin: flat painted-metal
period dash, one nacelle, unbranded wheel, floor shifter, three pedals,
coarse Menace panel mesh — and there is no place for a screen.

## After Claude PASS

Promote like PR #69 did for the nose-plow plate:

1. Copy take 16 → `refs/ref_menace_cabin.png`.
2. `pink_menace_interior`: `["ref_menace_cabin.png"]` only. Stop attaching `ref_cockpit.jpg`.
3. Ban or footnote `ref_cockpit.jpg` as the poisoned cockpit.
4. Swap pack/03 live PINK MENACE INTERIOR to the positive string in LOCKS / pack/03 candidate section.
5. Then Brad launches IV-027 regen (`refs/NEXT.md`).
