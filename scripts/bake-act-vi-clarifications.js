"use strict";
const fs = require("fs");

const CARRIER =
  "hard-sided; wire grille door facing inboard; Gracie's orange tabby markings visible behind the grille; belt routed through the handle";

const BIOME =
  "Cascades-west PNW wet backcountry — restricted sightlines, second-growth fir crowding the shoulder, blackberry and alder in the ditch, vegetation close to the road, wet gray asphalt; NOT sage, dry grass, bare hills, or long open highway";

const SHARED_NEGS = [
  "no paraphrase of carrier string",
  'no "ginger tabby" wording — use orange tabby markings behind the grille',
  "no soft-sided carrier",
  "no red LED on carrier",
  "no leather carrier",
  "no carrier door facing outboard toward camera",
  "no empty carrier with no cat visible behind grille",
  "no belt not routed through handle",
  "no Mya",
  "no second cat",
  "no low dash-level mesh band only",
  "no missing full-grid windshield cage",
  "no high desert",
  "no sagebrush",
  "no bare hills",
  "no long dry open highway",
  "no lit green turn arrows",
  "no brightly lit dash by default",
  "no speedlike 112 LCD readout (odo/trip numerals OK if not live speed)",
];

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = String(x).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

fs.writeFileSync(
  "cards/takes/ACT_VI_STANDING_LOCKS.md",
  `# Act VI standing locks (Claude ACK)

## Carrier SPEC (verbatim — every gen prompt, no paraphrase)
\`${CARRIER}\`

Reject: "ginger tabby" / extra seat wording / soft/LED/leather variants.

## Geography
Cascades-west PNW wet backcountry — restricted sightlines, vegetation close to the road. "Rural" must NOT become sage/dry grass/open highway.

## Cage
FULL-GRID windshield/side mesh (VI-009 take-2 is cage REF only until cabin shows locked carrier).

## Dash / 112
Dark dash default. Lit green turn arrows out. **112.0 out only if speedlike LCD**; odo/trip may remain — do not blanket-strip every 112.

## REF-only (out of ship queue)
| Take | Role |
|---|---|
| VI-009 take-2 | full-grid cage REF — not shippable until cabin shows locked carrier |
| VI-012 take-3 | carrier-restraint routing REF — not shippable; do not retouch corn-belt into canon |

## Delivery
Ship queue = 0 until new takes. Muted-read leads with **VI-011**. Pack 1 separate after brief hygiene. No seed.
`
);

for (let i = 1; i <= 13; i++) {
  const id = "VI-" + String(i).padStart(3, "0");
  const fp = `cards/${id}.json`;
  const card = JSON.parse(fs.readFileSync(fp, "utf8"));
  const b = card.image_brief;
  b.standing_carrier_spec = CARRIER;
  b.standing_biome = BIOME;

  for (const k of ["subject", "foreground", "midground", "background", "read"]) {
    if (typeof b[k] === "string") {
      b[k] = b[k].replace(/ginger tabby/gi, "orange tabby");
    }
  }

  const blob = JSON.stringify(b);
  if (!blob.includes(CARRIER)) {
    const cam = b.camera || "";
    if (cam.includes("ROADSIDE") || cam.includes("PROFILE")) {
      b.midground = (b.midground || "") + "; through rear side cage: " + CARRIER;
    } else {
      b.foreground = (b.foreground || "") + "; cabin carrier: " + CARRIER;
    }
  }

  b.extra_negatives = (b.extra_negatives || []).map((n) => {
    if (/112/.test(n) && !/speedlike|live speed|LCD/i.test(n)) {
      return "no speedlike 112 LCD readout (odo/trip numerals OK if not live speed)";
    }
    return n;
  });
  b.extra_negatives = uniq([...(b.extra_negatives || []), ...SHARED_NEGS]);

  card.cast = (card.cast || []).filter((x) => x !== "mya");
  if (!card.cast.includes("gracie")) card.cast.push("gracie");
  fs.writeFileSync(fp, JSON.stringify(card, null, 2) + "\n");
}

// VI-009 shippable brief
{
  const card = JSON.parse(fs.readFileSync("cards/VI-009.json", "utf8"));
  const b = card.image_brief;
  b.camera = "POV_COCKPIT";
  b.subject = `doe BROADSIDE centered full-scale in travel lane INSIDE full-grid windshield mesh at last light; cabin shows locked carrier: ${CARRIER}`;
  b.foreground = `worn black wheel; faded pink dash DARK/UNLIT — no lit turn arrows; gauges may show odo/trip but no speedlike 112 LCD; FULL-GRID windshield mesh (cage canon); hands not yanking; ${CARRIER}`;
  b.midground =
    "doe broadside centered in THIS lane through the mesh — full body, not roadside grazing, not distant";
  b.background = BIOME + " at dusk; treeline close to road";
  b.read =
    "deer broadside in lane through full-grid mesh; dark dash; locked carrier with Gracie";
  b.ref_notes =
    "VI-009-take-2.png = full-grid cage REF ONLY — not shippable until cabin shows locked carrier";
  b.extra_negatives = uniq([
    ...(b.extra_negatives || []),
    ...SHARED_NEGS,
    "no distant tiny deer",
    "no deer grazing roadside",
    "no lit GPS tablet",
  ]);
  fs.writeFileSync("cards/VI-009.json", JSON.stringify(card, null, 2) + "\n");
}

// VI-012 shippable brief
{
  const card = JSON.parse(fs.readFileSync("cards/VI-012.json", "utf8"));
  const b = card.image_brief;
  b.camera = "POV_COCKPIT";
  b.subject = `white railroad crossbuck and two rails through gravel; no gates/bells/lights; FULL-GRID windshield mesh; locked carrier: ${CARRIER}`;
  b.foreground = `worn black wheel; faded pink dash DARK/UNLIT — no lit green arrow; odo/trip OK; no speedlike 112 LCD; FULL-GRID mesh; ${CARRIER}`;
  b.midground =
    "crossbuck and rails across gravel; sightline up track blocked by close vegetation";
  b.background = BIOME + " at unmarked rural crossing";
  b.read =
    "only crossbuck and rails — no gates/bells/lights; locked carrier; dark dash";
  b.ref_notes =
    "VI-012-take-3.png = carrier-restraint routing REF ONLY — out of ship queue; do not retouch corn-belt/low-band into canon; full regen required";
  b.extra_negatives = uniq([
    ...(b.extra_negatives || []),
    ...SHARED_NEGS,
    "no corn-belt / midwestern farmscape",
    "no low-band cage only",
    "no lit green arrow at crossing",
    "no desert GPS",
  ]);
  fs.writeFileSync("cards/VI-012.json", JSON.stringify(card, null, 2) + "\n");
}

console.log("OK standing locks + 009/012 briefs");
console.log("CARRIER:", CARRIER);
