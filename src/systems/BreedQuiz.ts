/**
 * BreedQuiz — reusable multiple-choice quiz engine for Kiki's Dog Adventure.
 *
 * After a child unlocks a breed sticker, an optional quiz tests the breed
 * facts they just learned. Quiz performance feeds Golden Sticker mastery via
 * the reward system — WITHOUT this module importing it. The handoff is a
 * plain data contract (QuizMasteryResult); Lennon wires one line:
 *
 *   const result = session.finish();
 *   rewardState.recordQuizMastery(result.masteryPercent); // 0..1, best-only
 *
 * Design rules:
 *  - Pure TypeScript, zero imports: every rule is unit-testable and the
 *    module compiles standalone. Adding a future breed never touches this
 *    file — breeds only supply question data (see HuskyFacts.ts).
 *  - Retry without punishment: a wrong answer never subtracts, never locks
 *    the child out, never ends the question. The child keeps trying the
 *    same question until it's right. Persistence beats perfection.
 *  - Idempotent + defensive: malformed question data fails fast at load
 *    (dev), never silently at play time.
 */

import type { BreedFact } from "./BreedFacts";

/** A multiple-choice question about a breed. */
export interface BreedQuizQuestion {
  /** Stable id, unique within the breed's question bank. */
  id: string;
  /** Id of the BreedFact this question tests (traceability for fact cards). */
  factId: string;
  /** The question prompt, ~age 9 wording. */
  prompt: string;
  /** 3–4 answer choices, all unique, correct answer always included. */
  choices: string[];
  /** Index into choices[] of the correct answer. */
  correctIndex: number;
}

export interface QuizSessionConfig {
  /** How many questions per session (default 4). Clamped to bank size. */
  questionsPerSession?: number;
  /** masteryPercent >= this counts as mastered (default 0.8). */
  masteryThreshold?: number;
  /** Random source — inject a seeded function in tests. */
  rng?: () => number;
}

/** One answered attempt, kept for analytics; never punishes. */
export interface QuizAttempt {
  questionId: string;
  choiceIndex: number;
  correct: boolean;
}

/**
 * The clean result the reward system consumes. masteryPercent is 0..1 and
 * is designed to be fed straight into
 * BreedRewardState.recordQuizMastery(masteryPercent) — which clamps and
 * keeps the best score, so replaying a quiz can only ever help.
 *
 * Scoring semantics (deliberate):
 *  - questionsCorrect counts FIRST-TRY correct answers. Retries are free
 *    and unlimited — a wrong tap never subtracts, never locks the child
 *    out, never ends the question — but only first-try answers build
 *    mastery. This is what gives replays a purpose: play again, know more,
 *    score higher. The reward system keeps your best, so there is no
 *    punishment, only improvement.
 */
export interface QuizMasteryResult {
  quizMastered: boolean;
  /** Correct on the first try. */
  questionsCorrect: number;
  /** Questions in the finished session. */
  questionsAttempted: number;
  /** 0..1 — feed directly to the reward system's quizMastery hook. */
  masteryPercent: number;
  /** Same as questionsCorrect — explicit for analytics. */
  firstTryCorrect: number;
  /** Total taps across the session — informational, not used for mastery. */
  totalAttempts: number;
}

// ------------------------------------------------------------ validation

/** Validate one question definition; empty list = valid. */
export function validateQuestion(q: BreedQuizQuestion): string[] {
  const problems: string[] = [];
  if (!q || typeof q !== "object") return ["question is not an object"];
  if (!q.id || typeof q.id !== "string" || q.id.trim() === "") {
    problems.push("question id must be a non-empty string");
  }
  if (!q.prompt || typeof q.prompt !== "string" || q.prompt.trim() === "") {
    problems.push(`question "${q.id}" has empty prompt`);
  }
  if (!Array.isArray(q.choices)) {
    problems.push(`question "${q.id}" choices must be an array`);
    return problems;
  }
  if (q.choices.length < 3 || q.choices.length > 4) {
    problems.push(
      `question "${q.id}" must have 3–4 choices (has ${q.choices.length})`,
    );
  }
  const seen = new Set<string>();
  for (const c of q.choices) {
    if (typeof c !== "string" || c.trim() === "") {
      problems.push(`question "${q.id}" has an empty choice`);
    } else {
      const key = c.trim().toLowerCase();
      if (seen.has(key)) {
        problems.push(`question "${q.id}" has duplicate choice "${c}"`);
      }
      seen.add(key);
    }
  }
  if (
    !Number.isInteger(q.correctIndex) ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.choices.length
  ) {
    problems.push(
      `question "${q.id}" correctIndex ${String(q.correctIndex)} is out of range`,
    );
  }
  return problems;
}

/**
 * Validate a whole question bank: every question valid, ids unique, and
 * every factId resolvable against the breed's facts (warns, not errors,
 * when a fact is missing — the question still works standalone).
 */
export function validateQuestionBank(
  breedId: string,
  questions: BreedQuizQuestion[],
  facts: BreedFact[] = [],
): string[] {
  const problems: string[] = [];
  if (!Array.isArray(questions) || questions.length === 0) {
    return [`breed "${breedId}" question bank must not be empty`];
  }
  const seen = new Set<string>();
  const factIds = new Set(facts.map((f) => f.id));
  for (const q of questions) {
    for (const p of validateQuestion(q)) problems.push(p);
    if (q && typeof q.id === "string") {
      if (seen.has(q.id)) problems.push(`duplicate question id "${q.id}"`);
      seen.add(q.id);
    }
    if (q && q.factId && factIds.size > 0 && !factIds.has(q.factId)) {
      problems.push(
        `question "${q.id}" references unknown fact "${q.factId}"`,
      );
    }
  }
  return problems;
}

/** Fail fast on a bad bank (call once per breed dataset, dev time). */
export function assertValidQuestionBank(
  breedId: string,
  questions: BreedQuizQuestion[],
  facts: BreedFact[] = [],
): void {
  const problems = validateQuestionBank(breedId, questions, facts);
  if (problems.length > 0) {
    throw new Error(
      `Invalid question bank for breed "${breedId}":\n- ${problems.join("\n- ")}`,
    );
  }
}

/**
 * Helper for dataset authors: build a question from a fact plus a pool of
 * distractor strings. The correct answer is inserted at a random position
 * (via rng) so datasets don't accidentally always put it first.
 */
export function makeQuestionFromFact(
  id: string,
  fact: BreedFact,
  prompt: string,
  correctAnswer: string,
  distractors: string[],
  rng: () => number = Math.random,
): BreedQuizQuestion {
  const uniqueDistractors = [...new Set(distractors.map((d) => d.trim()))]
    .filter((d) => d !== "" && d.toLowerCase() !== correctAnswer.trim().toLowerCase())
    .slice(0, 3);
  if (uniqueDistractors.length < 2) {
    throw new Error(
      `makeQuestionFromFact "${id}": need at least 2 distinct distractors`,
    );
  }
  const choices = [...uniqueDistractors, correctAnswer.trim()];
  // Fisher–Yates shuffle so the correct answer isn't always last.
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  const q: BreedQuizQuestion = {
    id,
    factId: fact.id,
    prompt,
    choices,
    correctIndex: choices.indexOf(correctAnswer.trim()),
  };
  const problems = validateQuestion(q);
  if (problems.length > 0) {
    throw new Error(`makeQuestionFromFact "${id}" produced invalid question:\n- ${problems.join("\n- ")}`);
  }
  return q;
}

// ------------------------------------------------------------ session

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One quiz run: N randomly selected questions (no repeats), free retries,
 * no punishment. A session is single-use — start a new one to replay.
 */
export class BreedQuizSession {
  readonly breedId: string;
  /** The questions selected for this session, in presentation order. */
  readonly questions: BreedQuizQuestion[];
  readonly masteryThreshold: number;
  private readonly rng: () => number;
  private index = 0;
  /** questionId -> attempts count (wrong answers keep the question open). */
  private readonly attemptsByQuestion = new Map<string, number>();
  /** questionId set — answered correctly (eventually counts). */
  private readonly correctQuestions = new Set<string>();
  /** questionIds answered correctly on the very first tap. */
  private readonly firstTryCorrect = new Set<string>();
  private readonly attemptLog: QuizAttempt[] = [];
  private finished = false;

  constructor(
    breedId: string,
    bank: BreedQuizQuestion[],
    config: QuizSessionConfig = {},
  ) {
    assertValidQuestionBank(breedId, bank);
    if (!breedId || breedId.trim() === "") {
      throw new Error("BreedQuizSession requires a breedId");
    }
    this.breedId = breedId;
    this.rng = config.rng ?? Math.random;
    const t = config.masteryThreshold;
    this.masteryThreshold =
      typeof t === "number" && Number.isFinite(t)
        ? Math.max(0, Math.min(1, t))
        : 0.8;
    const want = config.questionsPerSession ?? 4;
    const n = Math.max(1, Math.min(bank.length, Math.floor(want) || 4));
    // Sample WITHOUT replacement: no duplicate questions in a session.
    this.questions = shuffle(bank, this.rng).slice(0, n);
  }

  /** The question awaiting an answer (undefined when complete). */
  get currentQuestion(): BreedQuizQuestion | undefined {
    return this.index < this.questions.length
      ? this.questions[this.index]
      : undefined;
  }

  get isComplete(): boolean {
    return this.index >= this.questions.length;
  }

  /** 1-based progress for UI ("Question 2 of 4"). */
  get progress(): { answered: number; total: number } {
    return { answered: this.index, total: this.questions.length };
  }

  /**
   * Answer the current question. A wrong answer is NOT punishment: the
   * question stays open and the child retries freely. Returns whether this
   * tap was correct and whether the question is now done.
   */
  answer(choiceIndex: number): { correct: boolean; questionDone: boolean } {
    const q = this.currentQuestion;
    if (!q || this.finished) {
      throw new Error("answer() called with no current question");
    }
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= q.choices.length) {
      throw new Error(`answer() choiceIndex ${String(choiceIndex)} out of range`);
    }
    const attempts = (this.attemptsByQuestion.get(q.id) ?? 0) + 1;
    this.attemptsByQuestion.set(q.id, attempts);
    const correct = choiceIndex === q.correctIndex;
    this.attemptLog.push({ questionId: q.id, choiceIndex, correct });
    if (correct) {
      if (attempts === 1) this.firstTryCorrect.add(q.id);
      this.correctQuestions.add(q.id);
      this.index++;
      return { correct: true, questionDone: true };
    }
    // Wrong: question stays open for a free retry. Nothing is subtracted,
    // nothing is locked — persistence beats perfection.
    return { correct: false, questionDone: false };
  }

  /** Full attempt log (read-only copy) — for analytics only. */
  get attempts(): QuizAttempt[] {
    return [...this.attemptLog];
  }

  /**
   * Finish the session and produce the mastery result for the reward
   * system. Requires every question answered (a wrong tap never blocks
   * you — retry freely until it's right, so this always terminates for a
   * persistent child). Mastery reflects FIRST-TRY accuracy: retries cost
   * nothing, but only first-try answers count toward masteryPercent.
   * Replay to improve — the reward system keeps your best.
   */
  finish(): QuizMasteryResult {
    if (!this.isComplete) {
      throw new Error(
        `finish() called early: ${this.index}/${this.questions.length} answered`,
      );
    }
    if (this.finished) {
      throw new Error("finish() already called — start a new session to replay");
    }
    this.finished = true;
    const total = this.questions.length;
    const firstTry = this.firstTryCorrect.size;
    const masteryPercent = total === 0 ? 0 : firstTry / total;
    return {
      quizMastered: masteryPercent >= this.masteryThreshold,
      questionsCorrect: firstTry,
      questionsAttempted: total,
      masteryPercent,
      firstTryCorrect: firstTry,
      totalAttempts: this.attemptLog.length,
    };
  }
}

// ------------------------------------------------------------ knowledge progress (persistence)

const QUIZ_SAVE_VERSION = 1;

export interface QuizProgressSaveData {
  version: 1;
  breedId: string;
  /** Fact ids the child has opened/read. */
  factsSeen: string[];
  sessionsCompleted: number;
  /** Best masteryPercent across sessions (0..1) — mirrors reward best-only. */
  bestMastery: number;
  totalQuestionsCorrect: number;
  totalQuestionsAttempted: number;
  savedAt: number;
}

/** Minimal storage interface — structurally identical to the other systems. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Persistent per-breed knowledge record: which facts were seen and how quiz
 * sessions went. Facts + quizzes live here; sticker state lives in the
 * reward system — the two saves coexist and never overwrite each other.
 */
export class BreedKnowledgeProgress {
  readonly breedId: string;
  readonly factsSeen = new Set<string>();
  sessionsCompleted = 0;
  bestMastery = 0;
  totalQuestionsCorrect = 0;
  totalQuestionsAttempted = 0;

  constructor(breedId: string) {
    if (!breedId || breedId.trim() === "") {
      throw new Error("BreedKnowledgeProgress requires a breedId");
    }
    this.breedId = breedId;
  }

  recordFactSeen(factId: string): void {
    if (factId && factId.trim() !== "") this.factsSeen.add(factId);
  }

  /** Fold a finished session's result into the running record. */
  recordSession(result: QuizMasteryResult): void {
    this.sessionsCompleted += 1;
    if (result.masteryPercent > this.bestMastery) {
      this.bestMastery = result.masteryPercent;
    }
    this.totalQuestionsCorrect += result.questionsCorrect;
    this.totalQuestionsAttempted += result.questionsAttempted;
  }

  reset(): void {
    this.factsSeen.clear();
    this.sessionsCompleted = 0;
    this.bestMastery = 0;
    this.totalQuestionsCorrect = 0;
    this.totalQuestionsAttempted = 0;
  }

  toJSON(): QuizProgressSaveData {
    return {
      version: QUIZ_SAVE_VERSION,
      breedId: this.breedId,
      factsSeen: [...this.factsSeen],
      sessionsCompleted: this.sessionsCompleted,
      bestMastery: this.bestMastery,
      totalQuestionsCorrect: this.totalQuestionsCorrect,
      totalQuestionsAttempted: this.totalQuestionsAttempted,
      savedAt: Date.now(),
    };
  }

  static fromJSON(breedId: string, data: QuizProgressSaveData): BreedKnowledgeProgress {
    if (!data || data.version !== QUIZ_SAVE_VERSION || data.breedId !== breedId) {
      throw new Error("Incompatible quiz progress save data");
    }
    const p = new BreedKnowledgeProgress(breedId);
    const strArray = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    for (const id of strArray(data.factsSeen)) p.factsSeen.add(id);
    const num = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    };
    p.sessionsCompleted = Math.floor(num(data.sessionsCompleted));
    const b = num(data.bestMastery);
    p.bestMastery = Math.max(0, Math.min(1, b));
    p.totalQuestionsCorrect = Math.floor(num(data.totalQuestionsCorrect));
    p.totalQuestionsAttempted = Math.floor(num(data.totalQuestionsAttempted));
    return p;
  }
}

function defaultStore(): StorageLike | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* non-browser or blocked storage */
  }
  return null;
}

export function saveQuizProgress(
  key: string,
  progress: BreedKnowledgeProgress,
  store: StorageLike | null = defaultStore(),
): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(progress.toJSON()));
    return true;
  } catch {
    return false;
  }
}

/** Load progress; null on missing/corrupt/version-mismatch/wrong-breed. */
export function loadQuizProgress(
  key: string,
  breedId: string,
  store: StorageLike | null = defaultStore(),
): BreedKnowledgeProgress | null {
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: QuizProgressSaveData;
  try {
    data = JSON.parse(raw) as QuizProgressSaveData;
  } catch {
    return null;
  }
  try {
    return BreedKnowledgeProgress.fromJSON(breedId, data);
  } catch {
    return null;
  }
}

export function clearQuizProgress(
  key: string,
  store: StorageLike | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** In-memory StorageLike for tests (and storage-less environments). */
export function memoryStore(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}
