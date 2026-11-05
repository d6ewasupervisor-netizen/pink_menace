# Models — where each one came from

Every model under this folder is a **Kenney** kit asset, released
**CC0 / public domain** ([creativecommons.org/publicdomain/zero/1.0](http://creativecommons.org/publicdomain/zero/1.0/)).
Attribution is not required; this file exists so the atlas beside each model can
be traced back to the pack it was authored against.

The GLBs are byte-identical to the packs' `Models/GLB format/*.glb`. Each GLB
references `Textures/colormap.png` **relative to itself**, so each folder carries
the colormap its own pack shipped with. Two packs share a folder prefix only when
they share a kit.

| Folder | Pack | Version | Download |
|---|---|---|---|
| `cars/` | Car Kit | 3.0 (2026-01-23) | https://kenney.nl/assets/car-kit |
| `road/` | City Kit (Roads) | 2.0 (2025-03-13) | https://kenney.nl/assets/city-kit-roads |
| `buildings/` | City Kit (Suburban) | 2.0 (2025-04-23) | https://kenney.nl/assets/city-kit-suburban |
| `buildings-modular/` | Modular Buildings | 2.1 (2024-02-08) | https://kenney.nl/assets/modular-buildings |

Versions and dates are the ones printed on each pack's own `License.txt`.

## `buildings/` and `buildings-modular/` are one folder each on purpose

The eight building GLBs look like one set and are not. `building-type-a` …
`building-type-e` are **City Kit (Suburban) 2.0**; `building-sample-house-a`,
`building-sample-tower-a` and `building-sample-tower-b` are **Modular Buildings
2.1**. The two packs ship different 512×512 colormaps — measured on a 4-px grid,
three pixels in four differ — so one shared atlas cannot serve both. They were
briefly in one folder, which is why the split exists.

## The atlas is the pack's, not a generated stand-in

`drive/scripts/build-model-colormaps.mjs` (`npm run build:colormaps`) paints a
deterministic atlas from each GLB's own UV bounds. It is the **fallback** for a
missing file and refuses to overwrite an atlas that is already present
(`--force` overrides). `drive/test/model-textures.test.ts` pins each of these
four files by SHA-256, so a regenerated stand-in cannot quietly replace a kit's
own colormap again.

| Atlas | SHA-256 |
|---|---|
| `cars/Textures/colormap.png` (11988 B) | `2AB4AAD26098BBF8258BE9A884527F9F61438F35F40ED9DBF1A195BAD9F793FE` |
| `road/Textures/colormap.png` (8658 B) | `EBBDAADF298F684EE534D0E63E2BDB223F7501DA9FC13EB7BCDC94489162ACA5` |
| `buildings/Textures/colormap.png` (11784 B) | `9B5DE86078C25EF02351A80D35FF3C978693A1044565B73EEDD9AE9B5B80665D` |
| `buildings-modular/Textures/colormap.png` (7529 B) | `66FD49BE148F32E88F6C8CACE67120250D1943A7856601158AD0FF24651DB0B0` |

## Not Kenney

Two models are **not** Kenney and are **not** CC0. Both are CC-BY-4.0, which
requires attribution: the title, the author, the source and the licence have to
be shown to the player, not just kept in this file. They are shown on the
in-game credits screen (`drive/src/quietroads/credits.ts` +
`components/Game3D/CreditsScreen.tsx`), and `drive/test/credits.test.ts` parses
this table and fails if any row is missing from that screen.

| File | Title | Author | Licence | Source |
|---|---|---|---|---|
| `cars/vw_beetle.glb` | VW Beetle | LucasPresoto | CC-BY-4.0 | https://sketchfab.com/3d-models/vw-beetle-3d29ae085bc34e848fde037f42ef6d7b |
| `nature/low_poly_cactus.glb` | Low Poly Cactus | akaN0ob | CC-BY-4.0 | https://sketchfab.com/3d-models/low-poly-cactus-33ce2bbbebf7413f8314602176b095eb |

Titles are the `extras.title` each GLB carries; both GLBs also carry
`extras.license` = `CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)`.
The licence the credits screen shows is
[creativecommons.org/licenses/by/4.0](https://creativecommons.org/licenses/by/4.0/).

