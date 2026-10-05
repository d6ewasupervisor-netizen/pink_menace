/**
 * voice.ts — one voice for the whole campaign (owner decision, 2026-10-05).
 *
 * "Radio and CB beds stop being a different voice per act." The same speaker
 * used to carry a different `voice_bed` in different act files — Deac was CB on
 * Central and the Ribbon but plain in the Grid and the Core; Jonah was CB in the
 * delivery acts and plain later — so the same voice changed treatment act to act.
 * The medium now lives in ONE table: a line-level `voice_bed` still overrides it
 * (the pattern act 8 already uses when Mom and Ray stand in the room and when
 * Deac calls in on the radio), and everything else resolves here. The per-act
 * `characters[].voice_bed` / `characters[].default_volume` fields are no longer
 * consulted for listed speakers.
 *
 * "Spoken lines use one in-cab treatment": a spoken line is a bedless line, and
 * its loudness maps through the single VOLUME_DB table in `DialogueRunner` —
 * one in-cab treatment, not one per act.
 */
import type { Volume, VoiceBed } from "./types";

export interface SpeakerVoice {
  /** The speaker's radio/CB bed; "none" = spoken in the cab. */
  bed: VoiceBed;
  /** How loudly they speak in the cab (which is what wakes the Quiet). */
  volume: Volume;
}

export const SPEAKER_VOICE: Record<string, SpeakerVoice> = {
  ALI:      { bed: "none",         volume: "whisper" },
  MYA:      { bed: "none",         volume: "whisper" },
  GRACIE:   { bed: "none",         volume: "whisper" },
  DEAC:     { bed: "cb_radio",     volume: "low" },
  TUNA:     { bed: "none",         volume: "low" },
  BEA:      { bed: "none",         volume: "low" },
  PRIYA:    { bed: "none",         volume: "low" },
  JONAH:    { bed: "cb_radio",     volume: "normal" },
  MOM:      { bed: "radio_static", volume: "low" },
  RAY:      { bed: "radio_static", volume: "low" },
  LUMI:     { bed: "radio_static", volume: "whisper" },
  SORI:     { bed: "radio_static", volume: "whisper" },
  HANK:     { bed: "cb_radio",     volume: "normal" },
  DISPATCH: { bed: "cb_radio",     volume: "low" },
  VENDOR:   { bed: "none",         volume: "low" },
  BOARD:    { bed: "none",         volume: "whisper" },
  NOTES:    { bed: "none",         volume: "whisper" },
};

/** Per line > campaign voice > per-act character def > plain and quiet. */
export function voiceBedFor(speakerId: string, lineBed?: VoiceBed, fileBed?: VoiceBed): VoiceBed {
  return lineBed ?? SPEAKER_VOICE[speakerId]?.bed ?? fileBed ?? "none";
}

/** Per line > campaign voice > per-act character def > whisper. */
export function volumeFor(speakerId: string, lineVolume?: Volume, fileVolume?: Volume): Volume {
  return lineVolume ?? SPEAKER_VOICE[speakerId]?.volume ?? fileVolume ?? "whisper";
}