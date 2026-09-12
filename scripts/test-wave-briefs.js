"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { assemblePrompt } = require("./compile-prompt");
const { loadCardJson, CARD_ID_RE } = require("./card-json");
const { lintWaveBriefMarkdown, isWaveBriefPath } = require("./validate-wave-briefs");
const { renderWaveBrief, RULE } = require("./write-wave-brief");

assert.ok(CARD_ID_RE.test("V-013"));
assert.ok(CARD_ID_RE.test("IV-001-brake"));
assert.ok(!CARD_ID_RE.test("WAVE_PARALLEL.md"));

const card = loadCardJson("I-001");
assert.ok(card.image_brief);
const prompt = assemblePrompt(card);
assert.ok(prompt.length > 40);

assert.throws(
  () => assemblePrompt(card, { subject: "stale parallel brief" }),
  /sole brief authority/
);
assert.throws(
  () => assemblePrompt(card, "stale wave markdown"),
  /sole brief authority/
);

const idOnly = `# Wave brief

${RULE}

- V-013
- V-011
- V-006
`;
assert.deepStrictEqual(lintWaveBriefMarkdown(idOnly, { strictIdsOnly: true }), []);

const dumped = `# Wave brief

- V-013

### V-013

- subject: truck filling the interior glass
- foreground: pink dash
- The read: Hollis is too close
`;
const dumpErrs = lintWaveBriefMarkdown(dumped);
assert.ok(dumpErrs.some((e) => /subject\/foreground/.test(e)));
assert.ok(dumpErrs.some((e) => /read\/frame/.test(e)));

const parallel = `# NEXT STILLS

## Brief lines followed (sole authority)

Subject from the brief: both cats on the passenger seat
`;
const parErrs = lintWaveBriefMarkdown(parallel);
assert.ok(parErrs.some((e) => /brief lines followed/.test(e)));
assert.ok(parErrs.some((e) => /from the brief/.test(e)));

assert.strictEqual(isWaveBriefPath("WAVE_BRIEF.md"), true);
assert.strictEqual(isWaveBriefPath("cards/takes/WAVE_IV-018-009-010-029.md"), true);
assert.strictEqual(isWaveBriefPath("cards/takes/WAVE_PARALLEL.md"), true);
assert.strictEqual(isWaveBriefPath("pack/39_WAVE_BRIEFS.md"), false);
assert.strictEqual(isWaveBriefPath("cards/drafts/WAVE_ONE_MAP.md"), false);
assert.strictEqual(isWaveBriefPath("pack/32_ACT_I_FRAME_STILLS.md"), false);

assert.throws(() => renderWaveBrief([]), /usage/);
assert.throws(() => renderWaveBrief(["not-a-card"]), /not a card id/);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pm-wave-"));
const cardsDir = path.join(tmp, "cards");
fs.mkdirSync(cardsDir);
fs.writeFileSync(
  path.join(cardsDir, "I-002.json"),
  JSON.stringify({ card_id: "I-002", image_brief: { camera: "POV_COCKPIT", read: "x" } })
);
const rendered = renderWaveBrief(["I-002"], tmp);
assert.ok(rendered.includes("- I-002"));
assert.ok(rendered.includes("Card JSON is the sole brief authority"));
assert.deepStrictEqual(lintWaveBriefMarkdown(rendered, { strictIdsOnly: true }), []);

console.log("ok");
