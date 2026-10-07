import { describe, expect, it } from "vitest";
import { AdventureProgress } from "../AdventureState";
import { HUSKY_ADVENTURE, HUSKY_SAVE_KEY } from "../HuskyAdventure";
import {
  clearAdventure,
  loadAdventure,
  markRaceComplete,
  memoryStore,
  saveAdventure,
} from "../AdventurePersistence";

function progressed(): AdventureProgress {
  const p = new AdventureProgress(HUSKY_ADVENTURE);
  p.completeEncounter("trailhead");
  p.completeEncounter("broken-bridge");
  p.completeEncounter("forest");
  p.setRoute("safe");
  p.completeEncounter("frozen-lake");
  p.completeEncounter("fallen-tree");
  p.completeEncounter("snow-pass");
  p.currentNodeId = "snow-pass";
  p.revealSecret("secret-igloo");
  p.completeEncounter("secret-igloo");
  p.recordBonusChallenge();
  return p;
}

describe("save/load round-trip", () => {
  it("saves and restores full progress", () => {
    const store = memoryStore();
    const p = progressed();
    expect(saveAdventure(HUSKY_SAVE_KEY, p, store)).toBe(true);
    const q = loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store);
    expect(q).not.toBeNull();
    expect(q!.completed.has("broken-bridge")).toBe(true);
    expect(q!.chosenRoute).toBe("safe");
    expect(q!.currentNodeId).toBe("snow-pass");
    expect(q!.secretsFound.has("secret-igloo")).toBe(true);
    expect(q!.bonusChallengesCompleted).toBe(1);
  });

  it("returns null when there is no save", () => {
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, memoryStore())).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    const store = memoryStore();
    store.setItem(HUSKY_SAVE_KEY, "{not json");
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)).toBeNull();
  });

  it("returns null for a version mismatch", () => {
    const store = memoryStore();
    const p = progressed();
    const data = p.toJSON() as unknown as Record<string, unknown>;
    data.version = 999;
    store.setItem(HUSKY_SAVE_KEY, JSON.stringify(data));
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)).toBeNull();
  });

  it("returns null for a save from a different adventure", () => {
    const store = memoryStore();
    const p = progressed();
    const data = p.toJSON() as unknown as Record<string, unknown>;
    data.adventureId = "corgi";
    store.setItem(HUSKY_SAVE_KEY, JSON.stringify(data));
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)).toBeNull();
  });

  it("clearAdventure wipes the save (player-safe reset)", () => {
    const store = memoryStore();
    saveAdventure(HUSKY_SAVE_KEY, progressed(), store);
    clearAdventure(HUSKY_SAVE_KEY, store);
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)).toBeNull();
  });

  it("save/load survive a simulated refresh mid-adventure", () => {
    const store = memoryStore();
    // Play to frozen-lake, "refresh" (drop the in-memory object), resume.
    const before = new AdventureProgress(HUSKY_ADVENTURE);
    before.completeEncounter("trailhead");
    before.completeEncounter("broken-bridge");
    before.completeEncounter("forest");
    before.setRoute("safe");
    before.completeEncounter("frozen-lake");
    before.currentNodeId = "frozen-lake";
    saveAdventure(HUSKY_SAVE_KEY, before, store);
    const after = loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)!;
    // Continue playing from the restored state.
    expect(after.completeEncounter("fallen-tree")).toBe(true);
    after.currentNodeId = "fallen-tree";
    expect(after.requiredRemaining()).toContain("summit-camp");
    expect(after.canUnlockSticker()).toBe(false);
  });
});

describe("markRaceComplete", () => {
  it("records the race outcome into the save", () => {
    const store = memoryStore();
    saveAdventure(HUSKY_SAVE_KEY, progressed(), store);
    const p = markRaceComplete(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, { turns: 4, turbos: 1 }, store)!;
    expect(p.raceCompleted).toBe(true);
    expect(p.raceTurns).toBe(4);
    expect(p.raceTurbos).toBe(1);
    // Persisted too.
    const q = loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, store)!;
    expect(q.raceCompleted).toBe(true);
    expect(q.raceTurns).toBe(4);
  });

  it("works even when no save exists yet", () => {
    const store = memoryStore();
    const p = markRaceComplete(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, { turns: 3, turbos: 2 }, store)!;
    expect(p.raceCompleted).toBe(true);
    // …but the sticker stays locked: required encounters are missing.
    expect(p.canUnlockSticker()).toBe(false);
  });
});

describe("storage edge cases", () => {
  it("save returns false and load returns null without a store", () => {
    expect(saveAdventure(HUSKY_SAVE_KEY, progressed(), null)).toBe(false);
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, null)).toBeNull();
  });

  it("a throwing store degrades gracefully", () => {
    const bad = {
      getItem: () => { throw new Error("denied"); },
      setItem: () => { throw new Error("denied"); },
      removeItem: () => { throw new Error("denied"); },
    };
    expect(saveAdventure(HUSKY_SAVE_KEY, progressed(), bad)).toBe(false);
    expect(loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE, bad)).toBeNull();
    expect(() => clearAdventure(HUSKY_SAVE_KEY, bad)).not.toThrow();
  });
});
