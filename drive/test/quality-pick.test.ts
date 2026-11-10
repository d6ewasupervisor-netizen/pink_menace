/**
 * qualityPick — which tier a phone gets, and who is allowed to overrule it.
 *
 * The device strings here are the ones real phones send through
 * `WEBGL_debug_renderer_info`; the point of the test is that a four-core phone
 * with a strong GPU is not called low-end (the old rule) and a phone that says
 * nothing useful still gets a tier that looks right.
 */
import { describe, expect, it } from 'vitest';
import {
  TIER_STORE_KEY,
  parseTier,
  pickTier,
  readTierOverride,
  saveTierOverride,
  tierBelow,
  type DeviceFacts,
} from '../src/utils/qualityPick';

const facts = (over: Partial<DeviceFacts> = {}): DeviceFacts => ({
  gpu: 'Adreno (TM) 640',
  deviceMemory: 6,
  hardwareConcurrency: 8,
  dpr: 2.625,
  ...over,
});

describe('pickTier', () => {
  it('puts a weak GPU on low whatever the phone claims', () => {
    for (const gpu of ['Mali-400 MP', 'Mali-T720', 'Adreno (TM) 505', 'PowerVR Rogue GE8320', 'SwiftShader Device (Subzero)']) {
      expect(pickTier(facts({ gpu })), gpu).toBe('low');
    }
  });

  it('puts a four-core phone with a real GPU on mid, not low', () => {
    // The old rule was `hardwareConcurrency <= 4` → low, which called this phone
    // low-end while it happily runs the mid stack.
    expect(pickTier(facts({ gpu: 'Adreno (TM) 619', hardwareConcurrency: 4, deviceMemory: 4 }))).toBe('mid');
  });

  it('gives a current flagship the high tier', () => {
    expect(pickTier(facts({ gpu: 'Apple GPU', hardwareConcurrency: 6, deviceMemory: 8 }))).toBe('high');
    expect(pickTier(facts({ gpu: 'Adreno (TM) 740', hardwareConcurrency: 8, deviceMemory: 8 }))).toBe('high');
  });

  it('never gives a 2 GB phone the high tier', () => {
    expect(pickTier(facts({ deviceMemory: 2, hardwareConcurrency: 8, gpu: 'Apple GPU' }))).toBe('low');
  });

  it('falls back to mid when the phone says nothing', () => {
    expect(pickTier({ gpu: '', deviceMemory: null, hardwareConcurrency: null, dpr: 3 })).toBe('mid');
    expect(pickTier(facts({ gpu: 'WebKit WebGL' }))).toBe('mid');
  });
});

describe('the override', () => {
  const store = (initial: string | null = null) => {
    let value = initial;
    return {
      getItem: (k: string) => (k === TIER_STORE_KEY ? value : null),
      setItem: (k: string, v: string) => {
        if (k === TIER_STORE_KEY) value = v;
      },
      removeItem: (k: string) => {
        if (k === TIER_STORE_KEY) value = null;
      },
      read: () => value,
    };
  };

  it('parses only real tiers, and treats auto as no override', () => {
    expect(parseTier('low')).toBe('low');
    expect(parseTier(' HIGH ')).toBe('high');
    expect(parseTier('auto')).toBeNull();
    expect(parseTier('ultra')).toBeNull();
    expect(parseTier(null)).toBeNull();
  });

  it('lets the URL beat the save, and the save stand when the URL is silent', () => {
    const s = store('mid');
    expect(readTierOverride('?tier=low', s)).toBe('low');
    expect(readTierOverride('?tier=auto', s)).toBe('mid');
    expect(readTierOverride('', s)).toBe('mid');
    expect(readTierOverride('', store(null))).toBeNull();
  });

  it('saves and clears the choice, and survives storage that throws', () => {
    const s = store();
    expect(saveTierOverride('high', s)).toBe('high');
    expect(s.read()).toBe('high');
    expect(saveTierOverride(null, s)).toBeNull();
    expect(s.read()).toBeNull();

    const denied = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(readTierOverride('', denied)).toBeNull();
    expect(saveTierOverride('low', denied)).toBe('low');
  });

  it('steps down one tier at a time', () => {
    expect(tierBelow('high')).toBe('mid');
    expect(tierBelow('mid')).toBe('low');
    expect(tierBelow('low')).toBe('low');
  });
});
