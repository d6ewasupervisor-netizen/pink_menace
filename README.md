# PINK MENACE — The Quarantine Runs

Card-corpus generation system for a Washington DOL / PSDP driving game. Quarantined Washington, not a wasteland: the grid still runs, so the rules of the road still have teeth.

## Live hosts

| Host | Who |
|---|---|
| [ali.tactag.app](https://ali.tactag.app) | Students — game |
| [parents.tactag.app](https://parents.tactag.app) | Parents — coverage and student links |

SMS login (phone + one-time PIN) via TACTAG sms-outbox. Device session lasts 45 days (httpOnly Secure cookie). Parent adds a student by name + number as a pending match only — no text is sent. Cards are seeded into Postgres; the Docker image does not include pack, cards, refs, or PDFs.

Local: `npm start` with `DATABASE_URL` and sms-outbox env from `.env.example`. `APP_KIND=parents` serves the parent shell on localhost.

## Playable now

Act IV (The Core) is the live playthrough. Art regen is paused. Status, live cards, and residuals: **[PLAYTHROUGH.md](PLAYTHROUGH.md)**. Game: [ali.tactag.app](https://ali.tactag.app) — tap **Act IV · The Core**. No Act I–III replay.

## Current gate

Do not generate Act II at volume until:

1. `06_WORKED_EXAMPLE.md` / `cards/II-007.json` feels worth playing (text + compiled image).
2. Character locks from `pack/07_CHARACTER_LOCK_PROMPTS.md` exist in `refs/`.
3. Twenty image tests have been run against bible §9 so the filter line is known on this account.

## Pipeline

```
curriculum slot  →  L2 card generator  →  card.json
                         + bible + ledger
                                              ↓
                                    L3 image compiler  →  GPT Image 2 prompt
```

Start at `pack/00_README.md`. Standing rules index (post six-act audit): **[`pack/43_PACK_RULES_CONSOLIDATED.md`](pack/43_PACK_RULES_CONSOLIDATED.md)** (seed provenance: [`pack/44_SEED_PROVENANCE.md`](pack/44_SEED_PROVENANCE.md)). Carry one card end to end from `pack/06_WORKED_EXAMPLE.md` before generating at volume. Generate **Act II** first. Act VII stays closed.

## Layout

| Path | What |
|---|---|
| `pack/` | Locked bible, generator, compiler, schema, ledger, worked example, character-lock prompts |
| `cards/` | Schema-valid card JSON |
| `refs/` | Locked character and vehicle reference images |
| `source/` | WA Driver Guide + Parent's Supervised Driving Program PDFs |

## Title

**PINK MENACE.** Campaign subtitle: **The Quarantine Runs.**
