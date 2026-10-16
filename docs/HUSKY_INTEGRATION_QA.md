> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Preserved original scope, results and provenance; not final-build acceptance.

# Husky integrated vertical slice verification

Date: 2026-10-07. Branch: `integration/husky-verified-slice`.

This report covers the combined build. The earlier `HUSKY_QA_REPORT.md` records the source agent's historical tests and limitations; this report supersedes its browser-verification status.

## Integration provenance

Started from `integration/husky-production-pass` at `f40e441c1f42926b3d36e66d3c768d649d84c4c3` (main was `41c590582abec67d5b95df9c2a9ce4c23c609890`). Integrated in the requested order, with each original PR head retained as a merge parent:

1. PR #7, McCartney progression: `235b0b4f054edb8a8882f16a0b3e2924a36b3d23`; integration commit `b61c51473cea03ebafb5c1c3554ea0f256b94b56`.
2. PR #6, Harrison world: `8dcb024085673ca960db9fa9c2488657bf098007`; integration commit `bab06dcabc6e9c2d963e5327cbd523ad86cf441b`.
3. PR #5, Ringo characters: `bd0a305e1f92c84b87f238eac7a1dab9a6ed307e`; integration commit `3bc1c613daa8c1b5ab17e4fae84735e248aa9eef`.

HuskyScene deliberately keeps PR #7's adventure graph, saves, route-aware gating, optional discoveries, and reward flow while using PR #6's 3360-pixel world, fog, landmarks, camera follow, and destination pans. Adventure coordinates derive from the world layout; Summit Gate math and Race Camp remain separate actions. Screen overlays stay pinned while the world scrolls.

PR #5 added reusable DogCharacter/HuskyCharacter and assets but did not wire the existing scene consumers. KikiCharacter now uses that shared renderer and the production 27-pose sheet; KikiMover retains its input-lock and completion contract. RaceScene keeps tested progression, persistence, and continuation, and replaces the placeholder rival with HuskyCharacter and race poses. There is one Kiki per scene.

## Bugs fixed during integration and browser testing

- Camera pan passed a tween easing string to an API requiring an easing function, freezing input with `this.ease is not a function`. It now receives `Phaser.Math.Easing.Sine.InOut`.
- The adventure audit still assumed a 1280-pixel world. It now reads optional definition world bounds; a regression verifies 3360-pixel Husky bounds and rejects x=3361.
- Secrets could miss their reveal after Snow Pass completion. Reveal now happens synchronously after completing the prerequisite.
- Repeated race-entry taps are guarded synchronously and require an unlocked race encounter.
- Keep exploring after reward formerly left unfinished secrets without useful input/camera guidance. It now re-enables and pans to them.
- Race completion is saved before celebration so refreshing after victory retains the win.
- Race finish position now matches the finish flag. Pace status is below buttons and hidden at victory.
- Reward outline, text spacing, and confetti ordering now keep stats and buttons readable.

## Verification

Local typecheck, production build, and all 106 Vitest tests passed on the final gameplay sources. The build has Vite's existing large Phaser bundle warning. Existing GitHub CI runs install, typecheck, and build; it does not run Vitest.

Real pointer-input playthroughs used the Codex in-app browser at localhost, with a 1280x720 game scaled into an approximately 1102x620 canvas. No runtime state injection was used to complete either route. The three initial landscape screenshots were camera previews, captured before the full playthrough; they are not proof of completion.

| Check | Observed result |
|---|---|
| Safe route | Bridge, route choice, lake, five-tap tree, Snow Pass, Summit Gate, Race Camp, mixed Steady/Turbo race, sticker completed |
| Challenge route | Bridge, Ice Shortcut, harder cave math, Snow Pass, Summit Gate, Race Camp, all-Turbo race, sticker completed |
| Repeated taps | Bridge, answers, route choice, tree, summit, race entry, and race answers completed only once |
| Wrong answers | Normal adventure, challenge cave, and race retained progress; hint appeared after two wrong answers |
| Adventure refresh | Forest checkpoint and safe route restored; completed encounters remained complete |
| Mid-race refresh | Adventure remained complete at Summit Gate; unfinished race restarted cleanly from Race Camp |
| Scrolling and overlays | Camera followed/panned through forest, valley, and summit; offscreen destinations became tappable; math overlays remained centered |
| Character count | Exactly one Kiki in the world and race; one Husky rival in the race |
| Safe sticker gating | Sticker stayed locked until route-required encounters and race completed; optional igloo was not required |
| Reward refresh | Earned sticker and 3-turn/2-turbo safe-race stats restored |
| Victory refresh before Continue | Challenge win retained; restored sticker showed 7 encounters, no secrets, 3 turns and 3 turbos |
| Optional exploration | Bone cache discovered without travel stranding; Keep exploring reached igloo and accepted/finished bonus math after reward |

## Remaining limits

Refresh during an unfinished race intentionally restarts the race, preserving the adventure checkpoint. Cross-device, touch/Chromebook testing and child first-run timing remain for João. Golden Husky counters are preserved, but a final Golden reward screen is outside these PRs. Some encounter labels remain simple markers. No main merge was performed. Both requested routes passed and there are no observed blockers for João to test this slice.
