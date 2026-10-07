import { describe, expect, it } from "vitest";
import { MathEngine } from "../MathEngine";

const engine = new MathEngine();
const ITERATIONS = 500;

function parsePrompt(prompt: string): { a: number; b: number } {
  const m = prompt.match(/^(\d+) × (\d+) = \?$/);
  expect(m, `prompt format unexpected: ${prompt}`).not.toBeNull();
  return { a: Number(m![1]), b: Number(m![2]) };
}

describe.each(["normal", "challenge"] as const)("MathEngine (%s)", (difficulty) => {
  it("returns exactly 4 answers", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      expect(engine.nextQuestion(difficulty).answers).toHaveLength(4);
    }
  });

  it("answers are unique", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { answers } = engine.nextQuestion(difficulty);
      expect(new Set(answers).size).toBe(4);
    }
  });

  it("contains the correct answer exactly once", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const q = engine.nextQuestion(difficulty);
      expect(q.answers.filter((a) => a === q.correct)).toHaveLength(1);
    }
  });

  it("prompt operands multiply to the correct answer", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const q = engine.nextQuestion(difficulty);
      const { a, b } = parsePrompt(q.prompt);
      expect(a * b).toBe(q.correct);
    }
  });

  it("all answers are positive", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { answers } = engine.nextQuestion(difficulty);
      for (const a of answers) expect(a).toBeGreaterThan(0);
    }
  });

  it("reports the requested difficulty", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      expect(engine.nextQuestion(difficulty).difficulty).toBe(difficulty);
    }
  });
});

describe("MathEngine difficulty ranges", () => {
  it("normal questions use operands 2..9", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { a, b } = parsePrompt(engine.nextQuestion("normal").prompt);
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it("challenge questions use harder operands than normal", () => {
    let normalMax = 0;
    let challengeMin = Infinity;
    for (let i = 0; i < ITERATIONS; i++) {
      const n = parsePrompt(engine.nextQuestion("normal").prompt);
      const c = parsePrompt(engine.nextQuestion("challenge").prompt);
      normalMax = Math.max(normalMax, n.a * n.b);
      challengeMin = Math.min(challengeMin, c.a * c.b);
      expect(c.a).toBeGreaterThanOrEqual(6);
      expect(c.a).toBeLessThanOrEqual(12);
      expect(c.b).toBeGreaterThanOrEqual(4);
      expect(c.b).toBeLessThanOrEqual(9);
    }
    // Challenge products should reach higher than anything normal produces.
    expect(challengeMin).toBeGreaterThanOrEqual(24);
    expect(normalMax).toBeLessThanOrEqual(81);
  });
});
