/**
 * QuietRoadsBridge — the one place the story engine and the world simulation
 * touch the game. Pure TS singleton (no JSX); ticked from a useFrame in
 * QuietRoadsFrame.tsx and driven by store phase changes.
 *
 * Responsibilities
 *   - DialogueHost implementation over qrStore
 *   - Scene routing: still/video/radio scenes → phase 'dialogue' (car frozen);
 *     gameplay scenes → phase 'driving'
 *   - Vehicle sampling for the Simulation (never drives the car itself)
 *   - In-world quizzes → reuse QuizOverlay by mapping core questions to the
 *     game's Question type; answers feed SM-2 + Trade Points
 *   - Telemetry queue for the parent dashboard
 */
import {
  DialogueRunner, Simulation, QuestionBank, CardDeck, CARD_FOR_TRIGGER, newMastery, sm2Update, gradeQuality, tpForAnswer,
  drawExam, buildStudySet, scoreExam, dueCount,
  type Card, type CardResult, type CardGrade,
  type DialogueHost, type DialogueFile, type VehicleSample, type SimFrame, type MissionId,
  type Question as CoreQuestion, type TimerHandle, VEHICLE, CHASSIS_DECEL, brakeDecel, type WalkerInput, type MasteryRecord,
  actForScene, actForMission, challengeForAct, type CardAct,
} from '@/quietroads';
import { KnowledgeSeat, examVerdict } from '@/quietroads/study/seat';
import act01 from '@/quietroads/data/dialogue_act0-1.json';
import act2 from '@/quietroads/data/dialogue_act2.json';
import act2central from '@/quietroads/data/dialogue_act2_central.json';
import act5ribbon from '@/quietroads/data/dialogue_act5_ribbon.json';
import act3 from '@/quietroads/data/dialogue_act3.json';
import act4 from '@/quietroads/data/dialogue_act4.json';
import act5 from '@/quietroads/data/dialogue_act5.json';
import act6 from '@/quietroads/data/dialogue_act6.json';
import act6backcountry from '@/quietroads/data/dialogue_act6_backcountry.json';
import act7 from '@/quietroads/data/dialogue_act7.json';
import act8 from '@/quietroads/data/dialogue_act8.json';
import qv1 from '@/quietroads/data/questions_v1.json';
import qv2 from '@/quietroads/data/questions_v2_weak.json';
import qv3 from '@/quietroads/data/questions_v3_routines.json';
import cardsJson from '@/quietroads/data/cards.json';
import { useGameStore } from '@/stores/gameStore';
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import type { Question, Category } from '@/types/quiz';
import { getCurrentSpeedMs, getSmoothedPedals, getLateralSlip, teleportVehicle, scaleCurrentSpeed, haltVehicle, holdDrive, releaseDrive, setDriveBrakeDecel } from '@/systems/VehicleController';
import { DriveSync } from '@/systems/DriveSync';

const CHAPTER_CATEGORY: Record<number, Category> = {
  1: 'washington_laws', 2: 'road_signs', 3: 'right_of_way', 4: 'parking',
  5: 'speed_limits', 6: 'weather', 7: 'sharing_road', 8: 'defensive_driving',
};

class Bridge {
  readonly runner: DialogueRunner;
  readonly sim: Simulation;
  readonly bank: QuestionBank;
  readonly deck: CardDeck;
  private started = false;
  private worldCardReturnPhase: 'driving' | 'walking' = 'driving';
  private cardsSeen = new Set<string>();
  private currentAct: CardAct = 'I';
  private seat = new KnowledgeSeat();
  /** Fired on the next idle, after the study-set line has been read. */
  private pendingAfterStudy: string | null = null;
  private seatAfter: 'study' | 'week' | null = null;
  private pendingQuiz: { trigger: string; at: number } | null = null;
  private activeQuiz: { q: CoreQuestion; shownAt: number; options: string[] } | null = null;
  private quizCooldownUntil = 0;
  private timers = new Set<number>();
  private clock = 0;

  constructor() {
    this.runner = new DialogueRunner(this.host());
    for (const a of [act01, act2, act2central, act3, act5ribbon, act4, act5, act6, act6backcountry, act7, act8]) this.runner.load(structuredClone(a) as unknown as DialogueFile);
    this.bank = new QuestionBank().load(qv1 as never).load(qv2 as never).load(qv3 as never);
    this.deck = new CardDeck().load(cardsJson as unknown as Card[]);
    this.sim = new Simulation({
      fire: (e, d) => this.fire(e, d),
      requestQuiz: (trigger, delayS) => { this.pendingQuiz = { trigger, at: this.clock + delayS }; },
      setObjective: (t) => useQRHud.getState().setTransient({ objective: t }),
      toast: (t) => this.toast(t),
      placeVehicle: (p, h) => teleportVehicle(p.x, p.y, h),
    });
    this.subscribeRunner();
  }

  // ---------------------------------------------------------------- host
  private host(): DialogueHost {
    const S = () => useQRStore.getState();
    return {
      getVar: (n) => (n in S().vars ? S().vars[n] : NaN),
      setVar: (n, v) => S().setVar(n, v),
      addVar: (n, d) => S().addVar(n, d),
      getFlag: (n) => S().flags[n],
      setFlag: (n, v) => S().setFlag(n, v),
      hasItem: (id) => S().items.includes(id),
      giveItem: (id) => S().giveItem(id),
      unlock: (id) => S().unlock(id),
      emitNoise: (db, marker) => {
        const pos = marker && this.sim.map.markers[marker] ? this.sim.map.markers[marker] : this.sim.playerPos;
        this.sim.noise.emit(db, pos, this.sim.playerZone);
      },
      playSfx: () => {},                         // AudioManager hook-up is a later pass
      animCue: () => {},
      checkpoint: (label) => S().setCheckpoint(label, this.runner.scene?.id ?? null, this.runner.serialize()),
      ledger: (delta, reason) => S().addLedger(delta, reason),
      logEvent: (name) => {
        useQRHud.getState().addTelemetry({ ts: Date.now(), event: name });
        if (name === 'choice.dol:honk') this.sim.escapeForgiving = true;   // the script says she gets out
      },
      logChoice: (scene, node, option) => S().addChoice({ ts: Date.now(), scene, node, option }),
      startGameplay: (id) => this.startGameplay(id),
      setTimer: (ms, fn) => { const h = window.setTimeout(() => { this.timers.delete(h); fn(); }, ms); this.timers.add(h); return h as TimerHandle; },
      clearTimer: (h) => { window.clearTimeout(h as number); this.timers.delete(h as number); },
      now: () => performance.now(),
      random: () => Math.random(),
    };
  }

  private subscribeRunner() {
    const T = (p: Parameters<ReturnType<typeof useQRHud.getState>['setTransient']>[0]) => useQRHud.getState().setTransient(p);
    this.runner.on('line_shown', (l) => T({ line: l, direction: null }));
    this.runner.on('direction_shown', (node, id) => T({ direction: { node, id }, line: null }));
    this.runner.on('choice_shown', (node, options) => T({ choices: { node, options: options ?? [] } }));
    this.runner.on('choice_hidden', () => T({ choices: null }));
    this.runner.on('idle', () => {
      T({ line: null, direction: null, choices: null });
      if (this.pendingAfterStudy) {
        const ev = this.pendingAfterStudy;
        this.pendingAfterStudy = null;
        this.fire(ev);
      }
    });
    this.runner.on('card_shown', (id) => this.showCard(id, 'story'));
    this.runner.on('scene_started', (id) => {
      useQRStore.setState({ sceneId: id });
      this.onSceneStarted(id);
      // Always freeze on scene start. For dialogue / radio / video scenes this
      // is the permanent state until the scene ends. For gameplay scenes the
      // scene entry often has story lines *before* the start_gameplay effect —
      // e.g. "They're in line" in 1.2, Grandma's note in 0.2. The car stays
      // frozen until startGameplay() fires, which calls enterDriving() or
      // enterWalking() and clears the freeze. Scenes whose entry node fires
      // start_gameplay immediately (like 1.1) transition in a single tick.
      this.enterDialogue();
    });
    this.runner.on('scene_finished', (_id, next) => { if (next) this.runner.startScene(next); });
  }

  // ---------------------------------------------------------------- lifecycle
  /** Open a specific act from the title screen. A fresh save, then that act's first scene. */
  startAct(sceneId: string) {
    this.open(sceneId);
  }

  start(fresh = false) {
    this.open(fresh ? null : 'resume');
  }

  private open(which: string | null) {
    const resume = which === 'resume';
    const qr = useQRStore.getState();
    if (!resume) qr.resetQuietRoads();
    for (const [k, v] of Object.entries(useQRStore.getState().placeholders)) this.runner.setPlaceholder(k, v);
    const st = useQRStore.getState();
    if (resume && st.runnerState) this.runner.restore(st.runnerState);
    const sceneId = resume && st.sceneId && this.runner.hasScene(st.sceneId)
      ? st.sceneId
      : (which && which !== 'resume' && this.runner.hasScene(which) ? which : '0.1');
    this.started = true;
    useGameStore.getState().setWorldMode('kent');
    // Kent is portrait. Lock where the browser allows (PWA/fullscreen on Android); elsewhere the HUD asks.
    try { (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('portrait').catch(() => {}); } catch { /* not supported */ }
    this.runner.startScene(sceneId);
  }

  stop() { this.started = false; for (const h of this.timers) window.clearTimeout(h); this.timers.clear(); }
  get isActive() { return this.started; }
  get currentChallenge() { return challengeForAct(this.currentAct); }

  private enterDialogue() { haltVehicle(); this.sim.freeze('dialogue'); useGameStore.getState().setPhase('dialogue'); }
  private enterDriving() { this.sim.unfreeze('dialogue'); releaseDrive(); useGameStore.getState().setPhase('driving'); }
  private enterWalking() { haltVehicle(); this.sim.unfreeze('dialogue'); useGameStore.getState().setPhase('walking'); }

  /** World setup that the dialogue file implies but doesn't spell out. */
  private onSceneStarted(id: string) {
    const g = useGameStore.getState();
    const act = actForScene(id);
    if (act) { this.currentAct = act; this.fire('act.enter', { act }); }
    switch (id) {
      case '1.4':   // aftermath — Grandma's carport, night, engine off
        teleportVehicle(this.sim.map.starts.carport.pos.x, this.sim.map.starts.carport.pos.y, this.sim.map.starts.carport.heading);
        this.sim.enterVehicle();
        useGameStore.setState({ timeOfDay: 'night' });
        break;
      case '1.4b':  // rumor board, next morning
        useGameStore.setState({ timeOfDay: 'day' });
        break;
      case '2.1':
        useGameStore.setState({ timeOfDay: 'day' });
        break;
      default:
        if (g.timeOfDay !== 'day' && id.startsWith('0.')) useGameStore.setState({ timeOfDay: 'day' });
    }
  }

  private startGameplay(id: string) {
    const mAct = actForMission(id);
    if (mAct) this.currentAct = mAct;
    if (id === 'exam_40' || id === 'exam_40_resume' || id === 'exam_40_finalize' || id === 'study_terminal' || id === 'local_loop_week') {
      this.startSeat(id);
      return;
    }
    if (this.sim.startMission(id as MissionId)) {
      const chassis = id === 'mission_central_ledger' ? 'truck'
        : id === 'mission_ribbon_merge' || id.startsWith('convoy_') || id.startsWith('mission_convoy') || id.startsWith('climb_')
          ? 'highway' : 'beetle';
      useGameStore.setState({ chassis });
      if (id === 'straight_night_drive') useGameStore.setState({ timeOfDay: 'night' });
      if (this.sim.mode === 'walker') this.enterWalking(); else this.enterDriving();
      return;
    }
    // Not built yet — say so on screen and hand control back so she can keep driving around Kent.
    this.toast(`"${id}" isn't built yet. Drive around — Kent is open.`);
    this.enterDriving();
  }

  private toast(t: string) {
    useQRHud.getState().setTransient({ toast: t });
    window.setTimeout(() => useQRHud.getState().setTransient({ toast: '' }), 3800);
  }

  private fire(event: string, data?: Record<string, unknown>) {
    useQRHud.getState().addTelemetry({ ts: Date.now(), event, data });
    if (event === 'waypoint.reach:dol_lot_exit') this.sim.escapeForgiving = false;
    if (event === 'mission.fail.swarm') {
      // The windshield fills. Then it clears and she's back at the start.
      useQRHud.getState().setTransient({ scare: 'flood' });
      window.setTimeout(() => useQRHud.getState().setTransient({ scare: 'none' }), 2600);
    }
    if (event === 'dropoff.walk') this.enterWalking();
    if (event === 'waypoint.reach:beetle_driver_seat') {
      // She's in. Doors slam (in the script). Back to the car; the dialogue takes it from here.
      this.sim.enterVehicle();
      useGameStore.getState().setPhase('driving');
    }
    this.runner.onEvent(event);
    this.sim.onEvent(event);
  }

  // ---------------------------------------------------------------- per frame
  private sample(): VehicleSample {
    const g = useGameStore.getState();
    const [x, , z] = g.vehiclePosition;
    // vehicleHeading = atan2(-fx, -fz); forward in XZ = (-sin h, -cos h). Core heading = atan2(fz, fx).
    const fx = -Math.sin(g.vehicleHeading), fz = -Math.cos(g.vehicleHeading);
    // Pedals after the ramp, not the raw pad: a tap is gentle; only a held stab reads as "hard".
    const pedals = getSmoothedPedals();
    return {
      pos: { x, y: z },
      heading: Math.atan2(fz, fx),
      speedMs: getCurrentSpeedMs(),
      throttle: pedals.throttle, brake: pedals.brake, steer: g.steering,
      horn: useQRHud.getState().horn,
      lateralSlip: getLateralSlip(),
    };
  }

  private acc = 0;
  private lastQte = false;
  private lastHudAt = 0;
  tick(dt: number) {
    if (!this.started) return;
    const g = useGameStore.getState();
    // A question stops the clock too, so a timer that was about to fire
    // waits until the car is moving again.
    if (g.phase === 'quiz' || g.phase === 'card') return;
    this.clock += dt;
    // Only simulate while driving/walking; dialogue/quiz/pause freeze the world.
    if (g.phase !== 'driving' && g.phase !== 'walking') return;
    this.acc += Math.min(dt, 0.1);
    let f: SimFrame | null = null;
    if (g.phase === 'walking' && this.sim.mode === 'walker') {
      const hud = useQRHud.getState();
      const input: WalkerInput = { x: g.steering, y: g.brake - g.throttle, run: hud.run };
      while (this.acc >= 1 / 60) { f = this.sim.stepWalker(1 / 60, input); this.acc -= 1 / 60; }
      const w = this.sim.walker;
      useGameStore.setState({ walkerPosition: [w.pos.x, 0, w.pos.y] });
      const qteNow = !!w.qte;
      if (qteNow !== this.lastQte) { this.lastQte = qteNow; hud.setTransient({ qteActive: qteNow }); }
    } else {
      const s = this.sample();
      while (this.acc >= 1 / 60) { f = this.sim.step(1 / 60, s); this.acc -= 1 / 60; }
    }
    // HUD needs ~10 Hz, not 60: every store set re-renders every subscriber.
    if (f && this.clock - this.lastHudAt >= 0.1) { this.lastHudAt = this.clock; useQRHud.getState().setTransient({ frame: f }); }
    this.syncBrake();
    if (this.pendingQuiz && this.clock >= this.pendingQuiz.at) {
      const t = this.pendingQuiz; this.pendingQuiz = null;
      this.openQuiz(t.trigger);
    }
  }

  /** Shadow and pedal share one decel: chassis on dry pavement, ice when the climb says so. */
  private syncBrake() {
    const chassis = useGameStore.getState().chassis;
    const dry = CHASSIS_DECEL[chassis] ?? CHASSIS_DECEL.beetle;
    (VEHICLE as { BRAKE_DECEL_DRY: number }).BRAKE_DECEL_DRY = dry;
    setDriveBrakeDecel(brakeDecel(chassis, this.sim.vehicle.mu));
  }
  onCollision(kind: 'plow' | 'soft' | 'static') { scaleCurrentSpeed(Simulation.collisionSpeedFactor(kind)); }

  // ---------------------------------------------------------------- quizzes
  private openQuiz(trigger: string) {
    if (this.clock < this.quizCooldownUntil || this.activeQuiz) return;
    const g = useGameStore.getState();
    if (g.phase !== 'driving') return;
    // A PINK MENACE card for this hazard beats a plain question. Each card once per run.
    const cardIds = (CARD_FOR_TRIGGER[trigger] ?? []).filter((id) => this.deck.has(id) && !this.cardsSeen.has(id));
    if (cardIds.length) {
      this.quizCooldownUntil = this.clock + 20;
      this.showCard(cardIds[0], 'world');
      this.fire('card.open', { id: cardIds[0], trigger });
      return;
    }
    const mastery = useQRStore.getState().mastery;
    const pool = this.bank.forTrigger(trigger);
    if (!pool.length) return;
    // prefer items not yet mastered; then random
    const ranked = [...pool].sort((a, b) => ((mastery[a.id]?.correct ?? 0) - (mastery[b.id]?.correct ?? 0)) || Math.random() - 0.5);
    const q = ranked[0];
    const options = [...q.choices];
    this.activeQuiz = { q, shownAt: performance.now(), options };
    this.quizCooldownUntil = this.clock + 20;
    holdDrive();
    this.sim.freeze('quiz');
    g.triggerQuiz(this.toGameQuestion(q));
    this.fire('quiz.open', { id: q.id, trigger });
  }

  private toGameQuestion(q: CoreQuestion): Question {
    return {
      id: q.id,
      category: CHAPTER_CATEGORY[q.ch] ?? 'defensive_driving',
      difficulty: q.difficulty === 1 ? 'easy' : q.difficulty === 2 ? 'medium' : 'hard',
      title: q.guide_ref ?? 'Quiet Roads',
      question: q.prompt,
      correctAnswer: q.choices[q.answer],
      wrongAnswers: q.choices.filter((_, i) => i !== q.answer),
      explanation: q.explanation,
      imagePrompt: '',
      imageUrl: null,
      tags: q.tags ?? [],
      waTestFrequency: 'high',
      source: 'quietroads',
    };
  }

  /** QuizOverlay calls this after answerQuiz() for source === 'quietroads'. */
  onQuizAnswered(questionId: string, chosenText: string, correct: boolean) {
    const a = this.activeQuiz; if (!a || a.q.id !== questionId) return;
    const S = useQRStore.getState();
    const now = Date.now();
    const responseMs = performance.now() - a.shownAt;
    const chosen = a.q.choices.indexOf(chosenText);
    const prev = S.mastery[questionId] ?? newMastery(questionId, now);
    const tp = tpForAnswer(a.q, S.mastery[questionId], correct);
    S.setMastery(questionId, sm2Update(prev, gradeQuality(correct, responseMs), now));
    S.addAttempt({ ts: now, question_id: questionId, correct, chosen, response_ms: Math.round(responseMs) });
    if (tp) { S.addVar('trade_points', tp); S.addLedger(tp, `quiz:${questionId}`); }
    this.fire(correct ? 'sign.prompt.correct' : 'sign.prompt.wrong', { id: questionId, ms: Math.round(responseMs) });
    this.activeQuiz = null;
  }

  /** QuizOverlay calls this on Continue. */
  onQuizClosed() { this.sim.unfreeze('quiz'); this.activeQuiz = null; releaseDrive(); }

  // ---------------------------------------------------------------- cards
  private cardShownAt = 0;
  private showCard(id: string, source: 'story' | 'world') {
    const g = useGameStore.getState();
    this.cardShownAt = performance.now();
    if (source === 'world') this.worldCardReturnPhase = g.phase === 'walking' ? 'walking' : 'driving';
    this.cardsSeen.add(id);
    if (g.phase === 'driving') holdDrive();
    else haltVehicle();
    this.sim.freeze('card');
    useQRHud.getState().setTransient({ card: { id, source } });
    g.setPhase('card');
  }

  /** CardOverlay's pick. The server grades and records; the verdict comes back for display. */
  gradeCard(cardId: string, optionId: string | null): Promise<CardGrade | null | 'offline'> {
    const active = useQRHud.getState().card;
    return DriveSync.gradeCard(cardId, optionId, active?.source ?? 'story', this.runner.scene?.id ?? null, performance.now() - this.cardShownAt);
  }

  /** CardOverlay's Continue. Applies the card's consequences and resumes whatever was paused. */
  finishCard(result: CardResult) {
    const active = useQRHud.getState().card;
    useQRHud.getState().setTransient({ card: null });
    this.sim.unfreeze('card');
    releaseDrive();
    if (!active) return;
    if (active.source === 'story') {
      // The runner grades, logs, and moves to the next node; the scene type decides the phase.
      const sceneType = this.runner.scene?.type;
      useGameStore.getState().setPhase(sceneType === 'gameplay' ? (this.sim.mode === 'walker' ? 'walking' : 'driving') : 'dialogue');
      this.runner.resolveCard(result);
    } else {
      // In-world card: same grading as a story card, then back to the road.
      if (result.correct === true) useQRStore.getState().addVar('respect', 2);
      else if (result.correct === false) useQRStore.getState().addVar('respect', -1);
      if (result.noise != null && result.noise > 0) this.sim.noise.emit(DialogueRunner.CARD_NOISE_DB(result.noise), this.sim.playerPos, this.sim.playerZone);
      useQRStore.getState().addChoice({ ts: Date.now(), scene: 'world', node: this.sim.missionId || '-', option: `card:${result.card}:${result.option ?? '-'}` });
      this.fire(result.correct === null ? `card.seen:${result.card}` : result.correct ? `card.correct:${result.card}` : `card.wrong:${result.card}`);
      useGameStore.getState().setPhase(this.worldCardReturnPhase);
    }
  }

  // ---------------------------------------------------------------- Act IV seat
  private masteryMap() {
    const m = new Map<string, MasteryRecord>();
    for (const [k, v] of Object.entries(useQRStore.getState().mastery)) m.set(k, v);
    return m;
  }

  private startSeat(id: string) {
    const now = Date.now();
    if (id === 'exam_40') {
      this.seat.begin('exam', drawExam(this.bank, this.masteryMap(), { now, random: Math.random }));
      this.seatAfter = null;
      useQRHud.getState().setTransient({ objective: 'Forty questions. Thirty-two to pass.' });
      this.presentSeat();
      return;
    }
    if (id === 'exam_40_resume') {
      if (!this.seat.active || !this.seat.currentId) { this.startSeat('exam_40'); return; }
      this.presentSeat();
      return;
    }
    if (id === 'exam_40_finalize') { this.finishExam(true); return; }
    const ids = buildStudySet(this.bank, this.masteryMap(), { now, random: Math.random, size: 10 });
    this.seat.begin('study', ids);
    this.seatAfter = id === 'local_loop_week' ? 'week' : 'study';
    if (id === 'study_terminal' && dueCount(this.bank, this.masteryMap(), now) > 0) this.fire('study.due_pile');
    useQRHud.getState().setTransient({
      objective: id === 'local_loop_week' ? 'A week at the terminal. Then the test again.' : 'One set. Then sleep.',
    });
    this.presentSeat();
  }

  private presentSeat() {
    const qid = this.seat.currentId;
    const q = qid ? this.bank.get(qid) : undefined;
    if (!q) { this.finishSeat(); return; }
    const gq = this.toGameQuestion(q);
    gq.source = this.seat.mode;
    gq.title = this.seat.label;
    this.seat.shownAt = performance.now();
    holdDrive();
    this.sim.freeze('exam');
    useGameStore.getState().triggerQuiz(gq);
  }

  /** QuizOverlay recorded a pick. The question stays up until continueSeat. */
  onExamPicked(questionId: string, chosenText: string, correct: boolean) {
    if (!this.seat.active || this.seat.currentId !== questionId) return;
    const q = this.bank.get(questionId);
    const chosen = q ? q.choices.indexOf(chosenText) : -1;
    const responseMs = performance.now() - this.seat.shownAt;
    this.seat.note(chosen >= 0 ? chosen : null, responseMs);
    if (this.seat.mode !== 'study' || !q) return;
    for (const ev of this.seat.studyFeedback(questionId, correct)) this.fire(ev);
    const S = useQRStore.getState();
    const now = Date.now();
    const prev = S.mastery[questionId] ?? newMastery(questionId, now);
    S.setMastery(questionId, sm2Update(prev, gradeQuality(correct, responseMs), now));
  }

  continueSeat() {
    if (!this.seat.active) return;
    if (this.seat.advance()) this.finishSeat();
    else this.presentSeat();
  }

  abandonExam() {
    if (this.seat.mode !== 'exam' || !this.seat.active) return;
    this.sim.unfreeze('exam');
    useGameStore.setState({ quizActive: false, currentQuestion: null, phase: 'dialogue' });
    this.fire('exam.abandon');
  }

  private finishSeat() {
    if (this.seat.mode === 'exam') this.finishExam(false);
    else this.finishStudy();
  }

  private finishExam(quit: boolean) {
    const answers = quit ? this.seat.fillBlanks() : this.seat.answers;
    this.seat.close();
    const result = scoreExam(this.bank, answers, this.masteryMap());
    const verdict = quit ? { event: 'exam.fail' as const, giveRelay: false } : examVerdict(result);
    const S = useQRStore.getState();
    S.setVar('exam_score', result.exam_score);
    S.setVar('exam_missed', result.exam_missed);
    S.setVar('exam_short', result.exam_short);
    S.setVar('exam_weak_chapter', result.exam_weak_chapter);
    if (verdict.giveRelay) S.giveItem('relay_kit');
    this.sim.unfreeze('exam');
    useGameStore.setState({ quizActive: false, currentQuestion: null, phase: 'dialogue' });
    useQRHud.getState().setTransient({
      objective: verdict.giveRelay ? 'Permit stamped. The relay kit is in the car.' : 'Not yet. The kit stays.',
    });
    this.fire(verdict.event);
  }

  private finishStudy() {
    const week = this.seatAfter === 'week';
    this.seat.close();
    this.seatAfter = null;
    this.sim.unfreeze('exam');
    useGameStore.setState({ quizActive: false, currentQuestion: null, phase: 'dialogue' });
    if (week) { this.fire('week.elapsed'); return; }
    this.pendingAfterStudy = 'study.close';
    this.fire('study.set_complete');
  }

  // ---------------------------------------------------------------- UI actions
  shh() { this.sim.interior.answerQte(); }
  tap() { this.runner.advanceFromUi(); }
  choose(id: string) { this.runner.chooseById(id); }
  restartFromCheckpoint() {
    const st = useQRStore.getState();
    if (st.runnerState) this.runner.restore(st.runnerState);
    this.runner.startScene(st.sceneId && this.runner.hasScene(st.sceneId) ? st.sceneId : '0.1');
  }
}

export const QuietRoads = new Bridge();
