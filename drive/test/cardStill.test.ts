/**
 * A card still is READ whole.
 *
 * Cards are composed 2:3 (1024x1536 master, 768x1152 delivered), and no viewport
 * is 2:3. The drive's cockpit card overlay used to paint the still full-bleed
 * with `object-fit: cover`, which scales the plate up until it covers the box
 * and then crops the overflow. On II-019 "Green Light, Black Ice" that left a
 * traffic-light housing filling the frame — no green lens, no crosswalk, no
 * porch. This file pins the rule two ways: the style the overlay actually
 * renders with, and the geometry numbers that `cover` was producing.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CARD_STILL_FIT, cardStillStyle } from '../src/components/Game3D/cardStillStyle';

const root = new URL('../../', import.meta.url);
const url = (p: string) => fileURLToPath(new URL(p, root));

/** The delivered still: scripts/encode-still.py writes 768x1152 WebP. */
const PLATE = { w: 768, h: 1152 };

/** What a box of this size actually shows of a plate under `fit`. */
function plateInBox(boxW: number, boxH: number, fit: string, plate = PLATE) {
  const sx = boxW / plate.w;
  const sy = boxH / plate.h;
  const scale = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  const paintedW = plate.w * scale;
  const paintedH = plate.h * scale;
  const shownW = Math.min(boxW, paintedW);
  const shownH = Math.min(boxH, paintedH);
  return {
    paintedW: +paintedW.toFixed(1),
    paintedH: +paintedH.toFixed(1),
    visible: +((shownW * shownH) / (paintedW * paintedH)).toFixed(3),
    croppedXPct: +(((paintedW - shownW) / paintedW) * 100).toFixed(1),
    croppedYPct: +(((paintedH - shownH) / paintedH) * 100).toFixed(1),
  };
}

const VIEWPORTS: Array<[string, number, number]> = [
  ['phone portrait', 390, 844],
  ['phone landscape', 844, 390],
  ['desktop', 1280, 800],
];

describe('the card still is letterboxed, never cropped', () => {
  it('fits with contain, not cover', () => {
    expect(CARD_STILL_FIT).toBe('contain');
    expect(cardStillStyle.objectFit).toBe('contain');
    expect(cardStillStyle.objectPosition).toBe('center');
  });

  it('keeps the whole plate at every viewport', () => {
    for (const [name, w, h] of VIEWPORTS) {
      const box = plateInBox(w, h, CARD_STILL_FIT);
      expect(box.visible, name).toBe(1);
      expect(box.croppedXPct, name).toBe(0);
      expect(box.croppedYPct, name).toBe(0);
    }
  });

  it('is the regression that was there: cover shows a fraction of II-019', () => {
    // The before numbers, measured in headless Chromium on II-019's still.
    expect(plateInBox(390, 844, 'cover')).toMatchObject({
      paintedW: 562.7,
      visible: 0.693,
      croppedXPct: 30.7,
    });
    expect(plateInBox(844, 390, 'cover')).toMatchObject({
      paintedH: 1266,
      visible: 0.308,
      croppedYPct: 69.2,
    });
    expect(plateInBox(1280, 800, 'cover')).toMatchObject({
      paintedH: 1920,
      visible: 0.417,
      croppedYPct: 58.3,
    });
  });

  it('the overlay paints the still with that style and nothing else scales it', () => {
    const src = fs.readFileSync(url('drive/src/components/Game3D/CardOverlay.tsx'), 'utf8');
    expect(src).toContain('cardStillStyle');
    expect(src).not.toMatch(/objectFit:\s*['"]cover['"]/);
    expect(src).not.toMatch(/backdrop:/);
    // No zoom/scale on the still itself — the pan belongs to the sim camera.
    expect(cardStillStyle.transform).toBeUndefined();
    expect(cardStillStyle.zoom).toBeUndefined();
  });

  it('II-019 is the card that was unreadable', () => {
    const deck = JSON.parse(fs.readFileSync(url('drive/src/quietroads/data/cards.json'), 'utf8')) as Array<{
      card_id: string;
      title: string;
      image: string | null;
    }>;
    const card = deck.find((c) => c.card_id === 'II-019');
    expect(card?.title).toBe('Green Light, Black Ice');
    expect(card?.image).toBe('/api/drive/image/II-019');
  });
});
