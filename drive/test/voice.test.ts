/**
 * One voice, one interface (owner decision, 2026-10-05).
 *
 * "Radio and CB beds stop being a different voice per act": the same speaker
 * used to resolve a different `voice_bed` depending on which act file defined
 * them. The campaign table in `dialogue/voice.ts` now owns the medium, so this
 * measures the rule instead of trusting it — every act file must resolve each
 * speaker to the same voice, and the per-line override (act 8's pattern) must
 * still win.
 *
 * The interface half asserts the scene spec is one cockpit with one accent and
 * the Quiet meter on every act.
 */
import { describe, expect, it } from 'vitest';
import act01 from '../src/quietroads/data/dialogue_act0-1.json';
import act2 from '../src/quietroads/data/dialogue_act2.json';
import act2central from '../src/quietroads/data/dialogue_act2_central.json';
import act3 from '../src/quietroads/data/dialogue_act3.json';
import act4 from '../src/quietroads/data/dialogue_act4.json';
import act5ribbon from '../src/quietroads/data/dialogue_act5_ribbon.json';
import act5 from '../src/quietroads/data/dialogue_act5.json';
import act6 from '../src/quietroads/data/dialogue_act6.json';
import act6backcountry from '../src/quietroads/data/dialogue_act6_backcountry.json';
import act7 from '../src/quietroads/data/dialogue_act7.json';
import act8 from '../src/quietroads/data/dialogue_act8.json';
import type { DialogueFile, VoiceBed, Volume } from '../src/quietroads/dialogue/types';
import { SPEAKER_VOICE, voiceBedFor, volumeFor } from '../src/quietroads/dialogue/voice';
import { SCENE_ACCENT, SCENE_SPECS } from '../src/components/Game3D/sceneSpec';
import { tokens } from '../src/components/Game3D/cockpit/tokens';

const FILES = [act01, act2, act2central, act3, act4, act5ribbon, act5, act6, act6backcountry, act7, act8] as unknown as DialogueFile[];

describe('one voice — a speaker resolves to the same voice in every act', () => {
  it('the per-act character defs no longer change the medium or the volume', () => {
    const beds = new Map<string, Set<VoiceBed>>();
    const volumes = new Map<string, Set<Volume>>();
    for (const f of FILES) {
      for (const [id, def] of Object.entries(f.characters ?? {})) {
        const bed = voiceBedFor(id, undefined, def.voice_bed);
        const vol = volumeFor(id, undefined, def.default_volume);
        if (!beds.has(id)) beds.set(id, new Set());
        if (!volumes.has(id)) volumes.set(id, new Set());
        beds.get(id)!.add(bed);
        volumes.get(id)!.add(vol);
      }
    }
    expect(beds.size).toBeGreaterThan(10);
    for (const [id, set] of beds) {
      expect(set.size, `${id} resolves to more than one voice bed`).toBe(1);
    }
    for (const [id, set] of volumes) {
      expect(set.size, `${id} resolves to more than one in-cab volume`).toBe(1);
    }
  });

  it('the radio and CB voices are the campaign voices', () => {
    expect(voiceBedFor('MOM')).toBe('radio_static');
    expect(voiceBedFor('RAY')).toBe('radio_static');
    expect(voiceBedFor('LUMI')).toBe('radio_static');
    expect(voiceBedFor('SORI')).toBe('radio_static');
    expect(voiceBedFor('DEAC')).toBe('cb_radio');
    expect(voiceBedFor('JONAH')).toBe('cb_radio');
    expect(voiceBedFor('HANK')).toBe('cb_radio');
    expect(voiceBedFor('DISPATCH')).toBe('cb_radio');
    // Spoken in the cab: one in-cab treatment (bedless), quiet by default.
    expect(voiceBedFor('ALI')).toBe('none');
    expect(voiceBedFor('GRACIE')).toBe('none');
    expect(voiceBedFor('MYA')).toBe('none');
  });

  it('a line-level override still wins — the scene is a per-line fact', () => {
    // Act 8 stands Mom and Ray in the room (bed "none") and calls Deac in on the
    // radio ("radio_static"); those lines keep their own medium.
    expect(voiceBedFor('MOM', 'none')).toBe('none');
    expect(voiceBedFor('DEAC', 'radio_static')).toBe('radio_static');
    expect(volumeFor('ALI', 'shout')).toBe('shout');
    // And a speaker the campaign table does not know falls back, not breaks.
    expect(voiceBedFor('NEWCOMER', undefined, 'phone')).toBe('phone');
    expect(voiceBedFor('NEWCOMER')).toBe('none');
    expect(volumeFor('NEWCOMER')).toBe('whisper');
    // Every speaker the dialogue files use is in the one table.
    for (const f of FILES) {
      for (const id of Object.keys(f.characters ?? {})) {
        expect(SPEAKER_VOICE[id], `${id} missing from SPEAKER_VOICE`).toBeTruthy();
      }
    }
  });
});

describe('one interface — one accent, one cockpit, the Quiet meter on every act', () => {
  it('every act row is the same interface', () => {
    expect(SCENE_ACCENT).toBe(tokens.colors.accent);
    for (const [act, spec] of Object.entries(SCENE_SPECS)) {
      expect(spec.quiet, `act ${act} hides the Quiet meter`).toBe(true);
      expect(spec.driveView, `act ${act} is not the one cockpit`).toBe('cockpit');
      expect(spec.maneuverCam, `act ${act} lost the maneuver cam`).toBe(true);
    }
  });
});