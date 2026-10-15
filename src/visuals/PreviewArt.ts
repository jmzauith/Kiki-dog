import Phaser from "phaser";

/** Preview plates derived from Harrison's approved round-two concepts.
 * Characters, inputs, landmarks, progression and saves remain live objects.
 */
export function preloadPreviewArt(scene: Phaser.Scene): void {
  scene.load.svg("preview-race", "assets/worlds/snowy-peaks/race-backdrop.svg", { width: 1280, height: 720 });
}

export function previewBadge(scene: Phaser.Scene): void {
  scene.add.text(24, 92, "SNOWY PEAKS · POLISH BUILD", {
    fontFamily: "Arial", fontSize: "11px", color: "#fff3ce",
    backgroundColor: "#132b3ed9", padding: { x: 12, y: 7 },
  }).setDepth(50).setScrollFactor(0);
}
