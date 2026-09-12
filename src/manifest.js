"use strict";

// Correct-path Act II time_cost sums to 127. Pack must finish with slack in hand.
const COLD_PACK = 130;
const WARMING_SLACK = 10;
const CARGO_BUDGET = COLD_PACK + WARMING_SLACK;

const MANIFESTS = {
  II: {
    run: "The Grid — Kent",
    cargo: "Insulin, cold-packed",
    for: "June — Delridge shelter",
  },
  III: {
    run: "Central — Kent",
    cargo: "Deac's cargo",
    for: "the next drop",
  },
  V: {
    run: "The Ribbon — I-5 / I-90",
    cargo: "Relay kit — repeater, antenna, clamps",
    for: "Tower 4 — valley floor",
  },
};

const FAIL_PLACE = {
  "II-002": "the zone",
  "II-003": "the stop",
  "II-004": "the light",
  "II-005": "the lot",
  "II-006": "the convoy",
  "II-007": "the bus",
  "II-008": "the rattle",
  "II-009": "the tablet",
  "II-010": "the arm",
  "II-012": "the van",
  "II-013": "the triangle",
  "II-014": "the glass",
  "II-015": "the hedge",
  "II-016": "the signal",
  "II-017": "the yellow",
  "II-018": "the dash",
  "II-019": "the lamp",
  "II-020": "the rain",
  "II-021": "the corral",
  "II-022": "the driveway",
  "II-023": "the cut",
  "II-024": "the four-way",
  "II-026": "the door",
  "II-027": "the lamps",
  "II-028": "the belt",
  "II-029": "Willis",
  "II-030": "Willis",
};

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberWord(n) {
  const x = Math.max(0, Math.round(Number(n) || 0));
  if (x < 20) return ONES[x];
  if (x < 100) {
    const t = TENS[Math.floor(x / 10)];
    const o = x % 10;
    return o ? t + "-" + ONES[o] : t;
  }
  return String(x);
}

function coldFrom(state) {
  const time = Number(state && state.time_cost) || 0;
  return Math.max(0, COLD_PACK - time);
}

function warmingFrom(state, cargo) {
  if (coldFrom(state) > 0) return 0;
  return Math.max(0, Math.round(Number(cargo) || 0));
}

function timeCostOf(delta) {
  return Math.max(0, Number(delta && delta.time_cost) || 0);
}

function radioCheckin(prevState, nextState, act) {
  const before = coldFrom(prevState);
  const after = coldFrom(nextState);
  if (act === "V") {
    if (before > 0 && after <= 0) {
      return { who: "yuna", line: "The relay kit is late. Tower 4 still wants it. How far out?" };
    }
    if (before > 30 && after <= 30) {
      return { who: "yuna", line: "Tower 4, checking. How far out?" };
    }
    return null;
  }
  if (before > 0 && after <= 0) {
    return { who: "reyna_solis", line: "Cold pack's sweating. How far out? — R." };
  }
  if (before > 30 && after <= 30) {
    return { who: "reyna_solis", line: "Delridge, checking. June's asking. — R." };
  }
  return null;
}

function failPlace(cardId) {
  return FAIL_PLACE[cardId] || null;
}

function cargoFailDispatch(charges, act) {
  const rows = (charges || [])
    .map((c) => ({
      card_id: c.card_id,
      minutes: Math.max(0, Number(c.minutes != null ? c.minutes : c.time_cost) || 0),
      place: c.place || failPlace(c.card_id),
    }))
    .filter((c) => c.minutes > 0 && c.place);
  if (act === "V") {
    if (!rows.length) return "The relay kit is late. Tower 4 still takes it.";
    const named = rows
      .sort((a, b) => b.minutes - a.minutes || String(a.card_id).localeCompare(String(b.card_id)))
      .slice(0, 2);
    const parts = named.map((c) => {
      const word = numberWord(c.minutes);
      return word.charAt(0).toUpperCase() + word.slice(1) + " at " + c.place + ".";
    });
    parts.push("The kit is late. Tower 4 still takes it.");
    return parts.join(" ");
  }
  if (!rows.length) {
    return "The pack warmed. Delridge is telling June it's tomorrow.";
  }
  const willis = rows.some((c) => c.place === "Willis");
  const named = rows
    .filter((c) => c.place !== "Willis")
    .sort((a, b) => b.minutes - a.minutes || String(a.card_id).localeCompare(String(b.card_id)))
    .slice(0, 2);
  const parts = named.map((c) => {
    const word = numberWord(c.minutes);
    return word.charAt(0).toUpperCase() + word.slice(1) + " at " + c.place + ".";
  });
  parts.push(willis ? "The pack warmed on Willis." : "The pack warmed.");
  parts.push("Delridge is telling June it's tomorrow.");
  return parts.join(" ");
}

function deliveryBeat(stateOrCold, act) {
  const state = stateOrCold && typeof stateOrCold === "object" ? stateOrCold : { time_cost: COLD_PACK - (Number(stateOrCold) || 0) };
  const n = coldFrom(state);
  if (act === "V") {
    if (n <= 0) return "The relay kit is late. Repeater, antenna, clamps. Tower 4 still takes it.";
    if (n >= 10) return "Relay kit delivered. Repeater, antenna, clamps. Tower 4. " + n + " minutes to spare.";
    if (n === 1) return "Relay kit delivered. 1 minute. Repeater, antenna, clamps. Tower 4.";
    return "Relay kit delivered. " + n + " minutes. Repeater, antenna, clamps. Tower 4.";
  }
  if (n <= 0) return "Delivered warm. June took it anyway.";
  if (n >= 10) return "Delivered. " + n + " minutes to spare.";
  if (n === 1) return "Delivered. 1 minute. June didn't ask what took so long.";
  return "Delivered. " + n + " minutes. June didn't ask what took so long.";
}

function manifestFor(act, driverName) {
  const row = MANIFESTS[act] || MANIFESTS.II;
  const name = String(driverName || "").trim();
  return {
    act: MANIFESTS[act] ? act : "II",
    run: row.run,
    cargo: row.cargo,
    for: row.for,
    cold: COLD_PACK,
    driver: name && name !== "Student" ? name : "________",
  };
}

module.exports = {
  COLD_PACK,
  WARMING_SLACK,
  CARGO_BUDGET,
  coldFrom,
  warmingFrom,
  timeCostOf,
  radioCheckin,
  cargoFailDispatch,
  deliveryBeat,
  manifestFor,
  failPlace,
  numberWord,
};
