# Act VI standing locks (Claude ACK)

Applies to **ALL** remaining Act VI stills (compiler + briefs), not per-card only.

## Geography (standing)
Western Washington backcountry — wet, close, overgrown, short sightlines, second-growth fir crowding the shoulder, blackberry and alder in the ditch line. **Restricted sightlines, vegetation close to the road.**

Compiler skew: “rural” → open western landscapes (sage, dry grass, long straight highways). That kills the lesson. Reject high desert / open western rural on sight.

Wired into `scripts/compile-prompt.js` as `ACT_VI_GEOGRAPHY` for every VI card.

## Carrier SPEC (verbatim — every gen prompt, no paraphrase)
`hard-sided; wire grille door facing inboard; Gracie's orange tabby markings visible behind the grille; belt routed through the handle`

Reject: “ginger tabby” paraphrase / soft/LED/leather variants.

## Cage
FULL-GRID windshield/side mesh. VI-009 take-2 = cage REF only (not shippable alone).

## Dash / 112
Dark dash default. Lit green turn arrows out. **112.0 out only if speedlike LCD**; odo/trip may remain.

## Cast
- Mya not in Act VI wave-1
- VI-013 = Ali driving LHD + Deac passenger + clipboard; prior take-2 HOLD
- All other cards: Ali alone

## Banked / do not touch
| Take | Status |
|---|---|
| VI-011 take-12 | **PASS** — Brad seeding; do not regen |
| VI-011 take-13 | FAIL |
| VI-004 take-5 | Seeded / leave |

## REF-only (out of ship queue)
| Take | Role |
|---|---|
| VI-009 take-2 | full-grid cage REF |
| VI-012 take-3 | carrier-restraint routing REF — full regen for ship |

## Delivery
No seed from regen agents. Brad seeds after muted-read. Priority after gate: **VI-013**, then pack1 001–003/005–006, pack2 007/008/010/012 (+009).

## VI-011 camera (Claude clarification — locked)
Curb-height true **PROFILE** (`POV_ROADSIDE_PROFILE`): travel left-to-right; culvert lip+narrowing SUBJECT ahead/beside at right edge; Menace holding middle of lane; nothing touching the lip.

**“Through rear cage”** = locked carrier readable through the rear **SIDE** window mesh (rear-quarter cage on the near flank) in that same profile flank shot — **not** a rear-facing / hatch / backward camera.

**PASS:** `cards/takes/VI-011-take-12.png` — Brad seeding. Do not regenerate unless asked. take-13 FAIL.

