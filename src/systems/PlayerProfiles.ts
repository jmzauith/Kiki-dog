/**
 * PlayerProfiles — user-created player profiles for Kiki's Dog Adventure.
 *
 * PRODUCT RULE (João's law): profiles are USER-CREATED. Aurora and Olivia
 * will be the first two real users, but the engine must never hardcode them
 * — any child (or their friends) can create their own profile. There is no
 * account backend, no login, no email: a profile is local game identity
 * (nickname + avatar), nothing more.
 *
 * Design rules:
 *  - Pure TypeScript, zero imports from game systems. The registry only
 *    manages identity + cosmetics; progress lives under profile-namespaced
 *    storage keys (see ProfileStore.ts) and is never read here.
 *  - Profile IDs are generated and stable. Save identity is NEVER derived
 *    from the display name — two kids named "Olivia" are two profiles.
 *  - Gameplay code must NEVER branch on a player's name. It asks only
 *    "what is the current profile save context?" (a ProfileScopedStore).
 *  - Persistence follows the established pattern: versioned JSON in
 *    localStorage (durable across refresh / browser close / Chromebook
 *    restart), injectable store, defensive reads. Corrupt data degrades to
 *    an empty registry instead of crashing.
 */
import { AvatarConfig, defaultAvatarConfig, sanitizeAvatarConfig } from "./AvatarOptions";
import { clearProfileNamespace } from "./ProfileStore";

/** Minimal storage interface — structurally identical to the other systems. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Registry storage keys (root namespace — never inside a profile). */
export const PROFILES_REGISTRY_KEY = "kiki:v1:profiles";
export const ACTIVE_PROFILE_KEY = "kiki:v1:active-profile";

export const PROFILE_SCHEMA_VERSION = 1;
/** Nicknames are trimmed and truncated to this length (never rejected). */
export const MAX_DISPLAY_NAME_LENGTH = 24;

export interface PlayerProfile {
  /** Generated stable id, e.g. "p_9f3ka2x8qz". Never derived from the name. */
  id: string;
  /** Nickname shown in UI. Duplicates allowed. */
  displayName: string;
  createdAt: number;
  updatedAt: number;
  lastPlayedAt: number;
  avatarConfig: AvatarConfig;
  /** Theme color identifier (validated loosely — see THEME_COLORS). */
  themeColor: string;
  /** Optional hook for a future "favorite breed" feature. */
  favoriteDogBreedId?: string;
  schemaVersion: 1;
}

export interface CreateProfileInput {
  displayName: string;
  avatarConfig?: Partial<AvatarConfig>;
  themeColor?: string;
  favoriteDogBreedId?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarConfig?: Partial<AvatarConfig>;
  themeColor?: string;
  favoriteDogBreedId?: string | null;
}

/** Small curated theme palette (logic identifiers; visuals come later). */
export const THEME_COLORS = [
  "red",
  "coral",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
] as const;
export const DEFAULT_THEME_COLOR = "blue";

interface ProfileRegistrySaveData {
  version: 1;
  profiles: PlayerProfile[];
}

interface ActiveProfileSaveData {
  version: 1;
  profileId: string | null;
}

export type IdGenerator = () => string;

/** Default id generator: crypto.randomUUID when available, else a fallback. */
export function defaultIdGenerator(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") {
      return "p_" + c.randomUUID().replace(/-/g, "").slice(0, 12);
    }
  } catch {
    /* fall through */
  }
  return (
    "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function sanitizeDisplayName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

function sanitizeThemeColor(color: unknown): string {
  if (typeof color === "string" && (THEME_COLORS as readonly string[]).includes(color)) {
    return color;
  }
  return DEFAULT_THEME_COLOR;
}

function isValidProfileShape(p: unknown): p is PlayerProfile {
  if (!p || typeof p !== "object") return false;
  const r = p as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.displayName === "string" &&
    r.displayName.length > 0 &&
    r.schemaVersion === PROFILE_SCHEMA_VERSION
  );
}

function coerceProfile(raw: unknown): PlayerProfile | null {
  if (!isValidProfileShape(raw)) return null;
  const now = Date.now();
  const num = (v: unknown, fb: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fb;
  return {
    id: raw.id,
    displayName: sanitizeDisplayName(raw.displayName) ?? "Player",
    createdAt: num(raw.createdAt, now),
    updatedAt: num(raw.updatedAt, now),
    lastPlayedAt: num(raw.lastPlayedAt, num(raw.updatedAt, now)),
    avatarConfig: sanitizeAvatarConfig(raw.avatarConfig),
    themeColor: sanitizeThemeColor(raw.themeColor),
    favoriteDogBreedId:
      typeof raw.favoriteDogBreedId === "string" && raw.favoriteDogBreedId.length > 0
        ? raw.favoriteDogBreedId
        : undefined,
    schemaVersion: PROFILE_SCHEMA_VERSION,
  };
}

/**
 * The profile registry: create / edit / delete / list profiles, plus the
 * active-profile pointer. Owns persistence of identity only — progress data
 * lives under profile-namespaced keys and is managed via ProfileStore.
 */
export class ProfileRegistry {
  private readonly store: StorageLike | null;
  private readonly newId: IdGenerator;
  private profiles = new Map<string, PlayerProfile>();
  private activeId: string | null = null;
  /** True when the stored registry used a newer schema than we understand. */
  upgradeNeeded = false;

  constructor(store: StorageLike | null, idGenerator: IdGenerator = defaultIdGenerator) {
    this.store = store;
    this.newId = idGenerator;
    this.load();
  }

  // ------------------------------------------------------------ queries

  /** All profiles, oldest first. Returns copies. */
  listProfiles(): PlayerProfile[] {
    return [...this.profiles.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((p) => ({ ...p, avatarConfig: { ...p.avatarConfig } }));
  }

  getProfile(id: string): PlayerProfile | null {
    const p = this.profiles.get(id);
    return p ? { ...p, avatarConfig: { ...p.avatarConfig } } : null;
  }

  get profileCount(): number {
    return this.profiles.size;
  }

  getActiveProfileId(): string | null {
    return this.activeId;
  }

  getActiveProfile(): PlayerProfile | null {
    return this.activeId ? this.getProfile(this.activeId) : null;
  }

  // ------------------------------------------------------------ mutations

  /**
   * Create a profile. displayName is required (after trimming); empty names
   * throw. Duplicate display names are ALLOWED — identity is the generated
   * id, never the name.
   */
  createProfile(input: CreateProfileInput): PlayerProfile {
    const displayName = sanitizeDisplayName(input.displayName);
    if (displayName === null) {
      throw new Error("displayName is required and must not be blank");
    }
    const now = Date.now();
    let id = this.newId();
    while (this.profiles.has(id)) id = this.newId(); // uniqueness guaranteed
    const profile: PlayerProfile = {
      id,
      displayName,
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: now,
      avatarConfig: sanitizeAvatarConfig({
        ...defaultAvatarConfig(),
        ...(input.avatarConfig ?? {}),
      }),
      themeColor: sanitizeThemeColor(input.themeColor),
      favoriteDogBreedId:
        typeof input.favoriteDogBreedId === "string" && input.favoriteDogBreedId.length > 0
          ? input.favoriteDogBreedId
          : undefined,
      schemaVersion: PROFILE_SCHEMA_VERSION,
    };
    this.profiles.set(id, profile);
    this.persist();
    return { ...profile, avatarConfig: { ...profile.avatarConfig } };
  }

  /**
   * Edit nickname / cosmetics / theme. The id is stable and progress is
   * untouched (progress lives under namespaced storage keys, not here).
   * Returns null for unknown ids.
   */
  updateProfile(id: string, patch: UpdateProfileInput): PlayerProfile | null {
    const p = this.profiles.get(id);
    if (!p) return null;
    if (patch.displayName !== undefined) {
      const name = sanitizeDisplayName(patch.displayName);
      if (name === null) throw new Error("displayName must not be blank");
      p.displayName = name;
    }
    if (patch.avatarConfig !== undefined) {
      p.avatarConfig = sanitizeAvatarConfig({ ...p.avatarConfig, ...patch.avatarConfig });
    }
    if (patch.themeColor !== undefined) {
      p.themeColor = sanitizeThemeColor(patch.themeColor);
    }
    if (patch.favoriteDogBreedId !== undefined) {
      p.favoriteDogBreedId =
        patch.favoriteDogBreedId && patch.favoriteDogBreedId.length > 0
          ? patch.favoriteDogBreedId
          : undefined;
    }
    p.updatedAt = Date.now();
    this.persist();
    return { ...p, avatarConfig: { ...p.avatarConfig } };
  }

  /** Bump lastPlayedAt (call when a play session starts). */
  touchLastPlayed(id: string): void {
    const p = this.profiles.get(id);
    if (!p) return;
    p.lastPlayedAt = Date.now();
    this.persist();
  }

  /**
   * Set the active profile. Unknown ids are rejected (returns false, active
   * unchanged). Pass null to clear.
   */
  setActiveProfile(id: string | null): boolean {
    if (id !== null && !this.profiles.has(id)) return false;
    this.activeId = id;
    this.persistActive();
    return true;
  }

  /**
   * EXPLICIT destructive delete: removes the profile AND its entire
   * namespaced progress (via clearProfileNamespace). There is no accidental
   * path — switching profiles never deletes anything.
   *
   * If the deleted profile was active: the most recently played remaining
   * profile becomes active; if none remain, active is cleared (no-active
   * state). This keeps the game in a valid state without inventing data.
   */
  deleteProfile(id: string): boolean {
    if (!this.profiles.has(id)) return false;
    if (this.store) clearProfileNamespace(this.store, id);
    this.profiles.delete(id);
    if (this.activeId === id) {
      const remaining = [...this.profiles.values()].sort(
        (a, b) => b.lastPlayedAt - a.lastPlayedAt,
      );
      this.activeId = remaining.length > 0 ? remaining[0].id : null;
    }
    this.persist();
    this.persistActive();
    return true;
  }

  // ------------------------------------------------------------ persistence

  private persist(): void {
    if (!this.store) return;
    try {
      const data: ProfileRegistrySaveData = {
        version: PROFILE_SCHEMA_VERSION,
        profiles: [...this.profiles.values()],
      };
      this.store.setItem(PROFILES_REGISTRY_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable/quota — identity stays in memory */
    }
  }

  private persistActive(): void {
    if (!this.store) return;
    try {
      const data: ActiveProfileSaveData = {
        version: PROFILE_SCHEMA_VERSION,
        profileId: this.activeId,
      };
      this.store.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  private load(): void {
    this.profiles.clear();
    this.activeId = null;
    this.upgradeNeeded = false;
    if (!this.store) return;
    let raw: string | null;
    try {
      raw = this.store.getItem(PROFILES_REGISTRY_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return; // corrupt → empty registry, never crash
    }
    if (!data || typeof data !== "object") return;
    const version = (data as { version?: unknown }).version;
    if (version !== PROFILE_SCHEMA_VERSION) {
      if (typeof version === "number" && version > PROFILE_SCHEMA_VERSION) {
        this.upgradeNeeded = true;
      }
      return; // unsupported version → empty, never crash, never wipe on read
    }
    const list = (data as ProfileRegistrySaveData).profiles;
    if (!Array.isArray(list)) return;
    const seen = new Set<string>();
    for (const rawProfile of list) {
      const p = coerceProfile(rawProfile);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        this.profiles.set(p.id, p);
      }
    }
    // Restore active pointer (validated — a deleted/invalid id is dropped).
    try {
      const activeRaw = this.store.getItem(ACTIVE_PROFILE_KEY);
      if (activeRaw) {
        const active = JSON.parse(activeRaw) as ActiveProfileSaveData;
        if (
          active &&
          active.version === PROFILE_SCHEMA_VERSION &&
          typeof active.profileId === "string" &&
          this.profiles.has(active.profileId)
        ) {
          this.activeId = active.profileId;
        }
      }
    } catch {
      /* active stays null */
    }
  }
}
