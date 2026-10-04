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

// ─── P12: remappable keys ─────────────────────────────────────────────────────
// The bind table IS the data. Defaults are exactly what mergeDriveInput read
// before this existed — arrows and WASD for steer and pedals, Space handbrake,
// H horn, L headlights, Escape and P pause — so an unbound player behaves
// identically to the pre-P12 build.

export const DRIVE_ACTIONS = [
  'steerLeft', 'steerRight', 'throttle', 'brake',
  'handbrake', 'horn', 'headlights', 'pause',
] as const;

export type DriveAction = (typeof DRIVE_ACTIONS)[number];

/** action → the keys that trigger it. */
export type BindMap = Record<DriveAction, string[]>;

/** Human labels for the pause-menu rows. */
export const ACTION_LABELS: Record<DriveAction, string> = {
  steerLeft: 'Steer left',
  steerRight: 'Steer right',
  throttle: 'Throttle',
  brake: 'Brake',
  handbrake: 'Handbrake',
  horn: 'Horn',
  headlights: 'Headlights',
  pause: 'Pause',
};

/** The shipped defaults. Both arrows and WASD, as before. */
export const DEFAULT_BINDS: BindMap = {
  steerLeft: ['ArrowLeft', 'a'],
  steerRight: ['ArrowRight', 'd'],
  throttle: ['ArrowUp', 'w'],
  brake: ['ArrowDown', 's'],
  handbrake: [' '],
  horn: ['h'],
  headlights: ['l'],
  pause: ['Escape', 'p'],
};

/** A fresh, mutable copy of the defaults (used by the reset row). */
export function defaultBinds(): BindMap {
  return Object.fromEntries(DRIVE_ACTIONS.map((a) => [a, [...DEFAULT_BINDS[a]]])) as BindMap;
}

/** Merge a partial/stored map over the defaults so a new action is never missing. */
export function normalizeBinds(raw: unknown): BindMap {
  const out = defaultBinds();
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Partial<Record<string, unknown>>;
  for (const action of DRIVE_ACTIONS) {
    const keys = src[action];
    if (Array.isArray(keys)) {
      const clean = keys.filter((k): k is string => typeof k === 'string' && k.length > 0);
      if (clean.length) out[action] = [...new Set(clean)];
    }
  }
  return out;
}

/**
 * Is any of this action's keys currently held?
 * Single letters match case-insensitively, so a rebind to "q" still works with
 * Shift held — which is what the old `has('a') || has('A')` check did.
 */
export function bindHeld(action: DriveAction, binds: BindMap = DEFAULT_BINDS): boolean {
  for (const key of binds[action]) {
    if (liveKeys.has(key)) return true;
    if (key.length === 1) {
      if (liveKeys.has(key.toUpperCase()) || liveKeys.has(key.toLowerCase())) return true;
    }
  }
  return false;
}

/** Bind an action to one key, replacing its list. */
export function rebind(binds: BindMap, action: DriveAction, key: string): BindMap {
  return { ...binds, [action]: [key] };
}

/** Put one action back to its default. */
export function resetBind(binds: BindMap, action: DriveAction): BindMap {
  return { ...binds, [action]: [...DEFAULT_BINDS[action]] };
}

/** Put every action back to its default. */
export function resetAllBinds(): BindMap {
  return defaultBinds();
}

/** Pretty key name for a pause-menu row. */
export function keyLabel(key: string): string {
  if (key === ' ') return 'SPACE';
  if (key.startsWith('Arrow')) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return key.toUpperCase();
}

export function mergeDriveInput(sensitivity: number, binds: BindMap = DEFAULT_BINDS): {
  steering: number;
  throttle: number;
  brake: number;
  emergencyBrake: boolean;
} {
  const left = bindHeld('steerLeft', binds);
  const right = bindHeld('steerRight', binds);
  const fwd = bindHeld('throttle', binds);
  const back = bindHeld('brake', binds);
  const pad = livePad;
  // Space is the handbrake on the highway (OpenC1). Kent treats that same
  // flag as a full stop inside the controller, so it stays off the brake pedal.
  const eBrake = bindHeld('handbrake', binds) || touchHandbrake || Boolean(pad && pad.handbrake);

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
