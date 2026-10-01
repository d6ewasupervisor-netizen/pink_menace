/**
 * Live chassis numbers for camera, audio, and wheel spin.
 * The Zustand copy is published at 10 Hz so speed/RPM subscribers
 * (GameHUD, EngineHUD, Speedometer) do not re-render every physics step.
 */
export const liveDrive = {
  velocityMph: 0,
  engineRPM: 800,
  engineGear: 1,
  engineSpeed: 0,
  absActive: false,
};

const HUD_MS = 100;
let lastHud = 0;

export function noteLiveDrive(next: typeof liveDrive, now = performance.now()): boolean {
  liveDrive.velocityMph = next.velocityMph;
  liveDrive.engineRPM = next.engineRPM;
  liveDrive.engineGear = next.engineGear;
  liveDrive.engineSpeed = next.engineSpeed;
  liveDrive.absActive = next.absActive;
  if (now - lastHud < HUD_MS) return false;
  lastHud = now;
  return true;
}

export function resetLiveDrive() {
  liveDrive.velocityMph = 0;
  liveDrive.engineRPM = 800;
  liveDrive.engineGear = 1;
  liveDrive.engineSpeed = 0;
  liveDrive.absActive = false;
  lastHud = 0;
}
