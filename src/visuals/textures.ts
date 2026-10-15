import Phaser from "phaser";

/**
 * Runtime-generated textures for the Snowy Peaks world.
 * Soft gradients, glows and props are drawn once into canvas textures
 * so the scene can instance them cheaply (Chromebook-friendly).
 */
export function createSnowyEffects(scene: Phaser.Scene): void {
  if (scene.textures.exists("soft-blob")) return;

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

}
