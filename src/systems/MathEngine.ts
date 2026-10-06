export type MathQuestion = {
  prompt: string;
  answers: number[];
  correct: number;
  difficulty: "normal" | "challenge";
};

const shuffle = <T>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

export class MathEngine {
  nextQuestion(difficulty: MathQuestion["difficulty"] = "normal"): MathQuestion {
    if (difficulty === "challenge") {
      const a = Phaser.Math.Between(6, 12);
      const b = Phaser.Math.Between(4, 9);
      const correct = a * b;
      return {
        prompt: `${a} × ${b} = ?`,
        answers: shuffle([correct, correct + a, Math.max(1, correct - b), correct + 10]),
        correct,
        difficulty,
      };
    }

    const a = Phaser.Math.Between(2, 9);
    const b = Phaser.Math.Between(2, 9);
    const correct = a * b;
    return {
      prompt: `${a} × ${b} = ?`,
      answers: shuffle([correct, correct + a, Math.max(1, correct - b), correct + 5]),
      correct,
      difficulty,
    };
  }
}

import Phaser from "phaser";