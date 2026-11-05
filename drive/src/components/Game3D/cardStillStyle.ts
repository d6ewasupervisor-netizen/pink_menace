import type { CSSProperties } from 'react';

/**
 * A card still is READ, not cropped.
 *
 * Cards are composed 2:3 (`cards/<id>.png` is 1024x1536 and ships as a 768x1152
 * WebP — `scripts/encode-still.py`). A phone is nothing like 2:3: 390x844 is
 * 0.462, 844x390 is 2.164, 1280x800 is 1.6. Full-bleed `cover` therefore throws
 * most of the plate away — measured on II-019 "Green Light, Black Ice"
 * (`drive/test/cardStill.test.ts`):
 *
 *   390x844   cover → 562.7x844 painted, 30.7% of the width cropped
 *   844x390   cover → 844x1266 painted, 69.2% of the height cropped
 *   1280x800  cover → 1280x1920 painted, 58.3% of the height cropped
 *
 * That is how the card came to render as a traffic-light housing with no green
 * lens, no crosswalk and no porch in frame. `contain` keeps the whole
 * composition: the plate letterboxes inside whatever box the viewport gives it,
 * and the leftover space stays transparent so the 3D world behind the
 * windshield read still shows through.
 *
 * History: `contain` was the behaviour in 1ec6ca8; 2c1b107 ("Redesign drive as
 * a single immersive cockpit surface") made it full-bleed `cover` when the card
 * moved into the cockpit as a backdrop. Do not put a scale/zoom on this either:
 * the pan lives in the sim's camera, not on the still.
 */
export const CARD_STILL_FIT = 'contain' as const;

export const cardStillStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: CARD_STILL_FIT,
  objectPosition: 'center',
  // No CSS filter: it promotes the img to its own compositing layer, and the
  // browser's screenshot path then captures the band without the plate in it
  // (measured: page.screenshot shows the still, toHaveScreenshot does not).
  // It also used to carry brightness(0.6) when the still sat under the card text.
  filter: 'none',
  transition: 'opacity 300ms',
  pointerEvents: 'none',
};
