"use strict";

const {
  geometryClause,
  MIRROR_CLAUSE,
  MIRROR_NEGATIVES,
  DUTCH_REACH_NEGATIVES,
  cameraOf,
  describesRoadway,
} = require("./geometry");

const MASTER_STYLE =
  "Cinematic photoreal still. 35mm full-frame equivalent, f/2.0, shallow depth of field, natural falloff. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Desaturated palette: wet asphalt gray, moss green, oxidized steel, cold concrete. The only saturated color in frame is cranberry pink. Fine grain, slight lens vignetting, no HDR, no glow, no lens flare.";

const DIAGRAM_STYLE =
  "Cinematic photoreal still, same world as the rest of the game. 35mm full-frame equivalent, high overhead fifteen to twenty degrees off vertical looking along travel, everything in focus enough to read lanes. Overcast Pacific Northwest daylight — soft, diffuse, low-contrast, gray-blue ambient. Wet asphalt, moss, oxidized steel, cold concrete. The only saturated color in frame is cranberry pink. Fine grain, no HDR, no glow, no lens flare. This is a photograph of real vehicles on a real street, not a map, not an infographic, not a vector diagram.";

const FRAMING = {
  POV_COCKPIT:
    "Camera is inside the cabin, over the wheel, looking forward through the windshield. Gauges bottom-left, welded steel mesh across the top of the glass, road through the grid.",
  POV_MIRROR_REAR:
    "Camera is inside the cabin, looking up and forward at the interior rearview mirror, which is wide, weathered, and fills the upper portion of the frame. The windshield view is dark, defocused, or cropped out.",
  POV_MIRROR_DOOR:
    "Camera is on the left-side door mirror, subject in the glass, vehicle flank in the foreground.",
  POV_TOPDOWN_PHOTO:
    "Photoreal aerial establishing shot. No lane rule is being taught. Do not invent traffic direction that contradicts the geometry block.",
  POV_DIAGRAM:
    "Camera is high and slightly oblique — fifteen to twenty degrees off vertical, looking along the ego vehicle's direction of travel so the rear of the Beetle is nearer the camera and the plow is the far, leading end. Tight crop: only the lane geometry the card turns on. No extra side streets, parked cars, or curb clutter the brief did not name. Real wet pavement, real painted lines. The Pink Menace is the actual faded-pink VW Beetle with mesh cages, knobby tires, and the wide flat plow at the leading end. Other vehicles are real cars, desaturated gray or primer. Painted pavement arrows only where the brief names them, and they agree with travel direction — no floating UI arrows, no legend, no callouts.",
  POV_CHASE:
    "Camera is behind the subject vehicle, traveling the same direction. The subject's rear is the nearest and dominant mass; the body recedes away from the camera. Dead astern or offset to a flank as the brief specifies. The camera may be outside or in a following cab looking forward through glass. Never oncoming. The subject's front, grille, and headlights are not in frame.",
  POV_ROADSIDE:
    "Camera is ground level, outside the car, human eye height.",
  POV_PORTRAIT:
    "Chest-up, subject centered, background compressed.",
  POV_OBJECT:
    "The sign, the light, the marking, or the object the card turns on, isolated, shallow depth of field.",
};

const LHD =
  "Left-hand-drive vehicle: the steering wheel is on the left side of the cabin.";

const NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No gore, no wounds, no blood on skin, no bodies. No infected in sharp focus or close range. No text, no captions, no watermarks, no UI overlay. No crowds. No firearms. No anime, no illustration, no painterly rendering, no 3D render look — this is a photograph. No detached limbs, no arms or hands without a visible attached shoulder and torso, no limb growing out of a vehicle body panel.";

const DIAGRAM_NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No stick figures, no vector icons, no infographic, no textbook schematic, no flat cartoon cars, no board-game tokens, no UI overlay, no legend, no floating arrows that are not painted on the pavement. No text, no captions, no watermarks. No vehicle facing the wrong way in its lane. No two vehicles in the same lane facing each other. No vehicle occupying the left (oncoming) half of the roadway. The Pink Menace must not face the camera — no headlights or plow toward the viewer. Rear mesh nearer the camera; plow at the far leading end. Same-direction traffic shows rears, never oncoming grilles. No gore, no crowds, no firearms. This is a photograph.";

const LHD_NEGATIVE =
  "No right-hand drive, no steering wheel on the right side of the cabin, no driving on the left side of the road.";

const CHASE_CLAUSE =
  "Chase camera: camera vehicle and subject travel the same direction. The rear of the subject — back doors, rear bumper — is nearest the camera and occupies a large fraction of the frame. The body recedes away from the camera toward the top of the frame. The subject's front, grille, windshield, and headlights are not visible from this position.";

const CHASE_NEGATIVE =
  "No front grille, no headlights facing the camera, no oncoming vehicles, no vehicle facing the camera, no nose-to-nose traffic, no subject coming toward the lens.";

const SIGN_CLAUSE =
  "Traffic signs are single-faced. Any sign in frame is legible only if it faces the camera's direction of travel. Signs governing a cross or opposing approach show their blank reverse side. Exactly one sign face may be legible in any frame; if a second would be, turn it or crop it. Never depict a double-sided sign.";

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

function geometryPromptClause(geo) {
  if (!geo) return "";
  return geometryClause({
    ...geo,
    ego_heading: headingPhrase(geo.ego_heading),
  });
}

function assemblePrompt(card) {
  const brief = card.image_brief;
  if (!brief) throw new Error(`${card.card_id}: missing image_brief`);
  const cam = cameraOf(card);
  const framing = FRAMING[cam];
  if (!framing) throw new Error(`${card.card_id}: cannot compile camera ${cam}`);

  const parts = [];
  if (cam === "POV_DIAGRAM") parts.push(DIAGRAM_STYLE);
  else parts.push(MASTER_STYLE);

  parts.push(framing);

  if (brief.subject) parts.push(brief.subject.replace(/\.*$/, "."));
  if (brief.foreground) parts.push(brief.foreground.replace(/\.*$/, "."));
  if (brief.midground) parts.push(brief.midground.replace(/\.*$/, "."));
  if (brief.background) parts.push(brief.background.replace(/\.*$/, "."));
  if (brief.read) parts.push(`The read: ${brief.read.replace(/\.*$/, ".")}`);

  if (describesRoadway(card) && brief.geometry) {
    parts.push(LHD);
    if (cam === "POV_CHASE") {
      parts.push(CHASE_CLAUSE);
      const geo = brief.geometry;
      parts.push(
        "United States road configuration, traffic drives on the right. Same-direction traffic occupies the right half of the roadway. " +
          `The subject is traveling ${headingPhrase(geo.ego_heading)}. Any oncoming traffic is ${geo.oncoming_position}. No vehicle faces the wrong way in its lane.`
      );
    } else {
      parts.push(geometryPromptClause(brief.geometry));
    }
    parts.push(SIGN_CLAUSE);
  } else if (cam !== "POV_OBJECT" && cam !== "POV_PORTRAIT") {
    parts.push(LHD);
  }

  if (cam === "POV_MIRROR_REAR" || cam === "POV_MIRROR_DOOR") {
    parts.push(MIRROR_CLAUSE);
  }

  const negs = [cam === "POV_DIAGRAM" ? DIAGRAM_NEGATIVE : NEGATIVE, LHD_NEGATIVE];
  if (cam === "POV_CHASE") negs.push(CHASE_NEGATIVE);
  if (cam === "POV_MIRROR_REAR" || cam === "POV_MIRROR_DOOR") negs.push(MIRROR_NEGATIVES);
  const continuity = (brief.continuity || []);
  if (cam === "POV_MIRROR_DOOR" && continuity.includes("dutch_reach")) {
    negs.push(DUTCH_REACH_NEGATIVES);
  }
  parts.push(negs.join(" "));

  const aspect = brief.aspect || "2:3";
  parts.push(`Aspect ratio ${aspect}.`);
  return parts.join(" ");
}

module.exports = { assemblePrompt, FRAMING, MASTER_STYLE, DIAGRAM_STYLE, LHD };
