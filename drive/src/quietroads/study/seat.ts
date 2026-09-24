import type { ExamAnswer, ExamResult } from "./index";

export type SeatMode = "exam" | "study";

/**
 * The Act IV knowledge seat: one question at a time, either the 40-question
 * gate or a 10-question study set. Scoring stays in scoreExam.
 */
export class KnowledgeSeat {
  mode: SeatMode = "exam";
  ids: string[] = [];
  index = 0;
  answers: ExamAnswer[] = [];
  shownAt = 0;
  streak = 0;
  active = false;
  private missed = new Set<string>();

  begin(mode: SeatMode, ids: string[]) {
    this.mode = mode;
    this.ids = ids;
    this.index = 0;
    this.answers = [];
    this.streak = 0;
    this.missed.clear();
    this.active = ids.length > 0;
    this.shownAt = 0;
  }

  get currentId(): string | null {
    return this.index < this.ids.length ? this.ids[this.index] : null;
  }

  get label(): string {
    const n = Math.min(this.index + 1, this.ids.length);
    const word = this.mode === "exam" ? "QUESTION" : "SET";
    return `${word} ${n} OF ${this.ids.length}`;
  }

  /** Record the pick for the question on screen. Does not advance. */
  note(chosen: number | null, responseMs: number) {
    const id = this.currentId;
    if (!id) return;
    this.answers = this.answers.filter((a) => a.question_id !== id);
    this.answers.push({ question_id: id, chosen, response_ms: responseMs });
  }

  /** Study barks. The caller knows whether the pick matched the bank. */
  studyFeedback(id: string, correct: boolean): string[] {
    const events: string[] = [];
    if (correct) {
      this.streak++;
      if (this.streak === 5) events.push("study.streak:5");
      if (this.streak === 10) events.push("study.streak:10");
    } else {
      this.streak = 0;
      events.push(this.missed.has(id) ? "study.wrong_repeat" : "study.wrong");
      this.missed.add(id);
    }
    return events;
  }

  advance(): boolean {
    this.index++;
    return this.index >= this.ids.length;
  }

  /** Unanswered questions count as misses. Used when she stands up for good. */
  fillBlanks(): ExamAnswer[] {
    const have = new Set(this.answers.map((a) => a.question_id));
    for (const id of this.ids) {
      if (!have.has(id)) this.answers.push({ question_id: id, chosen: null, response_ms: 0 });
    }
    this.index = this.ids.length;
    this.active = false;
    return this.answers;
  }

  close() { this.active = false; }
}

/** The relay kit leaves with a pass. A fail keeps it on the table. */
export function examVerdict(result: ExamResult): { event: "exam.pass" | "exam.fail"; giveRelay: boolean } {
  return result.passed
    ? { event: "exam.pass", giveRelay: true }
    : { event: "exam.fail", giveRelay: false };
}
