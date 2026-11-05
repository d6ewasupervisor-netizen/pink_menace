/**
 * The one reason a spec may be skipped in a project — and it is measured.
 *
 * `playwright.config.ts` runs two projects: `desktop` (1280x720) and
 * `mobile-portrait` (Pixel 5, 390x844). Several specs set their own viewport
 * inside the file (`test.use({ viewport: … })` or `page.setViewportSize`), so
 * running them in both projects repeats the identical CSS geometry. That is a
 * legitimate dedupe — but "the viewport is set inside the test" is a claim, not
 * a measurement, and a claim cannot notice the day it stops being true.
 *
 * This compares the two numbers. It skips ONLY when the project's viewport is
 * exactly the one the spec drives; the moment the config's project viewport or
 * the spec's own viewport changes, the test runs instead of quietly vanishing
 * from the report. The skip title carries both sizes, so the list reporter says
 * why without anyone opening the file.
 */
export interface Viewport {
  width: number;
  height: number;
}

/**
 * Why this project's run of a spec that drives `testViewport` is a duplicate,
 * or null when it is not. Callers do `test.skip(reason !== null, reason ?? '')`.
 */
export function duplicateViewportReason(
  projectViewport: Viewport | null | undefined,
  testViewport: Viewport,
): string | null {
  if (!projectViewport) return null;
  if (projectViewport.width !== testViewport.width || projectViewport.height !== testViewport.height) return null;
  return `the project is already ${testViewport.width}x${testViewport.height}, which this spec sets itself`;
}
