/**
 * qrHud — transient Quiet Roads UI state. NOT persisted: it changes many times a
 * second (sim frames, dialogue lines), and running that through the persisted save
 * store meant a synchronous localStorage write per tick, which froze phones.
 */
import { create } from 'zustand';
import type { ShownLine, DialogueNode, ChoiceOption, SimFrame } from '@/quietroads';
import type { DebriefModel } from '@/quietroads/debrief';
import type { ChainupPrompt } from '@/quietroads/sim/chainup';

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
  /** The cockpit QTE prompt (chain-up's hold-the-brake). Renders above every layer. */
  qte: ChainupPrompt | null;
  card: { id: string; source: 'story' | 'world' } | null;
  /**
   * A mission this scene started is running. Written in ONE place
   * (QuietRoadsBridge.syncMission) and read by the cockpit's derived rule: while
   * it is true and nothing compound is open, the driving HUD is the surface,
   * whatever the phase flag happens to say.
   */
  missionActive: boolean;
  /** The grade result panel (built by quietroads/debrief). Null when closed. */
  debrief: DebriefModel | null;
  /**
   * A wait nothing is going to answer: the bridge names the scene/node/event
   * after 8 s and offers a Continue control that releases it. Null otherwise.
   */
  stranded: { scene: string; node: string; event: string } | null;
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
  horn: false, run: false, qteActive: false, qte: null, card: null, missionActive: false, debrief: null, stranded: null, scare: 'none', telemetry: [],
  setTransient: (partial) => set(partial),
  setHorn: (v) => set({ horn: v }),
  setRun: (v) => set({ run: v }),
  addTelemetry: (row) => set((s) => ({ telemetry: s.telemetry.length >= 2000 ? [...s.telemetry.slice(-1500), row] : [...s.telemetry, row] })),
  drainTelemetry: () => { const rows = get().telemetry; set({ telemetry: [] }); return rows; },
}));
