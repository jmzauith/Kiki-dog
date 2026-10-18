# Final refinement browser evidence

Current implementation evidence, 17 October 2026. [Frozen candidate / detailed ledger](../../HUSKY_FINAL_REFINEMENT.md). Desktop in-app browser 1101×984; visible UI, durable QA profiles. Screenshots are JPEG and unedited. Timings include tool/inspection pauses and exclude post-race learning/album. Not child usability, physical touch or commercial production approval.

## Capture scope

| Files | Build and meaning |
|---|---|
| `safe-math-recovery.jpg` | Initial 778bded recovery before warm-up retry fix |
| `safe-bridge-crossing.jpg`, `safe-painted-differences.jpg`, `safe-lake-arrival.jpg` | Initial Safe checks around 0e59a87. Bridge filename is not proof of exact midpoint; capture can show arrival |
| `safe-golden-bone.jpg`, `safe-painted-memory.jpg`, `safe-lantern-complete.jpg`, `safe-race-division.jpg`, `safe-race-win.jpg`, `safe-natural-husky-album.jpg`, `safe-reward-after-reload.jpg` | Initial Safe completion around bb0b626; before challenge-range/lantern-dimming update |
| `challenge-yeti-interior.jpg`, `challenge-yeti-explanation.jpg`, `challenge-yeti-complete.jpg` | Challenge, 60a9913 cave framing, visible Kiki/Yeti, two-miss explanation and three-type completion |
| `challenge-sled-packing.jpg`, `challenge-race-explanation.jpg`, `challenge-bolt-wins.jpg`, `challenge-turbo-math.jpg`, `challenge-rematch-win.jpg`, `challenge-album.jpg`, `challenge-reward-reload.jpg` | Final code 60a9913 (GitHub 7a9f741): optional packing, forfeit/loss/rematch, stronger Turbo, natural sticker and persistence |
| `safe-final-bridge.jpg`, `safe-final-painted-branches.jpg`, `safe-final-turbo-division.jpg`, `safe-final-race-win.jpg`, `safe-final-replay-reward.jpg`, `safe-final-reload.jpg` | Entire replay traversal on 60a9913; mixed drag/tap bridge, six painted branches, all four arithmetic operations across the run, win and retained quiz/Bone/reward |

## Telemetry files

These `.txt` files contain the visible accessibility representation of the expanded Local playtest results, including JSON events/summary. They were read from the displayed UI, not private save inspection.

- `safe-telemetry.txt`: initial Safe plus optional content, spans implementation revisions. 8 asked / 6 correct, 23 interactions, 2 discoveries, 3 race turns, 4 beats; 20m17 total / 17m18 active.
- `challenge-telemetry.txt`: 16 asked / 9 correct, includes four optional Yeti presentations, bridge retry, five forfeits and three-turn rematch. 17 interactions, 0 discoveries, 8 turns, 4 beats; 18m40 total / 13m39 active.
- `safe-final-telemetry.txt`: 6 asked / 6 correct, 18 interactions, 0 new discoveries, 3 turns, 4 beats; 30m48 total / 9m28 active. Run was initiated and left idle earlier; all replay traversal actions were on final code. Do not call 30m48 a gameplay duration or 9m28 a clean benchmark.

Read the parent ledger before claiming final-SHA coverage. No two brand-new profiles begun after code freeze are claimed. Initial optional igloo/Bone checks were not repeated during final Safe replay; durable Bone and quiz retention were checked after that replay and reload.
