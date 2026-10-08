/**
 * ProfileStore — profile-namespaced persistence for Kiki's Dog Adventure.
 *
 * THE ARCHITECTURAL RULE: profiles wrap persistence. Game systems
 * (AdventureState, BreedRewards, BreedQuiz, CollectionProgress, GoldenKiki)
 * never learn about profiles — they receive a SaveStore that is ALREADY
 * scoped to the current profile, and keep calling their existing
 * save/load functions with their existing relative keys.
 *
 * Key scheme:
 *   root:      kiki:v1:profiles            (profile registry — PlayerProfiles.ts)
 *   root:      kiki:v1:active-profile      (active pointer — PlayerProfiles.ts)
 *   namespaced kiki:v1:profile:<profileId>:<relativeKey>
 *
 * The relativeKey is whatever the game system already uses, e.g.:
 *   adventure:husky | reward:husky | knowledge:husky | collection
 *   kiki-dog:golden-kiki:v1   (legacy key shapes keep working unchanged)
 *
 * Namespace deletion is exact: ProfileScopedStore maintains a key index so
 * deleting a profile removes precisely its own keys — never another
 * profile's, never the registry.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Root prefix for one profile's namespace. */
export const PROFILE_NAMESPACE_PREFIX = "kiki:v1:profile:";

export function profileNamespacePrefix(profileId: string): string {
  return `${PROFILE_NAMESPACE_PREFIX}${profileId}:`;
}

/** In-memory StorageLike for tests (and storage-less environments). */
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

/**
 * localStorage-backed store for DURABLE player progress (survives refresh,
 * browser close, Chromebook restart). Returns null when unavailable.
 */
export function defaultLocalStore(): StorageLike | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    /* non-browser, private mode, or blocked storage */
  }
  return null;
}

/**
 * sessionStorage-backed store for TEMPORARY session-only state (cleared
 * with the tab). Use for in-progress transient state, not durable progress.
 */
export function defaultSessionStore(): StorageLike | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* ignore */
  }
  return null;
}

const KEY_INDEX_SUFFIX = "_keyindex";

function readIndex(base: StorageLike, indexKey: string): string[] {
  let raw: string | null;
  try {
    raw = base.getItem(indexKey);
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === "string");
  } catch {
    return [];
  }
}

function writeIndex(base: StorageLike, indexKey: string, keys: string[]): void {
  try {
    base.setItem(indexKey, JSON.stringify(keys));
  } catch {
    /* value was already written; a stale index only risks an orphaned key */
  }
}

/**
 * A StorageLike scoped to one profile's namespace. Game systems receive
 * this and keep using their own relative keys — the prefix is applied
 * transparently. Tracks every key it writes so the namespace can be
 * enumerated and deleted exactly.
 */
export class ProfileScopedStore implements StorageLike {
  readonly profileId: string;
  private readonly base: StorageLike;
  private readonly prefix: string;
  private readonly indexKey: string;

  constructor(base: StorageLike, profileId: string) {
    if (!base) throw new Error("ProfileScopedStore requires a base store");
    if (!profileId || typeof profileId !== "string") {
      throw new Error("ProfileScopedStore requires a profile id");
    }
    this.base = base;
    this.profileId = profileId;
    this.prefix = profileNamespacePrefix(profileId);
    this.indexKey = this.prefix + KEY_INDEX_SUFFIX;
  }

  getItem(key: string): string | null {
    try {
      return this.base.getItem(this.prefix + key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    this.base.setItem(this.prefix + key, value);
    const index = readIndex(this.base, this.indexKey);
    if (!index.includes(key)) {
      index.push(key);
      writeIndex(this.base, this.indexKey, index);
    }
  }

  removeItem(key: string): void {
    try {
      this.base.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
    const index = readIndex(this.base, this.indexKey).filter((k) => k !== key);
    writeIndex(this.base, this.indexKey, index);
  }

  /** Relative keys currently in this namespace (never the index key). */
  keys(): string[] {
    return readIndex(this.base, this.indexKey);
  }

  /**
   * Remove every key in this namespace, then the index itself. Precise:
   * only keys this store wrote (or that were present when indexed).
   */
  clearNamespace(): void {
    for (const key of this.keys()) {
      try {
        this.base.removeItem(this.prefix + key);
      } catch {
        /* ignore */
      }
    }
    try {
      this.base.removeItem(this.indexKey);
    } catch {
      /* ignore */
    }
  }
}

/** Convenience: a scoped store for a profile over a base store. */
export function scopedStoreFor(base: StorageLike, profileId: string): ProfileScopedStore {
  return new ProfileScopedStore(base, profileId);
}

/** Delete exactly one profile's namespace (used by profile deletion). */
export function clearProfileNamespace(base: StorageLike, profileId: string): void {
  new ProfileScopedStore(base, profileId).clearNamespace();
}
