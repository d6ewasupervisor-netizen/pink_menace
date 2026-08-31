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
const TRAFFIC_LANES = ["left_of_ego", "right_of_ego", "same_as_ego"];
const TRAFFIC_ALONG = ["ahead", "beside", "behind"];
const SAME_DIRECTION_HAZARDS = new Set(["ahead_same_direction", "beside", "behind"]);
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

function camerasForHazard(hazard, driver) {
  switch (hazard) {
    case "behind":
      if (driver === "deac") return ["POV_MIRROR_DOOR"];
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

function lanePhrase(lane) {
  switch (lane) {
    case "left_of_ego":
      return "the lane to the LEFT of the ego vehicle";
    case "right_of_ego":
      return "the lane to the RIGHT of the ego vehicle";
    case "same_as_ego":
      return "the same lane as the ego vehicle";
    default:
      return lane;
  }
}

function alongPhrase(along, lengths) {
  if (along === "beside") return "beside it";
  const n = Number(lengths);
  const unit = n === 1 ? "vehicle length" : "vehicle lengths";
  if (along === "ahead") return `ahead of it by ${n} ${unit}`;
  return `behind it by ${n} ${unit}`;
}

function trafficPositionsClause(geo, driver) {
  const rows = geo && geo.traffic_positions;
  if (!Array.isArray(rows) || !rows.length) return "";
  const ego = driver === "deac" ? "the gray cutaway shuttle" : "the pink vehicle";
  const bits = rows.map((r) => {
    return (
      `${r.vehicle} is in ${lanePhrase(r.lane)} and is ${alongPhrase(r.along, r.lengths)}, ` +
      `relative to ${ego}.`
    );
  });
  return (
    "United States road configuration. Passing occurs on the LEFT. " +
    bits.join(" ") +
    " No same-direction vehicle occupies a lane other than the one stated."
  );
}

function needsTrafficPositions(card) {
  const cam = cameraOf(card);
  const hazard = card && card.image_brief && card.image_brief.geometry && card.image_brief.geometry.hazard_position;
  return (
    card &&
    card.driver === "deac" &&
    (cam === "POV_DIAGRAM" || cam === "POV_ROADSIDE") &&
    SAME_DIRECTION_HAZARDS.has(hazard)
  );
}

const MIRROR_CLAUSE =
  "The image inside the mirror glass is a reflection of the road BEHIND the vehicle. " +
  "Do not show the road ahead inside the mirror. The view forward through the windshield is not the subject " +
  "and must be dark, defocused, or outside the frame.";

const DOOR_MIRROR_CLAUSE =
  "Camera stays inside the cab. The door-mirror glass shows what is beside and behind, not the road ahead. " +
  "Foreground is the seat, the window frame, and the door-mirror housing. " +
  "Do not stand outside the vehicle. Do not shoot the mirror from behind the box.";

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

  if (card.driver === "deac" && cam === "POV_MIRROR_REAR") {
    errors.push(
      `${id}: POV_MIRROR_REAR is illegal on the Ledger (no rear window, no interior mirror); use POV_MIRROR_DOOR`
    );
  }

  const hazard = geo && geo.hazard_position;
  if (hazard === "behind" && FORWARD_CAMERAS.has(cam)) {
    errors.push(`${id}: hazard_position behind cannot use forward camera ${cam}`);
  }
  if (hazard && cam && !BANNED_CAMERAS.includes(cam)) {
    const allowed = camerasForHazard(hazard, card.driver);
    if (allowed && !allowed.includes(cam)) {
      errors.push(`${id}: camera ${cam} contradicts hazard_position ${hazard}`);
    }
  }

  if (isGeometryRead(brief.read) && cam !== "POV_DIAGRAM") {
    errors.push(`${id}: geometry lesson read requires POV_DIAGRAM, got ${cam}`);
  }

  if (needsTrafficPositions(card)) {
    const rows = geo && geo.traffic_positions;
    if (!Array.isArray(rows) || rows.length < 1) {
      errors.push(
        `${id}: same-direction traffic on a Deac diagram/roadside frame requires geometry.traffic_positions`
      );
    } else {
      rows.forEach((row, i) => {
        if (!row || typeof row !== "object") {
          errors.push(`${id}: traffic_positions[${i}] is not an object`);
          return;
        }
        if (!row.vehicle) errors.push(`${id}: traffic_positions[${i}] missing vehicle`);
        if (!TRAFFIC_LANES.includes(row.lane)) {
          errors.push(`${id}: traffic_positions[${i}].lane ${JSON.stringify(row.lane)}`);
        }
        if (!TRAFFIC_ALONG.includes(row.along)) {
          errors.push(`${id}: traffic_positions[${i}].along ${JSON.stringify(row.along)}`);
        }
        if (typeof row.lengths !== "number" || row.lengths < 0) {
          errors.push(`${id}: traffic_positions[${i}].lengths ${JSON.stringify(row.lengths)}`);
        }
        if (row.along === "beside" && row.lengths !== 0) {
          errors.push(`${id}: traffic_positions[${i}] beside must use lengths 0`);
        }
        if ((row.along === "ahead" || row.along === "behind") && !(row.lengths > 0)) {
          errors.push(`${id}: traffic_positions[${i}] ${row.along} requires lengths > 0`);
        }
      });
    }
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
  trafficPositionsClause,
  needsTrafficPositions,
  TRAFFIC_LANES,
  TRAFFIC_ALONG,
  MIRROR_CLAUSE,
  DOOR_MIRROR_CLAUSE,
  MIRROR_NEGATIVES,
  DUTCH_REACH_NEGATIVES,
  validateGeometry,
};
