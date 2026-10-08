# Player Profiles, Avatars, and Saves — Kiki's Dog Adventure

**Status:** logic + persistence only. No UI yet (Ringo designs the avatar
visuals and the profile-selection screen later). No scene files touched.

## Why profiles are user-created

Aurora and Olivia will be the first two real players, but the game must be
shareable with their friends. If Aurora and Olivia were hardcoded as engine
concepts, every friend would need a code change — and every gameplay system
would risk branching on player names.

So the engine knows **zero** player names. A profile is local game identity:

- a nickname (duplicates allowed — two kids named "Olivia" are two profiles)
- an avatar configuration (logic identifiers; visuals come later)
- a generated, stable profile id — save identity is **never** derived from
  the display name

Gameplay systems never ask "who is playing?". They ask only: **"what is the
current profile save context?"** — a `ProfileScopedStore` that is already
namespaced to the active profile. There is no `if (player === "Aurora")`
anywhere, by construction: the systems literally never receive a name.

No personal data is collected: no email, birth date, legal name, phone,
address, or login. A profile is a nickname + a look + progress, stored on
the device.

## Profile identity model

`PlayerProfile` (`src/systems/PlayerProfiles.ts`):

| Field | Meaning |
|---|---|
| `id` | Generated (`p_` + 12 random chars), stable forever |
| `displayName` | Nickname, trimmed, max 24 chars, duplicates allowed |
| `createdAt` / `updatedAt` / `lastPlayedAt` | Timestamps (ms) |
| `avatarConfig` | `AvatarConfig` (below) |
| `themeColor` | One of the curated theme palette ids |
| `favoriteDogBreedId?` | Optional hook for a future feature |
| `schemaVersion` | Always `1` today; see versioning |

`ProfileRegistry` manages the set: `createProfile` (throws on blank name),
`updateProfile` (nickname/cosmetics/theme; id never changes; progress
untouched), `deleteProfile` (explicit destructive — removes the profile AND
its namespaced progress), `listProfiles`, plus the active-profile pointer:

- `setActiveProfile(id | null)` — unknown ids are rejected, never crash
- active id persists across reloads; a deleted/invalid id degrades to
  no-active-profile
- deleting the active profile activates the most-recently-played remaining
  profile, or clears to no-active state if none remain (documented choice:
  keeps the game valid without inventing data)

## Avatar config model

`AvatarConfig` (`src/systems/AvatarOptions.ts`): six required string fields
(`hairStyle`, `hairColor`, `skinTone`, `shirtColor`, `bottomColor`,
`accessory`) plus optional future hooks (`eyeStyle`, `glasses`, `hat`,
`shoes`, `backpack`) and an index signature so brand-new cosmetic
categories survive serialization round-trips even before the engine knows
them.

## Customization registry

`AVATAR_CATEGORIES` is the data-driven registry of valid choices (logic
identifiers only):

- **hairStyle:** short, medium, long, curly, ponytail, braids
- **hairColor:** black, darkBrown, brown, blonde, red (fun colors addable)
- **skinTone:** porcelain, fair, sand, honey, amber, bronze, umber, espresso
- **shirtColor / bottomColor:** red, coral, orange, yellow, green, blue, purple, pink, black, white
- **accessory:** none, glasses, headband, cap

`sanitizeAvatarConfig()` validates any saved/partial config: known
categories with invalid or *removed* values fall back to the category
default; unknown future categories pass through untouched. Old saves never
crash when the registry changes — adding options is always safe, removing
an option degrades gracefully.

## Save-key structure

```
kiki:v1:profiles                  profile registry (identity + cosmetics)
kiki:v1:active-profile            active profile id pointer
kiki:v1:profile:<id>:<key>        everything belonging to one profile
```

`<key>` is whatever the game system already uses — the recommended
conventions for Lennon:

```
adventure:<breedId>    AdventureProgress save
reward:<breedId>       BreedRewardState save
knowledge:<breedId>    BreedKnowledgeProgress save
collection             CollectionProgress save
golden-kiki            UltimateRewardState save
meta:last-breed        last played breed (resume UX)
```

Example: Aurora's Husky reward save lives at
`kiki:v1:profile:p_9f3ka2x8qz:reward:husky`. Olivia's is a different key.
They cannot collide, by construction.

## Active profile behavior

The game boots → `ProfileRegistry` loads → `getActiveProfile()` (or null) →
gameplay receives `scopedStoreFor(baseStore, activeId)`. Switching profiles
is `setActiveProfile(otherId)` + handing systems the new scoped store.
Reload restores the last active profile automatically.

## localStorage vs sessionStorage

- **localStorage** — durable player progress: the profile registry, active
  pointer, and every namespaced game save. Survives refresh, browser close,
  and Chromebook restart. This is what children (and their parents) expect
  from "my game".
- **sessionStorage** — temporary session-only state: e.g. an in-progress
  encounter's transient UI state. Cleared with the tab.

Note: the earlier McCartney systems defaulted to sessionStorage because
they were pre-profile prototypes. Under profiles, pass a
**localStorage-backed** `ProfileScopedStore` for anything that must
survive; keep sessionStorage only for genuinely ephemeral state. The
adapter works with either — the choice is the caller's, documented here.

## Profile-scoped storage adapter

`ProfileScopedStore(baseStore, profileId)` (`src/systems/ProfileStore.ts`)
implements the same `StorageLike` interface every game system already
speaks (`getItem`/`setItem`/`removeItem`). It prefixes keys transparently
and maintains a key index so a namespace can be enumerated (`keys()`) and
deleted exactly (`clearNamespace()`).

Usage (Lennon):

```ts
const base = defaultLocalStore();           // localStorage
const registry = new ProfileRegistry(base);
const active = registry.getActiveProfile(); // or profile-selection UI
const store = new ProfileScopedStore(base, active.id);
saveBreedRewards("reward:husky", state, store);   // unchanged call
const loaded = loadBreedRewards("reward:husky", "husky", store);
```

`BreedRewards`, `BreedQuiz`, `AdventurePersistence`, `GoldenKiki` need
**zero** changes — they never learn about profiles.

Contract: all profile progress must go through the scoped store. Keys
written directly to the base store bypass the index and won't be cleaned
up on delete.

## Migration strategy

Pre-profile development saves live at root keys (e.g.
`kiki-dog:golden-kiki:v1`). Once profiles exist, the game only reads
namespaced keys, so legacy data is naturally invisible — it is **never**
auto-copied anywhere (auto-copying into every profile would duplicate and
corrupt).

Explicit, one-profile migration:

```ts
const legacy = detectLegacyKeys(base);              // ["kiki-dog:golden-kiki:v1", ...]
assignLegacySaveToProfile(base, auroraId, legacy);  // copy into Aurora only
clearLegacyKeys(base, legacy);                      // optional cleanup
```

Document the behavior: legacy dev data is disposable unless someone
explicitly migrates it. `detectLegacyKeys` needs key enumeration
(`localStorage` has it); it returns `[]` where unavailable.

## Reset vs delete

Separate operations, separate meanings:

| Operation | Effect |
|---|---|
| `resetBreedProgress(store, breedId)` | Clears adventure+reward+knowledge for one breed |
| `resetAdventureOnly` / `resetRewardsOnly` | Targeted sub-resets |
| `resetProfileProgress(registry, base, id)` | Clears ALL progress; identity + avatar kept |
| `deleteProfileAndData(registry, id)` | Deletes profile AND its namespace |
| `resetAllData(base)` | Dev wipe: all namespaces + registry + active pointer |

"Reset progress" never deletes the avatar or profile. Deleting a profile
never touches another profile's data.

## How the existing systems integrate

All four take an explicit key + store, so integration is mechanical:

- **AdventurePersistence** (`saveAdventure`/`loadAdventure`): pass the
  scoped store and `adventure:<breedId>` as the key.
- **BreedRewards** (`saveBreedRewards`/`loadBreedRewards`): scoped store +
  `reward:<breedId>`.
- **BreedKnowledgeProgress** (`saveQuizProgress`/`loadQuizProgress`):
  scoped store + `knowledge:<breedId>`.
- **CollectionProgress / GoldenKiki** (`saveGoldenKiki`/`loadGoldenKiki`):
  scoped store + `golden-kiki` / `collection`.

No system needs profile-aware code. The summary builder
(`buildProfileProgressSummary`) reads these saves defensively to power the
future profile-selection screen (`ProfileProgressSummary`: stickers,
secrets, quizzes mastered, completion %, last played, …). Malformed saves
contribute nothing; they never crash the UI.

## How future UI consumes profile/avatar data

- Profile-selection screen: `registry.listProfiles()` +
  `buildProfileProgressSummary(profile, scopedStoreFor(base, id))`.
- Avatar builder: `AVATAR_CATEGORIES` for options,
  `sanitizeAvatarConfig` for validation, `registry.updateProfile(id,
  { avatarConfig })` to save. Editing cosmetics never touches progress.
- Friend onboarding: `registry.createProfile({ displayName })` — no
  backend, no login, works offline on a Chromebook.

## How friends create profiles safely

1. Friend opens the game on their own device (or a shared Chromebook).
2. They enter a nickname and pick a look → `createProfile`.
3. Their progress lives under `kiki:v1:profile:<their-id>:` — Aurora's
   and Olivia's data is unreachable by construction, even with an
   identical nickname.
4. No accounts, no emails, no discovery, no chat — nothing leaves the
   device. (Share cards / friend codes are future work, not this system.)

## Save versioning

Every durable save carries `version: 1` today (`PROFILE_SCHEMA_VERSION`).
Rules: current version loads normally; a *newer* version sets
`upgradeNeeded` (UI can prompt to update the game) and loads as empty —
never crashes, never wipes on read; malformed JSON degrades to empty;
partial profiles are coerced field-by-field with safe defaults. Migration
hooks live where future versions will need them; v1→v2 will be the first
real exercise.
