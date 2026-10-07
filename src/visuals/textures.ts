import Phaser from "phaser";

/**
 * Runtime-generated textures for the Snowy Peaks world.
 * Soft gradients, glows and props are drawn once into canvas textures
 * so the scene can instance them cheaply (Chromebook-friendly).
 */
export function createSnowyTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("sky-grad")) return;

  // --- vertical sky gradient (16x720, stretched) ---
  const sky = scene.textures.createCanvas("sky-grad", 16, 720);
  if (sky) {
    const ctx = sky.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, "#5ea9e6");
    grad.addColorStop(0.45, "#9fd4f5");
    grad.addColorStop(0.75, "#d8f0fd");
    grad.addColorStop(1, "#eef9ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 720);
    sky.refresh();
  }

  // --- soft radial blob (fog banks, glows, clouds) ---
  const blob = scene.textures.createCanvas("soft-blob", 128, 128);
  if (blob) {
    const ctx = blob.getContext();
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    blob.refresh();
  }

  // --- tiny snow dot (falling snow, puffs) ---
  const dot = scene.textures.createCanvas("snow-dot", 24, 24);
  if (dot) {
    const ctx = dot.getContext();
    const grad = ctx.createRadialGradient(12, 12, 1, 12, 12, 11);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 24, 24);
    dot.refresh();
  }

  // --- 4-point sparkle (cues, twinkles, celebrations) ---
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  const cx = 16;
  const cy = 16;
  g.beginPath();
  g.moveTo(cx, 0);
  g.lineTo(cx + 4, cy - 4);
  g.lineTo(32, cy);
  g.lineTo(cx + 4, cy + 4);
  g.lineTo(cx, 32);
  g.lineTo(cx - 4, cy + 4);
  g.lineTo(0, cy);
  g.lineTo(cx - 4, cy - 4);
  g.closePath();
  g.fillPath();
  g.generateTexture("sparkle", 32, 32);
  g.destroy();

  // --- pine tree with snow (instanced across mid/foreground) ---
  const pine = scene.add.graphics();
  pine.fillStyle(0x6b4a2e, 1);
  pine.fillRect(42, 100, 8, 24);
  const layers: Array<[number, number, number, number, number]> = [
    // x(top), y(top), halfW(bottom), y(bottom), green
    [46, 44, 34, 106, 0x2a6b52],
    [46, 26, 27, 84, 0x2f775e],
    [46, 8, 20, 60, 0x35866a],
  ];
  for (const [tx, ty, hw, by, green] of layers) {
    pine.fillStyle(green, 1);
    pine.fillTriangle(tx, ty, tx - hw, by, tx + hw, by);
    // snow dusting on the upper-left of each layer
    pine.fillStyle(0xffffff, 0.92);
    pine.fillTriangle(tx, ty, tx - hw * 0.55, ty + (by - ty) * 0.42, tx + hw * 0.12, ty + (by - ty) * 0.5);
  }
  pine.fillStyle(0xffffff, 0.95);
  pine.fillTriangle(46, 8, 38, 24, 54, 24);
  pine.generateTexture("pine", 92, 128);
  pine.destroy();
}
