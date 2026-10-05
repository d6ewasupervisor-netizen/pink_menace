import { dist } from "./math";
import type { VehicleSample } from "./vehicleObserver";

/**
 * Cards that never had a dialogue `card` node. Each id is offered once per run,
 * on the mission where that skill is actually driven.
 *
 * The rule this file follows: a cue opens on the beat that PRACTICES the card, and
 * on nothing else. Every `onEvent` key below is a real event the graders already
 * fire (or, for the Ledger, one they now fire deliberately). No cue opens on a
 * duration, a distance travelled, or a bare coordinate — a drive that never does
 * the skill must never see the card. `test/teaching.test.ts` steps the sim for
 * each id and asserts both halves of that.
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
  /** Read-only view of the ids this run has already opened. Test seam. */
  get usedIds(): ReadonlySet<string> { return this.used; }
  private mission = "";
  private moveT = 0;
  private stoppedT = 0;
  private follows = 0;

  reset() {
    this.used.clear();
    this.mission = "";
    this.moveT = 0;
    this.stoppedT = 0;
    this.follows = 0;
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
      // Every Act III card below opens on the beat that practices it. None of
      // them is on a timer or a bare y coordinate any more — see LedgerRun.
      if (event === "ledger.follow.start") {
        // The follow beat BEGINS here: the van you cannot see, the truck on your
        // bumper, and the three-second gap are all about holding this space.
        this.take("II-012", out);
        this.take("III-005", out);
        this.take("III-009", out);
      }
      if (event === "ledger.follow.close") {
        this.follows += 1;
        // The "too close" result stays on the grade event, where the grader put it.
        this.take("III-010", out);
      }
      if (event === "ledger.alongside") {
        this.take("III-011", out);   // see his mirrors or leave (§4.4)
        this.take("III-012", out);   // do not live beside (§4.4)
      }
      if (event === "ledger.pass.clear") this.take("III-018", out);   // §5.2 whole front in glass
      if (event === "ledger.wet.enter") {
        this.take("III-024", out);   // §5.6 slow for the water
        this.take("III-025", out);   // what he sees at the edge
      }
      if (event === "ledger.rumble.ride") this.take("III-028", out);   // §2.5 soft rear tyre
      if (event === "ledger.crossed_solid") this.take("III-008", out);
      if (event === "ledger.wrong_lane") {
        this.take("III-015", out);
        this.take("III-023", out);
        this.take("III-029", out);
      }
      if (event === "ledger.merge.approach") {
        this.take("III-014", out);
        this.take("III-026", out);
        this.take("III-007", out);   // §5.3 count the gap first
      }
      if (event === "deac.merge.late") {
        // III-013 "Twenty-Six, None Preventable": Deac took one merge late and
        // never wrote a preventable. The late merge IS the beat — and it is
        // *his*, not the player's. This used to hang off `ledger.merge.slow`,
        // which is the PLAYER rolling onto the ramp under 12 mph; the comment
        // claimed Deac's merge while the code listened to someone else's, so the
        // card opened on a beat it was not written about and stayed shut through
        // the late merge it was written about. See LedgerRun.trackDeac.
        this.take("III-013", out);
      }
      if (event === "ledger.lanechange.start") {
        this.take("III-027", out);   // §5.5 the tablet wakes
        this.take("III-001", out);   // §4.10 your wheel
        this.take("III-017", out);   // §2.5 the side mirror points up
        this.take("III-021", out);   // §4.3 a transit box off the shelter route
        this.take("III-022", out);   // §4.9 siren first
      }
      if (event === "ledger.lanechange.no_signal" || event === "ledger.lanechange.clean") {
        // III-019 stays; II-006 (Deac's Left Arm) joins it on the signal beat.
        this.take("III-019", out);
        this.take("II-006", out);
      }
      if (event === "waypoint.reach:ledger_end") this.take("III-030", out);
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
      // VI-003 opens on the gravel EDGE while the car is still on the road. It used
      // to open on `rural.shoulder` / `nozone.enter`, i.e. only after leaving the
      // pavement — the card arrived after the mistake it warns about.
      if (event === "rural.edge") this.take("VI-003", out);
      if (event === "rural.crest.fast" || event === "rural.crest.clean" || event === "wide_turn.approach") this.take("VI-005", out);
      if (event === "rural.uncontrolled.yield" || event === "rural.uncontrolled.rolled") this.take("VI-009", out);
      if (event === "rural.crossbuck.clean" || event === "rural.crossbuck.rolled") this.take("VI-011", out);
      if (event === "waypoint.reach:rural_end" || event === "waypoint.reach:ritzville") this.take("VI-013", out);
    }
    if (event === "ice.enter") this.take("II-019", out);
    if (event === "dropoff.walk") this.take("II-026", out);
    return out;
  }

  /** Position and time beats for cards whose skill has no separate grade event. */
  step(p: CueProbe): string[] {
    const out: string[] = [];
    if (p.missionId !== this.mission) {
      this.mission = p.missionId;
      this.moveT = 0;
      this.stoppedT = 0;
    }
    const v = Math.abs(p.s.speedMs);
    if (v > 0.8) this.moveT += p.dt;
    if (v < 0.3) this.stoppedT += p.dt;
    else this.stoppedT = 0;

    if (GRID.has(p.missionId) && v > 0.8) this.take("II-028", out);
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
      // II-029 is the drive-around-the-block: it opens on a REVERSE, not a timer.
      if (p.s.speedMs < -0.4) this.take("II-029", out);
    }
    if (p.missionId === "mission_delivery_2_catfood" && v > 1) this.take("II-018", out);
    if (p.missionId === "dropoff_pharmacy") this.take("II-011", out);
    if (p.missionId === "straight_night_drive") {
      if (this.moveT > 1 && p.s.beams === "off") this.take("II-020", out);
      // II-025 is a back-out: it opens when she actually selects reverse and backs.
      if (p.s.speedMs < -0.3) this.take("II-025", out);
    }

    // II-019 is the ice card (§5.6). It opened after 4 s of motion at Jonah's
    // four-way — a dry timer on a dry road. It now opens on the ice itself.
    if (p.onIce) this.take("II-019", out);

    // II-026 is the door-zone card (§4.6, look before the door). It opened the
    // moment the back-in graded; it now opens when she is out of the car and the
    // door meets traffic — the `dropoff.walk` beat above.

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
