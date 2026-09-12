# 39 — Wave briefs

**Wave briefs list card IDs only.** A wave brief, stills batch brief, or parallel stills prompt lists card IDs and nothing else. It is not a source of frame descriptions. `image_brief` and the frame description are always read from the card JSON at compile time. Card JSON is the sole brief authority. Stale parallel briefs must not override the locked card.

## What a wave brief is

The packet that tells a stills pass, a muted-read stills wave, or a parallel generate which cards to compile. Names seen in the repo: wave brief, stills batch brief, parallel stills prompt, `WAVE_BRIEF.md`, `NEXT-STILLS` when used as a compile list.

It is not the card. It is not `image_brief`. It is not a compile prompt.

## What it may contain

Card IDs. Optionally a pointer at `cards/<id>.json`. The standing rule above.

```
# Wave brief

- V-013
- V-011
- V-006
```

`node scripts/write-wave-brief.js V-013 V-011 V-006` writes that shape.

## What it must not contain

- `image_brief` field dumps (`subject`, `foreground`, `midground`, `background`, `camera_pose`, `read`, `extra_negatives`)
- Restated frame descriptions, “brief lines followed,” or “from the brief”
- A second `image_brief` that agents could compile from

Those copies go stale. Parallel waves then override the locked card. That is the failure this file exists to stop.

## Compile

Layer 3 reads `card.image_brief` from `cards/<id>.json` only.

- `scripts/compile-prompt.js` — `assemblePrompt(card)` rejects a wave overlay
- `scripts/compile-images.js` — loads card JSON from `cards/`; refuses `--wave-brief` / `--brief`
- `scripts/write-compile-prompts.js` — IDs in, `cards/<id>.json` out
- `scripts/validate-wave-briefs.js` — rejects frame-description dumps in wave files

A take map (closest / runner / residual) is not a wave brief. Do not paste `image_brief` into it as if it were the compile source. Name it `*_MAP.md` if you need the table.

Fix the card JSON, then recompile. Do not patch a wave file and regenerate from the patch.
