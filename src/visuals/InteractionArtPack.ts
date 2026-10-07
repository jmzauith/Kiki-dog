import Phaser from "phaser";

/**
 * InteractionArtPack — preload helper for the 12-node Husky adventure's
 * environmental interactions.
 *
 * ART ONLY. Loads the 37 interaction SVGs from
 * `public/assets/worlds/husky/interactions/` and assigns stable texture keys.
 * No gameplay, no progression, no scene changes — the adventure scene
 * (built by the integrator) calls `preloadInteractionArt(this)` in preload()
 * and swaps states per docs/HUSKY_INTERACTION_ART_SPEC.md.
 *
 * Note: the ambient map pack (`public/assets/worlds/husky/`) holds
 * non-interactive scenery versions. Prefer this pack for anything whose
 * state changes on success.
 */

const DIR = "assets/worlds/husky/interactions";

/** Texture key per asset (stable contract for the adventure scene). */
export const INTERACTION_ART_KEYS = {
  // broken bridge
  bridgeDamaged: "ix-bridge-damaged",
  bridgePlank: "ix-bridge-plank",
  bridgeHammer: "ix-bridge-hammer",
  bridgeRepaired: "ix-bridge-repaired",
  repairSparkle: "ix-repair-sparkle",
  repairDebris: "ix-repair-debris",
  // frozen lake
  iceUnsafe: "ix-ice-unsafe",
  iceSafePath: "ix-ice-safe-path",
  iceCrack1: "ix-ice-crack-1",
  iceCrack2: "ix-ice-crack-2",
  iceGlint: "ix-ice-glint",
  // fallen tree
  treeFallen: "ix-tree-fallen",
  treeCleared: "ix-tree-cleared",
  logSegment: "ix-log-segment",
  snowDebris: "ix-snow-debris",
  // ice cave
  caveEntrance: "ix-cave-entrance",
  caveCrystals: "ix-cave-crystals",
  caveMouthInner: "ix-cave-mouth-inner",
  // snow pass
  passArch: "ix-pass-arch",
  passWind: "ix-pass-wind",
  passCleared: "ix-pass-cleared",
  // summit gate
  gateLocked: "ix-gate-locked",
  gateOpening: "ix-gate-opening",
  gateOpen: "ix-gate-open",
  summitPennants: "ix-summit-pennants",
  // secret igloo
  iglooHidden: "ix-igloo-hidden",
  iglooDiscovered: "ix-igloo-discovered",
  iglooGlow: "ix-igloo-glow",
  secretSparkle: "ix-secret-sparkle",
  // bone cache
  cacheHidden: "ix-cache-hidden",
  cachePartial: "ix-cache-partial",
  cacheOpen: "ix-cache-open",
  // transition FX
  fxSparkleBurst: "ix-fx-sparkle-burst",
  fxSnowPuff: "ix-fx-snow-puff",
  fxIceShimmer: "ix-fx-ice-shimmer",
  fxSuccessGlow: "ix-fx-success-glow",
  fxDiscoveryBurst: "ix-fx-discovery-burst",
} as const;

export type InteractionArtKey =
  (typeof INTERACTION_ART_KEYS)[keyof typeof INTERACTION_ART_KEYS];

const DEFS: Array<[InteractionArtKey, string, number, number]> = [
  [INTERACTION_ART_KEYS.bridgeDamaged, "bridge-damaged.svg", 400, 200],
  [INTERACTION_ART_KEYS.bridgePlank, "bridge-plank.svg", 120, 80],
  [INTERACTION_ART_KEYS.bridgeHammer, "bridge-hammer.svg", 120, 120],
  [INTERACTION_ART_KEYS.bridgeRepaired, "bridge-repaired.svg", 400, 200],
  [INTERACTION_ART_KEYS.repairSparkle, "repair-sparkle.svg", 120, 120],
  [INTERACTION_ART_KEYS.repairDebris, "repair-debris.svg", 140, 100],
  [INTERACTION_ART_KEYS.iceUnsafe, "ice-unsafe.svg", 320, 140],
  [INTERACTION_ART_KEYS.iceSafePath, "ice-safe-path.svg", 400, 120],
  [INTERACTION_ART_KEYS.iceCrack1, "ice-crack-1.svg", 200, 120],
  [INTERACTION_ART_KEYS.iceCrack2, "ice-crack-2.svg", 200, 120],
  [INTERACTION_ART_KEYS.iceGlint, "ice-glint.svg", 100, 100],
  [INTERACTION_ART_KEYS.treeFallen, "tree-fallen.svg", 420, 200],
  [INTERACTION_ART_KEYS.treeCleared, "tree-cleared.svg", 420, 200],
  [INTERACTION_ART_KEYS.logSegment, "log-segment.svg", 200, 90],
  [INTERACTION_ART_KEYS.snowDebris, "snow-debris.svg", 160, 120],
  [INTERACTION_ART_KEYS.caveEntrance, "cave-entrance.svg", 360, 260],
  [INTERACTION_ART_KEYS.caveCrystals, "cave-crystals.svg", 220, 160],
  [INTERACTION_ART_KEYS.caveMouthInner, "cave-mouth-inner.svg", 360, 260],
  [INTERACTION_ART_KEYS.passArch, "pass-arch.svg", 380, 260],
  [INTERACTION_ART_KEYS.passWind, "pass-wind.svg", 320, 120],
  [INTERACTION_ART_KEYS.passCleared, "pass-cleared.svg", 380, 260],
  [INTERACTION_ART_KEYS.gateLocked, "gate-locked.svg", 360, 280],
  [INTERACTION_ART_KEYS.gateOpening, "gate-opening.svg", 360, 280],
  [INTERACTION_ART_KEYS.gateOpen, "gate-open.svg", 360, 280],
  [INTERACTION_ART_KEYS.summitPennants, "summit-pennants.svg", 200, 160],
  [INTERACTION_ART_KEYS.iglooHidden, "igloo-hidden.svg", 280, 180],
  [INTERACTION_ART_KEYS.iglooDiscovered, "igloo-discovered.svg", 280, 180],
  [INTERACTION_ART_KEYS.iglooGlow, "igloo-glow.svg", 120, 120],
  [INTERACTION_ART_KEYS.secretSparkle, "secret-sparkle.svg", 140, 140],
  [INTERACTION_ART_KEYS.cacheHidden, "cache-hidden.svg", 240, 150],
  [INTERACTION_ART_KEYS.cachePartial, "cache-partial.svg", 240, 150],
  [INTERACTION_ART_KEYS.cacheOpen, "cache-open.svg", 240, 150],
  [INTERACTION_ART_KEYS.fxSparkleBurst, "fx-sparkle-burst.svg", 200, 200],
  [INTERACTION_ART_KEYS.fxSnowPuff, "fx-snow-puff.svg", 200, 160],
  [INTERACTION_ART_KEYS.fxIceShimmer, "fx-ice-shimmer.svg", 200, 120],
  [INTERACTION_ART_KEYS.fxSuccessGlow, "fx-success-glow.svg", 200, 200],
  [INTERACTION_ART_KEYS.fxDiscoveryBurst, "fx-discovery-burst.svg", 220, 220],
];

/** Load every interaction asset. Call from the adventure scene's preload(). */
export function preloadInteractionArt(scene: Phaser.Scene): void {
  for (const [key, file, w, h] of DEFS) {
    scene.load.svg(key, `${DIR}/${file}`, { width: w, height: h });
  }
}
