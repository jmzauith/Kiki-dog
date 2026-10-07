/**
 * HuskyRewards — the first BreedRewardDefinition: the Snowy Peaks Husky.
 *
 * This is a pure data instance of the reusable model in BreedRewards.ts.
 * Future breeds (Corgi, ...) ship their own definition file like this one;
 * no changes to the model are needed.
 *
 * Encounter ids match the Husky adventure definition (HuskyAdventure.ts):
 *   requiredAlways: broken-bridge, forest, summit-camp
 *   safe route:     frozen-lake, fallen-tree
 *   challenge route: ice-cave
 *   secrets:        secret-igloo, snow-cache
 *   race:           sled-race
 *
 * GOLDEN HUSKY tuning (must stay earnable by a 9-year-old):
 *   Max realistic mastery ≈ 19 points; threshold is 8 (≈42%).
 *   Example paths to 8:
 *     - Brave explorer (challenge route): Ice Cave shortcut 3 + Ice Cave
 *       hard math 1 + Secret Igloo 3 + 2 Turbo race turns 2 = 9 ✓
 *     - Careful explorer (safe route): Secret Igloo 3 + Bone Cache 2 +
 *       Igloo hard math 1 + 2 Turbo turns 2 = 8 ✓
 *     - Replayer: replay 1 + both secrets 5 + 2 Turbo turns 2 = 8 ✓
 *   No path requires perfection: wrong answers never subtract, retries are
 *   free, and points come from curiosity (secrets, shortcuts) rather than
 *   flawless play.
 */
import type { BreedRewardDefinition } from "./BreedRewards";

export const HUSKY_REWARD_KEY = "kiki-dog-rewards-husky-v1";

export const HUSKY_REWARD_DEF: BreedRewardDefinition = {
  breedId: "husky",
  breedName: "Husky",
  stickerName: "Husky",
  goldenStickerName: "Golden Husky",

  requiredAlways: ["broken-bridge", "forest", "summit-camp"],
  requiredByRoute: {
    safe: ["frozen-lake", "fallen-tree"],
    challenge: ["ice-cave"],
  },

  secrets: [
    { id: "secret-igloo", label: "Secret Igloo", points: 3 },
    { id: "snow-cache", label: "Bone Cache", points: 2 },
  ],

  bonusChallenges: [
    { id: "ice-cave", label: "Brave the Ice Cave shortcut", points: 3 },
  ],

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
