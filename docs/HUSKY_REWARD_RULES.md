# Husky Reward Rules

How stickers work in Kiki's Dog Adventure — written for humans, not just code.
The logic lives in `src/systems/BreedRewards.ts` (reusable model) with the
Husky's specific numbers in `src/systems/HuskyRewards.ts`.

## The two stickers

Every dog breed in the game has **two** stickers:

1. **Normal sticker** (the Husky) — the "you finished the adventure!" sticker.
2. **Golden sticker** (the Golden Husky) — the "you truly mastered it" sticker
   for curious players who explore, retry, and find secrets.

## Normal Husky sticker rules

To earn the normal Husky sticker, a player must:

- **Finish every required encounter** on the route they chose:
  - Always required: Broken Bridge, Whisper Forest, Summit Gate
  - Safe trail: Frozen Lake, Fallen Tree
  - Ice shortcut: Ice Cave
- **Win the sled race.**

That's it. In particular:

- **Optional challenges never block the normal sticker.** The Secret Igloo
  and the Bone Cache are wonderful to find, but a player who never finds them
  still earns the Husky sticker. Secrets are treats, not taxes.
- **Wrong answers never block it either.** A wrong answer just means "try
  again" — progress is never taken away.
- The sticker can't be earned early or out of order. Finishing two encounters
  and jumping to the race (the old shortcut) earns nothing.

## Golden Husky rules

The Golden Husky is earned with **mastery points**. Different discoveries and
achievements give points:

| What the player does | Points |
|---|---|
| Find the Secret Igloo | 3 |
| Find the Bone Cache | 2 |
| Brave the Ice Cave shortcut | 3 |
| Clear a hard-math encounter (each unique one) | 1 (max 3) |
| Win a race turn with Turbo (each) | 1 (max 3) |
| Breed quiz mastery (coming later) | up to 3 |
| Finish the whole adventure again (replay) | 1 (max 2) |

**Golden Husky needs 8 points** — and the normal Husky sticker first.

Three example paths a 9-year-old might take:

- **The brave explorer** takes the Ice Cave shortcut (3), beats its hard
  math (1), finds the Secret Igloo (3), and wins 2 race turns with Turbo
  (2) → **9 points** ✓
- **The careful explorer** takes the safe trail, finds both secrets (3 + 2),
  beats the igloo's hard math (1), and wins 2 Turbo turns (2) → **8 points** ✓
- **The replayer** finishes once, replays (1), finds both secrets (5), and
  wins 2 Turbo turns (2) → **8 points** ✓

### Why this is fair for a 9-year-old

- **No perfection required.** The threshold (8) is less than half of the
  maximum (~19). A child who is curious *or* persistent *or* a mix of both
  can get there.
- **Wrong answers cost nothing.** Points are only ever added, never taken
  away. Retrying is always safe.
- **Repeating the same thing doesn't farm points.** Finding the same secret
  twenty times counts once — mastery means breadth, not grinding.
- **Golden can never unlock by accident.** It requires the normal sticker
  first, so there's no surprise golden sticker halfway through a first play.
- **Replays are safe.** Playing again adds a small bonus but can never
  corrupt or reset existing progress.

## How this scales to future breeds

The whole system is **data, not code**. Each new breed (Corgi, Poodle, …)
ships one small definition file like `HuskyRewards.ts` that lists:

- which encounters are required (per route),
- which secrets and bonus challenges exist and what they're worth,
- the point values/caps and the golden threshold.

The same `BreedRewardState` class drives every breed, each with its own
save slot, so breeds never interfere with each other. When the breed quiz
arrives later, it plugs into the existing `quizMastery` hook — no redesign
needed.

## For the scene integrator (Lennon)

The scenes never decide stickers — they just report events:

- Forest choice made → `setRoute("safe" | "challenge")`
- Required encounter finished → `recordRequired(encounterId)`
- Race won → `recordRaceWon(turbosWon)`
- Secret discovered → `recordSecretFound(secretId)`
- Bonus challenge done → `recordBonusChallenge(challengeId)`
- Hard math cleared → `recordChallengeMathSuccess(encounterId)`
- (later) quiz finished → `recordQuizMastery(score01)`
- Adventure finished again → `recordReplay()`

Each call returns what *newly* unlocked (`newly-unlocked` vs
`already-unlocked` vs `locked`), so the reward screen knows exactly what to
celebrate. Save with `saveRewards(HUSKY_REWARD_KEY, state)` after events
(same sessionStorage approach as adventure progress); load on scene start
with `loadRewards(...)`, which safely returns `null` for corrupt/foreign
saves.
