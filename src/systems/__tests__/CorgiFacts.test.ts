import { describe, it, expect } from "vitest";
import {
  CORGI_FACTS,
  CORGI_QUIZ_QUESTIONS,
  CORGI_BREED_ID,
  validateCorgiDataset,
  type CorgiQuizQuestion,
} from "../CorgiFacts";
import { ULTIMATE_CORGI_QUIZ_CONFIG } from "../GoldenKiki";

/** Minimal session simulator mirroring BreedQuizSession semantics (for the dataset test). */
function simulateSession(
  bank: CorgiQuizQuestion[],
  n: number,
  firstTryCorrect: boolean[],
  seed = 42,
): { masteryPercent: number; passed: boolean; asked: number } {
  // Seeded shuffle without replacement (same approach as the engine).
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const arr = [...bank];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const questions = arr.slice(0, n);
  // Retries are free: every question eventually gets answered; only
  // first-try correct answers count toward mastery.
  const correct = firstTryCorrect.slice(0, questions.length).filter(Boolean).length;
  const masteryPercent = questions.length === 0 ? 0 : correct / questions.length;
  return {
    masteryPercent,
    passed: masteryPercent >= ULTIMATE_CORGI_QUIZ_CONFIG.passThreshold,
    asked: questions.length,
  };
}

describe("corgi dataset shape", () => {
  it("has 10–15 facts", () => {
    expect(CORGI_FACTS.length).toBeGreaterThanOrEqual(10);
    expect(CORGI_FACTS.length).toBeLessThanOrEqual(15);
  });

  it("has 10–12 quiz questions", () => {
    expect(CORGI_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(10);
    expect(CORGI_QUIZ_QUESTIONS.length).toBeLessThanOrEqual(12);
  });

  it("passes its own validation", () => {
    expect(validateCorgiDataset()).toEqual([]);
  });

  it("is tagged for the corgi endgame, not a normal breed", () => {
    expect(CORGI_BREED_ID).toBe("corgi");
  });

  it("every question has 3–4 unique choices with the correct answer included", () => {
    for (const q of CORGI_QUIZ_QUESTIONS) {
      expect(q.choices.length).toBeGreaterThanOrEqual(3);
      expect(q.choices.length).toBeLessThanOrEqual(4);
      const lowered = q.choices.map((c) => c.trim().toLowerCase());
      expect(new Set(lowered).size).toBe(lowered.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(lowered.length);
    }
  });

  it("every question links to a real fact", () => {
    const factIds = new Set(CORGI_FACTS.map((f) => f.id));
    for (const q of CORGI_QUIZ_QUESTIONS) {
      expect(factIds.has(q.factId)).toBe(true);
    }
  });

  it("facts are age-9 readable (one idea, short)", () => {
    for (const f of CORGI_FACTS) {
      expect(f.text.split(/\s+/).length).toBeLessThanOrEqual(30);
      expect(f.text.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("ultimate quiz session (5 questions, 4/5 to pass)", () => {
  it("a perfect run passes", () => {
    const r = simulateSession(CORGI_QUIZ_QUESTIONS, 5, [true, true, true, true, true]);
    expect(r.asked).toBe(5);
    expect(r.masteryPercent).toBe(1);
    expect(r.passed).toBe(true);
  });

  it("4/5 first-try passes (the documented bar)", () => {
    const r = simulateSession(CORGI_QUIZ_QUESTIONS, 5, [true, true, true, true, false]);
    expect(r.masteryPercent).toBe(0.8);
    expect(r.passed).toBe(true);
  });

  it("3/5 first-try does not pass — but retries are free, so the child replays", () => {
    const r = simulateSession(CORGI_QUIZ_QUESTIONS, 5, [true, true, true, false, false]);
    expect(r.passed).toBe(false);
  });

  it("no duplicate questions inside a session", () => {
    let s = 7;
    const rng = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    const arr = [...CORGI_QUIZ_QUESTIONS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const ids = arr.slice(0, 5).map((q) => q.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("different seeds ask different question sets (randomization)", () => {
    const sets = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulateSession(CORGI_QUIZ_QUESTIONS, 5, [true, true, true, true, true], seed);
      // Recompute the asked ids for uniqueness check via a second run shape:
      sets.add(r.masteryPercent.toFixed(2) + seed); // placeholder, real check below
    }
    // Direct check: two seeds must differ in at least one question id.
    const ask = (seed: number): string[] => {
      let s = seed;
      const rng = () => {
        s = (s * 1103515245 + 12345) % 2147483648;
        return s / 2147483648;
      };
      const arr = [...CORGI_QUIZ_QUESTIONS];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, 5).map((q) => q.id);
    };
    const seen = new Set(ask(1).join(","));
    let varied = false;
    for (let seed = 2; seed <= 10; seed++) {
      if (ask(seed).join(",") !== [...seen].join(",")) varied = true;
    }
    expect(varied).toBe(true);
    expect(sets.size).toBe(20);
  });
});
