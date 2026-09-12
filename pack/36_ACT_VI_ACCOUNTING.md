# ACCOUNTING — Act VI (The Backcountry)

Claude handoff. Exact citation strings only. Do not invent Skill fourteen. Do not write `cards/VI-014.json`. Do not seed. No stills in this pass.

**Count:** thirteen cards **VI-001…VI-013** plus the existing engine end-of-run beat. **VI-014 is not a card.**

**Locks:** Ali alone in the Menace. Yuna radio-only if present. Zone = The Backcountry (rural roads + roundabouts, valley floor east of the Ribbon). Last act before the pass — chains / Snoqualmie / night / snow = **Act VII**.

**Sources:** `source/25WAPSDP_LR_v3.pdf`, `source/driver-guide.pdf`. Full quotes: `pack/36_ACT_VI_RESEARCH.md`.

---

## Locked Skill twelve / thirteen strings

Official PSDP TOC uses these exact titles (no `part one` / `part two`; no en-dash in the skill title).

```
Skill twelve: driving on rural roads
Skill thirteen: roundabouts
```

Both added to `pack/08_PSDP_SKILLS.json` this pass. Cards cite these strings exactly. Never print the skill name on a card face.

Lesson headings inside the body use en-dash **U+2013** (e.g. `Lesson one – gravel roads`). Those are teach labels, not allowlist skill strings.

---

## Skill twelve lessons (printed p. 33)

| Lesson / sub-heading | Prefer DOL | Notes |
|---|---|---|
| Lesson one – gravel roads | `n/a` (or review `5.6 … (Skidding)` if teaching the skid sidebar) | No DOL “gravel” heading |
| Large/slow vehicles: | `4.8 Sharing with agricultural vehicles` | **UNUSED** — first spend. Do not clone II-013’s 4.12 triangle brief |
| Sharp drop-offs and gravel shoulders: | `n/a` (or `4.12 Signs` only if soft-shoulder **sign**) | Run-off steps are PSDP-only |
| Restricted visibility: | `n/a` or soft `4.0` / `5.5 Focus` review | No dedicated DOL rural-blind-spot heading |
| Uncontrolled intersections: | `4.15 Other intersections (Uncontrolled Intersection)` | **UNUSED child**. Not II-024 (all-way / 4.13) |
| Animals: | `n/a` | Not `4.19 Transporting (Animals)` (IV-018 pets) |
| Hills and curves: | `5.6 Road and driving conditions (Curves)` optional | Child unused |
| Railroad crossings: | `4.7 Sharing the road with trains` (parent) | Light rail child already spent IV-006 |

## Skill thirteen lessons (printed p. 34)

| Lesson | Prefer DOL | Notes |
|---|---|---|
| Lesson one – five easy steps | `4.15 Other intersections (Roundabouts)` | Parent spent once on IV-015 — use **child**; do not clone IV-015 downtown brief |
| Lesson two – emergency vehicles | `4.15 Other intersections (Roundabouts)` (+ optional review `4.9`) | In-circle continue-to-exit ≠ III-022 general pull-right |
| Lesson three – two or more lane roundabouts | `4.15 Other intersections (Roundabouts)` | Lane-choice before entry |

---

## Locked DOL strings Act VI may cite

```
n/a
4.0 Awareness and cooperation
4.7 Sharing the road with trains
4.8 Sharing with agricultural vehicles
4.12 Signs
4.15 Other intersections
4.15 Other intersections (Roundabouts)
4.15 Other intersections (Diverging diamonds)
4.15 Other intersections (Uncontrolled Intersection)
4.9 Sharing with emergency vehicles
5.5 Focus
5.6 Road and driving conditions (Curves)
5.6 Road and driving conditions (Skidding)
```

`4.7 Sharing the road with trains (Light rail)` stays on the pack but Act VI should not re-spend it for a rural crossing.

---

## 4.15 leftover map (after IV-015)

| String | Status after I–V |
|---|---|
| `4.15 Other intersections` | **USED ONCE** — IV-015 (Skill ten p2, downtown yield/entry) |
| `4.15 Other intersections (Roundabouts)` | **UNUSED** |
| `4.15 Other intersections (Diverging diamonds)` | **UNUSED** (weak Backcountry fit) |
| `4.15 Other intersections (Uncontrolled Intersection)` | **UNUSED** |
| PSDP `Skill thirteen: roundabouts` | **UNUSED** (IV-015 notes it was not on allowlist) |

---

## Unused / once tracker (Act VI-relevant only)

**UNUSED — Act VI first-spend candidates**

- `Skill twelve: driving on rural roads`
- `Skill thirteen: roundabouts`
- `4.0 Awareness and cooperation`
- `4.8 Sharing with agricultural vehicles`
- `4.15 Other intersections (Roundabouts)`
- `4.15 Other intersections (Uncontrolled Intersection)`
- `4.15 Other intersections (Diverging diamonds)`
- `4.7 Sharing the road with trains` (parent)
- `5.6 Road and driving conditions (Curves)`
- `5.6 Road and driving conditions (Skidding)`

**USED ONCE — do not treat as fresh parents**

- `4.15 Other intersections` → IV-015
- `4.7 Sharing the road with trains (Light rail)` → IV-006
- `4.9 Sharing with emergency vehicles` → III-022
- `4.13 Common intersections` → II-024
- `4.19 Transporting (Animals)` → IV-018
- `4.5 Sharing with motorcycles` → IV-008

**USED 2× — leave alone unless review**

- `5.6 Road and driving conditions (Slippery roads)` → II-019, III-024

**Park Act VII**

- Chains / Snoqualmie / snow / night / fog / hydroplane
- PSDP `Practice in other conditions`
- `5.6 Road and driving conditions (Night driving)`
- `5.6 Road and driving conditions (Hydroplaning)`

---

## Open DOL headings (do not mint)

| Topic | Status |
|---|---|
| Gravel roads / windrows / gravel shoulders run-off | **OPEN** — PSDP only (`n/a`) |
| Animals in the roadway / deer / do not swerve | **OPEN** — PSDP only (`n/a`) |
| Soft shoulder as a numbered section | **OPEN** — sign tile under `4.12 Signs` only |
| Exiting a rural road / “Backcountry” | **OPEN** — not a DOL heading |

When a topic has no DOL home, cite PSDP alone with `dol_section` `"n/a"`.
