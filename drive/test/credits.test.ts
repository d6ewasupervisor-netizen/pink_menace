/**
 * The attribution the licences require, where the player can read it.
 *
 * Two models in the drive are CC-BY-4.0 — the VW Beetle and the low-poly
 * cactus — and CC-BY is an attribution licence: the title, the author, the
 * source and the licence have to reach whoever receives the work. `CREDITS.md`
 * beside the GLBs reaches nobody. `quietroads/credits.ts` is what the screen
 * renders, and this file pins it to that markdown table so a row cannot be
 * added there and forgotten here, or the reverse.
 *
 * The component half is read as source, the way `model-textures.test.ts` reads
 * `server.js`: the screen imports stores and the bridge, which pull in three and
 * rapier, so it cannot be rendered in node. What matters is that it draws every
 * field the licence asks for — so that is what is asserted.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CC_BY_ATTRIBUTIONS, KENNEY_CREDIT } from "../src/quietroads/credits";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIVE = path.resolve(HERE, "..");
const CREDITS_MD = path.join(DRIVE, "public", "models", "CREDITS.md");
const SCREEN = path.join(DRIVE, "src", "components", "Game3D", "CreditsScreen.tsx");

interface Row {
  file: string;
  title: string;
  author: string;
  licence: string;
  source: string;
}

/** The `| File | Title | Author | Licence | Source |` table in CREDITS.md. */
function notKenneyTable(): Row[] {
  const lines = fs.readFileSync(CREDITS_MD, "utf8").split(/\r?\n/);
  const header = lines.findIndex((l) => /^\|\s*File\s*\|\s*Title\s*\|\s*Author\s*\|\s*Licence\s*\|\s*Source\s*\|/.test(l));
  expect(header, "CREDITS.md has the File/Title/Author/Licence/Source table").toBeGreaterThan(-1);
  const rows: Row[] = [];
  for (let i = header + 2; i < lines.length && lines[i].trim().startsWith("|"); i++) {
    const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
    expect(cells.length, `row ${i} has five cells`).toBe(5);
    const [file, title, author, licence, source] = cells;
    rows.push({
      file: file.replace(/`/g, ""),
      title,
      author,
      licence,
      source: source.replace(/^<|>$/g, ""),
    });
  }
  return rows;
}

describe("every CC-BY model in CREDITS.md is credited in the game", () => {
  const rows = notKenneyTable();

  it("the table is the two models we know about, and both are CC-BY", () => {
    expect(rows.map((r) => r.file).sort()).toEqual(["cars/vw_beetle.glb", "nature/low_poly_cactus.glb"]);
    for (const r of rows) expect(r.licence, `${r.file} is an attribution licence`).toMatch(/^CC-BY/);
  });

  it("the screen's data is the table, field for field", () => {
    expect(CC_BY_ATTRIBUTIONS.length, "no CC-BY entry is missing from the screen").toBe(rows.length);
    for (const row of rows) {
      const entry = CC_BY_ATTRIBUTIONS.find((a) => a.file === row.file);
      expect(entry, `${row.file} is on the credits screen`).toBeTruthy();
      expect(entry!.title, `${row.file} title`).toBe(row.title);
      expect(entry!.author, `${row.file} author`).toBe(row.author);
      expect(entry!.license, `${row.file} licence`).toBe(row.licence);
      expect(entry!.source, `${row.file} source`).toBe(row.source);
      expect(entry!.licenseUrl, `${row.file} licence URL`).toMatch(/^https:\/\/creativecommons\.org\/licenses\//);
      expect(entry!.source, `${row.file} source is a link`).toMatch(/^https:\/\//);
    }
  });

  it("credits Kenney too, though CC0 asks for nothing", () => {
    expect(KENNEY_CREDIT.name).toBe("Kenney");
    expect(KENNEY_CREDIT.license).toBe("CC0");
    expect(KENNEY_CREDIT.url).toBe("https://kenney.nl");
    expect(KENNEY_CREDIT.line).toContain("Kenney");
    expect(KENNEY_CREDIT.line).toContain("CC0");
    expect(KENNEY_CREDIT.line).toContain("kenney.nl");
  });

  it("the screen renders every field, for every entry, plus the Kenney line", () => {
    const src = fs.readFileSync(SCREEN, "utf8");
    // It maps the data rather than listing anything by hand.
    expect(src).toMatch(/CC_BY_ATTRIBUTIONS\.map\(/);
    expect(src).toMatch(/KENNEY_CREDIT\.line/);
    // Every field the licence asks for reaches the DOM.
    for (const hook of ["data-credit-title", "data-credit-author", "data-credit-source", "data-credit-license", "data-credit-kenney"]) {
      expect(src, `the screen draws ${hook}`).toContain(hook);
    }
    expect(src, "the source is a real link").toMatch(/href=\{a\.source\}/);
    expect(src, "the licence is a real link").toMatch(/href=\{a\.licenseUrl\}/);
    expect(src, "the title is printed").toMatch(/\{a\.title\}/);
    expect(src, "the author is printed").toMatch(/\{a\.author\}/);
    expect(src, "the licence name is printed").toMatch(/\{a\.license\}/);
  });
});
