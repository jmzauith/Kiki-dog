import { describe, it, expect } from "vitest";
import { validateBreedProfile } from "../BreedFacts";
import {
  validateQuestionBank,
  BreedQuizSession,
  BreedKnowledgeProgress,
  saveQuizProgress,
  loadQuizProgress,
  memoryStore,
  type QuizMasteryResult,
} from "../BreedQuiz";
import {
  HUSKY_PROFILE,
  HUSKY_QUESTIONS,
  HUSKY_QUIZ_KEY,
} from "../HuskyFacts";
// Integration: the REAL reward model consumes the quiz hook. The shipped
// quiz modules never import it — only this test wires the two together,
// proving the handoff contract works end to end.
import {
  BreedRewardState,
  type BreedRewardDefinition,
} from "../BreedRewards";

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

/** Play a full session; wrongOnce makes every question miss once first. */
function playSession(wrongOnce: boolean, seed = 5): QuizMasteryResult {
  const s = new BreedQuizSession("husky", HUSKY_QUESTIONS, {
    questionsPerSession: 4,
    rng: seededRng(seed),
  });
  while (!s.isComplete) {
    const q = s.currentQuestion!;
    if (wrongOnce) {
      s.answer((q.correctIndex + 1) % q.choices.length);
    }
    s.answer(q.correctIndex);
  }
  return s.finish();
}

describe("Husky reference dataset", () => {
  it("has 8–12 facts with valid shape", () => {
    expect(HUSKY_PROFILE.facts.length).toBeGreaterThanOrEqual(8);
    expect(HUSKY_PROFILE.facts.length).toBeLessThanOrEqual(12);
    expect(validateBreedProfile(HUSKY_PROFILE)).toEqual([]);
  });

  it("has 6–10 questions, all valid", () => {
    expect(HUSKY_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    expect(HUSKY_QUESTIONS.length).toBeLessThanOrEqual(10);
    expect(
      validateQuestionBank("husky", HUSKY_QUESTIONS, HUSKY_PROFILE.facts),
    ).toEqual([]);
  });

  it("every question links to a real fact", () => {
    const factIds = new Set(HUSKY_PROFILE.facts.map((f) => f.id));
    for (const q of HUSKY_QUESTIONS) {
      expect(factIds.has(q.factId)).toBe(true);
    }
  });

  it("correct answer is always one of the (unique) choices", () => {
    for (const q of HUSKY_QUESTIONS) {
      expect(q.choices[q.correctIndex]).toBeTruthy();
      const lowered = q.choices.map((c) => c.trim().toLowerCase());
      expect(new Set(lowered).size).toBe(q.choices.length);
    }
  });

  it("facts use child-friendly wording (short, plain)", () => {
    for (const f of HUSKY_PROFILE.facts) {
      const words = f.text.trim().split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(30);
      expect(f.text).not.toMatch(/[;:]/); // one idea per fact
    }
  });
});

describe("Husky quiz sessions", () => {
  it("a normal session asks 3–5 questions", () => {
    for (const n of [3, 4, 5]) {
      const s = new BreedQuizSession("husky", HUSKY_QUESTIONS, {
        questionsPerSession: n,
        rng: seededRng(n),
      });
      expect(s.questions).toHaveLength(n);
    }
  });

  it("perfect playthrough: 100% mastery", () => {
    const r = playSession(false);
    expect(r.questionsAttempted).toBe(4);
    expect(r.masteryPercent).toBe(1);
    expect(r.quizMastered).toBe(true);
  });

  it("all-retry playthrough: completes freely, mastery reflects first tries", () => {
    const r = playSession(true);
    expect(r.questionsAttempted).toBe(4);
    expect(r.masteryPercent).toBe(0);
    expect(r.quizMastered).toBe(false);
    // ...but the child still finished — nothing was taken away.
    expect(r.totalAttempts).toBe(8);
  });

  it("sessions vary across seeds (no fixed quiz)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const s = new BreedQuizSession("husky", HUSKY_QUESTIONS, {
        questionsPerSession: 4,
        rng: seededRng(i),
      });
      seen.add(s.questions.map((q) => q.id).join("|"));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("knowledge progress accumulates across sessions and persists", () => {
    const store = memoryStore();
    const p = new BreedKnowledgeProgress("husky");
    for (const f of HUSKY_PROFILE.facts.slice(0, 5)) p.recordFactSeen(f.id);
    p.recordSession(playSession(true, 11)); // 0% first
    p.recordSession(playSession(false, 12)); // 100% later
    expect(p.sessionsCompleted).toBe(2);
    expect(p.bestMastery).toBe(1);
    expect(p.factsSeen.size).toBe(5);
    expect(saveQuizProgress(HUSKY_QUIZ_KEY, p, store)).toBe(true);
    const loaded = loadQuizProgress(HUSKY_QUIZ_KEY, "husky", store)!;
    expect(loaded.bestMastery).toBe(1);
    expect(loaded.sessionsCompleted).toBe(2);
  });
});

describe("reward-system integration (real BreedRewardState)", () => {
  const def: BreedRewardDefinition = {
    breedId: "husky",
    breedName: "Siberian Husky",
    stickerName: "Husky",
    goldenStickerName: "Golden Husky",
    requiredAlways: ["broken-bridge"],
    requiredByRoute: { safe: ["frozen-lake"], challenge: ["ice-cave"] },
    secrets: [],
    bonusChallenges: [],
    points: {
      challengeMathSuccessPoints: 1,
      challengeMathSuccessCap: 3,
      turboSuccessPoints: 1,
      turboSuccessCap: 3,
      quizMaxPoints: 3,
      replayPoints: 1,
      replayCap: 2,
    },
    goldenThreshold: 8,
  };

  it("quiz mastery flows into golden points via recordQuizMastery", () => {
    const rewards = new BreedRewardState(def);
    const result = playSession(false); // 100%
    // Lennon wires exactly this one line — no changes to BreedRewards needed.
    const unlock = rewards.recordQuizMastery(result.masteryPercent);
    expect(rewards.quizMastery).toBe(1);
    expect(unlock.masteryPoints).toBe(3); // quizMaxPoints * 1.0
  });

  it("a weak quiz run contributes proportionally less (and best-only keeps the best)", () => {
    const rewards = new BreedRewardState(def);
    rewards.recordQuizMastery(0.5);
    expect(rewards.masteryPoints()).toBe(2); // round(3 * 0.5)
    rewards.recordQuizMastery(1);
    expect(rewards.quizMastery).toBe(1);
    rewards.recordQuizMastery(0.25); // worse replay never reduces
    expect(rewards.quizMastery).toBe(1);
  });

  it("quiz alone can never unlock the golden sticker early", () => {
    const rewards = new BreedRewardState(def);
    const result = playSession(false);
    const unlock = rewards.recordQuizMastery(result.masteryPercent);
    // Normal sticker not earned (no adventure/race) -> golden stays locked.
    expect(unlock.goldenSticker).toBe("locked");
    expect(rewards.goldenStickerUnlocked).toBe(false);
  });
});
