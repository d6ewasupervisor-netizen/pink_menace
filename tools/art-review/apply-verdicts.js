"use strict";

const VERDICTS = [
  ["III-002", "READ_MISSING", "Paw is on a dash toy mirror, not the right door glass the card turns on."],
  ["III-003", "GEOMETRY_WRONG", "Sedan belongs in the left (the passing lane). Frame puts it ahead in the right."],
  ["III-004", "WRONG_CAMERA", "Ledger has no rear window. Copy still teaches an inside mirror. Seat looking at the left door mirror is the camera; rewrite copy so there is no interior mirror."],
  ["III-005", "PASS", ""],
  ["III-006", "WRONG_CAMERA", "OBJECT cannot show dest-sign + stalk + column in glass. Brief also invents an interior rearview the Ledger does not have. Writer: cockpit looking at the sign switch, stalk, and the stack in the door glass."],
  ["III-007", "READ_MISSING", "The countable gap between two same-direction vehicles is not the first thing the eye reads."],
  ["III-008", "INVENTED", "Object camera: diamond + broken/solid whites. Extra van in the left is not in the brief."],
  ["III-009", "WRONG_CAMERA", "Hollis filling the interior rearview is canon-impossible. Left door mirror with his grille — tighter, more claustrophobic. (Stills also drifted Hollis into a semi; that is downstream of the camera.)"],
  ["III-010", "GEOMETRY_WRONG", "Vehicles face the camera, so curb-right van reads as the bus's left. Need left-to-right, van nearer the curb."],
  [
    "III-011",
    "CARD_BROKEN",
    "Scene/decision: overtaking his left rear quarter (truck ahead-right). Geometry: behind. Camera: rearview. Three situations. His door mirrors are the subject and are absent. Hook elliptical. Scene closer: Nowhere wants you first. Fix: overhead, truck right lane, Ledger beside trailer rear, tractor mirror far ahead. Hook: You're beside his trailer. He can't see you here.",
  ],
  ["III-012", "GEOMETRY_WRONG", "US pass is on the left. Frame puts the Ledger on the trailer's right."],
  ["III-013", "PASS", ""],
  ["III-014", "READ_MISSING", "Read is arrow dark, circle green. Frame still lights the arrow."],
  ["III-015", "CANON_DRIFT", "Primer sedan in the two-way pocket rendered as a Beetle — Menace silhouette on a Deac card."],
  ["III-016", "READ_MISSING", "Hood line walking toward the rumble is not in the frame."],
  ["III-017", "PASS", ""],
  ["III-018", "WRONG_CAMERA", "POV_MIRROR_REAR is illegal on the Ledger. Hazard behind → POV_MIRROR_DOOR (left side mirror). Brief+copy swap, then recompile."],
  ["III-019", "WRONG_CAMERA", "Chase of the Ledger from outside his own seat, plus an oncoming grille. Writer: from the seat, dest sign SLOW, left arm down, volunteer in the glass, brakes dark."],
  ["III-020", "COPY", "Still reads the rumble. Debrief/hook: The same straight comes back — §5 closer."],
  ["III-021", "READ_MISSING", "Her stalk-on / coming back into your lane is not the mute read. Yellow overhead is."],
  ["III-022", "WRONG_CAMERA", "POV_MIRROR_REAR is illegal on the Ledger. Hazard behind → POV_MIRROR_DOOR. Brief+copy swap, then recompile."],
  ["III-023", "PASS", ""],
  ["III-024", "GEOMETRY_WRONG", "Pickup should be ahead, gap too short. Frame puts him beside."],
  ["III-025", "READ_MISSING", "T1 smear at the edge of the glass is absent. Aurora is invented."],
  ["III-026", "PASS", ""],
  ["III-027", "READ_MISSING", "Lit tablet mid-change is the subject and is not in the cab."],
  ["III-028", "PASS", ""],
  ["III-029", "CANON_DRIFT", "The vehicle ahead wears Ledger marks (box, roof rack, amber bar). That silhouette is ego-only."],
  ["III-030", "COPY", "Still reads stopped bus + dark skyline. Closer: The skyline is dark and the sign is dark with it."],
];

async function main() {
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
  console.log(JSON.stringify({ writer_first: q.writer_first, recompile: q.recompile, copy: q.by_tag.COPY, pass: q.by_tag.PASS }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
