/**
 * placeholders — the campaign's canon names.
 *
 * `{GRANDMA_INITIALS}` signs Grandma's note `— G.` and `{GRANDMA_NAME}` is her
 * spoken name (`Grandma`). A save written before the signature fix still carries
 * `G.J.` / `June` in its `placeholders` object, and because the save overrode the
 * defaults at boot the corrected text never reached an existing player. `June`
 * also collides with June, the Act II insulin neighbour.
 *
 * So the canon names are not saved state: they are code. A save may carry them
 * (older clients did); the values here always win on load.
 */
export const CANON_PLACEHOLDERS: Readonly<Record<string, string>> = Object.freeze({
  MOM: "Mom",
  RAY: "Ray",
  GRANDMA: "Grandma",
  GRANDMA_NAME: "Grandma",
  GRANDMA_INITIALS: "— G.",
  PLAYER: "Ali",
  PLAYER_FULL: "Alison",
});

/** Canon names over whatever a save (or a caller) supplied. */
export function withCanonPlaceholders(saved?: Record<string, string> | null): Record<string, string> {
  return { ...(saved ?? {}), ...CANON_PLACEHOLDERS };
}
