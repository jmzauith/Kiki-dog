import { HuskyGraduation } from "../HuskyGraduation";
import { describe, it, expect } from "vitest";
import { AdventureProgress } from "../AdventureState";
import { HUSKY_ADVENTURE } from "../HuskyAdventure";
import { memoryStore, ProfileScopedStore } from "../ProfileStore";
import { syncHuskyProgress } from "../HuskyProgressBridge";

describe("Husky integration bridge", () => {
  it("mirrors a completed safe run without advancing the adventure and without leaking to another profile", () => {
    const base = memoryStore();
    const a = new ProfileScopedStore(base, "a");
    const b = new ProfileScopedStore(base, "b");
    const adventure = new AdventureProgress(HUSKY_ADVENTURE);
    adventure.chosenRoute = "safe";
    for (const id of ["trailhead", "broken-bridge", "forest", "frozen-lake", "fallen-tree", "snow-pass", "summit-camp", "sled-race"]) adventure.completeEncounter(id);
    adventure.raceCompleted = true;
    adventure.raceTurns = 3;
    adventure.raceTurbos = 2;
    const before = adventure.toJSON();
    const first = syncHuskyProgress(adventure, a);
    const second = syncHuskyProgress(adventure, a);
    expect(first.normalStickerUnlocked).toBe(true);
    expect(second.turboSuccesses).toBe(2);
    expect(second.masteryPoints()).toBe(first.masteryPoints());
    expect({ ...adventure.toJSON(), savedAt: 0 }).toEqual({ ...before, savedAt: 0 });
    expect(b.getItem("reward:husky")).toBeNull();
    expect(JSON.parse(a.getItem("collection")!).breeds.husky.normalStickerUnlocked).toBe(true);
  });
  it("quiz completion reaches the saved reward and collection; old point gold cannot bypass it", () => {
    const store=memoryStore();
    const adventure=new AdventureProgress(HUSKY_ADVENTURE);
    adventure.chosenRoute="safe";
    for(const id of ["trailhead","broken-bridge","forest","frozen-lake","fallen-tree","snow-pass","summit-camp","sled-race"]) adventure.completeEncounter(id);
    adventure.raceCompleted=true;
    store.setItem("collection",JSON.stringify({breeds:{husky:{goldenStickerUnlocked:true}}}));
    expect(syncHuskyProgress(adventure,store).goldenStickerUnlocked).toBe(false);
    expect(JSON.parse(store.getItem("collection")!).breeds.husky.goldenStickerUnlocked).toBe(false);
    const quiz=new HuskyGraduation(store);
    while(quiz.question) quiz.answer(quiz.question.correctIndex);
    expect(syncHuskyProgress(adventure,store).goldenStickerUnlocked).toBe(true);
    expect(JSON.parse(store.getItem("collection")!).breeds.husky.quizMastery).toBe(1);
  });
  it("does not award a normal sticker for an incomplete adventure or revealed-only secrets", () => {
    const adventure = new AdventureProgress(HUSKY_ADVENTURE);
    adventure.raceCompleted = true;
    adventure.secretsFound.add("revealed:secret-igloo");
    const reward = syncHuskyProgress(adventure, memoryStore());
    expect(reward.normalStickerUnlocked).toBe(false);
    expect(reward.secretsFound.size).toBe(0);
  });
});
