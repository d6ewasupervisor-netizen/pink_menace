"use strict";

const fs = require("fs");
const path = require("path");

const STATE_PATH = path.join(__dirname, "..", "..", "cards", "art-review-state.json");

const VERDICTS = [
  ["III-002", "CARD_BROKEN", "Central is already moving and Mya is loose on the dash — illegal. Park it, then the dash loaf is legal. Clipboard belongs on the doghouse; the still put it in the passenger glass. Paw-on-toy-mirror is downstream."],
  ["III-003", "GEOMETRY_WRONG", "Sedan belongs in the left (the passing lane). Frame puts it ahead in the right. traffic_positions filled; compiler clause now binds same-direction lanes. Passing is on the LEFT."],
  ["III-004", "WRONG_CAMERA", "Ledger has no rear window. Copy still teaches an inside mirror. Seat looking at the left door mirror is the camera; rewrite copy so there is no interior mirror."],
  ["III-005", "COPY", "Correct result: He appears in the inside mirror. Ledger has no inside mirror. Side door glass only."],
  ["III-006", "WRONG_CAMERA", "OBJECT cannot show dest-sign + stalk + column in glass. Brief also invents an interior rearview the Ledger does not have. Writer: cockpit looking at the sign switch, stalk, and the stack in the door glass."],
  ["III-007", "READ_MISSING", "Read rewritten to a static gap: pavement visible between pickup and SUV, shorter than one bus length. HOLD: attaches poisoned D4 cockpit lock."],
  ["III-008", "INVENTED", "Object camera: diamond + broken/solid whites. Extra van in the left is not in the brief."],
  ["III-009", "WRONG_CAMERA", "Hollis filling the interior rearview is canon-impossible. Left door mirror with his grille — tighter, more claustrophobic. (Stills also drifted Hollis into a semi; that is downstream of the camera.)"],
  ["III-010", "GEOMETRY_WRONG", "Vehicles face the camera, so curb-right van reads as the bus's left. Need left-to-right, van nearer the curb. traffic_positions: van right_of_ego beside."],
  [
    "III-011",
    "CARD_BROKEN",
    "Scene/decision: overtaking his left rear quarter (truck ahead-right). Geometry: behind. Camera: rearview. Three situations. His door mirrors are the subject and are absent. Hook elliptical. Scene closer: Nowhere wants you first. Fix: overhead, truck right lane, Ledger beside trailer rear, tractor mirror far ahead. Hook: You're beside his trailer. He can't see you here.",
  ],
  ["III-012", "GEOMETRY_WRONG", "HARD VERIFY: US pass is on the left. Ego is in the left travel lane; trailer is right_of_ego beside. Frame currently puts the Ledger on the trailer's right."],
  ["III-013", "PASS", ""],
  ["III-014", "READ_MISSING", "Read rewritten to a static lamp fact: left-turn arrow unlit, circular green lit. Frame still lights the arrow. Clipboard on the passenger mesh. HOLD: do not generate until D4 lock is retaken without it."],
  ["III-015", "CANON_DRIFT", "Primer sedan in the two-way pocket rendered as a Beetle — Menace silhouette on a Deac card. Do not attach any Menace ref. Negatives: no Volkswagen Beetle, no rounded-fender compact, no plow blade."],
  ["III-016", "READ_MISSING", "Read rewritten: hood crossing the lane line, tires touching the rumble. Still missing from the frame. HOLD: attaches poisoned D4 cockpit lock."],
  ["III-017", "COPY", "Mya is a loaf on the dash while the bus is in a work zone — unrestrained cat in a moving vehicle. Inside-mirror language is also illegal on the Ledger."],
  ["III-018", "WRONG_CAMERA", "POV_MIRROR_REAR is illegal on the Ledger. Hazard behind → POV_MIRROR_DOOR (left side mirror). Brief+copy swap, then recompile."],
  ["III-019", "WRONG_CAMERA", "Chase of the Ledger from outside his own seat, plus an oncoming grille. Writer: from the seat, dest sign SLOW, left arm down, volunteer in the glass, brakes dark."],
  ["III-020", "COPY", "Still reads the rumble. Debrief/hook: The same straight comes back — §5 closer."],
  ["III-021", "READ_MISSING", "Read rewritten to a static coach fact: left stalk blinking, nose already across the skip-dash. HOLD: attaches poisoned D4 cockpit lock."],
  ["III-022", "WRONG_CAMERA", "POV_MIRROR_REAR is illegal on the Ledger. Hazard behind → POV_MIRROR_DOOR. Brief+copy swap, then recompile."],
  ["III-023", "PASS", ""],
  ["III-024", "GEOMETRY_WRONG", "Pickup should be ahead, gap too short. Frame puts him beside. traffic_positions: pickup same_as_ego ahead by 1 length."],
  ["III-025", "READ_MISSING", "Read rewritten: smear of presence at the far right edge of the glass, no face, no lamps. Aurora is invented. Clipboard in the passenger glass. HOLD: do not generate until D4 lock is retaken without it."],
  ["III-026", "PASS", ""],
  ["III-027", "READ_MISSING", "Read rewritten: tablet on the doghouse is lit; bus straddles the skip-dash; sedan lamp in the left door glass. HOLD: attaches poisoned D4 cockpit lock."],
  ["III-028", "PASS", ""],
  ["III-029", "CANON_DRIFT", "The vehicle ahead wears Ledger marks (box, roof rack, amber bar). That silhouette is ego-only. Do not attach any Menace ref. Negatives: no Volkswagen Beetle, no rounded-fender compact, no plow blade."],
  ["III-030", "COPY", "Still reads stopped bus + dark skyline. Closer: The skyline is dark and the sign is dark with it."],
];

function writeStateFile() {
  let prev = {};
  if (fs.existsSync(STATE_PATH)) {
    try {
      prev = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    } catch {
      prev = {};
    }
  }
  const now = new Date().toISOString();
  const verdicts = {};
  for (const [card_id, tag, note] of VERDICTS) {
    verdicts[card_id] = { tag, note, updated_at: now };
  }
  const body = {
    act: prev.act || "III",
    cursor: prev.cursor || "III-010",
    verdicts,
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(body, null, 2) + "\n");
}

async function main() {
  writeStateFile();
  console.log("wrote", STATE_PATH);
  for (const [card_id, tag, note] of VERDICTS) {
    const res = await fetch("http://127.0.0.1:3847/api/verdict", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ card_id, tag, note }),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(card_id + " " + (data.error || res.status));
  }
  const q = await fetch("http://127.0.0.1:3847/api/queue?act=III").then((r) => r.json());
  console.log(q.counts_label);
  console.log(
    JSON.stringify(
      {
        writer_first: q.writer_first,
        recompile: q.recompile,
        copy: q.by_tag.COPY,
        pass: q.by_tag.PASS,
        by_tag: q.by_tag,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
