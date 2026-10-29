/**
 * IV-001 is a live card (2026-10-29).
 *
 * It used to be `cards/IV-001-brake.json` — card_type "ride-along-still", no
 * `source`, no `decision`, no options, and an id with a suffix the seed's file
 * filter (`^(I|…|VII)-\d{3}\.json$`) never matched, so it was never seeded. The
 * live name and shape are the point here: the seed picks it up, the guide
 * citation is real, its stills are on disk, and IV-002's "Yuna's car had two
 * pedals" finally has a scene to point at.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const { seqFromCard } = require_("../../scripts/card-seq.js") as { seqFromCard: (c: any) => number };
const dol = require_("../../pack/07_DOL_SECTIONS.json") as { sections: string[] };
const psdp = require_("../../pack/08_PSDP_SKILLS.json") as { skills: string[] };
const schema = require_("../../pack/04_card.schema.json") as any;

const root = new URL("../../", import.meta.url);
const url = (p: string) => fileURLToPath(new URL(p, root));
const read = (p: string) => JSON.parse(fs.readFileSync(url(p), "utf8"));
const exists = (p: string) => fs.existsSync(url(p));

describe("IV-001 is a live, seedable card", () => {
  const card = read("cards/IV-001.json");

  it("seeds: standard file name, standard id, act-derived seq", () => {
    expect(exists("cards/IV-001.json")).toBe(true);
    expect(/^(I|II|III|IV|V|VI|VII)-\d{3}\.json$/.test("IV-001.json")).toBe(true);
    expect(card.card_id).toBe("IV-001");
    // `seq` is derived (card-seq.js), never stored: the schema forbids extras.
    expect(card.seq).toBeUndefined();
    expect(seqFromCard(card)).toBe(4001);
    expect(exists("cards/IV-001-brake.json")).toBe(false);
  });

  it("has the schema's required fields, enums and lengths", () => {
    for (const key of schema.required) expect(card).toHaveProperty(key);
    for (const key of Object.keys(card)) expect(Object.keys(schema.properties)).toContain(key);
    expect(schema.properties.card_id.pattern).toBeDefined();
    expect(/^(I|II|III|IV|V|VI|VII)-[0-9]{3}$/.test(card.card_id)).toBe(true);
    for (const key of ["act", "zone", "driver", "card_type"]) {
      expect(schema.properties[key].enum).toContain(card[key]);
    }
    expect(card.title.length).toBeLessThanOrEqual(40);
    expect(card.hook.length).toBeLessThanOrEqual(90);
    expect(card.scene.length).toBeGreaterThanOrEqual(150);
    expect(card.scene.length).toBeLessThanOrEqual(700);
    expect(card.debrief.length).toBeLessThanOrEqual(400);
    for (const key of schema.properties.variation.required) {
      expect(card.variation).toHaveProperty(key);
    }
    for (const [key, value] of Object.entries(card.variation)) {
      const prop = schema.properties.variation.properties[key];
      expect(prop, `variation.${key}`).toBeDefined();
      if (prop.enum) expect(prop.enum).toContain(value);
    }
  });

  it("asks one question with one right answer and legal deltas", () => {
    expect(card.decision.length).toBeLessThanOrEqual(200);
    expect(card.options.length).toBeGreaterThanOrEqual(2);
    expect(card.options.length).toBeLessThanOrEqual(4);
    expect(card.options.filter((o: any) => o.correct).length).toBe(1);
    for (const o of card.options) {
      expect(o.id).toMatch(/^[a-d]$/);
      expect(o.text.length).toBeLessThanOrEqual(160);
      expect(o.result.length).toBeGreaterThanOrEqual(80);
      expect(o.result.length).toBeLessThanOrEqual(400);
      for (const [key, value] of Object.entries(o.state_delta)) {
        const prop = schema.properties.options.items.properties.state_delta.properties[key];
        expect(prop, `option ${o.id} delta ${key}`).toBeDefined();
        if (typeof value === "number") {
          expect(value).toBeGreaterThanOrEqual(prop.minimum);
          expect(value).toBeLessThanOrEqual(prop.maximum);
        }
      }
    }
  });

  it("cites the driver guide and a real PSDP skill", () => {
    expect(psdp.skills).toContain(card.source.psdp_skill);
    expect(dol.sections).toContain(card.source.dol_section);
    expect(card.source.dol_section).toBe("4.11 Traffic light signals");
    expect(card.source.teaching_target.length).toBeLessThanOrEqual(200);
    // The rule the card teaches, in the guide's words: 4.11 Solid Yellow.
    expect(card.source.teaching_target).toContain("slow down and prepare to stop");
  });

  it("has its stills: the master and the ride plate the client requests", () => {
    expect(exists("cards/IV-001.png")).toBe(true);
    expect(exists("public/game/ride/IV-001/brake.webp")).toBe(true);
    // The master ships as a .png name but the bytes are a JPEG (encode-still.py
    // opens by content, not extension) — accept either real image, not a stub.
    const bytes = fs.readFileSync(url("cards/IV-001.png"));
    const magic = bytes.subarray(0, 4).toString("latin1");
    expect(magic === "\x89PNG" || magic.startsWith("\xFF\xD8")).toBe(true);
    expect(bytes.length).toBeGreaterThan(10_000);
  });

  it("gives IV-002's 'two pedals' line its setup", () => {
    const iv2 = read("cards/IV-002.json");
    expect(iv2.scene).toContain("Yuna's car had two pedals");
    expect(card.scene).toContain("Yuna drives");
    expect(card.scene).toContain("two pedals");
    expect(card.scene).toContain("Ali sits the welded rear bench");
  });
});
