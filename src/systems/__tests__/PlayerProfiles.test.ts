import { describe, expect, it } from "vitest";
import { ProfileScopedStore, memoryStore } from "../ProfileStore";
import {
  MAX_DISPLAY_NAME_LENGTH,
  ProfileRegistry,
} from "../PlayerProfiles";

function seqIds() {
  let n = 0;
  return () => `p_test${++n}`;
}

describe("profile creation", () => {
  it("creates the first profile with defaults", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    expect(p.id).toBe("p_test1");
    expect(p.displayName).toBe("Aurora");
    expect(p.schemaVersion).toBe(1);
    expect(p.avatarConfig.hairStyle).toBe("short");
    expect(p.themeColor).toBe("blue");
    expect(r.profileCount).toBe(1);
  });

  it("supports multiple profiles", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    r.createProfile({ displayName: "Aurora" });
    r.createProfile({ displayName: "Olivia" });
    r.createProfile({ displayName: "Friend" });
    expect(r.profileCount).toBe(3);
    expect(r.listProfiles().map((p) => p.displayName)).toEqual([
      "Aurora",
      "Olivia",
      "Friend",
    ]);
  });

  it("allows duplicate display names — identity is the id", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const a = r.createProfile({ displayName: "Olivia" });
    const b = r.createProfile({ displayName: "Olivia" });
    expect(a.id).not.toBe(b.id);
    expect(r.profileCount).toBe(2);
  });

  it("generates unique ids", () => {
    const r = new ProfileRegistry(memoryStore());
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(r.createProfile({ displayName: `Kid${i}` }).id);
    }
    expect(ids.size).toBe(50);
  });

  it("rejects empty names", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    expect(() => r.createProfile({ displayName: "" })).toThrow();
    expect(() => r.createProfile({ displayName: "   " })).toThrow();
    expect(r.profileCount).toBe(0);
  });

  it("trims whitespace", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "  Aurora  " });
    expect(p.displayName).toBe("Aurora");
  });

  it("truncates long names to the max length", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "A".repeat(100) });
    expect(p.displayName.length).toBe(MAX_DISPLAY_NAME_LENGTH);
  });

  it("accepts custom avatar + theme + favorite breed hook", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({
      displayName: "Olivia",
      avatarConfig: { hairStyle: "braids", accessory: "cap" },
      themeColor: "purple",
      favoriteDogBreedId: "husky",
    });
    expect(p.avatarConfig.hairStyle).toBe("braids");
    expect(p.avatarConfig.accessory).toBe("cap");
    expect(p.avatarConfig.hairColor).toBe("brown"); // default filled in
    expect(p.themeColor).toBe("purple");
    expect(p.favoriteDogBreedId).toBe("husky");
  });

  it("falls back to defaults for invalid theme color", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "X", themeColor: "invisible" });
    expect(p.themeColor).toBe("blue");
  });

  it("collects no personal data beyond the nickname", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const keys = Object.keys(p).sort();
    expect(keys).toEqual(
      expect.arrayContaining([
        "id",
        "displayName",
        "createdAt",
        "updatedAt",
        "lastPlayedAt",
        "avatarConfig",
        "themeColor",
        "schemaVersion",
      ]),
    );
    expect("email" in p).toBe(false);
    expect("birthDate" in p).toBe(false);
  });
});

describe("profile editing", () => {
  it("edits nickname and cosmetics, keeps id stable", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const updated = r.updateProfile(p.id, {
      displayName: "Auri",
      avatarConfig: { hairColor: "blonde" },
      themeColor: "pink",
    });
    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(p.id);
    expect(updated!.displayName).toBe("Auri");
    expect(updated!.avatarConfig.hairColor).toBe("blonde");
    expect(updated!.themeColor).toBe("pink");
  });

  it("rejects blank nicknames on edit", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    expect(() => r.updateProfile(p.id, { displayName: "  " })).toThrow();
    expect(r.getProfile(p.id)!.displayName).toBe("Aurora");
  });

  it("returns null for unknown ids", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    expect(r.updateProfile("p_nope", { displayName: "X" })).toBeNull();
  });

  it("sanitizes invalid avatar values on edit", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    const updated = r.updateProfile(p.id, {
      avatarConfig: { hairStyle: "mohawk" as string },
    });
    expect(updated!.avatarConfig.hairStyle).toBe("short");
  });
});

describe("active profile", () => {
  it("sets, gets, and clears the active profile", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    expect(r.getActiveProfile()).toBeNull();
    expect(r.setActiveProfile(a.id)).toBe(true);
    expect(r.getActiveProfileId()).toBe(a.id);
    expect(r.getActiveProfile()!.displayName).toBe("Aurora");
    expect(r.setActiveProfile(null)).toBe(true);
    expect(r.getActiveProfile()).toBeNull();
  });

  it("rejects unknown ids", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    r.setActiveProfile(a.id);
    expect(r.setActiveProfile("p_nope")).toBe(false);
    expect(r.getActiveProfileId()).toBe(a.id);
  });

  it("restores the active profile after reload", () => {
    const store = memoryStore();
    const r1 = new ProfileRegistry(store, seqIds());
    const a = r1.createProfile({ displayName: "Aurora" });
    r1.createProfile({ displayName: "Olivia" });
    r1.setActiveProfile(a.id);
    const r2 = new ProfileRegistry(store, seqIds());
    expect(r2.getActiveProfileId()).toBe(a.id);
    expect(r2.profileCount).toBe(2);
  });

  it("drops an invalid active id on reload", () => {
    const store = memoryStore();
    const r1 = new ProfileRegistry(store, seqIds());
    r1.createProfile({ displayName: "Aurora" });
    // hand-write a bogus active pointer
    store.setItem(
      "kiki:v1:active-profile",
      JSON.stringify({ version: 1, profileId: "p_ghost" }),
    );
    const r2 = new ProfileRegistry(store, seqIds());
    expect(r2.getActiveProfile()).toBeNull();
  });
});

describe("profile deletion", () => {
  it("deletes the profile and its progress namespace", () => {
    const store = memoryStore();
    const r = new ProfileRegistry(store, seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    const b = r.createProfile({ displayName: "Olivia" });
    // simulate progress for both (through scoped stores, as the game does)
    new ProfileScopedStore(store, a.id).setItem("reward:husky", "{}");
    new ProfileScopedStore(store, b.id).setItem("reward:husky", "{}");
    expect(r.deleteProfile(a.id)).toBe(true);
    expect(r.getProfile(a.id)).toBeNull();
    expect(r.getProfile(b.id)).not.toBeNull();
    // only Aurora's namespace is gone
    expect(store.getItem(`kiki:v1:profile:${a.id}:reward:husky`)).toBeNull();
    expect(store.getItem(`kiki:v1:profile:${b.id}:reward:husky`)).toBe("{}");
  });

  it("returns false for unknown ids", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    expect(r.deleteProfile("p_nope")).toBe(false);
  });

  it("deleting the active profile activates the most recently played remaining one", () => {
    const store = memoryStore();
    const r = new ProfileRegistry(store, seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    const b = r.createProfile({ displayName: "Olivia" });
    r.setActiveProfile(a.id);
    r.deleteProfile(a.id);
    expect(r.getActiveProfileId()).toBe(b.id);
  });

  it("deleting the last profile clears the active pointer", () => {
    const r = new ProfileRegistry(memoryStore(), seqIds());
    const a = r.createProfile({ displayName: "Aurora" });
    r.setActiveProfile(a.id);
    r.deleteProfile(a.id);
    expect(r.getActiveProfile()).toBeNull();
    expect(r.profileCount).toBe(0);
  });
});

describe("registry persistence", () => {
  it("survives a reload round-trip", () => {
    const store = memoryStore();
    const r1 = new ProfileRegistry(store, seqIds());
    r1.createProfile({
      displayName: "Aurora",
      avatarConfig: { hairStyle: "braids" },
      themeColor: "pink",
    });
    const r2 = new ProfileRegistry(store, seqIds());
    const [p] = r2.listProfiles();
    expect(p.displayName).toBe("Aurora");
    expect(p.avatarConfig.hairStyle).toBe("braids");
    expect(p.themeColor).toBe("pink");
  });

  it("degrades to empty on malformed JSON", () => {
    const store = memoryStore();
    store.setItem("kiki:v1:profiles", "{not json");
    const r = new ProfileRegistry(store, seqIds());
    expect(r.profileCount).toBe(0);
    // and the game can still create a fresh profile
    expect(r.createProfile({ displayName: "New" }).displayName).toBe("New");
  });

  it("skips profiles with unsupported future versions", () => {
    const store = memoryStore();
    store.setItem(
      "kiki:v1:profiles",
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p_old",
            displayName: "Aurora",
            createdAt: 1,
            updatedAt: 1,
            lastPlayedAt: 1,
            avatarConfig: {},
            themeColor: "blue",
            schemaVersion: 1,
          },
          {
            id: "p_future",
            displayName: "Future",
            createdAt: 1,
            updatedAt: 1,
            lastPlayedAt: 1,
            avatarConfig: {},
            themeColor: "blue",
            schemaVersion: 99,
          },
        ],
      }),
    );
    const r = new ProfileRegistry(store, seqIds());
    expect(r.profileCount).toBe(1);
    expect(r.getProfile("p_old")!.displayName).toBe("Aurora");
  });

  it("flags upgradeNeeded on a newer registry version", () => {
    const store = memoryStore();
    store.setItem(
      "kiki:v1:profiles",
      JSON.stringify({ version: 99, profiles: [] }),
    );
    const r = new ProfileRegistry(store, seqIds());
    expect(r.upgradeNeeded).toBe(true);
    expect(r.profileCount).toBe(0);
  });

  it("works with a null store (in-memory only)", () => {
    const r = new ProfileRegistry(null, seqIds());
    const p = r.createProfile({ displayName: "Aurora" });
    expect(r.getProfile(p.id)!.displayName).toBe("Aurora");
  });
});
