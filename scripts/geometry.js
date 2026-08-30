"use strict";

const LEGAL_CAMERAS = [
  "POV_COCKPIT",
  "POV_MIRROR_REAR",
  "POV_MIRROR_DOOR",
  "POV_TOPDOWN_PHOTO",
  "POV_DIAGRAM",
  "POV_CHASE",
  "POV_ROADSIDE",
  "POV_PORTRAIT",
  "POV_OBJECT",
];

const BANNED_CAMERAS = ["POV_TOPDOWN", "POV_MIRROR"];

const HEADINGS = ["away_from_camera", "toward_camera", "left_to_right", "right_to_left"];
const HAZARDS = ["ahead_same_direction", "behind", "oncoming", "beside", "none"];
const GEOMETRY_KEYS = [
  "ego_heading",
  "ego_lane_side",
  "ego_nose_in_frame",
  "oncoming_position",
  "hazard_position",
];

const ROAD_CAMERAS = new Set([
  "POV_COCKPIT",
  "POV_CHASE",
  "POV_DIAGRAM",
  "POV_TOPDOWN_PHOTO",
  "POV_MIRROR_REAR",
  "POV_MIRROR_DOOR",
  "POV_ROADSIDE",
]);

const FORWARD_CAMERAS = new Set(["POV_COCKPIT", "POV_CHASE", "POV_TOPDOWN_PHOTO"]);

const OBJECT_ROAD_RE = /\b(intersection|centerline|lane|roadway|street|crosswalk|arterial)\b/i;

function cameraOf(card) {
  return card && card.image_brief && card.image_brief.camera;
}

function briefText(brief, keys) {
  const b = brief || {};
  return keys.map((k) => (typeof b[k] === "string" ? b[k] : "")).join(" ");
}

function describesRoadway(card) {
  const brief = card && card.image_brief;
  const cam = cameraOf(card);
  if (!cam || cam === "POV_PORTRAIT") return false;
  if (ROAD_CAMERAS.has(cam)) return true;
  if (cam === "POV_OBJECT") {
    return OBJECT_ROAD_RE.test(briefText(brief, ["subject", "foreground", "midground", "background"]));
  }
  return false;
}

function isGeometryRead(read) {
  const t = String(read || "").toLowerCase();
  if (!t) return false;
  return (
    /lane position/.test(t) ||
    /turn geometry/.test(t) ||
    /right-turn path/.test(t) ||
    /left-turn pocket/.test(t) ||
    /\bturn pocket\b/.test(t) ||
    /wheels straight/.test(t) ||
    /right-?of-?way/.test(t) ||
    /\blegal pass\b/.test(t) ||
    /\bpassing\b/.test(t) ||
    /yellow breaks/.test(t) ||
    /solid yellow/.test(t) ||
    /double yellow/.test(t) ||
    /merg(e|ing)\b/.test(t) ||
    /\bparking\b/.test(t) ||
    /road markings?/.test(t) ||
    /centerline/.test(t) ||
    /around the block/.test(t)
  );
}

function camerasForHazard(hazard) {
  switch (hazard) {
    case "behind":
      return ["POV_MIRROR_REAR", "POV_MIRROR_DOOR"];
    case "ahead_same_direction":
      return LEGAL_CAMERAS.filter((c) => c !== "POV_MIRROR_REAR" && c !== "POV_MIRROR_DOOR");
    case "oncoming":
      return ["POV_COCKPIT", "POV_DIAGRAM"];
    case "beside":
      return ["POV_DIAGRAM", "POV_ROADSIDE", "POV_MIRROR_DOOR"];
    case "none":
      return LEGAL_CAMERAS.slice();
    default:
      return null;
  }
}

function geometryClause(geo, driver) {
  if (!geo) return "";
  const front =
    driver === "deac"
      ? "Its front — identified by the van nose and the leading edge of the tall square box — points "
      : "Its front — identified by the black tube bull bar and wide flat plow blade — points ";
  const vehicle = driver === "deac" ? "The gray cutaway shuttle" : "The pink vehicle";
  return (
    "United States road configuration, traffic drives on the right. " +
    `${vehicle} is traveling ` +
    `**${geo.ego_heading}** and occupies the **right half of the roadway** for its direction of travel. ` +
    front +
    `**${geo.ego_nose_in_frame}**. ` +
    `Any oncoming traffic is **${geo.oncoming_position}**. No vehicle faces the wrong way in its lane.`
  );
}

const MIRROR_CLAUSE =
  "The image inside the mirror glass is a reflection of the road BEHIND the vehicle. " +
  "Do not show the road ahead inside the mirror. The view forward through the windshield is not the subject " +
  "and must be dark, defocused, or outside the frame.";

const MIRROR_NEGATIVES =
  "No view of the road ahead inside the mirror, no windshield view as the main subject, " +
  "no mirror reflecting the interior of the cabin.";

const DUTCH_REACH_NEGATIVES =
  "No man, no male driver, no male cyclist, no bare arm without the pink sleeve, " +
  "no cyclist visible through the window ahead.";

function validateGeometry(card) {
  const id = (card && card.card_id) || "(missing card_id)";
  const errors = [];
  const brief = card && card.image_brief;
  if (!brief) {
    errors.push(`${id}: missing image_brief`);
    return errors;
  }

  const cam = brief.camera;
  if (BANNED_CAMERAS.includes(cam)) {
    errors.push(`${id}: camera ${cam} is ambiguous; use a resolved sub-token`);
  } else if (!LEGAL_CAMERAS.includes(cam)) {
    errors.push(`${id}: camera ${JSON.stringify(cam)} is not a legal token`);
  }

  const needsGeo = describesRoadway(card);
  const geo = brief.geometry;
  if (needsGeo) {
    if (!geo || typeof geo !== "object") {
      errors.push(`${id}: image_brief describes a roadway but omits geometry`);
    } else {
      for (const key of GEOMETRY_KEYS) {
        if (geo[key] == null || geo[key] === "") {
          errors.push(`${id}: geometry missing ${key}`);
        }
      }
      if (geo.ego_heading && !HEADINGS.includes(geo.ego_heading)) {
        errors.push(`${id}: geometry.ego_heading ${JSON.stringify(geo.ego_heading)}`);
      }
      if (geo.hazard_position && !HAZARDS.includes(geo.hazard_position)) {
        errors.push(`${id}: geometry.hazard_position ${JSON.stringify(geo.hazard_position)}`);
      }
    }
  }

  const hazard = geo && geo.hazard_position;
  if (hazard === "behind" && FORWARD_CAMERAS.has(cam)) {
    errors.push(`${id}: hazard_position behind cannot use forward camera ${cam}`);
  }
  if (hazard && cam && !BANNED_CAMERAS.includes(cam)) {
    const allowed = camerasForHazard(hazard);
    if (allowed && !allowed.includes(cam)) {
      errors.push(`${id}: camera ${cam} contradicts hazard_position ${hazard}`);
    }
  }

  if (isGeometryRead(brief.read) && cam !== "POV_DIAGRAM") {
    errors.push(`${id}: geometry lesson read requires POV_DIAGRAM, got ${cam}`);
  }

  return errors;
}

module.exports = {
  LEGAL_CAMERAS,
  BANNED_CAMERAS,
  HEADINGS,
  HAZARDS,
  GEOMETRY_KEYS,
  ROAD_CAMERAS,
  FORWARD_CAMERAS,
  cameraOf,
  describesRoadway,
  isGeometryRead,
  camerasForHazard,
  geometryClause,
  MIRROR_CLAUSE,
  MIRROR_NEGATIVES,
  DUTCH_REACH_NEGATIVES,
  validateGeometry,
};
