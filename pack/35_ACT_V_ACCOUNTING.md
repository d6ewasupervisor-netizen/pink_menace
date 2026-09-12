# ACCOUNTING — Act V (The Ribbon)

Claude handoff. Exact citation strings only. Do not invent a Skill eleven subtitle. Do not add Skill twelve / thirteen here (Act VI).

**Count:** thirteen cards **V-001…V-013** plus the existing engine end-of-run beat (`deliveryBeat` / locked door). **V-014 is not a card.** Do not write `cards/V-014.json`.

**Locks:** relay kit (repeater, antenna, clamps) in the Menace. `presence` on every card (stubs: `0`). Ali alone in the cab. Yuna on radio, not in the truck. No tow / insulin / cooler / June. Chains / Snoqualmie / snow / night / Gravy = Act VII.

**Sources in repo:** `source/25WAPSDP_LR_v3.pdf` (WA PSDP), `source/driver-guide.pdf` (WA Driver Guide).

---

## Locked Skill eleven strings

Official PSDP TOC (`source/25WAPSDP_LR_v3.pdf` table of contents) uses an **en-dash** `–` (U+2013), same as Skill ten. Pack canonical strings match that. Claude’s hyphen variants are also on the allowlist so either punctuation validates. Words are identical.

```
Skill eleven: highway driving – part one
Skill eleven: highway driving – part two
Skill eleven: highway driving - part one
Skill eleven: highway driving - part two
```

Do not write “freeway,” “part three,” or a bare `Skill eleven`. Cards on this draft cite the **en-dash** pair (Skill ten style).

---

## Claude’s four DOL topics

These are the topics Claude named. Only headings verified in `source/driver-guide.pdf` were added to `pack/07_DOL_SECTIONS.json`. Lesson titles that exist only in the PSDP booklet are **not** invented as DOL headings.

| Claude topic | Official home | Allowlist string | Status |
|---|---|---|---|
| On-ramp segments | PSDP Skill eleven p1, Lesson two – on-ramp segments. DOL body of **5.3 Merging** discusses the on-ramp; there is **no** DOL heading “On-ramp segments”. | `5.3 Merging` (already on pack) | **OPEN** as a new DOL heading — do not invent `5.3 Merging (On-ramp segments)` |
| Exiting a highway | PSDP Skill eleven p1, Lesson four – exiting (“Teach the steps for exiting a highway”). Driver Guide has no numbered heading “Exiting a highway” / “Exit ramps”. Closest existing cites: `4.12 Signs` (exit / destination panels), `5.1 Speed (Adjusting speed for conditions)` (slow for the posted condition). | none new | **OPEN** — no verified DOL heading |
| Freeway ramp meters | Driver Guide TOC under **4.11**; body heading **FREEWAY RAMP METERS** | `4.11 Traffic light signals (Freeway ramp meters)` | **LOCKED** — added this pass |
| Steering gently at highway speed | PSDP Skill eleven p2, Lesson one: “Remind your teen to steer gently on highways.” No DOL heading with that name. Nearest verified subsection: **5.6 Curves** (“Gentle steering. Steer smoothly…”). | `5.6 Road and driving conditions (Curves)` | **OPEN** as a highway-speed heading; Curves string is locked if a later card cites the curve quote |

### Supporting quotes (verbatim from repo PDFs)

**On-ramp segments** — PSDP Skill eleven part one, Lesson two (`source/25WAPSDP_LR_v3.pdf`):

> Explain the three segments of on-ramps, and how they’re used: Entrance area… Acceleration area… Merge area…

DOL 5.3 Merging (`source/driver-guide.pdf`):

> Use the entire on-ramp, your turn signal, and your mirrors to merge into a safe space on the interstate.

**Exiting a highway** — PSDP Skill eleven part one, Lesson four:

> Teach the steps for exiting a highway: Identify the exit well ahead of time. Scan traffic for problems when approaching the exit, but don’t slow down on the highway. Start to signal four to six seconds before reaching the ramp. Upon entering the ramp, tap the brakes and begin to slow down to the posted exit ramp speed limit before reaching the curve.

No matching numbered DOL heading in `source/driver-guide.pdf`.

**Freeway ramp meters** — Driver Guide 4.11 body:

> FREEWAY RAMP METERS. Ramp meters work like regular traffic signals. When the light is red, stop at the white stop line. When the signal turns green, you can continue along the on-ramp.

**Steering gently** — PSDP Skill eleven part two, Lesson one:

> At fast highway speeds, excessive steering can be dangerous and lead to loss of control. Remind your teen to steer gently on highways.

DOL 5.6 Curves (`source/driver-guide.pdf`) — nearest official heading, not a highway-travel section:

> Gentle steering. Steer smoothly and gradually through the curve. Avoid oversteering or jerky movements, which can cause your vehicle to skid.

---

## Locked DOL strings Act V may cite

```
n/a
4.11 Traffic light signals (Freeway ramp meters)
4.12 Signs
5.3 Merging
5.1 Speed
5.1 Speed (Adjusting speed for conditions)
5.2 Space
5.4 Time (Count seconds)
4.4 Sharing with large vehicles
5.6 Road and driving conditions (Curves)
```

`4.11 Traffic light signals` (parent, no parenthetical) was already on the pack. Act V cards do not cite it.

---

## Card → skill / DOL

| Card | Type | `psdp_skill` (en-dash) | `dol_section` | Claude topic |
|---|---|---|---|---|
| V-001 | scene | Skill eleven: highway driving – part one | 4.12 Signs | observation / signs |
| V-002 | dossier | n/a | n/a | — |
| V-003 | scene | Skill eleven: highway driving – part one | 5.3 Merging | On-ramp segments (PSDP lesson; DOL heading OPEN) |
| V-004 | scene | Skill eleven: highway driving – part one | 5.3 Merging | On-ramp segments / merging |
| V-005 | hazard | Skill eleven: highway driving – part one | 5.3 Merging | merging |
| V-006 | rule | Skill eleven: highway driving – part one | 4.12 Signs | Exiting a highway (DOL heading OPEN; signs are verified) |
| V-007 | scene | Skill eleven: highway driving – part one | 5.1 Speed (Adjusting speed for conditions) | Exiting a highway (DOL heading OPEN; speed-for-conditions is verified) |
| V-008 | scene | Skill eleven: highway driving – part two | 5.1 Speed | Steering gently (DOL heading OPEN; Curves string unused) |
| V-009 | rule | Skill eleven: highway driving – part two | 5.3 Merging | lane change |
| V-010 | hazard | Skill eleven: highway driving – part two | 5.3 Merging | merging |
| V-011 | scene | Skill eleven: highway driving – part two | 5.2 Space | space / tailgater |
| V-012 | rule | Skill eleven: highway driving – part two | 5.4 Time (Count seconds) | three-second / exiting (PSDP) |
| V-013 | scene | Skill eleven: highway driving – part two | 4.4 Sharing with large vehicles | large vehicles |
| — | existing `deliveryBeat` | — | — | — |

No V-card cites ramp meters or 5.6 Curves yet. Do not write a ramp-meter card until Claude asks.

Part one = enter / leave (V-001, V-003…V-007). Part two = travel at speed (V-008…V-013). V-002 names the kit and the Ribbon; it does not teach.

---

## Unused allowlist leftovers (leave on the pack)

Act V does **not** cite these. They stay for other acts. Do not delete them.

**PSDP unused by V-001…V-013**

- `Skill one: before you start the engine`
- `Skill two: moving, steering, and stopping`
- `Skill three: how close are you?`
- `Skill four: backing up`
- `Skill five: driving on a quiet street – part one`
- `Skill five: driving on a quiet street – part two`
- `Skill six: looking ahead`
- `Skill seven: turning around`
- `Skill eight: parking – part one`
- `Skill eight: parking – part two`
- `Skill nine: multi-lane roads – part one`
- `Skill nine: multi-lane roads – part two`
- `Skill ten: city driving – part one`
- `Skill ten: city driving – part two`
- `Skill eleven: highway driving - part one` (hyphen alias; cards use the en-dash twin)
- `Skill eleven: highway driving - part two` (hyphen alias; cards use the en-dash twin)

**DOL unused by V-001…V-013** (includes new Act V-ready strings)

- `2.5 Vehicle Maintenance`
- `2.5 Vehicle Maintenance (Hand signals)`
- `2.5 Vehicle Maintenance (Headlights)`
- `2.5 Vehicle Maintenance (Turn signals)`
- `2.5 Vehicle Maintenance (Tires)`
- `3.1 Impaired driving (Fatigue and drowsy driving)`
- `2.6 Occupant Protection`
- `4.1 Sharing with people`
- `4.2 Sharing with school buses`
- `4.3 Sharing with transit buses`
- `4.6 Sharing with bicyclists`
- `4.7 Sharing the road with trains (Light rail)`
- `4.9 Sharing with emergency vehicles`
- `4.10 Traffic laws`
- `4.11 Traffic light signals`
- `4.11 Traffic light signals (Freeway ramp meters)` **new; unused**
- `4.13 Common intersections`
- `4.14 Turning`
- `4.16 Road markings`
- `4.16 Road markings (HOV / Carpool lane)`
- `4.17 Zones (School zone)`
- `4.17 Zones (Work zone)`
- `4.18 Parking`
- `5.5 Focus`
- `5.6 Road and driving conditions (Slippery roads)`
- `5.6 Road and driving conditions (Curves)` **new; unused**
- `5.10 Law enforcement`

`n/a` is used (V-002). Both Skill eleven **en-dash** headings are used.
