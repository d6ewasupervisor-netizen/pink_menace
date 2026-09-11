# Disabled features — tickets

Anything turned off for a quality reason leaves a record here. A silent `display: none` is not a decision; it is a disappearance. Same class of failure as **a mechanic the player doesn't perceive doesn't exist** (`21`, `00_README`).

| Feature | Off / changed | Why | Ticket / fix |
|---|---|---|---|
| Fear overlay blobs on stills | 2026-08-26 (`dd18d13`) | CSS shapes read as stickers on photographs | `26_THE_QUIET` — photoreal glass + depth plates; compositing with multiply; palm scale fix (#27) |
| Tier opacity toggling empty nodes | weeks after Aug 26 | Overlays hidden but tier classes still ran | Re-enabled with plate system; presence → `paintFear` in `feel.js` |
| Act II camera-cap (`scripts/validate-act-ii.js` / `checkCameraLedger`) | 2026-09-11 (main) | `POV_DIAGRAM` is 8/26 non-exempt (30.8% > 25%). Window-of-6 and consecutive-token also fail (II-012…016 cockpits; II-030…026 diagram cluster). Validator already printed “Act II shipped as-is; do not regenerate.” | **Ticketed, not silent.** Camera-ledger errors on Act II are logged, not fatal. Do not regenerate Act II to satisfy the cap. GitHub Issues API was not writable from this agent — this row is the pack/00 ticket. Other Act II fails (II-011 geometry, II-017 hook words) stay fatal. |

When you disable UI or a mechanic, add a row before merge.
