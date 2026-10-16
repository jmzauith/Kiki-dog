> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](../HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](../HUSKY_REMAINING_WORK.md). Preserved original scope, results and provenance; not final-build acceptance.

> Historical preview audit. Current integration status and remaining work: [Husky Final Polish](HUSKY_FINAL_POLISH.md).

# Snowy Peaks playable visual preview

Branch: `preview/snowy-peaks-canonical-kiki`. Main remains untouched. This is a local preview, not a main merge or a production-art approval.

## Provenance

The entire local baseline tree matched PR18's remote tree at `9fe44b0c1f87c404abb584cc2bf35e48d00c19fe`. The local mirror has a different commit ancestry; its starting commit is `9e7acae`. The imported additions are listed below rather than represented as fabricated Git merge commits.

| Source | Exact source commit | Included behavior |
|---|---|---|
| PR9 reward rules | `bfd84b7ec9e851aad947c5f1ee4c2ee52f3ae401` | Reward engine and tests; mirrors completed adventure facts without changing PR18 gates |
| PR12 facts/quiz | `d9fda59a70b7bb525c545b9bbba1b41a4d9b1293` | Facts data, quiz engine and tests; playable quiz UI deferred |
| PR15 registry/collection/Golden Kiki | `2ef35174e456380f55d40495efbb3928572a8e28` | Registry, persistent Husky collection rollup and tested endgame logic; album/finale UI deferred |
| PR19 profiles | `8acce3a4454e44dcf747a200984997ac4d385cde` | Nickname creation, player selection and isolated durable saves; avatar builder deferred |
| PR21 narrative | `c7e1133179594e6c1c7c41b15ec718d05459b9fb` | Environmental math prompts/hints and tested narrative data; tail-wag references corrected for locked Kiki |
| PR23 Harrison direction | `b383a1e79ae2599d307538d14626b0f4cc0b08f4` | Approved originals retained as references; clean derived exploration, bridge and race plates loaded in play |
| PR24 Ringo Kiki | `24fbbcf111d6173f933b9754080e1ceac5c5d532` | Exact 18 canonical poses packaged in semantic atlas; inherited Kiki tail hidden |

Earlier vector art proposals are preserved as references where already present and excluded from the final-style upgrade. Golden Bay is not mechanically integrated. No code changes were made to PR18's graph, movement curves, question generation, tree tap count, race progress rules or original sticker eligibility.

## Preview implementation

The start screen, exploration panorama, bridge encounter plate, race course and reward stage use the approved painterly vocabulary. Background adapters were generated from Harrison references to remove baked gameplay characters and controls. They are temporary single plates, not final modular assets. Kiki's approved pixels were reused rather than regenerated. Eighteen poses occupy 27 semantic slots with aliases for the old animation API; the trot/run aliases are pose swaps, not final frame-by-frame animation.

Existing world props, Husky, sled geometry and the Husky sticker crop remain intentional placeholders. The race course's perspective does not yet match the existing horizontal racer lanes. Summit props can look suspended because their original world anchors are preserved against a new flat plate. These are production-art blockers documented in `IMAGE_DESIGN_BACKLOG.md`, not evidence of finished art.

New saves use a captured player namespace (`adventure:husky`, `reward:husky`, `collection`). Existing unscoped developer saves are left intact, not silently assigned to a newly created player. Reward/collection sync is idempotent and cannot advance adventure progression. Play again resets the adventure while keeping durable collection/mastery data.

The mirrored workspace needed polling for reliable preview refresh; `vite.config.ts` enables it. No extra dependency was introduced.

## Validation

TypeScript check and production build pass. All 383 tests in 23 files pass, including new reward-bridge idempotency, profile isolation and non-mutation tests. The production build reports the existing large Phaser bundle warning (about 1.79 MB minified / 414 KB gzip); device performance remains unverified.

Desktop browser smoke test: profile creation, canonical Kiki exploration, broken bridge math and repair, safe route selection, lake math, two wrong answers and hint recovery, five-tap tree, snow pass, summit gate, two Turbo turns plus one Steady turn, three-turn win, reward, refresh restoration and Keep exploring. A second player starts at an unrepaired bridge while the first player's completed reward persists. The morning report records the final screenshot set and any additional checks.

No remote branch was published: the local mirror has no configured origin and command-line GitHub authentication is unavailable. Connector access retrieved exact source files, but no remote main or PR was modified.
