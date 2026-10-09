import { describe, expect, it } from "vitest";
import { ProfileRegistry } from "../PlayerProfiles";
import { ProfileScopedStore, memoryStore } from "../ProfileStore";
import {
  buildProfileProgressSummary,
  deleteProfileAndData,
  resetBreedProgress,
  resetProfileProgress,
} from "../ProfileProgress";

function seqIds() {
  let n = 0;
  return () => `p_test${++n}`;
}

/** Minimal stand-ins mirroring the real save shapes (defensive readers). */
function adventureSave(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 1,
    adventureId: "husky",
    currentNodeId: "goal",
    completed: ["broken-bridge"],
    chosenRoute: "safe",
    secretsFound: [],
    bonusChallengesCompleted: 0,
    challengeSuccesses: 0,
    raceCompleted: false,
    raceTurns: 0,
    raceTurbos: 0,
    stickerUnlocked: false,
    savedAt: 1,
    ...overrides,
  });
}
function rewardSave(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 1,
    breedId: "husky",
    chosenRoute: "safe",
    completedRequired: [],
    raceWon: false,
    secretsFound: [],
    bonusChallengesCompleted: [],
    challengeMathEncounters: [],
    turboSuccesses: 0,
    quizMastery: 0,
    replaysCompleted: 0,
    normalStickerUnlocked: false,
    goldenStickerUnlocked: false,
    savedAt: 1,
    ...overrides,
  });
}
function knowledgeSave(bestMastery: number) {
  return JSON.stringify({
    version: 1,
    breedId: "husky",
    factsSeen: ["f1"],
    sessionsCompleted: 1,
    bestMastery,
    totalQuestionsCorrect: 4,
    totalQuestionsAttempted: 5,
    savedAt: 1,
  });
}
function goldenKikiSave(normalIds: string[], ultimateQuizCompleted: boolean) {
  const breeds: Record<string, unknown> = {};
  for (const id of normalIds) {
    breeds[id] = {
      adventureCompleted: true,
      normalStickerUnlocked: true,
      goldenStickerUnlocked: false,
      quizMastery: 0,
    };
  }
  return JSON.stringify({
    version: 1,
    collection: { breeds },
    ultimateQuizCompleted,
    ultimateQuizBest: ultimateQuizCompleted ? 0.8 : 0,
    savedAt: 1,
  });
}

function setup() {
  const base = memoryStore();
  const registry = new ProfileRegistry(base, seqIds());
  const aurora = registry.createProfile({ displayName: "Aurora" });
  const olivia = registry.createProfile({ displayName: "Olivia" });
  const friend = registry.createProfile({ displayName: "Miguel" });
  const olivia2 = registry.createProfile({ displayName: "Olivia" }); // same name!
  expect(olivia.id).not.toBe(olivia2.id);
  const stores = new Map<string, ProfileScopedStore>();
  for (const p of [aurora, olivia, friend, olivia2]) {
    stores.set(p.id, new ProfileScopedStore(base, p.id));
  }
  return { base, registry, aurora, olivia, friend, olivia2, stores };
}

describe("profile isolation", () => {
  it("Aurora unlocks Husky while Olivia remains locked", () => {
    const { aurora, olivia, stores } = setup();
    stores.get(aurora.id)!.setItem("adventure:husky", adventureSave({ raceCompleted: true }));
    stores
      .get(aurora.id)!
      .setItem("reward:husky", rewardSave({ raceWon: true, normalStickerUnlocked: true }));
    const aSum = buildProfileProgressSummary(aurora, stores.get(aurora.id)!);
    const oSum = buildProfileProgressSummary(olivia, stores.get(olivia.id)!);
    expect(aSum.breedsCompleted).toBe(1);
    expect(aSum.normalStickers).toBe(1);
    expect(oSum.breedsStarted).toBe(0);
    expect(oSum.normalStickers).toBe(0);
  });

  it("Olivia's quiz mastery does not touch Aurora", () => {
    const { aurora, olivia, stores } = setup();
    stores.get(olivia.id)!.setItem("knowledge:husky", knowledgeSave(1));
    expect(buildProfileProgressSummary(olivia, stores.get(olivia.id)!).quizzesMastered).toBe(1);
    expect(buildProfileProgressSummary(aurora, stores.get(aurora.id)!).quizzesMastered).toBe(0);
  });

  it("a friend profile stays fully independent", () => {
    const { aurora, friend, stores } = setup();
    stores.get(friend.id)!.setItem("adventure:beagle", adventureSave({ adventureId: "beagle" }));
    const fSum = buildProfileProgressSummary(friend, stores.get(friend.id)!);
    const aSum = buildProfileProgressSummary(aurora, stores.get(aurora.id)!);
    expect(fSum.breedsStarted).toBe(1);
    expect(aSum.breedsStarted).toBe(0);
  });

  it("two profiles sharing a display name stay independent", () => {
    const { olivia, olivia2, stores } = setup();
    stores.get(olivia.id)!.setItem("reward:husky", rewardSave({ normalStickerUnlocked: true }));
    expect(
      buildProfileProgressSummary(olivia, stores.get(olivia.id)!).normalStickers,
    ).toBe(1);
    expect(
      buildProfileProgressSummary(olivia2, stores.get(olivia2.id)!).normalStickers,
    ).toBe(0);
  });

  it("Golden Kiki never leaks between profiles", () => {
    const { aurora, olivia, stores } = setup();
    const ids = Array.from({ length: 12 }, (_, i) => `breed${i}`);
    stores.get(aurora.id)!.setItem("golden-kiki", goldenKikiSave(ids, true));
    const aSum = buildProfileProgressSummary(aurora, stores.get(aurora.id)!);
    const oSum = buildProfileProgressSummary(olivia, stores.get(olivia.id)!);
    expect(aSum.goldenKikiUnlocked).toBe(true);
    expect(aSum.collectionComplete).toBe(true);
    expect(oSum.goldenKikiUnlocked).toBe(false);
    expect(oSum.collectionComplete).toBe(false);
  });

  it("switching profiles restores the correct data", () => {
    const { base, registry, aurora, olivia, stores } = setup();
    stores.get(aurora.id)!.setItem("knowledge:husky", knowledgeSave(1));
    registry.setActiveProfile(aurora.id);
    expect(registry.getActiveProfile()!.displayName).toBe("Aurora");
    registry.setActiveProfile(olivia.id);
    const active = registry.getActiveProfile()!;
    expect(active.displayName).toBe("Olivia");
    // gameplay asks only for the current profile's save context:
    const activeStore = new ProfileScopedStore(base, active.id);
    expect(activeStore.profileId).toBe(olivia.id);
    expect(buildProfileProgressSummary(active, activeStore).quizzesMastered).toBe(0);
    expect(buildProfileProgressSummary(aurora, stores.get(aurora.id)!).quizzesMastered).toBe(1);
  });
});

describe("reset and delete isolation", () => {
  it("resetting one breed does not wipe the whole profile", () => {
    const { aurora, stores } = setup();
    const s = stores.get(aurora.id)!;
    s.setItem("adventure:husky", adventureSave());
    s.setItem("adventure:beagle", adventureSave({ adventureId: "beagle" }));
    s.setItem("reward:husky", rewardSave({ normalStickerUnlocked: true }));
    resetBreedProgress(s, "husky");
    expect(s.getItem("adventure:husky")).toBeNull();
    expect(s.getItem("reward:husky")).toBeNull();
    expect(s.getItem("adventure:beagle")).not.toBeNull();
  });

  it("resetting one profile's progress does not affect others", () => {
    const { base, registry, aurora, olivia, stores } = setup();
    stores.get(aurora.id)!.setItem("reward:husky", rewardSave({ normalStickerUnlocked: true }));
    stores.get(olivia.id)!.setItem("reward:husky", rewardSave({ normalStickerUnlocked: true }));
    expect(resetProfileProgress(registry, base, aurora.id)).toBe(true);
    expect(stores.get(aurora.id)!.keys()).toEqual([]);
    expect(stores.get(olivia.id)!.getItem("reward:husky")).not.toBeNull();
    // identity preserved
    expect(registry.getProfile(aurora.id)!.displayName).toBe("Aurora");
  });

  it("deleting a profile removes only its namespace", () => {
    const { base, registry, aurora, olivia, stores } = setup();
    stores.get(aurora.id)!.setItem("reward:husky", rewardSave());
    stores.get(olivia.id)!.setItem("reward:husky", rewardSave());
    expect(deleteProfileAndData(registry, aurora.id)).toBe(true);
    expect(base.getItem(`kiki:v1:profile:${aurora.id}:reward:husky`)).toBeNull();
    expect(base.getItem(`kiki:v1:profile:${olivia.id}:reward:husky`)).not.toBeNull();
    expect(registry.profileCount).toBe(3); // setup created 4
  });

  it("a third and fourth profile work without engine changes", () => {
    const { base, registry } = setup();
    const p3 = registry.createProfile({ displayName: "Kid3" });
    const p4 = registry.createProfile({ displayName: "Kid4" });
    const s3 = new ProfileScopedStore(base, p3.id);
    const s4 = new ProfileScopedStore(base, p4.id);
    s3.setItem("reward:husky", rewardSave({ normalStickerUnlocked: true }));
    expect(registry.profileCount).toBe(6);
    expect(p3.id).not.toBe(p4.id);
    expect(buildProfileProgressSummary(p3, s3).normalStickers).toBe(1);
    expect(buildProfileProgressSummary(p4, s4).normalStickers).toBe(0);
  });
});
