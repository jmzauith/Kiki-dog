import { AdventureProgress } from "./AdventureState";
import { BreedRewardState, loadRewards, saveRewards } from "./BreedRewards";
import { HUSKY_REWARD_DEF } from "./HuskyRewards";
import { BreedRegistry } from "./BreedRegistry";
import { CollectionProgress } from "./CollectionProgress";
import type { StorageLike } from "./ProfileStore";

/** Mirror completed PR18 facts; never unlock or advance its gameplay graph. */
export function syncHuskyProgress(adventure: AdventureProgress, store: StorageLike): BreedRewardState {
  const reward = loadRewards("reward:husky", HUSKY_REWARD_DEF, store) ?? new BreedRewardState(HUSKY_REWARD_DEF);
  if (adventure.chosenRoute) reward.setRoute(adventure.chosenRoute);
  for (const id of adventure.completed) reward.recordRequired(id);
  for (const id of adventure.secretsFound) if (!id.startsWith("revealed:")) reward.recordSecretFound(id);
  if (adventure.isComplete("ice-cave")) {
    reward.recordBonusChallenge("ice-cave");
    reward.recordChallengeMathSuccess("ice-cave");
  }
  if (adventure.bonusChallengesCompleted > 0) reward.recordChallengeMathSuccess("secret-igloo");
  if (adventure.raceCompleted) reward.recordRaceWon(adventure.raceTurbos);
  saveRewards("reward:husky", reward, store);
  const registry = new BreedRegistry();
  let collection = new CollectionProgress(registry);
  try { collection = CollectionProgress.fromJSON(registry, JSON.parse(store.getItem("collection") ?? "null")); } catch { /* bad save */ }
  collection.recordBreed("husky", {
    adventureCompleted: adventure.canUnlockSticker(), normalStickerUnlocked: reward.normalStickerUnlocked,
    goldenStickerUnlocked: reward.goldenStickerUnlocked, quizMastery: reward.quizMastery,
  });
  try { store.setItem("collection", JSON.stringify(collection.toJSON())); } catch { /* storage unavailable */ }
  return reward;
}
