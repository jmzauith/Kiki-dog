import { ProfileRegistry, PlayerProfile } from "./PlayerProfiles";
import { defaultLocalStore, memoryStore, ProfileScopedStore } from "./ProfileStore";

const baseStore = defaultLocalStore() ?? memoryStore();
export const profiles = new ProfileRegistry(baseStore);
let activeStore: ProfileScopedStore | null = null;
export const HUSKY_GAME_SAVE_KEY = "adventure:husky";

/** Freeze the selected namespace for this run; another tab cannot switch it. */
export function selectPlayer(profile: PlayerProfile): void {
  profiles.setActiveProfile(profile.id);
  profiles.touchLastPlayed(profile.id);
  activeStore = new ProfileScopedStore(baseStore, profile.id);
  activeStore.setItem("meta:last-breed", "husky");
}
export function gameStore(): ProfileScopedStore {
  if (!activeStore) throw new Error("Choose a player before starting an adventure");
  return activeStore;
}
