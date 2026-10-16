# Current Husky gameplay and reward rules

> **Current specification**, audited against `f2ede75037c3466e7fddfe4556636863c80d94eb` on 16 October 2026. [Current-build index](HUSKY_CURRENT_BUILD.md). The [original eight-point specification](https://github.com/jmzauith/Kiki-dog/blob/f2ede75037c3466e7fddfe4556636863c80d94eb/docs/HUSKY_REWARD_RULES.md) is historical, not the live gold rule.

## Adventure and required math

The live adventure uses [HuskyAdventure](../src/systems/HuskyAdventure.ts), [HuskyScene](../src/scenes/HuskyScene.ts) and [RaceScene](../src/scenes/RaceScene.ts). Always-required reward encounters are Broken Bridge, Forest and Summit Gate; safe adds Frozen Lake and Fallen Tree, challenge adds Ice Cave. The live graph also sequences trailhead, Snow Pass and race access. Secrets are optional and cannot replace required progression.

A clean, uninterrupted run asks three exploration math problems (bridge, lake **or** cave, summit) and three successful race math stages: **six baseline math problems**. Replacement questions, failed turns or interrupted encounters increase presentations. The three breed-finale questions are reading comprehension, not additional math. Optional igloo bonus is now tic-tac-toe, not hard math.

## Wrong math and race recovery

First wrong answer shows retry text/counting help with one attempt left. The second shows the worked multiplication answer as repeated addition; acknowledging it leads to a different question. The world encounter stays incomplete until a correct answer, while earlier adventure progress is retained. Reload does not preserve the exact question or wrong-attempt count.

The race uses five spaces and competitive Bolt (`RaceProgressState(5, true)`), unlike the generic model's forgiving default. Correct Steady gives Kiki +1, correct Turbo +2; one wrong then correct still earns the chosen movement. After the first two successful stages Bolt normally moves +1. Three successful stages lead to the physical final-sprint beat, filling remaining Kiki distance.

Two misses forfeit one attempted turn: Kiki gets no movement, Bolt advances +1, and the same pace receives a replacement question if Bolt has not won. Completed race mini-game beats stay complete. Bolt reaching five spaces causes defeat; there is no free sprint, new race completion or new sticker on that loss. Earlier earned collectibles are not revoked by losing a later race.

**Race again** clears the race checkpoint and restarts positions, successful-stage count, attempts and turbo count. It retains the mountain adventure, player identity, earlier rewards, quiz/bone collection and completed mini-game IDs in the run log; it is not a full stage replay. Race totals stored on victory count attempted turns, including forfeits in that race; successful stages remain three. Checkpoints persist positions, successful stages, attempts and turbos. Old checkpoints without attempts fall back to successful turns. See [persistence](PLAYER_PROFILES_AVATARS_AND_SAVES.md) for reload boundaries.

## Normal and Golden Husky

Normal Husky requires route-required adventure completion plus a race win. The adventure sticker flag/event is set before the reading finale; it does not require secrets or quiz mastery. The current UI then guides an unfinished reader through the finale before the reward choices.

**Golden Husky requires the completed adventure/race and all three correct live-finale answers, including retries.** The fixed questions are sled work, double coat and Siberian origin. Each correct answer saves immediately. Wrong answers explain and retry; first-try perfection is not required. A previously completed finale is not forced again after reload or Play again.

[HuskyGraduation](../src/systems/HuskyGraduation.ts) stores the three correct IDs. [HuskyProgressBridge](../src/systems/HuskyProgressBridge.ts) records quiz mastery 1 after they are all present. [HuskyRewards](../src/systems/HuskyRewards.ts) selects `goldenUnlock: "quiz"`; [BreedRewards](../src/systems/BreedRewards.ts) still requires normal eligibility. Exploration points and the old threshold value remain in reusable data but **eight points do not unlock Husky gold**. Existing points-based Husky gold flags are re-derived under the quiz rule; the collection mirror is corrected accordingly. No auto-award of quiz answers is made.

## Collectibles, album and replay

Bone hunt completion grants `husky:golden-bone:v1 = earned`; the reward screen also grants it for a saved completed snow-cache encounter. It is independent of the three quiz answers and survives Play again.

After a newly completed finale the album unfolds and the square gold-foil Husky sticker settles into slot 001. Reduced-motion mode disables those animations. The album has two pages and twelve breed slots; only Husky is populated by this UI. Both normal and master-edition representations reuse the same foil image; gold has the Master badge/border. This is not twelve delivered breed illustrations or the playable Golden Kiki ending.

Keep exploring retains the completed run and re-enables optional exploration; completed igloo revisits replay memory without duplicate completion rewards. Play again resets the adventure, race checkpoint and run interaction/telemetry state, while keeping reward/collection data, finale answers and Golden Bone. It does not reset player identity. The reusable `recordReplay()` API exists but the live scene does not call it: do not promise a newly accrued replay mastery point.

The twelve-normal-sticker / Ultimate Corgi Quiz / Golden Kiki system remains a separate future endgame. [Registry contract](BREED_REGISTRY_AND_GOLDEN_KIKI.md) must not be confused with the live Husky finale.
