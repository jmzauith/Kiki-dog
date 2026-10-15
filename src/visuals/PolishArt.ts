import Phaser from "phaser";
export const WORLD_ART = "assets/worlds/snowy-peaks";
export const POLISH_ART = "assets/polish";
/** Presentation only: place elevated prototype markers onto painted terrain. */
export function polishPosition<T extends { id?: string; x: number; y: number }>(p: T): T {
  const ground: Record<string, number> = { "ice-cave": 520, "secret-igloo": 390, "snow-pass": 535, "summit-camp": 505 };
  return { ...p, y: ground[p.id ?? ""] ?? p.y };
}
export function woodButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, "wood-panel").setDisplaySize(w, h).setTint(0xbca081).setInteractive({ useHandCursor: true });
  image.on("pointerover", () => image.setTint(0xffe4b0));
  image.on("pointerout", () => image.setTint(0xbca081));
  image.on("pointerdown", () => image.setTint(0xffefc9));
  return image;
}
export function preloadPolishProps(scene: Phaser.Scene): void {
  scene.load.svg("race-checkpoint", `${POLISH_ART}/race-checkpoint.svg`);
  for (const name of ["ip-re-downhill", "ip-re-icyturn", "ip-re-deepsnow", "ip-re-finish"]) scene.load.svg(name, `${WORLD_ART}/${name}.svg`, {width:1280,height:720});
  scene.load.svg("wood-panel", `${POLISH_ART}/wood-panel.svg`);
  scene.load.svg("husky-sticker-final", `${POLISH_ART}/husky-sticker-final.svg`);
  scene.load.svg("husky-sticker-golden", `${POLISH_ART}/husky-sticker-golden.svg`);
  scene.load.svg("husky-friendship", `${POLISH_ART}/husky-friendship.svg`);
}
