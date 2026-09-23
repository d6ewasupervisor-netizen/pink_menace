# DRIVE INTEGRATION Q&A
**ali.tactag.app → 3D drive surface integration**
_Answered from repo state as of HEAD (bbe159e), Sep 16 2026. Railway env vars not fully visible — see Blocked._

---

## Hosting and build

### Q1 — Is `.dockerignore` present and what does it exclude? Would a `drive/` source folder and a `public/game/drive/` output be affected by any existing exclusion or by the leak checks?

`.dockerignore` is present. Full contents:

```
.git
.github
.cursor
.env
.env.example
node_modules
pack/
pack
cards/
cards
refs/
refs
source/
source
ceiling/
ceiling
scripts
generations
**/*.pdf
*.pdf
*.md
.dockerignore
.gitignore
```

`drive/` source folder is **not excluded** — it would ship into the build image unless you add it. `public/game/drive/` output is **not excluded** either. Both are clean.

The Dockerfile leak check (`Dockerfile:9-16`) guards only these paths: `pack`, `cards`, `refs`, `source`, `ceiling`, and `*.pdf`. It does not touch `drive/` or `public/game/drive/`. The 3D build's multi-stage structure (stage 1 compiles `drive/`, stage 2 copies only `public/game/drive/` into the runtime image) keeps the source out of the final image automatically — the leak check stays valid as-is.

One addition needed: add `drive/` to `.dockerignore` so the multi-stage stage-1 `COPY . .` doesn't pull megabytes of `node_modules` from the host unnecessarily. Or scope the COPY narrowly. Either works.

---

### Q2 — Railway build limits? Has a multi-stage build been used before?

`railway.json` (`railway.json:1-14`) sets only `builder: DOCKERFILE`, a `healthcheckPath`, `healthcheckTimeout: 30`, and restart policy. No build-time memory cap or timeout is set there.

Multi-stage has **not been used before** — the current Dockerfile (`Dockerfile:1-20`) is a single stage. Railway supports multi-stage Dockerfiles without any config change; Railway simply runs `docker build` and takes the final stage.

What to watch: three.js + Rapier WASM + drei is a heavy `npm ci`. Railway's default Hobby build memory is 8 GB and build timeout is 20 minutes. A Vite build of ~770 modules should finish comfortably inside both limits, but this cannot be confirmed from the repo alone — **check Railway dashboard → Service → Build settings** if the first build stalls.

No Railpack override is active (`builder: DOCKERFILE` bypasses Railpack entirely), so there is no Railpack interference.

---

### Q3 — `server.js` serves `public/game` with `maxAge: 0`. Is that deliberate? Is a second static mount for `/drive/assets` with `maxAge: '1y', immutable` acceptable?

The `maxAge: 0` path is at `server.js:30`:

```javascript
const maxAge = dir === "game" ? 0 : "1h";
express.static(path.join(__dirname, "public", dir), { index: false, maxAge })(req, res, next);
```

Yes, it's deliberate. `app.js` and `feel.js` are served uncached, and the HTML references them with `?v=p61`-style query strings for cache-busting. `maxAge: 0` keeps the cache-bust loop simple — the version param is cosmetic, not relied upon by the browser for freshness.

A second static mount for `/drive/assets` with `maxAge: '1y', immutable` is acceptable. Mount it **before** the catch-all game static middleware so the immutable rule applies specifically:

```javascript
// Add before the existing app.use() block:
app.use(
  "/drive/assets",
  express.static(path.join(__dirname, "public", "game", "drive", "assets"), {
    maxAge: "1y",
    immutable: true,
  })
);
```

This doesn't conflict with the existing `maxAge: 0` block because Express matches the most specific path first.

---

### Q4 — The catch-all `app.get("*")` sends `public/game/index.html`. Confirm `/drive/` and `/drive/anything` should instead send `public/game/drive/index.html`.

**Confirm.** The current catch-all at `server.js:34-36`:

```javascript
app.get("*", (req, res) => {
  const dir = appKind(req) === "parents" ? "parents" : "game";
  res.sendFile(path.join(__dirname, "public", dir, "index.html"));
});
```

Without intervention, `/drive/` returns the card game's `index.html`, which will try to call `/api/run/home` and render the card UI inside the 3D base URL — broken.

Add a specific handler before the catch-all. The 3D app has no client-side routes (single SPA root), so one `sendFile` is enough:

```javascript
app.get(["/drive", "/drive/*"], (req, res) => {
  if (appKind(req) === "parents") return res.redirect(parentsUrl());
  res.sendFile(path.join(__dirname, "public", "game", "drive", "index.html"));
});
```

The `wrongPortal` behavior on parent accounts hitting `/drive/`: `GET /api/me` already returns `{ wrongPortal: true, redirect: gameUrl() }` when a parent account hits the game surface (`host.js:12-15`). The 3D client should check `/api/me` on boot and redirect accordingly, same as the card game does.

---

### Q5 — Node version: Dockerfile is `node:22-alpine`, `engines` says `>=18`. Any reason the build stage can't be `node:22-alpine` too?

No reason. `package.json:9-11` sets `"engines": { "node": ">=18" }`. Node 22 satisfies that. Using `node:22-alpine` for both build and runtime stages is correct — it keeps the toolchain and the runtime on the same binary, which avoids WASM and native-addon ABI mismatches that can appear when building on 20 and running on 22 (or vice versa).

---

## Auth and sessions

### Q6 — Session cookie: name, `SameSite`, `Secure`, path. Is the cookie scoped to the host so `/drive/` sees it automatically? Does any POST route require a CSRF token or custom header beyond the cookie?

From `src/auth.js:7-30`:

| Attribute | Production value | Dev (`COOKIE_SECURE=0`) value |
|---|---|---|
| Name | `__Host-pm_session` | `pm_session` |
| `httpOnly` | `true` | `true` |
| `Secure` | `true` | `false` |
| `SameSite` | `lax` | `lax` |
| `path` | `/` | `/` |

The `__Host-` prefix mandates that no `Domain` attribute is set, that `Secure` is true, and that `path` is `/`. This means the cookie is scoped to **the exact host that set it** (`ali.tactag.app`) — subdomains cannot read it. `/drive/` is a path under `ali.tactag.app`, so the cookie **is automatically present** on every request, including `/api/me` and `/api/run/image/*`.

No CSRF token or custom header is required anywhere in the codebase. All mutation routes require only the session cookie (via `auth.requireRole`). `SameSite: lax` prevents cross-site POST submission, which is the relevant CSRF protection here.

---

### Q7 — `express.json({ limit: "64kb" })`. Telemetry batches could exceed that. Raise the limit on `/api/drive/events` or cap client-side?

The global `express.json` is mounted at `server.js:13` before all routes:

```javascript
app.use(express.json({ limit: "64kb" }));
```

Per-route override: Express runs the first matching middleware, so you **can** mount a larger `express.json` specifically on the drive route:

```javascript
app.post("/api/drive/events", express.json({ limit: "512kb" }), async (req, res) => { ... });
```

Both approaches work. Preference: **cap batches client-side at ~50 events** (each event is small JSON, 50 × ~200 bytes = ~10 KB). That keeps the global limit in place, avoids a payload amplification surface, and doesn't require a code exception. Only raise the limit server-side if late-bound events (e.g., large `data` payloads for collision telemetry) genuinely exceed 10-15 KB per batch.

---

### Q8 — Local development: with `sms-outbox` unavailable, how does a developer sign in locally? What are `COOKIE_SECURE=0` and `PHONE_PEPPER` doing?

There is **no dev bypass PIN or seeded session** in the code.

What actually happens without `SMS_OUTBOX_KEY`:
- `POST /api/auth/otp/send`: The send call at `routes-auth.js:124` is inside a try/catch that swallows SMS errors and still returns `OTP_OK` — so the form advances to "enter PIN" even though no SMS was sent.
- `POST /api/auth/otp/verify`: `sms.verifyOtp` at `sms.js:49` calls `outboxFetch`, which throws `503` immediately if `SMS_OUTBOX_KEY` is missing. This surfaces as a 500 back to the client — **sign-in is blocked**.

To sign in locally a developer needs a real `SMS_OUTBOX_KEY`, or must manually `INSERT INTO sessions` and `INSERT INTO users` in Postgres and set the `pm_session` cookie in the browser.

`COOKIE_SECURE=0` (`auth.js:8`): forces the cookie to be `Secure: false` and changes the name from `__Host-pm_session` to `pm_session`. Required because `localhost` is not HTTPS, so a `Secure` cookie is never sent.

`PHONE_PEPPER` (`phone.js:29-36`): an HMAC key used to hash phone numbers before storing them in `pending_links.phone_hmac`. It must be set to any non-empty string locally or every phone-related operation (sign-in verify, parent-student linking) throws a 503. Set it in `.env` to any random string for local dev — just never share the value with `sms-outbox`'s `OTP_PEPPER`.

---

## Data model

### Q9 — `run_answers` has `UNIQUE (run_id, card_id)`. If the 3D game presents a card the student already resolved, what should happen? Paste the parent log route's query.

**Constraint in full** (`schema.sql:130-131`):
```sql
-- One resolution per card per run. Callback debt may queue a different card;
-- it must never rewrite a card that already has a row.
CREATE UNIQUE INDEX IF NOT EXISTS run_answers_one_per_card ON run_answers (run_id, card_id);
```

`run_answers` also carries `run_id FK → runs.id`. A 3D game answer doesn't have a natural `run_id` — the active card-game run belongs to the card game's sequential state machine, and inserting into it would corrupt that machine (e.g., the callback debt queue dequeues based on `run_answers` presence, `src/game.js:27-35`).

**Parent log query** (`src/routes-parents.js:316-320`):
```javascript
const { rows } = await query(
  `SELECT practiced_on, location, day_night, weather, psdp_skill, hours, initials
     FROM coverage_log
    WHERE student_id = $1
    ORDER BY practiced_on ASC, created_at ASC`,
  [student.id]
);
```

The parent log reads **only from `coverage_log`**, not `run_answers`. This is the deciding factor.

**Recommendation: option (a) — write to `drive_events` and `coverage_log`, not `run_answers`.**

- `coverage_log` already feeds the parent log. Writing a row there for each 3D card answer (with `psdp_skill`, `dol_section`, etc. from `cards`) makes 3D answers appear in the parent view immediately, with no schema change.
- Do **not** insert into `run_answers` from the 3D path. That table is an internal state-machine record for the card game engine, and inserting there would trigger callbacks and state transitions the 3D client never sent.
- If you want 3D answers visible in a future "card answers" audit view, `drive_card_answers` is cleanest. But for the parent log, `coverage_log` is the right write target today.

---

### Q10 — What is `runs.state`? What's in `runs.max_presence`? Is `src/presence.js` the Quiet "presence" meter? Should the 3D game's noise feed the same number?

`runs.state` is a JSONB blob (`schema.sql:96`) holding the cargo-and-presence game state for one run. Its public shape (`src/game.js:900-917`):
```
{ noise, light, yaw, cargo, time_cost, cold, warming, phase, presence, tier, handprints }
```
It's mutated by every `applyDelta` and `applyFear` call and stored back into `runs` on each answer. It encodes where the student is in the cargo depletion arc (cold→warming) and how loud they've been (presence).

`runs.max_presence` (`schema.sql:97`, `src/db.js:63`): a separate INTEGER column updated with `GREATEST(max_presence, current_presence)` on each answer write. It's a high-water mark, persisted even after the run closes, for post-run reporting/grading. It's not part of `state` JSONB — it's a hard column so it survives a `state` reset on `failRestart`.

`src/presence.js` — yes, this is the Quiet presence meter. Wrong answers call `loudDelta` (minimum noise floor of 3, `presence.js:31`). `applyFear` adds noise to `presence`. At `COLLAPSE_AT = 23`, a "quiet" event fires (`presence.js:69-74`), presence drops to `AFTER_COLLAPSE = 16`, and `quiet: true` is returned to the client as a dispatch message.

**Should the 3D game feed this number?** Only if you want one unified Quiet meter for the parent view. That's a product decision. Technically: the 3D game would need to write to an active `runs.state` (or a parallel table), which means either (a) creating a 3D-specific run that the card game doesn't touch, or (b) a separate `drive_progress.presence` column with its own tier logic. If parents see "Quiet" on the dashboard today and you want 3D noise to move that same bar, a unified table is cleaner. If the 3D game gets its own "Awareness" meter in the UI, keep it separate and expose it through `drive_progress`.

---

### Q11 — `coverage_log` records PSDP practice hours. Confirm simulated 3D driving must NOT write rows there.

**Correct, with nuance.** `coverage_log` is the Washington PSDP supervised driving log. The parent view at `/api/parents/students/:id/log` (`routes-parents.js:300-370`) renders it as a printable HTML table titled "Washington PSDP supervised driving log" with columns Date / Location / Day/Night / Weather / Skills / Hours / Initials — this is a **legal document** parents may present as part of the driver training certification.

Simulated 3D driving must **not** write `hours` rows to `coverage_log`. That would falsify a state-supervised log.

However: card answers inside the 3D game (actual PSDP knowledge questions) **could** write rows with `hours: 0` to record that the student engaged with a topic — as long as the `hours` value accurately reflects zero seat time. Confirm with product before doing even that. The safest path: 3D card engagement → `drive_card_answers` table only; the parent view gets an explicit "3D Drives" section that reads from `drive_events`, distinct from the PSDP log.

---

### Q12 — How is `migrate()` run? Are there hand-applied migrations outside `schema.sql`? Is adding three tables to `schema.sql` the whole migration?

`migrate()` (`src/db.js:26-132`) is called at `server.js:40` on **every boot**, before the server starts listening. It:
1. Drops legacy tables (`card_events`, `student_progress`, `pending_logins`) unconditionally.
2. Drops and rebuilds `sessions` / `parent_students` if they have deprecated columns (`person_id`, `invite_sms_status`).
3. Runs the full `schema.sql` via `pool.query(sql)` — `CREATE TABLE IF NOT EXISTS` for all tables.
4. Runs a series of `ALTER TABLE … ADD COLUMN IF NOT EXISTS` statements for columns added after the initial `schema.sql` was written: `callback_debts`, `ms_on_outcome`, `ms_on_scene`, `max_presence`, `cargo_fail_reason`, `lot_state`, `start_seq`, `replay_plan`, `replay_index`, `review_plan`, `review_index`.
5. Runs `CREATE TABLE IF NOT EXISTS run_line_advances` and `CREATE TABLE IF NOT EXISTS run_peeks` inline.
6. Runs `CREATE UNIQUE INDEX IF NOT EXISTS run_answers_one_per_card`.

**Columns are never dropped in code.** Old tables are dropped only if a sentinel column is found (the v1→v2 upgrade path).

**For the three new tables** (`drive_progress`, `drive_events`, `drive_attempts`): adding them to `schema.sql` as `CREATE TABLE IF NOT EXISTS` blocks is sufficient. They will be created on the next deploy boot with no additional migration code needed. No alter/drop risk. This is the whole migration.

---

### Q13 — `cards.extra` JSONB: does it hold the fields the 3D game needs? Is there an endpoint returning a card's full text+options for a signed-in student without requiring it to be in the current run?

`cards.extra` fields used by `publicCard()` (`src/game.js:920-966`):

| Field | Location | Notes |
|---|---|---|
| `hook` | `extra.hook` (or derived from `scene`) | Present in extra if explicitly authored |
| `image_brief.camera` | `extra.image_brief.camera` | Camera angle hint |
| `variation.time_of_day`, `variation.weather` | `extra.variation.*` | Alternate metadata |
| `timeout_option_id`, `timeout_ms` | `extra.*` | Timeout behavior |
| `lot_states`, `lot_voice` | `extra.*` | Act I lot-state branching |
| `ride_along`, `ride_beats` | `extra.*` | Ride-along beat arrays |
| `cast` | `extra.cast` | Array of cast IDs appearing on this card |
| `driver` | `extra.driver` | Override driver voice |

`options[].state_delta` is **not** in `extra` — it's in `card_options.state_delta` (a separate table, `schema.sql:78-82`). The 3D game can fetch it by joining `card_options`.

**`/api/run/review/:cardId`** (`routes-run.js:215-264`): This endpoint returns a card's full text + options **and** requires:
1. A signed-in student session.
2. `firstAnswerForStudent(session.userId, cardId)` to exist — i.e., the student must have previously answered this card in *some* run. It returns 404 "Not resolved" if the card was never answered.

It does **not** require the card to be in the current run. But it does require prior resolution.

The 3D game will need its own endpoint — e.g., `GET /api/drive/card/:cardId` — that returns `publicCard(cardId)` plus options for any card the student is authorized to see, without requiring prior resolution. The existing `publicCard()` function in `game.js` is already the right building block; just expose it behind a student-auth check.

---

## Card images and assets

### Q14 — `/api/run/image/:cardId` auth, cache headers, MIME, rate limiting?

From `routes-run.js:266-298`:

| Property | Value |
|---|---|
| Auth | Requires `student` role session cookie via `auth.requireRole` |
| Cache | `private, max-age=604800` (7 days, private to user agent) |
| MIME | `row.image_mime` from DB, defaulting to `image/webp` |
| Rate limiting | **None** — no rate-limiting middleware on this or any route |

Access gate: `canViewImage(run, requested, session.userId)` is called when a specific `cardId` is requested (`routes-run.js:277`). That function (in `game.js`) checks whether the card is in the student's answer history or is the current card — it restricts what images a student can pull directly. The 3D game must either (a) present only cards the student has already answered, or (b) have its own image endpoint that checks 3D-game authorization logic instead.

No rate limiting is currently in place. With a 3D game hitting images frequently during card replay sequences, consider adding a simple per-session rate limiter if image DB queries become a concern.

---

### Q15 — `public/game/quiet/` and `public/game/rewards/` — final art? Source files? More cutouts planned?

**`public/game/quiet/`** contains (from directory listing):
- Overlay plates: `prints.png`, `palm.png`, `fog.png`, `flood.png`, `eyeshine.png`, `contact.png`, `herd.png`, `distant.png`, `gait.png`
- Zone-indexed WebP cutouts: `zones/01.webp`, `03.webp`, `10.webp`, `12.webp` … `60.webp` (zoned by store/grid number)
- Numbered cutout PNGs: `cutouts/52.png`, `56.png`, `57.png`, `58.png`, `59.png`, `60.png`
- Palm takes: `takes/palm-take-1.png` through `takes/palm-take-4.png`

These are compiled AI-generated plates, not hand-made. **No PSD or layered source files are in the repo.** The `.dockerignore` explicitly excludes the `refs/` and `source/` directories — no higher-resolution originals are in the build image.

Status: `refs/LOCKS.md` notes "Art regen is paused pending daughter feedback." These assets are in use but not formally locked as final in the lock file. More cutouts are possible (the zone files go up to 60; not all zone numbers between 1-60 are present). The 3D game reusing the six cutout PNGs and overlay plates is fine — they are part of the shipped `public/game/quiet/` directory.

**`public/game/rewards/`**: PNG files named `correct_answer__06.png`, `__13.png`, `__16.png`, `__25.png`, `__39.png` — reward art for correct answers. Same situation: compiled, no source files.

---

### Q16 — `public/shared/app.css` — is it the design system for both portals? List the CSS custom properties.

`public/shared/app.css` is served via `server.js:20`:
```javascript
app.use("/shared", express.static(path.join(__dirname, "public", "shared"), { maxAge: "7d" }));
```
It's loaded by `public/game/index.html:9` (`/shared/app.css?v=p61`). It is the **shared design system** for both game and parents portals (both portals call `/shared/app.css`).

**CSS custom properties** (`app.css:1-28`):

| Variable | Value |
|---|---|
| `--bg` | `#121010` |
| `--bg-2` | `#1b1716` |
| `--ink` | `#ede7dc` |
| `--muted` | `#9a9186` |
| `--line` | `#3a3230` |
| `--cranberry` | `#9a3d4d` |
| `--cranberry-2` | `#c45a68` |
| `--amber` | `#d4a017` |
| `--amber-2` | `#e8c04a` |
| `--silver` | `#c8d0d8` |
| `--silver-2` | `#eef2f6` |
| `--accent` | `var(--cranberry)` (driver-switched) |
| `--accent-2` | `var(--cranberry-2)` (driver-switched) |
| `--on-accent` | `#f4eee6` |
| `--pink` | `#c9a0a4` |
| `--ok` | `#8fb58a` |
| `--bad` | `#d36a6a` |
| `--pad` | `max(1.25rem, env(safe-area-inset-left))` |
| `--pad-r` | `max(1.25rem, env(safe-area-inset-right))` |
| `--pad-t` | `max(1.25rem, env(safe-area-inset-top))` |
| `--pad-b` | `max(1.25rem, env(safe-area-inset-bottom))` |
| `--tap` | `3rem` |
| `--radius` | `0.85rem` |
| `--max` | `28rem` |
| `--max-wide` | `48rem` |

Driver accent overrides (`app.css:30-39`): `html[data-driver="deac"]` → `--accent: var(--amber)`, `--on-accent: #121010`. `html[data-driver="yuna"]` → `--accent: var(--silver)`, `--on-accent: #121010`.

Font stack: `"Segoe UI", system-ui, -apple-system, sans-serif` (body). `Georgia, "Times New Roman", serif` (brand headings, card `.play h2`). Color scheme: `dark` (root).

The 3D card overlay can import this stylesheet at `/shared/app.css` (same origin, cached 7 days) and use the same variables with no duplication.

---

## Product and story

### Q17 — Should the 3D drive be the Act I experience or sit beside the card acts as its own tile? What does `app.js` do when a student taps a locked act?

**It should be its own tile, not BE Act I.**

The card acts advance sequentially through an unlock chain (`src/game.js:68-81`): each act's first card is locked until the prior act is 100% complete. Act IV is the only current exception (explicitly exempt at `game.js:71`). If the 3D drive replaces Act I, students who skip the drive would never unlock Act II. If it mirrors Act I, you have two progression tracks that can disagree about whether Act I is "done."

The cleaner product shape: the home screen shows act tiles (Act I, II, III, IV…) plus a separate "Quiet Roads — drive" entry that has its own completion state from `drive_progress`. The drive is a parallel surface, not a chapter.

**What happens when a student taps a locked act** (`app.js:144-162`): Locked acts are rendered as `<article>` elements (not `<button>`) with class `locked` and text "Locked" as the meta line. There is no click handler. The element is not interactive. No modal, no toast — the act simply doesn't respond to taps.

---

### Q18 — Summarize the `game.js` run state machine in ten lines or fewer. Can 3D card answers call `/api/run/answer` directly?

State machine in ten lines:

1. A `runs` row holds `current_card_id` and cargo+presence `state`.
2. `pickNextCard` finds the next unanswered main-line card by `seq` ASC.
3. `POST /api/run/answer` validates the answer, inserts into `run_answers`, and calls `applyDelta` + `applyFear` on state.
4. Wrong non-beat answers with `schedules_callback: true` push a debt to `callback_debts`; after `CALLBACK_GAP = 2` main cards, the callback card surfaces.
5. Each wrong answer adds noise ≥ 3 to `presence`; correct answers decay presence by `CLEAN_DECAY = 2`.
6. At `COLLAPSE_AT = 23` presence, a **quiet** event fires — dispatch text is returned, presence drops to 16.
7. If cargo hits zero, the run `status → failed`: `failRestart` computes a checkpoint `start_seq` and a `replayPlan` (recent wrong cards), then opens a fresh active run. The **replay** phase re-presents those cards; **recap** beats show the prior choice as a non-interactive summary.
8. After failure, a **hold** (`review_plan`) queues previously answered cards; correct hold answers bank `REVIEW_MIN` minutes off `time_cost`.
9. **Peek** = audit-only log of a student viewing a past wrong-answer option post-resolution (no state change).
10. Run completes when `pickNextCard` returns null; `runs.status → completed`.

**Can 3D card answers call `/api/run/answer` directly?**

No, not safely. `/api/run/answer` at `routes-run.js:328`:
- Requires `current_card_id === cardId` on the active run (`routes-run.js:360`).
- Inserts into `run_answers` which fires the callback debt machinery and cargo state transitions.
- Writes to `coverage_log` — which the 3D game must not do for simulated play (Q11).

The 3D game needs its own endpoint (e.g., `POST /api/drive/answer`) that records the answer in `drive_card_answers`, optionally writes to `coverage_log` with `hours: 0`, and returns result text from `card_options.result` — without touching `runs` state.

---

### Q19 — Is there a character lock file with canonical descriptions to mirror for 3D models?

**Yes — two files.**

`refs/LOCKS.md` is the primary lock registry. It lists locked assets and their canonical descriptions:

| Character | Lock file | Canon description (excerpt) |
|---|---|---|
| Ali | `ref_ali2.png` | Wire-rim rounds, cranberry lattice braid, gold hoop/nose ring, raglan hoodie |
| Deac | `ref_deac.png`, `ref_deac_sheet.png` | Broad, 54 yo, dark brown skin, close-cut gray hair, amber transit vest, glasses on cord |
| Yuna | `ref_yuna.png`, `ref_yuna_sheet.png` | 17 yo, asymmetric chin-length bob, jet-black/platinum, retroreflective silver piping |
| Gracie | `ref_gracie.jpg` | Orange/ginger tabby, pink nose, amber eyes, cream chest |
| Mya | `ref_mya.jpg` | Brown mackerel tabby, dark nose, green eyes, hard-striped forehead, heavier |
| Pink Menace (car) | `ref_car_exterior.jpg`, `ref_car_nose_plow.png` | Plow, mesh windows, riveted door plate, knobbies; see nose plow authority |

`pack/07_CHARACTER_LOCK_PROMPTS.md` has the full image-generation prompts (D1–D4 for Deac/The Ledger, Y1–Y4 for Yuna/Encore, G1 convoy silhouette). These contain the most precise canonical text descriptions — the 3D modeler should treat these as the style brief.

**Characters in the 3D proposal not in any lock file:** Grandma, Tuna, Willis. These names do not appear in `refs/LOCKS.md`, `pack/07_CHARACTER_LOCK_PROMPTS.md`, `src/game.js` CAST array, or any other file in the repo. They need new lock entries before 3D modeling begins, or they risk drifting from story intent.

The CAST array in `src/game.js:186-195` lists: Ali, Deac, Yuna, Gracie, Mya, Reyna Solis, Marisol, Hollis. Cards also include Hollis and Marisol referenced in the proposal — both are in the CAST array but have no full image lock files listed in `LOCKS.md`.

---

## Deployment checklist

### Q20 — Every env var the running service uses, which are on Railway, which the 3D route would need.

All `process.env` references in the codebase:

| Variable | File | Required | Default | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | `src/db.js:17` | Yes | — | Postgres connection string |
| `PHONE_PEPPER` | `src/phone.js:30` | Yes | — | HMAC key for phone hashing; throws 503 if missing |
| `SMS_OUTBOX_KEY` | `src/sms.js:6` | Yes | — | Auth for sms-outbox OTP; sign-in broken without it |
| `SMS_OUTBOX_URL` | `src/sms.js:10` | No | `https://sms-outbox-production.up.railway.app` | Override sms-outbox endpoint |
| `COOKIE_SECURE` | `src/auth.js:8` | No | auto | Set to `"0"` for local dev |
| `APP_KIND` | `src/host.js:15` | No | auto | Set to `"parents"` to force parent shell on localhost |
| `GAME_URL` | `src/host.js:20` | No | `https://ali.tactag.app` | Used in parent portal OTP link copy |
| `PARENTS_URL` | `src/host.js:24` | No | `https://parents.tactag.app` | Used in game portal redirect copy |
| `SESSION_DAYS` | `src/host.js:28` | No | `45` | Cookie/session lifetime in days |
| `PORT` | `server.js:39` | No | `8080` | HTTP port |
| `NODE_ENV` | `src/auth.js:9` | No | auto | Used to determine cookie security fallback |

**Railway-set vars:** Cannot confirm from the repo — Railway dashboard → pink_menace service → Variables is the source of truth. Based on `.env.example` (`DATABASE_URL`, `SMS_OUTBOX_URL`, `SMS_OUTBOX_KEY`, `SESSION_SECRET` (not in code — may be legacy), `GAME_URL`, `PARENTS_URL`, `SESSION_DAYS`, `PHONE_PEPPER`, `COOKIE_SECURE`) plus Railway's auto-injected `PORT` and `DATABASE_URL` (if using Railway Postgres), those are the expected set.

**New env vars for the `/drive/` route:** None required by the base proposal. The 3D route uses the same DB, same cookie, same `appKind`. A feature-flag var (see Q22) is the only addition.

---

### Q21 — Current image size and cold-start time on Railway? Concern about adding ~25 MB of static assets?

Cannot determine current image size or cold-start time from the repo — this requires the Railway dashboard or `docker image ls` on the built image. The current image is lean: `node:22-alpine` base, `npm ci --omit=dev` (only `cookie-parser`, `express`, `pg`), `server.js`, `src/`, and `public/`. No build step. Estimated size: 80-120 MB.

Adding ~25 MB of compiled 3D static assets (bundle + stills) will increase the image by roughly 25 MB, to ~105-145 MB. That is not a concern for Railway — image size primarily affects pull time on cold start, and 25 MB on top of a 100 MB image adds a few seconds at most. The real cold-start cost is `migrate()` running schema checks against Postgres, which dominates.

Rapier WASM (`~2.5 MB`) and the Three.js bundle (`~600 KB minified`) will compress well in the Vite build. The stills are the bigger risk — confirm they are compressed WebP at the sizes needed for the 3D scene, not full-resolution PNGs.

---

### Q22 — Is there a staging environment or PR preview? Propose a gate for the first `/drive/` test.

`railway.json` defines only one environment (`production`). No staging or PR preview is configured. `main` deploys straight to production — confirmed by `railway.json:deploy` having no branch filter.

**Proposed gate for the first `/drive/` test:**

Add one env var: `DRIVE_ENABLED=1`. In the drive route handler:

```javascript
app.get(["/drive", "/drive/*"], (req, res) => {
  if (!process.env.DRIVE_ENABLED) return res.redirect("/");
  if (appKind(req) === "parents") return res.redirect(parentsUrl());
  res.sendFile(path.join(__dirname, "public", "game", "drive", "index.html"));
});
```

When `DRIVE_ENABLED` is unset (the current production state), `/drive/` silently redirects to the card game home. Set it in Railway Variables only when the first test is ready. No code change needed to toggle.

A per-user allowlist is also viable (check `users.id` against an env-var comma-separated list or a new `drive_beta` DB column), but the env-var gate is simpler and lower-risk for an initial deploy test.

---

## Corrections to the proposal

**Proposal point 3 (Auth — same-origin cookie):** Correct that the cookie works automatically on `/drive/`. But the `wrongPortal` redirect for a parent hitting `/drive/` is not automatic — the 3D client has to call `GET /api/me`, check `wrongPortal: true`, and redirect itself. The card game does this; the 3D client must do the same. The server does not redirect on its own for a parent GETting a static HTML file.

**Proposal point 4 (Card images — `/api/run/image/:cardId`):** The `canViewImage` gate in `routes-run.js:277` restricts image access to cards the student has already seen or is currently on. The 3D game presenting a card the student hasn't answered in the card game will get a 404 on the image. Options: (a) the 3D game uses its own image endpoint without the run-gate, or (b) the existing endpoint is extended with a query param or separate `drive` auth path. Do not remove the gate from the existing endpoint — it's intentional protection.

**Proposal point 5 (Data — `run_answers` for card answers in 3D):** Confirmed wrong as proposed (see Q9). Writing to `run_answers` from the 3D path would corrupt the card game's callback-debt and cargo state machine. Use `drive_card_answers` + `coverage_log` (with `hours: 0`) instead.

**Proposal point 1 (Route — `public/game/drive/` output):** Correct in principle, but note that the existing static middleware at `server.js:28-35` mounts `public/game` without an explicit path prefix — it serves `public/game/drive/index.html` at `/drive/index.html` only if that catch-all is split. You need the explicit `/drive/*` route for `index.html` (see Q4) AND the `/drive/assets` static mount with long cache (see Q3). Without those two additions, Vite's asset URLs (`/drive/assets/…`) will fall through to the `maxAge: 0` generic static handler and still work — but without the immutable cache headers Vite expects for hashed bundles.

---

## Blocked

The following could not be determined from the repo alone:

1. **Railway env vars actually set in production** — the Railway MCP for this session resolved to a different linked service and did not expose the `pink_menace` service variables. Verify in Railway dashboard → pink_menace → Variables.
2. **Current Docker image size and cold-start time** — requires Railway dashboard metrics or `docker image ls` on the built image.
3. **Railway build memory and timeout limits** for the pink_menace service — default Hobby tier limits apply unless overridden in service Settings → Build.
4. **Whether `SESSION_SECRET` is used** — it appears in `.env.example` but not in any `process.env` grep across `src/` or `server.js`. May be a legacy entry or used by a dependency not visible in the code.
5. **Grandma, Tuna, Willis canonical descriptions** — these characters appear in the 3D proposal but are absent from `refs/LOCKS.md`, `pack/07_CHARACTER_LOCK_PROMPTS.md`, and the `CAST` array in `game.js`. No lock exists to mirror.
6. **Whether `public/game/quiet/zones/*.webp` files are indexed by drive zone or card zone** — the zone numbers (01–60) correspond to the card zones used in `cards.zone`, but the mapping to specific 3D locations in Kent has not been documented in any file visible in this repo.
