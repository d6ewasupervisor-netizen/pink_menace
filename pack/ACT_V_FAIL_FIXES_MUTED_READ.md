Brad → Claude — Act V FAIL-fix muted-read (PR #153) CORRECTED from branch tip. No art. No seed.
PASS unchanged: V-002 V-003 V-004 V-005 V-008 V-009 V-010 V-012.
Note: V-001 stays scene (schema blocks options on dossier; V-002 is the load dossier).

Authority: `cards/V-001.json` `V-006.json` `V-007.json` `V-011.json` `V-013.json` on `cursor/act-v-muted-read-fails-7710` tip `f1fc3e8` (PR #153). If this file and a card disagree, the card wins. Text only. Do not seed. Do not compile plates.

Verified from branch-tip JSON:
- V-001 decision exactly: Where do your eyes go on the approach?
- V-001 debrief only the interchange/signs/paint sentence (no second Yuna sentence)
- V-001 dol is 5.5 Focus (not 4.12)
- V-006 is keep-right / 4.10 Traffic laws (NOT Do Not Plant It / 5.3)
- V-007 dol_section n/a
- V-011 is zipper / 5.3 Merging (Zipper merging) (NOT Give the Ramp a Lane duplicate)
- V-013 dusk in scene + variation; Hollis kept

---

## V-001 — Eyes Up the Ribbon

**card_id:** V-001
**title:** Eyes Up the Ribbon
**card_type:** scene

**hook:** Yuna on the radio. The highway starts.

**scene:** Overcast morning on I-5 south of the Core. You have the wheel of the Menace. Nobody else is in the car. The relay kit for Tower 4 is already lashed in the back — repeater, antenna, clamps. The handheld on the floor crackles: Yuna. She will not be here. She wants the interchange, the green panels, and the paint named before you spend the ramp. The mountain is a gray smudge far east. This pavement is the Ribbon.

**decision:** Where do your eyes go on the approach?

**options**

- **a** (CORRECT): Name the interchange, the guide panels, and the lane lines ahead
  - result: You call the stack, the green boards, and the skip-dash. She clicks once. The bumper can wait. You already know which gap the next ramp wants.
- **b** (wrong): Watch the bumper of the car ahead so you do not hit it
  - result: You narrate chrome. The exit panel goes by unread. She has to name the ramp for you. Eyes on the bumper spent the only look that mattered.
- **c** (wrong): Ask her to stay on until she can talk you through every merge
  - result: The radio is a check, not a second driver. You missed a panel waiting for a voice that will not sit in this seat.
- **d** (wrong): Slow down in the travel lane so you can read every word on the next sign
  - result: You dump speed on I-5 to finish a sentence. The stack behind you lights. The ramp is where speed dies, not here.

**debrief:** Interchange, signs, paint — eyes up, not on the bumper.

**source**
- psdp_skill: Skill eleven: highway driving – part one
- dol_section: 5.5 Focus
- teaching_target: NEW: PSDP p1 Lesson one – observation. Pair 5.5 Focus (REVIEW — eyes up, not on the bumper). Not 4.12 Signs. Ali has the wheel; Yuna is radio-only.
- stat_cited: PSDP p.31: explain key highway features — interchanges, highway signs and signals, lane lines and markings.

**variation**
- location_type: highway
- weather: overcast
- time_of_day: morning
- tone: procedural
- failure_mode: none
- forced: Act V draft stub — no still; do not seed

---

## V-006 — Keep Right Except to Pass

**card_id:** V-006
**title:** Keep Right Except to Pass
**card_type:** hazard

**hook:** The left is empty. You already passed.

**scene:** Rain, midday, I-90 east, three lanes this way. You already passed a slow box. You are still in the left. The middle and the right are empty wet asphalt. A faster sedan is a smear in the inside glass, closing. The city habit is to own the left once you took it. The highway rule is keep right except to pass. The pass is over. The left is not a home. Nobody else is in the Menace.

**decision:** The pass is done. Which lane do you keep?

**options**

- **a** (wrong): Stay in the left — through traffic can live here after a pass
  - result: You camp the passing lane. The sedan stands on it behind you. You became the next slow in the left. Keep-right did not expire because you passed once.
- **b** (CORRECT): Signal right, recover to the right travel lane, leave the left for passing
  - result: Amber talks. You take the empty right and sit. The sedan uses the left and is gone. The pass was a tool. The right is the lane you keep.
- **c** (wrong): Drift into the middle and sit between both so nobody can pass you
  - result: You occupy the skip-dash. The sedan has no legal left. Two lanes become one because you wanted a buffer. The right was already empty.
- **d** (wrong): Slow in the left so the sedan goes around you on the right
  - result: You dump speed in the passing lane. He takes the right around a Beetle that should have recovered. You taught the highway to pass you on the junk side.

**debrief:** Keep right except to pass. You gave the left back after the box.

**source**
- psdp_skill: Skill eleven: highway driving – part one
- dol_section: 4.10 Traffic laws
- teaching_target: REVIEW of 4.10 Traffic laws. Highway keep-right except to pass. Recover right after the pass. Not a 5.3 merge/gap card and not V-005 copy.

**variation**
- location_type: highway
- weather: rain
- time_of_day: midday
- tone: urgent
- failure_mode: inexperience
- forced: Act V draft stub — no still; do not seed

---

## V-007 — Slow On the Ramp

**card_id:** V-007
**title:** Slow On the Ramp
**card_type:** rule

**hook:** The exit is named. The highway is still fast.

**scene:** Daylight rain, afternoon, I-5 south. A green exit panel sits far enough ahead that you can still choose. The right lane will become the ramp. Your cluster is highway speed. The curve on the ramp is tight. Dumping speed here, on the travel lanes, turns the stack behind you into a wall of lamps. The ramp is where the number dies. Yuna does not come back on for this.

**decision:** You have the exit. Where does the speed come off?

**options**

- **a** (wrong): Brake now in the travel lane so you arrive at the ramp already slow
  - result: You dump speed on I-5. The car behind you stands on it. You made a highway stop for a ramp that still had its own pavement.
- **b** (wrong): Hold highway speed past the gore and brake in the middle of the curve
  - result: You enter the bend still hot. The rear steps out. Yaw on a wet ramp is how a schedule ends, even with a late kit that still delivers.
- **c** (wrong): Skip this exit and take the next one so you do not have to slow at all
  - result: You miss a named exit because slowing felt rude. Tower 4 just grew a loop. The ramp was the legal place to lose the number.
- **d** (CORRECT): Hold speed on the highway, signal early, drop the number on the ramp
  - result: You keep their speed until the ramp owns you. The stalk talked four to six seconds back. On the ramp you tap the brakes and the curve gets the posted number.

**debrief:** Pick the exit early. Do not slow on the highway. You took the leftover off on the ramp.

**source**
- psdp_skill: Skill eleven: highway driving – part one
- dol_section: n/a
- teaching_target: NEW. PSDP p1 Lesson four – exiting. dol n/a: no DOL Exiting heading. Do not stretch 4.12 Signs. Player copy still teaches pick the exit, hold highway speed, signal early, drop the number on the ramp.
- stat_cited: PSDP p.31: Identify the exit well ahead of time… don’t slow down on the highway. Start to signal four to six seconds before reaching the ramp.

**variation**
- location_type: highway
- weather: rain
- time_of_day: afternoon
- tone: procedural
- failure_mode: none
- forced: Act V draft stub — no still; do not seed

---

## V-011 — Zipper at the Closure

**card_id:** V-011
**title:** Zipper at the Closure
**card_type:** hazard

**hook:** The right dies. Both lanes still run.

**scene:** Daylight rain, morning, I-90 east. A work zone ate the right in a half mile. Both lanes still run. Cones pinch toward the closure paint. The early-move habit wants the left now, to be polite, to be first. The zipper wants both lanes used until the teeth, then one-for-one. This is not a courtesy slide and it is not two lanes in one sweep. The handheld clicks once — Yuna, short, not a lecture.

**decision:** The right lane ends ahead. When do you zipper?

**options**

- **a** (CORRECT): Use the right until the closure paint, then take turns with the left
  - result: You use the lane until it ends. At the teeth you take one, give one. The stack is shorter than the polite line that started a mile early. She clicks once and stays quiet.
- **b** (wrong): Move left now so you are not the person who cuts at the end
  - result: You join the polite line. The right stays empty and angry. Someone late uses it and you resent them for doing the zipper. Early courtesy built the longer stack.
- **c** (wrong): Straddle both lanes until the last cone so nobody can beat you
  - result: You occupy two lanes in a highway work zone. Nobody zippers. You are the blockage the cones were trying to prevent.
- **d** (wrong): Brake in the right and wave the left through so they go first
  - result: You plant the Menace to look kind. The right stack lights. Take-turns is one-for-one at the teeth, not a courtesy stop in a live lane.

**debrief:** Use both lanes until the closure, then take turns. The zipper is take-turns, not an early courtesy move.

**source**
- psdp_skill: Skill eleven: highway driving – part two
- dol_section: 5.3 Merging (Zipper merging)
- teaching_target: NEW. Cite 5.3 Merging (Zipper merging). Highway work-zone / lane-closure take-turns. Not courtesy move-over. Not V-010 one-lane-at-a-time.
- stat_cited: DOL p.160–161: zipper merging — use both lanes until the designated merge, then alternate.

**variation**
- location_type: highway
- weather: rain
- time_of_day: morning
- tone: urgent
- failure_mode: inexperience
- forced: Act V draft stub — no still; do not seed

---

## V-013 — Let Hollis Have It

**card_id:** V-013
**title:** Let Hollis Have It
**card_type:** scene

**hook:** His bumper is in the glass. Again.

**scene:** Dusk on I-90 east, still the valley floor. The light is going and you are where you meant to be. Three lanes. The pass is a dark grade in the east — a door, not this road. You are in the center, holding a clean number. In the inside mirror a lifted truck fills the view — Hollis, too close, no gap you can count. The right lane is empty wet asphalt. Brake-checking him is a story he will finish with your rear. The highway move is to give him a lane and let him be someone else's problem.

**decision:** Hollis is on your tail in the center. The right is empty. What do you do?

**options**

- **a** (CORRECT): Signal right, take the empty lane, let him have the center
  - result: One change. He blows past in the center. Your following distance is yours again. You did not write a brake lamp into his windshield.
- **b** (wrong): Tap the brakes to tell him he is too close
  - result: Your lamps hit his glass. He stands on it or he climbs you. Either way you taught a tailgater with light. The empty lane was the sentence.
- **c** (wrong): Hold the center and drop ten so the gap in front of you looks safer
  - result: You slow in front of a man who will not. The gap behind dies. You spent your own cushion to keep a lane he wanted.
- **d** (wrong): Speed up until he cannot match the Menace
  - result: He matches. Then he matches more. You bought a race on a highway. The empty right was still empty.

**debrief:** Watch the glass for tailgaters and move to another lane so they can pass. Hollis took the center and left your doors alone.

**source**
- psdp_skill: Skill eleven: highway driving – part two
- dol_section: 5.2 Space
- teaching_target: REVIEW of 5.2 Space. PSDP p2 Lesson two – tailgater, move over. Dusk on this card is the on-schedule grade-pass only. daylight_fail ends the run via the fail end-beat and does not play or rewrite this card. Do not teach truck tire or axle.
- stat_cited: PSDP p.32: Watch mirrors for tailgaters and move to another lane to let them pass.

**variation**
- location_type: highway
- weather: overcast
- time_of_day: dusk
- tone: tense
- failure_mode: speed
- forced: Act V draft stub — no still; do not seed. One dusk scene: on-schedule grade-pass. daylight_fail ends the run via the existing fail end-beat and does not push the player onto this card.
