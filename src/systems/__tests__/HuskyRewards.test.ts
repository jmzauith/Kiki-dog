/**
 * HuskyRewards.test.ts — Husky-specific reward paths.
 *
 * Verifies the HUSKY_REWARD_DEF instance: normal sticker rules, secrets not
 * blocking, golden reachable via realistic 9-year-old paths, and golden
 * never accidental.
 */
import { describe, expect, it } from "vitest";
import {
  BreedRewardState,
  loadRewards,
  memoryStore,
  saveRewards,
} from "../BreedRewards";
import { HUSKY_REWARD_DEF, HUSKY_REWARD_KEY } from "../HuskyRewards";

function fresh() {
  return new BreedRewardState(HUSKY_REWARD_DEF);
}

/** Full safe-route adventure + race win, no secrets. */
function completeSafeAdventure(s = fresh()) {
  s.setRoute("safe");
  s.recordRequired("broken-bridge");
  s.recordRequired("forest");
  s.recordRequired("frozen-lake");
  s.recordRequired("fallen-tree");
  s.recordRequired("summit-camp");
  s.recordRaceWon();
  return s;
}

/** Full challenge-route adventure + race win, no secrets. */
function completeChallengeAdventure(s = fresh()) {
  s.setRoute("challenge");
  s.recordRequired("broken-bridge");
  s.recordRequired("forest");
  s.recordRequired("ice-cave");
  s.recordRequired("summit-camp");
  s.recordRaceWon();
  return s;
}

describe("husky normal sticker", () => {
  it("unlocks after safe-route adventure + race, with zero secrets", () => {
    const s = completeSafeAdventure();
    expect(s.normalStickerUnlocked).toBe(true);
    expect(s.goldenStickerUnlocked).toBe(false);
  });

  it("unlocks after challenge-route adventure + race", () => {
    const s = completeChallengeAdventure();
    expect(s.normalStickerUnlocked).toBe(true);
  });

  it("two-question shortcut cannot earn the sticker (old bug regression)", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("locked");
    expect(s.normalStickerUnlocked).toBe(false);
  });

  it("summit gate alone is not enough without the route encounters", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    s.recordRequired("summit-camp");
    const r = s.recordRaceWon();
    expect(r.normalSticker).toBe("locked");
  });
});

describe("golden husky", () => {
  it("brave explorer path: challenge route + igloo + turbos → golden", () => {
    const s = fresh();
    s.setRoute("challenge");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    s.recordRequired("ice-cave");
    s.recordBonusChallenge("ice-cave"); // 3
    s.recordChallengeMathSuccess("ice-cave"); // 1
    s.recordRequired("summit-camp");
    s.recordSecretFound("secret-igloo"); // 3 → 7 total
    const r = s.recordRaceWon(2); // +2 → 9 ≥ 8
    expect(r.normalSticker).toBe("newly-unlocked");
    expect(r.goldenSticker).toBe("newly-unlocked");
    expect(s.masteryPoints()).toBe(9);
  });

  it("careful explorer path: safe route + both secrets + turbos → golden", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    s.recordRequired("frozen-lake");
    s.recordRequired("fallen-tree");
    s.recordRequired("summit-camp");
    s.recordSecretFound("secret-igloo"); // 3
    s.recordSecretFound("snow-cache"); // 2
    s.recordChallengeMathSuccess("secret-igloo"); // 1 → 6
    const r = s.recordRaceWon(2); // +2 turbo → 8
    expect(r.normalSticker).toBe("newly-unlocked");
    expect(r.goldenSticker).toBe("newly-unlocked");
  });

  it("replayer path: replay + secrets + turbos → golden", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    s.recordRequired("frozen-lake");
    s.recordRequired("fallen-tree");
    s.recordRequired("summit-camp");
    s.recordSecretFound("secret-igloo"); // 3
    s.recordSecretFound("snow-cache"); // 2 → 5
    s.recordRaceWon(2); // +2 → 7
    const r = s.recordReplay(); // +1 → 8
    expect(r.normalSticker).toBe("already-unlocked");
    expect(r.goldenSticker).toBe("newly-unlocked");
  });

  it("double-reporting a race win never inflates turbo points", () => {
    const s = fresh();
    s.setRoute("safe");
    s.recordRaceWon(3); // first report counts
    s.recordRaceWon(3); // duplicate report ignored
    expect(s.turboSuccesses).toBe(3);
    expect(s.masteryPoints()).toBe(3); // at cap, no inflation
  });

  it("grinding the same secret never farms golden", () => {
    const s = completeSafeAdventure();
    for (let i = 0; i < 20; i++) s.recordSecretFound("secret-igloo");
    expect(s.masteryPoints()).toBe(3);
    expect(s.goldenStickerUnlocked).toBe(false);
  });

  it("a plain finish earns no golden", () => {
    const s = completeChallengeAdventure();
    expect(s.masteryPoints()).toBe(0);
    expect(s.goldenStickerUnlocked).toBe(false);
    expect(s.pointsToGolden()).toBe(8);
  });
});

describe("husky persistence", () => {
  it("reward save survives a simulated refresh mid-adventure", () => {
    const store = memoryStore();
    const s = fresh();
    s.setRoute("challenge");
    s.recordRequired("broken-bridge");
    s.recordRequired("forest");
    s.recordSecretFound("snow-cache");
    saveRewards(HUSKY_REWARD_KEY, s, store);
    // "refresh": brand-new state object, same store
    const resumed = loadRewards(HUSKY_REWARD_KEY, HUSKY_REWARD_DEF, store)!;
    expect(resumed.chosenRoute).toBe("challenge");
    expect(resumed.completedRequired.has("broken-bridge")).toBe(true);
    expect(resumed.secretsFound.has("snow-cache")).toBe(true);
    expect(resumed.normalStickerUnlocked).toBe(false);
    // ...and the adventure can continue to completion
    resumed.recordRequired("ice-cave");
    resumed.recordRequired("summit-camp");
    const r = resumed.recordRaceWon();
    expect(r.normalSticker).toBe("newly-unlocked");
  });
});
