# Current Husky art, motion and depth status

> **Current implementation report**, baseline `85e801b0fd8bc45b9b9505f68bdb19ff7e5bab0e`, updated 16 October 2026. [Current-build index](HUSKY_CURRENT_BUILD.md). See [final game-feel report](HUSKY_FINAL_GAME_FEEL.md) for live inspection scope; production approval remains separate.

## Canonical direction versus live preview

Harrison's approved painterly Snowy Peaks direction and Ringo's locked character identities remain the design references. Kiki is the tailless tricolor corgi, with stable markings/proportions. Bolt is the larger gray/white Husky with a tail. [Canonical Husky specification](CANONICAL_HUSKY_CHARACTER.md) is authoritative for identity; its old natural-color/gold-border reward treatment is historical for the new foil experiment.

| Package | Present / live status | Approval and remaining work |
|---|---|---|
| Original character poses, Harrison paintings, preview references | Retained sources; some pixels reused by runtime atlases | Canonical direction does not automatically approve every derived/exported asset |
| `premium/snowy-panorama.png`, `snowy-props.png` | Live single exploration panorama and transparent landmark atlas via Landmarks/PremiumProps | Replacement preview assets; not certified final modular environment art |
| `premium/kiki-walk-v2.png`, `kiki-idle-v1.png` | Live eight complete-body walking frames and planted idle via CharacterMotion intact mode | Reference-derived replacement animation, not a new approved model sheet. Directional/terrain/secondary animation production work remains |
| `src/motion/*` and seven `assets/motion/*` rig atlases | Recovered articulated system present and preloaded; exploration constructs rig but hides body in intact mode | [Motion package report](KIKI_HUSKY_MOTION_SYSTEM.md) describes the rig API/package, not the visible exploration gait. Historical seam/part problems led to complete-frame replacement |
| Race characters / sled | KikiCharacter and HuskyCharacter use polish pose atlases, wooden-sled cutout, RaceTerrain paths, four `worlds/snowy-peaks/ip-re-*` paintings | Separate renderer from exploration; this pass adds modest terrain tilt/settle and speed-specific camera emphasis. Matching angled production poses and continuous race control remain pending |
| Igloo interior | `collectibles/igloo-interior.webp`, unchanged embedded image from polish `ip-ig-interior.svg`, shown behind DOM memory/bonus | Interior restored; no animated doorway occlusion or individual physical prop search implemented |
| Golden Bone | `collectibles/golden-bone.svg`, live award and album treasure row | Game-native vector reward; independent of breed gold |
| Husky foil | `collectibles/husky-gold-foil.png`, live square engraved monochrome foil with runtime caption; Master edition border/badge | Family requested gold images and retro album. Generated from canonical Husky reference; **no explicit final production approval recorded**. Not a new canonical fur palette for the world character |
| Older natural-color stickers / friendship portraits | Retained; some polish reward images still preload but the new DOM reward does not display them | Superseded active reward layout, preserve provenance. No claim all legacy files are removed from build output |
| Mini-game visuals | Authored cohesive SVG game pieces replace primary platform emoji; two painterly Snowy Peaks comparison PNGs; exact live bridge slots and lake feedback | New puzzle images are active previews, not canonical approval. Most games remain boards; richer world reactions and final audio remain pending |

`PremiumProps` aliases several states to identical frames: hidden/discovered/glowing igloo; blocked/cleared tree and snow pass; locked/open summit; hidden/revealed bone cache. Bridge repairing aliases broken, while repaired has a distinct frame. State logic is not proof of distinct before/after art.

The foil sticker intentionally differs from older “gold only on the border, natural-color dog” guidance. The family request authorizes exploration of the treatment; it does not establish approval of the exact generated result. The finale report's phrase “canonical gold-foil image” refers to reuse of that current preview image, **not** a newly granted canonical sign-off. Original prompt/provenance is preserved in [collectibles delivery](IGLOO_COLLECTIBLES_20261015.md).

## Depth package: present does not mean integrated

Filesystem audit confirms **all 14** `public/assets/worlds/snowy-peaks/dl-*.svg` assets and **all 13** `depth/*.json` files are present. The [package guide](SNOWY_PEAKS_PLAYABLE_DEPTH_SYSTEM.md) remains a design/technical proposal for integration, not proof of runtime behavior.

| Group | Files | Actual use at baseline |
|---|---|---|
| Live depth texture | `dl-ice-cracks` | Explicitly preloaded by HuskyScene, used below Kiki in LakeCrossing |
| Remaining 13 depth textures | `dl-branch-top`, `dl-bridge-rail-front`, `dl-cave-wall`, `dl-gust`, `dl-igloo-doorframe`, `dl-lake-edge`, `dl-mist`, `dl-race-pine`, `dl-rock`, `dl-snowbank`, `dl-snowfall`, `dl-spray-alpha`, `dl-trunk` | Listed in SnowyDepth helper, but `preloadOccluders` / `addOccluder` have no live scene callers. Do not label these missing or fully integrated |
| Active metadata | `bridge.json`, `lake.json` | Imported by HuskyTerrain; fitted bridge path and scale, lake anchors/restore path. Bridge deck Y values are adapted to current preview art |
| Imported but not consumed by live traversal | `ice-cave.json`, `igloo.json`, `snow-pass.json`, `summit.json` | Exported in TERRAIN_PATHS; no corresponding runtime path consumption found |
| Present, not imported by live path helper | `trailhead.json`, `forest.json`, `fallen-tree.json`, `bone-cache.json`, `race-camp.json`, `race.json`, `finish.json` | Pending integration/reconciliation; race uses RaceTerrain instead |

Actual foreground occlusion comes from [ClippedForeground](../src/visuals/ClippedForeground.ts) over the panorama's near snow and the premium bridge front edge, not from complete adoption of all supplied `dl-*` layers. [SnowyWorld](../src/visuals/SnowyWorld.ts) uses one scroll-factor-1 painting plus clipping/particles; authored independent far/mid parallax is not live. An igloo interior screen is not evidence of the proposed path-through-doorframe transition.

Earlier bridge/lake route screenshots show partial contact/occlusion results. They do not individually validate all 14 assets, all JSON anchors, every terrain state or final-build motion. No new screenshot inspection occurred in this audit. See [evidence boundaries](HUSKY_DELIVERY_EVIDENCE.md).

## Inventory and production handoff

[ASSET_INVENTORY.csv](visual-upgrade/ASSET_INVENTORY.csv) now lists **all 285 tracked public asset files**, including depth metadata, premium replacements and collectibles, with baseline, presence, runtime role, reference candidates and approval boundary. Filename matches can include same-name adapters; the runtime-status column resolves known live paths. Its classifications come from static source references; “preloaded” is not “visible” and “retained” is not safe-to-delete approval. The [prior 134-row inventory](visual-upgrade/ASSET_INVENTORY_PRE_RECONCILIATION.csv) is preserved as historical provenance and is not exhaustive for this build.

Pending production work is consolidated in [remaining work](HUSKY_REMAINING_WORK.md). Do not restart old “missing igloo/album/quiz” tasks without reading the delivered-versus-partial distinctions there.

## Final game-feel additions

`public/assets/puzzles/snowy-differences-original.png` and `snowy-differences-changed.png` are integrated by PlayfulGames, visually inspected and played in both routes. [Provenance](HUSKY_FINAL_GAME_FEEL.md#art-provenance). Existing Kiki/Bolt canonical references and Husky foil image were not replaced. `GameArt.ts` supplies matching authored vector pieces rather than a third-party clip-art pack.

Exploration still renders the complete-body walk/idle frames. Scale-aware stride, idle breathing, orientation timing and camera adjustments improve presentation but do not supply new independent ear/head/blink animation. The album now adds reusable cover/page/peel/press presentation around the same foil artwork. It does not establish family approval of that artwork. All 14 depth images and 13 JSON sources remain present; no new blanket depth integration claim is made.
