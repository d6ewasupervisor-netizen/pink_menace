/**
 * qualityPick — which tier a phone should run, from what it says about itself.
 *
 * The tier system has existed since P8 (DPR, the post stack, recovery from a
 * 30 Hz panel), but the tier was chosen from one fact — `hardwareConcurrency <= 4`
 * — so a four-core Android with an Adreno 6xx and 8 GB was called "low end" and a
 * two-core tablet with a weak GPU was called fine. This module makes the choice
 * from the things the browser actually exposes, and lets a player override it.
 *
 * Precedence: `?tier=` (a URL, for a bug report) beats the saved choice, which
 * beats the measurement. `?tier=auto` clears a save.
 *
 * The rules are deliberately conservative — a wrong "high" costs frames, a wrong
 * "low" costs looks — and they are pure, so `test/quality-pick.test.ts` pins them
 * against device strings that real phones send.
 */
export type PickedTier = 'low' | 'mid' | 'high';

export interface DeviceFacts {
  /** The unmasked renderer string, lower-cased or not — matching is case-insensitive. */
  gpu: string;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  dpr: number;
}

/** GPUs that cannot hold the mid tier whatever else the phone says. */
const WEAK_GPU = /mali-[4t][0-9]|mali-400|adreno \(tm\) ?[3-5][0-9]{2}|powervr|swiftshader|llvmpipe|software|intel hd|uhd graphics 6[0-2]/i;
/** GPUs that are comfortably above the mid tier. */
const STRONG_GPU = /apple m|apple gpu|adreno \(tm\) ?[67][0-9]{2}|adreno \(tm\) ?7[0-9]{2}|mali-g[7-9][0-9]|xclipse|rtx|radeon rx|geforce gtx/i;

/**
 * The tier this device should run. `gpu` may be empty (no debug extension), in
 * which case the memory and core counts decide, and a phone that says nothing at
 * all gets `mid` — the tier that is cheap without looking cheap.
 */
export function pickTier(facts: DeviceFacts): PickedTier {
  const gpu = facts.gpu ?? '';
  const cores = facts.hardwareConcurrency ?? 0;
  const mem = facts.deviceMemory ?? 0;

  if (WEAK_GPU.test(gpu)) return 'low';
  if (mem > 0 && mem <= 2) return 'low';
  if (cores > 0 && cores <= 4 && !STRONG_GPU.test(gpu)) return 'low';

  const strong = STRONG_GPU.test(gpu) || (gpu === '' && cores >= 8 && mem >= 8);
  // An iPhone reports six cores and no memory figure at all, so "high" cannot
  // demand eight of each: a strong GPU, six cores and either 4 GB or no answer is
  // a current phone.
  if (strong && cores >= 6 && (mem === 0 || mem >= 4)) return 'high';
  if (cores >= 6 && mem >= 4 && !WEAK_GPU.test(gpu)) return 'mid';
  return 'mid';
}

/** A tier named in a URL or a save, or null. `auto` means "no override". */
export function parseTier(value: string | null | undefined): PickedTier | null {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'low' || v === 'mid' || v === 'high') return v;
  return null;
}

export const TIER_STORE_KEY = 'quiet-roads-tier';

/**
 * The override in force: the URL first (a bug report can force a tier on a phone
 * that has a save), then the saved choice. Storage is wrapped: a denied
 * localStorage is a normal iOS private-mode state, not a crash.
 */
export function readTierOverride(
  search = typeof window === 'undefined' ? '' : window.location.search,
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): PickedTier | null {
  try {
    const fromUrl = parseTier(new URLSearchParams(search).get('tier'));
    if (fromUrl) return fromUrl;
  } catch {
    /* a malformed search string is not a reason to fail */
  }
  try {
    return parseTier(storage?.getItem(TIER_STORE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** Save (or, with null, clear) the player's choice. Returns what is stored now. */
export function saveTierOverride(
  tier: PickedTier | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null = safeStorage(),
): PickedTier | null {
  try {
    if (tier) storage?.setItem(TIER_STORE_KEY, tier);
    else storage?.removeItem(TIER_STORE_KEY);
  } catch {
    /* private mode: the choice lasts for this session only */
  }
  return tier;
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The next tier down, or the same one at the bottom. */
export function tierBelow(tier: PickedTier): PickedTier {
  return tier === 'high' ? 'mid' : 'low';
}

/**
 * The tier this session starts on: the `?tier=` / saved override if there is one,
 * otherwise the device's own facts. The GPU string only exists once a context does,
 * so this is the best answer available before the first frame; `FieldDiagnostics`
 * refines it once and `PerfRecorder` may step it down later.
 *
 * One function, two callers (the Canvas and the model loader), so the 3D world and
 * the assets it draws cannot start on different tiers.
 */
export function initialTier(): PickedTier {
  const override = readTierOverride();
  if (override) return override;
  return pickTier({
    gpu: '',
    deviceMemory:
      typeof navigator === 'undefined'
        ? null
        : (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    hardwareConcurrency: typeof navigator === 'undefined' ? null : navigator.hardwareConcurrency ?? null,
    dpr: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
  });
}

