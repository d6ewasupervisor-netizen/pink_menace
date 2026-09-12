"use strict";

const {
  geometryClause,
  trafficPositionsClause,
  framePlacementClause,
  framePassNegatives,
  markingAnchorClause,
  usesFramePlacement,
  MIRROR_CLAUSE,
  DOOR_MIRROR_CLAUSE,
  MIRROR_NEGATIVES,
  DUTCH_REACH_NEGATIVES,
  cameraOf,
  describesRoadway,
} = require("./geometry");
const { vehicleParked } = require("./authoring-seat");

const MASTER_STYLE =
  "Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only saturated color in frame is cranberry pink. Fine grain, slight lens vignetting, no HDR, no glow, no lens flare.";

const DEAC_STYLE =
  "Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only saturated color in frame is transit amber. Fine grain, slight lens vignetting, no HDR, no glow, no lens flare.";

const DIAGRAM_STYLE =
  "Cinematic photoreal still, same world as the rest of the game. 35mm full-frame equivalent, high overhead fifteen to twenty degrees off vertical looking along travel, everything in focus enough to read lanes. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Wet asphalt, moss, oxidized steel, cold concrete. The only saturated color in frame is cranberry pink. Fine grain, no HDR, no glow, no lens flare. This is a photograph of real vehicles on a real street, not a map, not an infographic, not a vector diagram.";

const LEDGER_DIAGRAM_STYLE =
  "Cinematic photoreal still, same world as the rest of the game. 35mm full-frame equivalent, high overhead fifteen to twenty degrees off vertical looking along travel, everything in focus enough to read lanes. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Wet asphalt, moss, oxidized steel, cold concrete. The only saturated color in frame is transit amber. Fine grain, no HDR, no glow, no lens flare. This is a photograph of real vehicles on a real street, not a map, not an infographic, not a vector diagram.";

const FRAMING = {
  POV_COCKPIT:
    "Camera is inside the cabin, over the wheel, looking forward through the windshield. Gauges bottom-left, welded steel mesh across the top of the glass, road through the grid.",
  POV_COCKPIT_LEDGER:
    "Camera is inside the high-seat cabin, no driver face in frame. Match the attached cockpit lock exactly — same worn three-spoke wheel, same analog cluster, same bar cage with a cut wiper slot, same thermos in the right-side cup. Do not invent a different dashboard, a different mesh, extra switch labels, or a second vehicle interior. Default is over that wheel looking forward through the windshield, road through the grid. The right half of the windshield is open road — no clipboard, no log sheet, no paper on the mesh. The clipboard if present is on the doghouse between the seats, below the glass. When the brief names the left door mirror: sit in the seat and look left at the big side mirror on the left door; the windshield and any cones stay in the right of frame. When the brief names the right door mirror or a right-side sliver: sit in the seat and look right across the doghouse at the right door glass; never put a right-side hazard in the left mirror.",
  POV_DIAGRAM_LEDGER:
    "Camera is high and slightly oblique — fifteen to twenty degrees off vertical, looking along the ego vehicle's direction of travel so the rear of the cutaway shuttle is nearer the camera and the van nose is the far, leading end. Tight crop: only the lane geometry the card turns on. No extra side streets, parked cars, or curb clutter the brief did not name. Real wet pavement, real painted lines. The Ledger is the actual ex-transit cutaway: tall square passenger box on a van nose, gray primer over faded green-and-white, oversize side mirrors on long arms, amber destination sign with no readable text, bar cage over the windshield. Other vehicles are ordinary cars or trucks, desaturated gray or primer, never a second cutaway shuttle. Painted pavement arrows only where the brief names them, and they agree with travel direction — no floating UI arrows, no legend, no callouts.",
  POV_MIRROR_REAR:
    "Camera is inside the cabin, looking up and forward at the interior rearview mirror, which is wide, weathered, and fills the upper portion of the frame. The windshield view is dark, defocused, or cropped out.",
  POV_MIRROR_DOOR:
    "Camera is inside the cab, in the driver's seat. Resolve which door mirror by the hazard's side. Hazard behind or to the left: look left into the left door-mounted side mirror. Hazard on the right (curb side, right-side blind spot): look right across the passenger seat at the right door-mounted side mirror or the right window as the brief names. The Ledger has oversize mirrors on long arms on both sides. Never place a right-side hazard in the left glass. If the brief names a sliver in the window: the right door-mirror glass does not contain the other vehicle; the only read is the faintest hint of that vehicle's nose at the trailing edge of the right window, parallel, same heading. Do not stand outside the vehicle. Do not shoot the mirror from behind the box.",
  POV_TOPDOWN_PHOTO:
    "Photoreal aerial establishing shot. No lane rule is being taught. Do not invent traffic direction that contradicts the geometry block.",
  POV_DIAGRAM:
    "Camera is high and slightly oblique — fifteen to twenty degrees off vertical, looking along the ego vehicle's direction of travel so the rear of the Beetle is nearer the camera and the plow is the far, leading end. Tight crop: only the lane geometry the card turns on. No extra side streets, parked cars, or curb clutter the brief did not name. Real wet pavement, real painted lines. The Pink Menace is the actual faded-pink VW Beetle with mesh cages, knobby tires, and the wide flat plow at the leading end. Other vehicles are real cars, desaturated gray or primer. Painted pavement arrows only where the brief names them, and they agree with travel direction — no floating UI arrows, no legend, no callouts.",
  POV_CHASE:
    "Camera is behind the subject vehicle, traveling the same direction. The subject's rear is the nearest and dominant mass; the body recedes away from the camera. Dead astern or offset to a flank as the brief specifies. The camera may be outside or in a following cab looking forward through glass. Never oncoming. The subject's front, grille, and headlights are not in frame.",
  POV_ROADSIDE:
    "Camera is ground level, outside the car, human eye height.",
  POV_ROADSIDE_PROFILE:
    "Camera is at curb height, a true profile of the vehicles. You see the long near flanks. Noses point along the roadway, not at the lens.",
  POV_PORTRAIT:
    "Chest-up, subject centered, background compressed.",
  POV_OBJECT:
    "The sign, the light, the marking, or the object the card turns on, isolated, shallow depth of field.",
};

const LHD =
  "Left-hand-drive vehicle: the steering wheel is on the left side of the cabin.";

const NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No gore, no wounds, no blood on skin, no corpses. No text, no captions, no watermarks, no UI overlay. No crowds. No firearms. No anime, no illustration, no painterly rendering, no 3D render look — this is a photograph. No detached limbs, no arms or hands without a visible attached shoulder and torso, no limb growing out of a vehicle body panel.";

const DAYLIGHT_NEGATIVE =
  "No night, no full night, no city at night, no dusk-as-night, no blue hour, no black sky, no star field, no lit office towers as night key light, no sodium streetlight night, no headlights as the only illumination, no warm headlight-dominant night look, no near-black asphalt night. The sky must be readable daylight or pale overcast gray-white, not black.";

const MENACE_CABIN_BUILD =
  "Menace cabin, positive layout: a flat painted-metal dash of the period — one continuous Type 1 shelf with no recess, no tablet bay, no rectangle that could hold a screen. A single instrument nacelle, one housing only. An unbranded wheel — worn leather, plain hub, no logo, no VW roundel. A manual floor shifter with a ball knob on the tunnel. Three pedals: clutch, brake, accelerator. Coarse Menace panel mesh over the glass — thick welded panels, large openings — not Encore's fine full-windshield grid, not a flyscreen. Default: the single nacelle is angled away from the camera so no glyphs render. Only when the card brief names a readable needle or cluster-at-0, show that one period-correct dial.";

const MENACE_CABIN_NEGATIVES =
  "No rectangular touchscreen, no tablet, no infotainment, no GPS, no navigation screen, no glass panel in the dash, no dash cutout for a screen, no VW roundel, no Volkswagen logo on the wheel, no emblem on the hub, no three-gauge modern cluster, no invented gauge numerals, no GPS text, no fine full-windshield flyscreen grid, no two-pedal automatic box, no missing clutch on a Menace cabin.";

function wantsNight(card) {
  const t = String((card.variation && card.variation.time_of_day) || "").toLowerCase();
  if (!t) return false;
  return /^(night|dusk|dark[_-]?hours)$/.test(t) || /\bnight\b/.test(t);
}

function variationLighting(card) {
  const v = card.variation || {};
  const tod = String(v.time_of_day || "").toLowerCase();
  const weather = String(v.weather || "").toLowerCase();
  const bits = [];
  if (weather === "ice") {
    bits.push("Ice on the pavement. Pale winter light, not a black sky.");
  }
  if (weather === "clear_cold") {
    bits.push("Clear cold pale winter daylight — readable gray-white sky, not overcast murk, not golden hour, not night.");
  }
  if (tod === "dawn") {
    bits.push("Dawn: pale gray-white sky, ice-at-dawn if named, not night, not blue hour, not sodium streetlight key.");
  }
  if (tod === "morning") {
    bits.push("Morning daylight. Sky is pale and readable.");
  }
  if (tod === "midday") {
    bits.push("Overcast midday daylight.");
  }
  if (tod === "afternoon") {
    bits.push("Overcast afternoon daylight, not golden hour.");
  }
  return bits.join(" ");
}

const QUIET_REGISTER =
  "Match the attached Quiet plate for register only — wrongness of posture and stillness, not damage, not a wound. Filthy torn everyday clothing, slack shoulders, a canted or tilted head, standing or moving as if doing nothing. Distance and glass are their whole grammar. They never fill the frame, never appear in a side-window close-up, never make eye contact. Write them farther than the shot needs: thirty feet renders at ten to fifteen, sixty at thirty to forty. If a face must die, obscure it with motion or distance only. Near-legibility is allowed on a lunge; a fully destroyed face is duller. Do not name them as diseased.";

const QUIET_NEGATIVE =
  "No upright alert posture, no eye contact with camera, no person looking at the lens, no walking normally, no clean clothing. No blurred or pixelated face patch, no censorship smear — obscure the face with motion or distance only. The Quiet never fill the frame, never appear in a side-window close-up, never make eye contact. No gore, no wounds, no blood on a Quiet.";

const DIAGRAM_NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No stick figures, no vector icons, no infographic, no textbook schematic, no flat cartoon cars, no board-game tokens, no UI overlay, no legend, no floating arrows that are not painted on the pavement. No text, no captions, no watermarks. No vehicle facing the wrong way in its lane. No two vehicles in the same lane facing each other. No vehicle occupying the left (oncoming) half of the roadway. The Pink Menace must not face the camera — no headlights or plow toward the viewer. Rear mesh nearer the camera; plow at the far leading end. Same-direction traffic shows rears, never oncoming grilles. No gore, no crowds, no firearms. This is a photograph.";

const OTHER_VEHICLE_CLAUSE_LEDGER =
  "Any vehicle other than the Ledger must be visually distinct from it. When the ego vehicle is the Ledger, no other vehicle in frame may be a transit-style box: no cutaway shuttle body, no amber dot-matrix destination sign, no roof cargo rack, no long-arm side mirrors. Those four marks belong only to the Ledger. Other traffic uses plainly different silhouettes — a panel van, a stake-bed, a flatbed, a sedan — with factory door mirrors only. No Volkswagen Beetle, no rounded-fender compact, no pink car, no plow blade, on any vehicle.";

const LEDGER_DIAGRAM_NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No stick figures, no vector icons, no infographic, no textbook schematic, no flat cartoon cars, no board-game tokens, no UI overlay, no legend, no floating arrows that are not painted on the pavement. No text, no captions, no watermarks. No vehicle facing the wrong way in its lane. No two vehicles in the same lane facing each other. No vehicle occupying the left (oncoming) half of the roadway. The Ledger must not face the camera — no headlights or van nose toward the viewer. Rear of the square box nearer the camera; van nose at the far leading end. Same-direction traffic shows rears, never oncoming grilles. No Volkswagen Beetle, no rounded-fender compact, no plow blade. No gore, no crowds, no firearms. This is a photograph.";

const LEDGER_NO_MENACE =
  "No Volkswagen Beetle, no rounded-fender compact, no plow blade.";

const MENACE_PLOW =
  "Nose plow: match the attached overcast plate ref_car_nose_plow.png exactly for plow geometry. The plow is one continuous wide flat black steel plate on the FRONT black-tube bull bar, in front of both front wheels. The blade spans the FULL WIDTH of that bull bar — its outer edges sit roughly level with the outer faces of the front wheels. It hangs below the bull bar like a snowplow / dozer blade. It is not a narrow flap, not a small panel on one side, not a one-third-width tab with bare bull bar across the rest. No flank-mounted blade; no blade on a corner; no blade on the rear or engine lid. Preserve on the Menace: welded steel mesh cages on the side glass and the windshield; a riveted metal door panel; oversize knobby tires on chrome slot wheels; faded matte pink with bare-metal / oxidized steel plating. Use ref_car_exterior.jpg for Beetle silhouette and build only; never carry its salt-flat sunset. Never attach ref_car_rear_plow.jpg or any flank / corner plow plate.";

const MENACE_PLOW_AWAY =
  "The attached ref_car_nose_plow.png is a catalog plate of the SAME car facing the lens. Copy ONLY the blade geometry from it — do not copy its toward-camera heading. Rotate the Beetle so it travels AWAY from the camera: the sloping rear engine lid and rear-window mesh are nearest the camera and large; the plate's full-width nose blade sits on the FAR / leading / FRONT bull bar and points at the TOP of the frame. From this rear-three-quarter both outer edges of that wide blade remain visible past the front corners. Never weld the plate onto the near (rear) bumper. Never shrink the far blade to a flap.";

const IV004_NONNEGOTIABLE_SET =
  "IV-004 NON-NEGOTIABLE SET — this take MUST contain ALL THREE as one situation, not separate optional descriptors: " +
  "(1) away-from-camera heading — the plow / blade points toward the TOP of the frame; the sloping rear engine lid is nearer the camera and large; " +
  "(2) full-width nose blade across the FRONT black-tube bull bar matching the attached ref_car_nose_plow.png exactly — one continuous wide flat black steel plate, outer edges roughly level with the front wheels, hanging below the bar like a snowplow; not a narrow flap; not a one-third-width tab; not welded onto the rear; " +
  "(3) in-lane motion — the Menace is squared to the lane, long axis parallel to the centerline, ROLLING, wet tire spray off the knobbies. " +
  "A take that has the blade but faces the camera fails the card. A take that is away but wears a flap fails the card. A take that is parked or diagonal fails the card. " +
  "Start from take-103 hazard staging and plow quality; reverse heading only. Person is mid-gap between the parked van and sedan, not in the open roadway. Do not use take-76. " +
  "Preserve on the Menace: welded steel mesh cages on the side glass and the windshield; a riveted metal door panel; oversize knobby tires on chrome slot wheels; faded matte pink with bare-metal / oxidized steel plating. Use ref_car_exterior.jpg for Beetle silhouette and build only; never carry its salt-flat sunset.";

const MENACE_PLOW_NEGATIVE =
  "No side-mounted plow, no flank-mounted blade, no left-flank blade, no corner-mounted blade, no blade on a side arm ahead of the front wheel, no narrow flap plow, no small panel hanging off one side of the bull bar, no one-third-width blade, no bare bull bar with only a partial blade, no plain tube bumper without a blade, no rear-mounted plow, no blade on the engine lid, no plow welded onto the rear of the Beetle.";

const MENACE_PLOW_AWAY_NEGATIVE =
  "No Beetle facing the camera, no headlights or plow toward the viewer, no copying the nose-plow plate's toward-camera heading onto the street car, no full-width blade on the near bumper.";

const LHD_NEGATIVE =
  "No right-hand drive, no steering wheel on the right side of the cabin, no driving on the left side of the road.";

const CHASE_CLAUSE =
  "Chase camera: camera vehicle and subject travel the same direction. The rear of the subject — back doors, rear bumper — is nearest the camera and occupies a large fraction of the frame. The body recedes away from the camera toward the top of the frame. The subject's front, grille, windshield, and headlights are not visible from this position.";

const CHASE_NEGATIVE =
  "No front grille, no headlights facing the camera, no oncoming vehicles, no vehicle facing the camera, no nose-to-nose traffic, no subject coming toward the lens.";

const PROFILE_NEGATIVE =
  "No headlights facing the camera, no grille toward the viewer, no vehicle coming toward the lens, no head-on view.";

const SIGN_CLAUSE =
  "Traffic signs are single-faced. Any sign in frame is legible only if it faces the camera's direction of travel. Signs governing a cross or opposing approach show their blank reverse side. Exactly one sign face may be legible in any frame; if a second would be, turn it or crop it. Never depict a double-sided sign.";

const LEDGER_CLIPBOARD_NEGATIVES =
  "No clipboard on the dashboard, no clipboard clipped to the windshield or the mesh, " +
  "no clipboard blocking the right half of the road, no log sheet in the glass. " +
  "The clipboard if visible is on the doghouse between the seats, on the driver's thigh, or in his hands, never in the windshield.";

const LEDGER_MOVING_CAT_NEGATIVES =
  "No cat on the dash, no cat loose in the cab, no unrestrained animal in a moving vehicle.";

const LEDGER_PARKED_CAT =
  "The vehicle is parked and still. A brown mackerel tabby may loaf on the dash. Do not show the cat if the wheels are rolling.";

const LEDGER_INCAB = new Set(["POV_COCKPIT", "POV_OBJECT", "POV_MIRROR_DOOR", "POV_PORTRAIT"]);

function otherVehicleClauseLedger(card) {
  if (card && Array.isArray(card.cast) && card.cast.includes("old_ninety")) {
    return (
      "Any vehicle other than the Ledger must be visually distinct from it. " +
      "The Ledger is the only cutaway shuttle: no second cutaway body, no amber destination sign, no roof cargo rack on any other vehicle. " +
      "Old Ninety is a semi tractor-trailer with dirty door mirrors on the cab — those mirrors are the subject, not a second Ledger. " +
      "No Volkswagen Beetle, no rounded-fender compact, no pink car, no plow blade, on any vehicle."
    );
  }
  return OTHER_VEHICLE_CLAUSE_LEDGER;
}

function diagramNegativeBlock(deac, geo) {
  let n = deac ? LEDGER_DIAGRAM_NEGATIVE : DIAGRAM_NEGATIVE;
  if (
    geo &&
    typeof geo.lanes_this_direction === "number" &&
    geo.lanes_this_direction >= 2 &&
    /none/i.test(String(geo.oncoming_position || ""))
  ) {
    n = n.replace(
      / No vehicle occupying the left \(oncoming\) half of the roadway\./,
      ""
    );
  }
  return n;
}

function headingPhrase(heading) {
  switch (heading) {
    case "away_from_camera":
      return "away from the camera";
    case "toward_camera":
      return "toward the camera";
    case "left_to_right":
      return "left to right across the frame";
    case "right_to_left":
      return "right to left across the frame";
    default:
      return heading;
  }
}

function geometryPromptClause(geo, driver) {
  if (!geo) return "";
  if (/not in frame/i.test(String(geo.ego_nose_in_frame || ""))) {
    return (
      "The ego vehicle is behind the camera and is not in this frame. Do not render the Pink Menace, a plow, a cabin, or a steering wheel. " +
      `Any oncoming traffic is ${geo.oncoming_position}.`
    );
  }
  const core = geometryClause(
    {
      ...geo,
      ego_heading: headingPhrase(geo.ego_heading),
    },
    driver
  );
  const traffic = trafficPositionsClause(geo, driver);
  return [core, traffic].filter(Boolean).join(" ");
}

function assemblePrompt(card) {
  const brief = card.image_brief;
  if (!brief) throw new Error(`${card.card_id}: missing image_brief`);
  const cam = cameraOf(card);
  const deac = card.driver === "deac";
  if (deac && cam === "POV_MIRROR_REAR") {
    throw new Error(
      `${card.card_id}: POV_MIRROR_REAR is illegal on the Ledger — no rear window, no interior mirror; use POV_MIRROR_DOOR`
    );
  }
  let framing = FRAMING[cam];
  if (deac && cam === "POV_COCKPIT") framing = FRAMING.POV_COCKPIT_LEDGER;
  if (deac && cam === "POV_DIAGRAM") framing = FRAMING.POV_DIAGRAM_LEDGER;
  if (deac && cam === "POV_OBJECT" && (brief.continuity || []).includes("hov_geometry")) {
    framing = FRAMING.POV_COCKPIT_LEDGER;
  }
  if (typeof brief.camera_pose === "string" && brief.camera_pose.trim()) {
    framing = brief.camera_pose.trim();
  }
  if (!framing) throw new Error(`${card.card_id}: cannot compile camera ${cam}`);

  const parts = [];
  if (cam === "POV_DIAGRAM") parts.push(deac ? LEDGER_DIAGRAM_STYLE : DIAGRAM_STYLE);
  else parts.push(deac ? DEAC_STYLE : MASTER_STYLE);

  parts.push(framing);

  const framed = Boolean(brief.geometry && usesFramePlacement(brief.geometry));
  if (framed) {
    parts.push(framePlacementClause(brief.geometry, card.driver, { camera: cam }));
  }

  if (
    deac &&
    (cam === "POV_CHASE" ||
      cam === "POV_ROADSIDE" ||
      cam === "POV_ROADSIDE_PROFILE" ||
      cam === "POV_DIAGRAM")
  ) {
    parts.push(
      "Ego vehicle: a classic cutaway shuttle bus, unmistakably a van-nose cutaway in silhouette — a tall square passenger box on a van cab, faded green and white transit livery ghosting under gray primer. All four of the following must be clearly visible and unmistakable: the tall square box on a van nose, oversize side mirrors on long arms on both sides, an amber dot-matrix destination sign above the windshield with no readable text, and a welded bar cage over the windshield with a cut wiper slot."
    );
  }
  if (deac && cam !== "POV_PORTRAIT") {
    parts.push(otherVehicleClauseLedger(card));
  }

  const continuityEarly = (brief.continuity || []);
  const menaceExterior =
    !deac &&
    (continuityEarly.includes("pink_menace_exterior") ||
      (cam === "POV_DIAGRAM" && card.driver !== "yuna"));
  if (menaceExterior) {
    if (card.card_id === "IV-004") {
      parts.push(IV004_NONNEGOTIABLE_SET);
    } else {
      parts.push(MENACE_PLOW);
      if (brief.geometry && brief.geometry.ego_heading === "away_from_camera") {
        parts.push(MENACE_PLOW_AWAY);
      }
    }
  }
  const quietNamed =
    continuityEarly.includes("the_quiet") ||
    /\bthe Quiet\b/.test(
      [brief.subject, brief.foreground, brief.midground, brief.background, brief.read]
        .filter(Boolean)
        .join(" ")
    );
  if (quietNamed) {
    let register = QUIET_REGISTER;
    if (card.card_id === "I-007") {
      register = register
        .replace("standing or moving as if doing nothing.", "not standing still.")
        .replace(
          "Distance and glass are their whole grammar. They never fill the frame, never appear in a side-window close-up, never make eye contact. Write them farther than the shot needs: thirty feet renders at ten to fifteen, sixty at thirty to forty. If a face must die, obscure it with motion or distance only. Near-legibility is allowed on a lunge; a fully destroyed face is duller.",
          "They never fill the frame, never appear in a side-window close-up, never make eye contact. This one is the lunge, used once, shot from inside the aisle slightly beside the runner so the camera sees the back of the head and the driving shoulder, not a face-on charge. Mid-stride, one foot off the ground, body pitched forward, about fifteen feet, framed by two derelict parked cars. The face is on the far side of the head and is not in the shot. Heavy motion blur on the body and hair; the cars stay sharp. Do not match a face-on lunge plate."
        );
    }
    parts.push(register);
  }

  const lighting = variationLighting(card);
  if (lighting) parts.push(lighting);

  if (brief.subject) parts.push(brief.subject.replace(/\.*$/, "."));
  if (brief.foreground) parts.push(brief.foreground.replace(/\.*$/, "."));
  if (brief.midground) parts.push(brief.midground.replace(/\.*$/, "."));
  if (brief.background) parts.push(brief.background.replace(/\.*$/, "."));
  if (brief.read) {
    parts.push(`The read: ${brief.read.replace(/\.*$/, ".")}`);
    parts.push(
      "Muted-text test: if every caption and UI label were hidden, that single visual fact must still be the first thing the eye reads, large and central, not implied."
    );
  }
  if (deac && cam === "POV_PORTRAIT") {
    parts.push(
      "Subject identity: a broad tall-shouldered 54-year-old man with dark brown skin, close-cut gray hair receding at the temples, a short gray beard, deep-set tired eyes with reddened lids, wearing a faded charcoal transit operator's jacket with a worn-off patch over a dulled amber high-visibility safety vest grimy and taped at one shoulder, half-frame reading glasses hanging on a cord against his chest. No smile. No bandage. No blood."
    );
  }

  if (describesRoadway(card) && brief.geometry) {
    parts.push(LHD);
    if (!framed) {
      if (cam === "POV_CHASE") {
        parts.push(CHASE_CLAUSE);
        const geo = brief.geometry;
        parts.push(
          "United States road configuration, traffic drives on the right. " +
            `The subject is traveling ${headingPhrase(geo.ego_heading)}. Any oncoming traffic is ${geo.oncoming_position}. No vehicle faces the wrong way in its lane.`
        );
        const traffic = trafficPositionsClause(geo, card.driver);
        if (traffic) parts.push(traffic);
      } else {
        parts.push(geometryPromptClause(brief.geometry, card.driver));
      }
    }
    parts.push(SIGN_CLAUSE);
    const mark = markingAnchorClause(brief.geometry);
    if (mark) parts.push(mark);
  } else if (cam !== "POV_OBJECT" && cam !== "POV_PORTRAIT") {
    parts.push(LHD);
  }

  if (cam === "POV_MIRROR_REAR") {
    parts.push(MIRROR_CLAUSE);
  }
  if (cam === "POV_MIRROR_DOOR") {
    parts.push(DOOR_MIRROR_CLAUSE);
  }

  const negs = [
    cam === "POV_DIAGRAM" ? diagramNegativeBlock(deac, brief.geometry) : NEGATIVE,
    LHD_NEGATIVE,
  ];
  if (deac) negs.push(LEDGER_NO_MENACE);
  if (menaceExterior) {
    negs.push(MENACE_PLOW_NEGATIVE);
    if (brief.geometry && brief.geometry.ego_heading === "away_from_camera") {
      negs.push(MENACE_PLOW_AWAY_NEGATIVE);
    }
  }
  if (brief.geometry) {
    const frameNeg = framePassNegatives(brief.geometry, card.driver, cam);
    if (frameNeg) negs.push(frameNeg);
  }
  if (cam === "POV_ROADSIDE_PROFILE") negs.push(PROFILE_NEGATIVE);
  if (cam === "POV_CHASE") negs.push(CHASE_NEGATIVE);
  if (cam === "POV_MIRROR_REAR" || cam === "POV_MIRROR_DOOR") negs.push(MIRROR_NEGATIVES);
  const continuity = (brief.continuity || []);
  if (quietNamed) negs.push(QUIET_NEGATIVE);
  if (cam === "POV_MIRROR_DOOR" && continuity.includes("dutch_reach")) {
    negs.push(DUTCH_REACH_NEGATIVES);
  }
  if (Array.isArray(brief.extra_negatives) && brief.extra_negatives.length) {
    negs.push(brief.extra_negatives.join(". ") + ".");
  }
  if (!wantsNight(card)) {
    negs.push(DAYLIGHT_NEGATIVE);
  }
  const menaceCabin =
    card.driver === "ali" &&
    (continuity.includes("pink_menace_interior") ||
      cam === "POV_COCKPIT" ||
      cam === "POV_MIRROR_REAR");
  if (menaceCabin) {
    parts.push(MENACE_CABIN_BUILD);
    negs.push(MENACE_CABIN_NEGATIVES);
  }
  if (deac && LEDGER_INCAB.has(cam)) {
    negs.push(LEDGER_CLIPBOARD_NEGATIVES);
    const parked = vehicleParked(card);
    const myaNamed =
      continuity.includes("mya") || /\b(mya|tabby|\bcat\b)\b/i.test(brief.subject || "");
    if (parked && myaNamed) {
      parts.push(LEDGER_PARKED_CAT);
    } else {
      negs.push(LEDGER_MOVING_CAT_NEGATIVES);
    }
  }
  parts.push(negs.join(" "));

  const aspect = brief.aspect || "2:3";
  parts.push(`Aspect ratio ${aspect}.`);
  return parts.join(" ");
}

module.exports = {
  assemblePrompt,
  FRAMING,
  MASTER_STYLE,
  DIAGRAM_STYLE,
  LHD,
  OTHER_VEHICLE_CLAUSE_LEDGER,
  DAYLIGHT_NEGATIVE,
  MENACE_PLOW,
  MENACE_PLOW_AWAY,
  IV004_NONNEGOTIABLE_SET,
  MENACE_PLOW_NEGATIVE,
  MENACE_PLOW_AWAY_NEGATIVE,
  MENACE_CABIN_BUILD,
  MENACE_CABIN_NEGATIVES,
  wantsNight,
};
