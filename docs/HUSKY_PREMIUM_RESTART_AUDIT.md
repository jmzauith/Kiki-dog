> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Preserved original scope, results and provenance; not final-build acceptance.

# Husky Premium restart — 2026-10-14

## Starting state

- Local branch: integration/husky-final-polish; HEAD 757819a.
- 14 tracked files modified; previous PR26/27/28/30 imports untracked. No stash, no remote configured. Nothing discarded.
- Local branches: integration/husky-final-polish, integration/husky-verified-slice, preview/snowy-peaks-canonical-kiki.
- Full worktree backup (excluding dependencies, build output and Git): /private/tmp/kiki-local-before-premium-20261014.tar.gz.
- New local branch: integration/husky-premium-polish, starting at 757819a with all prior work retained.
- Remote premium branch verified through GitHub Git Trees API: 50f7fdbd2e65addbedb9ae39a72084c792d68e90, 133 tree entries; missing motion/depth packages.
- Remote development/husky-ground-contact-20261010 and development/husky-motion-depth-recovery-20261009 both resolve to ac4ad8969e4ea5fb0d40ddb19fe0f392f1901dad, 181 entries; partial motion recovery, not a complete replacement for local progression/profile/art work.
- Martin d0d2d01dd8850e1d07f2d741ed13e4f2390216ae exists remotely; absent from local object database.
- No supplied tar/zip handoffs found in workspace or attachment directory. Recovered from verified specialist trees instead.
- Git transport cannot authenticate this private repository. GitHub connector reads work. Publishing must be verified by returned tree/blob hashes, never a success message alone.

## Recovery provenance

- Harrison: 5ea9c2123f2c6429b182abb4426e7670153549f7: 13 snowy-peaks-depth-v1 JSON files, 14 transparent foreground/FX assets, playable-depth guide.
- Ringo original: 124eb79f250b12b31341c286ad8a353a19730f55: motion guide and original motion modules retained in separate recovery staging directory.
- Development recovery ac4ad8969e4ea5fb0d40ddb19fe0f392f1901dad: revised motion modules, 7 actual rig atlases, RingoKikiMover and SnowyDepth. Selected over original modules where revised.
- McCartney: 3505dce85020137a833eb952d196094270501714: Microgames.ts, HuskyMicrogames.ts, 29 tests, design guide. These are definitions/validators, NOT implemented scene microgames.
- Full 56-file recovery staging: ../recovery-20261014. No specialist scene snapshot blindly copied.

## Conflict decisions

- Preserve local current progression, profile-scoped local storage, narrative, race checkpoints and reward wiring.
- Canonical save namespace: ProfileScopedStore via gameStore(), kiki:v1:profile:<id>:; gameplay key adventure:husky. No new writes to legacy global Husky keys.
- Reward keys: retain existing HuskyProgressBridge/ProfileScopedStore convention, rather than importing older standalone scene saves.
- Node IDs remain HUSKY_ADVENTURE IDs. Metadata area bridge/lake/igloo/summit maps to broken-bridge/frozen-lake/secret-igloo/summit-camp. Race Camp remains staging, not an extra required math node.
- Preserve painterly art and canonical character sources. No Golden Retriever activation, generated art or main merge.

## Evidence limits

The previous October 8 report mixed older full-route screenshots with a fresh PR30 bridge-only pass, and its displayed timestamps were not measured capture times. Those screenshots and timings are historical evidence only. New candidate acceptance requires fresh full-route playthroughs and measured timestamps.

## Recovery validation

After additive recovery, TypeScript passed; Vitest: 28 files, 455 tests passed. This establishes module compatibility only, not playable integration or premium acceptance.
