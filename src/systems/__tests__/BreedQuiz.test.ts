import { describe, it, expect } from "vitest";
import {
  validateQuestion,
  validateQuestionBank,
  assertValidQuestionBank,
  makeQuestionFromFact,
  BreedQuizSession,
  BreedKnowledgeProgress,
  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress,
  memoryStore,
  type BreedQuizQuestion,
  type QuizMasteryResult,
} from "../BreedQuiz";
import type { BreedFact } from "../BreedFacts";

/** Deterministic RNG (mulberry32) for repeatable tests. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const goodQuestion = (over: Partial<BreedQuizQuestion> = {}): BreedQuizQuestion => ({
  id: "q1",
  factId: "f1",
  prompt: "What is true?",
  choices: ["Right answer", "Wrong one", "Wrong two"],
  correctIndex: 0,
  ...over,
});

const bankOf = (n: number): BreedQuizQuestion[] =>
  Array.from({ length: n }, (_, i) =>
    goodQuestion({
      id: `q${i}`,
      factId: `f${i}`,
      prompt: `Question ${i}?`,
      choices: [`Correct ${i}`, `Wrong ${i}a`, `Wrong ${i}b`],
      correctIndex: 0,
    }),
  );

/** Answer every question correctly on the first tap. */
function perfectRun(session: BreedQuizSession): QuizMasteryResult {
  while (!session.isComplete) {
    const q = session.currentQuestion!;
    session.answer(q.correctIndex);
  }
  return session.finish();
}

/** Answer every question wrong once, then correctly (free retry). */
function retryRun(session: BreedQuizSession): QuizMasteryResult {
  while (!session.isComplete) {
    const q = session.currentQuestion!;
    const wrong = (q.correctIndex + 1) % q.choices.length;
    const r1 = session.answer(wrong);
    expect(r1.correct).toBe(false);
    expect(r1.questionDone).toBe(false);
    expect(session.currentQuestion?.id).toBe(q.id); // stays open for retry
    const r2 = session.answer(q.correctIndex);
    expect(r2.correct).toBe(true);
  }
  return session.finish();
}

describe("validateQuestion", () => {
  it("accepts a well-formed question", () => {
    expect(validateQuestion(goodQuestion())).toEqual([]);
  });

  it("rejects fewer than 3 choices", () => {
    const p = validateQuestion(goodQuestion({ choices: ["a", "b"] }));
    expect(p.some((x) => x.includes("3–4 choices"))).toBe(true);
  });

  it("rejects more than 4 choices", () => {
    const p = validateQuestion(
      goodQuestion({ choices: ["a", "b", "c", "d", "e"] }),
    );
    expect(p.some((x) => x.includes("3–4 choices"))).toBe(true);
  });

  it("rejects duplicate choices (case-insensitive)", () => {
    const p = validateQuestion(
      goodQuestion({ choices: ["Same", "same ", "Other"] }),
    );
    expect(p.some((x) => x.includes("duplicate choice"))).toBe(true);
  });

  it("rejects empty choices", () => {
    const p = validateQuestion(goodQuestion({ choices: ["ok", "  ", "fine"] }));
    expect(p.some((x) => x.includes("empty choice"))).toBe(true);
  });

  it("rejects out-of-range correctIndex", () => {
    expect(
      validateQuestion(goodQuestion({ correctIndex: 5 })).length,
    ).toBeGreaterThan(0);
    expect(
      validateQuestion(goodQuestion({ correctIndex: -1 })).length,
    ).toBeGreaterThan(0);
  });

  it("rejects empty prompt", () => {
    expect(
      validateQuestion(goodQuestion({ prompt: "" })).length,
    ).toBeGreaterThan(0);
  });
});

describe("validateQuestionBank", () => {
  it("rejects empty banks", () => {
    expect(validateQuestionBank("b", []).length).toBeGreaterThan(0);
  });

  it("rejects duplicate question ids", () => {
    const p = validateQuestionBank("b", [goodQuestion(), goodQuestion()]);
    expect(p.some((x) => x.includes('duplicate question id "q1"'))).toBe(true);
  });

  it("flags questions referencing unknown facts", () => {
    const facts: BreedFact[] = [{ id: "f1", category: "fun", text: "x" }];
    const p = validateQuestionBank("b", [goodQuestion({ factId: "nope" })], facts);
    expect(p.some((x) => x.includes("unknown fact"))).toBe(true);
  });

  it("assertValidQuestionBank throws readably", () => {
    expect(() => assertValidQuestionBank("b", [])).toThrow(
      /Invalid question bank/,
    );
  });
});

describe("makeQuestionFromFact", () => {
  const fact: BreedFact = { id: "f1", category: "origin", text: "From Siberia." };

  it("builds a valid question with the correct answer included", () => {
    const q = makeQuestionFromFact(
      "q1",
      fact,
      "Where from?",
      "Siberia",
      ["The desert", "The jungle", "The beach"],
      seededRng(1),
    );
    expect(validateQuestion(q)).toEqual([]);
    expect(q.choices[q.correctIndex]).toBe("Siberia");
    expect(q.factId).toBe("f1");
  });

  it("dedupes distractors matching the answer", () => {
    const q = makeQuestionFromFact("q1", fact, "Where?", "Siberia", [
      "siberia",
      "The desert",
      "The jungle",
    ]);
    expect(validateQuestion(q)).toEqual([]);
  });

  it("throws when there are too few distinct distractors", () => {
    expect(() =>
      makeQuestionFromFact("q1", fact, "Where?", "Siberia", ["Only one"]),
    ).toThrow(/at least 2 distinct distractors/);
  });
});

describe("BreedQuizSession selection", () => {
  it("selects questionsPerSession questions with no repeats", () => {
    const s = new BreedQuizSession("b", bankOf(8), {
      questionsPerSession: 4,
      rng: seededRng(7),
    });
    expect(s.questions).toHaveLength(4);
    expect(new Set(s.questions.map((q) => q.id)).size).toBe(4);
  });

  it("clamps questionsPerSession to bank size", () => {
    const s = new BreedQuizSession("b", bankOf(3), { questionsPerSession: 10 });
    expect(s.questions).toHaveLength(3);
  });

  it("randomizes selection (statistical sanity over many sessions)", () => {
    const firsts = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const s = new BreedQuizSession("b", bankOf(8), {
        questionsPerSession: 4,
        rng: seededRng(i),
      });
      firsts.add(s.questions[0].id);
    }
    // With real shuffling, every question leads sometimes.
    expect(firsts.size).toBe(8);
  });

  it("shuffles within-session order too", () => {
    const orders = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const s = new BreedQuizSession("b", bankOf(6), {
        questionsPerSession: 6,
        rng: seededRng(1000 + i),
      });
      orders.add(s.questions.map((q) => q.id).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it("rejects empty banks and bad breed ids", () => {
    expect(() => new BreedQuizSession("b", [])).toThrow();
    expect(() => new BreedQuizSession("", bankOf(3))).toThrow();
  });
});

describe("BreedQuizSession answering", () => {
  it("correct answer advances; progress tracks", () => {
    const s = new BreedQuizSession("b", bankOf(4), { rng: seededRng(3) });
    expect(s.progress).toEqual({ answered: 0, total: 4 });
    const q = s.currentQuestion!;
    const r = s.answer(q.correctIndex);
    expect(r).toEqual({ correct: true, questionDone: true });
    expect(s.progress).toEqual({ answered: 1, total: 4 });
  });

  it("wrong answer keeps the question open for a free retry (no punishment)", () => {
    const s = new BreedQuizSession("b", bankOf(2), { rng: seededRng(3) });
    const q = s.currentQuestion!;
    const wrong = (q.correctIndex + 1) % q.choices.length;
    const r = s.answer(wrong);
    expect(r.correct).toBe(false);
    expect(r.questionDone).toBe(false);
    expect(s.currentQuestion?.id).toBe(q.id);
    expect(s.isComplete).toBe(false);
    // Retry succeeds; session still completable.
    expect(s.answer(q.correctIndex).correct).toBe(true);
  });

  it("rejects out-of-range choice indexes", () => {
    const s = new BreedQuizSession("b", bankOf(2));
    expect(() => s.answer(99)).toThrow(/out of range/);
    expect(() => s.answer(-1)).toThrow(/out of range/);
  });

  it("finish() throws when called early or twice", () => {
    const s = new BreedQuizSession("b", bankOf(2), { rng: seededRng(3) });
    expect(() => s.finish()).toThrow(/early/);
    perfectRun(s);
    expect(() => s.finish()).toThrow(/already called/);
    expect(() => s.answer(0)).toThrow(/no current question/);
  });
});

describe("mastery scoring", () => {
  it("perfect first-try run: 100% and mastered", () => {
    const s = new BreedQuizSession("b", bankOf(4), { rng: seededRng(3) });
    const r = perfectRun(s);
    expect(r.questionsCorrect).toBe(4);
    expect(r.questionsAttempted).toBe(4);
    expect(r.masteryPercent).toBe(1);
    expect(r.quizMastered).toBe(true);
    expect(r.firstTryCorrect).toBe(4);
  });

  it("retry run: finishing is free, but mastery reflects first-try accuracy", () => {
    const s = new BreedQuizSession("b", bankOf(4), { rng: seededRng(3) });
    const r = retryRun(s);
    // Every question eventually answered — no punishment, session completes.
    expect(r.questionsAttempted).toBe(4);
    // But none were right on the first tap.
    expect(r.questionsCorrect).toBe(0);
    expect(r.masteryPercent).toBe(0);
    expect(r.quizMastered).toBe(false);
    expect(r.totalAttempts).toBe(8);
  });

  it("mixed run: partial mastery below threshold is not mastered", () => {
    const s = new BreedQuizSession("b", bankOf(4), {
      rng: seededRng(3),
      masteryThreshold: 0.8,
    });
    // 3 first-try correct, 1 needs a retry -> 75% < 80%.
    let i = 0;
    while (!s.isComplete) {
      const q = s.currentQuestion!;
      if (i < 3) s.answer(q.correctIndex);
      else {
        s.answer((q.correctIndex + 1) % q.choices.length);
        s.answer(q.correctIndex);
      }
      i++;
    }
    const r = s.finish();
    expect(r.masteryPercent).toBeCloseTo(0.75);
    expect(r.quizMastered).toBe(false);
  });

  it("custom threshold is honored and clamped", () => {
    const s = new BreedQuizSession("b", bankOf(4), {
      rng: seededRng(3),
      masteryThreshold: 0.5,
    });
    const r = perfectRun(s);
    expect(r.quizMastered).toBe(true);
    const s2 = new BreedQuizSession("b", bankOf(4), { masteryThreshold: 99 });
    expect(s2.masteryThreshold).toBe(1);
  });

  it("result shape matches the reward-system hook contract", () => {
    const s = new BreedQuizSession("b", bankOf(4), { rng: seededRng(3) });
    const r = perfectRun(s);
    expect(typeof r.quizMastered).toBe("boolean");
    expect(typeof r.questionsCorrect).toBe("number");
    expect(typeof r.questionsAttempted).toBe("number");
    expect(r.masteryPercent).toBeGreaterThanOrEqual(0);
    expect(r.masteryPercent).toBeLessThanOrEqual(1);
  });
});

describe("second breed reuse", () => {
  // A tiny second breed proves the engine is breed-agnostic.
  const corgiBank: BreedQuizQuestion[] = [0, 1, 2, 3].map((i) =>
    goodQuestion({
      id: `corgi-q${i}`,
      factId: `corgi-f${i}`,
      prompt: `Corgi question ${i}?`,
      choices: [`Corgi right ${i}`, `Corgi wrong ${i}a`, `Corgi wrong ${i}b`],
      correctIndex: 2,
    }),
  );

  it("drives an independent breed with its own sessions", () => {
    const s = new BreedQuizSession("corgi", corgiBank, {
      questionsPerSession: 3,
      rng: seededRng(42),
    });
    expect(s.questions).toHaveLength(3);
    expect(s.questions.every((q) => q.id.startsWith("corgi-"))).toBe(true);
    const r = perfectRun(s);
    expect(r.masteryPercent).toBe(1);
  });

  it("progress records are independent per breed", () => {
    const store = memoryStore();
    const husky = new BreedKnowledgeProgress("husky");
    husky.recordFactSeen("husky-origin");
    saveQuizProgress("quiz-husky", husky, store);
    const corgi = new BreedKnowledgeProgress("corgi");
    saveQuizProgress("quiz-corgi", corgi, store);
    const loaded = loadQuizProgress("quiz-husky", "husky", store)!;
    expect(loaded.factsSeen.has("husky-origin")).toBe(true);
    // Wrong breed id against a save -> null (defensive).
    expect(loadQuizProgress("quiz-husky", "corgi", store)).toBeNull();
  });
});

describe("BreedKnowledgeProgress persistence", () => {
  it("round-trips through a store", () => {
    const store = memoryStore();
    const p = new BreedKnowledgeProgress("husky");
    p.recordFactSeen("husky-origin");
    p.recordFactSeen("husky-eyes");
    p.recordSession({
      quizMastered: true,
      questionsCorrect: 4,
      questionsAttempted: 4,
      masteryPercent: 1,
      firstTryCorrect: 4,
      totalAttempts: 4,
    });
    p.recordSession({
      quizMastered: false,
      questionsCorrect: 2,
      questionsAttempted: 4,
      masteryPercent: 0.5,
      firstTryCorrect: 2,
      totalAttempts: 6,
    });
    expect(saveQuizProgress("k", p, store)).toBe(true);
    const loaded = loadQuizProgress("k", "husky", store)!;
    expect(loaded.factsSeen.has("husky-origin")).toBe(true);
    expect(loaded.sessionsCompleted).toBe(2);
    expect(loaded.bestMastery).toBe(1); // best-only, like the reward system
    expect(loaded.totalQuestionsCorrect).toBe(6);
    expect(loaded.totalQuestionsAttempted).toBe(8);
  });

  it("returns null for missing / corrupt / version-mismatch saves", () => {
    const store = memoryStore();
    expect(loadQuizProgress("missing", "husky", store)).toBeNull();
    store.setItem("bad", "{not json");
    expect(loadQuizProgress("bad", "husky", store)).toBeNull();
    store.setItem("v2", JSON.stringify({ version: 99, breedId: "husky" }));
    expect(loadQuizProgress("v2", "husky", store)).toBeNull();
  });

  it("handles malformed fields defensively", () => {
    const store = memoryStore();
    store.setItem(
      "weird",
      JSON.stringify({
        version: 1,
        breedId: "husky",
        factsSeen: ["ok", 42, null],
        sessionsCompleted: "three",
        bestMastery: 5, // clamped to 1
        totalQuestionsCorrect: -2, // clamped to >= 0
      }),
    );
    const loaded = loadQuizProgress("weird", "husky", store)!;
    expect(loaded.factsSeen.has("ok")).toBe(true);
    expect(loaded.factsSeen.size).toBe(1);
    expect(loaded.bestMastery).toBe(1);
    expect(loaded.totalQuestionsCorrect).toBe(0);
  });

  it("reset wipes everything but keeps the breed", () => {
    const p = new BreedKnowledgeProgress("husky");
    p.recordFactSeen("x");
    p.recordSession({
      quizMastered: true,
      questionsCorrect: 4,
      questionsAttempted: 4,
      masteryPercent: 1,
      firstTryCorrect: 4,
      totalAttempts: 4,
    });
    p.reset();
    expect(p.factsSeen.size).toBe(0);
    expect(p.sessionsCompleted).toBe(0);
    expect(p.bestMastery).toBe(0);
    expect(p.breedId).toBe("husky");
  });

  it("clearQuizProgress removes the save; throwing stores degrade gracefully", () => {
    const store = memoryStore();
    const p = new BreedKnowledgeProgress("husky");
    saveQuizProgress("k", p, store);
    clearQuizProgress("k", store);
    expect(loadQuizProgress("k", "husky", store)).toBeNull();
    const throwing: Parameters<typeof saveQuizProgress>[2] = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(saveQuizProgress("k", p, throwing)).toBe(false);
    expect(loadQuizProgress("k", "husky", throwing)).toBeNull();
    expect(() => clearQuizProgress("k", throwing)).not.toThrow();
    expect(saveQuizProgress("k", p, null)).toBe(false);
    expect(loadQuizProgress("k", "husky", null)).toBeNull();
  });

  it("recordSession with a better score updates best; worse does not", () => {
    const p = new BreedKnowledgeProgress("husky");
    const mk = (m: number): QuizMasteryResult => ({
      quizMastered: m >= 0.8,
      questionsCorrect: Math.round(m * 4),
      questionsAttempted: 4,
      masteryPercent: m,
      firstTryCorrect: Math.round(m * 4),
      totalAttempts: 4,
    });
    p.recordSession(mk(0.5));
    p.recordSession(mk(1));
    p.recordSession(mk(0.75));
    expect(p.bestMastery).toBe(1);
    expect(p.sessionsCompleted).toBe(3);
  });
});
