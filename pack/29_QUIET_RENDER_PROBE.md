# 29 — Rendering the Quiet: probe log

8 Sep 2026. This account, current model. Four takes per probe. Track A only — no probe refused all four, so Track B was not run.

The August constraint is gone. T15's "arm's reach is too human" does not hold. A5 renders a lunge. One take in twenty-three was blocked, and the block named no category.

Register to lock: **wrongness of posture and stillness.** Not damage. A man facing away and not moving. A head tilt. Slack shoulders, a canted head, standing in the road doing nothing. That is what the model renders reliably.

These are boundary tests. Do not seed them as card art. The five keeps are reference plates.

## Scores

| Probe | Result | Takes | Note |
|---|---|---|---|
| A1 · 30 ft, turned away | PASS | 4/4 render | Keep: take 3. Facing away, not moving. Unsettling because he is still. Distance compressed — takes 1–2 are closer than thirty feet. |
| A2 · face visible, soft | mixed | 2 PASS, 2 SOFT | Keep: take 1. The head tilt is the joint. Takes 2 and 4 are privacy-smear on an upright person — a redaction, not wrongness. |
| A3 · 15 ft, through glass | mixed | 2 PASS, 2 SOFT | Keep: take 3. Strongest single frame in the set. Filthy, slack-shouldered, head canted, standing in an alley doing nothing, seen through dirty glass. This is the register lock. Attach `ref_quiet.png` on every Quiet compile. |
| A4 · three, middle distance | PASS | 3 PASS, 1 SOFT | Keep: take 1. Spread, not converging — ambient, not an attack. Closer than sixty feet, more like thirty to forty. Take 2 walks them as ordinary pedestrians. |
| A5 · the lunge | PASS | 1 REFUSE, 3 PASS | Keep: take 3. Near-legibility. The face is smeared into the hair; what reads as a grin is bared teeth in a blur. Take 2's face is fully destroyed — safer and duller. |
| A6 · fill frame, behind glass | FINDING | 4/4 render, 0 refuse | Not a failure. Fill the frame from behind glass and you get a man at a window. The model cannot make a close-up face not a person. Hard rule: the Quiet never fill the frame. |

## Refusal wording

A5 take 1 only:

> The image generation was blocked due to content safety policies.

No category named. Do not treat one refusal as the boundary.

## Plates

| File | Take | Job |
|---|---|---|
| `refs/ref_quiet_a1.png` | A1 take 3 | Stillness. Facing away. |
| `refs/ref_quiet_a2.png` | A2 take 1 | Head tilt. |
| `refs/ref_quiet.png` | A3 take 3 | Register lock. Attach on every Quiet compile. Same bytes as `ref_quiet_a3.png`. |
| `refs/ref_quiet_a4.png` | A4 take 1 | Lot. Spread, not converging. |
| `refs/ref_quiet_a5.png` | A5 take 3 | Lunge. Near-legible. |

## What this decides

The DOL scene is unblocked. The Quiet can be on the asphalt. The lunge is A5 take 3. They never fill the frame. Presence overlays still carry the in-between.

## Compiler rules

- Write the distance farther than you want it. Thirty feet lands at ten to fifteen. Sixty lands at thirty to forty.
- Motion blur kills a face. A smear reads as censorship. Near-legibility on a lunge is the keep.
- Never write a disease word in an image prompt.
- Continuity token `the_quiet` attaches `ref_quiet.png`. A brief that says "the Quiet" attaches it even if the token was omitted.
