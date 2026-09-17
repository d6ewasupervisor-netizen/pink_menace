/**
 * qrHud — transient Quiet Roads UI state. NOT persisted: it changes many times a
 * second (sim frames, dialogue lines), and running that through the persisted save
 * store meant a synchronous localStorage write per tick, which froze phones.
 */
import { create } from 'zustand';
import type { ShownLine, DialogueNode, ChoiceOption, SimFrame } from '@/quietroads';

export interface TelemetryRow {
  ts: number;
  event: string;
  data?: Record<string, unknown>;
}

interface HudState {
  line: ShownLine | null;
  direction: { node: DialogueNode; id: string } | null;
  choices: { node: DialogueNode; options: ChoiceOption[] } | null;
  objective: string;
  toast: string;
  frame: SimFrame | null;
  horn: boolean;
  run: boolean;
  qteActive: boolean;
  card: { id: string; source: 'story' | 'world' } | null;
  scare: 'none' | 'edge' | 'flood';
  /** Outbound telemetry, in memory only; DriveSync drains it every 10 s. */
  telemetry: TelemetryRow[];
  setTransient: (partial: Partial<Omit<HudState, 'setTransient' | 'setHorn' | 'setRun' | 'addTelemetry' | 'drainTelemetry'>>) => void;
  setHorn: (v: boolean) => void;
  setRun: (v: boolean) => void;
  addTelemetry: (row: TelemetryRow) => void;
  drainTelemetry: () => TelemetryRow[];
}

export const useQRHud = create<HudState>()((set, get) => ({
  line: null, direction: null, choices: null, objective: '', toast: '', frame: null,
  horn: false, run: false, qteActive: false, card: null, scare: 'none', telemetry: [],
  setTransient: (partial) => set(partial),
  setHorn: (v) => set({ horn: v }),
  setRun: (v) => set({ run: v }),
  addTelemetry: (row) => set((s) => ({ telemetry: s.telemetry.length >= 2000 ? [...s.telemetry.slice(-1500), row] : [...s.telemetry, row] })),
  drainTelemetry: () => { const rows = get().telemetry; set({ telemetry: [] }); return rows; },
}));
