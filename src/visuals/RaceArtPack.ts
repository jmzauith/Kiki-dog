import Phaser from "phaser";

/**
 * RaceArtPack — preload helper for the future Great Husky Sled Race scene.
 *
 * ART ONLY. This module loads the 22 race SVGs from
 * `public/assets/worlds/husky-race/` and assigns stable texture keys.
 * It implements no gameplay, touches no race rules, and is not referenced
 * by HuskyScene or RaceScene — the future race scene (built by the
 * integrator) calls `preloadRaceArt(this)` in its own preload().
 *
 * Visual spec: docs/HUSKY_RACE_VISUAL_SPEC.md
 * Suggested depths / scroll factors / tiling notes live in the spec.
 */

const DIR = "assets/worlds/husky-race";

/** Texture key per asset (stable contract for the race scene). */
export const RACE_ART_KEYS = {
  startGate: "race-start-gate",
  finishGate: "race-finish-gate",
  trackStrip: "race-track-strip",
  trackBank: "race-track-bank",
  bgMountains: "race-bg-mountains",
  bgForest: "race-bg-forest",
  midPine1: "race-mid-pine-1",
  midPine2: "race-mid-pine-2",
  fgPine: "race-fg-pine",
  fgSnowbank: "race-fg-snowbank",
  snowdrift1: "race-snowdrift-1",
  snowdrift2: "race-snowdrift-2",
  iceFormation: "race-ice-formation",
  rockCluster: "race-rock-cluster",
  raceFlag: "race-flag",
  flagString: "race-flag-string",
  checkpoint: "race-checkpoint",
  tent: "race-tent",
  sledParked: "race-sled-parked",
  snowman: "race-snowman",
  speedStreak: "race-speed-streak",
  snowSpray: "race-snow-spray",
} as const;

export type RaceArtKey = (typeof RACE_ART_KEYS)[keyof typeof RACE_ART_KEYS];

const DEFS: Array<[RaceArtKey, string, number, number]> = [
  [RACE_ART_KEYS.startGate, "start-gate.svg", 420, 260],
  [RACE_ART_KEYS.finishGate, "finish-gate.svg", 420, 260],
  [RACE_ART_KEYS.trackStrip, "track-strip.svg", 800, 220],
  [RACE_ART_KEYS.trackBank, "track-bank.svg", 800, 160],
  [RACE_ART_KEYS.bgMountains, "bg-mountains.svg", 2000, 420],
  [RACE_ART_KEYS.bgForest, "bg-forest.svg", 1600, 220],
  [RACE_ART_KEYS.midPine1, "mid-pine-1.svg", 240, 300],
  [RACE_ART_KEYS.midPine2, "mid-pine-2.svg", 260, 280],
  [RACE_ART_KEYS.fgPine, "fg-pine.svg", 300, 420],
  [RACE_ART_KEYS.fgSnowbank, "fg-snowbank.svg", 900, 200],
  [RACE_ART_KEYS.snowdrift1, "snowdrift-1.svg", 300, 120],
  [RACE_ART_KEYS.snowdrift2, "snowdrift-2.svg", 300, 120],
  [RACE_ART_KEYS.iceFormation, "ice-formation.svg", 220, 200],
  [RACE_ART_KEYS.rockCluster, "rock-cluster.svg", 260, 140],
  [RACE_ART_KEYS.raceFlag, "race-flag.svg", 120, 200],
  [RACE_ART_KEYS.flagString, "flag-string.svg", 400, 120],
  [RACE_ART_KEYS.checkpoint, "checkpoint-marker.svg", 140, 220],
  [RACE_ART_KEYS.tent, "race-tent.svg", 260, 200],
  [RACE_ART_KEYS.sledParked, "sled-parked.svg", 220, 140],
  [RACE_ART_KEYS.snowman, "snowman.svg", 140, 200],
  [RACE_ART_KEYS.speedStreak, "speed-streak.svg", 300, 60],
  [RACE_ART_KEYS.snowSpray, "snow-spray.svg", 160, 140],
];

/** Load every race art asset. Call from the future race scene's preload(). */
export function preloadRaceArt(scene: Phaser.Scene): void {
  for (const [key, file, w, h] of DEFS) {
    scene.load.svg(key, `${DIR}/${file}`, { width: w, height: h });
  }
}
