# Act IV citation audit — text before pixels

Human citation audit for IV-002–IV-030. No art, no frame seed, no Encore exterior compile.

`pack/07_DOL_SECTIONS.json` and `pack/08_PSDP_SKILLS.json` are mid-patch (Skill ten + unused ch.4/5 TOC). Cards cite the **intended TOC headings** from the slot table. Do not invent substitute section numbers just because the allowlist is incomplete.

**ok** = verbatim in the current allowlist.  
**pending-allowlist** = intended heading written on the card; not yet in pack/07 or pack/08.

PSDP strings use U+2013 en-dash, matching Skill five / eight / nine.

| Card | Type | Driver | `psdp_skill` | PSDP | `dol_section` | DOL |
|---|---|---|---|---|---|---|
| IV-001 | ride-along (lines only) | yuna | Skill ten: city driving – part one | pending-allowlist | n/a | ok |
| IV-002 | dossier | ali | n/a | ok | n/a | ok |
| IV-003 | scene | ali | Skill ten: city driving – part one | pending-allowlist | 5.0 Dangers of driving (Hazard perception) | pending-allowlist |
| IV-004 | scene | ali | Skill ten: city driving – part one | pending-allowlist | 4.1 Sharing with people | pending-allowlist |
| IV-005 | hazard | ali | Skill ten: city driving – part one | pending-allowlist | 4.1 Sharing with people | pending-allowlist |
| IV-006 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.7 Sharing the road with trains (Light Rail) | pending-allowlist |
| IV-007 | rule | ali | Skill ten: city driving – part one | pending-allowlist | 4.12 Signs | ok |
| IV-008 | scene | ali | Skill ten: city driving – part one | pending-allowlist | 4.5 Sharing with motorcycles | pending-allowlist |
| IV-009 | convoy | yuna | Skill ten: city driving – part two | pending-allowlist | n/a | ok |
| IV-010 | dossier | yuna | n/a | ok | n/a | ok |
| IV-011 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.18 Parking | ok |
| IV-012 | ledger | ali | n/a | ok | n/a | ok |
| IV-013 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.18 Parking (Parallel parking) | pending-allowlist |
| IV-014 | hazard | ali | Skill ten: city driving – part one | pending-allowlist | 5.0 Dangers of driving (Situational awareness) | pending-allowlist |
| IV-015 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.15 Other intersections (Uncontrolled Intersection) | pending-allowlist |
| IV-016 | dossier | ali | n/a | ok | n/a | ok |
| IV-017 | dossier | deac | n/a | ok | n/a | ok |
| IV-018 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.19 Transporting (Secure your load / Animals) | pending-allowlist |
| IV-019 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 5.10 Law enforcement (Getting pulled over) | pending-allowlist |
| IV-020 | rule | ali | Skill ten: city driving – part two | pending-allowlist | 5.10 Law enforcement (Getting a ticket) | pending-allowlist |
| IV-021 | hazard | ali | Skill ten: city driving – part one | pending-allowlist | 5.9 Collisions (Witnessing a crash) | pending-allowlist |
| IV-022 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 5.9 Collisions (Reporting a crash / Calling 911) | pending-allowlist |
| IV-023 | wrench | ali | Skill ten: city driving – part one | pending-allowlist | 5.7 Vehicle failures (Headlight) | pending-allowlist |
| IV-024 | scene | ali | Skill ten: city driving – part two | pending-allowlist | 4.20 Maritime (Ferries) | pending-allowlist |
| IV-025 | ledger | ali | n/a | ok | n/a | ok |
| IV-026 | scene | ali | Skill ten: city driving – part one | pending-allowlist | 5.0 Dangers of driving (Hazard management) | pending-allowlist |
| IV-027 | scene | ali | Skill ten: city driving – part one | pending-allowlist | 5.0 Dangers of driving (Situational awareness) | pending-allowlist |
| IV-028 | dossier | ali | n/a | ok | n/a | ok |
| IV-029 | scene | ali | Skill ten: city driving – part two | pending-allowlist | n/a | ok |
| IV-030 | dossier | ali | n/a | ok | n/a | ok |

## Notes

- **IV-001** is twelve hand-written ride-along lines only (`cards/drafts/IV-001-ridealong-lines.md`). No full card JSON. Driver when built: `yuna`.
- **IV-019 / IV-020** cite parentheticals under existing `5.10 Law enforcement`. Do not collapse them to the bare heading — the slot asked for Getting pulled over / Getting a ticket.
- **IV-029** slot listed Skill ten p2 in both source columns. `dol_section` is `n/a` (a skill heading is not a DOL section). Teaching is Yuna's thesis: the pass she does not take.
- **IV-012** callbacks IV-005 (same school-edge block, fog, dusk).
- **IV-025** `callback_of` is IV-014 (same delivery box). Also armed by an IV-021 miss (drive-past). Same weather/location as 014.
- **5.0** headings are the intended unused ch.5 TOC parent, not a substitute for 5.2 / 5.5 already in the allowlist.
- Encore exteriors remain blocked. IV-002 / IV-009 are Encore **cockpit** briefs (`encore_cockpit`). IV-010 is a Yuna portrait with no chevron/horn-flare subject. No Encore four-view compile in this PR.
- `scripts/validate-act-iv.js` checks schema-shaped fields, camera ledger, geometry, seat, spoken dictionary, and closers. It skips pack/07–08 allowlist misses on purpose until the mid-patch lands.
