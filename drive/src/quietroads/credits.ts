/**
 * The in-game credits — the attribution the licences actually require.
 *
 * Everything in `drive/public/models` is Kenney CC0 except two models, and both
 * of those are **CC-BY-4.0**: the VW Beetle and the low-poly cactus. CC-BY asks
 * for the title, the author, the source and the licence to be given to whoever
 * receives the work — a `CREDITS.md` next to the assets is not the player. This
 * file is the single source of truth for the screen
 * (`components/Game3D/CreditsScreen.tsx`), and `drive/test/credits.test.ts`
 * parses `public/models/CREDITS.md` and fails if a row here and a row there
 * disagree, so the two cannot drift.
 *
 * Kenney is CC0, which requires nothing. Crediting them anyway is the one line
 * the packs ask for as a courtesy ("Support by crediting 'Kenney' or
 * 'www.kenney.nl' (this is not a requirement)" — their License.txt).
 */

export interface Attribution {
  /** The work's title, as its author gave it (`extras.title` in the GLB). */
  title: string;
  /** The author, as the GLB's `extras.author` gives it. */
  author: string;
  /** Where the work came from — a link the player can follow. */
  source: string;
  /** The licence's short name. */
  license: string;
  /** The licence's own page. */
  licenseUrl: string;
  /** The file it is, for anyone tracing a model back. */
  file: string;
}

/** The CC-BY-4.0 licence both non-Kenney models are under. */
export const CC_BY_URL = "https://creativecommons.org/licenses/by/4.0/";

/**
 * Every model in the game that is not CC0, with the four things CC-BY asks for.
 * Order is the order they appear on screen.
 */
export const CC_BY_ATTRIBUTIONS: Attribution[] = [
  {
    title: "VW Beetle",
    author: "LucasPresoto",
    source: "https://sketchfab.com/3d-models/vw-beetle-3d29ae085bc34e848fde037f42ef6d7b",
    license: "CC-BY-4.0",
    licenseUrl: CC_BY_URL,
    file: "cars/vw_beetle.glb",
  },
  {
    title: "Low Poly Cactus",
    author: "akaN0ob",
    source: "https://sketchfab.com/3d-models/low-poly-cactus-33ce2bbbebf7413f8314602176b095eb",
    license: "CC-BY-4.0",
    licenseUrl: CC_BY_URL,
    file: "nature/low_poly_cactus.glb",
  },
];

/** The courtesy line. CC0 requires nothing; the packs ask for it anyway. */
export const KENNEY_CREDIT = {
  name: "Kenney",
  url: "https://kenney.nl",
  license: "CC0",
  line: "Cars, roads and buildings — Kenney (kenney.nl), CC0. Not required. Given anyway.",
} as const;
