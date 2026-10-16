# Kiki Dog Adventure

> **Start here: [Husky current-build documentation](docs/HUSKY_CURRENT_BUILD.md).** Current implementation report, audited 16 October 2026. It separates the latest development build, deployed build, existing validation and remaining work.

Phaser 4 + TypeScript adventure with Snowy Peaks exploration, two routes, puzzles, a Bolt sled race, breed reading/quiz and a collectible sticker album.

The audited development baseline is `feature/husky-playful-minigames` at `f2ede75037c3466e7fddfe4556636863c80d94eb`. Pages still deploys `integration/husky-premium-polish` at `6411c6fa36ff827465be15aeef96119237990378`; the newer features are not in that recorded deployment. Documentation-only commits do not change this gameplay baseline.

- [Rules and rewards](docs/HUSKY_REWARD_RULES.md)
- [Delivery and validation evidence](docs/HUSKY_DELIVERY_EVIDENCE.md)
- [Art and depth integration](docs/HUSKY_ART_AND_DEPTH_STATUS.md)
- [Prioritized remaining work](docs/HUSKY_REMAINING_WORK.md)
- [Document classification and historical records](docs/HUSKY_DOCUMENT_REGISTER.md)

There is no consolidated fresh full-route acceptance report for the final combined development build. Historical screenshots, test counts and timings apply only to the builds identified in the evidence ledger.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The HTML v6 game remains a design/reference build. New gameplay development happens in Phaser/TypeScript.
