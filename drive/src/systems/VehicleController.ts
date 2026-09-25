/**
 * VehicleController — Arcade vehicle physics with engine simulation
 *
 * Forward speed is tracked as a module-level number. Each frame we compute
 * the desired velocity and use setLinvel so Rapier's collision solver can
 * handle contacts with world geometry (buildings, barriers, curbs) naturally.
 * Rapier also handles gravity and ground contact.
 *
 * The car collider's friction MUST be 0 so road-surface contacts don't
 * fight our programmatic speed.
 */
import { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '@/stores/gameStore';

// ─── Engine parameters ───────────────────────────────────────────────────────
const IDLE_RPM = 800;
const REDLINE_RPM = 7000;
const PEAK_TORQUE_RPM = 3500;
const PEAK_TORQUE_NM = 350;
const GEAR_RATIOS = [0, 3.5, 2.1, 1.4, 1.0, 0.8, 0.65];
const FINAL_DRIVE = 1.63;
const WHEEL_RADIUS = 0.35;
const WHEELBASE = 1.8;

const UPSHIFT_RPM = 6500;
const DOWNSHIFT_RPM = 1800;

const MAX_BRAKE_DECEL = 8.0;
let driveBrakeDecel = MAX_BRAKE_DECEL;

/** The bridge sets this from chassis + surface so the pedal matches the stopping shadow. */
export function setDriveBrakeDecel(mps2: number) { driveBrakeDecel = Math.max(0.5, mps2); }

const AERO_DRAG_COEFF = 0.5;
const ROLLING_RESISTANCE_N = 200;

const MAX_REVERSE_MPH = 15;
const REVERSE_ACCEL = 1.2;

const VEHICLE_MASS = 1400;
const MAX_DRIVE_ACCEL = 9.81 * 0.45 * 0.8;

// Smoothing — eliminates surging from abrupt throttle / gear changes
const THROTTLE_SMOOTH_UP = 3.5;
const THROTTLE_SMOOTH_DOWN = 5.0;
const ACCEL_SMOOTH_RATE = 10.0;

// ─── Quiet Roads (Kent) pedal profile ────────────────────────────────────────
// Pads and keys are binary, so the *ramp* is the pedal. A tap on the gas is a
// gentle 0.2–0.3; holding it for a second and a quarter is full throttle. Same
// idea for the brake: a tap is a squeeze, holding is a stop. The car is also a
// heavy old Beetle here: 0.2 g of drive instead of 0.36 g, and slower surge
// smoothing so shifts don't shove.
const KENT_THROTTLE_UP = 0.8;      // 1/s → full in 1.25 s
const KENT_THROTTLE_DOWN = 4.0;
const KENT_BRAKE_UP = 1.6;         // 1/s → full in 0.6 s (a panic stop is still available)
const KENT_BRAKE_DOWN = 6.0;
const KENT_MAX_DRIVE_ACCEL = 9.81 * 0.2;
const KENT_ACCEL_SMOOTH_RATE = 6.0;
const HIGHWAY_BRAKE_UP = 12.0;     // effectively instant, as before
const HIGHWAY_BRAKE_DOWN = 12.0;
const LATERAL_DAMP_RATE = 5.0;
const LATERAL_DAMP_STRAIGHT = 18.0;
const YAW_CENTER_RATE = 20.0;
const STEER_DEADZONE = 0.06;
const COLLISION_SPEED_DROP = 3.0; // m/s — only blend speed after real impacts
const COLLISION_SPEED_BLEND = 0.6;

const MPH_TO_MS = 0.44704;
const MILEAGE_BATCH = 0.1;
const METERS_PER_MILE = 400;
const FUEL_PER_BATCH = 0.08;

// ─── Module-level state ──────────────────────────────────────────────────────
let mileageAccumulator = 0;
let currentSpeed = 0;
let smoothedThrottle = 0;
let smoothedBrake = 0;
let smoothedAccel = 0;

let _lateralSlip = 0;
let _brakeSlip = 0;
let _isAnyWheelSlipping = false;

// Highway chassis — OpenC1-style bicycle: rear grip falls on the handbrake,
// hits add slide and yaw, the shell pitches and rolls for the camera.
let slideSpeed = 0;
let yawRate = 0;
let handbrakeAmount = 0;
let chassisPitch = 0;
let chassisRoll = 0;
let _damage01 = 0;
let _impactFlash = 0;
let _damageCut = 0;
const _car = { fx: 0, fz: -1, rx: 1, rz: 0 };

export function getSlipState() {
  return {
    lateralSlip: _lateralSlip,
    brakeSlip: _brakeSlip,
    isSlipping: _isAnyWheelSlipping,
    slipAmount: Math.min(1, Math.max(_lateralSlip, _brakeSlip) * 3),
  };
}

/** Visual suspension + wreck state. Safe to read every frame. */
export function getChassisPose() {
  return {
    pitch: chassisPitch,
    roll: chassisRoll,
    handbrake: handbrakeAmount,
    damage: _damage01,
    impact: _impactFlash,
  };
}

/**
 * Momentum hit. `nx, nz` point from the car toward the thing it struck.
 * `closing` is how fast the car is approaching along that normal (m/s).
 */
export function applyWreckImpact(nx: number, nz: number, closing: number): void {
  if (useGameStore.getState().worldMode === 'kent') {
    currentSpeed *= 0.55;
    return;
  }
  const approach = Math.max(0, closing);
  const severity = Math.min(1, approach / 20);
  const intoNose = _car.fx * nx + _car.fz * nz;
  const intoSide = _car.rx * nx + _car.rz * nz;
  currentSpeed -= intoNose * approach * 0.42;
  slideSpeed += intoSide * approach * 0.55;
  // Front-corner hits yaw the nose away; rear-corner hits yaw it toward.
  yawRate -= intoSide * intoNose * (2.2 + severity * 3.5);
  slideSpeed = THREE.MathUtils.clamp(slideSpeed, -16, 16);
  yawRate = THREE.MathUtils.clamp(yawRate, -3.2, 3.2);
  _impactFlash = Math.max(_impactFlash, 0.35 + severity * 0.65);
  _lateralSlip = Math.max(_lateralSlip, severity);
}

const engine = { rpm: IDLE_RPM, gear: 1, throttle: 0 };

/** Called by CollisionSystem to simulate impact with an NPC. */
export function applyCollisionImpact(factor: number): void {
  currentSpeed *= 1 - factor;
}

// ─── Quiet Roads hooks (read-only observation + teleport; never drives the car) ───
let _body: RapierRigidBody | null = null;

/** Vehicle.tsx registers its RigidBody so missions can place the car. */
export function registerVehicleBody(body: RapierRigidBody | null): void {
  _body = body;
}

/** Signed forward speed in m/s (negative = reversing). */
export function getCurrentSpeedMs(): number {
  return _hold ? _hold.speed : currentSpeed;
}

/** Measured sideways slip ratio (|lateral v| / |forward v|) from the last tick. */
export function getLateralSlip(): number {
  return _lateralSlip;
}

/** The pedals as the car actually feels them (after the ramp), 0..1 each. */
export function getSmoothedPedals(): { throttle: number; brake: number } {
  return { throttle: smoothedThrottle, brake: smoothedBrake };
}

/** Bring the car to a dead stop (cutscenes, quizzes). */
export function haltVehicle(): void {
  currentSpeed = 0;
  slideSpeed = 0;
  yawRate = 0;
  handbrakeAmount = 0;
  smoothedAccel = 0;
  smoothedThrottle = 0;
  smoothedBrake = 0;
  if (_body) {
    _body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    _body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  // Zero the store's displayed speed so wheel spin stops immediately
  // even though tickVehicle won't run while phase !== 'driving'.
  useGameStore.getState().setVelocityMph(0);
}

/** Multiply forward speed (collision response from the Quiet / static geometry). */
export function scaleCurrentSpeed(factor: number): void {
  currentSpeed *= factor;
}

/**
 * Place the car at world (x, z) facing `headingCore` (radians, 0 = +X, measured toward +Z).
 * Converts to the game's forward = -Z convention.
 */
export function teleportVehicle(x: number, z: number, headingCore: number): void {
  if (!_body) return;
  resetVehicleController();
  // forward vector in XZ from core heading
  const fx = Math.cos(headingCore), fz = Math.sin(headingCore);
  // Rapier body forward is -Z rotated by yaw: (-sin yaw, -cos yaw) → yaw = atan2(-fx, -fz)
  const yaw = Math.atan2(-fx, -fz);
  _body.setTranslation({ x, y: 0.5, z }, true);
  _body.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true);
  _body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  _body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  useGameStore.getState().setVehiclePosition([x, 0.5, z]);
  useGameStore.getState().setVehicleHeading(yaw);
}

// ─── Engine helpers ──────────────────────────────────────────────────────────

function getTorqueMultiplier(rpm: number): number {
  if (rpm < PEAK_TORQUE_RPM) {
    return 0.6 + 0.4 * (rpm / PEAK_TORQUE_RPM);
  }
  const x = (rpm - PEAK_TORQUE_RPM) / (REDLINE_RPM - PEAK_TORQUE_RPM);
  return Math.max(0.15, 1.0 - 0.6 * x * x);
}

function rpmFromSpeed(speedMs: number, gear: number): number {
  if (gear <= 0) return IDLE_RPM;
  const wheelRPS = Math.abs(speedMs) / WHEEL_RADIUS;
  const engineRPM = wheelRPS * GEAR_RATIOS[gear] * FINAL_DRIVE * 60;
  return Math.max(IDLE_RPM, Math.min(engineRPM, REDLINE_RPM));
}

function autoShift(rpm: number, gear: number): number {
  if (rpm > UPSHIFT_RPM && gear < 6) return gear + 1;
  if (rpm < DOWNSHIFT_RPM && gear > 1) return gear - 1;
  return gear;
}

function getDriveAccel(throttle: number, rpm: number, gear: number): number {
  if (gear <= 0 || throttle <= 0) return 0;
  const torqueNm = PEAK_TORQUE_NM * getTorqueMultiplier(rpm) * throttle;
  const wheelTorqueNm = torqueNm * GEAR_RATIOS[gear] * FINAL_DRIVE;
  const driveForceN = wheelTorqueNm / WHEEL_RADIUS;
  const accel = driveForceN / VEHICLE_MASS;
  return Math.min(accel, MAX_DRIVE_ACCEL);
}

export function getSlipRatio(wheelAngularVel: number, contactVel: number, radius: number): number {
  const ws = wheelAngularVel * radius;
  return (ws - contactVel) / Math.max(Math.abs(contactVel), 0.1);
}
export function getPacejkaForce(slip: number, normal: number, mu: number): number {
  const D = mu * normal;
  return D * Math.sin(1.9 * Math.atan(10 * slip - 0.97 * (10 * slip - Math.atan(10 * slip))));
}

// ─── Question hold / restore ─────────────────────────────────────────────────
// A quiz or in-world card freezes the car in place. The snapshot is the whole
// moment: speed, pedal ramp, heading, spin, and where the body sat, so the
// answer puts the car back on the same line it was driving.
type DriveSnap = {
  speed: number;
  throttle: number;
  brake: number;
  accel: number;
  rpm: number;
  gear: number;
  heading: number;
  mph: number;
  timeOfDay: string;
  pos: { x: number; y: number; z: number };
  rot: { x: number; y: number; z: number; w: number };
  linvel: { x: number; y: number; z: number };
  angvel: { x: number; y: number; z: number };
  slide: number;
  yaw: number;
};

let _hold: DriveSnap | null = null;
let _blendGrace = 0;

/**
 * Capture the car and then stop it. A second call while a hold is active
 * does nothing, so a later halt can't overwrite the real moment with zeros.
 */
export function holdDrive(): void {
  if (_hold) return;
  const store = useGameStore.getState();
  const t = _body?.translation();
  const r = _body?.rotation();
  const lv = _body?.linvel();
  const av = _body?.angvel();
  const [px, py, pz] = store.vehiclePosition;
  _hold = {
    speed: currentSpeed,
    throttle: smoothedThrottle,
    brake: smoothedBrake,
    accel: smoothedAccel,
    rpm: engine.rpm,
    gear: engine.gear,
    heading: store.vehicleHeading,
    mph: Math.round(Math.abs(currentSpeed) / MPH_TO_MS),
    timeOfDay: store.timeOfDay,
    pos: t ? { x: t.x, y: t.y, z: t.z } : { x: px, y: py, z: pz },
    rot: r ? { x: r.x, y: r.y, z: r.z, w: r.w } : { x: 0, y: 0, z: 0, w: 1 },
    linvel: lv ? { x: lv.x, y: lv.y, z: lv.z } : { x: 0, y: 0, z: 0 },
    angvel: av ? { x: av.x, y: av.y, z: av.z } : { x: 0, y: 0, z: 0 },
    slide: slideSpeed,
    yaw: yawRate,
  };
  haltVehicle();
}

/** Put the held moment back on the body. No-op if nothing is held. */
export function releaseDrive(): void {
  const snap = _hold;
  if (!snap) return;
  _hold = null;
  _blendGrace = 3;
  currentSpeed = snap.speed;
  slideSpeed = snap.slide;
  yawRate = snap.yaw;
  smoothedThrottle = snap.throttle;
  smoothedBrake = snap.brake;
  smoothedAccel = snap.accel;
  engine.rpm = snap.rpm;
  engine.gear = snap.gear;
  engine.throttle = snap.throttle;
  const store = useGameStore.getState();
  store.setVehiclePosition([snap.pos.x, snap.pos.y, snap.pos.z]);
  store.setVehicleHeading(snap.heading);
  store.setVelocityMph(snap.mph);
  store.setEngineRPM(Math.round(snap.rpm));
  store.setEngineGear(snap.gear);
  store.setEngineSpeed(snap.mph);
  if (store.timeOfDay !== snap.timeOfDay) useGameStore.setState({ timeOfDay: snap.timeOfDay as typeof store.timeOfDay });
  if (_body) {
    _body.setTranslation(snap.pos, true);
    _body.setRotation(snap.rot, true);
    _body.setLinvel(snap.linvel, true);
    _body.setAngvel(snap.angvel, true);
  }
}

/** Drop a hold without moving the car (game over during a question). */
export function discardDriveHold(): void {
  _hold = null;
}

/** @deprecated Use holdDrive. Kept so older call sites still freeze the right moment. */
export function saveAndHalt(): void {
  holdDrive();
}

/** @deprecated Use releaseDrive. */
export function resumeSpeed(): void {
  releaseDrive();
}

/**
 * Highway chassis. A bicycle model with PhysX-style tire clamps:
 * rear lateral grip lerps from a planted 1.15 down toward 0.58 while the
 * handbrake is in (OpenC1's rear extremum 1.9 → 1.05), and brake torque
 * scrubs speed so the tail can step out instead of the car just stopping.
 */
function stepWreckChassis(
  dt: number,
  steerInput: number,
  handbrakeHeld: boolean,
): void {
  const targetHb = handbrakeHeld ? 1 : 0;
  handbrakeAmount += (targetHb - handbrakeAmount) * Math.min(1, 12 * dt);

  if (_damage01 > 0.4 && _damageCut <= 0 && Math.random() < _damage01 * dt * 1.4) {
    _damageCut = _damage01 * 0.45;
  }
  if (_damageCut > 0) {
    _damageCut -= dt;
    currentSpeed *= Math.max(0, 1 - 2.2 * dt);
  }

  const speed = currentSpeed;
  const absSpd = Math.abs(speed);
  const muScale = 1 - _damage01 * 0.28;
  const g = 9.81;
  // OpenC1 rear lateral extremum: planted 1.9, handbrake 1.05.
  const rearMu = THREE.MathUtils.lerp(1.15, 0.42, handbrakeAmount) * muScale;

  const maxSteer = THREE.MathUtils.lerp(0.5, 0.1, Math.min(absSpd / 30, 1));
  const steerAngle = steerInput * maxSteer;

  if (absSpd < 0.8) {
    slideSpeed *= Math.max(0, 1 - 8 * dt);
    yawRate *= Math.max(0, 1 - 8 * dt);
    _lateralSlip *= Math.max(0, 1 - 6 * dt);
  } else {
    // Yaw the tires can actually hold. Anything past that becomes a slide
    // instead of a radius the car cannot make.
    const gripYaw = (rearMu * g) / Math.max(absSpd, 1);
    const askedYaw = -(speed * Math.tan(steerAngle)) / WHEELBASE;
    const heldYaw = THREE.MathUtils.clamp(askedYaw, -gripYaw, gripYaw);
    const unpaid = askedYaw - heldYaw;
    // Planted: the car only yaws what the tires paid for, and pushes wide.
    // Handbrake: the unpaid yaw becomes a spin and the slide stays out.
    const targetYaw = heldYaw + unpaid * handbrakeAmount * 1.15;
    yawRate += (targetYaw - yawRate) * Math.min(1, (handbrakeAmount > 0.4 ? 7 : 4) * dt);

    slideSpeed += unpaid * speed * (0.15 + handbrakeAmount) * dt;
    const pull = handbrakeAmount > 0.35 ? 1.15 : 3.2;
    slideSpeed *= Math.max(0, 1 - pull * dt);

    _lateralSlip = Math.min(
      1.5,
      Math.abs(slideSpeed) / Math.max(4, absSpd) + (handbrakeAmount > 0.3 ? Math.abs(unpaid) * 0.5 : 0),
    );
  }

  if (handbrakeAmount > 0.05 && absSpd > 0.3) {
    currentSpeed -= Math.sign(currentSpeed) * 6.5 * handbrakeAmount * dt;
  }
  if (Math.abs(slideSpeed) > 2) {
    currentSpeed -= Math.sign(currentSpeed) * Math.abs(slideSpeed) * 0.22 * dt;
  }

  slideSpeed = THREE.MathUtils.clamp(slideSpeed, -16, 16);
  yawRate = THREE.MathUtils.clamp(yawRate, -3.2, 3.2);
  if (!Number.isFinite(slideSpeed)) slideSpeed = 0;
  if (!Number.isFinite(yawRate)) yawRate = 0;

  _brakeSlip = handbrakeAmount > 0.45 && absSpd > 4 ? 0.7 : smoothedBrake > 0.3 ? 0.22 : 0;
  _isAnyWheelSlipping = _lateralSlip > 0.16 || (handbrakeAmount > 0.5 && absSpd > 6);

  const longAccel = smoothedAccel;
  const latHint = slideSpeed * 0.35 + yawRate * absSpd * 0.15;
  const targetPitch = THREE.MathUtils.clamp(-longAccel * 0.014, -0.09, 0.11);
  const targetRoll = THREE.MathUtils.clamp(latHint * 0.045, -0.16, 0.16);
  chassisPitch += (targetPitch - chassisPitch) * Math.min(1, 7 * dt);
  chassisRoll += (targetRoll - chassisRoll) * Math.min(1, 9 * dt);
}

// ─── Main tick ───────────────────────────────────────────────────────────────
export function tickVehicle(
  body: RapierRigidBody,
  delta: number,
  _world?: any,
  _rapier?: any,
): void {
  const store = useGameStore.getState();
  const { steering, throttle: throttleInput, brake: brakeInput, phase, emergencyBrake } = store;

  if (phase !== 'driving') {
    // A question pins the body to the pose it had when the prompt opened,
    // so gravity and contacts can't yaw it while the player is reading.
    if (_hold && (phase === 'quiz' || phase === 'card')) {
      body.setTranslation(_hold.pos, true);
      body.setRotation(_hold.rot, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }
    // Kill any residual Rapier velocity so the car doesn't coast while paused,
    // in a cutscene, or walking. linearDamping is 0, so without this the body
    // keeps rolling indefinitely after the last setLinvel call.
    const lv = body.linvel();
    if (Math.abs(lv.x) + Math.abs(lv.z) > 0.001) {
      body.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    return;
  }

  const dt = Math.min(delta, 0.05);

  // ── Orientation ────────────────────────────────────────────────────────
  const rot = body.rotation();
  const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
  if (quat.lengthSq() < 1e-6) quat.set(0, 0, 0, 1);
  else quat.normalize();

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize();
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize();
  _car.fx = forward.x;
  _car.fz = forward.z;
  _car.rx = right.x;
  _car.rz = right.z;

  // ── Read back actual velocity — captures collision responses from Rapier ──
  const linvel = body.linvel();
  const actualForwardSpeed = forward.x * linvel.x + forward.z * linvel.z;
  const lateralSpeed = right.x * linvel.x + right.z * linvel.z;

  if (_blendGrace > 0) _blendGrace -= 1;
  else if (actualForwardSpeed < currentSpeed - COLLISION_SPEED_DROP) {
    currentSpeed = THREE.MathUtils.lerp(
      currentSpeed,
      actualForwardSpeed,
      COLLISION_SPEED_BLEND,
    );
  }

  _lateralSlip = Math.abs(lateralSpeed) / Math.max(1, Math.abs(currentSpeed));
  _brakeSlip = smoothedBrake > 0.1 ? smoothedBrake * (Math.abs(currentSpeed) > 2 ? 0.5 : 0) : 0;
  _isAnyWheelSlipping = _lateralSlip > 0.1 || _brakeSlip > 0.2;

  // ── Smooth pedal inputs (profile by world) ────────────────────────────
  const kent = store.worldMode === 'kent';
  _damage01 = kent ? 0 : 1 - Math.max(0, Math.min(100, store.hp)) / 100;
  const thUp = kent ? KENT_THROTTLE_UP : THROTTLE_SMOOTH_UP;
  const thDown = kent ? KENT_THROTTLE_DOWN : THROTTLE_SMOOTH_DOWN;
  const brUp = kent ? KENT_BRAKE_UP : HIGHWAY_BRAKE_UP;
  const brDown = kent ? KENT_BRAKE_DOWN : HIGHWAY_BRAKE_DOWN;
  if (throttleInput > smoothedThrottle) {
    smoothedThrottle = Math.min(throttleInput, smoothedThrottle + thUp * dt);
  } else {
    smoothedThrottle = Math.max(throttleInput, smoothedThrottle - thDown * dt);
  }
  if (brakeInput > smoothedBrake) {
    smoothedBrake = Math.min(brakeInput, smoothedBrake + brUp * dt);
  } else {
    smoothedBrake = Math.max(brakeInput, smoothedBrake - brDown * dt);
  }
  // Kent: Space is still a full stop. Highway: Space is only the handbrake.
  if (kent && emergencyBrake) smoothedBrake = 1;
  const brakePedal = smoothedBrake;

  // ── Decide pedal roles based on current speed ──────────────────────────
  const reverseSpeedMs = MAX_REVERSE_MPH * MPH_TO_MS;
  let isAccelerating = false;
  let isBraking = false;
  let isReversing = false;

  if (currentSpeed > 0.3) {
    isAccelerating = smoothedThrottle > 0;
    isBraking = brakePedal > 0;
  } else if (currentSpeed < -0.3) {
    isBraking = smoothedThrottle > 0;
    // Emergency brake never deepens a reverse run — it stops the car
    isReversing = !emergencyBrake && brakePedal > 0;
  } else {
    isAccelerating = smoothedThrottle > 0;
    // Space bar is a pure stop: brake input qualifies for reverse only when it
    // comes from a dedicated back-pedal key (S / ArrowDown), not from Space.
    isReversing = !emergencyBrake && brakePedal > 0 && smoothedThrottle === 0;
  }

  // ── Engine state ───────────────────────────────────────────────────────
  if (isReversing) {
    engine.gear = -1;
    engine.rpm = Math.max(IDLE_RPM, Math.min(3000,
      (Math.abs(currentSpeed) / reverseSpeedMs) * 3000));
    engine.throttle = brakePedal;
  } else {
    engine.throttle = smoothedThrottle;
    engine.rpm = rpmFromSpeed(Math.abs(currentSpeed), engine.gear);
    if (engine.gear === -1) engine.gear = 1;
    engine.gear = autoShift(engine.rpm, engine.gear);
  }

  // ── Compute net forward acceleration ───────────────────────────────────
  let rawAccel = 0;

  if (isAccelerating) {
    const drive = getDriveAccel(smoothedThrottle, engine.rpm, engine.gear);
    // OpenC1 motor damage: past ~40% the engine stumbles and gives up power.
    const wreckScale = kent ? 1 : 1 - _damage01 * 0.55;
    rawAccel += (kent ? Math.min(drive, KENT_MAX_DRIVE_ACCEL) : drive) * wreckScale;
  }

  if (isBraking && Math.abs(currentSpeed) > 0.1) {
    const activeBrakeInput = currentSpeed > 0 ? brakePedal : smoothedThrottle;
    rawAccel -= Math.sign(currentSpeed) * driveBrakeDecel * activeBrakeInput;
  }

  if (isReversing && currentSpeed > -reverseSpeedMs) {
    rawAccel -= REVERSE_ACCEL * brakePedal;
  }

  if (Math.abs(currentSpeed) > 0.1) {
    rawAccel -= Math.sign(currentSpeed) * (ROLLING_RESISTANCE_N / VEHICLE_MASS);
  }

  if (Math.abs(currentSpeed) > 0.5) {
    rawAccel -= (AERO_DRAG_COEFF * currentSpeed * Math.abs(currentSpeed)) / VEHICLE_MASS;
  }

  // Smooth acceleration to eliminate gear-shift surges
  const maxAccelDelta = (kent ? KENT_ACCEL_SMOOTH_RATE : ACCEL_SMOOTH_RATE) * dt;
  smoothedAccel += THREE.MathUtils.clamp(rawAccel - smoothedAccel, -maxAccelDelta, maxAccelDelta);

  // ── Integrate speed ────────────────────────────────────────────────────
  currentSpeed += smoothedAccel * dt;

  if (isBraking) {
    if (currentSpeed > 0 && currentSpeed - smoothedAccel * dt < 0) currentSpeed = 0;
    if (currentSpeed < 0 && currentSpeed - smoothedAccel * dt > 0) currentSpeed = 0;
  }

  // Emergency brake holds the car at a complete stop — never lets it roll backward.
  if (emergencyBrake && currentSpeed < 0) currentSpeed = 0;

  if (!isAccelerating && !isReversing && Math.abs(currentSpeed) < 0.15) {
    currentSpeed = 0;
  }

  if (currentSpeed < -reverseSpeedMs) currentSpeed = -reverseSpeedMs;

  const steerInput = Math.abs(steering) < STEER_DEADZONE ? 0 : steering;

  _impactFlash = Math.max(0, _impactFlash - dt * 2.8);

  if (!kent) {
    stepWreckChassis(dt, steerInput, emergencyBrake);
    body.setLinvel(
      {
        x: forward.x * currentSpeed + right.x * slideSpeed,
        y: linvel.y,
        z: forward.z * currentSpeed + right.z * slideSpeed,
      },
      true,
    );
    body.setAngvel({ x: 0, y: yawRate, z: 0 }, true);
  } else {
    slideSpeed = 0;
    yawRate = 0;
    handbrakeAmount = 0;
    const goingStraight = steerInput === 0;

    // ── Set velocity via Rapier so the collision solver works properly ─────
    const lateralRate = goingStraight ? LATERAL_DAMP_STRAIGHT : LATERAL_DAMP_RATE;
    const lateralDamp = Math.max(0, 1 - lateralRate * dt);
    const dampedLateralX = right.x * lateralSpeed * lateralDamp;
    const dampedLateralZ = right.z * lateralSpeed * lateralDamp;

    body.setLinvel(
      {
        x: forward.x * currentSpeed + dampedLateralX,
        y: linvel.y,
        z: forward.z * currentSpeed + dampedLateralZ,
      },
      true,
    );

    // ── Steering — auto-center yaw when input is neutral ───────────────────
    const absSpd = Math.abs(currentSpeed);
    const angvel = body.angvel();

    if (absSpd > 0.5 && steerInput !== 0) {
      const maxSteer = THREE.MathUtils.lerp(0.52, 0.14, Math.min(absSpd / 15, 1));
      const steerAngle = steerInput * maxSteer;
      const targetYaw = -(currentSpeed * Math.tan(steerAngle)) / WHEELBASE;
      const newYaw = angvel.y + (targetYaw - angvel.y) * Math.min(8.0 * dt, 1);
      body.setAngvel({ x: 0, y: newYaw, z: 0 }, true);
    } else if (absSpd > 0.3) {
      const yawDamp = Math.max(0, 1 - YAW_CENTER_RATE * dt);
      body.setAngvel({ x: 0, y: angvel.y * yawDamp, z: 0 }, true);
    } else {
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    const targetPitch = THREE.MathUtils.clamp(-smoothedAccel * 0.006, -0.04, 0.05);
    const targetRoll = THREE.MathUtils.clamp(-steerInput * Math.min(absSpd / 12, 1) * 0.05, -0.06, 0.06);
    chassisPitch += (targetPitch - chassisPitch) * Math.min(1, 5 * dt);
    chassisRoll += (targetRoll - chassisRoll) * Math.min(1, 6 * dt);
  }

  // ── Safety: keep above ground ──────────────────────────────────────────
  {
    const p = body.translation();
    if (p.y < 0.3) {
      body.setTranslation({ x: p.x, y: 0.3, z: p.z }, true);
      const lv = body.linvel();
      if (lv.y < 0) body.setLinvel({ x: lv.x, y: 0, z: lv.z }, true);
    }
  }

  // ── Sync to store ──────────────────────────────────────────────────────
  const finalPos = body.translation();
  store.setVehiclePosition([finalPos.x, finalPos.y, finalPos.z]);

  const heading = Math.atan2(-forward.x, -forward.z);
  store.setVehicleHeading(heading);

  const displayMph = Math.abs(currentSpeed) / MPH_TO_MS;
  store.setVelocityMph(Math.round(displayMph));
  store.setEngineRPM(Math.round(engine.rpm));
  store.setEngineGear(engine.gear);
  store.setEngineSpeed(Math.round(displayMph));

  store.setABSActive(brakeInput > 0.5 && Math.abs(currentSpeed) > 8);

  // ── Mileage (highway mode only; Kent missions don't count miles) ────────
  if (store.worldMode === 'highway' && currentSpeed > 0.5) {
    mileageAccumulator += (currentSpeed * dt) / METERS_PER_MILE;
    if (mileageAccumulator >= MILEAGE_BATCH) {
      store.addMileage(mileageAccumulator);
      store.consumeFuel(FUEL_PER_BATCH);
      mileageAccumulator = 0;
    }
  }
}

/** Stand the car back up on its heading and kill a spin. Speed stays. */
export function recoverVehicle(): void {
  slideSpeed = 0;
  yawRate = 0;
  chassisPitch = 0;
  chassisRoll = 0;
  handbrakeAmount = 0;
  if (!_body) return;
  const t = _body.translation();
  const heading = useGameStore.getState().vehicleHeading;
  const half = heading / 2;
  _body.setTranslation({ x: t.x, y: Math.max(0.55, t.y), z: t.z }, true);
  _body.setRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) }, true);
  _body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  _body.setLinvel({ x: fx * currentSpeed, y: 0, z: fz * currentSpeed }, true);
}

export function resetVehicleController(): void {
  mileageAccumulator = 0;
  currentSpeed = 0;
  slideSpeed = 0;
  yawRate = 0;
  handbrakeAmount = 0;
  chassisPitch = 0;
  chassisRoll = 0;
  _damage01 = 0;
  _impactFlash = 0;
  _damageCut = 0;
  smoothedThrottle = 0;
  smoothedBrake = 0;
  smoothedAccel = 0;
  engine.rpm = IDLE_RPM;
  engine.gear = 1;
  engine.throttle = 0;
}
