"use strict";

// The clipboard is fiction, not an account record (Phase 4, 2026-10-29).
//
// Two promises this file holds:
//   1. `manifestFor` never puts the signed-in student's name on Deac's
//      clipboard. The signature line stays blank until the start button signs
//      it in-fiction (public/game/feel.js renders `row.driver || "________"`).
//   2. Every act's manifest row names a real load. Act VI used to ship
//      "TODO — Claude: Backcountry load" to production; the load that the Act VI
//      end beat now names is the diesel for the ridge plows, so cargo and the
//      delivery copy cannot drift apart again.

const assert = require("assert");
const { manifestFor, deliveryBeat, MANIFESTS } = require("../src/manifest");

// 1. No account name on the clipboard.
assert.strictEqual(manifestFor("II").driver, "________", "the signature line must be blank");
assert.strictEqual(
  manifestFor("II", "Jordan Smith").driver,
  "________",
  "a stray second argument must not sign the clipboard"
);

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
