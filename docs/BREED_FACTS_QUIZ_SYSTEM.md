# Breed Facts & Quiz System — Kiki's Dog Adventure

Reusable logic for breed facts and post-adventure quizzes. After a child
finishes a breed adventure and unlocks the normal sticker, they can read
fun facts about the breed and take an optional quiz. Quiz performance feeds
Golden Sticker mastery.

**No visual work here — this is pure logic.** Lennon owns scene integration.
The engine never changes per breed: each breed ships data files only.

---

## The pieces

| File | What it is | Changes per breed? |
|---|---|---|
| `src/systems/BreedFacts.ts` | Fact data model + validation (`BreedProfile`, `BreedFact`) | Never |
| `src/systems/BreedQuiz.ts` | Quiz engine (`BreedQuizQuestion`, `BreedQuizSession`, `BreedKnowledgeProgress`, persistence) | Never |
| `src/systems/HuskyFacts.ts` | Husky facts + questions (reference implementation) | **This is the template** |
| `docs/BREED_FACTS_QUIZ_SYSTEM.md` | This file | Never |

---

## How a quiz works (the 60-second version)

1. Lennon creates a session: `new BreedQuizSession("husky", HUSKY_QUESTIONS, { questionsPerSession: 4 })`.
2. The engine picks 4 random questions (no repeats) from the bank.
3. The child answers. A wrong tap is **never punishment** — the question stays
   open and they retry freely until it's right.
4. `session.finish()` returns a `QuizMasteryResult`:
   - `quizMastered` — did they reach the mastery threshold (default 80%)?
   - `questionsCorrect` / `questionsAttempted` — first-try accuracy.
   - `masteryPercent` — 0..1, **feed straight into the reward system**:
     `rewardState.recordQuizMastery(result.masteryPercent)`.
5. Progress persists (`BreedKnowledgeProgress`): facts seen, sessions played,
   best mastery — same sessionStorage + versioned-JSON approach as the
   adventure and reward saves, with its own storage key so saves never clash.

### Why first-try accuracy?

Retries are free (no punishment, no lockout — a persistent 9-year-old always
finishes), but mastery rewards *knowing* the answer. This gives replays a
purpose: play again, know more, score higher. The reward system keeps only
your best score, so replaying can never hurt.

---

## Adding a future breed (no engine changes)

To add breed #2 (say, Corgi), create **one file**: `src/systems/CorgiFacts.ts`.

```ts
import type { BreedProfile } from "./BreedFacts";
import { assertValidBreedProfile } from "./BreedFacts";
import type { BreedQuizQuestion } from "./BreedQuiz";
import { assertValidQuestionBank } from "./BreedQuiz";

export const CORGI_QUIZ_KEY = "kiki-dog-quiz-corgi-v1";

export const CORGI_PROFILE: BreedProfile = {
  breedId: "corgi",            // must match the reward system's breedId
  breedName: "Pembroke Welsh Corgi",
  tagline: "The loaf-shaped herder with the big smile!",
  facts: [
    { id: "corgi-origin", category: "origin",
      text: "Corgis come from Wales, where they herded cattle." },
    // ... 8–12 facts total
  ],
};

export const CORGI_QUESTIONS: BreedQuizQuestion[] = [
  {
    id: "corgi-q-origin",
    factId: "corgi-origin",     // links the question to its fact
    prompt: "Where do Corgis come from?",
    choices: ["Wales", "The moon", "The desert"],  // 3–4, unique, correct included
    correctIndex: 0,
  },
  // ... 6–10 questions total
];

// Fail fast at load if the dataset ever rots:
assertValidBreedProfile(CORGI_PROFILE);
assertValidQuestionBank("corgi", CORGI_QUESTIONS, CORGI_PROFILE.facts);
```

That's it. The engine validates everything:

- **Facts**: non-empty id/text, known category (`origin | size | temperament |
  job | trait | fun`), unique ids, short enough for ~age 9.
- **Questions**: 3–4 choices, no duplicates (case-insensitive), correct
  answer always included, `correctIndex` in range, unique ids, `factId`
  resolves to a real fact.

Then Lennon wires it exactly like the Husky:

```ts
const session = new BreedQuizSession("corgi", CORGI_QUESTIONS, { questionsPerSession: 4 });
// ... child plays ...
const result = session.finish();
rewardState.recordQuizMastery(result.masteryPercent); // golden points, best-only

const progress = loadQuizProgress(CORGI_QUIZ_KEY, "corgi") ?? new BreedKnowledgeProgress("corgi");
progress.recordSession(result);
saveQuizProgress(CORGI_QUIZ_KEY, progress);
```

### Wording rules for datasets (read aloud test)

- One idea per fact. Short sentences. No jargon, no semicolons.
- Wrong answers should be *silly but plausible* — funny distractors keep a
  9-year-old engaged ("Deliver pizza" is a better wrong answer than a
  near-miss that confuses).
- Never make the correct answer always first: the engine shuffles, but when
  hand-writing questions, vary the position anyway.

---

## Mastery hook contract (for the reward system)

`BreedQuizSession.finish()` returns:

```ts
interface QuizMasteryResult {
  quizMastered: boolean;      // masteryPercent >= threshold (default 0.8)
  questionsCorrect: number;   // first-try correct
  questionsAttempted: number; // questions in the session
  masteryPercent: number;     // 0..1 — THE hook value
  firstTryCorrect: number;
  totalAttempts: number;      // total taps (analytics only)
}
```

Feed `masteryPercent` into `BreedRewardState.recordQuizMastery()` — it
clamps to 0..1 and keeps the best, so this module never modifies the reward
system and the reward system never imports this module. The contract is
data, not code.

## Persistence keys (all independent — no save clobbers another)

- Adventure: `kiki-dog-husky-v1` (AdventurePersistence)
- Rewards: `kiki-dog-rewards-husky-v1` (BreedRewards)
- Quiz: `kiki-dog-quiz-husky-v1` (this system)

## Test coverage

62 tests: fact/profile validation, question validation (duplicates,
ranges, counts), `makeQuestionFromFact`, session selection (no repeats,
clamping, statistical randomization), answer/retry flow, mastery
thresholds, second-breed independence (Corgi), persistence round-trips,
corrupt/version/wrong-breed saves, throwing-store degradation, reset, and
end-to-end integration against the real `BreedRewardState` (quiz points
flow, best-only, golden never unlocks early on quiz alone).
