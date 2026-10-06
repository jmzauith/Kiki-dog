export type MathQuestion = {
  prompt: string;
  answers: number[];
  correct: number;
  difficulty: "normal" | "challenge";
};

const between = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = between(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const uniqueAnswers = (correct: number, candidates: number[]): number[] => {
  const values = [correct, ...candidates].filter((value) => value > 0);
  const unique = [...new Set(values)];

  while (unique.length < 4) {
    const offset = between(2, 12);
    const candidate = Math.max(1, correct + (unique.length % 2 === 0 ? offset : -offset));
    if (!unique.includes(candidate)) unique.push(candidate);
  }

  return shuffle(unique.slice(0, 4));
};

export class MathEngine {
  nextQuestion(difficulty: MathQuestion["difficulty"] = "normal"): MathQuestion {
    const a = difficulty === "challenge" ? between(6, 12) : between(2, 9);
    const b = difficulty === "challenge" ? between(4, 9) : between(2, 9);
    const correct = a * b;

    return {
      prompt: `${a} × ${b} = ?`,
      answers: uniqueAnswers(correct, [
        correct + a,
        correct - b,
        correct + (difficulty === "challenge" ? 10 : 5),
      ]),
      correct,
      difficulty,
    };
  }
}
