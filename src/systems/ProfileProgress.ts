/**
 * ProfileProgress — per-profile progress summaries, reset operations, and
 * legacy save migration for Kiki's Dog Adventure.
 *
 * INTEGRATION CONTRACT (for Lennon): game systems keep their existing
 * save/load functions and key shapes. Under profiles they receive a
 * ProfileScopedStore, and Lennon uses these RELATIVE key conventions:
 *
 *   adventure:<breedId>   AdventureProgress save (AdventureSaveData)
 *   reward:<breedId>      BreedRewardState save (BreedRewardSaveData)
 *   knowledge:<breedId>    BreedKnowledgeProgress save (QuizProgressSaveData)
 *   collection            CollectionProgress save ({breeds:{...}})
 *   golden-kiki           UltimateRewardState save
 *   meta:last-breed       last played breed id (written by recordLastPlayedBreed)
 *
 * The summary builder below reads these defensively — a missing or
 * malformed save contributes nothing, never crashes.
 */
import { PlayerProfile, ProfileRegistry } from "./PlayerProfiles";
import { ProfileScopedStore, StorageLike, clearProfileNamespace } from "./ProfileStore";
import {
  ACTIVE_PROFILE_KEY,
  PROFILES_REGISTRY_KEY,
} from "./PlayerProfiles";

export interface ProfileProgressSummary {
  profileId: string;
  displayName: string;
  avatarConfig: PlayerProfile["avatarConfig"];
  breedsStarted: number;
  breedsCompleted: number;
  normalStickers: number;
  goldenStickers: number;
  secretsFound: number;
  quizzesMastered: number;
  collectionComplete: boolean;
  goldenKikiUnlocked: boolean;
  completionPercent: number;
  lastPlayedBreed: string | null;
  lastPlayedAt: number;
}

/** Breed ids with a parseable adventure save. */
function readJsonObject(store: StorageLike, key: string): Record<string, unknown> | null {
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const asBool = (v: unknown): boolean => v === true;
const asNum = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/**
 * Build a progress summary for one profile by reading its namespaced saves.
 * totalBreeds is the collection size used for completionPercent (defaults
 * to the finalized 12). Everything is best-effort and defensive.
 */
export function buildProfileProgressSummary(
  profile: PlayerProfile,
  store: ProfileScopedStore,
  totalBreeds = 12,
): ProfileProgressSummary {
  const keys = store.keys();
  const breedIds = new Set<string>();
  for (const k of keys) {
    const m = /^(adventure|reward|knowledge):(.+)$/.exec(k);
    if (m) breedIds.add(m[2]);
  }

  let breedsStarted = 0;
  let breedsCompleted = 0;
  const normalStickerBreeds = new Set<string>();
  const goldenStickerBreeds = new Set<string>();
  const secretIds = new Set<string>();
  let quizzesMastered = 0;

  for (const breedId of breedIds) {
    const adv = readJsonObject(store, `adventure:${breedId}`);
    if (adv && typeof adv.currentNodeId === "string") {
      breedsStarted++;
      if (asBool(adv.raceCompleted) || asBool(adv.stickerUnlocked)) breedsCompleted++;
      for (const s of asStrArr(adv.secretsFound)) secretIds.add(`adv:${breedId}:${s}`);
    }
    const rew = readJsonObject(store, `reward:${breedId}`);
    if (rew) {
      if (asBool(rew.normalStickerUnlocked)) normalStickerBreeds.add(breedId);
      if (asBool(rew.goldenStickerUnlocked)) goldenStickerBreeds.add(breedId);
      for (const s of asStrArr(rew.secretsFound)) secretIds.add(`rew:${breedId}:${s}`);
    }
    const know = readJsonObject(store, `knowledge:${breedId}`);
    if (know && asNum(know.bestMastery) >= 0.8) quizzesMastered++;
  }

  // Collection-level saves (canonical cross-breed rollup when present).
  let collectionComplete = false;
  const coll = readJsonObject(store, "collection");
  const collBreeds =
    coll && typeof coll.breeds === "object" && coll.breeds !== null
      ? (coll.breeds as Record<string, Record<string, unknown>>)
      : null;
  if (collBreeds) {
    for (const [id, e] of Object.entries(collBreeds)) {
      if (asBool(e.normalStickerUnlocked)) normalStickerBreeds.add(id);
      if (asBool(e.goldenStickerUnlocked)) goldenStickerBreeds.add(id);
    }
  }
  const gk = readJsonObject(store, "golden-kiki");
  let goldenKikiUnlocked = false;
  if (gk) {
    const gkColl = gk.collection as Record<string, unknown> | undefined;
    const gkBreeds =
      gkColl && typeof gkColl.breeds === "object" && gkColl.breeds !== null
        ? (gkColl.breeds as Record<string, Record<string, unknown>>)
        : null;
    if (gkBreeds) {
      const ids = Object.keys(gkBreeds);
      collectionComplete =
        ids.length > 0 && ids.every((id) => asBool(gkBreeds[id].normalStickerUnlocked));
      for (const id of ids) {
        if (asBool(gkBreeds[id].normalStickerUnlocked)) normalStickerBreeds.add(id);
        if (asBool(gkBreeds[id].goldenStickerUnlocked)) goldenStickerBreeds.add(id);
      }
    }
    goldenKikiUnlocked = collectionComplete && asBool(gk.ultimateQuizCompleted);
  }

  const normalStickers = normalStickerBreeds.size;
  const completionPercent =
    totalBreeds > 0 ? Math.round((normalStickers / totalBreeds) * 100) : 0;

  let lastPlayedBreed: string | null = null;
  try {
    const lb = store.getItem("meta:last-breed");
    lastPlayedBreed = typeof lb === "string" && lb.length > 0 ? lb : null;
  } catch {
    /* ignore */
  }

  return {
    profileId: profile.id,
    displayName: profile.displayName,
    avatarConfig: { ...profile.avatarConfig },
    breedsStarted,
    breedsCompleted,
    normalStickers,
    goldenStickers: goldenStickerBreeds.size,
    secretsFound: secretIds.size,
    quizzesMastered,
    collectionComplete,
    goldenKikiUnlocked,
    completionPercent,
    lastPlayedBreed,
    lastPlayedAt: profile.lastPlayedAt,
  };
}

/** Record which breed was last played (powers the summary + resume UX). */
export function recordLastPlayedBreed(store: ProfileScopedStore, breedId: string): void {
  try {
    store.setItem("meta:last-breed", breedId);
  } catch {
    /* ignore */
  }
}

/**
 * Convenience: mark a play session — bumps the profile's lastPlayedAt and
 * optionally records the breed. Gameplay calls this, never name-checks.
 */
export function recordPlaySession(
  registry: ProfileRegistry,
  baseStore: StorageLike,
  profileId: string,
  breedId?: string,
): void {
  registry.touchLastPlayed(profileId);
  if (breedId) {
    recordLastPlayedBreed(new ProfileScopedStore(baseStore, profileId), breedId);
  }
}

// ------------------------------------------------------------ reset operations
// Each operation is deliberately separate: "reset progress" NEVER deletes
// the profile identity or avatar, and deleting a profile NEVER touches
// another profile's namespace.

/** Reset one breed's full progress (adventure + reward + knowledge) for one profile. */
export function resetBreedProgress(store: ProfileScopedStore, breedId: string): void {
  store.removeItem(`adventure:${breedId}`);
  store.removeItem(`reward:${breedId}`);
  store.removeItem(`knowledge:${breedId}`);
}

/** Reset only the adventure run for one breed (keeps stickers/mastery). */
export function resetAdventureOnly(store: ProfileScopedStore, breedId: string): void {
  store.removeItem(`adventure:${breedId}`);
}

/** Reset only reward/mastery for one breed (keeps the adventure run). */
export function resetRewardsOnly(store: ProfileScopedStore, breedId: string): void {
  store.removeItem(`reward:${breedId}`);
}

/**
 * Reset ALL progress for one profile. Identity (nickname, avatar, theme)
 * and the registry entry are preserved — only the namespaced save data
 * goes away.
 */
export function resetProfileProgress(
  registry: ProfileRegistry,
  baseStore: StorageLike,
  profileId: string,
): boolean {
  const profile = registry.getProfile(profileId);
  if (!profile) return false;
  clearProfileNamespace(baseStore, profileId);
  return true;
}

/**
 * Delete a profile entirely: its namespace AND its registry entry.
 * (ProfileRegistry.deleteProfile already does both; this is the explicit
 * named operation for clarity at call sites.)
 */
export function deleteProfileAndData(
  registry: ProfileRegistry,
  profileId: string,
): boolean {
  return registry.deleteProfile(profileId);
}

/**
 * Nuclear option for development: wipe every profile namespace, the
 * registry, and the active pointer. Nothing else on the device is touched.
 */
export function resetAllData(baseStore: StorageLike): void {
  const registry = new ProfileRegistry(baseStore);
  for (const p of registry.listProfiles()) {
    clearProfileNamespace(baseStore, p.id);
  }
  try {
    baseStore.removeItem(PROFILES_REGISTRY_KEY);
  } catch {
    /* ignore */
  }
  try {
    baseStore.removeItem(ACTIVE_PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------ legacy migration

/**
 * Legacy (pre-profile) dev saves live at ROOT keys, e.g. "kiki-dog:golden-kiki:v1".
 * Once profiles exist the game only reads namespaced keys, so legacy data is
 * naturally invisible — it is NEVER auto-copied anywhere.
 *
 * assignLegacySaveToProfile copies explicit root keys into ONE profile's
 * namespace (keeping their relative key shapes). Call it once, deliberately,
 * typically from a dev/debug menu. Returns the number of keys copied.
 */
export function assignLegacySaveToProfile(
  baseStore: StorageLike,
  profileId: string,
  legacyKeys: string[],
): number {
  const scoped = new ProfileScopedStore(baseStore, profileId);
  let copied = 0;
  for (const key of legacyKeys) {
    let raw: string | null;
    try {
      raw = baseStore.getItem(key);
    } catch {
      continue;
    }
    if (raw === null) continue;
    try {
      scoped.setItem(key, raw);
      copied++;
    } catch {
      /* quota — stop, keep what copied */
      break;
    }
  }
  return copied;
}

/** Remove root legacy keys after a successful migration (explicit). */
export function clearLegacyKeys(baseStore: StorageLike, legacyKeys: string[]): void {
  for (const key of legacyKeys) {
    try {
      baseStore.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

type EnumerableStore = StorageLike & {
  key?(index: number): string | null;
  readonly length?: number;
};

/**
 * Best-effort scan for legacy root keys: keys starting with "kiki-dog:"
 * (the old dev prefix). New-scheme keys ("kiki:v1:…", including all profile
 * namespaces) are always excluded. Returns [] when enumeration is
 * unavailable.
 */
export function detectLegacyKeys(baseStore: StorageLike): string[] {
  const ext = baseStore as EnumerableStore;
  if (typeof ext.key !== "function" || typeof ext.length !== "number") return [];
  const found: string[] = [];
  try {
    for (let i = 0; i < (ext.length as number); i++) {
      const k = ext.key(i);
      if (k && k.startsWith("kiki-dog:")) found.push(k);
    }
  } catch {
    return [];
  }
  return found;
}
