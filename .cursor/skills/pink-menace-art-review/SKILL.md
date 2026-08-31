---
name: pink-menace-art-review
description: >-
  Walk Pink Menace card stills against scene copy in the local art-review
  board (npm run art-review). Use when reviewing card art, stills vs scene,
  picture/text mismatch, iterating an act's images, tagging CARD_BROKEN /
  WRONG_CAMERA / PASS, or starting an act art pass. Rubric: pack/24_ART_REVIEW_RUBRIC.md.
---

# Pink Menace art review

Local board. Never mount it on ali.tactag.app. Bind `127.0.0.1` only.
Rubric: `pack/24_ART_REVIEW_RUBRIC.md`.

```
npm run art-review
```

`http://127.0.0.1:3847/?act=III&card=III-010`

A verdict is a **tag** plus an optional detail line. Tags: `PASS`, `CARD_BROKEN`, `WRONG_CAMERA`, `READ_MISSING`, `GEOMETRY_WRONG`, `CANON_DRIFT`, `INVENTED`, `COPY`, `STYLE`.

State: `cards/art-review-state.json` (gitignored). Queue: `GET /api/queue?act=III`.

## Order on every card

Stop at the first failure (pack/24 §1):

A. Card coherent? scene → decision → correct option → read → geometry = one situation.
B. Can this camera show the read?
C. Do the pixels execute the brief? Judge at **390px**.
D. Style last.

Muted-read test for PASS: cover the text; if the picture doesn't teach `read`, it fails.

## Batching

**Tag the whole act before fixing anything.** Fixes cluster. Then group by tag, then fix by group.

## Routing — never generate on writer-first tags

| Tag | Who | Image gen? |
|---|---|---|
| `CARD_BROKEN` | Writer, then compiler | **No** until the JSON is one situation |
| `WRONG_CAMERA` | Writer changes camera token | **No** until the token can show the read |
| `READ_MISSING` `GEOMETRY_WRONG` `CANON_DRIFT` `INVENTED` | Compiler | Yes |
| `COPY` | Writer | Text only |
| `STYLE` | Optional | Lowest |
| `PASS` | — | — |

`CARD_BROKEN` and `WRONG_CAMERA` must never be sent to image generation. The board prints "Writer first — do not generate" on those.

## After the act is tagged

1. `GET /api/queue?act=III`
2. Rewrite group (`CARD_BROKEN`) first.
3. Camera-token group (`WRONG_CAMERA`) next.
4. Recompile group together — one compiler rule often clears several `GEOMETRY_WRONG`.
5. `COPY` text pass (no recompile).
6. `STYLE` last, if at all.

## Regen (recompile tags only)

1. Brief already coherent. Tighten `read` / geometry in frame-relative language if needed.
2. `GenerateImage` with vehicle lock. Tool aspect `3:4`; seed encodes 2:3.
3. Copy to `cards/<id>.png`. Seed live if shipped. Bump `src/game.js` `imageUrl` `?v=`.
4. Reload the board; wait for `PASS`.

No other vehicle may wear the ego's canon marks (pack/12).

## Ledger rear vision

`POV_MIRROR_REAR` is illegal on any Deac card. The Ledger is a cutaway with a plate-steel cargo box: no rear window, no interior mirror. Hazard behind → `POV_MIRROR_DOOR`. On Deac, `POV_MIRROR_REAR` is always `WRONG_CAMERA` (III-011 stays `CARD_BROKEN` because the situation itself is three-way broken). Never generate those stills until the writer changes the token. Never write "rear glass," "rearview," "interior mirror," or "the center mirror" into a Ledger frame or Ledger copy.

## Clipboard and cat

The clipboard never sits in the windshield. Doghouse, thigh, or hands — never on the dash, never on the mesh, never blocking the right half of the road. `ref_ledger_cockpit.png` currently violates this; retake D4 before any Ledger cockpit recompile.

Mya is not loose in a moving vehicle. Dash loaf only when parked. III-002 (moving + cat on dash) is `CARD_BROKEN`.
