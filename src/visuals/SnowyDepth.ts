import Phaser from "phaser";

/**
 * SnowyDepth — Harrison's Snowy Peaks depth/occlusion system.
 *
 * The draw-order contract (the whole game reads through this):
 *   far (1) → fx-far (2-3) → mid (4) → back (5-7) → terrain (8) →
 *   interact-behind (10-12) → contact (13) → KIKI (15) →
 *   fore (16) → fx-near (17) → markers (18) → fx-top/ui (19/20+)
 *
 * Core trick: sandwich Kiki. Back art below depth 15, occluder art above.
 * The moment a bridge rail, snowbank, or doorway edge draws OVER Kiki,
 * she lives inside the world.
 */
const ASSET_DIR = "assets/worlds/snowy-peaks";

const OCCLUDERS: Array<[string, string, number, number]> = [
  ["dl-branch-top", "dl-branch-top.svg", 500, 200],
  ["dl-bridge-rail-front", "dl-bridge-rail-front.svg", 480, 120],
  ["dl-cave-wall", "dl-cave-wall.svg", 400, 500],
  ["dl-gust", "dl-gust.svg", 600, 200],
  ["dl-ice-cracks", "dl-ice-cracks.svg", 500, 300],
  ["dl-igloo-doorframe", "dl-igloo-doorframe.svg", 300, 320],
  ["dl-lake-edge", "dl-lake-edge.svg", 700, 180],
  ["dl-mist", "dl-mist.svg", 800, 300],
  ["dl-race-pine", "dl-race-pine.svg", 300, 500],
  ["dl-rock", "dl-rock.svg", 320, 240],
  ["dl-snowbank", "dl-snowbank.svg", 500, 200],
  ["dl-snowfall", "dl-snowfall.svg", 1280, 720],
  ["dl-spray-alpha", "dl-spray-alpha.svg", 200, 120],
  ["dl-trunk", "dl-trunk.svg", 240, 500],
];

/** Queue all foreground occluders. Call from the scene's preload(). */
export function preloadOccluders(scene: Phaser.Scene): void {
  for (const [key, file, w, h] of OCCLUDERS) {
    scene.load.svg(key, `${ASSET_DIR}/${file}`, { width: w, height: h });
  }
}

/**
 * Add a foreground occluder that draws OVER Kiki (depth 16+).
 * Use sparingly: the moment Kiki passes behind a rail, bank, or doorway,
 * she reads as physically inside Snowy Peaks.
 */
export function addOccluder(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  opts?: { scale?: number; alpha?: number; depth?: number },
): Phaser.GameObjects.Image {
  return scene.add
    .image(x, y, key)
    .setScale(opts?.scale ?? 1)
    .setAlpha(opts?.alpha ?? 1)
    .setDepth(opts?.depth ?? 16);
}
