# PINK MENACE — Deck Generation Prompt Pack

Ground-up build. This pack is the generation system for the card corpus, not the game engine.

**Title note:** dropped "Road Warrior" from the framing. The game is **PINK MENACE**; the campaign is **The Quarantine Runs**. Cleaner, and it stops the deck from sounding like a Mad Max reskin — which is part of why the last passes read as costume.

---

## The pipeline

```
CURRICULUM SLOT  ──►  [L2 CARD GENERATOR]  ──►  card.json
   (PSDP skill +           + 01_BIBLE.md              │
    DOL section)           + 05_VARIATION_LEDGER      │
                           + no-repeat ledger state   │
                                                      ▼
                                        [L3 IMAGE COMPILER]  ──►  image prompt
                                            + 01_BIBLE.md          (GPT Image 2)
                                            + card.image_brief
```

Three layers, and the order matters.

**Layer 1 — `01_BIBLE.md`.** Locked constants. World rules, playable drivers, recurring cast, antagonist roster, zone map, visual grammar. Injected verbatim into both L2 and L3 on every single call. This is what stops drift. Never edit it mid-run; version it and regenerate.

**Layer 2 — `02_CARD_GENERATOR_PROMPT.md`.** Takes one curriculum slot and emits one card as JSON conforming to `04_card.schema.json`. It writes the scene, the decision, the options, the consequence, **and the image brief**. The image brief is written by the same call that wrote the scene — that is the entire fix for text/art misalignment.

**Layer 3 — `03_IMAGE_COMPILER_PROMPT.md`.** Takes `card.image_brief` and compiles it into a GPT Image 2 prompt using only locked tokens plus the scene delta. It cannot invent subjects. It cannot change lighting. It picks from a fixed camera set.

`05_VARIATION_LEDGER.md` is the anti-monotony engine — forced rotation across eight axes with a running no-repeat state you pass back into L2 on every call. Camera cap and clustering are enforced by `npm run validate-cards` (pack/12).

`06_WORKED_EXAMPLE.md` is one card carried end to end so you can see the output shape before you generate 150 of them.

`12_IDENTITY_AND_CAMERA_POLICY.md` is the shot-design rule adopted after the Act II art pass: identity budget, vehicle feature checklist, amended camera cap.

---

## Run order

1. Lock Deac, Yuna, the Ledger, and Encore from `07_CHARACTER_LOCK_PROMPTS.md` before any card that features them. Ali and the Menace already have refs.
2. Build the slot list from `01_BIBLE.md` §7 (Zone Map). Every slot = one PSDP skill + one DOL section + one card type.
3. Generate **Act II first**, not Act I. Act I is parking-lot fundamentals and the hardest act to make fun — lock the voice on The Grid before you write Skill One. Within an act, walk the slot list in order so callbacks can resolve.
4. **Act II is done. Do not write Act III until someone has played it.** Give her https://ali.tactag.app, leave the room, and read the run off `run_answers` afterward (`npm run playthrough`). Watching changes how a sixteen-year-old plays; `ms_to_answer` is the skim signal (median under ~6s means the scene is not being read). Continue dwell is `ms_on_outcome`. The II-007 → II-010 callback feeling is not in the data — ask afterward, without naming it: "Did anything in it feel like it remembered you?"
5. After each card, append its axis values to the ledger state and pass the updated state into the next call.
6. Batch image compilation **after** a full zone is written, so recurring locations stay visually consistent within an act.
7. Chunk size 100 for any bulk pass. Run twenty §9 ceiling tests before committing a full act.

## Regeneration rule

If a card comes back flat, regenerate the **card**, not the image. A bad image is almost always a symptom of a vague decision moment. Fix upstream.

---

## What this corpus is worth

The deck is one delivery format. The asset is a curriculum-cited, machine-readable card corpus: every card carries `psdp_skill` and `dol_section`, so the whole thing is auditable against state material. That makes it sellable three ways:

- **Direct** — the game, consumer priced, WA-first.
- **B2B licensing** — WA-approved driver training schools need engagement material that maps to the state curriculum. A corpus with citations already attached is a procurement-friendly product; the pitch is "your existing lesson plan, playable."
- **Reskin** — swap the `source` layer and the same generator produces an Oregon, Idaho, or Texas deck. The bible and the pipeline are the moat; the state guide is a variable.

Build the schema honestly from card one and the licensing conversation is a data export instead of a rewrite.
