import { describe, expect, it } from "vitest";
import { ProfileRegistry } from "../PlayerProfiles";
import {
  PROFILE_NAMESPACE_PREFIX,
  ProfileScopedStore,
  clearProfileNamespace,
  memoryStore,
  profileNamespacePrefix,
  scopedStoreFor,
} from "../ProfileStore";

function seqIds() {
  let n = 0;
  return () => `p_test${++n}`;
}

describe("key scheme", () => {
  it("namespaces keys by profile id", () => {
    expect(profileNamespacePrefix("p_abc")).toBe("kiki:v1:profile:p_abc:");
    expect(PROFILE_NAMESPACE_PREFIX).toBe("kiki:v1:profile:");
  });
});

describe("ProfileScopedStore", () => {
  it("prefixes keys transparently", () => {
    const base = memoryStore();
    const store = new ProfileScopedStore(base, "p_1");
    store.setItem("reward:husky", "{}");
    expect(base.getItem("kiki:v1:profile:p_1:reward:husky")).toBe("{}");
    expect(store.getItem("reward:husky")).toBe("{}");
  });

  it("isolates two profiles completely", () => {
    const base = memoryStore();
    const aurora = scopedStoreFor(base, "p_aurora");
    const olivia = scopedStoreFor(base, "p_olivia");
    aurora.setItem("reward:husky", '{"normalStickerUnlocked":true}');
    expect(olivia.getItem("reward:husky")).toBeNull();
    olivia.setItem("reward:husky", '{"normalStickerUnlocked":false}');
    expect(aurora.getItem("reward:husky")).toBe('{"normalStickerUnlocked":true}');
  });

  it("tracks keys and enumerates the namespace", () => {
    const base = memoryStore();
    const store = new ProfileScopedStore(base, "p_1");
    store.setItem("adventure:husky", "a");
    store.setItem("reward:husky", "b");
    expect(store.keys().sort()).toEqual(["adventure:husky", "reward:husky"]);
    store.removeItem("adventure:husky");
    expect(store.keys()).toEqual(["reward:husky"]);
  });

  it("clearNamespace removes exactly this profile's keys", () => {
    const base = memoryStore();
    const a = new ProfileScopedStore(base, "p_a");
    const b = new ProfileScopedStore(base, "p_b");
    a.setItem("reward:husky", "a");
    b.setItem("reward:husky", "b");
    base.setItem("kiki:v1:profiles", "registry");
    a.clearNamespace();
    expect(a.getItem("reward:husky")).toBeNull();
    expect(a.keys()).toEqual([]);
    expect(b.getItem("reward:husky")).toBe("b");
    expect(base.getItem("kiki:v1:profiles")).toBe("registry");
  });

  it("clearProfileNamespace helper works", () => {
    const base = memoryStore();
    new ProfileScopedStore(base, "p_x").setItem("reward:husky", "x");
    clearProfileNamespace(base, "p_x");
    expect(base.getItem("kiki:v1:profile:p_x:reward:husky")).toBeNull();
  });

  it("rejects bad construction", () => {
    const base = memoryStore();
    expect(() => new ProfileScopedStore(base, "")).toThrow();
    expect(
      () => new ProfileScopedStore(null as unknown as typeof base, "p_1"),
    ).toThrow();
  });

  it("survives a throwing base store on reads", () => {
    const evil = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const store = new ProfileScopedStore(evil, "p_1");
    expect(store.getItem("x")).toBeNull();
    expect(store.keys()).toEqual([]);
  });
});

describe("game systems stay profile-unaware", () => {
  it("an existing save function works unchanged through the scoped store", () => {
    // Simulates BreedRewards.saveBreedRewards(key, state, store): the system
    // only ever sees a StorageLike — the profile prefix is invisible to it.
    const base = memoryStore();
    const registry = new ProfileRegistry(base, seqIds());
    const aurora = registry.createProfile({ displayName: "Aurora" });
    const olivia = registry.createProfile({ displayName: "Olivia" });

    function fakeSaveReward(store: { setItem(k: string, v: string): void }, unlocked: boolean) {
      store.setItem("reward:husky", JSON.stringify({ normalStickerUnlocked: unlocked }));
    }
    function fakeLoadReward(store: { getItem(k: string): string | null }) {
      const raw = store.getItem("reward:husky");
      return raw ? JSON.parse(raw).normalStickerUnlocked === true : false;
    }

    fakeSaveReward(scopedStoreFor(base, aurora.id), true);
    expect(fakeLoadReward(scopedStoreFor(base, aurora.id))).toBe(true);
    expect(fakeLoadReward(scopedStoreFor(base, olivia.id))).toBe(false);
  });
});
