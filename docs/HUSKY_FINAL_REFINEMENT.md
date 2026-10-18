# Husky final refinement — implementation and acceptance ledger

Status: **implementation candidate; browser acceptance in progress**. This is not Roady handoff approval.

Branch: `feature/husky-final-refinement`. Starting local SHA: `8a7eab8367ee39941aff4622856efb9a9dbe5fd1` (same tree as published `feature/husky-final-game-feel` SHA `49d54e426dcd2d15dafb4ae0ad744a84c8b1bf6b`). Date: 2026-10-17. No deployment or main changes.

## Implemented and integrated in this working candidate

- Profile-scoped `math:history:v1`: last 120 arithmetic facts and selection ordinal. Retained on replay, shared by adventure, race and Yeti; isolated by existing ProfileScopedStore. Corrupt/unavailable storage falls back to memory. Old profiles need no migration. Facts are suppressed across equation/missing-number variants and commutative operand reversal. Bounded pools avoid random-generation deadlocks; exhausted pools allow repeats.
- Addition/subtraction/multiplication and occasional exact division; equations, short supply stories, missing numbers, equal grouping/sharing. Early bridge warm-up uses addition/subtraction; race challenge retains higher operands. Normal route question count is unchanged. No new paired mandatory encounters.
- Worked explanations use the generated arithmetic metadata; old multiplication-only narrative templates no longer overwrite live hints or stories. Race forfeits/rematches remain unchanged.
- Summit Lights-Out replaced with Lantern Trail Memory, 3/4/5 lights; completed rounds retained on error. Uses existing sequence-memory interaction. Legacy pure Lights-Out helpers remain historical/tested utility code, not a live board.
- Memory retains six pairs, now painted winter equipment. Shared painted equipment atlas supplies most game pieces. Original comparison paintings preload before the spot-difference board opens.
- Enterable Ice Cave with visible intact Kiki and a friendly painted Yeti. Optional three-question practice invitation; addition, subtraction, multiplication. Two misses explain and offer a fresh problem at the same practice step. No race penalty. Exit returns to the original cave progression question. Practice progress is transient; adventure persistence is unchanged. Optional practice adds three or more questions only when chosen.
- Natural-color Husky within gold foil frame replaces monochrome sticker in the shared reward/album renderer. This follows the children's explicit new direction; it does not retroactively approve older art.
- Painted bridge plank replaces generic panel texture; runtime frame excludes transparent padding. Plank and target orientation match; matching gap highlights on pickup. Existing exact-size, occupied-slot and magnetic tolerance rules preserved.
- Complete-character traversal gains slight speed-dependent lean. Existing distance-driven eight-frame gait, planted idle, footprints, contact shadow, follow camera, guidance, tutorial and album sequence retained.

## Minigame audit and reusable library

| Husky activity | Decision | Reusable mechanic / remaining limitation |
|---|---|---|
| Trail map | POLISH | Rotate-to-connect route; functional SVG path remains for readable topology |
| Spot difference | KEEP/POLISH | Two painted scenes, five targets; preload added; target fairness needs fresh inspection |
| Igloo memory | KEEP/POLISH | Six-pair illustrated memory; reusable object set |
| Bone hunt | POLISH | Scent-distance search; painted pieces, grid remains schematic |
| Mountain markers | KEEP | Sequence memory, three rounds |
| Cave crystals | REPLACE in live cave | Yeti practice visit now uses the cave; crystal board remains reusable unused registry entry |
| Fallen branches | POLISH | Topmost-object removal / drag-to-collect; atlas is card-style art, not isolated branch silhouettes |
| Summit lanterns | REPLACE | Lantern sequence memory replaces neighbor-toggle rules |
| Bolt / igloo rematch | KEEP/POLISH | Tic-tac-toe with draw accepted; painted paw/snow tokens |
| Sled packing | POLISH | Shadow/shape matching; painted equipment |
| Lake | KEEP | Connected safe path with real-world crossing |
| Launch | KEEP | Timing window with assisted hint |
| Slalom | KEEP | Lane avoidance |
| Powder paddles | KEEP | Alternating rhythm |
| Finish cheering | KEEP | Target collection during finish |
| Bridge | POLISH | Sized drag-to-build / tap-select-place |

A future library can reuse these and add hidden objects, what's missing, odd-one-out, picture assembly, sorting, size ordering, pattern completion and copy-arrangement as proposals. Those mechanics are not claimed delivered. No next breed started.

## Generated-art provenance

Generated with the imagegen skill on 2026-10-17, in response to the attached refinement brief. These are active replacement candidates, not newly approved canonical character redesigns.

- `public/assets/collectibles/husky-natural-gold-v2.png`: edited existing foil sticker, preserved dog pose/anatomy/markings, restored charcoal/white fur and snowy background, gold frame retained. Source generation `exec-946b42f3-8383-4607-addb-07b0c8f841d3.png`.
- `public/assets/puzzles/winter-equipment-atlas.png`: 4×4 painted ivory-paper tiles: paw, pine, mountain, tent; snowflake, bone, branch, mittens; rope, bell, scarf, boots; sled, paddle, lantern, crystals. Runtime CSS atlas; source `exec-42b5da34-6def-47dd-a1d5-fb32c16ea781.png`.
- `public/assets/premium/yeti-cave-interior.png`: welcoming blue ice cave, warm lanterns, friendly white Yeti at right, open snowy entrance at left, floor for separate Kiki. Source `exec-ccb22034-b913-4359-9fd4-a665d19a00c4.png`.
- `public/assets/premium/bridge-repair-plank.png`: single transparent painted wooden plank, squared ends, snow edge, no interface; source `exec-9df17e4b-95fa-4693-b312-15b5a08aaf5d.png`.

## Evidence boundary

Starting build passed 497 tests, TypeScript and production build. Its historical route checks do **not** validate these changes. Fresh combined-build full Safe/Challenge, Yeti, recovery, race loss/rematch, reward, reload/replay and visual evidence remain to be recorded. No final quality claim yet.
