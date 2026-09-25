/**
 * actChallenges.ts — the alignment layer between the PINK MENACE card acts
 * (I–VI, the source of truth in cards/*.json) and the Quiet Roads drive.
 *
 * The card game owns the story. The drive re-enacts it. This module is the
 * single registry that says, for every card act, what the unique driving
 * challenge is, which ego vehicle is in play, what cargo is on the line, and
 * which drive scenes / sim missions carry that act. Authors edit this file —
 * not the dialogue files — when the campaign and the drive drift apart.
 *
 * Canonical mirrors:
 *   - act zones / order   : src/game.js  ACT_ZONES
 *   - ego vehicle per act : scripts/authoring-seat.js  ACT_DRIVER
 *   - cargo per act       : src/manifest.js  MANIFESTS
 */

export type CardAct = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';
export type DriveEgo = 'ali' | 'deac' | 'yuna';

export interface ActChallenge {
  act: CardAct;
  zone: string;          // canonical zone name (The Lot, The Grid, …)
  title: string;         // what the player sees on the challenge card
  driver: DriveEgo;      // whose cab the player is in (drives the vehicle model)
  vehicle: string;       // canonical ego vehicle description
  cargo: string;         // what's being hauled (matches src/manifest.js)
  missions: string[];    // sim mission ids that carry this act's driving challenge
  objective: string;     // HUD objective line while the challenge is live
  lesson: string;        // one-line teaching target pulled from the card canon
  built: boolean;        // true once a playable challenge ships in Simulation.ts
}

export const ACT_ORDER: CardAct[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** First scene of each act's drive, so the title screen can open that challenge. */
export const ACT_ENTRY: Record<CardAct, string> = {
  I: '0.1',
  II: '2.1',
  III: '2.5',
  IV: '4.1',
  V: '3.1b',
  VI: '6.1b',
  VII: '8.1',
};

export const ACT_CHALLENGES: Record<CardAct, ActChallenge> = {
  I: {
    act: 'I',
    zone: 'The Lot',
    title: 'The Lot',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: 'Nothing yet. Learn the car.',
    missions: [
      'tutorial_carport',
      'mission_dol_drive',
      'minigame_park_dol',
      'stealth_dol_interior',
      'chase_dol_gracie',
    ],
    objective: 'Drive the lot: throttle, brake, steer, park — without waking the Quiet.',
    lesson: 'Vehicle control and parking. The car is a tool; the lot is the first safe place to learn it.',
    built: true,
  },
  II: {
    act: 'II',
    zone: 'The Grid',
    title: 'The Grid',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: 'Insulin, cat food, radio parts, fuel filters',
    missions: [
      'mission_delivery_1_insulin',
      'dropoff_pharmacy',
      'mission_delivery_2_catfood',
      'mission_delivery_3_radio',
      'mission_delivery_4_filters',
      'mission_jonah_intersection',
    ],
    objective: 'Quiet runs across Kent: pharmacy, Bea\'s dock, Priya\'s lane, Tuna\'s parallel, then home past Jonah.',
    lesson: 'City-grid space and stopping: full stops, following distance, school zones, four-ways.',
    built: true,
  },
  III: {
    act: 'III',
    zone: 'Central',
    title: 'Central — Deac\u2019s Cargo',
    driver: 'deac',
    vehicle: 'the Ledger — Deac\u2019s cutaway shuttle, no rear window',
    cargo: "Deac's cargo",
    missions: ['mission_central_ledger'],
    objective: 'Run Central in the Ledger. Sweep the mirrors before every change.',
    lesson: 'Commercial-vehicle awareness: mirror sweeps, merge gaps, lane discipline.',
    built: true,
  },
  IV: {
    act: 'IV',
    zone: 'The Core',
    title: 'The Core — Forty Questions',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: 'Relay kit — repeater, antenna, clamps',
    missions: ['study_terminal', 'exam_40', 'local_loop_week'],
    objective: 'Pass the forty-question gate. Then get the relay kit to the valley floor.',
    lesson: 'The licensing exam is the challenge: knowledge is what clears the road to Tower 4.',
    built: true,
  },
  V: {
    act: 'V',
    zone: 'The Ribbon',
    title: 'The Ribbon — Highway',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: 'Relay kit — repeater, antenna, clamps',
    missions: ['mission_ribbon_merge', 'mission_convoy_issaquah', 'convoy_continue_solo', 'convoy_tow_jonah', 'chainup_qte', 'climb_snoqualmie', 'climb_snoqualmie_from_below_chainup'],
    objective: 'Eyes up the ribbon: match speed before paint, hold your gap, settle into the lane.',
    lesson: 'Highway merging, ramp discipline, and the three-second space on open road.',
    built: true,
  },
  VI: {
    act: 'VI',
    zone: 'The Backcountry',
    title: 'The Backcountry — Rural',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: "Clearance — Deac's clipboard",
    missions: ['mission_backcountry_run', 'straight_night_drive', 'rest_area_pullin', 'rest_area_forced', 'vantage_bridge_crossing', 'bridge_after_sign_toy', 'bridge_after_sign_moth', 'bridge_engine_off_wait', 'escort_ritzville'],
    objective: 'Rural roads: hold the line on soft shoulders, treat the crossbuck like the law.',
    lesson: 'Rural roads and passive rail crossings: sightlines, curves, and the shoulder that lies.',
    built: true,
  },
  VII: {
    act: 'VII',
    zone: 'The Dark Hours',
    title: 'The Dark Hours',
    driver: 'ali',
    vehicle: "the Menace — Grandma's pink Beetle with the plow blade",
    cargo: 'The herd is on the pass. Act VII stays closed.',
    missions: [],
    objective: '',
    lesson: '',
    built: false,
  },
};

/**
 * Drive scene id (e.g. '0.1', '2.3a', '5.2') → card act.
 * Only scenes that exist in the dialogue files today are listed. The mapping is
 * the dominant card act of that scene; a scene may borrow a card from another
 * act without claiming it (see docs/ACT_DRIVE_ALIGNMENT.md for the exceptions).
 */
const SCENE_ACT: Record<string, CardAct> = {
  // Act I — The Lot (tutorial, DOL, parking, stealth interior)
  '0.1': 'I', '0.2': 'I', '0.3': 'I',
  '1.1': 'I', '1.2': 'I', '1.3': 'I', '1.4': 'I', '1.4b': 'I',
  // Act II — The Grid (Kent deliveries)
  '2.1': 'II', '2.2': 'II', '2.3a': 'II', '2.3b': 'II', '2.3c': 'II',
  '2.3d': 'II', '2.4': 'II', '2.5': 'III', '2.6': 'II', '2.7': 'II', '2.8': 'II',
  // Act V — The Ribbon (I-90 Eastbound is the highway leg, Ali in the Menace)
  '3.1': 'V', '3.1b': 'V', '3.2': 'V', '3.3': 'V', '3.4': 'V', '3.4a': 'V', '3.5': 'V',
  // Act IV — The Core (night before, exam, the week after)
  '4.1': 'IV', '4.2': 'IV', '4.3': 'IV',
  // Act V — The Ribbon (climb and chain-up are the mountain grade)
  '5.1': 'V', '5.2': 'V', '5.3': 'V',
  // Act VI — The Backcountry (straight, bridge, Ritzville run)
  '6.1': 'VI', '6.1b': 'VI', '6.2': 'VI', '6.3': 'VI',
  '7.1': 'VI', '7.2': 'VI', '7.3': 'VI',
  // Post-corpus epilogue (Spokane home) — beyond the card acts
  '8.1': 'VII', '8.2': 'VII', '8.3': 'VII',
};

/** sim mission id → card act. Only the missions that actually ship in Simulation.ts. */
const MISSION_ACT: Record<string, CardAct> = {
  tutorial_carport: 'I',
  mission_dol_drive: 'I',
  minigame_park_dol: 'I',
  stealth_dol_interior: 'I',
  chase_dol_gracie: 'I',
  mission_delivery_1_insulin: 'II',
  dropoff_pharmacy: 'II',
  mission_delivery_2_catfood: 'II',
  mission_delivery_3_radio: 'II',
  mission_delivery_4_filters: 'II',
  mission_jonah_intersection: 'II',
  mission_central_ledger: 'III',
  mission_ribbon_merge: 'V',
  mission_convoy_issaquah: 'V',
  convoy_continue_solo: 'V',
  convoy_tow_jonah: 'V',
  chainup_qte: 'V',
  climb_snoqualmie: 'V',
  climb_snoqualmie_from_below_chainup: 'V',
  mission_backcountry_run: 'VI',
  straight_night_drive: 'VI',
  rest_area_pullin: 'VI',
  rest_area_forced: 'VI',
  vantage_bridge_crossing: 'VI',
  bridge_after_sign_toy: 'VI',
  bridge_after_sign_moth: 'VI',
  bridge_engine_off_wait: 'VI',
  escort_ritzville: 'VI',
  study_terminal: 'IV',
  exam_40: 'IV',
  exam_40_resume: 'IV',
  exam_40_finalize: 'IV',
  local_loop_week: 'IV',
};

export function actForScene(sceneId: string): CardAct | null {
  return SCENE_ACT[sceneId] ?? null;
}

export function actForMission(missionId: string): CardAct | null {
  return MISSION_ACT[missionId] ?? null;
}

export function challengeForAct(act: CardAct): ActChallenge {
  return ACT_CHALLENGES[act] ?? ACT_CHALLENGES.I;
}

export function challengeForScene(sceneId: string): ActChallenge | null {
  const act = actForScene(sceneId);
  return act ? challengeForAct(act) : null;
}