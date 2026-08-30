"use strict";

/**
 * Pre-compile seat check. The generator does not reliably track whose cab
 * the player is in. Answer three questions from the JSON before any prompt
 * is assembled:
 *
 *   1. Does the ego vehicle match the act's driver?
 *   2. Is the camera consistent with sitting in it?
 *   3. Does any other vehicle in the brief share the ego's canon marks?
 */

const ACT_DRIVER = {
  I: "ali",
  II: "ali",
  III: "deac",
};

const EGO = {
  ali: {
    name: "the Menace",
    nameRe: /\b(menace|beetle|plow)\b/i,
    marks: [
      { id: "plow blade", re: /\bplow\b/i },
      { id: "pink Beetle body", re: /\bpink\b.{0,24}\bbeetle\b|\bbeetle\b.{0,24}\bpink\b/i },
      { id: "bull bar", re: /\bbull bar\b/i },
      { id: "knobby tires", re: /\bknobby\b/i },
    ],
  },
  deac: {
    name: "the Ledger",
    nameRe: /\b(ledger|cutaway|shuttle)\b/i,
    marks: [
      { id: "cutaway shuttle body", re: /\bcutaway\b/i },
      { id: "amber destination sign", re: /\bdestination sign\b|\bdot-matrix\b/i },
      { id: "roof cargo rack", re: /\broof (cargo )?rack\b/i },
      { id: "west-coast mirror arms", re: /\bwest-coast\b/i },
    ],
  },
  yuna: {
    name: "Encore",
    nameRe: /\bencore\b/i,
    marks: [
      { id: "horn flares", re: /\bhorn flare/i },
      { id: "chevron striping", re: /\bchevron\b/i },
    ],
  },
};

const OTHER_VEHICLE_RE =
  /\b(panel van|cargo van|box truck|cube truck|day-cab|flatbed|stake-bed|pickup|sedan|semi|trailer|coach|mixer|tanker|dump(?: truck)?|primer (?:sedan|car)|white van)\b/i;

const FOLLOWING_SEAT_RE =
  /\bfollowing cab\b|\bfollowing (?:driver|vehicle)'s (?:seat|wheel)\b|a-pillar and a strip of windshield/i;

const FOREIGN_EGO = {
  deac: /\bpink beetle\b|\bplow blade\b/i,
  yuna: /\bpink beetle\b|\bplow blade\b|\bcutaway shuttle\b/i,
};

function briefFields(card) {
  const b = (card && card.image_brief) || {};
  return {
    subject: String(b.subject || ""),
    foreground: String(b.foreground || ""),
    midground: String(b.midground || ""),
    background: String(b.background || ""),
    read: String(b.read || ""),
  };
}

function briefText(fields) {
  return [fields.subject, fields.foreground, fields.midground, fields.background, fields.read].join(" ");
}

function egoOwned(clause, driver) {
  const spec = EGO[driver];
  if (!spec) return false;
  return spec.nameRe.test(clause) || /\b(ego|your cab|the bus you)\b/i.test(clause);
}

function validateAuthoringSeat(card) {
  const id = (card && card.card_id) || "(missing card_id)";
  const errors = [];
  const driver = card && card.driver;
  const act = card && card.act;
  const brief = card && card.image_brief;
  const cam = brief && brief.camera;
  const fields = briefFields(card);
  const text = briefText(fields);

  const locked = ACT_DRIVER[act];
  if (locked && driver && driver !== locked) {
    errors.push(`${id}: driver ${JSON.stringify(driver)} does not match act ${act} ego (${locked})`);
  }

  const spec = EGO[driver];
  const foreign = FOREIGN_EGO[driver];
  if (foreign && foreign.test(text)) {
    errors.push(`${id}: other playable vehicle's canon marks in ${spec ? spec.name : driver}'s act`);
  }

  if (cam === "POV_CHASE" && spec && spec.nameRe.test(fields.subject)) {
    const inFollower = FOLLOWING_SEAT_RE.test(text);
    const lesson = Boolean(brief.camera_is_the_lesson);
    if (inFollower && !lesson) {
      errors.push(
        `${id}: POV_CHASE sits in a following cab while the subject is ${spec.name}; declare camera_is_the_lesson or move the camera into the ego seat`
      );
    }
  }

  if (spec) {
    for (const field of ["subject", "foreground", "midground", "background"]) {
      const clause = fields[field].replace(
        /\bno (?:amber )?destination sign\b|\bno (?:cutaway|dot-matrix|roof (?:cargo )?rack|west-coast|plow|horn flare|chevron|knobby|bull bar)\b/gi,
        ""
      );
      if (!OTHER_VEHICLE_RE.test(clause)) continue;
      if (egoOwned(clause, driver)) continue;
      for (const mark of spec.marks) {
        if (!mark.re.test(clause)) continue;
        const ownedMark =
          new RegExp(`\\b(ledger|menace|encore|ego|your)\\b.{0,40}${mark.re.source}`, "i").test(clause) ||
          new RegExp(`${mark.re.source}.{0,40}\\b(ledger|menace|encore)\\b`, "i").test(clause);
        if (ownedMark) continue;
        errors.push(`${id}: other vehicle in image_brief.${field} shares ${spec.name} mark (${mark.id})`);
      }
    }
  }

  return errors;
}

function assertAuthoringSeat(card) {
  const errors = validateAuthoringSeat(card);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
}

module.exports = {
  ACT_DRIVER,
  EGO,
  validateAuthoringSeat,
  assertAuthoringSeat,
};
