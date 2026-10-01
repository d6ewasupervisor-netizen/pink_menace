/**
 * Act IV knowledge-gate correctness: the forty-question exam grades a pass at
 * 32/40 and holds the relay kit on a fail. This is the one act whose "mission"
 * is the exam rather than a road — lock its grading the same way the road
 * graders are locked.
 */
import { describe, expect, it } from "vitest";
import { QuestionBank, EXAM, scoreExam, type ExamAnswer } from "../src/quietroads/study";
import { KnowledgeSeat, examVerdict } from "../src/quietroads/study/seat";

function bank(count = 40): QuestionBank {
  const b = new QuestionBank();
  b.load({
    meta: { schema_version: "1.0.0", bank: "test" },
    questions: Array.from({ length: count }, (_, i) => ({
      id: `q${i}`,
      ch: (i % 5) + 1, // chapters 1..5
      difficulty: 1 as const,
      prompt: `question ${i}`,
      choices: ["a", "b", "c", "d"],
      answer: 0,
      explanation: "",
    })),
  });
  return b;
}

function answers(b: QuestionBank, correct: number): ExamAnswer[] {
  return b.all().map((q, i) => ({
    question_id: q.id,
    chosen: i < correct ? 0 : 1, // answer is index 0; wrong = 1
    response_ms: 1000,
  }));
}

describe("Act IV exam gate", () => {
  it("EXAM gate is 40 questions, 32 to pass", () => {
    expect(EXAM.questions).toBe(40);
    expect(EXAM.required).toBe(32);
  });

  it("scores a 32/40 pass and stamps the relay kit", () => {
    const b = bank();
    const result = scoreExam(b, answers(b, 32), new Map());
    expect(result.passed).toBe(true);
    expect(result.exam_score).toBe(32);
    expect(result.exam_missed).toBe(8);
    expect(result.exam_short).toBe(0);
    expect(examVerdict(result)).toEqual({ event: "exam.pass", giveRelay: true });
  });

  it("scores a fail, reports the shortfall and the weak chapter, and holds the kit", () => {
    const b = bank();
    const result = scoreExam(b, answers(b, 31), new Map());
    expect(result.passed).toBe(false);
    expect(result.exam_short).toBe(1);
    expect(result.exam_weak_chapter).toBeGreaterThan(0);
    expect(examVerdict(result)).toEqual({ event: "exam.fail", giveRelay: false });
  });

  it("fillBlanks turns unanswered questions into misses (standing up)", () => {
    const seat = new KnowledgeSeat();
    seat.begin("exam", ["q0", "q1", "q2"]);
    seat.note(0, 900); // answered q0 only
    const filled = seat.fillBlanks();
    expect(filled).toHaveLength(3);
    expect(filled.filter((a) => a.chosen === null).map((a) => a.question_id)).toEqual(["q1", "q2"]);
  });
});