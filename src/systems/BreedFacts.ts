/**
 * BreedFacts — reusable breed fact data model for Kiki's Dog Adventure.
 *
 * A "breed profile" is the curated knowledge behind one collectible breed:
 * the facts a child reads after unlocking the breed sticker, and the source
 * material the quiz engine draws on. This module is pure data + validation —
 * no Phaser, no scenes, no quiz logic. Adding a future breed means adding
 * ONE data file shaped like this (see HuskyFacts.ts); engine code never
 * changes.
 *
 * Design rules:
 *  - Pure TypeScript, zero imports: compiles standalone against current main.
 *  - Child-friendly wording is a DATA responsibility, not engine magic: the
 *    dataset author writes short, concrete, jargon-free sentences (~age 9).
 *  - Validation is strict at load time (fail fast in dev) so a malformed
 *    breed dataset can never ship silently.
 */

export type BreedFactCategory =
  | "origin"
  | "size"
  | "temperament"
  | "job"
  | "trait"
  | "fun";

/** One learnable fact about a breed. */
export interface BreedFact {
  /** Stable id, e.g. "husky-origin". Unique within the breed. */
  id: string;
  category: BreedFactCategory;
  /** Child-friendly wording — one or two short sentences, ~age 9. */
  text: string;
}

/** The full knowledge profile for one breed. */
export interface BreedProfile {
  /** Stable id, e.g. "husky". Matches the reward system's breedId. */
  breedId: string;
  /** Display name, e.g. "Siberian Husky". */
  breedName: string;
  /** One-line tagline shown on the fact card, ~age 9. */
  tagline: string;
  facts: BreedFact[];
}

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  "origin",
  "size",
  "temperament",
  "job",
  "trait",
  "fun",
]);

/**
 * Validate a single fact. Returns a list of human-readable problems;
 * empty means valid.
 */
export function validateFact(fact: BreedFact): string[] {
  const problems: string[] = [];
  if (!fact || typeof fact !== "object") return ["fact is not an object"];
  if (!fact.id || typeof fact.id !== "string" || fact.id.trim() === "") {
    problems.push("fact id must be a non-empty string");
  }
  if (!VALID_CATEGORIES.has(fact.category)) {
    problems.push(
      `fact "${fact.id}" has unknown category "${String(fact.category)}"`,
    );
  }
  if (!fact.text || typeof fact.text !== "string" || fact.text.trim() === "") {
    problems.push(`fact "${fact.id}" has empty text`);
  } else {
    const words = fact.text.trim().split(/\s+/).length;
    // Guardrail for age-9 readability: facts should be short. This is a
    // warning-level smell, not a hard error — enforced below as an error
    // only when egregious, so datasets stay honest.
    if (words > 60) {
      problems.push(
        `fact "${fact.id}" is ${words} words — keep facts short for ~age 9`,
      );
    }
  }
  return problems;
}

/**
 * Validate a whole breed profile: every fact valid, ids unique, and the
 * profile itself well-formed. Returns problems; empty means valid.
 */
export function validateBreedProfile(profile: BreedProfile): string[] {
  const problems: string[] = [];
  if (!profile || typeof profile !== "object") return ["profile is not an object"];
  if (!profile.breedId || typeof profile.breedId !== "string" || profile.breedId.trim() === "") {
    problems.push("profile breedId must be a non-empty string");
  }
  if (!profile.breedName || typeof profile.breedName !== "string" || profile.breedName.trim() === "") {
    problems.push("profile breedName must be a non-empty string");
  }
  if (!Array.isArray(profile.facts) || profile.facts.length === 0) {
    problems.push("profile must contain at least one fact");
    return problems;
  }
  const seen = new Set<string>();
  for (const fact of profile.facts) {
    for (const p of validateFact(fact)) problems.push(p);
    if (fact && typeof fact.id === "string") {
      if (seen.has(fact.id)) problems.push(`duplicate fact id "${fact.id}"`);
      seen.add(fact.id);
    }
  }
  return problems;
}

/**
 * Assert a profile is valid, throwing a descriptive Error otherwise.
 * Call once when a breed dataset is registered (dev-time fail fast).
 */
export function assertValidBreedProfile(profile: BreedProfile): void {
  const problems = validateBreedProfile(profile);
  if (problems.length > 0) {
    throw new Error(
      `Invalid breed profile "${profile?.breedId}":\n- ${problems.join("\n- ")}`,
    );
  }
}

/** Look up a fact by id (undefined when unknown — never throws). */
export function getFact(
  profile: BreedProfile,
  factId: string,
): BreedFact | undefined {
  return profile.facts.find((f) => f.id === factId);
}

/** All facts of one category — handy for themed fact cards. */
export function factsByCategory(
  profile: BreedProfile,
  category: BreedFactCategory,
): BreedFact[] {
  return profile.facts.filter((f) => f.category === category);
}
