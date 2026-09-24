import assert from "node:assert/strict";
import { QuestionBank, scoreExam, type Question } from "../src/quietroads/study/index";
import { KnowledgeSeat, examVerdict } from "../src/quietroads/study/seat";

function q(id: string, ch: number): Question {
  return { id, ch, difficulty: 1, prompt: id, choices: ["a", "b"], answer: 0, explanation: "because" };
}

const bank = new QuestionBank();
const questions = Array.from({ length: 40 }, (_, i) => q(`q${i}`, (i % 5) + 1));
bank.load({ meta: { schema_version: "1", bank: "t" }, questions });

function answers(correctCount: number) {
  return questions.map((question, i) => ({
    question_id: question.id,
    chosen: i < correctCount ? 0 : 1,
    response_ms: 10,
  }));
}

const pass = scoreExam(bank, answers(32), new Map());
const fail = scoreExam(bank, answers(31), new Map());
assert.equal(pass.passed, true);
assert.equal(pass.exam_score, 32);
assert.equal(examVerdict(pass).giveRelay, true);
assert.equal(examVerdict(pass).event, "exam.pass");
assert.equal(fail.passed, false);
assert.equal(examVerdict(fail).giveRelay, false);
assert.equal(examVerdict(fail).event, "exam.fail");

const seat = new KnowledgeSeat();
seat.begin("exam", questions.map((question) => question.id));
assert.equal(seat.label, "QUESTION 1 OF 40");
seat.note(0, 12);
assert.equal(seat.advance(), false);
seat.note(1, 12);
const blanks = seat.fillBlanks();
assert.equal(blanks.length, 40);
assert.equal(blanks.filter((a) => a.chosen == null).length, 38);
const quit = scoreExam(bank, blanks, new Map());
assert.equal(quit.passed, false);
assert.equal(examVerdict(quit).giveRelay, false);

const study = new KnowledgeSeat();
study.begin("study", ["a", "b"]);
assert.deepEqual(study.studyFeedback("a", false), ["study.wrong"]);
assert.deepEqual(study.studyFeedback("a", false), ["study.wrong_repeat"]);
const streakEvents: string[] = [];
for (let i = 0; i < 5; i++) streakEvents.push(...study.studyFeedback("b", true));
assert.ok(streakEvents.includes("study.streak:5"));

console.log("exam gate ok");
