import { describe, it, expect } from "vitest";
import { BreedRegistry } from "../BreedRegistry";
import { CollectionProgress } from "../CollectionProgress";

function fullProgress(except?: string): CollectionProgress {
  const p = new CollectionProgress(new BreedRegistry());
  for (const b of new BreedRegistry().enabled) {
    if (b.id === except) continue;
    p.recordBreed(b.id, { adventureCompleted: true, normalStickerUnlocked: true });
  }
  return p;
}

describe("collection totals", () => {
  it("starts empty", () => {
    const p = new CollectionProgress(new BreedRegistry());
    expect(p.adventuresCompleted).toBe(0);
    expect(p.normalStickersCollected).toBe(0);
    expect(p.goldenStickersCollected).toBe(0);
    expect(p.completionPercent).toBe(0);
    expect(p.collectionComplete).toBe(false);
  });

  it("counts adventures and stickers per breed", () => {
    const p = new CollectionProgress(new BreedRegistry());
    p.recordBreed("husky", { adventureCompleted: true, normalStickerUnlocked: true });
    p.recordBreed("beagle", { adventureCompleted: true });
    expect(p.adventuresCompleted).toBe(2);
    expect(p.normalStickersCollected).toBe(1);
  });

  it("completionPercent is based on normal stickers (0..100)", () => {
    const p = new CollectionProgress(new BreedRegistry());
    p.recordBreed("husky", { normalStickerUnlocked: true });
    p.recordBreed("beagle", { normalStickerUnlocked: true });
    p.recordBreed("pug", { normalStickerUnlocked: true });
    expect(p.completionPercent).toBe(25); // 3/12
  });

  it("11/12 is not complete; 12/12 is", () => {
    const almost = fullProgress("pug");
    expect(almost.normalStickersCollected).toBe(11);
    expect(almost.collectionComplete).toBe(false);
    expect(almost.completionPercent).toBe(92);

    const all = fullProgress();
    expect(all.normalStickersCollected).toBe(12);
    expect(all.collectionComplete).toBe(true);
    expect(all.completionPercent).toBe(100);
  });

  it("golden stickers do NOT count toward completion", () => {
    const p = new CollectionProgress(new BreedRegistry());
    // Every breed golden, but no normal stickers:
    for (const b of new BreedRegistry().enabled) {
      p.recordBreed(b.id, { goldenStickerUnlocked: true });
    }
    expect(p.goldenStickersCollected).toBe(12);
    expect(p.normalStickersCollected).toBe(0);
    expect(p.collectionComplete).toBe(false);
    expect(p.completionPercent).toBe(0);
  });

  it("adventure completion alone does not complete the collection", () => {
    const p = new CollectionProgress(new BreedRegistry());
    for (const b of new BreedRegistry().enabled) {
      p.recordBreed(b.id, { adventureCompleted: true });
    }
    expect(p.collectionComplete).toBe(false);
  });

  it("progress is sticky — replays and re-saves never un-earn", () => {
    const p = new CollectionProgress(new BreedRegistry());
    p.recordBreed("husky", { normalStickerUnlocked: true, quizMastery: 0.9 });
    p.recordBreed("husky", { quizMastery: 0.2 }); // worse replay
    const e = p.entry("husky");
    expect(e.normalStickerUnlocked).toBe(true);
    expect(e.quizMastery).toBe(0.9); // best kept
  });

  it("ignores unknown breed ids (stale saves after roster changes)", () => {
    const p = new CollectionProgress(new BreedRegistry());
    p.recordBreed("poodle", { normalStickerUnlocked: true });
    expect(p.normalStickersCollected).toBe(0);
  });

  it("reset clears everything", () => {
    const p = fullProgress();
    p.reset();
    expect(p.normalStickersCollected).toBe(0);
    expect(p.collectionComplete).toBe(false);
  });

  it("disabled breeds are excluded from completion", () => {
    const registry = new BreedRegistry().withDisabled("pug");
    const p = new CollectionProgress(registry);
    for (const b of registry.enabled) {
      p.recordBreed(b.id, { normalStickerUnlocked: true });
    }
    expect(p.totalBreeds).toBe(11);
    expect(p.collectionComplete).toBe(true);
  });
});

describe("serialization", () => {
  it("round-trips through JSON", () => {
    const p = fullProgress("pug");
    p.recordBreed("husky", { goldenStickerUnlocked: true, quizMastery: 1 });
    const restored = CollectionProgress.fromJSON(
      new BreedRegistry(),
      JSON.parse(JSON.stringify(p.toJSON())),
    );
    expect(restored.normalStickersCollected).toBe(11);
    expect(restored.goldenStickersCollected).toBe(1);
    expect(restored.entry("husky").quizMastery).toBe(1);
    expect(restored.collectionComplete).toBe(false);
  });

  it("malformed data degrades to empty progress, never throws", () => {
    const r = new BreedRegistry();
    expect(CollectionProgress.fromJSON(r, null).normalStickersCollected).toBe(0);
    expect(CollectionProgress.fromJSON(r, {}).normalStickersCollected).toBe(0);
    expect(CollectionProgress.fromJSON(r, { breeds: "nope" }).normalStickersCollected).toBe(0);
    expect(
      CollectionProgress.fromJSON(r, { breeds: { husky: { normalStickerUnlocked: "yes" } } })
        .normalStickersCollected,
    ).toBe(0);
  });

  it("wrong-breed entries are dropped on load", () => {
    const r = new BreedRegistry();
    const restored = CollectionProgress.fromJSON(r, {
      breeds: { poodle: { normalStickerUnlocked: true }, husky: { normalStickerUnlocked: true } },
    });
    expect(restored.normalStickersCollected).toBe(1);
  });
});
