# 36 — Act VI research gates (Claude)

Verbatim pull for Act VI text. Do not invent headings. Do not mint Skill fourteen. Do not write the 13-slot table in this pass — Claude writes slots from this pack.

**Locks (do not contradict):** Zone **The Backcountry** — rural roads and roundabouts, valley floor east of the Ribbon. Driver **Ali alone**. Yuna radio-only if she appears at all. PSDP **Skill twelve** + **Skill thirteen** (both unspent). Last act before the pass — **chains / Snoqualmie = Act VII**. Shape: **13 cards + existing end beat** (same as Act V). No stills. No seed. Card JSON remains sole brief authority when slots exist.

**Sources:** `source/25WAPSDP_LR_v3.pdf` (WA PSDP), `source/driver-guide.pdf` (WA Driver Guide).

**Spend count basis:** live `cards/{I,II,III,IV}-*.json` on `main` plus live Act V `cards/V-*.json` from playtest stack `cursor/ship-act-iv-v-playtest-c458` (Act V not yet on `main` when this pack was written). `n/a` omitted from counts.

---

## 1) Skill twelve / thirteen — exact allowlist strings

**Absent from `pack/08_PSDP_SKILLS.json` on `main` before this PR.** This pass adds both. No part one / part two.

From WA PSDP printed TOC (PDF page 7):

> Skill twelve: driving on rural roads

> Skill thirteen: roundabouts

Same two strings, now on the allowlist:

```
pack/08_PSDP_SKILLS.json
  "Skill twelve: driving on rural roads"
  "Skill thirteen: roundabouts"
```

TOC titles for twelve / thirteen contain **no** en-dash (unlike Skill five / eight / nine / ten / eleven `– part …`). No hyphen alias pair is required. Lesson headings inside the body **do** use en-dash **U+2013** (`Lesson one – gravel roads`, etc.) — quote those as printed; they are not allowlist skill strings.

Printed body pages **33** / **34** (PDF pages 40 / 41). Banners:

> SKILL TWELVE:
> DRIVING ON RURAL ROADS

> SKILL THIRTEEN:
> ROUNDABOUTS

PDF page 41 also reprints the Skill twelve banner above the Skill thirteen banner (layout leftover). The Skill thirteen body heading and TOC string are still **roundabouts** / **ROUNDABOUTS**.

There is no Skill fourteen in this edition. Next TOC headings after thirteen:

> Continuing education
> Practice in other conditions

Park `Practice in other conditions` (+ chains / Snoqualmie / night / snow) for **Act VII**.

---

## 2) Skill twelve — lesson headings (printed p. 33)

Doc: `source/25WAPSDP_LR_v3.pdf` printed p. 33.

Body title under the page number:

> Driving on rural roads

Goal / location (verbatim):

> Goal: Teach your teen to drive safely and with confidence on two-lane rural roads.
> Location: A two-lane rural road.

### Lesson one – gravel roads

> Lesson one – gravel roads
> Gravel roads present their own special road safety challenge; the issue is traction. Driving on loose gravel is harder than driving on pavement because your tires don’t have the traction needed to give you stable control. Slow down, avoid sudden turning, accelerate and brake slowly, and increase your following distance to six seconds. Be particularly aware of gravel “windrows,” piles of gravel near the road edge, used for highway maintenance.

Sidebar **Gravel slide** (same page):

> Be ready for skids. A vehicle can become difficult to handle in heavy gravel. If the vehicle starts to skid, release the accelerator or brake. As you release them, look where you want to go, and steer in this direction.

**DOL home:** none titled gravel / windrows / gravel skid. Pair optional review `5.6 Road and driving conditions (Skidding)` only if the card teaches the skid recovery that 5.6 actually prints. Otherwise cite PSDP alone with `dol_section` **`n/a`**.

### Lesson two – driving hazards

> Lesson two – driving hazards

Printed hazard sub-headings (exact labels, including colon):

| Sub-heading (verbatim) | Lead quote |
|---|---|
| **Large/slow vehicles:** | Slower trucks, farm vehicles, and road maintenance equipment are likely to make wide turns at unmarked entrances. Use caution and make sure the driver can see your vehicle before passing. |
| **Sharp drop-offs and gravel shoulders:** | One of the most common driving hazards is running off the road. The urge to overcorrect is strong and often results in a serious crash. |
| **Restricted visibility:** | Trees, cornfields, buildings, and hills can block a driver’s view of oncoming traffic, or traffic entering from the side. |
| **Uncontrolled intersections:** | These are intersections not controlled by signs, signals, or pavement markings. Use caution, slow down, and check both ways twice. … The vehicle on the left should yield. |
| **Animals:** | If unable to stop for an animal crossing the road, do NOT swerve — swerving makes it hard to keep control. |
| **Hills and curves:** | These are often steeper and sharper on rural roads than on highways. Before reaching the crest of a hill, or entering a curve, slow down, move to the right side, and watch for traffic. |
| **Railroad crossings:** | Always slow down, look both ways, listen, and be prepared to stop. On rural roads, many railroad crossings are marked only with a round yellow ‘Railroad Crossing Ahead’ warning sign and a white X-shaped railroad crossing. |

Run-off recovery steps under **Sharp drop-offs and gravel shoulders** (verbatim bullets):

> • Do not turn the wheel; continue driving straight.
> • Take your foot off the accelerator.
> • Find a safe place to reenter the road.
> • Turn on your turn signal and reenter the road when it is clear.
> • In general, try to not apply brakes until regaining control of the vehicle.

Animals continuation (verbatim):

> If you see an animal, slow down and be prepared to stop. Always be on the lookout, especially at sunrise and sunset. October and November are peak months for deer crashes. Deer travel in groups; if you see one, look for more.

---

## 3) Skill thirteen — lesson headings (printed p. 34)

Doc: `source/25WAPSDP_LR_v3.pdf` printed p. 34.

Body title:

> Roundabouts

Goal / location:

> Goal: Teach your teen how to enter and drive roundabouts safely.
> Location: A road that leads to a one-lane roundabout. Move on to practice at two or more lane roundabouts when your teen is ready.

### Lesson one – five easy steps

> Lesson one – five easy steps

Printed step labels + body:

> • Slow down: Speeds of 15 mph or less are generally adequate in the roundabout.
> • Yield: Vehicles entering must always yield to cars already in the roundabout. Look to your left for entering traffic.
> • Don’t stop, stay in lane: Don’t stop once inside the roundabout. The vehicle in the roundabout has the right of way. Do not change lanes within the roundabout.
> • Follow signs: Look for destination signs and exit in that direction.
> • Exit: Look to your right, check your side mirror and use your turn signal.

Sidebar **Yield the right-of-way**:

> As a rule of thumb, when entering or driving through a roundabout, always yield to traffic on your left.

### Lesson two – emergency vehicles

> Lesson two – emergency vehicles

> • If you have not entered the roundabout, pull over and allow emergency vehicles to pass.
> • If you have entered the roundabout, continue to your exit, then pull over and allow emergency vehicles to pass.
> • Avoid stopping in the roundabout.

### Lesson three – two or more lane roundabouts

> Lesson three – two or more lane roundabouts

> • As you approach, observe the signs and arrows to determine which lane to use before entering.
> • Signs on the side of the road and white arrows on the road will show the correct lane to use.
> • If you want to make a left turn, stay in the left lane or other lanes that are signed and marked as a left turn.
> • To make a right turn, stay in the right lane or other lanes that are signed and marked as a right turn lane.
> • If you want to go straight, observe the signs and arrows to see what lane is correct.

---

## 4) DOL map for the same material — unused / used-once after I–V

### Named candidates (user list) + real leftovers

| Heading / topic | Pack string (canonical) | I–V spend | Act VI? |
|---|---|---|---|
| **4.8 Sharing with agricultural vehicles** | `4.8 Sharing with agricultural vehicles` | **UNUSED** (not on `main` `pack/07` before this PR) | **Yes — first spend.** Body: triangle emblem ≤25 mph; patient; 3 ft pass. |
| **4.15 Other intersections** (parent) | `4.15 Other intersections` | **ONCE** — **IV-015** (downtown Seattle roundabout yield / look left / stay in lane / signal exit), under Skill ten p2 | Parent already spent. Prefer **children** for new VI cites when the card needs a fresh string. |
| **4.15 → Roundabouts** | `4.15 Other intersections (Roundabouts)` | **UNUSED child** | **Yes** for Skill thirteen leftovers (five-step, emergency-in-circle, multi-lane). Do not clone IV-015’s downtown brief. |
| **4.15 → Diverging diamonds** | `4.15 Other intersections (Diverging diamonds)` | **UNUSED child** | Optional VI leftover. Not PSDP Skill twelve/thirteen. Zone-fit is weak for Backcountry; park unless a card truly needs it. |
| **4.15 → Uncontrolled Intersection** | `4.15 Other intersections (Uncontrolled Intersection)` | **UNUSED child** | **Yes** — pairs Skill twelve **Uncontrolled intersections:** (PSDP). TOC capital-I on “Intersection”. |
| **4.7 Sharing the road with trains** | Parent `4.7 Sharing the road with trains`; child already on pack: `4.7 Sharing the road with trains (Light rail)` | **Light rail child ONCE** — **IV-006**. Parent / rural-crossing body **unused as a cite** | **Yes** for Skill twelve **Railroad crossings:** — cite parent or keep PSDP + parent; **do not** re-teach street light rail. |
| **4.0 Awareness and cooperation** | `4.0 Awareness and cooperation` | **UNUSED** | Soft optional. Courtesy / shared road. Not a Skill twelve lesson label. |
| **5.6 Road and driving conditions** children | see below | Slippery **2×** (II-019, III-024). Curves / Night / Skidding / Hydroplaning **unused** as child strings | Curves / Skidding usable for rural hills-curves / gravel skid **if** the card’s teach matches 5.6 body. Night / Hydro / chains → **VII**. |
| **Animals in the roadway** | — | No DOL section titled animals-on-road / deer / wildlife. `4.19 Transporting (Animals)` is **cargo pets** (**IV-018 once**) — different topic. `4.12 Signs` gallery tile **Deer crossing** only. | **PSDP alone** → `dol_section` **`n/a`** (or review `4.12 Signs` only if the card is the deer-crossing **sign**). |
| **Gravel / soft shoulder / run-off** | — | No DOL heading “gravel roads” or “run off the road.” `4.12 Signs` gallery tile **Soft shoulder**. Motorcycle `4.5` mentions gravel as road-surface for bikes (**IV-008 once**) — not rural run-off. | **PSDP Skill twelve** + `n/a`, or `4.12 Signs` only for the soft-shoulder **sign**. |

### 5.6 children — spend status

| Child string | I–V | Park / spend |
|---|---|---|
| `5.6 Road and driving conditions (Slippery roads)` | **2×** II-019, III-024 | Do not first-spend; review only if needed. Chains bullet lives here → **VII**. |
| `5.6 Road and driving conditions (Curves)` | **unused** | Optional VI pair for Skill twelve **Hills and curves:** / gentle steering. |
| `5.6 Road and driving conditions (Skidding)` | **unused** | Optional VI pair for gravel-slide / skid sidebar. |
| `5.6 Road and driving conditions (Night driving)` | **unused** | **Act VII** |
| `5.6 Road and driving conditions (Hydroplaning)` | **unused** | **Act VII** (weather) |

### Other unused / once strings that touch Act VI themes

| String | Spend | Note |
|---|---|---|
| `4.9 Sharing with emergency vehicles` | **once** III-022 | General pull-right. Skill thirteen **Lesson two – emergency vehicles** is the **in-roundabout** rule (continue to exit). Different teach — legal as Skill thirteen + same or paired DOL, but do not clone III-022’s Central stack brief. |
| `4.12 Signs` | **3×** | Soft shoulder / Deer crossing / Slow moving vehicle tiles live in the gallery. II-013 already taught **orange SMV triangle** under 4.12. |
| `4.13 Common intersections` | **once** II-024 | All-way stop — **not** uncontrolled. |
| `4.5 Sharing with motorcycles` | **once** IV-008 | Gravel mention is bike-surface only. |
| `Skill eight: parking – part two` | **unused** | Leftover II. Not Backcountry. |

### Supporting DOL body quotes (verbatim)

**4.8** (`source/driver-guide.pdf` body **SHARING WITH AGRICULTURAL VEHICLES**):

> Agricultural and farm vehicles designed to go 25 mph or less will have a triangle sign or emblem on the back. When you see a slow moving vehicle, remember to: Be patient and slow down. Give plenty of space and use caution when passing. … As you pass, there should be at least 3 feet between the widest part of your vehicle and the agricultural vehicle.

**4.15 Roundabouts** (body **ROUNDABOUTS** + **How to drive a roundabout**):

> A roundabout is a circular intersection where all approaching vehicles yield on entry and travel counterclockwise around a raised center island.
> … Yield to all traffic in the roundabout. Look left and yield to all traffic already in the roundabout since they have the right-of-way.
> … Drive through the roundabout and pull over if an emergency vehicle approaches, just like you would at any other intersection.

**4.15 Uncontrolled Intersection**:

> Uncontrolled intersections don’t have signs, but the normal right-of-way rules apply. … When you enter an uncontrolled intersection, you must yield the right-of-way if any of these apply: A vehicle is already in the intersection. You enter or cross a state highway from a secondary road. You enter a paved road from an unpaved road. You plan to make a left turn and a vehicle is approaching from the opposite direction.

**4.7** rural-crossing body (parent; not the Light rail child):

> Only drive across railroad tracks at designated crossings. … Trains ALWAYS have the right-of-way. … Do not try to beat a train across the tracks. … Trains can come from either direction and run on any track.

**4.0**:

> 4.0 \| AWARENESS AND COOPERATION
> The key is courtesy, respect, and awareness of others.

---

## 5) Repeat flags — Act II / III / IV / V

| Risk | Prior card | What was taught | Act VI rule |
|---|---|---|---|
| **Roundabout yield / look left / stay in lane / signal exit** | **IV-015** (`4.15 Other intersections`, Skill ten p2, downtown Seattle) | Core circle entry already spent on the **parent** | Do **not** rewrite IV-015. Spend **Skill thirteen** on unused PSDP lessons: full **five easy steps**, **emergency vehicles in a roundabout**, **two or more lane** lane-choice. Prefer child `4.15 Other intersections (Roundabouts)`. |
| **4.15 leftovers after IV-015** | IV-015 only | Parent used once. Children Roundabouts / Diverging diamonds / Uncontrolled Intersection never cited | Leftover = **all three children** + Skill thirteen PSDP heading + rural one-lane practice location. |
| **Slow-moving / farm triangle** | **II-013** (`4.12 Signs`, Skill six) — orange SMV triangle on a Kent tractor | Sign recognition + pass only with sightline | **4.8** is still unused. Act VI may first-spend 4.8 (3 ft / patience / wide turns) under Skill twelve **Large/slow vehicles:** — do not clone II-013’s “triangle ahead / insulin clock” brief as another 4.12-only card. |
| **Uncontrolled vs four-way** | **II-024** (`4.13 Common intersections`) — all-way stop | First-in / yield-to-right at **signed** stops | Different rule. Skill twelve uncontrolled + `4.15 Other intersections (Uncontrolled Intersection)` is still fresh. |
| **Emergency vehicle pull-right** | **III-022** (`4.9`) | Right, stop, wait on Central | Skill thirteen lesson two adds **already-in-circle → continue to exit**. New teach; don’t restage III-022. |
| **Trains / rails** | **IV-006** (`4.7 … (Light rail)`) | Street light rail groove downtown | Rural passive crossing (yellow advance + white X, maybe no gates) is Skill twelve **Railroad crossings:** — not a light-rail replay. |
| **Animals** | **IV-018** (`4.19 Transporting (Animals)`) | Secure pets in the cab | Wildlife / do-not-swerve is PSDP-only (`n/a`). |
| **Slippery / weather** | II-019, III-024 | 5.6 Slippery | Do not open Act VI on rain/ice. Chains / Snoqualmie / night / fog stay **VII**. |
| **Highway / Ribbon** | Act V Skill eleven | On-ramp, meters, exit, space at speed | No Skill eleven replay. Backcountry is rural + roundabout. |

---

## 6) Pack allowlist actions this PR

### `pack/08_PSDP_SKILLS.json`

Add:

```
Skill twelve: driving on rural roads
Skill thirteen: roundabouts
```

### `pack/07_DOL_SECTIONS.json`

Add verified Act VI-ready strings (no minted headings):

```
4.0 Awareness and cooperation
4.7 Sharing the road with trains
4.8 Sharing with agricultural vehicles
4.15 Other intersections
4.15 Other intersections (Roundabouts)
4.15 Other intersections (Diverging diamonds)
4.15 Other intersections (Uncontrolled Intersection)
5.6 Road and driving conditions (Curves)
5.6 Road and driving conditions (Skidding)
```

`4.7 Sharing the road with trains (Light rail)` stays (already on pack; spent IV-006).

Do **not** invent: `5.6 … (Gravel)`, `5.6 … (Animals)`, `4.12 Signs (Soft shoulder)`, `4.12 Signs (Deer crossing)`.

---

## 7) Claude-ready slot inputs (no table yet)

Use these exact skill strings on cards:

- `Skill twelve: driving on rural roads`
- `Skill thirteen: roundabouts`

Skill twelve lessons available to distribute across the 13 + end beat:

1. Lesson one – gravel roads (+ Gravel slide sidebar)
2. Lesson two – Large/slow vehicles:
3. Lesson two – Sharp drop-offs and gravel shoulders: (run-off steps)
4. Lesson two – Restricted visibility:
5. Lesson two – Uncontrolled intersections:
6. Lesson two – Animals: (`dol_section` **n/a** unless citing a 4.12 deer sign)
7. Lesson two – Hills and curves:
8. Lesson two – Railroad crossings:

Skill thirteen lessons:

1. Lesson one – five easy steps
2. Lesson two – emergency vehicles
3. Lesson three – two or more lane roundabouts

Priority unused DOL first-spends: **4.8**, **4.15 (Roundabouts)**, **4.15 (Uncontrolled Intersection)**, **4.7** parent (rural crossing), optional **4.0**, optional **5.6 Curves / Skidding**.

Park for VII: chains / Snoqualmie / night / snow / hydroplane / `Practice in other conditions`.
