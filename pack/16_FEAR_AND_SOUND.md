# 16 — FEAR AND SOUND

The world fights back. Presence is not a new system. Horror is not card art. Mute is not a fail.

This file is the spec for the fear overlay, the audio-first cue channel, the engine-start check, and the accessibility path. It does not wait on Phase 2 cockpit chrome. T1/T2 overlays sit on the existing shot frame. Every card in the deck inherits them.

---

## 1. The lesson (do not get this wrong)

Hearing is **not** required to drive. Deaf drivers are licensed in every state. Their safety record is not the argument against Eli's earbuds. If the game implies "you must hear or you fail," it has taught something false, and it is an accessibility problem the first time a school looks at it.

What **is** curriculum — and what Eli's habit actually is — is **chosen distraction**: earbuds in, stereo cranked, self-muting the world she is driving through.

Washington's statute on that is **RCW 46.37.480** (Headsets, earphones). Verified 2026-08-26 against [app.leg.wa.gov](https://app.leg.wa.gov/RCW/default.aspx?cite=46.37.480):

> (1) No person shall operate any motor vehicle on a public highway while wearing any headset or earphones connected to any electronic device capable of receiving a radio broadcast or playing a sound recording for the purpose of transmitting a sound to the human auditory senses and which headset or earphones muffle or exclude other sounds. This subsection does not apply to students and instructors participating in a Washington state motorcycle safety program.
>
> (2) This section does not apply to authorized emergency vehicles, motorcyclists wearing a helmet with built-in headsets or earphones as approved by the Washington state patrol, or motorists using hands-free, wireless communications systems, as approved by the equipment section of the Washington state patrol.

**Citation rule (same as the rest of the deck):** this RCW is verified. It still does **not** go on a card until a card is written to teach it. Do not retrofit a cite onto II-anything in this pass. Do not cite Trooper interviews, fine amounts, or "one ear is legal" as statute — that last is WSP enforcement practice, not the text of 46.37.480. When a card is written, the cite is `RCW 46.37.480`. The teaching target is chosen distraction, not "hearing required."

---

## 2. Technical reality: you cannot detect mute

Browsers cannot read the iOS silent switch or system volume. A mute gate is theater. Do not build one. Do not fail a run because AudioContext is silent. Do not put a volume-check lecture in settings.

What you **can** do:

**Audio is always first, never only.** Every hazard cue eventually arrives visually. Sound delivers it earlier. Play with the world audible and the horn happens before the crossing is in frame. Play muted and you get every cue late — which is exactly what driving with earbuds does. The game does not punish muting. The world gets harder, for the true reason.

| Path | Audio | Visual | Who |
|---|---|---|---|
| Sound on | cue at T | cue at T + lead (~1.6s) | default after engine catch |
| Muted (undetectable) | cue at T, unheard | cue at T + lead | Eli with the switch down — self-enforcing |
| Drive by sight | cue at T (may be unheard) | cue at T | accessibility; see §7 |

Lead time is the whole lesson. Do not shorten it because "she might miss it." Missing it is the point.

---

## 3. Presence is a sum, not a new system

Presence accumulates from **noise** every card already emits. Light, yaw, and timeout still cost cargo. They do not summon The Quiet. Presence decays during clean driving (correct, and the delta added nothing).

Never shown as a number. She reads it from the world.

```
add    = max(0, Δnoise)   // light, yaw, timeout do not summon
P      = P + add
if correct and add == 0: P = max(0, P - 2)
if P >= 23: collapse beat, then clamp P to 16 (stay T3)
```

Cargo, time_cost, and the existing meters are unchanged. Presence does not block progress. A collapse is a scare beat, not a wipe, and not a completed-run lock.

---

## 4. Four escalation tiers (ceiling vocabulary)

Horror lives in the **frame**, not the card PNG. Overlays sit on the shot wrap: mirror-slot sprites, window-edge decals, tightening vignette. No regeneration. No filter fights. Every existing card gets the system automatically.

Map only to ceiling tests that **PASS**ed. T12 was SOFT (clean standing silhouette, wrong-angle head did not survive) — the overlay commits to slack posture and a tilted head in CSS, which the image model would not hold. T13 was SOFT on card art (hand read as occupant's, inside); the overlay puts prints on the **outside** of the glass, matching T4 which PASS.

| Tier | Presence | What she sees | Ceiling ref | Audio (earlier than the visual) |
|---|---|---|---|---|
| **T0** | 0–3 | Whisper prints on glass (~10%). Thickness tracks the **noise meter**. | — | Bed only |
| **T1** | 4–8 | Distant unreadable silhouettes at the vanishing point; vignette starts | T6 | Wet footsteps / distant scrape |
| **T2** | 9–14 | One figure in the road, slack, head at a wrong angle; inside fog at the edges | T12 (commit the gait in CSS), T7 | Closer steps, a wet slap |
| **T3** | 15–22 | Attack pose in the glass. Prints are thick **while she is loud**. | T4 PASS, T13 intent | Palm on mesh |
| **T4** | ≥ 23 | Collapse beat (§6), then back to T3 | — | Cut to nothing |

**Prints track the noise meter.** At noise 0 they are a smear you can miss. They thicken as the bar fills. Drive quiet and they fade. They are not a sticky on/off that outlives the meter.

**Deac / the Ledger.** No rear window, no interior mirror. Overlay slots inherit that: a mirror contact appears in a **door mirror** (left of frame), or it does not appear until the figure is beside him — which is scarier than Ali's centered glass. T3 prints sit on side glass. Never a center-rearview smear on a Deac card. `html[data-driver="deac"]` moves `.fear-mirror` and `.fear-contacts` off the top-center slot.

Do not render The Quiet. Do not put faces on the silhouettes. Do not put blood on the glass — T8/T14 stay out of the overlay set. Grime, drag streaks, condensation.

---

## 5. Audio-first, never-only — cue list

Sound at T. Visual at T + lead, unless driving by sight.

| Cue | Audio first | Visual later | Typical cards |
|---|---|---|---|
| Wet footsteps | light, irregular, on gravel/wet | a shape in the door glass or far road | II-005, II-026, rain hazards |
| Distant horn | two-tone, far | crossing / obstruction edge | II-014 |
| Ice scrape | low grit, then a yaw tick | the road does not change; the vignette does | II-019 |
| Siren | before any lamp | lights, or a far flash | II-030 |

Correct resolutions get **quiet**. Meters ease. Rain only. **Never a success chime.** Silence is the reward, and it is the world's thesis: good driving is the thing that makes the fear recede. Wrong answers keep the existing sawtooth + shake — that is consequence, not spectacle.

---

## 6. Collapse beat (T4)

Show nothing we would have to render well.

1. Mirror slot fills. On Deac that slot is the **left door mirror**, not a center rearview.
2. Handprints multiply.
3. Dash dies.
4. Black.
5. Summary in **Deac's dispatch cadence**, cold:

   - noise: `KILO. Ledger. You went loud. They're on the glass. You are dark. Copy.`
   - light: `KILO. Ledger. You lit them. Glass is marked. You are dark. Copy.`
   - yaw: `KILO. Ledger. You broke the line. They're on you. You are dark. Copy.`
   - timeout: `KILO. Ledger. You froze. The world didn't. You are dark. Copy.`

Tap. She is back on the road at T3 with the prints. The run is not wiped.

---

## 7. Engine-start gate (once per session)

At run start, the engine turns over. **tap when it catches.** That is the control, not a settings lecture. It is starting the car. It also starts AudioContext on a real gesture.

- Once per browser session (`sessionStorage`). Not once per card.
- Visual catch is the needle holding. She can tap from what she sees.
- **Drive by sight:** press and hold the same control. No extra copy on screen. Persists in `localStorage`. Visual cues fire at T for the rest of this device. This is the accessibility path for players who do not hear — not a mute confession, not a fail.

Do not add a skip that says "I have the sound off." Do not detect silent-switch. Do not lecture.

---

## 8. Eli, specifically

She plays muted. The visual tier — silhouettes, gait, prints, vignette — carries the horror. Sound-on players get it earlier and worse. She may discover on her own that the scary version is the sound-on version. That is the game teaching the lesson without saying it.

**Re-test pass condition (after this ships, not "is it scary"):**

Does she say **it got worse when I was loud** — unprompted.

If she connects her driving to the world's behavior, the system reads. Everything after that is volume.

---

## 9. Build order

| Step | What | Wait on chrome? |
|---|---|---|
| 1 | Presence sum + decay on the existing `state` blob | No |
| 2 | T1/T2 overlays + vignette floor + engine gate + audio-first cues | No |
| 3 | Re-test with her. Pass = the sentence in §8 | — |
| 4 | Prints thicken with the noise meter (whisper at 0) | No |
| 5 | Collapse beat | No |
| 6 | Phase 2 cockpit chrome inherits the same overlay slots | Yes, later |

Do not wait for rolling road, radio, or Phase 3 micro-mechanics. Do not regenerate Act II art. Do not add points, accuracy, or streaks. Do not write Act III.

---

## 10. What this is not

- Not "hearing required to pass."
- Not a mute detector.
- Not a score.
- Not a filter fight with new horror plates.
- Not a statute on a card until a card is written for RCW 46.37.480.
