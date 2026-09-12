# SEED — IV-009 take-12 + IV-029 take-16 (Claude muted-read PASS)

Source: PR #130 / `cursor/act-iv-parallel-stills-e2f6`. No regen. No Act I–III. No plate overwrite. No Encore exterior compiles. Do not touch IV-018 or IV-010 (prior seeds / stale-slot — do not reopen).

Every take send: **card_id** + **lesson** + **shot token**.

| Card | Lesson | Shot | Seeded | Not seeded |
|---|---|---|---|---|
| **IV-009** | the PA switch is still off; the block ahead is a cone pinch, not a dying street | `POV_COCKPIT` | `cards/takes/IV-009-take-12.png` | take-11 (prior live); take-16 runner-up |
| **IV-029** | both in-ears are out; this is a portrait of Yuna only | `POV_PORTRAIT` | `cards/takes/IV-029-take-16.png` | take-15 (right IEM still in) |

Live masters are byte-identical to those takes (`cmp`). `imageUrl` `?v=a69`.

## IV-009 — When Loud Is Right

**card_id:** IV-009  
**lesson:** PA switch still off; cone pinch, not a dying street  
**shot:** `POV_COCKPIT`  
**driver:** yuna. Identity-free. Encore cockpit lock (PR #122 Y4 b-take-2). No Encore exterior.

Claude PASS — improvement over seeded take-11: dump closer, cone **line** on the left, hand + sleeve reaching the switch without throwing it. Two pedals. No mesh, no plow, no horn flares.

Residual (accepted): switch is an unguarded candy-red button, not a cover-down guard. Rain beads more than ice. Right side of the lane is not pinched.

## IV-029 — When Not To Be Loud

**card_id:** IV-029  
**lesson:** both in-ears are out; this is a portrait of Yuna only  
**shot:** `POV_PORTRAIT`  
**driver:** yuna

Claude PASS — preferred over take-15. Both ears empty. Both buds dangling. Night rain, cones, hatchback flank out of focus, no switch on the body, braid at the right temple, cropped jacket, rain on the shoulder. Person only. This is the take that beat the Y2 “right IEM in” lock bleed.

Residual (accepted): work pinch is two cones, not a tight line. Expression still, which the brief wants.

Take-15 residual: right earpiece still in the ear. Do not seed.

## Live DB

`DATABASE_URL` was not set in the seed environment (Railway MCP/OAuth lists production Postgres but does not return the value). File seed only.

When the live URL is available:

```
npm run seed -- IV-009 IV-029
npm run audit-stills -- --act IV
```
