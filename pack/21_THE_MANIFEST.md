# 21 — THE MANIFEST (making the stakes visible)

Finding, confirmed by two playthroughs: the run's entire stake — insulin on a clock — is invisible. No stated goal at run start, no legible countdown, no per-choice cost, no payoff at the end. The economy works; the player was never told it exists.

Four moments fix it. All copy and UI. `time_cost` and cargo state are already tracked server-side — nothing here touches the schema.

---

## 1. RUN START — the manifest IS Deac's clipboard

The ignition beat gains one screen: the log sheet, in the established hand-ruled format, filled in for this run.

```
RUN            The Grid — Kent
CARGO          Insulin, cold-packed
COLD REMAINING 130 MIN
FOR            June — Delridge shelter
DRIVER         ________ (her name, from the account)
```

One tap to sign it (the signature line is the "start" button). Now the goal is stated, the clock is named, and there's a **person** at the end of it — a recipient with a name beats any meter for making the cargo matter. The clipboard was designed as the game's diegetic paperwork; this is it doing its job.

Act III inherits the pattern with Deac's cargo. One template, per-act contents.

## 2. IN RUN — the cooler, not a bar

Replace the abstract cargo strip with a small persistent widget styled as the cooler's tag, top corner:

```
COLD: 62 MIN
```

- Decrements **per card** by that card's `time_cost` — this is run-time, not wall-clock; it never ticks while she reads.
- **Every result shows its price**: a `−6 MIN` float beside the meter spike when the outcome lands. This is the single most clarifying change in the whole spec — she finally sees what each choice *cost*, which is the connection between decisions and the clock that the fiction has been asserting without evidence.
- Correct answers that still cost time show it too. Time passing on good choices is honest and it's the Deac thesis: the schedule doesn't care that you drove well.

Display math: remaining = `COLD_PACK − accumulated time_cost` (`COLD_PACK` is 130 — the correct-path Act II sum is 127, so a clean run still has minutes at the door). When remaining hits zero the pack is still worth delivering, just worth less. The tag goes to `COLD: 0 · WARMING N MIN`, where N is remaining cargo slack (`CARGO_BUDGET` is 140). That countdown is the one that kills the run. A live tag never shows a lone `0 MIN`. Fail is still `cargoFrom`. Scene minutes follow the widget at that point on the correct path, never the other way around. Costs do not move; if a clean run cannot finish, the budget number is short.

## 3. THRESHOLDS — the world checks in twice

Two radio beats, bark format, no interruption. Never more than two:

- 30 remaining: *"Delridge, checking. June's asking. — R."*
- The turn (cold hits zero): *"Cold pack's sweating. How far out? — R."*

Two lines, escalating, from a voice she'll meet (Reyna runs the shelter route). Never more than two per run — the clock should pressure, not nag.

## 4. THE ENDS — keep the promise both ways

**Delivery (act complete):** a short beat, not a stat screen. The shelter door, the cooler handed over, and one line that carries the margin diegetically:

> *Delivered. 41 minutes to spare.* — or — *Delivered. 3 minutes. June didn't ask what took so long.* — or — *Delivered warm. June took it anyway.*

Minutes-to-spare is the replay hook that isn't a score: it's cargo state, not accuracy, so it breaks neither the no-score rule on her dashboard nor the coverage-only rule on the parent side. If she starts chasing her margin, the game has taught time management without ever grading her.

**Failure (cargo zero):** the fail sequence's Deac summary now closes the same loop it opens — where the time went, and what it cost:

> *Six at the bus. Four at the light. The pack warmed on Willis. Delridge is telling June it's tomorrow.*

Accumulated, attributed, human. The death stops reading as punishment for the last card and starts reading as the sum it actually was.

## 5. FICTION REINFORCEMENT — cheap, sparing

- One Gracie bark variant: *"Off the cooler, Gracie."*
- The existing scene mentions ("out of cold for ninety minutes") now agree with a visible number instead of floating unanchored — audit Act II scenes once so no stated minutes contradict the widget's math at that point in the sequence. If II-007 says ninety and the widget would show sixty-two, change the scene number, not the economy.

## The principle, for the pack

This is the same failure class as the fear system before the tiers shipped: **a mechanic that isn't perceived doesn't exist.** The economy was real, the stakes were real, and to the player there were none. Going forward the test for any system is not "does it work" but "did she see it work" — and the playtest question for this one is already written: does she ever mention the medicine unprompted. The day she says "I almost lost the insulin," the manifest did its job.
