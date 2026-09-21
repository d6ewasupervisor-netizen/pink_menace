/**
 * Shared drive input — Road Rush control schemes + live stick/key/pad merge.
 *
 * Schemes match /cruise/:
 *   dual-steer-left | dual-steer-right | single-left | single-center | single-right
 */
export const CONTROL_SCHEMES = [
  'dual-steer-left',
  'dual-steer-right',
  'single-left',
  'single-center',
  'single-right',
] as const;

export type ControlsScheme = (typeof CONTROL_SCHEMES)[number];

export type StickAxes = {
  steer: number;
  throttle: number;
  brake: number;
  active: boolean;
};

export type PadAxes = {
  steer: number;
  throttle: number;
  brake: number;
  handbrake?: boolean;
};

/** Touch handbrake. Highway only — Kent still uses Space as a full stop. */
let touchHandbrake = false;

export function setTouchHandbrake(held: boolean): void {
  touchHandbrake = held;
}

export function normalizeControlsScheme(raw: unknown): ControlsScheme {
  if (raw === 'steer-right') return 'dual-steer-right';
  if (raw === 'steer-left') return 'dual-steer-left';
  if ((CONTROL_SCHEMES as readonly string[]).includes(String(raw))) {
    return raw as ControlsScheme;
  }
  return 'dual-steer-left';
}

export function isSingleStick(scheme: ControlsScheme): boolean {
  return String(scheme).startsWith('single-');
}

export function controlsSchemeLabel(scheme: ControlsScheme): string {
  switch (normalizeControlsScheme(scheme)) {
    case 'dual-steer-right':
      return '2 STICK · STEER R';
    case 'single-left':
      return '1 STICK · LEFT';
    case 'single-center':
      return '1 STICK · CENTER';
    case 'single-right':
      return '1 STICK · RIGHT';
    default:
      return '2 STICK · STEER L';
  }
}

export function nextControlsScheme(current: ControlsScheme): ControlsScheme {
  const cur = normalizeControlsScheme(current);
  return CONTROL_SCHEMES[(CONTROL_SCHEMES.indexOf(cur) + 1) % CONTROL_SCHEMES.length];
}

export type SteerCorner = 'left' | 'right' | 'center';

/** Which bottom corner the steer stick owns. */
export function steerCorner(scheme: ControlsScheme): SteerCorner {
  const s = normalizeControlsScheme(scheme);
  if (s === 'single-center') return 'center';
  if (s === 'single-right' || s === 'dual-steer-right') return 'right';
  return 'left';
}

/** GPS + speed cluster edge. Opposite the steer stick, or the top when the bottom is full. */
export type DashEdge = 'left' | 'right' | 'top';

export function dashEdge(scheme: ControlsScheme): DashEdge {
  const s = normalizeControlsScheme(scheme);
  const corner = steerCorner(s);
  if (corner === 'center' || !isSingleStick(s)) return 'top';
  return corner === 'left' ? 'right' : 'left';
}

const liveStick: StickAxes = { steer: 0, throttle: 0, brake: 0, active: false };
export const liveKeys = new Set<string>();
export let livePad: PadAxes | null = null;

export function getStickAxes(): StickAxes {
  return liveStick;
}

export function setStickAxes(next: Partial<StickAxes>): void {
  Object.assign(liveStick, next);
}

export function clearStickAxes(): void {
  liveStick.steer = 0;
  liveStick.throttle = 0;
  liveStick.brake = 0;
  liveStick.active = false;
}

export function setLivePad(pad: PadAxes | null): void {
  livePad = pad;
}

export function mergeDriveInput(sensitivity: number): {
  steering: number;
  throttle: number;
  brake: number;
  emergencyBrake: boolean;
} {
  const left = liveKeys.has('ArrowLeft') || liveKeys.has('a') || liveKeys.has('A');
  const right = liveKeys.has('ArrowRight') || liveKeys.has('d') || liveKeys.has('D');
  const fwd = liveKeys.has('ArrowUp') || liveKeys.has('w') || liveKeys.has('W');
  const back = liveKeys.has('ArrowDown') || liveKeys.has('s') || liveKeys.has('S');
  const pad = livePad;
  // Space is the handbrake on the highway (OpenC1). Kent treats that same
  // flag as a full stop inside the controller, so it stays off the brake pedal.
  const eBrake = liveKeys.has(' ') || touchHandbrake || Boolean(pad && pad.handbrake);

  let steer = 0;
  if (left) steer -= 1;
  if (right) steer += 1;

  if (pad && Math.abs(pad.steer) > 0.02 && !left && !right) {
    steer = pad.steer;
  } else if (liveStick.active && !left && !right && !(pad && Math.abs(pad.steer) > 0.02)) {
    steer = liveStick.steer;
  }

  const throttle = Math.max(
    fwd ? 1 : 0,
    pad?.throttle ?? 0,
    liveStick.active ? liveStick.throttle : 0,
  );
  const brake = Math.max(
    back ? 1 : 0,
    pad?.brake ?? 0,
    liveStick.active ? liveStick.brake : 0,
  );

  return {
    steering: Math.max(-1, Math.min(1, steer * sensitivity)),
    throttle: Math.min(1, throttle),
    brake: Math.min(1, brake),
    emergencyBrake: eBrake,
  };
}

export function detectTouchDrive(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const touch = 'ontouchstart' in window;
  const narrow = window.innerWidth <= 900;
  return coarse || noHover || (touch && narrow);
}
