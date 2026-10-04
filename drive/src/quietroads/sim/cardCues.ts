import { dist } from "./math";
import type { VehicleSample } from "./vehicleObserver";

/**
 * Cards that never had a dialogue `card` node. Each id is offered once per
 * run, on the mission where that skill is actually driven.
 */
const GRID = new Set([
  "mission_delivery_2_catfood",
  "mission_delivery_3_radio",
  "mission_delivery_4_filters",
  "mission_jonah_intersection",
]);

const JONAH = { x: 265, y: 0 };

export interface CueProbe {
  missionId: string;
  s: VehicleSample;
  dt: number;
  skidding: boolean;
  onIce: boolean;
  parkReady: boolean;
  inBus: boolean;
  inLanes: boolean;
  lead: { x: number; y: number } | null;
}

export class CardCues {
  private used = new Set<string>();
  private mission = "";
  private moveT = 0;
  private stoppedT = 0;
  private follows = 0;
  private heldT = 0;

  reset() {
    this.used.clear();
    this.mission = "";
    this.moveT = 0;
    this.stoppedT = 0;
    this.follows = 0;
    this.heldT = 0;
  }

  /** Grade events that already exist. Returns card ids to open. */
  onEvent(mission: string, event: string): string[] {
    const out: string[] = [];
    if (GRID.has(mission)) {
      if (event === "backing.start") this.take("II-015", out);
      if (event === "park.parallel.start") this.take("II-021", out);
      if (event === "lanechange.start") {
        this.take("II-016", out);
        this.take("II-017", out);
        this.take("II-022", out);
      }
      if (event === "input.hard_brake") this.take("II-031", out);
    }
    if (mission === "mission_central_ledger") {
      if (event === "ledger.follow.close") {
        this.follows += 1;
        // II-012 (Three Seconds, Not One) used to be read in the Act V briefing
        // still; it opens here, on the beat it actually teaches.
        this.take("II-012", out);
        if (this.follows === 1) {
          this.take("III-005", out);
          this.take("III-009", out);
        } else this.take("III-010", out);
      }
      if (event === "ledger.crossed_solid") this.take("III-008", out);
      if (event === "ledger.wrong_lane") {
        this.take("III-015", out);
        this.take("III-023", out);
        this.take("III-029", out);
      }
      if (event === "ledger.merge.approach") {
        this.take("III-014", out);
        this.take("III-026", out);
      }
      if (event === "ledger.lanechange.start") this.take("III-027", out);
      if (event === "ledger.lanechange.no_signal" || event === "ledger.lanechange.clean") {
        // III-019 stays; II-006 (Deac's Left Arm) joins it on the signal beat.
        this.take("III-019", out);
        this.take("II-006", out);
      }
      if (event === "waypoint.reach:ledger_end") this.take("III-030", out);
      if (event === "speed.over") this.take("III-024", out);
    }
    if (mission === "mission_ribbon_merge" || mission.startsWith("mission_convoy") || mission.startsWith("convoy_")) {
      if (event === "ramp.enter") {
        this.take("V-002", out);
        this.take("V-004", out);
      }
      if (event === "ribbon.merge" || event === "merge.gap_open" || event === "merge.clean") {
        this.take("V-009", out);
        this.take("V-011", out);
      }
    }
    if (mission === "mission_backcountry_run" || mission === "escort_ritzville") {
      if (event === "rural.shoulder" || event.startsWith("nozone.enter")) this.take("VI-003", out);
      if (event === "rural.crest.fast" || event === "rural.crest.clean" || event === "wide_turn.approach") this.take("VI-005", out);
      if (event === "rural.uncontrolled.yield" || event === "rural.uncontrolled.rolled") this.take("VI-009", out);
      if (event === "rural.crossbuck.clean" || event === "rural.crossbuck.rolled") this.take("VI-011", out);
      if (event === "waypoint.reach:rural_end" || event === "waypoint.reach:ritzville") this.take("VI-013", out);
    }
    if (event === "ice.enter") this.take("II-019", out);
    return out;
  }

  /** Position and time beats for cards whose skill has no separate grade event. */
  step(p: CueProbe): string[] {
    const out: string[] = [];
    if (p.missionId !== this.mission) {
      this.mission = p.missionId;
      this.moveT = 0;
      this.stoppedT = 0;
      this.heldT = 0;
    }
    const v = Math.abs(p.s.speedMs);
    if (v > 0.8) this.moveT += p.dt;
    if (v < 0.3) this.stoppedT += p.dt;
    else this.stoppedT = 0;

    if (GRID.has(p.missionId) && v > 0.8) this.take("II-028", out);
    if (GRID.has(p.missionId) && p.skidding) this.take("II-019", out);
    if (p.missionId === "mission_delivery_3_radio") {
      if (p.inBus) this.take("II-007", out);
      if (this.moveT > 8) this.take("II-008", out);
      if (p.inLanes && v > 12) this.take("II-013", out);
      if (p.inLanes && this.stoppedT > 1.5) this.take("II-023", out);
    }
    if (p.missionId === "mission_jonah_intersection") {
      const d = dist(p.s.pos, JONAH);
      if (d < 22 && v > 4) this.take("II-009", out);
      if (d < 18 && v > 6) this.take("II-014", out);
      if (this.moveT > 4) this.take("II-019", out);
      if (p.s.speedMs < -0.4) this.take("II-029", out);
    }
    if (p.missionId === "mission_delivery_2_catfood" && v > 1) this.take("II-018", out);
    if (p.parkReady) this.take("II-026", out);
    if (p.missionId === "dropoff_pharmacy") this.take("II-011", out);
    if (p.missionId === "straight_night_drive") {
      if (this.moveT > 1 && p.s.beams === "off") this.take("II-020", out);
      if (this.moveT > 2) this.take("II-025", out);
    }

    if (p.missionId === "mission_central_ledger") {
      if (this.moveT > 2 && v > 2) {
        this.take("III-001", out);
        this.take("III-017", out);
        this.take("III-028", out);
      }
      if (p.s.pos.y > 100) this.take("III-013", out);
      if (p.s.pos.y > 120) this.take("III-008", out);
      if (p.s.pos.y > 125) {
        this.take("III-022", out);
        this.take("III-025", out);
        this.take("III-024", out);
      }
      if (p.s.pos.y > 145) this.take("III-021", out);
      if (this.moveT > 6) {
        this.take("III-015", out);
        this.take("III-023", out);
        this.take("III-029", out);
      }
      if (p.lead && v > 2) {
        const gap = dist(p.s.pos, p.lead);
        if (gap < 25 && this.moveT > 4) {
          this.take("III-011", out);
          this.take("III-012", out);
        }
        if (gap >= 8) this.heldT += p.dt;
        else this.heldT = 0;
        if (this.heldT > 2 || this.moveT > 14) this.take("III-018", out);
      }
    }

    if ((p.missionId === "mission_ribbon_merge" || p.missionId.startsWith("convoy") || p.missionId.startsWith("mission_convoy")) && this.moveT > 5) {
      this.take("V-008", out);
    }
    return out;
  }

  private take(id: string, into: string[]) {
    if (this.used.has(id)) return;
    this.used.add(id);
    into.push(id);
  }
}
