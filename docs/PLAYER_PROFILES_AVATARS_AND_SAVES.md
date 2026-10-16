# Current player profiles, replay and durable saves

> **Current specification**, updated 16 October 2026 against final game-feel `85e801b0fd8bc45b9b9505f68bdb19ff7e5bab0e`. [Current-build index](HUSKY_CURRENT_BUILD.md). [Original profile-system design](https://github.com/jmzauith/Kiki-dog/blob/f2ede75037c3466e7fddfe4556636863c80d94eb/docs/PLAYER_PROFILES_AVATARS_AND_SAVES.md) retains the broader API proposal.

## Live selection and storage

[PlayerStart](../src/visuals/PlayerStart.ts) implements nickname creation and player buttons. Names are not save identifiers; generated profile IDs allow duplicate nicknames. Avatar configuration/model exists but the avatar customization UI is not delivered. On boot/reload the player chooser appears; the persisted active-profile pointer does **not** automatically bypass it. Switch player reloads the chooser.

[PlayContext](../src/systems/PlayContext.ts) uses `defaultLocalStore() ?? memoryStore()`, creates the registry and captures a `ProfileScopedStore` when the player is selected. This captured store prevents another tab's active-profile pointer from switching the running game's namespace. It is not a concurrent-write conflict-resolution system for two tabs playing the same profile.

Root keys: `kiki:v1:profiles` and `kiki:v1:active-profile`. Every live relative key below is prefixed **`kiki:v1:profile:<profileId>:`** by [ProfileStore](../src/systems/ProfileStore.ts). `_keyindex` tracks keys written through the adapter. Durable storage is browser-local and origin-specific, not cloud sync: localhost, another port, and Pages do not share saves. Durability assumes available, writable localStorage; the fallback is memory only. Write-quota failures are not uniformly handled by every caller and need separate hardening/validation.

| Relative key | Stored content / writer | Play again |
|---|---|---|
| `adventure:husky` | AdventureProgress via explicit AdventurePersistence calls; node, route, encounters, discoveries, bonus count, race win/totals, normal sticker | Cleared then new run |
| `reward:husky` | BreedRewardState through HuskyProgressBridge; cumulative reward facts and quiz mastery | Retained |
| `collection` | CollectionProgress rollup, updated by HuskyProgressBridge | Retained |
| `husky:polish-run:v1` | Events and completed interaction IDs (`done`) in PolishRun | Reinitialized |
| `husky:race-checkpoint` | Successful stages (`turns`), attempted turns, turbos, Kiki/Bolt positions | Cleared |
| `husky:breed-finale:v1` | JSON array of correct fixed finale question IDs | Retained; passed quiz skipped |
| `husky:golden-bone:v1` | Literal `earned` after treasure hunt / completed-cache backfill | Retained |
| `tutorial:trail:v1` | Literal `complete` from first trail packing lesson, after Let’s explore | Retained; tutorial skipped |
| `meta:last-breed` | `husky`, written at player selection | Retained |

The live Husky does not write generic `knowledge:husky`, `kiki-dog-quiz-husky-v1` or a global adventure/reward key. Standalone helper defaults mentioning sessionStorage are legacy APIs, not the scene contract. Live example (after player selection):

```ts
import { gameStore } from "./PlayContext";
import { saveRewards, loadRewards } from "./BreedRewards";
import { HUSKY_REWARD_DEF } from "./HuskyRewards";
const store = gameStore();
const reward = loadRewards("reward:husky", HUSKY_REWARD_DEF, store);
if (reward) saveRewards("reward:husky", reward, store);
```

## Exact reload / recovery boundaries

- Completed encounters, route and saved checkpoint survive reload; exact in-flight animation, active question/attempt count and unfinished puzzle-board configuration do not. Completed interaction IDs can skip already finished boards; an unfinished encounter may present new math.
- Race checkpoint is loaded when RaceScene is entered again. A saved Bolt finish restores defeat; three successful stages restore final sprint. Old checkpoints without `attempts` use `turns`. On victory the checkpoint is removed and the adventure win is saved before Continue. Continue returns with `fresh:false`.
- Race again removes only the race checkpoint and resets race counters/positions. It retains adventure progress and the run's completed race mini-game IDs, as well as all durable rewards/finale/bone data. A fresh full adventure is a different action.
- Tutorial completion is profile-scoped and survives replay/reload. Old profiles without the new key see the lesson at their next applicable trailhead visit. No broad save migration or tutorial replay UI was added.
- Correct finale answers save individually. Reload resumes unanswered questions; malformed finale JSON restarts only that quiz, unknown IDs are ignored. Passing stays saved across adventure replay.
- Golden Bone is idempotent. At reward, an older saved completed snow-cache encounter gets the bone even if its separate key was absent.
- Keep exploring does not clear anything. Completed igloo memory revisits do not record duplicate bonuses.

## Migration and reset limits

Old **unscoped** developer keys are not automatically read, copied or deleted by the live flow. Migration helpers in [ProfileProgress](../src/systems/ProfileProgress.ts) can explicitly copy selected keys to one profile, but are not a boot-time migration UI and retain old relative key names. They do not automatically translate legacy keys into the newer Husky contract.

Old **profile-scoped** point-based Golden Husky flags are recomputed by BreedRewards using the quiz policy. HuskyProgressBridge also corrects the collection's old gold flag, then sets mastery 1 when the finale IDs are complete. An earlier gold flag alone does not grant answers or bypass the finale; this can remove the old displayed gold until the quiz is passed. Other saved progression and the normal sticker are retained. See [rules](HUSKY_REWARD_RULES.md).

The reusable `resetBreedProgress` helper currently removes only adventure/reward/knowledge keys. It does **not** clear the new finale, bone, race checkpoint, run log or collection rollup; it is not a complete live Husky reset contract. Profile-wide namespace deletion has broader behavior, but no new reset/delete UI was added in the final game-feel pass. The only new relative save key in that pass is tutorial completion. Save formats vary: do not claim every key contains a versioned JSON envelope (the bone is a string and finale an array).

Development-only `?games=1`, `?composition=...` and `?racepractice=1` have separate inspection/practice behavior; race practice uses an ephemeral scoped memory store. They are not evidence that a normal profile completed a route. Existing validation and gaps are in the [evidence ledger](HUSKY_DELIVERY_EVIDENCE.md).
