> **Historical documentation audit, before the final game-feel pass.** Its no-new-testing statements apply only to that audit. Superseded by [current-build index](HUSKY_CURRENT_BUILD.md) and [final game-feel report](HUSKY_FINAL_GAME_FEEL.md).

# Husky current-build index

> **Current implementation report / documentation entry point. Audited 16 October 2026 (America/Chicago).** This index describes the development baseline below. It is not a new gameplay acceptance report. No tests, game sessions, save operations or deployments were run for this documentation audit.

## Baseline and deployment

| Identity | Audited value |
|---|---|
| Active development branch | `feature/husky-playful-minigames` |
| Development gameplay SHA | [`f2ede75037c3466e7fddfe4556636863c80d94eb`](https://github.com/jmzauith/Kiki-dog/commit/f2ede75037c3466e7fddfe4556636863c80d94eb) |
| Last gameplay delivery | 15 October 2026, 20:50:58 America/Chicago (GitHub UTC timestamp is 16 October 01:50:58) |
| Local equivalent HEAD before this docs change | `2b5b6939391bbcb8e9680ffba40c308f06b40fa2` |
| Exact shared local/remote file tree | `0f7eac0d632f86f28152624fab86ff6af50078e6` — checked against GitHub Git commit metadata and local Git |
| Integration branch | `integration/husky-premium-polish` at `6411c6fa36ff827465be15aeef96119237990378` |
| Comparison at audit | Development is **4 commits ahead, 0 behind**, merge base is the integration SHA |
| Pages source and latest successful deployment run | Integration branch; [run 38778839637](https://github.com/jmzauith/Kiki-dog/actions/runs/38778839637) reports success at `6411c6f` |
| Workflow | [deploy.yml](../.github/workflows/deploy.yml) triggers on integration pushes and explicitly checks out integration, including manual dispatch |

The latest development features below are **not deployed by that workflow**. The latest recorded successful Pages deployment is the older integration build; served browser bytes were not independently inspected in this docs-only audit. A localhost URL does not identify a commit by itself. No deployment configuration was changed. GitHub publication used connector-created commits, explaining different local and remote SHAs despite identical trees. Local worktree was clean; no reset, pull, rebase or branch replacement was performed. A later documentation-only commit on the same branch does not change this gameplay baseline.

## Read these first

- [Current gameplay and reward rules](HUSKY_REWARD_RULES.md)
- [Live finale versus reusable quiz engine](BREED_FACTS_QUIZ_SYSTEM.md)
- [Profile-scoped durable storage and replay contract](PLAYER_PROFILES_AVATARS_AND_SAVES.md)
- [Active art, motion, depth and complete asset inventory](HUSKY_ART_AND_DEPTH_STATUS.md)
- [Family requests, exact deliveries and evidence](HUSKY_DELIVERY_EVIDENCE.md)
- [One remaining-work list](HUSKY_REMAINING_WORK.md)
- [Document classification register](HUSKY_DOCUMENT_REGISTER.md) — every repository Markdown document and asset inventory, including superseded proposals/reports

Current source behavior wins over old design prose. Current specifications describe this audited implementation; historical delivery reports remain evidence for their own builds, not promises about today's complete experience.

## Implemented and integrated

Nickname creation/selection and isolated player saves; continuous Snowy Peaks exploration; repaired bridge traversal; safe route via lake/tree or challenge route via cave; advice choices and optional igloo/bone discovery; summit, Race Camp and Bolt race; wrong-answer recovery and competitive loss/rematch; breed reading and quiz; gold-foil reward/album and Golden Bone persistence are wired into the live Husky flow.

| Area | Actual playable implementation | Important boundary |
|---|---|---|
| Trailhead / forest | Six-tile trail rotation; five differences; route/advice choices | Boards use CSS/SVG/symbols; dialogue remains text choices |
| Bridge | Math then three size-matched plank placements, live repair and crossing | Ground/rail fit is adapted preview geometry, not acceptance of every frame |
| Safe route | Lake safe-path puzzle then world crossing; six overlapping branches removed in order | Not the old five-tap tree; bespoke production pieces still pending |
| Challenge | Crystal sequence rounds of 3, 4, 5 plus cave math | Crystal audio and physical cave-entry staging remain incomplete |
| Snow Pass / summit | Growing marker-memory sequences; nine connected lantern puzzle; summit math | Some legacy copy still describes older interactions |
| Igloo | Painted interior, six-pair memory, optional Bolt tic-tac-toe, explicit exit; revisit memory | Interior is a DOM scene transition, not animated travel through the doorway; separate inspectable lantern/map/nook art is not wired |
| Bone cache | Three-bone scent-distance hunt; permanent Golden Bone award | Gold collectible is separate from breed sticker eligibility |
| Camp / race | Bolt tic-tac-toe, optional equipment matching; launch timing, slalom, paddling, finish stars | Race boards do not continuously steer the physical sled; four staged race paintings |
| Finish | Favorite moment, three reading paragraphs, three fixed questions, opening album and sticker placement | Finale is not the random first-attempt-scored generic quiz; only Husky art is populated in twelve slots |

## Evidence and acceptance boundary

The [delivery ledger](HUSKY_DELIVERY_EVIDENCE.md) gives exact SHAs, report links and screenshot/log links. Full safe/challenge playthroughs exist after the **puzzle pass (`d440ea1`)**. Later math recovery (`9b5d451`), igloo/collectibles (`3228f9d`) and finale (`f2ede75`) have focused checks. **There is no consolidated fresh two-route acceptance report for the final combined `f2ede75` build.** The next phase must not treat this index, the old “ready” handoffs, or successful unit tests as that acceptance.

Latest recorded automated result: **490 tests / 33 files, TypeScript and production build passed** in the 15 October finale delivery. This was not rerun for documentation. Earlier counts of 106/383/426/449/455/470/480/484/486 belong to their respective snapshots. Existing Vite bundle warning remains. Current workflow inspection shows build.yml installs and builds; it does **not** run Vitest despite older QA prose claiming that it did.

No current adult fast-play benchmark, child-duration measurement, touch/Chromebook acceptance, exhaustive depth integration acceptance, or production-art sign-off is established. Historic QA timings include inspection/tool overhead. Current telemetry ends before breed reading/quiz/album, so it cannot measure that complete final experience.
