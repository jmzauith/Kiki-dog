# Breed facts and quizzes: live Husky versus reusable engine

> **Current specification**, 16 October 2026, baseline `f2ede75037c3466e7fddfe4556636863c80d94eb`. [Current-build index](HUSKY_CURRENT_BUILD.md). [Original generic-system delivery](https://github.com/jmzauith/Kiki-dog/blob/f2ede75037c3466e7fddfe4556636863c80d94eb/docs/BREED_FACTS_QUIZ_SYSTEM.md) preserves the historical design and test results.

| Contract | Live Husky finale | Generic reusable quiz engine |
|---|---|---|
| Code | [HuskyGraduation model](../src/systems/HuskyGraduation.ts), [reading/quiz UI](../src/visuals/HuskyGraduation.ts), HuskyScene reward flow | [BreedQuiz](../src/systems/BreedQuiz.ts), [BreedFacts](../src/systems/BreedFacts.ts) |
| Reading | Three paragraphs about Siberian Husky origin, sled work, coat, appearance, temperament and exercise | Validated per-breed fact datasets |
| Questions | Exactly three, fixed order: `husky-q-job`, `husky-q-coat`, `husky-q-origin` | Random selection without repeats; configurable session size, normally 3–5 |
| Answers | Four existing choices per question; correct IDs accumulate, retries count toward completion | Retries allow completion; mastery is first-attempt accuracy, default 80% threshold |
| Error response | Fact explanation; another choice; reading can be reopened | Engine emits answer/session results for a future caller to render |
| Gold | All three correctly answered plus normal adventure/race eligibility | Result can feed best-score mastery points for definitions using that policy |
| Persistence | Profile-relative `husky:breed-finale:v1`, JSON array of valid correct question IDs | `BreedKnowledgeProgress` and save/load helpers; not the live finale save |
| Replay | Passed finale skipped; partial answers resume | New sessions can vary and improve best first-attempt score |

The live flow uses questions from [HuskyFacts](../src/systems/HuskyFacts.ts), but **does not instantiate BreedQuizSession or use first-try scoring**. `quizMastery = 1` in the live reward/collection mirror means completed retry-friendly finale, not a perfect first attempt. The generic engine's tests do not prove the live UI is wired; use the [finale delivery](HUSKY_BREED_FINALE_20261015.md) for focused browser evidence.

Future breed datasets use BreedProfile/BreedQuizQuestion and their validators, but must explicitly choose their playable quiz policy. Corgi facts and Golden Kiki logic exist without a playable endgame. Do not copy the historical global-key/sessionStorage examples into scenes. Pass an explicit `gameStore()` to save/load helpers; see the [actual storage contract](PLAYER_PROFILES_AVATARS_AND_SAVES.md). Generic `knowledge:<breedId>` is a convention for future callers, not a current Husky finale key.

Reading provenance: [AKC Siberian Husky profile](https://www.akc.org/dog-breeds/siberian-husky/), as recorded in the delivery. This audit did not author new factual content or run new quiz acceptance.
