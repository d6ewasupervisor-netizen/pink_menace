"use strict";

const {
  geometryClause,
  MIRROR_CLAUSE,
  MIRROR_NEGATIVES,
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
    "Camera is behind and slightly above the vehicle, road ahead visible.",
  POV_ROADSIDE:
    "Camera is ground level, outside the car, human eye height.",
  POV_PORTRAIT:
    "Chest-up, subject centered, background compressed.",
  POV_OBJECT:
    "The sign, the light, or the marking, isolated, shallow depth of field.",
};

const LHD =
  "Left-hand-drive vehicle: the steering wheel is on the left side of the cabin.";

const NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No gore, no wounds, no blood on skin, no bodies. No infected in sharp focus or close range. No text, no captions, no watermarks, no UI overlay. No crowds. No firearms. No anime, no illustration, no painterly rendering, no 3D render look — this is a photograph.";

const DIAGRAM_NEGATIVE =
  "No golden hour, no sunset, no desert, no salt flat, no cracked dry earth, no warm orange light, no lens flare, no HDR, no glow, no bloom. No stick figures, no vector icons, no infographic, no textbook schematic, no flat cartoon cars, no board-game tokens, no UI overlay, no legend, no floating arrows that are not painted on the pavement. No text, no captions, no watermarks. No vehicle facing the wrong way in its lane. The Pink Menace must not face the camera — no headlights or plow toward the viewer. Rear mesh nearer the camera; plow at the far leading end. No gore, no crowds, no firearms. This is a photograph.";

const LHD_NEGATIVE =
  "No right-hand drive, no steering wheel on the right side of the cabin, no driving on the left side of the road.";

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
    parts.push(geometryPromptClause(brief.geometry));
  } else if (cam !== "POV_OBJECT" && cam !== "POV_PORTRAIT") {
    parts.push(LHD);
  }

  if (cam === "POV_MIRROR_REAR" || cam === "POV_MIRROR_DOOR") {
    parts.push(MIRROR_CLAUSE);
  }

  const negs = [cam === "POV_DIAGRAM" ? DIAGRAM_NEGATIVE : NEGATIVE, LHD_NEGATIVE];
  if (cam === "POV_MIRROR_REAR" || cam === "POV_MIRROR_DOOR") negs.push(MIRROR_NEGATIVES);
  parts.push(negs.join(" "));

  const aspect = brief.aspect || "3:4";
  parts.push(`Aspect ratio ${aspect}.`);
  return parts.join(" ");
}

module.exports = { assemblePrompt, FRAMING, MASTER_STYLE, DIAGRAM_STYLE, LHD };
