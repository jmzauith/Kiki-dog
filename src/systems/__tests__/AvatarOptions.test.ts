import { describe, expect, it } from "vitest";
import {
  AVATAR_CATEGORIES,
  CORE_AVATAR_CATEGORIES,
  avatarCategoryIds,
  avatarOptionsFor,
  defaultAvatarConfig,
  isKnownAvatarCategory,
  isValidAvatarValue,
  sanitizeAvatarConfig,
} from "../AvatarOptions";

describe("avatar customization registry", () => {
  it("contains the required categories", () => {
    const ids = avatarCategoryIds();
    for (const required of CORE_AVATAR_CATEGORIES) {
      expect(ids).toContain(required);
    }
  });

  it("has unique category and option ids", () => {
    const catIds = AVATAR_CATEGORIES.map((c) => c.id);
    expect(new Set(catIds).size).toBe(catIds.length);
    for (const c of AVATAR_CATEGORIES) {
      const optIds = c.options.map((o) => o.id);
      expect(new Set(optIds).size).toBe(optIds.length);
      expect(optIds).toContain(c.defaultOptionId);
    }
  });

  it("matches the product spec values", () => {
    expect(avatarOptionsFor("hairStyle").map((o) => o.id)).toEqual(
      expect.arrayContaining(["short", "medium", "long", "curly", "ponytail", "braids"]),
    );
    expect(avatarOptionsFor("hairColor").map((o) => o.id)).toEqual(
      expect.arrayContaining(["black", "darkBrown", "brown", "blonde", "red"]),
    );
    expect(avatarOptionsFor("shirtColor").map((o) => o.id)).toEqual(
      expect.arrayContaining(
        ["red", "coral", "orange", "yellow", "green", "blue", "purple", "pink", "black", "white"],
      ),
    );
    expect(avatarOptionsFor("accessory").map((o) => o.id)).toEqual(
      expect.arrayContaining(["none", "glasses", "headband", "cap"]),
    );
    // inclusive skin tone set
    expect(avatarOptionsFor("skinTone").length).toBeGreaterThanOrEqual(6);
  });

  it("validates values", () => {
    expect(isValidAvatarValue("hairStyle", "braids")).toBe(true);
    expect(isValidAvatarValue("hairStyle", "mohawk")).toBe(false);
    expect(isValidAvatarValue("nope", "x")).toBe(false);
    expect(isKnownAvatarCategory("skinTone")).toBe(true);
    expect(isKnownAvatarCategory("wings")).toBe(false);
  });
});

describe("default avatar config", () => {
  it("fills every core category with its default", () => {
    const cfg = defaultAvatarConfig();
    for (const c of AVATAR_CATEGORIES) {
      expect(cfg[c.id]).toBe(c.defaultOptionId);
    }
  });
});

describe("sanitizeAvatarConfig", () => {
  it("keeps valid customization", () => {
    const cfg = sanitizeAvatarConfig({
      hairStyle: "braids",
      hairColor: "red",
      skinTone: "umber",
      shirtColor: "purple",
      bottomColor: "white",
      accessory: "cap",
    });
    expect(cfg.hairStyle).toBe("braids");
    expect(cfg.accessory).toBe("cap");
  });

  it("falls back to defaults for invalid or removed options", () => {
    const cfg = sanitizeAvatarConfig({
      hairStyle: "mohawk", // never existed
      accessory: "crown", // removed in a future version
      shirtColor: 42, // wrong type
    });
    expect(cfg.hairStyle).toBe("short");
    expect(cfg.accessory).toBe("none");
    expect(cfg.shirtColor).toBe("blue");
    // untouched categories still get defaults
    expect(cfg.skinTone).toBe("honey");
  });

  it("preserves unknown future categories untouched", () => {
    const cfg = sanitizeAvatarConfig({ hat: "wizard", shoes: "sneakers" });
    expect(cfg.hat).toBe("wizard");
    expect(cfg.shoes).toBe("sneakers");
    // and they survive a JSON round-trip
    const roundTripped = sanitizeAvatarConfig(JSON.parse(JSON.stringify(cfg)));
    expect(roundTripped.hat).toBe("wizard");
  });

  it("handles non-objects with full defaults", () => {
    expect(sanitizeAvatarConfig(null).hairStyle).toBe("short");
    expect(sanitizeAvatarConfig("braids").hairStyle).toBe("short");
    expect(sanitizeAvatarConfig(undefined).accessory).toBe("none");
  });

  it("adding a registry option does not break old saves (simulated)", () => {
    // an old save holding values that are all still valid stays identical
    const old = { hairStyle: "long", hairColor: "blonde", accessory: "none" };
    const cfg = sanitizeAvatarConfig(old);
    expect(cfg.hairStyle).toBe("long");
    expect(cfg.hairColor).toBe("blonde");
  });
});
