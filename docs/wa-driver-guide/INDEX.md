# Washington State Driver Guide — Teaching Index

> Source of truth: `docs/wa-driver-guide/Washington State Driver Guide text only.pdf`
> (81 pages). A plain-text extraction lives beside it as `guide_extracted.txt`
> (generated 2026-09-30, pypdf; page markers `[[PAGE n]]`).
> Any rule, distance, speed, sign, right-of-way call, following distance, or
> stopping behaviour in the game must match this text. When a card or the
> dialogue file disagrees with this text, the text wins (see `/AUDIT.md` § BLOCKED
> DECISIONS).

## How to read this index

- **Section** — the guide's own heading (`chapter.section: title`).
- **Taught by** — where the game teaches it: an act (`ACT I–VI`), a card id
  (`II-012`), a drive mission (`mission_central_ledger`), or the knowledge exam
  (`exam_40` / question banks). "—" means the game teaches it nowhere yet.
- **Channel** — `scene` (live 3D drive / on-foot), `card` (PINK MENACE card),
  `exam` (Act IV gate / study-terminal questions).

Card citations below were read from each card's `source.dol_section` and
cross-checked against the extracted guide text; discrepancies are flagged.

---

## Chapter 1 — Licenses

| Section | Taught by | Channel |
|---|---|---|
| 1.0 Deciding to drive | exam (`washington_laws`) | exam |
| 1.5 New residents | exam | exam |
| 1.8 Getting a personal driver license | exam | exam |
| 1.12 Personal driver license exams | exam | exam |
| 1.13 Driver training education | exam; ACT IV framing | exam |
| 1.14 For guardians of new drivers | exam | exam |
| 1.15 Maintaining your license (DUI / BAC / THC thresholds) | exam | exam |
| 1.16 Additional services | — | — |

**Chapter 1 gap:** the whole chapter is knowledge-test material (licensing is
not a driving skill). No drive scene practises it. Known gap, not a defect.

---

## Chapter 2 — Vehicles

| Section | Taught by | Channel |
|---|---|---|
| 2.4 Know your vehicle (adjustments) | exam | exam |
| 2.5 Vehicle maintenance (lights, tires, wipers, signals) | II-002, II-006, II-008, II-016, II-020, II-022, II-028, II-031, III-006, III-017, III-019, III-028 | card |
| 2.6 Occupant protection (seatbelt) | I-003, II-028, II-031, V-013; exam | card + exam |
| 2.7 Steering | I-002, I-004, I-009 (carport tutorial) | scene + card |
| 2.8 Braking (4 levels, ABS, emergency) | `tutorial_carport`; stopping shadow | scene |
| 2.9 Accelerating | `tutorial_carport` | scene |
| 2.10 Balanced weight (pitch/roll/yaw) | exam | exam |
| 2.11 Vehicle reference points | `minigame_park_dol` (ACT I), Bea back-in / Tuna parallel (ACT II) | scene |
| 2.12 Your blind zones | II-005, II-026; `minigame_park_dol` (rear check) | card + scene |
| 2.13 Before you go | exam | exam |

---

## Chapter 3 — Drivers

| Section | Taught by | Channel |
|---|---|---|
| 3.0 You behind the wheel (vision, night, health) | ACT VI `straight_night_drive` (headlight range) | scene |
| 3.1 Impaired driving (fatigue) | III-016, III-020; ACT VI `straight_night_drive` (microsleep) | card + scene |
| 3.2 Informed decisions (OODA) | exam | exam |
| 3.3 Problem solving on the road | exam | exam |
| 3.4 Avoiding distracted driving | II-009, III-027; exam | card + exam |
| 3.5 Smart drivers | exam | exam |
| 3.6 Respect and responsibility | exam; story | exam |

---

## Chapter 4 — Roads

| Section | Taught by | Channel |
|---|---|---|
| 4.1 Sharing with people (pedestrian yield, crosswalks) | IV-004, IV-005, IV-012; exam | card + exam |
| 4.2 Sharing with school buses | II-007, II-010; `mission_delivery_3_radio` bus beat | card + scene |
| 4.3 Sharing with transit buses | III-021; exam | card + exam |
| 4.4 Sharing with large vehicles | III-011, III-012, V-006; `mission_central_ledger`, `escort_ritzville` | card + scene |
| 4.5 Sharing with motorcycles | IV-008; exam | card + exam |
| 4.6 Sharing with bicyclists (3 ft, bike lanes, doors) | II-005, II-026, IV-013; exam | card + exam |
| 4.7 Sharing with trains (crossbuck, 15–50 ft) | VI-012; `mission_backcountry_run` crossbuck | card + scene |
| 4.8 Sharing with agricultural vehicles | VI-005; exam | card + exam |
| 4.9 Sharing with emergency vehicles (move-over / slow) | III-022; `escort_ritzville` move-over | card + scene |
| 4.10 Traffic laws | III-001, III-003, III-029, IV-002; exam | card + exam |
| 4.11 Traffic light signals (+ ramp meters) | III-014, V-004; exam | card + exam |
| 4.12 Signs (stop, yield, speed, school, roundabout, crossbuck) | II-003, II-013, IV-007; in-world sign prompts | card + scene |
| 4.13 Common intersections (four-way / two-way right-of-way) | II-024; `mission_jonah_intersection` | card + scene |
| 4.14 Turning (100 ft signal, closest lane, U-turns) | II-004, II-015, II-029, II-030, III-006, III-029 | card + scene |
| 4.15 Other intersections (roundabout, uncontrolled) | VI-006, VI-007, VI-008, IV-015; `mission_backcountry_run` | card + scene |
| 4.16 Road markings (solid/dashed, turn lanes, HOV) | II-017, III-008, III-015, III-023 | card + scene |
| 4.17 Zones (school 20 mph, work zone, emergency zone) | II-002, II-023, V-008; school-zone beat | card + scene |
| 4.18 Parking (perpendicular, angled, parallel, hill) | II-021, IV-011; `minigame_park_dol`, Bea back-in, Tuna parallel | card + scene |
| 4.19 Transporting (animals/cargo) | II-018, IV-018; exam | card + exam |
| 4.20 Maritime | — (ferry/speed-limit only) | — |

---

## Chapter 5 — Hazards

| Section | Taught by | Channel |
|---|---|---|
| 5.0 Dangers of driving (risk awareness, hazard perception) | IV-026, IV-030 (framing) | card |
| 5.1 Speed (limits, adjust for conditions) | `climb_snoqualmie` (35), school (20), bridge (45); exam | scene + exam |
| 5.2 Space (following distance — see conflict below) | II-014, III-005, III-009, III-010, III-018, IV-027; `mission_central_ledger` | card + scene |
| 5.3 Merging (ramp right-of-way, zipper) | V-003, V-005, V-011, III-007, III-026; `mission_ribbon_merge`, `mission_convoy_issaquah` | card + scene |
| 5.4 Time (eye-lead, count seconds) | exam; **mis-cited as following rule by II-012 / V-012 (see below)** | exam |
| 5.5 Focus | V-001, V-009, II-009, III-027 | card |
| 5.6 Road & driving conditions (night 400 ft, ice, gravel, skid, hydroplane) | III-024, VI-010, II-019; `climb_snoqualmie` (ice), `straight_night_drive` (headlight pool), `mission_backcountry_run` (gravel) | card + scene |
| 5.7 Vehicle failures | exam | exam |
| 5.8 Communicating risk | exam | exam |
| 5.9 Collisions | exam | exam |
| 5.10 Law enforcement | exam | exam |

---

## Accuracy flags (guide text vs. game content)

1. **Following distance (S1, teaching).** Cards `II-012`, `V-012` and the sim
   graders (`ledger.ts`, `ribbon.ts`, `convoy.ts`: `FOLLOW_S = 3.0`) teach a
   **"three-second dry-road following" rule**; `escort.ts` (`FOLLOW_S = 4`)
   teaches **"four seconds behind a truck"**. The text-only guide never states a
   seconds-based following rule. Guide **5.2 Space** says instead:
   > "leave a distance that's at least twice the length of your vehicle".
   Guide **5.4 Time (Count seconds)** is a *15-second eye-lead* exercise, not a
   following-distance rule — so `II-012`/`V-012`'s `dol_section` citation
   ("5.4 Time") points at the wrong heading. → **BLOCKED DECISION** (see AUDIT).
   Gameplay fix: expose the rule behind a named config (`FOLLOW_RULE`); do not
   silently rewrite canon.

2. **Hand signals.** `II-006`, `II-016`, `II-022`, `III-006`, `III-019` cite
   "2.5 Vehicle Maintenance (Hand signals)". The text-only guide has **no
   hand-signal content** (that lives in the illustrated edition). The *turn-signal*
   rule the game practises is correctly supported by **4.14 Turning** ("Put on
   your turn signal at least 100 feet…"). Citation string imprecise; teaching fine.

3. **Truck stopping distance.** `mission_central_ledger` grades the follow-behind
   Deac's truck; guide **4.4** gives the concrete large-vehicle figure — "a loaded
   truck … traveling at 55 mph [needs] **450 feet** to come to a complete stop."
   The game's truck braking decel (4.6 m/s², `CHASSIS_DECEL.truck`) with the 1.5 s
   reaction band gives ~337 ft at 55 mph — *shorter* than the guide's 450 ft,
   because 450 ft folds in a longer large-vehicle perception/reaction. Direction
   is correct (truck > car, ice > dry); the exact 450 ft figure is not surfaced
   in-game. The stopping shadow should not quote it unless the reaction term is
   also modelled.

4. **Reaction time.** The stopping shadow uses a 1.5 s reaction time. The guide
   gives no reaction-time constant (frames it via hazard perception). 1.5 s is
   the standard driver-perception-reaction figure and is not contradicted.

---

## Reverse index — game lessons the guide does NOT support

- **"3-second / 4-second / 6-second following" as stated numbers** — not in the
  text-only guide (which uses "twice the length of your vehicle"). Flagged above;
  do not extend this teaching further without the owner.
- **"Stay under 9 mph" (bridge toy beat)** and **"above 18 mph" (moth beat)** —
  narrative pacing beats, not guide doctrine. Keep out of teaching copy.
- **Quiet swarm pressure** — the zombie fiction. Must never be presented as a
  driving rule.

## Coverage summary

- **Taught in-scene or by card**: 2.7, 2.8, 2.9, 2.11, 2.12, 4.2, 4.4, 4.7, 4.9,
  4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18, 5.1, 5.2, 5.3, 5.6, 3.0, 3.1
  (plus their card/exam channels).
- **Exam-only** (no drive practice): all of Chapter 1, 2.4, 2.10, 2.13, 3.4, 3.5,
  3.6, 4.1, 4.3, 4.5, 4.6, 5.4, 5.7, 5.8, 5.9, 5.10.
- **Not taught anywhere**: 1.16 Additional services, 4.20 Maritime.