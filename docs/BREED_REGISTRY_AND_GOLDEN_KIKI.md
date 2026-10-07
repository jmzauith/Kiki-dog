# Breed Registry & Golden Kiki — plain-English guide

## The final 12 breeds

The game will have exactly 12 collectible dog breeds, in this album order:

1. Husky
2. Golden Retriever
3. Beagle
4. Dachshund
5. Border Collie
6. Dalmatian
7. Shiba Inu
8. Bernese Mountain Dog
9. Cavalier King Charles Spaniel
10. Labrador Retriever
11. Chow Chow
12. Pug

**Poodle and Samoyed are NOT part of the game.** They were considered and cut.

## Why Kiki is separate

Kiki the corgi is the hero of the whole game — she walks every world with
the player. Making her just another collectible breed would be strange: you
can't "collect" the character you've been playing all along.

Instead, Kiki is the **final completion reward**. Finishing everything earns
the **Golden Kiki Sticker** — the one sticker that says "you did it all."

## Collection completion rules

- Each breed has a **normal sticker**: earned by finishing that breed's
  adventure (all required encounters + winning the sled race).
- Each breed can also earn a **golden breed sticker**: a mastery bonus for
  curious players (secrets, challenges, quizzes, replays).
- **Collection complete = all 12 NORMAL stickers.** Golden breed stickers
  are prestigious but **never required** for anything in the endgame.
- The album shows completion as a percentage of normal stickers (0–100%).

## Ultimate Corgi Quiz unlock rules

- The **Ultimate Corgi Quiz** becomes available **only** when the collection
  is complete (12/12 normal stickers).
- 11/12 does **not** unlock it — the gate is exact.
- Golden breed stickers don't count toward it, for or against.

## Golden Kiki unlock rules

Golden Kiki is **never automatic**. After the collection is complete, the
player must also **pass the Ultimate Corgi Quiz**:

- The final quiz asks ~5 questions about corgis (fun facts, not trivia).
- Passing means **4 out of 5 correct on the first try** (80%).
- Retries are free and unlimited — a wrong answer never punishes, the child
  just keeps trying. Only first-try answers count toward the pass score,
  which is what makes replaying meaningful.
- Why 4/5: it matches the mastery rule used by every breed quiz in the
  game, so the final feels like the same game at its hardest — a real
  challenge for a 9-year-old, but fair and retryable, never perfection-only.
- Once earned, Golden Kiki is **permanent** — replays and refreshes can't
  take it away, and it can't be earned twice.

**The full chain:** 12 normal stickers → quiz unlocks → pass the quiz →
Golden Kiki. Golden breed stickers never block the true ending.

## How future breeds plug in

Everything is data-driven. To add a 13th breed later, nobody touches engine
code:

1. Add one `BreedDefinition` to the registry (id, name, order, ids for its
   adventure/reward/quiz/album slot, optional world theme).
2. Ship that breed's adventure, reward definition, and facts/quiz dataset
   (each is already a one-file-per-breed pattern).
3. Totals, percentages, and the collection gate recompute from the roster
   automatically.

Replacing a breed = swap its definition. Reordering the album = change the
`order` numbers. Disabling a breed temporarily = flip `enabled` to false
(disabled breeds don't count toward completion).

## How the album UI should consume the data

- Read `BreedRegistry` for the breed list, display names, album order, and
  slot ids. Never hardcode a breed list in UI code.
- Read `CollectionProgress` for per-breed state (normal/golden sticker,
  quiz mastery) and totals (`normalStickersCollected`, `completionPercent`,
  `collectionComplete`).
- Read `UltimateRewardState.phase` for endgame gating: `collecting` →
  `quiz-unlocked` → `golden-kiki`.
- The Golden Kiki sticker art slot is separate from the 12 breed slots.

## How the reward/quiz systems connect to this layer

This layer never imports the other systems — it consumes plain data that
Lennon feeds it during scene integration:

- **Adventure → collection:** when a breed adventure finishes, call
  `recordBreed(breedId, { adventureCompleted: true })`.
- **Reward → collection:** after any reward event, mirror the sticker flags:
  `recordBreed(breedId, { normalStickerUnlocked, goldenStickerUnlocked })`.
  (Read these from that breed's `BreedRewardState`.)
- **Quiz → collection:** after a breed quiz session, mirror the best score:
  `recordBreed(breedId, { quizMastery: result.masteryPercent })`.
- **Ultimate quiz:** run it through the existing `BreedQuizSession` engine
  using the `CorgiFacts` dataset (it is structurally compatible — same
  question shape and validation rules). Feed `session.finish()` into
  `recordUltimateQuizResult(result.masteryPercent)`.
- **Persistence:** one collection-level save key
  (`kiki-dog:golden-kiki:v1`) holds per-breed summaries + quiz completion.
  It coexists with the adventure, reward, and quiz saves and never
  overwrites them. Gate flags (quiz unlocked, Golden Kiki) are re-derived
  from the saved facts on load, so a tampered save can't skip the ending.
