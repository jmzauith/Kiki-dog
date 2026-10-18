> **Latest implementation:** [Final refinement and reusable-mechanic audit](HUSKY_FINAL_REFINEMENT.md). Lantern sequence memory replaces Lights-Out; painted equipment/branches, enterable Yeti practice and natural-color gold-framed reward are now live. Original delivery evidence below remains historical.

> **Later implementation:** [Final game-feel pass](HUSKY_FINAL_GAME_FEEL.md) replaces important emoji visuals, adds illustrated comparison scenes, pointer dragging, feedback and compact race finish. The original report below remains evidence for its original puzzle-pass build.

> **Documentation status — current implementation report; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). d440ea1: full routes after puzzles; later systems were not yet present.

# Snowy Peaks playable mini-games — ages 8–11

Branch: `feature/husky-playful-minigames`. Based on the preserved local premium-polish candidate `baee0a57e99506d624181d0d8ac013fe294740e8`. No main merge.

## Implemented

| Location | Playable activity |
|---|---|
| Trailhead | Rotate six tiles into a continuous trail |
| Broken bridge | Match and drag three different-sized planks into the live bridge |
| Forest | Find five changed objects in two pictures |
| Frozen lake | Plan an adjacent safe path around cracked ice, then watch Kiki cross |
| Ice cave | Repeat three crystal patterns of three, four, then five markers |
| Fallen tree | Remove six overlapping branches from top to bottom |
| Snow pass | Remember three growing trail-marker sequences |
| Igloo | Six-pair memory game, plus optional tic-tac-toe bonus |
| Bone cache | Find three buried bones using nearest-bone distance clues |
| Summit | Light nine connected lanterns; hints supply a valid next move |
| Race camp | Tic-tac-toe with Bolt; optional equipment matching |
| Race | Three timed launches, six steering waves, alternating paddle strokes, four finish stars |

Hints, restart and unlimited retries are available. Tic-tac-toe wins or draws advance; losses offer a rematch. Required math, route selection, character/world assets and reward logic remain intact. New boards use CSS, SVG and symbols; they are not new painterly illustrations. The brief paddle/star activities are intentionally lighter than the thinking puzzles. Narrative/advice choices remain text choices.

## Browser validation

Fresh profiles created through normal UI; no save injection or completion shortcuts. Hint-assisted QA, not unassisted child difficulty testing.

- Safe route: all required encounters, live bridge repair/crossing, lake puzzle/crossing, branches, trail memory, igloo memory, optional bonus tic-tac-toe, bone search, lantern gate, Bolt game, all race beats, reward. Reload at Snow Pass restored completed encounters. Reward resume checked.
- Challenge route: bridge, forest differences, ice cave memory and math, trail memory, lantern gate, Bolt loss/rematch/win, optional sled packing, all race beats in turbo mode, reward and reload.
- Incorrect selections checked in differences, lake, memory sequence, paddling, packing and tic-tac-toe. Hints checked for memory, branches, lanterns and sequences.
- Memory, bone, lantern, branch and strategy boards also exercised in the development inspection view (`?games=1`). This view does not read or write adventure saves.

| Recorded metric | Safe | Challenge |
|---|---:|---:|
| Required math | 6 | 6 |
| Correct math | 6 | 6 |
| Completed interactions, including dialogue | 23 | 18 |
| Optional discoveries | 2 | 0 |
| Race turns | 3 steady | 3 turbo |
| Race beats | 4 | 4 |
| Total QA time | 14m 48s | 8m 59s |
| Active QA time | 12m 20s | 8m 59s |

These times include screenshots, hints, inspection and tool latency; they are not child playtime predictions. Safe-run hint count predates the hint-tracking correction; challenge log records six hints. Full logs and screenshots are under `docs/qa/playful-games/`.

## Validation and limits

Final rerun: 480 tests (31 files), TypeScript and production build passed after wording and hint refinements. Existing large-bundle warning remains. No new asset downloads or dependencies.

Remaining production polish: bespoke illustrated pieces instead of platform-dependent symbols; crystal audio; child playtest feedback on difficulty; touch-device checks. Browser coverage is desktop 1280×720; no claim of device-specific mobile validation. Some race games are separate boards over the race scene, not continuous physical steering of the world sled. Existing world animation is unchanged by this mini-game pass.
