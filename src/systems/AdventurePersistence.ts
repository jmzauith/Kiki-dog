/**
 * AdventurePersistence — minimal session persistence for adventure progress.
 *
 * A refresh must not force a complete restart (this resolves the open P1 #6
 * from the Husky QA report). We persist:
 *  - current region/checkpoint (currentNodeId)
 *  - completed encounters
 *  - chosen route (safe/challenge)
 *  - bonus discoveries (secrets found, bonus challenges)
 *  - race completion + race stats
 *  - sticker unlock state
 *
 * Storage: sessionStorage (tab-scoped; survives refresh, cleared with the
 * tab). All reads are defensive: corrupt data, version mismatches, or a
 * missing store all degrade to "no save" instead of crashing.
 *
 * The storage backend is injectable so the logic is unit-testable without a
 * browser: pass a fresh Map-backed store in tests.
 */
import {
  AdventureDefinition,
  AdventureProgress,
  AdventureRoute,
  AdventureSaveData,
} from "./AdventureState";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_VERSION = 1;

function defaultStore(): StorageLike | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* non-browser or blocked storage */
  }
  return null;
}

/** Persist the current progress. Returns false when storage is unavailable. */
export function saveAdventure(
  key: string,
  progress: AdventureProgress,
  store: StorageLike | null = defaultStore(),
): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(progress.toJSON()));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load persisted progress for an adventure definition.
 * Returns null when there is no save, the save is corrupt, the version is
 * unknown, or the save belongs to a different adventure.
 */
export function loadAdventure(
  key: string,
  def: AdventureDefinition,
  store: StorageLike | null = defaultStore(),
): AdventureProgress | null {
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: AdventureSaveData;
  try {
    data = JSON.parse(raw) as AdventureSaveData;
  } catch {
    return null;
  }
  if (!data || data.version !== SAVE_VERSION || data.adventureId !== def.id) {
    return null;
  }
  try {
    return AdventureProgress.fromJSON(def, data);
  } catch {
    return null;
  }
}

/** Player-safe reset: wipes the save so the next run starts clean. */
export function clearAdventure(
  key: string,
  store: StorageLike | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

export interface RaceResult {
  turns: number;
  turbos: number;
}

/**
 * Record the race outcome into the persisted save (called by RaceScene).
 * Creates a minimal save when none exists yet.
 */
export function markRaceComplete(
  key: string,
  def: AdventureDefinition,
  result: RaceResult,
  store: StorageLike | null = defaultStore(),
): AdventureProgress | null {
  const progress = loadAdventure(key, def, store) ?? new AdventureProgress(def);
  progress.raceCompleted = true;
  progress.raceTurns = result.turns;
  progress.raceTurbos = result.turbos;
  // The race node itself counts as a completed encounter for the sticker rule.
  progress.completeEncounter(def.raceNodeId);
  saveAdventure(key, progress, store);
  return progress;
}

/** In-memory StorageLike for tests (and for environments without storage). */
export function memoryStore(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

export type { AdventureRoute };
