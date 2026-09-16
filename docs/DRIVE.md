# Quiet Roads — the 3D drive at /drive

The second surface of PINK MENACE: a React Three Fiber game (Vite + TypeScript) in `drive/`,
built into `public/game/drive/` by the Dockerfile's first stage and served by `server.js`
under `/drive`. Same session cookie, its own tables, one parent view.

## Gate
`DRIVE_ENABLED=1` in Railway Variables turns it on. Unset, `/drive` redirects to `/`, the
home tile is hidden, and every `/api/drive/*` route answers 404. Nothing else changes.

## Run locally
    npm ci && npm run dev                         # server on :8080 (needs DATABASE_URL etc.)
    cd drive && npm ci && npm run dev             # Vite on :5173, proxies /api → :8080
Open http://localhost:5173/drive/. You must be signed in as a student on :8080 first
(the drive never shows a login; it sends you to `/` if `/api/me` says signed out).
With `COOKIE_SECURE=0` the cookie is `pm_session` and works over http.

## Data (src/schema.sql, created on boot)
- `drive_progress`     one row per student: scene, checkpoint, vars, flags, items, unlocks, mastery (SM-2), runner state
- `drive_events`       telemetry (noise.red, stop.full, stop.rolled, mission.fail.swarm, card.open, …), ≤ 50 per POST
- `drive_attempts`     WA Driver Guide question attempts
- `drive_card_answers` PINK MENACE cards answered in the drive (story or in-world). Also writes a
                       `coverage_log` row with hours = 0 so it appears on the parent log. Never touches
                       `runs` / `run_answers`.

## Routes (all student-session, all 404 unless DRIVE_ENABLED)
    GET  /api/drive/progress          PUT /api/drive/progress (own 512 kb body limit)   POST /api/drive/reset
    POST /api/drive/events            POST /api/drive/attempts                          POST /api/drive/card-answers
    GET  /api/drive/card/:id          full card + options with is_correct/result/state_delta (publicCard + card_options)
    GET  /api/drive/image/:id         any card's image for a signed-in student (the run-gated /api/run/image is untouched)
    GET  /api/drive/summary           what the home tile shows
    GET  /api/parents/students/:id/drive   (parent session) summary + last 25 card answers

## Assets
`drive/public/` ships the Beetle GLB (11 MB), the highway models, the Quiet cutout atlas and
overlays, and 60 stills: ~20 MB served with a 7-day cache. Card images are not shipped; the
client uses `/api/drive/image/:id`. Card text is bundled from `cards/*.json` at
`drive/src/quietroads/data/cards.json`; re-export it when cards change.

## Home tile
`public/game/app.js` `renderDriveTile()` appends "Quiet Roads · Kent" after the act rows when
`/api/config` reports `driveEnabled`, with progress from `/api/drive/summary`.
