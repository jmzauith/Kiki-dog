import Phaser from "phaser";

/**
 * GoldenRetrieverArtPack — preload helper for the Golden Bay world
 * (second breed world: Golden Retriever).
 *
 * CONCEPT / PRE-PRODUCTION. Loads the 51 Golden Bay SVGs from
 * `public/assets/worlds/golden-retriever/` and assigns stable texture keys.
 * No gameplay, no scene changes — the future Golden adventure scene calls
 * `preloadGoldenRetrieverArt(this)` in preload().
 *
 * World concept: docs/GOLDEN_RETRIEVER_WORLD_VISUAL_SPEC.md
 * Spatial contract: docs/GOLDEN_RETRIEVER_WORLD_LAYOUT.md
 */

const DIR = "assets/worlds/golden-retriever";

/** Texture key per asset (stable contract for the future Golden scene). */
export const GOLDEN_ART_KEYS = {
  // terrain & water
  meadowStrip: "golden-meadow-strip",
  sandStrip: "golden-sand-strip",
  pathStrip: "golden-path-strip",
  waterStrip: "golden-water-strip",
  waterShore: "golden-water-shore",
  lilyPad: "golden-lily-pad",
  rippleRing: "golden-ripple-ring",
  // trees & ground cover
  oakTree: "golden-oak-tree",
  willowTree: "golden-willow-tree",
  sapling: "golden-sapling",
  bushRound: "golden-bush-round",
  grassTuft: "golden-grass-tuft",
  flowerRed: "golden-flower-red",
  flowerYellow: "golden-flower-yellow",
  flowerWhite: "golden-flower-white",
  sunflower: "golden-sunflower",
  reedsCluster: "golden-reeds-cluster",
  cattails: "golden-cattails",
  // dock & crossings
  dockPlanks: "golden-dock-planks",
  dockPost: "golden-dock-post",
  dockDamaged: "golden-dock-damaged",
  dockRepaired: "golden-dock-repaired",
  divePlatform: "golden-dive-platform",
  footbridge: "golden-footbridge",
  streamStones: "golden-stream-stones",
  logFloating: "golden-log-floating",
  logPile: "golden-log-pile",
  // buildings
  boathouseClosed: "golden-boathouse-closed",
  boathouseOpen: "golden-boathouse-open",
  waterwheel: "golden-waterwheel",
  // picnic
  picnicBlanket: "golden-picnic-blanket",
  picnicBasket: "golden-picnic-basket",
  basketHidden: "golden-basket-hidden",
  basketOpen: "golden-basket-open",
  // rocks, signs, flags
  rockWarm: "golden-rock-warm",
  pebbles: "golden-pebbles",
  signGoldenBay: "golden-sign-golden-bay",
  signTrail: "golden-sign-trail",
  signRegatta: "golden-sign-regatta",
  buoy: "golden-buoy",
  pennantFestival: "golden-pennant-festival",
  rescueRing: "golden-rescue-ring",
  finishArchFloat: "golden-finish-arch-float",
  // toys
  toyTennisBall: "golden-toy-tennis-ball",
  toyRope: "golden-toy-rope",
  toyStick: "golden-toy-stick",
  // hidden area
  willowCurtain: "golden-willow-curtain",
  goldenBall: "golden-golden-ball",
  // FX
  splash: "golden-splash",
  sunGlint: "golden-sun-glint",
  pollenPuff: "golden-pollen-puff",
} as const;

export type GoldenArtKey =
  (typeof GOLDEN_ART_KEYS)[keyof typeof GOLDEN_ART_KEYS];

const DEFS: Array<[GoldenArtKey, string, number, number]> = [
  [GOLDEN_ART_KEYS.meadowStrip, "meadow-strip.svg", 800, 200],
  [GOLDEN_ART_KEYS.sandStrip, "sand-strip.svg", 800, 160],
  [GOLDEN_ART_KEYS.pathStrip, "path-strip.svg", 800, 140],
  [GOLDEN_ART_KEYS.waterStrip, "water-strip.svg", 800, 220],
  [GOLDEN_ART_KEYS.waterShore, "water-shore.svg", 800, 120],
  [GOLDEN_ART_KEYS.lilyPad, "lily-pad.svg", 160, 100],
  [GOLDEN_ART_KEYS.rippleRing, "ripple-ring.svg", 200, 80],
  [GOLDEN_ART_KEYS.oakTree, "oak-tree.svg", 300, 380],
  [GOLDEN_ART_KEYS.willowTree, "willow-tree.svg", 360, 400],
  [GOLDEN_ART_KEYS.sapling, "sapling.svg", 140, 180],
  [GOLDEN_ART_KEYS.bushRound, "bush-round.svg", 200, 140],
  [GOLDEN_ART_KEYS.grassTuft, "grass-tuft.svg", 120, 90],
  [GOLDEN_ART_KEYS.flowerRed, "flower-red.svg", 80, 110],
  [GOLDEN_ART_KEYS.flowerYellow, "flower-yellow.svg", 80, 110],
  [GOLDEN_ART_KEYS.flowerWhite, "flower-white.svg", 80, 110],
  [GOLDEN_ART_KEYS.sunflower, "sunflower.svg", 100, 150],
  [GOLDEN_ART_KEYS.reedsCluster, "reeds-cluster.svg", 200, 160],
  [GOLDEN_ART_KEYS.cattails, "cattails.svg", 160, 190],
  [GOLDEN_ART_KEYS.dockPlanks, "dock-planks.svg", 400, 120],
  [GOLDEN_ART_KEYS.dockPost, "dock-post.svg", 80, 200],
  [GOLDEN_ART_KEYS.dockDamaged, "dock-damaged.svg", 400, 160],
  [GOLDEN_ART_KEYS.dockRepaired, "dock-repaired.svg", 400, 160],
  [GOLDEN_ART_KEYS.divePlatform, "dive-platform.svg", 260, 180],
  [GOLDEN_ART_KEYS.footbridge, "footbridge.svg", 380, 180],
  [GOLDEN_ART_KEYS.streamStones, "stream-stones.svg", 400, 120],
  [GOLDEN_ART_KEYS.logFloating, "log-floating.svg", 240, 110],
  [GOLDEN_ART_KEYS.logPile, "log-pile.svg", 320, 180],
  [GOLDEN_ART_KEYS.boathouseClosed, "boathouse-closed.svg", 340, 260],
  [GOLDEN_ART_KEYS.boathouseOpen, "boathouse-open.svg", 340, 260],
  [GOLDEN_ART_KEYS.waterwheel, "waterwheel.svg", 220, 240],
  [GOLDEN_ART_KEYS.picnicBlanket, "picnic-blanket.svg", 280, 160],
  [GOLDEN_ART_KEYS.picnicBasket, "picnic-basket.svg", 180, 160],
  [GOLDEN_ART_KEYS.basketHidden, "basket-hidden.svg", 200, 130],
  [GOLDEN_ART_KEYS.basketOpen, "basket-open.svg", 200, 150],
  [GOLDEN_ART_KEYS.rockWarm, "rock-warm.svg", 220, 130],
  [GOLDEN_ART_KEYS.pebbles, "pebbles.svg", 200, 70],
  [GOLDEN_ART_KEYS.signGoldenBay, "sign-golden-bay.svg", 460, 240],
  [GOLDEN_ART_KEYS.signTrail, "sign-trail.svg", 160, 200],
  [GOLDEN_ART_KEYS.signRegatta, "sign-regatta.svg", 200, 220],
  [GOLDEN_ART_KEYS.buoy, "buoy.svg", 120, 170],
  [GOLDEN_ART_KEYS.pennantFestival, "pennant-festival.svg", 400, 130],
  [GOLDEN_ART_KEYS.rescueRing, "rescue-ring.svg", 160, 160],
  [GOLDEN_ART_KEYS.finishArchFloat, "finish-arch-float.svg", 460, 260],
  [GOLDEN_ART_KEYS.toyTennisBall, "toy-tennis-ball.svg", 100, 100],
  [GOLDEN_ART_KEYS.toyRope, "toy-rope.svg", 140, 90],
  [GOLDEN_ART_KEYS.toyStick, "toy-stick.svg", 160, 70],
  [GOLDEN_ART_KEYS.willowCurtain, "willow-curtain.svg", 320, 300],
  [GOLDEN_ART_KEYS.goldenBall, "golden-ball.svg", 160, 160],
  [GOLDEN_ART_KEYS.splash, "splash.svg", 200, 160],
  [GOLDEN_ART_KEYS.sunGlint, "sun-glint.svg", 120, 120],
  [GOLDEN_ART_KEYS.pollenPuff, "pollen-puff.svg", 160, 120],
];

/** Load every Golden Bay asset. Call from the future Golden scene's preload(). */
export function preloadGoldenRetrieverArt(scene: Phaser.Scene): void {
  for (const [key, file, w, h] of DEFS) {
    scene.load.svg(key, `${DIR}/${file}`, { width: w, height: h });
  }
}
