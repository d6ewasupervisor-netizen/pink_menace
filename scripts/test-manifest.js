"use strict";

// The clipboard is fiction, not an account record (Phase 4, 2026-10-29; signed
// 2026-10-29).
//
// Two promises this file holds:
//   1. `manifestFor` never puts the signed-in student's name on the run's
//      manifest. It is signed by the courier who drives the run — "A. Okonjo"
//      (`pack/01_BIBLE.md:35`) — and a stray second argument is ignored. The
//      blank it used to ship was *not* filled by Deac's initials at VI-013:
//      those initial his own clearance sheet (`cards/VI-013.json`), a different
//      document, and nothing in the Act VI end beat writes a signature.
//   2. Every act's manifest row names a real load. Act VI used to ship
//      "TODO — Claude: Backcountry load" to production; the load that the Act VI
//      end beat now names is the diesel for the ridge plows, so cargo and the
//      delivery copy cannot drift apart again.

const assert = require("assert");
const { manifestFor, deliveryBeat, MANIFESTS } = require("../src/manifest");

// 1. No account name on the clipboard; the courier's signature is canon.
assert.strictEqual(manifestFor("II").driver, "A. Okonjo", "the manifest is signed by the courier");
assert.strictEqual(
  manifestFor("II", "Jordan Smith").driver,
  "A. Okonjo",
  "a stray second argument must not sign the clipboard"
);
for (const act of ["II", "III", "IV", "V", "VI"]) {
  const row = manifestFor(act);
  assert.ok(
    !/jordan|student|account/i.test(row.driver),
    `Act ${act} must not carry an account name: ${row.driver}`
  );
}

// 2. No placeholder loads anywhere.
for (const act of ["II", "III", "IV", "V", "VI"]) {
  const row = manifestFor(act);
  assert.ok(row.run && row.cargo && row.for, `Act ${act} manifest is incomplete`);
  assert.ok(!/TODO|Claude|TBD/i.test(row.run + row.cargo + row.for), `Act ${act} manifest still has a placeholder`);
}

// 3. Act VI: the cargo and the end beat name the same load.
assert.ok(/diesel/i.test(manifestFor("VI").cargo), "Act VI cargo must name the diesel");
assert.ok(/ridge plows/i.test(manifestFor("VI").cargo), "Act VI cargo must name who it is for");
const viClose = deliveryBeat({ time_cost: 0 }, "VI");
assert.ok(/diesel/i.test(viClose), "the Act VI end beat must name the diesel the manifest carries");
assert.ok(/ridge plows/i.test(viClose), "the Act VI end beat must name the plows");

// 4. The relay-run manifests are untouched by Act VI's edit.
assert.ok(/relay kit/i.test(manifestFor("V").cargo) && /tower 4/i.test(manifestFor("V").for));
assert.ok(/insulin/i.test(manifestFor("II").cargo), "Act II is still the cold pack");

// 5. Unknown acts fall back to Act II rather than inventing a row.
assert.strictEqual(manifestFor("ZZ").act, "II");
assert.deepStrictEqual(Object.keys(MANIFESTS).sort(), ["II", "III", "IV", "V", "VI"]);

console.log("ok");
