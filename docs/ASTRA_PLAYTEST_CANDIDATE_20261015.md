> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Preserved original scope, results and provenance; not final-build acceptance.

# Husky playtest candidate — 15 October 2026

This report supersedes the unfinished browser acceptance section of ASTRA_RECOVERY_20261015.md. Main was not merged or changed. The build is ready for João's feedback on the complete playable flow; the premium art backlog below remains open.

## Recovered / present

Local work was preserved at safety branch `recovery/astra-husky-polish-local`, commit `e85d4eb8ef38b00c8676b1427cb3c7a41ccb03d3`, before remote synchronization. The original local and remote histories were unrelated; both were retained. See the recovery report for the exact inventory and publication history.

The continuous Snowy Peaks panorama, transparent landmark atlas, complete-character eight-frame walk sheet, planted-paw idle image, foreground clipping helper, terrain paths, and save-safe developer composition views are present. The walk and idle images are reference-derived replacement assets, not a newly approved canonical model sheet. Harrison's race paintings and Ringo's race/reward character artwork remain present.

Local visual checkpoint: `e2710b3aca9d019e179735f69c1013480d1e1be5`. The following local commit `05ee83d` fixes replay completion. Publication uses the authenticated GitHub connector, so remote commit metadata and SHAs differ; matching file trees establish equivalence.

## Integrated

- Exploration uses the complete walk frames and planted-paw idle; old separated-body rendering is hidden. Facing is set before departure; arrival reactions cannot restart walking after settling.
- Encounter scenery cards no longer cover the live world. Compact interaction panels leave the character and landscape visible. Math still uses a larger question panel.
- Visible landmarks define click targets. Trailhead, forest, snow-pass and bridge exit placements were adjusted. Bridge traversal follows its painted deck and exits onto snow.
- Race uses painted downhill, icy bend, deep snow and finish scenes. Sleds follow scene-specific curves, scale into distance, turn with the path, and emit snow from runner height. Dogs sit lower on the sleds. The duplicate finish gate overlay is removed.
- Replay bug fixed: returning from RaceScene explicitly passes `fresh: false`. Previously Phaser retained the earlier Play again flag and erased the completed adventure when returning from a replayed race.
- Progression, required math, profile saves, reward unlocks and three race turns remain intact. Telemetry is available in the local playtest results panel.

## Browser validated

Both final routes were played through normal browser controls on port 5177. No save injection or gameplay shortcut was used. Screenshots and telemetry are in `docs/qa/husky-composition/`.

| Check | Safe | Challenge |
|---|---|---|
| Bridge math, three boards, repaired crossing, idle arrival | Pass | Pass |
| Forest clue and route choice | Pass | Pass |
| Lake stones and Fallen Tree | Pass | Not on route |
| Cave crystals and cave math | Not on route | Pass, all inputs attributable |
| Snow Pass, advice, summit math and frozen locks | Pass | Pass |
| Igloo lantern/map/nook/badge, bonus declined | Pass | Skipped intentionally |
| Race Camp greeting | Wave | Friendly bark |
| Camp equipment checks | Race now | Runners, harness, strap |
| Race beats and finish | Three steady turns | Three turbo turns |
| Favorite-moment reflection and sticker reward | Pass | Pass |
| Reload, select same profile, reward/sticker restored | Pass | Pass |

The safe run began with Play again and did not reload before race completion: it directly verifies the replay-reset regression fix. The challenge run completed on the same corrected build. Earlier bridge checkpoint reload and final-cheer race checkpoint reload checks also passed; those are recorded separately from the two final uninterrupted routes.

No chopped bodies, backward travel, post-arrival walk restart, old marker click targets, or rectangular encounter scenery cards were observed in these final routes. This does not certify every possible animation frame or optional branch.

## Measured results

| Metric | Safe final | Challenge final |
|---|---:|---:|
| Required math / correct | 6 / 6 | 6 / 6 |
| Non-math interactions completed | 21 | 19 |
| Optional discoveries | 1 (igloo) | 0 |
| Race turns / race beats | 3 / 4 | 3 / 4 |
| Turbo turns | 0 | 3 |
| Hints | 0 | 0 |
| Recorded elapsed | 11m 08s | 23m 33s |
| Recorded idle | 2m 26s | 13m 24s |
| Recorded active | 8m 41s | 10m 09s |

These are inspection-run timings, not a certified adult fast-play benchmark. Browser tool latency, screenshots, reasoning pauses and a resumed challenge introduction inflate them; even the active timer includes up to 30 seconds between inputs before declaring idle. Do not use these figures as a child-session duration promise. `microDecisionsMade` remains zero because these choices are logged as interactions/advice rather than that separate event type.

## Automated validation

After the replay fix: TypeScript passes; Vitest **470 tests in 30 files passes** (7.61 seconds); production build passes (7.47 seconds). The 21 tests above the old remote count of 449 were already in recovered local work: MotionIntegration 13, HuskyTerrain 2, PolishTelemetryPersistence 4, HuskyProgressBridge 2. The replay regression was verified through the full browser run rather than a source-text test.

Build warning remains: approximately 1.84 MB minified JavaScript / 430 KB gzip in one chunk. It does not prevent this local playtest.

## Still broken / unfinished — Husky Premium Polish

### P0 — closed for this candidate

- Lennon: replay returning from the race erased the adventure. Fixed and full safe replay plus reward reload passed.
- Lennon: both complete route acceptance runs, six-math counts, race and reward persistence. Completed.

### P1 — premium visual and interaction work remains

- Ringo: author consistent three-quarter/back walk, turn, sled and celebration poses. Side-view sprites still rotate by mirroring and scale into a painted perspective. Reuse current complete-body sprites as preview assets; replace them with approved production animation including paw planting, shoulder/hip compression, ears and head follow-through. No detached body-part rig should return.
- Harrison: separate near/mid/far environment layers; provide foreground masks for cave and igloo entrances, trees, snowbanks, bridge rails and summit gate. Current panorama is a single plane and entrance interactions do not physically enter the igloo/cave.
- Lennon: use those masks and authored ground curves for elevation, contact-shadow deformation and richer terrain response. Current shadows/foot effects and paths improve contact but do not establish full physical depth. Race currently presents staged shots with fixed-camera framing rather than a continuous chase camera.
- McCartney: replace button-list approximations with spatial interactions for crystals, igloo objects, trail markers, frozen locks and sled checks. The bridge/lake/tree have live-world feedback, but many other actions still feel like prompts. Preserve accessibility alternatives and the six-required-math budget.
- Harrison + Ringo: integrate race sled perspective with character perspective; current reused sled cutouts and side poses need matching angled art for each course view. Add leaning/bracing/paddling frames and a shared finish celebration rather than leaving Bolt at the rear of the final shot.
- Harrison: add an igloo interior/entrance view and interactive lantern/map/nook layers; cave crystal layers and lighting; branch removal stages; summit ice-lock fragments; camp harness/strap layers. Reuse the current transparent landmark atlas for the overworld and the four race paintings as direction references.

### P2 — presentation and measurement

- Lennon: clamp the displayed Golden Husky progress to its target; older completed profiles can show values above 8/8. Saves/unlocks are not blocked.
- Lennon: distinguish playtest labels from the eventual child-facing release, review the large production bundle and narrow/mobile layouts. Current acceptance used a 1102 × 984 browser viewport.
- McCartney: measure a clean human adult fast-play run and a supervised child playtest; separate timing checkpoints from pauses. Decide whether micro-decision telemetry needs its own events.
- Ringo/Harrison: reward portraits currently float as UI illustrations. Add a grounded two-character celebration vignette and consistent sticker framing; reuse the existing canonical portrait/sticker artwork.

The principal remaining limitation is still the difference between a painted 2D preview and a premium character physically inhabiting the world. This candidate is suitable for João's playtest and feedback, not a claim that all premium art/game-feel work is finished.

## Evidence highlights

- `astra-bridge-exit-grounding.jpg`: repaired bridge/exit composition inspection.
- `astra-safe-final-bend.jpg`: sled placement and left-facing bend exit.
- `astra-safe-final-finish.jpg` and `astra-challenge-final-finish.jpg`: actual three-turn race finishes.
- `astra-safe-replay-fixed-reward.jpg`: reward after Play again regression run.
- `astra-safe-final-reward-reload.jpg` and `astra-challenge-final-reward-reload.jpg`: actual persisted reward screens after reload.
- `astra-safe-final-telemetry.json` and `astra-challenge-final-telemetry.json`: exact final route event logs and summaries.

## Remote verified

Publication branch: `integration/husky-premium-polish`. The final commit and exact-tree verification are reported in the handoff message after publication. No main merge, reset, or force push.
