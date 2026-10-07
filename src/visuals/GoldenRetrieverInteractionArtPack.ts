import Phaser from "phaser";

/**
 * GoldenRetrieverInteractionArtPack — preload helper for the Golden Bay
 * interaction states and the Rescue Relay final challenge.
 *
 * CONCEPT / PRE-PRODUCTION. Loads the interaction + challenge SVGs from
 * `public/assets/worlds/golden-retriever/interactions/` and
 * `public/assets/worlds/golden-retriever/challenge/` and assigns stable
 * texture keys. No gameplay, no scene changes — the future Golden adventure
 * scene calls `preloadGoldenRetrieverInteractionArt(this)` in preload().
 *
 * Builds on the base world pack (`GoldenRetrieverArtPack`, still on its own
 * branch): this file only covers the NEW state variants and FX created for
 * the interaction + final-challenge assignment, so it can merge independently.
 *
 * Interaction spec: docs/GOLDEN_RETRIEVER_INTERACTION_SPEC.md
 * Challenge spec:  docs/GOLDEN_RETRIEVER_FINAL_CHALLENGE_SPEC.md
 */

const INTERACTIONS_DIR = "assets/worlds/golden-retriever/interactions";
const CHALLENGE_DIR = "assets/worlds/golden-retriever/challenge";

/** Texture key per interaction asset (stable contract for the future Golden scene). */
export const GOLDEN_INTERACTION_ART_KEYS = {
  // dock repair
  dockRepairPieces: "golden-interact-dock-repair-pieces",
  dockRepairSuccess: "golden-interact-dock-repair-success",
  // stream / water crossing
  streamBlocked: "golden-interact-stream-blocked",
  streamSteppingRoute: "golden-interact-stream-stepping-route",
  streamCrossingComplete: "golden-interact-stream-crossing-complete",
  splashBig: "golden-interact-splash-big",
  // floating toy retrieval
  toyDriftWake: "golden-interact-toy-drift-wake",
  toyTargetRing: "golden-interact-toy-target-ring",
  toyRetrieved: "golden-interact-toy-retrieved",
  toyBasketEmpty: "golden-interact-toy-basket-empty",
  toyBasketFull: "golden-interact-toy-basket-full",
  splashCelebration: "golden-interact-splash-celebration",
  // boathouse
  boathouseOpening: "golden-interact-boathouse-opening",
  boathouseWarmGlow: "golden-interact-boathouse-warm-glow",
  // log obstacle
  logMovable: "golden-interact-log-movable",
  logCleared: "golden-interact-log-cleared",
  // pawprint trail
  pawTrailHidden: "golden-interact-paw-trail-hidden",
  pawTrailRevealed: "golden-interact-paw-trail-revealed",
  pawTrailGuiding: "golden-interact-paw-trail-guiding",
  // hidden picnic cache
  basketPartial: "golden-interact-basket-partial",
  // golden tennis ball secret
  willowCurtainParted: "golden-interact-willow-curtain-parted",
  goldenBallGlow: "golden-interact-golden-ball-glow",
} as const;

export type GoldenInteractionArtKey =
  (typeof GOLDEN_INTERACTION_ART_KEYS)[keyof typeof GOLDEN_INTERACTION_ART_KEYS];

/** Texture key per final-challenge asset (stable contract). */
export const GOLDEN_CHALLENGE_ART_KEYS = {
  relayStartBanner: "golden-challenge-relay-start-banner",
  relayLaneRope: "golden-challenge-relay-lane-rope",
  relayDockSection: "golden-challenge-relay-dock-section",
  relayFinishConfetti: "golden-challenge-relay-finish-confetti",
  splashDive: "golden-challenge-splash-dive",
  splashSpeed: "golden-challenge-splash-speed",
  wakeTrail: "golden-challenge-wake-trail",
  relayLegDone: "golden-challenge-relay-leg-done",
  relayGentleRetry: "golden-challenge-relay-gentle-retry",
  // PLACEHOLDER for Ringo: simple environmental retriever figure, no animation.
  retrieverSilhouette: "golden-challenge-retriever-silhouette",
  glintShower: "golden-challenge-glint-shower",
} as const;

export type GoldenChallengeArtKey =
  (typeof GOLDEN_CHALLENGE_ART_KEYS)[keyof typeof GOLDEN_CHALLENGE_ART_KEYS];

const INTERACTION_DEFS: Array<[GoldenInteractionArtKey, string, number, number]> = [
  [GOLDEN_INTERACTION_ART_KEYS.dockRepairPieces, "dock-repair-pieces.svg", 420, 200],
  [GOLDEN_INTERACTION_ART_KEYS.dockRepairSuccess, "dock-repair-success.svg", 300, 220],
  [GOLDEN_INTERACTION_ART_KEYS.streamBlocked, "stream-blocked.svg", 400, 180],
  [GOLDEN_INTERACTION_ART_KEYS.streamSteppingRoute, "stream-stepping-route.svg", 400, 180],
  [GOLDEN_INTERACTION_ART_KEYS.streamCrossingComplete, "stream-crossing-complete.svg", 400, 180],
  [GOLDEN_INTERACTION_ART_KEYS.splashBig, "splash-big.svg", 260, 220],
  [GOLDEN_INTERACTION_ART_KEYS.toyDriftWake, "toy-drift-wake.svg", 240, 120],
  [GOLDEN_INTERACTION_ART_KEYS.toyTargetRing, "toy-target-ring.svg", 200, 200],
  [GOLDEN_INTERACTION_ART_KEYS.toyRetrieved, "toy-retrieved.svg", 220, 200],
  [GOLDEN_INTERACTION_ART_KEYS.toyBasketEmpty, "toy-basket-empty.svg", 200, 190],
  [GOLDEN_INTERACTION_ART_KEYS.toyBasketFull, "toy-basket-full.svg", 200, 190],
  [GOLDEN_INTERACTION_ART_KEYS.splashCelebration, "splash-celebration.svg", 280, 220],
  [GOLDEN_INTERACTION_ART_KEYS.boathouseOpening, "boathouse-opening.svg", 340, 260],
  [GOLDEN_INTERACTION_ART_KEYS.boathouseWarmGlow, "boathouse-warm-glow.svg", 340, 260],
  [GOLDEN_INTERACTION_ART_KEYS.logMovable, "log-movable.svg", 360, 180],
  [GOLDEN_INTERACTION_ART_KEYS.logCleared, "log-cleared.svg", 360, 180],
  [GOLDEN_INTERACTION_ART_KEYS.pawTrailHidden, "paw-trail-hidden.svg", 420, 120],
  [GOLDEN_INTERACTION_ART_KEYS.pawTrailRevealed, "paw-trail-revealed.svg", 420, 120],
  [GOLDEN_INTERACTION_ART_KEYS.pawTrailGuiding, "paw-trail-guiding.svg", 420, 120],
  [GOLDEN_INTERACTION_ART_KEYS.basketPartial, "basket-partial.svg", 240, 200],
  [GOLDEN_INTERACTION_ART_KEYS.willowCurtainParted, "willow-curtain-parted.svg", 320, 300],
  [GOLDEN_INTERACTION_ART_KEYS.goldenBallGlow, "golden-ball-glow.svg", 220, 220],
];

const CHALLENGE_DEFS: Array<[GoldenChallengeArtKey, string, number, number]> = [
  [GOLDEN_CHALLENGE_ART_KEYS.relayStartBanner, "relay-start-banner.svg", 480, 170],
  [GOLDEN_CHALLENGE_ART_KEYS.relayLaneRope, "relay-lane-rope.svg", 400, 80],
  [GOLDEN_CHALLENGE_ART_KEYS.relayDockSection, "relay-dock-section.svg", 360, 170],
  [GOLDEN_CHALLENGE_ART_KEYS.relayFinishConfetti, "relay-finish-confetti.svg", 400, 260],
  [GOLDEN_CHALLENGE_ART_KEYS.splashDive, "splash-dive.svg", 260, 250],
  [GOLDEN_CHALLENGE_ART_KEYS.splashSpeed, "splash-speed.svg", 300, 120],
  [GOLDEN_CHALLENGE_ART_KEYS.wakeTrail, "wake-trail.svg", 360, 100],
  [GOLDEN_CHALLENGE_ART_KEYS.relayLegDone, "relay-leg-done.svg", 220, 200],
  [GOLDEN_CHALLENGE_ART_KEYS.relayGentleRetry, "relay-gentle-retry.svg", 220, 200],
  [GOLDEN_CHALLENGE_ART_KEYS.retrieverSilhouette, "retriever-silhouette.svg", 280, 300],
  [GOLDEN_CHALLENGE_ART_KEYS.glintShower, "glint-shower.svg", 400, 300],
];

/** Load every interaction + challenge asset. Call from the future Golden scene's preload(). */
export function preloadGoldenRetrieverInteractionArt(scene: Phaser.Scene): void {
  for (const [key, file, w, h] of INTERACTION_DEFS) {
    scene.load.svg(key, `${INTERACTIONS_DIR}/${file}`, { width: w, height: h });
  }
  for (const [key, file, w, h] of CHALLENGE_DEFS) {
    scene.load.svg(key, `${CHALLENGE_DIR}/${file}`, { width: w, height: h });
  }
}
