import { type Vec2, dist, rectHas, rng, MPH } from "./math";
import { NoiseSystem } from "./noise";
import { QuietField, QuietState } from "./quiet";
import { ZoneField } from "./zones";
import { VehicleObserver, VEHICLE, type VehicleSample, type ObserverOut } from "./vehicleObserver";
import { buildKentMap, type WorldMap } from "./kentMap";
import { ParkingGrader, InteriorController, type WalkerInput } from "./dol";
import { PharmacyDropoff } from "./pharmacy";
import { GridRun, stallCenter, type GridMission } from "./grid";
import { LedgerRun } from "./ledger";
import { RibbonRun } from "./ribbon";
import { RuralRun } from "./rural";
import { ConvoyRun, type ConvoyMission } from "./convoy";
import { ChainupRun } from "./chainup";
import { ClimbRun } from "./climb";
import { EscortRun } from "./escort";
import { BeatRun, type BeatMission } from "./beats";
import { CardCues, type CueProbe } from "./cardCues";
import { RetestWeek, retestPlan, type RetestPlan } from "./retestWeek";
import type { NoiseZone } from "./noise";

export type MissionId =
  | "tutorial_carport" | "mission_dol_drive"
  | "minigame_park_dol" | "stealth_dol_interior" | "chase_dol_gracie"
  | "mission_delivery_1_insulin" | "dropoff_pharmacy"
  | "mission_delivery_2_catfood" | "mission_delivery_3_radio"
  | "mission_delivery_4_filters" | "mission_jonah_intersection"
  | "mission_central_ledger"
  | "mission_ribbon_merge"
  | "mission_convoy_issaquah" | "convoy_continue_solo" | "convoy_tow_jonah"
  | "mission_backcountry_run"
  | "chainup_qte"
  | "climb_snoqualmie" | "climb_snoqualmie_from_below_chainup"
  | "escort_ritzville"
  | "local_loop_week"
  | BeatMission;

export type PlayerMode = "vehicle" | "walker";

export interface SimEvents {
  /** Game events for the DialogueRunner (dlg.onEvent) and telemetry. */
  fire: (event: string, data?: Record<string, unknown>) => void;
  requestQuiz: (trigger: string, delayS: number) => void;
  setObjective: (text: string) => void;
  toast: (text: string) => void;
  /** The sim wants the car placed here (mission start, soft-fail reset). */
  placeVehicle: (pos: Vec2, heading: number) => void;
}

export interface SimFrame extends ObserverOut {
  mode: PlayerMode;
  speedMph: number;
  speedLimitMph: number;
  noiseDb: number;
  noiseBand: 0 | 1 | 2;
  hearingRadiusM: number;   // how far the current noise level carries above the floor
  frozen: boolean;
  objective: string;
}

/**
 * One object the R3F scene talks to. Per frame:
 *   const f = sim.step(dt, sampleFromYourCar());
 * then render sim.quiet.list, f.stoppingM (shadow), f.noiseBand (meter), etc.
 */
export class Simulation {
  map: WorldMap;
  noise: NoiseSystem;
  quiet: QuietField;
  zones: ZoneField;
  vehicle: VehicleObserver;
  parking: ParkingGrader;
  interior: InteriorController;
  dropoff = new PharmacyDropoff();
  grid: GridRun;
  ledger: LedgerRun;
  ribbon: RibbonRun;
  convoy: ConvoyRun;
  rural: RuralRun;
  chainup: ChainupRun;
  climb: ClimbRun;
  escort: EscortRun;
  beats: BeatRun;
  private egoHalfLen = VEHICLE.LENGTH_M / 2;
  private egoHalfWid = VEHICLE.WIDTH_M / 2;
  mode: PlayerMode = "vehicle";
  speedLimitMph = 25;
  missionId: MissionId | "" = "";
  private missionStart: keyof WorldMap["starts"] = "carport";
  tutorialForgiving = false;
  /** Set by the 1.3 honk branch: she escapes the lot, per the script. Cleared at the driveway. */
  escapeForgiving = false;
  objective = "";
  private freezeReasons = new Set<string>();
  // tutorial state
  private tutStep = 0; private tutT = 0; private tutBlockEnd = false;
  private deliverySmoothFired = false;
  private lastVehicleHeading = 0;
  /** On-foot handoff. Pharmacy is June's clipboard; Bea is the sanctuary door. */
  private footDropoff: "" | "pharmacy" | "bea" = "";
  private cues = new CardCues();
  private retest = new RetestWeek();
  private pendingRetest: RetestPlan | null = null;
  // ── P13: per-step scratch. The physics step runs 60×/s, so the objects it used
  // to build every tick (the ObserverOut fallback, the SimFrame it returns, the
  // CueProbe it hands the card book, the `blocked` closure, and the zone-field's
  // copy of the last position) are created once and refilled instead.
  private readonly frozenFrame: ObserverOut = { skidding: false, stoppingM: 0, lateralG: 0 };
  private readonly frame: SimFrame = {
    ...this.frozenFrame, mode: "vehicle", speedMph: 0, speedLimitMph: 0, noiseDb: 20,
    noiseBand: 0, hearingRadiusM: 0, frozen: false, objective: "",
  };
  private readonly cue: CueProbe = {
    missionId: "", s: { pos: { x: 0, y: 0 }, heading: 0, speedMs: 0, throttle: 0, brake: 0, steer: 0, horn: false },
    dt: 0, skidding: false, onIce: false, parkReady: false, inBus: false, inLanes: false, lead: null,
  };
  private readonly blockedAt = (p: Vec2) => this.blocked(p);

  /** The Act IV week reads the exam before the mission starts. */
  armRetest(plan: RetestPlan) { this.pendingRetest = plan; }

  resetCardCues() { this.cues.reset(); }

  constructor(private ev: SimEvents, seed = 7) {
    this.map = buildKentMap(seed);
    const fire = (e: string, d?: Record<string, unknown>) => {
      this.ev.fire(e, d);
      if (e.startsWith("card.cue:")) return;
      this.emitCues(this.cues.onEvent(this.missionId, e));
      this.retest.note(e, d);
    };
    this.noise = new NoiseSystem(fire);
    // Forgiving: the carport tutorial, and the scripted dash back to the car after the chase —
    // the script says she makes it; the doorway fills *after*.
    this.quiet = new QuietField({ fire, softFail: () => this.softFail() },
      () => this.tutorialForgiving || this.escapeForgiving || (this.mode === "walker" && this.interior.phase === "to_car"));
    const r = rng(seed + 1);
    for (const p of this.map.quietSpawns) this.quiet.spawn(p, r);
    for (const p of this.map.dol.quietSpawns) this.quiet.spawn(p, r, "dol_interior");
    this.noise.setListeners(this.quiet.list);
    this.zones = new ZoneField(this.map.zones, {
      fire,
      requestQuiz: (t, d) => this.ev.requestQuiz(t, d),
      setSpeedLimit: (mph) => { this.speedLimitMph = mph; },
    });
    this.vehicle = new VehicleObserver(this.noise, fire);
    const dolEv = { fire, setObjective: (t: string) => this.setObjective(t) };
    this.parking = new ParkingGrader(this.map, dolEv);
    this.interior = new InteriorController(this.map, this.noise, this.quiet, dolEv, r);
    this.grid = new GridRun(this.map, {
      fire,
      requestQuiz: (t, delay) => this.ev.requestQuiz(t, delay),
    }, this.quiet);
    this.ledger = new LedgerRun(this.map.ledger, { fire });
    this.ribbon = new RibbonRun(this.map.ribbon, { fire });
    this.convoy = new ConvoyRun(this.map.ribbon, this.map.markers.stall_point, this.map.markers.issaquah, { fire });
    this.rural = new RuralRun(this.map.rural, { fire, requestQuiz: (t) => this.ev.requestQuiz(t, 0) });
    this.chainup = new ChainupRun(this.map.chainPad, { fire });
    this.climb = new ClimbRun(this.map.ice, this.map.markers.chainup, { fire });
    this.escort = new EscortRun({ fire });
    this.beats = new BeatRun(
      this.map.restStall,
      this.map.markers.rest_area,
      { mid: this.map.markers.bridge_mid, end: this.map.markers.bridge_end },
      { fire },
    );
  }

  /** Where the player currently is, for noise attribution and the Quiet. */
  get playerPos(): Vec2 { return this.mode === "walker" ? this.walker.pos : (this.hasLastPos ? this.lastPos : this.map.starts.carport.pos); }
  get playerZone(): NoiseZone { return this.mode === "walker" && !this.footDropoff ? this.interior.zone : "outdoor"; }
  /** On-foot pose the renderer/HUD read. Pharmacy and Bea are outdoor; DOL uses the interior. */
  get walker() {
    if (this.footDropoff) {
      return {
        pos: this.dropoff.pos,
        facing: this.dropoff.facing,
        speed: this.dropoff.speed,
        carriers: { mya: false, gracie: false },
        gracie: { pos: this.dropoff.pos, loose: false },
        qte: null as { deadline: number } | null,
      };
    }
    return this.interior;
  }
  /** Owned copy of the last car position — never aliases the caller's sample object (P13). */
  private readonly lastPos: Vec2 = { x: 0, y: 0 };
  private hasLastPos = false;

  /** Record the car's position without retaining the caller's sample. */
  private notePos(p: Vec2) {
    this.lastPos.x = p.x; this.lastPos.y = p.y; this.hasLastPos = true;
  }

  get frozen() { return this.freezeReasons.size > 0; }
  freeze(reason: string) { this.freezeReasons.add(reason); }
  unfreeze(reason: string) { this.freezeReasons.delete(reason); }

  /** True if a point is inside a building or off the map. R3F should use this for the car too, or Rapier. */
  blocked(p: Vec2): boolean {
    if (!rectHas(this.map.bounds, p)) return true;
    for (const b of this.map.buildings) if (rectHas(b.rect, p)) return true;
    return false;
  }

  startMission(id: MissionId): boolean {
    this.tutStep = 0; this.tutT = 0; this.tutBlockEnd = false;
    this.footDropoff = "";
    this.grid.clear();
    this.ledger.clear();
    this.ribbon.clear();
    this.convoy.clear();
    this.rural.clear();
    this.chainup.clear();
    this.climb.clear();
    this.escort.clear();
    this.beats.clear();
    this.retest.clear();
    this.egoHalfLen = VEHICLE.LENGTH_M / 2;
    this.egoHalfWid = VEHICLE.WIDTH_M / 2;
    switch (id) {
      case "tutorial_carport":
        this.missionId = id; this.mode = "vehicle"; this.missionStart = "carport";
        this.tutorialForgiving = true; this.zones.quizzesEnabled = false;
        this.setObjective("End of the block and back. Quietly.");
        this.resetWorld();
        break;
      case "mission_dol_drive":
        this.missionId = id; this.mode = "vehicle"; this.missionStart = "carport";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = true;
        this.setObjective("Kent DOL: east on Titus, right on Central, all the way south.");
        this.resetWorld();
        break;
      case "minigame_park_dol":
        this.missionId = id; this.mode = "vehicle"; this.missionStart = "dol_lot_entry";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.parking.reset();
        this.setObjective("Pull into the marked space. Straight. Slow. No curb.");
        this.resetWorld(false);   // keep the Quiet where they are; she just drove up
        break;
      case "stealth_dol_interior":
        this.missionId = id; this.mode = "walker"; this.missionStart = "dol_stall";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.interior.reset();
        this.interior.setCar(this.map.starts.dol_stall.pos);
        this.ev.placeVehicle(this.map.starts.dol_stall.pos, this.map.starts.dol_stall.heading);
        this.setObjective("Find the test terminal. Walk soft.");
        break;
      case "chase_dol_gracie":
        // continues the interior mission — same controller, next phase
        this.missionId = id; this.mode = "walker";
        this.interior.beginChase();
        break;
      case "mission_delivery_1_insulin":
        this.missionId = id; this.mode = "vehicle"; this.missionStart = "warehouse";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.deliverySmoothFired = false;
        this.setObjective("Pharmacy safehouse on Meeker. Keep it quiet.");
        this.resetWorld();
        break;
      case "dropoff_pharmacy":
        this.missionId = id; this.mode = "walker"; this.footDropoff = "pharmacy";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.dropoff.reset(this.hasLastPos ? this.lastPos : this.map.markers.pharmacy, this.lastVehicleHeading);
        this.setObjective("Clipboard. Insulin. Don't slam the door.");
        break;
      case "mission_delivery_2_catfood":
        this.beginGrid(id, "bea_alley", "Cat food. Back into Bea's dock. Then the door.");
        break;
      case "mission_delivery_3_radio":
        this.beginGrid(id, "priya_west", "Priya's shack. East lane. Signal before you move.");
        break;
      case "mission_delivery_4_filters":
        this.beginGrid(id, "tuna_approach", "Filters. Parallel at Tuna's dock.");
        break;
      case "mission_jonah_intersection":
        this.beginGrid(id, "jonah_meeker", "Milk run home. Don't match Jonah.");
        break;
      case "mission_central_ledger":
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = "ledger_south";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.ledger.reset();
        this.egoHalfLen = 3.5; this.egoHalfWid = 1.1;   // cutaway shuttle: ~7 m long, ~2.2 m wide
        this.setObjective("Central in the Ledger. Stay right, signal every move. Leave at least twice the Ledger's length behind Deac — count three seconds off a mark to hold it.");
        this.resetWorld();
        break;
      case "mission_ribbon_merge":
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = "ribbon_ramp";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.ribbon.reset();
        this.setObjective("On-ramp to the Ribbon. Eyes up, match the flow, signal, take the gap.");
        this.resetWorld();
        this.speedLimitMph = this.map.ribbon.flowMph;   // the highway, not the grid
        break;
      case "mission_convoy_issaquah":
        this.beginConvoy(id, "convoy_ramp", "I-90 east. Match them on the ramp. Leave at least twice your vehicle's length — count three seconds off a mark. Stall is ahead.");
        break;
      case "convoy_continue_solo":
        this.beginConvoy(id, "convoy_stall", "Issaquah. Cargo makes the window.");
        break;
      case "convoy_tow_jonah":
        this.beginConvoy(id, "convoy_stall", "Tow Jonah. Ease onto the ramp. Issaquah.");
        break;
      case "mission_backcountry_run":
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = "rural_start";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.rural.reset();
        this.setObjective("Gravel. Hold the line off the soft edge, slow for the crest, yield the four-way, treat the crossbuck like the law.");
        this.resetWorld();
        this.speedLimitMph = 40;   // backcountry gravel
        break;
      case "chainup_qte":
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = "chainup_pullout";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.chainup.reset();
        this.setObjective("Tighten. Don't drop it.");
        this.resetWorld();
        this.speedLimitMph = 15;
        break;
      case "climb_snoqualmie":
        this.beginClimb(id, "climb_foot");
        break;
      case "climb_snoqualmie_from_below_chainup":
        this.beginClimb(id, "climb_below");
        break;
      case "escort_ritzville":
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = "escort_start";
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        this.escort.reset(this.map.markers.hank, this.map.markers.hankTo, this.map.markers.ritzville);
        this.setObjective("Leave at least twice the truck's length behind Hank — count four seconds off a mark to hold it. Out of his mirrors. Ritzville.");
        this.resetWorld();
        this.speedLimitMph = 55;
        break;
      case "straight_night_drive":
        this.beginBeat(id, "night_start", "Night straight. Rest area is ahead.", 55);
        break;
      case "rest_area_pullin":
      case "rest_area_forced":
        this.beginBeat(id, "rest_stall", "Pull in. Stop.", 25);
        break;
      case "vantage_bridge_crossing":
        this.beginBeat(id, "bridge_west", "Cross the bridge. Under 45. When the wind pushes, steer into it — small.", 45);
        break;
      case "bridge_after_sign_toy":
        this.beginBeat(id, "bridge_mid_start", "Stay under 9 mph until it settles. Then the far side.", 25);
        break;
      case "bridge_after_sign_moth":
        this.beginBeat(id, "bridge_mid_start", "Keep rolling, above 18 mph. Don't creep.", 25);
        break;
      case "bridge_engine_off_wait":
        this.beginBeat(id, "bridge_mid_start", "Engine off. Sit still. 60s, then the far side.", 25);
        break;
      case "local_loop_week": {
        const plan = this.pendingRetest ?? retestPlan(0, []);
        this.pendingRetest = null;
        this.retest.begin(plan);
        this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
        this.missionStart = plan.start;
        this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
        if (plan.kind === "gap") this.ledger.reset();
        this.setObjective(plan.objective);
        this.resetWorld();
        this.speedLimitMph = plan.limitMph;
        break;
      }
      default: return false;
    }
    this.ev.fire(`mission.start:${id}`);
    return true;
  }

  private beginClimb(id: "climb_snoqualmie" | "climb_snoqualmie_from_below_chainup", start: keyof WorldMap["starts"]) {
    this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
    this.missionStart = start;
    this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
    this.climb.reset();
    this.setObjective("Thirty-five. Nothing sudden. Chain-up is at the top.");
    this.resetWorld();
    this.speedLimitMph = 35;
  }

  private beginBeat(id: BeatMission, start: keyof WorldMap["starts"], objective: string, limit: number) {
    this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
    this.missionStart = start;
    this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
    this.beats.reset(id);
    this.setObjective(this.beats.goal() ?? objective);
    this.resetWorld();
    this.speedLimitMph = limit;
  }

  private beginConvoy(id: ConvoyMission, start: keyof WorldMap["starts"], objective: string) {
    this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
    this.missionStart = start;
    this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
    this.convoy.reset(id);
    this.setObjective(objective);
    this.resetWorld();
    this.speedLimitMph = 70;
  }

  private beginGrid(id: GridMission, start: keyof WorldMap["starts"], objective: string) {
    this.missionId = id; this.mode = "vehicle"; this.footDropoff = "";
    this.missionStart = start;
    this.tutorialForgiving = false; this.zones.quizzesEnabled = false;
    this.grid.reset(id);
    this.setObjective(objective);
    this.resetWorld();
  }

  /** Hand control back to the car (after beetle_driver_seat). */
  enterVehicle() { this.mode = "vehicle"; }

  private setObjective(t: string) { this.objective = t; this.ev.setObjective(t); }

  private emitCues(ids: string[]) {
    for (const id of ids) this.ev.fire(`card.cue:${id}`);
  }

  private cueProbe(s: VehicleSample, dt: number): CueProbe {
    const lanes = this.missionId === "mission_central_ledger" ? this.map.ledger.lanes : this.map.grid.lanes;
    const p = s.pos;
    const q = this.cue;
    q.missionId = this.missionId;
    q.s = s;
    q.dt = dt;
    q.skidding = this.vehicle.skidding;
    q.onIce = this.climb.onIce;
    q.parkReady = !!this.grid.parkGrade;
    q.inBus = rectHas(this.map.grid.bus, p);
    q.inLanes = p.x >= lanes.x0 && p.x <= lanes.x1 && p.y >= lanes.y0 && p.y <= lanes.y1;
    q.lead = this.ledger.mission ? this.ledger.leadPos : this.ribbon.mission ? this.ribbon.leadPos : this.escort.mission ? this.escort.leadPos : null;
    return q;
  }

  private resetWorld(resetQuiet = true) {
    const s = this.map.starts[this.missionStart];
    this.notePos(s.pos);
    this.lastVehicleHeading = s.heading;
    this.ev.placeVehicle(s.pos, s.heading);
    if (resetQuiet) this.quiet.reset();
    this.noise.reset(); this.zones.reset(); this.vehicle.reset();
    this.speedLimitMph = 25;
  }

  softFail() {
    this.ev.fire("mission.fail.swarm", { mission: this.missionId });
    if (this.footDropoff) {
      this.ev.toast("Swarmed. Back to the car. Try again.");
      this.dropoff.reset(this.hasLastPos ? this.lastPos : this.handoffPoint(), this.lastVehicleHeading);
      if (this.footDropoff === "bea" && this.grid.parkGrade) this.dropoff.completeEvent = this.grid.parkGrade;
      this.noise.reset();
      this.setObjective(this.footDropoff === "bea" ? "Bag to the door. Don't slam it." : "Clipboard. Insulin. Don't slam the door.");
    } else if (this.mode === "walker") {
      this.ev.toast("Swarmed. Out the door. Try again.");
      this.interior.reset();
      this.noise.reset();
      this.setObjective("Find the test terminal. Walk soft.");
    } else {
      this.ev.toast("Swarmed. Cargo's gone. Back to the start.");
      this.resetWorld();
      if (this.missionId === "mission_central_ledger") this.ledger.reset();
      if (this.missionId === "mission_ribbon_merge") { this.ribbon.reset(); this.speedLimitMph = this.map.ribbon.flowMph; }
      if (this.missionId === "mission_convoy_issaquah" || this.missionId === "convoy_continue_solo" || this.missionId === "convoy_tow_jonah") {
        this.convoy.reset(this.missionId);
        this.speedLimitMph = 70;
      }
      if (this.missionId === "mission_backcountry_run") { this.rural.reset(); this.speedLimitMph = 40; }
      if (this.missionId === "chainup_qte") { this.chainup.reset(); this.speedLimitMph = 15; }
      if (this.missionId === "climb_snoqualmie" || this.missionId === "climb_snoqualmie_from_below_chainup") {
        this.climb.reset();
        this.speedLimitMph = 35;
      }
      if (this.missionId === "escort_ritzville") {
        this.escort.reset(this.map.markers.hank, this.map.markers.hankTo, this.map.markers.ritzville);
        this.speedLimitMph = 55;
      }
      if (this.beats.mission && this.missionId === this.beats.mission) this.beats.reset(this.beats.mission);
    }
  }

  /** Surface friction for the current road. Ice on the climb, gravel on the
   *  backcountry run and the Ritzville escort (they share the gravel corridor),
   *  wet on the south half of Central (the rain stretch III-024 teaches),
   *  dry asphalt everywhere else. The stopping shadow and the brake pedal both
   *  read `vehicle.mu`, so this is the single place stopping lengthens on a bad
   *  surface (guide §5.6 slippery roads, §4.15 paved-from-unpaved). */
  private surfaceMu(): number {
    if (this.climb.mission && this.climb.onIce) return VEHICLE.MU.ice;
    if (this.missionId === "mission_backcountry_run" || this.missionId === "escort_ritzville") return VEHICLE.MU.gravel;
    if (this.missionId === "mission_central_ledger" && this.lastPos.y > this.map.ledger.solidY) return VEHICLE.MU.wet;
    return VEHICLE.MU.dry;
  }

  /** Advance the world with the player in the car. Returns everything the HUD/renderer needs. */
  step(dt: number, s: VehicleSample): SimFrame {
    this.notePos(s.pos);
    this.lastVehicleHeading = s.heading;
    let out: ObserverOut = this.frozenFrame;
    out.skidding = this.vehicle.skidding; out.stoppingM = 0; out.lateralG = 0;
    if (!this.frozen && this.mode === "vehicle") {
      out = this.vehicle.step(dt, s, this.speedLimitMph);
      this.noise.step(dt);
      this.zones.step(dt, s.pos, s.speedMs);
      this.quiet.step(dt, s.pos, this.blockedAt);
      const hit = this.quiet.collide(s.pos, s.heading, this.egoHalfLen, this.egoHalfWid, s.speedMs);
      // P9: a contact is the one thing that legitimately eats displacement, so
      // tell the CCD check to stand down for this step.
      if (hit) this.vehicle.noteContact();
      if (hit === "plow") { this.noise.emitKind("collision_plow", s.pos); this.ev.fire("plow.used"); }
      else if (hit === "soft") this.noise.emitKind("collision_soft", s.pos);
      if (this.missionId === "tutorial_carport") this.tutorialTick(dt, s);
      if (this.missionId === "minigame_park_dol") this.parking.step(dt, s);
      if (this.missionId === "mission_delivery_1_insulin") this.deliveryTick(s);
      if (this.missionId === "mission_central_ledger") this.ledger.step(dt, s);
      if (this.missionId === "mission_ribbon_merge") this.ribbon.step(dt, s);
      if (this.missionId === "mission_backcountry_run") this.rural.step(dt, s);
      if (this.chainup.mission) this.chainup.step(dt, s);
      if (this.climb.mission) this.climb.step(dt, s);
      this.vehicle.mu = this.surfaceMu();
      if (this.escort.mission) this.escort.step(dt, s);
      if (this.beats.mission) {
        this.beats.step(dt, s);
        const goal = this.beats.goal();
        if (goal && goal !== this.objective) this.setObjective(goal);
      }
      if (this.convoy.mission) this.convoy.step(dt, s, this.noise.band);
      if (this.grid.mission) {
        this.grid.step(dt, s, this.noise.band);
        if (this.grid.parkGrade && this.missionId === "mission_delivery_2_catfood" && !this.footDropoff) {
          this.footDropoff = "bea";
          this.mode = "walker";
          this.dropoff.reset(s.pos, s.heading);
          this.dropoff.completeEvent = this.grid.parkGrade;
          this.setObjective("Bag to the door. Don't slam it.");
          this.ev.fire("dropoff.walk");
        }
      }
      if (this.retest.active) {
        const hint = this.retest.hint();
        if (hint && hint !== this.objective) this.setObjective(hint);
        const lead = this.ledger.mission ? this.ledger.leadPos : null;
        if (this.retest.step(dt, s, this.map, lead)) this.ev.fire("week.elapsed");
      }
      this.emitCues(this.cues.step(this.cueProbe(s, dt)));
    }
    const f = this.frame;
    f.skidding = out.skidding; f.stoppingM = out.stoppingM; f.lateralG = out.lateralG;
    f.mode = this.mode;
    f.speedMph = Math.abs(s.speedMs) / MPH;
    f.speedLimitMph = this.speedLimitMph;
    f.noiseDb = this.noise.levelDb;
    f.noiseBand = this.noise.band;
    f.hearingRadiusM = NoiseSystem.hearingRadius(this.noise.levelDb);
    f.frozen = this.frozen;
    f.objective = this.objective;
    return f;
  }

  /** Advance the world with the player on foot (1.3). */
  stepWalker(dt: number, input: WalkerInput): SimFrame {
    if (!this.frozen && this.mode === "walker") {
      if (this.footDropoff) {
        this.dropoff.step(dt, input, (p) => this.blocked(p), this.handoffPoint(), this.ev);
        this.noise.step(dt);
        this.quiet.step(dt, this.dropoff.pos, (p) => this.blocked(p));
        if (this.footDropoff === "pharmacy") {
          this.emitCues(this.cues.step(this.cueProbe({
            pos: this.dropoff.pos, heading: 0, speedMs: 0, throttle: 0, brake: 0, steer: 0, horn: false,
          }, dt)));
        }
      } else {
        this.interior.step(dt, input);
        this.noise.step(dt);
        this.quiet.step(dt, this.interior.pos, (p) => this.blocked(p) || (rectHas(this.map.dol.floor, p) && !this.interior.walkable(p)), this.interior.zone);
      }
    }
    const f = this.frame;
    f.mode = this.mode;
    f.skidding = false; f.stoppingM = 0; f.lateralG = 0;
    f.speedMph = this.walker.speed / MPH;
    f.speedLimitMph = 0;
    f.noiseDb = this.noise.levelDb;
    f.noiseBand = this.noise.band;
    f.hearingRadiusM = NoiseSystem.hearingRadius(this.noise.levelDb);
    f.frozen = this.frozen;
    f.objective = this.objective;
    return f;
  }

  /** Game events that the sim itself reacts to (route these from your event bus). */
  onEvent(name: string) {
    if (this.missionId === "tutorial_carport" && name === "waypoint.reach:block_end") {
      this.tutBlockEnd = true;
      this.setObjective("Now back to the carport. Same speed, same care.");
    }
    if (name === "waypoint.reach:titus_fourway") this.ev.fire("intersection.fourway.approach");
    if (name === "waypoint.reach:willis_uncontrolled") this.ev.fire("intersection.uncontrolled.approach");
    if (this.missionId === "mission_delivery_1_insulin" && name === "waypoint.reach:pharmacy") {
      this.setObjective("Park it. Insulin to the clipboard.");
    }
    if (name === "waypoint.reach:titus_fourway") this.grid.onFourWay();
    if (this.missionId === "mission_delivery_3_radio" && name === "waypoint.reach:priya_radio_shack") {
      this.setObjective("Capacitors to Priya.");
    }
    if (this.missionId === "mission_jonah_intersection" && name === "waypoint.reach:warehouse") {
      this.setObjective("Warehouse. Deac's in the hall.");
    }
  }

  private handoffPoint() {
    return this.footDropoff === "bea" ? this.map.markers.bea_door : this.map.markers.clipboard;
  }

  private deliveryTick(s: VehicleSample) {
    if (this.deliverySmoothFired) return;
    if (s.brake < 0.22 || s.brake > 0.72) return;
    if (Math.abs(s.speedMs) < 2.2) return;
    if (!this.quiet.list.some((q) => dist(q.pos, s.pos) < 9)) return;
    this.deliverySmoothFired = true;
    this.ev.fire("brake.smooth_near_quiet");
  }

  /** Speed multiplier the car should apply when hit by a collision (R3F applies it to its own velocity). */
  static collisionSpeedFactor(kind: "plow" | "soft" | "static"): number {
    return kind === "plow" ? 0.85 : kind === "soft" ? 0.6 : 0.25;
  }

  private tutorialTick(dt: number, s: VehicleSample) {
    this.tutT += dt;
    const v = Math.abs(s.speedMs) / MPH;
    const next = (evt: string) => { this.ev.fire(evt); this.tutStep++; this.tutT = 0; };
    switch (this.tutStep) {
      case 0: if (this.tutT > 1.2) next("tutorial.step.throttle"); break;
      case 1: if (v > 3 && this.tutT > 2.5) next("tutorial.step.stopping_shadow"); break;
      case 2: if (this.tutT > 4.5) next("tutorial.step.noise_meter"); break;
      case 3: if (this.tutT > 4.5) next("tutorial.step.brake"); break;
      case 4: if (this.tutT > 4.5) next("tutorial.step.objective"); break;
      case 5:
        if (this.tutBlockEnd && s.pos.x < 30 && v < 1) {
          this.tutStep = 6; this.missionId = ""; this.tutorialForgiving = false; this.setObjective("");
          this.ev.fire("tutorial.complete", { red_events: this.noise.redEvents });
        }
        break;
    }
  }

  /** Current GPS pin — street destination for the active mission. */
  navTarget(): { pos: Vec2; label: string } | null {
    switch (this.missionId) {
      case "tutorial_carport":
        return this.tutBlockEnd
          ? { pos: this.map.starts.carport.pos, label: "CARPORT" }
          : { pos: { x: 250, y: 0 }, label: "END OF BLOCK" };
      case "mission_dol_drive":
        return { pos: this.map.markers.dol_lot, label: "DOL" };
      case "minigame_park_dol": {
        const stall = this.map.parking.stalls[this.map.parking.target];
        return { pos: { x: stall.x + stall.w / 2, y: stall.y + stall.h / 2 }, label: "STALL" };
      }
      case "stealth_dol_interior":
        return this.interior.phase === "to_car" || this.interior.phase === "done"
          ? { pos: this.map.starts.dol_stall.pos, label: "BEETLE" }
          : { pos: this.map.dol.terminal, label: "TERMINAL" };
      case "chase_dol_gracie":
        return this.interior.gracie.loose
          ? { pos: this.interior.gracie.pos, label: "GRACIE" }
          : { pos: this.map.starts.dol_stall.pos, label: "BEETLE" };
      case "mission_delivery_1_insulin":
        return { pos: this.map.markers.pharmacy, label: "PHARMACY" };
      case "dropoff_pharmacy":
        return { pos: this.map.markers.clipboard, label: "CLIPBOARD" };
      case "mission_delivery_2_catfood":
        return this.footDropoff === "bea"
          ? { pos: this.map.markers.bea_door, label: "DOOR" }
          : { pos: stallCenter(this.map.grid.beaStall), label: "BEA" };
      case "mission_delivery_3_radio":
        return { pos: this.map.markers.priya, label: "PRIYA" };
      case "mission_delivery_4_filters":
        return { pos: this.map.markers.tuna, label: "TUNA" };
      case "mission_jonah_intersection":
        return { pos: this.map.markers.warehouse_dock, label: "WAREHOUSE" };
      case "local_loop_week":
        if (this.retest.plan?.kind === "gap" && this.ledger.mission) return { pos: this.ledger.leadPos, label: "TRUCK" };
        return this.retest.pin(this.map);
      case "mission_central_ledger":
        return { pos: this.ledger.leadPos, label: "DEAC'S TRUCK" };
      case "mission_ribbon_merge":
        return { pos: this.ribbon.leadPos, label: "FLOW" };
      case "mission_convoy_issaquah":
        return this.convoy.leadPos.y < this.map.markers.stall_point.y - 20
          ? { pos: this.convoy.leadPos, label: "CONVOY" }
          : { pos: this.map.markers.stall_point, label: "STALL" };
      case "convoy_continue_solo":
      case "convoy_tow_jonah":
        return { pos: this.map.markers.issaquah, label: "ISSAQUAH" };
      case "mission_backcountry_run":
        return { pos: this.map.rural.end, label: "CLEARANCE" };
      case "chainup_qte":
        return { pos: this.map.markers.chainup, label: "CHAINS" };
      case "climb_snoqualmie":
      case "climb_snoqualmie_from_below_chainup":
        return { pos: this.map.markers.chainup, label: "CHAIN-UP" };
      case "escort_ritzville":
        return this.escort.leadPos.x < this.map.markers.ritzville.x - 30
          ? { pos: this.escort.leadPos, label: "HANK" }
          : { pos: this.map.markers.ritzville, label: "RITZVILLE" };
      case "straight_night_drive":
      case "rest_area_pullin":
      case "rest_area_forced":
        return { pos: this.map.markers.rest_area, label: "REST" };
      case "vantage_bridge_crossing":
        return { pos: this.map.markers.bridge_mid, label: "BRIDGE" };
      case "bridge_after_sign_toy":
      case "bridge_after_sign_moth":
        return { pos: this.map.markers.bridge_end, label: "FAR SIDE" };
      case "bridge_engine_off_wait":
        if (this.beats.waitingOutTheBridge()) return null;
        return { pos: this.map.markers.bridge_end, label: "FAR SIDE" };
      default:
        return null;
    }
  }

  /** Counts for the HUD / dashboard. */
  quietSummary() {
    const c = { dormant: 0, curious: 0, alert: 0, swarm: 0 };
    for (const q of this.quiet.list) if (q.zone === this.playerZone) c[(["dormant", "curious", "alert", "swarm"] as const)[q.state]]++;
    return c;
  }
}

export { QuietState };
