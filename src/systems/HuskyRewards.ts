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
 * Golden Husky now requires the completed adventure and three correct breed
 * quiz answers. Exploration points remain recorded but do not replace learning.
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
  goldenUnlock: "quiz",
};
