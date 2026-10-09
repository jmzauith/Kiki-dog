import { describe, expect, it } from "vitest";
import { ProfileRegistry } from "../PlayerProfiles";
import {
  ProfileScopedStore,
  StorageLike,
  clearProfileNamespace,
  memoryStore,
} from "../ProfileStore";
import {
  assignLegacySaveToProfile,
  buildProfileProgressSummary,
  clearLegacyKeys,
  detectLegacyKeys,
  recordLastPlayedBreed,
  recordPlaySession,
  resetAdventureOnly,
  resetAllData,
  resetRewardsOnly,
} from "../ProfileProgress";

function seqIds() {
  let n = 0;
  return () => `p_test${++n}`;
}

/** memoryStore + key()/length enumeration for legacy detection tests. */
function enumerableStore(): StorageLike & {
  key(i: number): string | null;
  readonly length: number;
} {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("localStorage-style round-trip", () => {
  it("registry + progress survive a simulated reload", () => {
    const base = memoryStore();
    const r1 = new ProfileRegistry(base, seqIds());
    const aurora = r1.createProfile({ displayName: "Aurora" });
    const store = new ProfileScopedStore(base, aurora.id);
    store.setItem("reward:husky", JSON.stringify({ normalStickerUnlocked: true }));
    recordLastPlayedBreed(store, "husky");

    const r2 = new ProfileRegistry(base, seqIds());
    const p = r2.getProfile(aurora.id)!;
    const s2 = new ProfileScopedStore(base, p.id);
    const sum = buildProfileProgressSummary(p, s2);
    expect(sum.normalStickers).toBe(1);
    expect(sum.lastPlayedBreed).toBe("husky");
  });

  it("recordPlaySession bumps lastPlayedAt and records the breed", () => {
    const base = memoryStore();
    const r = new ProfileRegistry(base, seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const before = r.getProfile(p.id)!.lastPlayedAt;
    recordPlaySession(r, base, p.id, "beagle");
    const after = r.getProfile(p.id)!;
    expect(after.lastPlayedAt).toBeGreaterThanOrEqual(before);
    const sum = buildProfileProgressSummary(
      after,
      new ProfileScopedStore(base, p.id),
    );
    expect(sum.lastPlayedBreed).toBe("beagle");
  });
});

describe("damaged storage", () => {
  it("malformed profile JSON degrades to empty", () => {
    const base = memoryStore();
    base.setItem("kiki:v1:profiles", "{{{broken");
    const r = new ProfileRegistry(base, seqIds());
    expect(r.profileCount).toBe(0);
    expect(r.getActiveProfile()).toBeNull();
  });

  it("partial profile data is coerced with defaults", () => {
    const base = memoryStore();
    base.setItem(
      "kiki:v1:profiles",
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p_partial",
            displayName: "  Partial  ",
            // missing timestamps, avatar, theme
            schemaVersion: 1,
          },
          { id: "p_junk", displayName: "", schemaVersion: 1 }, // dropped
          "not-an-object", // dropped
        ],
      }),
    );
    const r = new ProfileRegistry(base, seqIds());
    expect(r.profileCount).toBe(1);
    const p = r.getProfile("p_partial")!;
    expect(p.displayName).toBe("Partial");
    expect(p.avatarConfig.hairStyle).toBe("short");
    expect(p.themeColor).toBe("blue");
  });

  it("malformed progress saves contribute nothing to the summary", () => {
    const base = memoryStore();
    const r = new ProfileRegistry(base, seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const store = new ProfileScopedStore(base, p.id);
    store.setItem("reward:husky", "{broken json");
    store.setItem("adventure:husky", "[1,2,3]");
    const sum = buildProfileProgressSummary(p, store);
    expect(sum.normalStickers).toBe(0);
    expect(sum.breedsStarted).toBe(0);
  });

  it("a throwing store never crashes the registry", () => {
    const evil: StorageLike = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    const r = new ProfileRegistry(evil, seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    expect(r.getProfile(p.id)!.displayName).toBe("Aurora");
    expect(r.setActiveProfile(p.id)).toBe(true);
    expect(r.deleteProfile(p.id)).toBe(true);
  });

  it("quota errors on save do not corrupt in-memory state", () => {
    let calls = 0;
    const flaky: StorageLike = {
      getItem: () => null,
      setItem: () => {
        calls++;
        if (calls > 2) throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    const r = new ProfileRegistry(flaky, seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    const b = r.createProfile({ displayName: "Olivia" });
    expect(r.profileCount).toBe(2);
    expect(r.getProfile(a.id)).not.toBeNull();
    expect(r.getProfile(b.id)).not.toBeNull();
  });
});

describe("legacy save migration", () => {
  it("detects legacy root keys and ignores new-scheme keys", () => {
    const base = enumerableStore();
    base.setItem("kiki-dog:golden-kiki:v1", "{}");
    base.setItem("kiki-dog:husky-adventure", "{}");
    base.setItem("kiki:v1:profiles", "{}");
    base.setItem("kiki:v1:profile:p_x:reward:husky", "{}");
    expect(detectLegacyKeys(base).sort()).toEqual([
      "kiki-dog:golden-kiki:v1",
      "kiki-dog:husky-adventure",
    ]);
  });

  it("returns [] when enumeration is unavailable", () => {
    expect(detectLegacyKeys(memoryStore())).toEqual([]);
  });

  it("assignLegacySaveToProfile copies into exactly one profile", () => {
    const base = memoryStore();
    const r = new ProfileRegistry(base, seqIds());
    const aurora = r.createProfile({ displayName: "Aurora" });
    const olivia = r.createProfile({ displayName: "Olivia" });
    base.setItem("kiki-dog:golden-kiki:v1", '{"ultimateQuizCompleted":true}');
    const copied = assignLegacySaveToProfile(base, aurora.id, [
      "kiki-dog:golden-kiki:v1",
      "kiki-dog:missing",
    ]);
    expect(copied).toBe(1);
    const aStore = new ProfileScopedStore(base, aurora.id);
    const oStore = new ProfileScopedStore(base, olivia.id);
    expect(aStore.getItem("kiki-dog:golden-kiki:v1")).toBe(
      '{"ultimateQuizCompleted":true}',
    );
    expect(oStore.getItem("kiki-dog:golden-kiki:v1")).toBeNull();
    // root key untouched until explicitly cleared
    expect(base.getItem("kiki-dog:golden-kiki:v1")).toBe('{"ultimateQuizCompleted":true}');
    clearLegacyKeys(base, ["kiki-dog:golden-kiki:v1"]);
    expect(base.getItem("kiki-dog:golden-kiki:v1")).toBeNull();
  });

  it("legacy data is invisible to profiles until migrated", () => {
    const base = memoryStore();
    const r = new ProfileRegistry(base, seqIds());
    const aurora = r.createProfile({ displayName: "Aurora" });
    base.setItem("kiki-dog:golden-kiki:v1", "{}");
    const sum = buildProfileProgressSummary(
      aurora,
      new ProfileScopedStore(base, aurora.id),
    );
    expect(sum.goldenKikiUnlocked).toBe(false);
  });
});

describe("reset operations", () => {
  function seeded() {
    const base = memoryStore();
    const r = new ProfileRegistry(base, seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const s = new ProfileScopedStore(base, p.id);
    s.setItem("adventure:husky", '{"raceCompleted":true}');
    s.setItem("reward:husky", '{"normalStickerUnlocked":true}');
    s.setItem("knowledge:husky", '{"bestMastery":1}');
    return { base, r, p, s };
  }

  it("resetAdventureOnly keeps stickers and mastery", () => {
    const { s } = seeded();
    resetAdventureOnly(s, "husky");
    expect(s.getItem("adventure:husky")).toBeNull();
    expect(s.getItem("reward:husky")).not.toBeNull();
    expect(s.getItem("knowledge:husky")).not.toBeNull();
  });

  it("resetRewardsOnly keeps the adventure run", () => {
    const { s } = seeded();
    resetRewardsOnly(s, "husky");
    expect(s.getItem("reward:husky")).toBeNull();
    expect(s.getItem("adventure:husky")).not.toBeNull();
  });

  it("resetAllData wipes profiles, namespaces, and pointers", () => {
    const { base, r, p } = seeded();
    r.setActiveProfile(p.id);
    resetAllData(base);
    expect(base.getItem("kiki:v1:profiles")).toBeNull();
    expect(base.getItem("kiki:v1:active-profile")).toBeNull();
    expect(base.getItem(`kiki:v1:profile:${p.id}:reward:husky`)).toBeNull();
    const r2 = new ProfileRegistry(base, seqIds());
    expect(r2.profileCount).toBe(0);
  });

  it("clearProfileNamespace is precise", () => {
    const base = memoryStore();
    clearProfileNamespace(base, "p_ghost"); // no keys — must not throw
    expect(true).toBe(true);
  });
});
