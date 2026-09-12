# IV-026 PR #142 — Claude muted-read delivery

**2026-09-12. Muted-read only. Do not seed. No Act I–III.**

Relay turn: `890f91af-07aa-4ac9-ad3d-178ec673adc5`  
Admin: `https://relay-production-d0b6.up.railway.app`  
PR: https://github.com/d6ewasupervisor-netizen/pink_menace/pull/142  
Branch: `cursor/iv-026-fail-regen-dd81`  
WAVE: `cards/takes/IV-026.WAVE.md`

If the admin POST is missing or you need a direct upload, attach these three files to that turn with the body below.

## Files (this folder)

| Role | File | sha256 | bytes |
|---|---|---|---|
| Closest | `IV-026-take-230.png` | `456af2197cff93ea8472789be89bfd49ee2c84a0d2e8a260dab42da57b406416` | 317965 |
| Runner | `IV-026-take-195.png` | `4bfb541408912490e5fed9f8e8b77356e6a381accce03130fbfe8d0a5ad8ce0c` | 346446 |
| Take-8 plow plate | `ref_car_nose_plow.png` | `c6c8ec1fe709ddb8329e7b5def830dae0959002bf838ba1afcdbaf51d63d1133` | 1358456 |

Source paths on the branch: `cards/takes/IV-026-take-230.png`, `cards/takes/IV-026-take-195.png`, `refs/ref_car_nose_plow.png`. Bytes match WAVE notes.

## Body (paste as-is)

```
IV-026 FAIL-regen wave READY (PR #142). Muted-read only. Do not seed.

Closest: cards/takes/IV-026-take-230.png — nose-toward from ahead; van+loading on Beetle’s right forward of plow; sliding side door; 179 downtown; take-8 plow.
Runner: cards/takes/IV-026-take-195.png

Note: Claude just FAILed PR #140 takes 199/194 — 194 remains hardware ref (truest take-8); 199 had better hazard geometry but still FAIL; next ask was one more wave. This PR #142 wave ran in parallel against the hard brief.

Residuals (Cursor): van still a bit larger; gap a little over two lengths; same-lane read soft.

Ask: PASS / FAIL.

https://github.com/d6ewasupervisor-netizen/pink_menace/pull/142
```

## Relay POST status

**Posted.** `POST /admin/reply` HTTP 200 at `2026-09-12T08:00:27.509Z`.

- `ok: true`
- `turnId: 890f91af-07aa-4ac9-ad3d-178ec673adc5`
- `status: replied`
- `replyAttachmentCount: 3`
- Fetch-back SHA256 matched all three local files.

| Attachment id | filename | size |
|---|---|---|
| `8fd58de7-e2cf-4294-a2da-92bac1dd8817` | `IV-026-take-230.png` | 317965 |
| `1f9a0748-c760-47bf-b587-c234ffe4b577` | `IV-026-take-195.png` | 346446 |
| `5de85c38-c337-4171-8803-39e82516d854` | `ref_car_nose_plow.png` | 1358456 |

No live seed. No Act I–III. Token was not written into this folder.
