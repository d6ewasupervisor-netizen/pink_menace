/**
 * QuizOverlay — Full-screen quiz modal rendered in the HTML layer
 */
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import { AudioManager } from '@/systems/AudioManager';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { discardDriveHold, releaseDrive } from '@/systems/VehicleController';
import { tokens } from './cockpit/tokens';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizOverlay() {
  const phase = useGameStore((s) => s.phase);
  const worldMode = useGameStore((s) => s.worldMode);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const streak = useGameStore((s) => s.streak);
  const answerQuiz = useGameStore((s) => s.answerQuiz);
  const setPhase = useGameStore((s) => s.setPhase);
  const { recordQuizAnswer } = useGameProgress();

  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; coinsEarned: number } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Shuffle options when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    setSelected(null);
    setResult(null);
    setDismissed(false);
    setOptions(
      shuffleArray([currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers])
    );
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (selected || !currentQuestion) return;
      setSelected(answer);
      const res = answerQuiz(answer);
      setResult(res);
      if (currentQuestion.source === 'quietroads') QuietRoads.onQuizAnswered(currentQuestion.id, answer, res.correct);
      if (currentQuestion.source === 'exam' || currentQuestion.source === 'study') {
        QuietRoads.onExamPicked(currentQuestion.id, answer, res.correct);
      }

      // The answer is in. Put the car and the world back on the moment the
      // question opened, and let that moment run. A wrong answer that ends
      // the run leaves the car where it stopped. The exam stays up so she
      // can read the line and take the next question.
      if (useGameStore.getState().phase === 'gameover') {
        discardDriveHold();
      } else if (currentQuestion.source === 'exam' || currentQuestion.source === 'study') {
        // stay on the seat
      } else if (currentQuestion.source === 'quietroads') {
        QuietRoads.onQuizClosed();
        setPhase('driving');
      } else {
        releaseDrive();
        setPhase('driving');
      }

      // Audio feedback
      if (res.correct) {
        AudioManager.playQuizCorrect();
      } else {
        AudioManager.playQuizWrong();
      }

      // Record to backend (fire and forget)
      recordQuizAnswer(
        currentQuestion.id,
        currentQuestion.category,
        res.correct,
        answer,
        currentQuestion.correctAnswer
      );
    },
    [selected, currentQuestion, answerQuiz, recordQuizAnswer]
  );

  const handleContinue = useCallback(() => {
    if (currentQuestion?.source === 'exam' || currentQuestion?.source === 'study') {
      QuietRoads.continueSeat();
      return;
    }
    setDismissed(true);
    setSelected(null);
    setResult(null);
  }, [currentQuestion]);

  if (dismissed || !currentQuestion) return null;
  if (phase !== 'quiz' && !(result && phase === 'driving')) return null;

  if (result && phase === 'driving') {
    return (
      <div style={styles.dock} data-ui>
        <div style={{ ...styles.result, borderColor: result.correct ? '#39ff14' : '#ff4444', marginBottom: 10 }}>
          <div style={{ ...styles.verdict, color: result.correct ? '#39ff14' : '#ff4444' }}>
            {result.correct ? 'CORRECT' : 'WRONG'}
          </div>
          {result.correct ? (
            <p style={styles.resultText}>+{result.coinsEarned} Z-Coins</p>
          ) : (
            <>
              {worldMode !== 'kent' && <p style={{ ...styles.resultText, color: '#ff9a9a' }}>−10 HP</p>}
              {currentQuestion.explanation && (
                <p style={styles.explanation}>{currentQuestion.explanation}</p>
              )}
            </>
          )}
        </div>
        <button data-ui style={styles.continueBtn} onClick={handleContinue}>
          CONTINUE
        </button>
      </div>
    );
  }

  const categoryLabel = currentQuestion.category.replace(/_/g, ' ').toUpperCase();

  return (
    // Full-screen portrait card — matches CardOverlay so every prompt feels
    // like a proper card, not a floating modal chop.
    <div data-ui style={styles.wrap}>
      <div style={styles.scroll}>
        {/* Kicker bar — category + streak */}
        <div style={styles.kicker}>
          <span style={styles.categoryBadge}>
            {currentQuestion.source === 'exam' || currentQuestion.source === 'study' ? currentQuestion.title : categoryLabel}
          </span>
          {currentQuestion.source === 'exam' && (
            <button data-ui style={styles.stand} onClick={() => QuietRoads.abandonExam()}>STAND UP</button>
          )}
          {currentQuestion.source !== 'exam' && streak > 0 && <span style={styles.streakBadge}>🔥 {streak}</span>}
        </div>

        <div style={styles.body}>
          {/* Question */}
          <p style={styles.question}>{currentQuestion.question}</p>

          {/* Answer options — full-width stacked like CardOverlay choices */}
          <div style={styles.options}>
            {options.map((opt, i) => {
              const letter = ['A', 'B', 'C', 'D'][i] ?? String(i + 1);
              let borderColor = 'rgba(255,255,255,0.22)';
              let bg = 'rgba(255,255,255,0.05)';
              if (selected === opt) {
                borderColor = result?.correct ? '#39ff14' : '#ff4444';
                bg = result?.correct ? 'rgba(57,255,20,0.12)' : 'rgba(255,68,68,0.12)';
              } else if (selected && opt === currentQuestion.correctAnswer) {
                borderColor = '#39ff14';
                bg = 'rgba(57,255,20,0.08)';
              }
              return (
                <button
                  key={opt}
                  data-ui
                  disabled={!!selected}
                  style={{ ...styles.option, borderColor, background: bg }}
                  onClick={() => handleAnswer(opt)}
                >
                  <span style={styles.optionId}>{letter}</span>
                  <span style={{ lineHeight: 1.35 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {result && (
            <div style={{ ...styles.result, borderColor: result.correct ? '#39ff14' : '#ff4444' }}>
              <div style={{ ...styles.verdict, color: result.correct ? '#39ff14' : '#ff4444' }}>
                {result.correct ? 'CORRECT' : 'WRONG'}
              </div>
              {currentQuestion.source === 'exam' || currentQuestion.source === 'study' ? (
                currentQuestion.explanation && <p style={styles.explanation}>{currentQuestion.explanation}</p>
              ) : result.correct ? (
                <p style={styles.resultText}>+{result.coinsEarned} Z-Coins</p>
              ) : (
                <>
                  <p style={{ ...styles.resultText, color: '#ff9a9a' }}>−10 HP</p>
                  {currentQuestion.explanation && (
                    <p style={styles.explanation}>{currentQuestion.explanation}</p>
                  )}
                </>
              )}
            </div>
          )}

          {result && (
            <button data-ui style={styles.continueBtn} onClick={handleContinue}>
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // In-cockpit decision sheet — the world stays visible behind it (same voice
  // as CardOverlay). Exams/study ride the same surface; Act IV's terminal is the scene.
  wrap: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(7,8,12,0.78)',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'auto',
    fontFamily: tokens.fonts.ui,
    color: tokens.colors.ink,
  },
  scroll: {
    position: 'absolute', inset: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  kicker: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'calc(14px + env(safe-area-inset-top)) 18px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  categoryBadge: {
    background: '#39ff14',
    color: '#0a0a0a',
    borderRadius: '4px',
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  stand: {
    background: 'transparent',
    color: '#e8e6e1',
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  streakBadge: {
    color: '#ff6b6b',
    fontSize: '14px',
    fontWeight: 700,
  },
  body: {
    padding: '18px 18px calc(28px + env(safe-area-inset-bottom))',
  },
  question: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.45,
    color: '#fff',
    margin: '0 0 20px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 18,
  },
  option: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    textAlign: 'left',
    color: '#fff',
    border: '1px solid',
    borderRadius: 10,
    padding: '13px 14px',
    fontSize: '16px',
    cursor: 'pointer',
    minHeight: 54,
    transition: 'background 0.15s, border-color 0.15s',
  },
  optionId: {
    flex: '0 0 auto',
    width: 26,
    height: 26,
    borderRadius: 13,
    background: 'rgba(242,141,178,0.22)',
    color: '#F28DB2',
    fontSize: 13,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  result: {
    border: '1px solid',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 14,
    background: 'rgba(255,255,255,0.03)',
  },
  verdict: {
    fontSize: 12,
    letterSpacing: '0.2em',
    fontWeight: 800,
    marginBottom: 6,
  },
  resultText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  explanation: {
    marginTop: 8,
    fontSize: '14px',
    color: '#aab',
    lineHeight: 1.45,
  },
  dock: {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(16px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    width: 'min(420px, calc(100vw - 24px))',
    zIndex: 100,
    pointerEvents: 'auto',
    fontFamily: tokens.fonts.ui,
    color: tokens.colors.ink,
    background: tokens.colors.panel,
    border: `1px solid ${tokens.colors.stroke}`,
    borderRadius: tokens.radius.lg,
    padding: 14,
  },
  continueBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    background: '#F28DB2',
    color: '#1a0a12',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
};
