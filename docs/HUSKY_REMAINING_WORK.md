# Reconciled Husky remaining work

> **Current implementation report / planning backlog**, 16 October 2026, baseline `f2ede75037c3466e7fddfe4556636863c80d94eb`. [Current-build index](HUSKY_CURRENT_BUILD.md). Owner labels follow existing roles, not evidence that tasks have been assigned or completed. This is the single active backlog; lists in historical reports are snapshots.

| Priority | Owner | Remaining task / acceptance boundary |
|---|---|---|
| P0 — next-phase acceptance | Lennon / Astra | Fresh complete safe and challenge runs on the combined build, including race→reading→quiz→album→replay and reload. Exercise losses/rematches in normal durable profiles; record exact SHA and attributable evidence. No consolidated final acceptance currently exists |
| P1 | Lennon + McCartney | Align stale live strings with delivered games and quiz gold: igloo bonus still says “Golden progress +1” and offers “Golden Husky progress” although its points do not unlock gold; other scene copy still describes replaced buttons/objects. Documentation-only audit leaves code untouched |
| P1 | Lennon + McCartney | Save edge cases: new finale/bone keys absent from generic breed-reset helper; write-quota errors, same-profile concurrent tabs, partial-interaction/replay/checkpoint matrix. Preserve per-profile isolation |
| P1 | McCartney + João | Supervised ages 8–11 playtest and clean adult fast-play timing; tune memory, strategy, spatial puzzles and brief race boards based on observations. Six baseline math problems is not a cap after retries |
| P1 | Lennon + McCartney | Extend/clarify telemetry: run ends before reading/quiz/album and ignores later optional event recording. Counters/timing must cover intended experience without reinterpreting old logs |
| P1 | Ringo | Production complete-body gait, turn, three-quarter/back, arrival, terrain and secondary motion; retain locked identity/taillessness. Do not re-enable exposed sliced rigs merely because API/package exists |
| P1 | Harrison + Lennon | Integrate/reconcile supplied depth pack against active panorama and landmarks; entrance occlusion, far/mid parallax, elevation, rail/paw alignment, true-alpha suitability. 14 assets/13 JSON present, only partial runtime use |
| P1 | Harrison + Ringo + Lennon | Matching perspective for sled/rider and richer terrain/race response, camera and finish celebration. Current race uses staged shots and separate boards |
| P1 | Harrison + McCartney + Lennon | Bespoke illustrated puzzle pieces and world reactions; separate igloo inspectables if desired; physical cave entry. Preserve delivered games, do not revert to prompt-only interactions |
| P1 | Harrison + Lennon | Distinct landmark state exports where premium atlas aliases hidden/revealed or blocked/cleared to one frame; lake/shore staging and contact remain production review work |
| P1 | Ringo + João | Review the exact gold-foil illustration and book presentation for approval; maintain character identity. Eleven other breed images, full album navigation/cover and Golden Kiki ending remain future scope, not implied by twelve empty slots |
| P1 | Lennon | Touch/mobile/Chromebook and keyboard/accessibility checks; production base-path asset loading. Existing root-relative DOM/CSS paths deserve Pages-specific verification. No fresh device/deployed acceptance established |
| P2 | Lennon | Bundle/public-asset audit, old files and redundant preloads, release labels. Current build workflow does not run Vitest; any workflow change requires a separate implementation task. No deletion/deployment change authorized by this docs audit |
| P2 | Harrison / Ringo / McCartney | Crystal sounds, footsteps/ambient/reward audio and coordinated effects; characterize what is placeholder versus authored |
| P2 / future phase | Team + João | Avatar builder, eleven additional worlds/breed sticker sets, full collection and Ultimate Corgi Quiz/Golden Kiki UI. Reusable logic is not shipped gameplay |

## Delivered items that must not remain marked wholly missing

- Varied mini-games: delivered across the map and race; custom production illustrations/world-space integration remain partial.
- Igloo interior: restored and enter/play/exit/revisit checked; physical doorway travel and inspectable props remain partial.
- Golden Bone: award and persistent collection delivered; broader inventory UI is not implied.
- Album: two-page twelve-slot Husky presentation delivered; eleven breed artworks and broader navigation remain pending.
- Breed finale: three paragraphs and three retry-friendly questions integrated; gold gated on completion, not eight exploration points.
- Wrong-answer recovery: worked explanations/new questions, Bolt loss and rematch delivered; normal-profile consolidated final race/reload acceptance remains pending.
- Complete-character walk/idle: replacement frames visible, not missing; production animation approval remains pending.
- Depth source package: all required files present, integration/visual acceptance remains partial.

No P0 label here asserts a newly observed gameplay failure. It denotes missing final acceptance before the next release decision. Deployment still targets the older integration branch; changing it is a separate user decision, not an action in this task.
