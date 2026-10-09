import { describe, it, expect } from "vitest";
import {
  validateFact,
  validateBreedProfile,
  assertValidBreedProfile,
  getFact,
  factsByCategory,
  type BreedProfile,
  type BreedFact,
} from "../BreedFacts";

const goodFact = (over: Partial<BreedFact> = {}): BreedFact => ({
  id: "test-fact",
  category: "fun",
  text: "A short, friendly fact for kids.",
  ...over,
});

const goodProfile = (over: Partial<BreedProfile> = {}): BreedProfile => ({
  breedId: "testbreed",
  breedName: "Test Breed",
  tagline: "A test breed!",
  facts: [goodFact({ id: "f1" }), goodFact({ id: "f2", category: "origin" })],
  ...over,
});

describe("validateFact", () => {
  it("accepts a well-formed fact", () => {
    expect(validateFact(goodFact())).toEqual([]);
  });

  it("rejects empty text", () => {
    const problems = validateFact(goodFact({ text: "   " }));
    expect(problems.some((p) => p.includes("empty text"))).toBe(true);
  });

  it("rejects unknown categories", () => {
    const problems = validateFact(
      goodFact({ category: "superpower" as never }),
    );
    expect(problems.some((p) => p.includes("unknown category"))).toBe(true);
  });

  it("rejects missing ids", () => {
    const problems = validateFact(goodFact({ id: "" }));
    expect(problems.some((p) => p.includes("id"))).toBe(true);
  });

  it("flags overly long facts (age-9 readability guardrail)", () => {
    const long = Array(70).fill("word").join(" ");
    const problems = validateFact(goodFact({ text: long }));
    expect(problems.some((p) => p.includes("70 words"))).toBe(true);
  });

  it("handles non-objects without throwing", () => {
    expect(validateFact(null as never).length).toBeGreaterThan(0);
  });
});

describe("validateBreedProfile", () => {
  it("accepts a well-formed profile", () => {
    expect(validateBreedProfile(goodProfile())).toEqual([]);
  });

  it("rejects duplicate fact ids", () => {
    const p = goodProfile({
      facts: [goodFact({ id: "dup" }), goodFact({ id: "dup" })],
    });
    const problems = validateBreedProfile(p);
    expect(problems.some((x) => x.includes('duplicate fact id "dup"'))).toBe(true);
  });

  it("rejects empty fact lists", () => {
    const problems = validateBreedProfile(goodProfile({ facts: [] }));
    expect(problems.length).toBeGreaterThan(0);
  });

  it("rejects missing breedId / breedName", () => {
    expect(
      validateBreedProfile(goodProfile({ breedId: "" })).length,
    ).toBeGreaterThan(0);
    expect(
      validateBreedProfile(goodProfile({ breedName: "  " })).length,
    ).toBeGreaterThan(0);
  });

  it("assertValidBreedProfile throws with a readable message", () => {
    expect(() => assertValidBreedProfile(goodProfile({ facts: [] }))).toThrow(
      /Invalid breed profile/,
    );
  });
});

describe("fact lookup helpers", () => {
  const profile = goodProfile();

  it("getFact finds by id and returns undefined for unknown", () => {
    expect(getFact(profile, "f1")?.text).toContain("friendly fact");
    expect(getFact(profile, "nope")).toBeUndefined();
  });

  it("factsByCategory filters correctly", () => {
    expect(factsByCategory(profile, "origin").map((f) => f.id)).toEqual(["f2"]);
    expect(factsByCategory(profile, "job")).toEqual([]);
  });
});
