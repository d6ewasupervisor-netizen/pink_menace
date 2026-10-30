/**
 * Seed readiness (2026-10-29).
 *
 * `npm run seed` must put IV-001 live. Act VII has no still, so the seeder
 * writes those ten rows with a null image (the drive grades from that row).
 * The flag it reads is `variation.forced`, which is shared with art provenance:
 * live cards say things like "take 95 FAIL do not seed" about a rejected take.
 * The contract is the scaffold shape — no still AND do not seed — not the
 * substring. The card game hides that shape. This walks the same file filter
 * and decision `scripts/seed-cards.js` uses.
 *
 * Act VI is NOT a scaffold: its thirteen cards carry live stills and art notes,
 * so they remain seedable (the ROADMAP's card-coverage target counts them).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const { isDoNotSeed } = require_("../../scripts/seed-cards.js") as {
  isDoNotSeed: (raw: any) => boolean;
};

const root = new URL("../../", import.meta.url);
const url = (p: string) => fileURLToPath(new URL(p, root));
const read = (p: string) => JSON.parse(fs.readFileSync(url(p), "utf8"));

const FILES = fs
  .readdirSync(url("cards"))
  .filter((f) => /^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test(f))
  .sort();
const skipped = FILES.filter((f) => isDoNotSeed(read(`cards/${f}`)));
const seedable = FILES.filter((f) => !isDoNotSeed(read(`cards/${f}`)));

describe("the seeder's do-not-seed contract", () => {
  it("recognizes the scaffold sentence, not a rejected-take note", () => {
    expect(isDoNotSeed({ variation: { forced: "Act VII scaffold — no still; do not seed" } })).toBe(true);
    expect(isDoNotSeed({ variation: { forced: "live still cards/takes/IV-005-take-97.png (take 95 FAIL do not seed)" } })).toBe(false);
    expect(isDoNotSeed({ variation: { forced: "live still cards/takes/IV-028-take-87.png (do not seed takes 83/84/85/86/88)" } })).toBe(false);
    expect(isDoNotSeed({ variation: { forced: "live still cards/takes/V-001-take-5.png (take 8 FAIL — do not seed)" } })).toBe(false);
    expect(isDoNotSeed({ variation: {} })).toBe(false);
    expect(isDoNotSeed({})).toBe(false);
  });

  it("flags exactly the ten Act VII cards as no-still", () => {
    expect(skipped).toEqual([
      "VII-001.json",
      "VII-002.json",
      "VII-003.json",
      "VII-004.json",
      "VII-005.json",
      "VII-006.json",
      "VII-007.json",
      "VII-008.json",
      "VII-009.json",
      "VII-010.json",
    ]);
  });

  it("seeds IV-001", () => {
    expect(seedable).toContain("IV-001.json");
    expect(isDoNotSeed(read("cards/IV-001.json"))).toBe(false);
  });

  it("leaves Act VI seedable — it is live, not a scaffold", () => {
    const six = seedable.filter((f) => f.startsWith("VI-"));
    expect(six).toHaveLength(13);
    for (const f of six) expect(isDoNotSeed(read(`cards/${f}`)), f).toBe(false);
  });

  it("never skips a card that has a still on disk", () => {
    for (const f of FILES) {
      const png = f.replace(/\.json$/, ".png");
      if (!fs.existsSync(url(`cards/${png}`))) continue;
      expect(isDoNotSeed(read(`cards/${f}`)), `${f} has a still and must seed`).toBe(false);
    }
  });

  it("leaves nothing else out: seedable + skipped is the whole deck", () => {
    expect(seedable.length + skipped.length).toBe(FILES.length);
    expect(skipped.length).toBe(10);
  });
});
