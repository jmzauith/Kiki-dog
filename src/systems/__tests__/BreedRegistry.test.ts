import { describe, it, expect } from "vitest";
import {
  BreedRegistry,
  FINAL_TWELVE_BREEDS,
  validateRegistry,
  assertValidRegistry,
  type BreedDefinition,
} from "../BreedRegistry";

const EXPECTED_ORDER = [
  "husky",
  "golden-retriever",
  "beagle",
  "dachshund",
  "border-collie",
  "dalmatian",
  "shiba-inu",
  "bernese-mountain-dog",
  "cavalier-king-charles-spaniel",
  "labrador-retriever",
  "chow-chow",
  "pug",
];

describe("final 12 roster", () => {
  it("contains exactly the finalized 12 breeds", () => {
    expect(FINAL_TWELVE_BREEDS).toHaveLength(12);
    expect(new BreedRegistry().total).toBe(12);
  });

  it("lists the breeds in João's exact order", () => {
    expect(new BreedRegistry().all.map((b) => b.id)).toEqual(EXPECTED_ORDER);
  });

  it("does NOT include Poodle", () => {
    expect(FINAL_TWELVE_BREEDS.some((b) => b.id.includes("poodle"))).toBe(false);
  });

  it("does NOT include Samoyed", () => {
    expect(FINAL_TWELVE_BREEDS.some((b) => b.id.includes("samoyed"))).toBe(false);
  });

  it("includes Chow Chow and Pug", () => {
    const r = new BreedRegistry();
    expect(r.has("chow-chow")).toBe(true);
    expect(r.has("pug")).toBe(true);
  });

  it("does NOT include Kiki/Corgi as a collectible breed", () => {
    const r = new BreedRegistry();
    expect(r.has("corgi")).toBe(false);
    expect(r.has("kiki")).toBe(false);
  });

  it("has unique breed ids", () => {
    const ids = FINAL_TWELVE_BREEDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique album slot ids", () => {
    const slots = FINAL_TWELVE_BREEDS.map((b) => b.albumSlotId);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("has unique, sequential orders 1..12", () => {
    const orders = FINAL_TWELVE_BREEDS.map((b) => b.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("wires every breed to adventure/reward/quiz ids", () => {
    for (const b of FINAL_TWELVE_BREEDS) {
      expect(b.adventureId).toBeTruthy();
      expect(b.rewardId).toBeTruthy();
      expect(b.factsQuizId).toBeTruthy();
      expect(b.displayName).toBeTruthy();
    }
  });

  it("looks breeds up by id and album slot", () => {
    const r = new BreedRegistry();
    expect(r.byId("beagle")?.displayName).toBe("Beagle");
    expect(r.byAlbumSlot("album-slot-01")?.id).toBe("husky");
    expect(r.byId("nope")).toBeUndefined();
  });
});

describe("registry validation", () => {
  it("rejects duplicate ids", () => {
    const dup = [...FINAL_TWELVE_BREEDS, { ...FINAL_TWELVE_BREEDS[0] }];
    expect(validateRegistry(dup).some((p) => p.includes("duplicate breed id"))).toBe(true);
    expect(() => new BreedRegistry(dup)).toThrow();
  });

  it("rejects duplicate album slots", () => {
    const dup = FINAL_TWELVE_BREEDS.map((b, i) =>
      i === 1 ? { ...b, albumSlotId: "album-slot-01" } : b,
    );
    expect(validateRegistry(dup).some((p) => p.includes("duplicate albumSlotId"))).toBe(true);
  });

  it("rejects an empty roster", () => {
    expect(validateRegistry([]).length).toBeGreaterThan(0);
  });

  it("assertValidRegistry passes for the canonical roster", () => {
    expect(() => assertValidRegistry(FINAL_TWELVE_BREEDS)).not.toThrow();
  });
});

describe("future-proofing", () => {
  const extra: BreedDefinition = {
    id: "corgi-xiii",
    displayName: "Test Breed XIII",
    order: 13,
    enabled: true,
    adventureId: "xiii-adventure",
    rewardId: "xiii",
    factsQuizId: "xiii",
    albumSlotId: "album-slot-13",
  };

  it("supports expansion beyond 12 without engine changes", () => {
    const r = new BreedRegistry().withAdded(extra);
    expect(r.total).toBe(13);
    expect(r.has("corgi-xiii")).toBe(true);
    expect(r.all[12].id).toBe("corgi-xiii");
  });

  it("supports replacing one breed later", () => {
    const r = new BreedRegistry().withReplaced({
      ...FINAL_TWELVE_BREEDS[2],
      displayName: "Beagle (Remastered)",
      worldTheme: "new-meadow",
    });
    expect(r.byId("beagle")?.displayName).toBe("Beagle (Remastered)");
    expect(r.total).toBe(12);
  });

  it("supports disabling a breed (excluded from completion)", () => {
    const r = new BreedRegistry().withDisabled("pug");
    expect(r.enabledCount).toBe(11);
    expect(r.total).toBe(12); // roster unchanged, only counting changes
  });

  it("registry instances are immutable", () => {
    const base = new BreedRegistry();
    base.withAdded(extra);
    expect(base.total).toBe(12);
  });

  it("reorders the album by changing order numbers", () => {
    const defs = FINAL_TWELVE_BREEDS.map((b) =>
      b.id === "pug" ? { ...b, order: 1 } : b.id === "husky" ? { ...b, order: 12 } : b,
    );
    const r = new BreedRegistry(defs);
    expect(r.all[0].id).toBe("pug");
    expect(r.all[11].id).toBe("husky");
  });
});
