---
name: pink-menace-art-review
description: >-
  Walk Pink Menace card stills against scene copy in the local art-review
  board (npm run art-review). Use when reviewing card art, stills vs scene,
  picture/text mismatch, iterating an act's images, Pass/Fix on a card
  picture, or starting an act art pass.
---

# Pink Menace art review

Local board. Never mount it on ali.tactag.app. Bind `127.0.0.1` only.

```
npm run art-review
```

Opens `http://127.0.0.1:3847/?act=III&card=III-010` (override with `--act` / `--card`).

UI: still + hook/scene/decision/`read`/geometry. **Pass** / **Fix** / Prev / Next. State: `cards/art-review-state.json` (gitignored).

## Start an act

1. Run the board if it is not already on `:3847`.
2. First unfinished card in that act, unless the user names a card.
3. Current act III starts at **III-010** until that still is Passed.

## One card at a time

Stay on the current card until the still matches hook + scene + `image_brief.read` + geometry (vehicle-relative left/right, heading, whose seat).

| User says | Do |
|---|---|
| Pass / looks right | `PUT /api/verdict` `{status:"pass"}`, go **Next** |
| mismatch / Fix + a note | regenerate that PNG only (see below), copy onto `cards/<id>.png`, seed live if the card is already shipped, stay on this card until Pass |
| Next / Prev | change cursor only |

`GET http://127.0.0.1:3847/api/state` and `GET /api/card/<id>` are the cursor. After a new still, reload the board tab (mtime cache-busts `/still/<id>.png`).

Do not skip a Fix to "come back later" unless the user says to.

## Regen a still

1. Read `cards/<id>.json` `image_brief` + scene. If left/right was the miss, tighten the brief in frame-relative language (curb, camera side, heading) before generating.
2. `GenerateImage` with the act vehicle lock (`refs/ref_ledger_sheet.png` or cockpit / Menace exterior). Tool aspect `3:4`; delivery still is 2:3 via `scripts/encode-still.py` at seed.
3. Copy the result to `cards/<id>.png`.
4. If live: `node scripts/seed-cards.js <id>` against prod `DATABASE_URL` (public Railway proxy, never print the URL). Bump `imageUrl` `?v=` in `src/game.js`. Commit and push.
5. Reload the board; wait for Pass.

No other vehicle may wear the ego's canon marks (pack/12).

## Next act

Same tool: `node tools/art-review/server.js --act II` (or IV…). Pass the whole act before starting the next.
