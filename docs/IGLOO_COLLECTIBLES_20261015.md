> **Documentation status — current implementation report; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). 3228f9d: focused igloo, treasure, album and reload checks. Full routes belong to the earlier puzzle delivery; recovery checks were focused. Golden eligibility changed afterward.

# Igloo and gold-foil collectibles — 15 October 2026

## Implemented
- Clicking the revealed igloo enters the original painted interior before opening the memory chest. Kiki is inside; the six-pair memory game and optional Bolt strategy game run over this room. An explicit exit returns to Snowy Peaks. Completed igloos remain visitable for memory play without awarding duplicate progress.
- Completing the three-bone scent hunt awards a Golden Bone, stored separately in the active player’s collection. Existing completed bone hunts receive the collectible on the reward screen. Replays do not erase it.
- Husky rewards now use a square engraved gold-foil sticker and a two-page, twelve-slot album. Golden mastery adds a distinct Master edition border/badge. Other breed slots remain uncollected; their final sticker illustrations are not created by this change.

## Browser validation
Used the separate Games Challenge 8-11 QA profile, not the children’s saves. Entered the igloo, completed all six memory pairs, packed the badge, won Bolt’s bonus tic-tac-toe, and exited to the world. Completed the bone hunt using visible scent clues, received the Golden Bone award, and reloaded. The album retained the bone, Husky sticker, mastery edition and two discoveries. Re-entered the completed igloo after reload. Inspected the reward and album at 1280×720.

Screenshots in docs/qa/playful-games: igloo-interior-restored.jpg, golden-bone-award.jpg, gold-foil-reward.jpg, gold-sticker-album.jpg.

## Validation
486 tests pass across 32 files. TypeScript and production build pass. Vite retains its existing large bundle warning. This change does not alter race or math rules; full route validation is recorded in the earlier mini-game and math recovery reports.

## Art provenance
- public/assets/collectibles/igloo-interior.webp: original embedded image extracted unchanged from public/assets/polish/ip-ig-interior.svg.
- public/assets/collectibles/golden-bone.svg: game-native vector collectible.
- public/assets/collectibles/husky-gold-foil.png: generated with the built-in image generation tool, using the embedded canonical Husky from public/assets/polish/husky-sticker-final.svg as reference. No external image downloads.

Final image prompt:
> Use case: style-transfer. Asset type: square flat collectible dog-breed sticker for a children's adventure game, inspired by premium 1980s/1990s foil sticker albums. Reference image is the canonical friendly Husky: preserve its face markings, anatomy, expression and standing pose. Create ONE perfectly square sticker image filling the entire canvas, straight-on orthographic, no outer scene or mockup, no hands, no tilted perspective. Luxurious warm metallic gold foil illustration of this exact Husky, embossed fine engraved fur detail, warm champagne highlights and antique gold shadows, readable friendly eyes. Behind the dog a subtle engraved Snowy Peaks mountain landscape in gold, fine starburst foil texture. Crisp rectangular double-line ornamental gold border, tiny four-point corner stars. Dog fully inside border, all paws visible, centered and large. Entire image sophisticated warm gold monochrome like a rare collectible foil sticker, no white circle or die-cut silhouette. No text, no letters, no numbers, no logos, no watermark; labels will be added separately by the game. Square 1:1 composition.
