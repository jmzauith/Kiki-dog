import { describe, it, expect } from "vitest";
import { BreedRegistry } from "../BreedRegistry";
import {
  UltimateRewardState,
  ULTIMATE_CORGI_QUIZ_CONFIG,
  GOLDEN_KIKI_SAVE_KEY,
  saveGoldenKiki,
  loadGoldenKiki,
  clearGoldenKiki,
  memoryStore,
} from "../GoldenKiki";

function completeCollection(s: UltimateRewardState, goldenToo = false): void {
  for (const b of new BreedRegistry().enabled) {
    s.recordBreed(b.id, {
      adventureCompleted: true,
      normalStickerUnlocked: true,
      ...(goldenToo ? { goldenStickerUnlocked: true } : {}),
    });
  }
}

describe("ultimate quiz gating", () => {
  it("11/12 does NOT unlock the Ultimate Corgi Quiz", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    // Remove one sticker:
    const s2 = new UltimateRewardState();
    for (const b of new BreedRegistry().enabled) {
      if (b.id === "pug") continue;
      s2.recordBreed(b.id, { adventureCompleted: true, normalStickerUnlocked: true });
    }
    expect(s2.ultimateQuizUnlocked).toBe(false);
    expect(s2.phase).toBe("collecting");
    expect(s.ultimateQuizUnlocked).toBe(true); // sanity: 12/12 does
  });

  it("12/12 normal stickers unlocks it", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    expect(s.ultimateQuizUnlocked).toBe(true);
    expect(s.phase).toBe("quiz-unlocked");
  });

  it("golden breed stickers are irrelevant to the quiz prerequisite", () => {
    const s = new UltimateRewardState();
    // 12/12 normal, zero golden:
    completeCollection(s, false);
    expect(s.ultimateQuizUnlocked).toBe(true);
    // 12/12 golden but only 11 normal: still locked:
    const s2 = new UltimateRewardState();
    for (const b of new BreedRegistry().enabled) {
      s2.recordBreed(b.id, {
        goldenStickerUnlocked: true,
        ...(b.id === "pug" ? {} : { normalStickerUnlocked: true }),
      });
    }
    expect(s2.ultimateQuizUnlocked).toBe(false);
  });
});

describe("golden kiki unlock", () => {
  it("cannot unlock before collection completion", () => {
    const s = new UltimateRewardState();
    const r = s.recordUltimateQuizResult(1.0); // perfect quiz, no collection
    expect(r.passed).toBe(true);
    expect(r.goldenKikiUnlocked).toBe(false);
    expect(s.goldenKikiUnlocked).toBe(false);
    expect(s.phase).toBe("collecting");
  });

  it("cannot unlock before quiz success (12/12 alone is not enough)", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    expect(s.goldenKikiUnlocked).toBe(false);
    expect(s.phase).toBe("quiz-unlocked");
  });

  it("a failed quiz does not unlock it", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    const r = s.recordUltimateQuizResult(0.6);
    expect(r.passed).toBe(false);
    expect(r.goldenKikiUnlocked).toBe(false);
  });

  it("unlocks after a valid quiz pass at 12/12", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    const r = s.recordUltimateQuizResult(0.8);
    expect(r.passed).toBe(true);
    expect(r.goldenKikiNewlyUnlocked).toBe(true);
    expect(r.goldenKikiUnlocked).toBe(true);
    expect(s.phase).toBe("golden-kiki");
  });

  it("unlock is idempotent — replaying never corrupts or double-awards", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    const first = s.recordUltimateQuizResult(1.0);
    expect(first.goldenKikiNewlyUnlocked).toBe(true);
    const second = s.recordUltimateQuizResult(0.8);
    expect(second.goldenKikiNewlyUnlocked).toBe(false);
    expect(second.goldenKikiUnlocked).toBe(true);
    // Worse replay keeps the best:
    expect(s.ultimateQuizBest).toBe(1.0);
    expect(s.ultimateQuizCompleted).toBe(true);
  });

  it("quiz config uses the 4/5 pass rule", () => {
    expect(ULTIMATE_CORGI_QUIZ_CONFIG.questionsPerSession).toBe(5);
    expect(ULTIMATE_CORGI_QUIZ_CONFIG.passThreshold).toBe(0.8);
  });

  it("reset returns to the start", () => {
    const s = new UltimateRewardState();
    completeCollection(s);
    s.recordUltimateQuizResult(1.0);
    s.reset();
    expect(s.goldenKikiUnlocked).toBe(false);
    expect(s.phase).toBe("collecting");
  });
});

describe("persistence", () => {
  it("round-trips collection + quiz + golden state", () => {
    const store = memoryStore();
    const s = new UltimateRewardState();
    completeCollection(s);
    s.recordBreed("husky", { goldenStickerUnlocked: true, quizMastery: 1 });
    s.recordUltimateQuizResult(1.0);
    expect(saveGoldenKiki(GOLDEN_KIKI_SAVE_KEY, s, store)).toBe(true);

    const loaded = loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store);
    expect(loaded).not.toBeNull();
    expect(loaded!.goldenKikiUnlocked).toBe(true);
    expect(loaded!.phase).toBe("golden-kiki");
    expect(loaded!.collection.normalStickersCollected).toBe(12);
    expect(loaded!.collection.entry("husky").goldenStickerUnlocked).toBe(true);
    expect(loaded!.ultimateQuizBest).toBe(1.0);
  });

  it("survives a simulated refresh mid-collection", () => {
    const store = memoryStore();
    const s = new UltimateRewardState();
    s.recordBreed("husky", { adventureCompleted: true, normalStickerUnlocked: true });
    s.recordBreed("beagle", { adventureCompleted: true });
    saveGoldenKiki(GOLDEN_KIKI_SAVE_KEY, s, store);

    const loaded = loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)!;
    expect(loaded.collection.normalStickersCollected).toBe(1);
    expect(loaded.collection.adventuresCompleted).toBe(2);
    expect(loaded.ultimateQuizUnlocked).toBe(false);
    expect(loaded.goldenKikiUnlocked).toBe(false);
  });

  it("malformed saves degrade to null, never throw", () => {
    const store = memoryStore();
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)).toBeNull();
    store.setItem(GOLDEN_KIKI_SAVE_KEY, "not-json{{{");
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)).toBeNull();
    store.setItem(GOLDEN_KIKI_SAVE_KEY, JSON.stringify({ version: 999 }));
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)).toBeNull();
    store.setItem(GOLDEN_KIKI_SAVE_KEY, JSON.stringify({ version: 1 }));
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)).not.toBeNull();
  });

  it("a tampered save cannot grant Golden Kiki early", () => {
    const store = memoryStore();
    // Hand-edited: claims quiz completed with a below-threshold best.
    store.setItem(
      GOLDEN_KIKI_SAVE_KEY,
      JSON.stringify({
        version: 1,
        collection: { breeds: {} },
        ultimateQuizCompleted: true,
        ultimateQuizBest: 0.2,
        savedAt: Date.now(),
      }),
    );
    const loaded = loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)!;
    expect(loaded.ultimateQuizCompleted).toBe(false);
    expect(loaded.goldenKikiUnlocked).toBe(false);
  });

  it("clear wipes the save", () => {
    const store = memoryStore();
    const s = new UltimateRewardState();
    completeCollection(s);
    saveGoldenKiki(GOLDEN_KIKI_SAVE_KEY, s, store);
    clearGoldenKiki(GOLDEN_KIKI_SAVE_KEY, store);
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), store)).toBeNull();
  });

  it("uses its own storage key (never corrupts other saves)", () => {
    const store = memoryStore();
    store.setItem("kiki-dog:rewards:husky:v1", "untouched");
    const s = new UltimateRewardState();
    saveGoldenKiki(GOLDEN_KIKI_SAVE_KEY, s, store);
    expect(store.getItem("kiki-dog:rewards:husky:v1")).toBe("untouched");
  });

  it("throwing store degrades gracefully", () => {
    const bad = {
      getItem: () => { throw new Error("nope"); },
      setItem: () => { throw new Error("nope"); },
      removeItem: () => { throw new Error("nope"); },
    };
    const s = new UltimateRewardState();
    expect(saveGoldenKiki(GOLDEN_KIKI_SAVE_KEY, s, bad)).toBe(false);
    expect(loadGoldenKiki(GOLDEN_KIKI_SAVE_KEY, new BreedRegistry(), bad)).toBeNull();
    expect(() => clearGoldenKiki(GOLDEN_KIKI_SAVE_KEY, bad)).not.toThrow();
  });
});
