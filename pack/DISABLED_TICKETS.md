# Disabled features — tickets

Anything turned off for a quality reason leaves a record here. A silent `display: none` is not a decision; it is a disappearance. Same class of failure as **a mechanic the player doesn't perceive doesn't exist** (`21`, `00_README`).

| Feature | Off / changed | Why | Ticket / fix |
|---|---|---|---|
| Fear overlay blobs on stills | 2026-08-26 (`dd18d13`) | CSS shapes read as stickers on photographs | `26_THE_QUIET` — photoreal glass + depth plates; compositing with multiply; palm scale fix (#27) |
| Tier opacity toggling empty nodes | weeks after Aug 26 | Overlays hidden but tier classes still ran | Re-enabled with plate system; presence → `paintFear` in `feel.js` |
| Act II camera-cap / window-of-6 | ship-as-is (main) | `validate-act-ii.js`: `POV_DIAGRAM` **8/26 (30.8%) > 25%** plus window-of-6 / consecutive-token errors. Act III validator is green. | Doc-only ticket (`pack/40_SIX_ACT_AUDIT` §4). Do **not** regen stills or replay Acts I–III to satisfy percentages; text-only camera-token pass later if needed. |

When you disable UI or a mechanic, add a row before merge.
