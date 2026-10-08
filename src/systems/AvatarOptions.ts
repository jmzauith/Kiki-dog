/**
 * AvatarOptions — data-driven customization registry + AvatarConfig model.
 *
 * LOGIC IDENTIFIERS ONLY. Ringo designs the actual avatar visuals later;
 * this module defines which cosmetic values are valid, what the defaults
 * are, and how saved avatars degrade when the registry changes.
 *
 * Future-proofing rules:
 *  - New categories/options can be ADDED to AVATAR_CATEGORIES at any time;
 *    old saves keep working (unknown categories pass through untouched).
 *  - If a future version REMOVES an option, old saves holding it degrade
 *    gracefully to the category default — never crash, never blank.
 *  - AvatarConfig carries an index signature so brand-new cosmetic
 *    categories survive a serialization round-trip even before the engine
 *    knows about them.
 */

export interface AvatarOptionDef {
  /** Stable logic identifier, e.g. "ponytail". */
  id: string;
  /** Human-readable label for future UI. */
  label: string;
}

export interface AvatarCategoryDef {
  /** Stable logic identifier, e.g. "hairStyle". */
  id: string;
  label: string;
  options: AvatarOptionDef[];
  defaultOptionId: string;
}

function cat(
  id: string,
  label: string,
  options: Array<[string, string]>,
  defaultOptionId: string,
): AvatarCategoryDef {
  return {
    id,
    label,
    options: options.map(([oid, olabel]) => ({ id: oid, label: olabel })),
    defaultOptionId,
  };
}

/**
 * The canonical customization registry. Add categories/options here freely;
 * never reuse an id for a different meaning.
 */
export const AVATAR_CATEGORIES: AvatarCategoryDef[] = [
  cat("hairStyle", "Hair style", [
    ["short", "Short"],
    ["medium", "Medium"],
    ["long", "Long"],
    ["curly", "Curly"],
    ["ponytail", "Ponytail"],
    ["braids", "Braids"],
  ], "short"),
  cat("hairColor", "Hair color", [
    ["black", "Black"],
    ["darkBrown", "Dark brown"],
    ["brown", "Brown"],
    ["blonde", "Blonde"],
    ["red", "Red"],
  ], "brown"),
  cat("skinTone", "Skin tone", [
    ["porcelain", "Porcelain"],
    ["fair", "Fair"],
    ["sand", "Sand"],
    ["honey", "Honey"],
    ["amber", "Amber"],
    ["bronze", "Bronze"],
    ["umber", "Umber"],
    ["espresso", "Espresso"],
  ], "honey"),
  cat("shirtColor", "Shirt color", [
    ["red", "Red"],
    ["coral", "Coral"],
    ["orange", "Orange"],
    ["yellow", "Yellow"],
    ["green", "Green"],
    ["blue", "Blue"],
    ["purple", "Purple"],
    ["pink", "Pink"],
    ["black", "Black"],
    ["white", "White"],
  ], "blue"),
  cat("bottomColor", "Bottom color", [
    ["red", "Red"],
    ["coral", "Coral"],
    ["orange", "Orange"],
    ["yellow", "Yellow"],
    ["green", "Green"],
    ["blue", "Blue"],
    ["purple", "Purple"],
    ["pink", "Pink"],
    ["black", "Black"],
    ["white", "White"],
  ], "black"),
  cat("accessory", "Accessory", [
    ["none", "None"],
    ["glasses", "Glasses"],
    ["headband", "Headband"],
    ["cap", "Cap"],
  ], "none"),
];

const CATEGORY_MAP: Map<string, AvatarCategoryDef> = new Map(
  AVATAR_CATEGORIES.map((c) => [c.id, c]),
);

/** Known core categories (also the AvatarConfig required fields). */
export const CORE_AVATAR_CATEGORIES = [
  "hairStyle",
  "hairColor",
  "skinTone",
  "shirtColor",
  "bottomColor",
  "accessory",
] as const;

export interface AvatarConfig {
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  shirtColor: string;
  bottomColor: string;
  accessory: string;
  // Future-safe hooks — Ringo/the engine may add categories later.
  eyeStyle?: string;
  glasses?: string;
  hat?: string;
  shoes?: string;
  backpack?: string;
  /** Brand-new cosmetic categories survive round-trips untouched. */
  [extraCategory: string]: string | undefined;
}

/** The default look for a brand-new profile. */
export function defaultAvatarConfig(): AvatarConfig {
  const cfg: AvatarConfig = {
    hairStyle: "",
    hairColor: "",
    skinTone: "",
    shirtColor: "",
    bottomColor: "",
    accessory: "",
  };
  for (const c of AVATAR_CATEGORIES) {
    (cfg as Record<string, string>)[c.id] = c.defaultOptionId;
  }
  return cfg;
}

/** Is this a known category? */
export function isKnownAvatarCategory(categoryId: string): boolean {
  return CATEGORY_MAP.has(categoryId);
}

/** Is this option id valid for the category? Unknown categories → false. */
export function isValidAvatarValue(categoryId: string, optionId: string): boolean {
  const c = CATEGORY_MAP.get(categoryId);
  if (!c) return false;
  return c.options.some((o) => o.id === optionId);
}

/**
 * Sanitize any saved/partial avatar into a fully valid AvatarConfig:
 *  - known categories with invalid or removed values → category default
 *  - unknown categories pass through untouched (future-safe)
 *  - non-objects → full defaults
 * Never throws, never returns a partially-invalid config.
 */
export function sanitizeAvatarConfig(partial: unknown): AvatarConfig {
  const cfg = defaultAvatarConfig();
  if (!partial || typeof partial !== "object") return cfg;
  const src = partial as Record<string, unknown>;
  for (const [key, value] of Object.entries(src)) {
    if (typeof value !== "string") continue;
    const category = CATEGORY_MAP.get(key);
    if (category) {
      cfg[key] = category.options.some((o) => o.id === value)
        ? value
        : category.defaultOptionId;
    } else {
      // Unknown (future) category — keep as-is so new cosmetics survive.
      cfg[key] = value;
    }
  }
  return cfg;
}

/** All category ids currently in the registry. */
export function avatarCategoryIds(): string[] {
  return AVATAR_CATEGORIES.map((c) => c.id);
}

/** Options for one category (empty array for unknown categories). */
export function avatarOptionsFor(categoryId: string): AvatarOptionDef[] {
  return CATEGORY_MAP.get(categoryId)?.options.map((o) => ({ ...o })) ?? [];
}
