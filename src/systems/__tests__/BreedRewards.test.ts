/**
 * BreedRewards.test.ts — generic reward-model tests.
 *
 * Uses a synthetic "corgi" breed to prove the model is reusable and that two
 * breeds keep fully independent state.
 */
import { describe, expect, it } from "vitest";
import {
  BreedRewardState,
  clearRewards,
  loadRewards,
  memoryStore,
  saveRewards,
  type BreedRewardDefinition,
} from "../BreedRewards";

const CORGI_DEF: BreedRewardDefinition = {
  breedId: "corgi",
  breedName: "Corgi",
  stickerName: "Corgi",
  goldenStickerName: "Golden Corgi",
  requiredAlways: ["meadow", "barn"],
  requiredByRoute: { safe: ["pond"], challenge: ["hill"] },
  secrets: [{ id: "burrow", label: "Rabbit Burrow", points: 2 }],
  bonusChallenges: [{ id: "hill", label: "Charge the hill", points: 2 }],
  points: {
    challengeMathSuccessPoints: 1,
    challengeMathSuccessCap: 2,
    turboSuccessPoints: 1,
    turboSuccessCap: 2,
    quizMaxPoints: 2,
    replayPoints: 1,
    replayCap: 1,
  },
  goldenThreshold: 5,
};

function fresh() {
  return new BreedRewardState(CORGI_DEF);
}

function completeSafeRun(s = fresh()) {
  s.setRoute("safe");
  s.recordRequired("meadow");
  s.recordRequired("barn");
  s.recordRequired("pond");
  s.recordRaceWon();
  return s;
}

describe("normal sticker gating", () => {
  it("cannot unlock before adventure + race are complete", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("meadow");
    s.recordRequired("barn");
    s.recordRequired("pond");
    expect(s.normalStickerUnlocked).toBe(false);
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("newly-unlocked");
    expect(s.normalStickerUnlocked).toBe(true);
  });

  it("race alone does not unlock the sticker", () => {
    const s = fresh();
    s.setRoute("safe");
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("locked");
    expect(s.normalStickerUnlocked).toBe(false);
  });

  it("missing one required encounter blocks the sticker", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("meadow");
    s.recordRequired("barn");
    // pond missing
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("locked");
  });

  it("no sticker before a route is chosen (route-aware requirements)", () => {
    const s = fresh();
    s.recordRequired("meadow");
    s.recordRequired("barn");
    s.recordRequired("pond");
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("locked");
  });

  it("wrong-route required encounters do not satisfy the chosen route", () => {
    const s = fresh();
    s.setRoute("challenge");
    s.recordRequired("meadow");
    s.recordRequired("barn");
    s.recordRequired("pond"); // safe-branch node, wrong route
    s.recordRequired("hill");
    // hill recorded but pond is not required on challenge; meadow/barn/hill done
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("newly-unlocked");
  });

  it("unknown encounter ids are ignored", () => {
    const s = fresh();
    s.setRoute("safe");
    const r = s.recordRequired("not-a-real-node");
    expect(r.normalSticker).toBe("locked");
    expect(s.completedRequired.size).toBe(0);
  });

  it("secrets are NOT mandatory for the normal sticker", () => {
    const s = completeSafeRun();
    expect(s.secretsFound.size).toBe(0);
    expect(s.normalStickerUnlocked).toBe(true);
  });

  it("already-unlocked sticker reports already-unlocked on repeat events", () => {
    const s = completeSafeRun();
    const r = s.recordRequired("meadow");
    expect(r.normalSticker).toBe("already-unlocked");
  });
});

describe("golden sticker gating", () => {
  it("cannot unlock golden accidentally early (normal completion alone)", () => {
    const s = completeSafeRun();
    expect(s.normalStickerUnlocked).toBe(true);
    expect(s.goldenStickerUnlocked).toBe(false);
    expect(s.masteryPoints()).toBe(0);
  });

  it("golden requires the normal sticker even with enough points", () => {
    const s = fresh();
    s.setRoute("challenge");
    s.recordSecretFound("burrow"); // 2
    s.recordBonusChallenge("hill"); // 2
    s.recordChallengeMathSuccess("hill"); // 1 → 5 total, threshold met
    expect(s.masteryPoints()).toBeGreaterThanOrEqual(5);
    expect(s.goldenStickerUnlocked).toBe(false); // no normal sticker yet
  });

  it("golden CAN unlock through a realistic mastery path", () => {
    const s = fresh();
    s.setRoute("challenge");
    s.recordRequired("meadow");
    s.recordRequired("barn");
    s.recordRequired("hill");
    s.recordBonusChallenge("hill"); // 2
    s.recordChallengeMathSuccess("hill"); // 1
    s.recordSecretFound("burrow"); // 2 → 5 total
    const r = s.recordRaceWon(1); // +1 turbo → 6 ≥ 5
    expect(r.normalSticker).toBe("newly-unlocked");
    expect(r.goldenSticker).toBe("newly-unlocked");
    expect(s.goldenStickerUnlocked).toBe(true);
  });

  it("pointsToGolden counts down correctly", () => {
    const s = fresh();
    expect(s.pointsToGolden()).toBe(5);
    s.recordSecretFound("burrow");
    expect(s.pointsToGolden()).toBe(3);
  });
});

describe("idempotency and caps", () => {
  it("re-recording events never double-counts", () => {
    const s = fresh();
    s.recordSecretFound("burrow");
    s.recordSecretFound("burrow");
    s.recordBonusChallenge("hill");
    s.recordBonusChallenge("hill");
    s.recordChallengeMathSuccess("hill");
    s.recordChallengeMathSuccess("hill");
    expect(s.masteryPoints()).toBe(2 + 2 + 1);
  });

  it("turbo and challenge-math points are capped", () => {
    const s = fresh();
    s.recordRaceWon(10);
    expect(s.masteryPoints()).toBe(2); // turbo cap 2
    s.recordChallengeMathSuccess("a");
    s.recordChallengeMathSuccess("b");
    s.recordChallengeMathSuccess("c");
    expect(s.masteryPoints()).toBe(2 + 2); // challenge cap 2
  });

  it("replay points are capped", () => {
    const s = fresh();
    s.recordReplay();
    s.recordReplay();
    s.recordReplay();
    expect(s.masteryPoints()).toBe(1); // replay cap 1
  });

  it("quiz hook scales 0..1 and clamps", () => {
    const s = fresh();
    s.recordQuizMastery(0.5);
    expect(s.masteryPoints()).toBe(1); // round(0.5*2)
    s.recordQuizMastery(2); // clamped to 1
    expect(s.quizMastery).toBe(1);
    expect(s.masteryPoints()).toBe(2);
    s.recordQuizMastery(-1); // never lowers the best
    expect(s.quizMastery).toBe(1);
  });

  it("repeat required encounters do not corrupt state", () => {
    const s = completeSafeRun();
    for (let i = 0; i < 5; i++) {
      s.recordRequired("meadow");
      s.recordRaceWon();
    }
    expect(s.completedRequired.size).toBe(3);
    expect(s.normalStickerUnlocked).toBe(true);
  });
});

describe("reset", () => {
  it("reset wipes everything for a clean new run", () => {
    const s = completeSafeRun();
    s.recordSecretFound("burrow");
    s.recordReplay();
    s.reset();
    expect(s.normalStickerUnlocked).toBe(false);
    expect(s.goldenStickerUnlocked).toBe(false);
    expect(s.masteryPoints()).toBe(0);
    expect(s.completedRequired.size).toBe(0);
    expect(s.chosenRoute).toBeNull();
    // And the state is fully usable again
    const s2 = completeSafeRun(s);
    expect(s2.normalStickerUnlocked).toBe(true);
  });
});

describe("persistence", () => {
  const KEY = "test-rewards-corgi";

  it("round-trips through the store", () => {
    const store = memoryStore();
    const s = fresh();
    s.setRoute("challenge");
    s.recordRequired("meadow");
    s.recordSecretFound("burrow");
    s.recordQuizMastery(0.5);
    expect(saveRewards(KEY, s, store)).toBe(true);
    const loaded = loadRewards(KEY, CORGI_DEF, store);
    expect(loaded).not.toBeNull();
    expect(loaded!.chosenRoute).toBe("challenge");
    expect(loaded!.completedRequired.has("meadow")).toBe(true);
    expect(loaded!.secretsFound.has("burrow")).toBe(true);
    expect(loaded!.quizMastery).toBe(0.5);
    expect(loaded!.masteryPoints()).toBe(s.masteryPoints());
  });

  it("corrupt save degrades to null", () => {
    const store = memoryStore();
    store.setItem(KEY, "{not json");
    expect(loadRewards(KEY, CORGI_DEF, store)).toBeNull();
  });

  it("wrong breed degrades to null", () => {
    const store = memoryStore();
    saveRewards(KEY, fresh(), store);
    const other = { ...CORGI_DEF, breedId: "poodle" };
    expect(loadRewards(KEY, other, store)).toBeNull();
  });

  it("version mismatch degrades to null", () => {
    const store = memoryStore();
    const s = fresh();
    const data = s.toJSON() as unknown as Record<string, unknown>;
    data.version = 999;
    store.setItem(KEY, JSON.stringify(data));
    expect(loadRewards(KEY, CORGI_DEF, store)).toBeNull();
  });

  it("unlock flags are re-derived, never trusted from the save", () => {
    const store = memoryStore();
    const s = fresh();
    const data = s.toJSON() as unknown as Record<string, unknown>;
    data.normalStickerUnlocked = true;
    data.goldenStickerUnlocked = true;
    store.setItem(KEY, JSON.stringify(data));
    const loaded = loadRewards(KEY, CORGI_DEF, store)!;
    expect(loaded.normalStickerUnlocked).toBe(false);
    expect(loaded.goldenStickerUnlocked).toBe(false);
  });

  it("clearRewards wipes the save", () => {
    const store = memoryStore();
    saveRewards(KEY, completeSafeRun(), store);
    clearRewards(KEY, store);
    expect(loadRewards(KEY, CORGI_DEF, store)).toBeNull();
  });

  it("missing store degrades gracefully", () => {
    expect(saveRewards(KEY, fresh(), null)).toBe(false);
    expect(loadRewards(KEY, CORGI_DEF, null)).toBeNull();
    expect(() => clearRewards(KEY, null)).not.toThrow();
  });
});

describe("breed independence", () => {
  it("two breeds keep fully independent state", () => {
    const huskyLike: BreedRewardDefinition = {
      ...CORGI_DEF,
      breedId: "husky",
      goldenThreshold: 99, // unreachable here
    };
    const corgi = fresh();
    const husky = new BreedRewardState(huskyLike);
    completeSafeRun(corgi);
    expect(corgi.normalStickerUnlocked).toBe(true);
    expect(husky.normalStickerUnlocked).toBe(false);
    expect(husky.masteryPoints()).toBe(0);
    // Same storage key namespace pattern, different keys → no collision
    const store = memoryStore();
    saveRewards("rewards-corgi", corgi, store);
    saveRewards("rewards-husky", husky, store);
    expect(loadRewards("rewards-corgi", CORGI_DEF, store)!.normalStickerUnlocked).toBe(true);
    expect(loadRewards("rewards-husky", huskyLike, store)!.normalStickerUnlocked).toBe(false);
  });
});
