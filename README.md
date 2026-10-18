# Kiki Dog Adventure

> **Start here: [Husky current-build documentation](docs/HUSKY_CURRENT_BUILD.md).** Current implementation report, updated 17 October 2026. It separates the latest development build, deployed build, existing validation and remaining work.

Phaser 4 + TypeScript adventure with Snowy Peaks exploration, two routes, puzzles, a Bolt sled race, breed reading/quiz and a collectible sticker album.

The latest candidate is `feature/husky-final-refinement` at `7a9f741fe705f919f06c29e291718c6c443aa892` (frozen gameplay SHA; following documentation commits do not change code). See the [refinement report and Roady handoff](docs/HUSKY_FINAL_REFINEMENT.md). It is ready for independent QA and family review, not certified as the final production template. Pages still targets the older integration branch; deployment and main are unchanged.

- [Rules and rewards](docs/HUSKY_REWARD_RULES.md)
- [Delivery and validation evidence](docs/HUSKY_DELIVERY_EVIDENCE.md)
- [Art and depth integration](docs/HUSKY_ART_AND_DEPTH_STATUS.md)
- [Prioritized remaining work](docs/HUSKY_REMAINING_WORK.md)
- [Document classification and historical records](docs/HUSKY_DOCUMENT_REGISTER.md)

Safe and Challenge were completed during this pass, with focused follow-up checks after the last small fixes. The report states exact build scope; independent QA and family review remain pending. Historical evidence applies only to its identified build.

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
