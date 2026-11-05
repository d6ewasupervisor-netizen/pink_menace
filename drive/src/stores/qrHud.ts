/**
 * qrHud — transient Quiet Roads UI state. NOT persisted: it changes many times a
 * second (sim frames, dialogue lines), and running that through the persisted save
 * store meant a synchronous localStorage write per tick, which froze phones.
 */
import { create } from 'zustand';
import type { ShownLine, DialogueNode, ChoiceOption, SimFrame } from '@/quietroads';
import type { DebriefModel } from '@/quietroads/debrief';
import type { ChainupPrompt } from '@/quietroads/sim/chainup';
import type { Shop } from '@/quietroads/shop';
import type { HandsOffState } from '@/quietroads/handsoff';

export type { HandsOffState };

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
  /**
   * The shop counter that is open, if any. Written by the bridge when a shop
   * scene's greet node fires `start_gameplay: shop_*`; the counter renders this
   * and calls back through `QuietRoads.buy` / `leaveShop`.
   */
  shop: Shop | null;
  /**
   * The credits screen is open. Set by the bridge when the story unlocks
   * `credits` (8.3.end) or when the end-of-run screen asks for it. It is a
   * panel over whatever was underneath, not a phase.
   */
  credits: boolean;
  /**
   * A hands-off wait is up (6.3's engine-off sixty seconds). Written in ONE place
   * — `QuietRoadsBridge.syncHandsOff` — and read by three surfaces: the overlay
   * that draws it, DialogueBox (which stands down, the overlay carries the line),
   * and TouchOverlay (the sticks go away). See quietroads/handsoff.ts.
   */
  handsOff: HandsOffState | null;
  scare: 'none' | 'edge' | 'flood';
  /**
   * Outbound telemetry does NOT live in this store. It used to: every sim event
   * did `set({ telemetry: [...rows, row] })`, which copies the whole array on
   * every emission — at 73 events/s during the 6.3 bridge flood (1,693 rows in
   * 23 s) that is the main thread spending its frame copying a 2,000-element
   * list. Rows now go straight into `DriveSync`'s deduping batch
   * (systems/telemetryBatch.ts): one Map update per event, one POST per interval.
   */
  setTransient: (partial: Partial<Omit<HudState, 'setTransient' | 'setHorn' | 'setRun'>>) => void;
  setHorn: (v: boolean) => void;
  setRun: (v: boolean) => void;
}

export const useQRHud = create<HudState>()((set) => ({
  line: null, direction: null, choices: null, objective: '', toast: '', frame: null,
  horn: false, run: false, qteActive: false, qte: null, card: null, missionActive: false, debrief: null, stranded: null, shop: null, credits: false, handsOff: null, scare: 'none',
  setTransient: (partial) => set(partial),
  setHorn: (v) => set({ horn: v }),
  setRun: (v) => set({ run: v }),
}));
