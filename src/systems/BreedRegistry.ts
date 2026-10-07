/**
 * BreedRegistry — the single canonical roster of collectible breeds for
 * Kiki's Dog Adventure.
 *
 * The final roster is EXACTLY 12 breeds. Poodle and Samoyed are NOT part of
 * the roster. Kiki (the corgi) is NOT a collectible breed — she is the
 * special final completion reward (see GoldenKiki.ts).
 *
 * Design rules:
 *  - Pure TypeScript, zero imports: the registry is data + a thin class.
 *    The rest of the app should eventually read this instead of hardcoding
 *    breed lists anywhere.
 *  - Future-proofing without over-engineering: replacing a breed, reordering
 *    album slots, or expanding beyond 12 are all data operations on a
 *    BreedRegistry instance — no engine code changes. Totals and completion
 *    rules are computed from the registry, never hardcoded to 12.
 *  - `enabled` exists so a breed can be shipped disabled (e.g. a world not
 *    built yet) without renumbering anything. Completion rules count only
 *    enabled breeds.
 */

export interface BreedDefinition {
  /** Stable machine id, e.g. "golden-retriever". Never changes once shipped. */
  id: string;
  /** Display name, e.g. "Golden Retriever". */
  displayName: string;
  /** Canonical album order (1-based). Reorder the album by changing these. */
  order: number;
  /** A disabled breed ships in the roster but doesn't count toward completion. */
  enabled: boolean;
  /** Adventure/progression definition id (AdventureState world). */
  adventureId: string;
  /** Reward definition id (BreedRewardDefinition.breedId). */
  rewardId: string;
  /** Facts/quiz dataset id (BreedProfile breedId). */
  factsQuizId: string;
  /** Stable album slot id — the sticker book slot this breed fills. */
  albumSlotId: string;
  /** Optional hook for world/theme metadata (art pack id, region name...). */
  worldTheme?: string;
}

/**
 * THE FINAL 12. This is the canonical roster. Do not add Poodle or Samoyed.
 * Kiki/Corgi is deliberately absent — she is the endgame reward, not a
 * collectible breed.
 */
export const FINAL_TWELVE_BREEDS: BreedDefinition[] = [
  { id: "husky", displayName: "Husky", order: 1, enabled: true, adventureId: "husky-adventure", rewardId: "husky", factsQuizId: "husky", albumSlotId: "album-slot-01", worldTheme: "snowy-peaks" },
  { id: "golden-retriever", displayName: "Golden Retriever", order: 2, enabled: true, adventureId: "golden-retriever-adventure", rewardId: "golden-retriever", factsQuizId: "golden-retriever", albumSlotId: "album-slot-02", worldTheme: "golden-bay" },
  { id: "beagle", displayName: "Beagle", order: 3, enabled: true, adventureId: "beagle-adventure", rewardId: "beagle", factsQuizId: "beagle", albumSlotId: "album-slot-03" },
  { id: "dachshund", displayName: "Dachshund", order: 4, enabled: true, adventureId: "dachshund-adventure", rewardId: "dachshund", factsQuizId: "dachshund", albumSlotId: "album-slot-04" },
  { id: "border-collie", displayName: "Border Collie", order: 5, enabled: true, adventureId: "border-collie-adventure", rewardId: "border-collie", factsQuizId: "border-collie", albumSlotId: "album-slot-05" },
  { id: "dalmatian", displayName: "Dalmatian", order: 6, enabled: true, adventureId: "dalmatian-adventure", rewardId: "dalmatian", factsQuizId: "dalmatian", albumSlotId: "album-slot-06" },
  { id: "shiba-inu", displayName: "Shiba Inu", order: 7, enabled: true, adventureId: "shiba-inu-adventure", rewardId: "shiba-inu", factsQuizId: "shiba-inu", albumSlotId: "album-slot-07" },
  { id: "bernese-mountain-dog", displayName: "Bernese Mountain Dog", order: 8, enabled: true, adventureId: "bernese-mountain-dog-adventure", rewardId: "bernese-mountain-dog", factsQuizId: "bernese-mountain-dog", albumSlotId: "album-slot-08" },
  { id: "cavalier-king-charles-spaniel", displayName: "Cavalier King Charles Spaniel", order: 9, enabled: true, adventureId: "cavalier-king-charles-spaniel-adventure", rewardId: "cavalier-king-charles-spaniel", factsQuizId: "cavalier-king-charles-spaniel", albumSlotId: "album-slot-09" },
  { id: "labrador-retriever", displayName: "Labrador Retriever", order: 10, enabled: true, adventureId: "labrador-retriever-adventure", rewardId: "labrador-retriever", factsQuizId: "labrador-retriever", albumSlotId: "album-slot-10" },
  { id: "chow-chow", displayName: "Chow Chow", order: 11, enabled: true, adventureId: "chow-chow-adventure", rewardId: "chow-chow", factsQuizId: "chow-chow", albumSlotId: "album-slot-11" },
  { id: "pug", displayName: "Pug", order: 12, enabled: true, adventureId: "pug-adventure", rewardId: "pug", factsQuizId: "pug", albumSlotId: "album-slot-12" },
];

/** Validate a roster; empty list = valid. */
export function validateRegistry(defs: BreedDefinition[]): string[] {
  const problems: string[] = [];
  if (!Array.isArray(defs) || defs.length === 0) {
    return ["breed registry must not be empty"];
  }
  const ids = new Set<string>();
  const slots = new Set<string>();
  const orders = new Set<number>();
  for (const d of defs) {
    if (!d || typeof d !== "object") {
      problems.push("registry contains a non-object entry");
      continue;
    }
    if (!d.id || d.id.trim() === "") problems.push("breed id must be non-empty");
    else if (ids.has(d.id)) problems.push(`duplicate breed id "${d.id}"`);
    else ids.add(d.id);
    if (!d.displayName || d.displayName.trim() === "") {
      problems.push(`breed "${d.id}" displayName must be non-empty`);
    }
    if (!d.albumSlotId || d.albumSlotId.trim() === "") {
      problems.push(`breed "${d.id}" albumSlotId must be non-empty`);
    } else if (slots.has(d.albumSlotId)) {
      problems.push(`duplicate albumSlotId "${d.albumSlotId}"`);
    } else slots.add(d.albumSlotId);
    if (!Number.isInteger(d.order) || d.order < 1) {
      problems.push(`breed "${d.id}" order must be a positive integer`);
    } else if (orders.has(d.order)) {
      problems.push(`duplicate order ${d.order}`);
    } else orders.add(d.order);
    for (const f of ["adventureId", "rewardId", "factsQuizId"] as const) {
      if (!d[f] || d[f].trim() === "") {
        problems.push(`breed "${d.id}" ${f} must be non-empty`);
      }
    }
  }
  return problems;
}

/** Fail fast on a bad roster (dev time). */
export function assertValidRegistry(defs: BreedDefinition[]): void {
  const problems = validateRegistry(defs);
  if (problems.length > 0) {
    throw new Error(`Invalid breed registry:\n- ${problems.join("\n- ")}`);
  }
}

// The canonical roster self-validates at import (dev-time fail fast).
assertValidRegistry(FINAL_TWELVE_BREEDS);

/**
 * A usable roster. Defaults to the final 12; pass a custom array to model
 * future expansion, breed replacement, or disabled breeds. Instances are
 * immutable — withReplaced/withAdded return new registries.
 */
export class BreedRegistry {
  readonly breeds: BreedDefinition[];

  constructor(defs: BreedDefinition[] = FINAL_TWELVE_BREEDS) {
    assertValidRegistry(defs);
    this.breeds = [...defs].sort((a, b) => a.order - b.order);
  }

  /** All breeds in album order. */
  get all(): BreedDefinition[] {
    return [...this.breeds];
  }

  /** Only enabled breeds — the ones that count toward completion. */
  get enabled(): BreedDefinition[] {
    return this.breeds.filter((b) => b.enabled);
  }

  get total(): number {
    return this.breeds.length;
  }

  get enabledCount(): number {
    return this.enabled.length;
  }

  byId(id: string): BreedDefinition | undefined {
    return this.breeds.find((b) => b.id === id);
  }

  byAlbumSlot(slotId: string): BreedDefinition | undefined {
    return this.breeds.find((b) => b.albumSlotId === slotId);
  }

  has(id: string): boolean {
    return this.byId(id) !== undefined;
  }

  /** Replace one breed's definition (e.g. a reworked world) — new instance. */
  withReplaced(def: BreedDefinition): BreedRegistry {
    return new BreedRegistry(
      this.breeds.map((b) => (b.id === def.id ? def : b)),
    );
  }

  /** Add a breed (future expansion beyond 12) — new instance. */
  withAdded(def: BreedDefinition): BreedRegistry {
    return new BreedRegistry([...this.breeds, def]);
  }

  /** Only the enabled subset — new instance. */
  withDisabled(id: string): BreedRegistry {
    return new BreedRegistry(
      this.breeds.map((b) => (b.id === id ? { ...b, enabled: false } : b)),
    );
  }
}
