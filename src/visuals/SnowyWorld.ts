import Phaser from "phaser";
import { createSnowyTextures } from "./textures";

const W = 1280;
const H = 720;

/**
 * Builds the layered Snowy Peaks environment:
 * sky -> sun -> clouds -> far mountains -> ridge -> pine band ->
 * rolling terrain -> sparkles, plus foreground pines and falling snow.
 *
 * Purely decorative: no gameplay state lives here.
 */
export class SnowyWorld {
  constructor(private scene: Phaser.Scene) {}

  build(): void {
    createSnowyTextures(this.scene);
    this.buildSky();
    this.buildMountains();
    this.buildPineBand();
    this.buildTerrain();
    this.buildForeground();
    this.buildFallingSnow();
  }

  private buildSky(): void {
    this.scene.add.image(0, 0, "sky-grad").setOrigin(0).setDisplaySize(W, H).setDepth(-10);

    // warm sun glow
    this.scene.add.image(1075, 105, "soft-blob").setTint(0xfff3c4).setScale(3.4).setAlpha(0.85).setDepth(-9);
    this.scene.add.circle(1075, 105, 34, 0xfff8dc, 1).setDepth(-9);

    // drifting clouds
    const clouds: Array<[number, number, number, number]> = [
      [220, 90, 4.6, 1.6],
      [640, 150, 5.6, 1.9],
      [980, 70, 3.8, 1.4],
      [420, 190, 3.2, 1.2],
    ];
    clouds.forEach(([x, y, sx, sy], i) => {
      const cloud = this.scene.add.image(x, y, "soft-blob").setScale(sx, sy).setAlpha(0.92).setDepth(-8);
      this.scene.tweens.add({
        targets: cloud,
        x: x + (i % 2 === 0 ? 70 : -70),
        duration: 26000 + i * 5000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }

  private jaggedRidge(
    g: Phaser.GameObjects.Graphics,
    baseY: number,
    amplitude: number,
    color: number,
    capColor: number,
    seedOffset: number,
  ): void {
    const pts: Phaser.Math.Vector2[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * (W + 200) - 100;
      const peak = Math.abs(Math.sin(i * 2.7 + seedOffset)) * amplitude + Math.abs(Math.sin(i * 1.3 + seedOffset * 2)) * amplitude * 0.5;
      pts.push(new Phaser.Math.Vector2(x, baseY - peak));
    }
    // mountain body
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(-100, H);
    g.lineTo(-100, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.lineTo(W + 100, H);
    g.closePath();
    g.fillPath();
    // snow caps on the tallest peaks
    g.fillStyle(capColor, 1);
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const prev = pts[i - 1];
      const next = pts[i + 1];
      if (p.y < prev.y - 12 && p.y < next.y - 12) {
        const w = 46 + (i % 3) * 14;
        g.fillTriangle(p.x - w / 2, p.y + 44, p.x, p.y - 4, p.x + w / 2, p.y + 44);
      }
    }
  }

  private buildMountains(): void {
    const g = this.scene.add.graphics().setDepth(-7);
    // far range: pale, atmospheric
    this.jaggedRidge(g, 400, 190, 0xbcd7f2, 0xe9f4ff, 1.7);
    const g2 = this.scene.add.graphics().setDepth(-6);
    // nearer ridge: a touch darker, lower
    this.jaggedRidge(g2, 470, 150, 0x9cc3ea, 0xf4faff, 4.2);
  }

  private buildPineBand(): void {
    // a forest silhouette hugging the mountain base
    for (let i = 0; i < 30; i++) {
      const x = -30 + i * 45 + Phaser.Math.Between(-14, 14);
      const y = 330 + Phaser.Math.Between(-24, 40);
      const s = 0.75 + ((i * 37) % 10) / 22;
      const pine = this.scene.add.image(x, y, "pine").setScale(s).setDepth(-5);
      // atmospheric fade: higher (farther) pines get paler and softer
      const fade = Phaser.Math.Clamp(1 - (360 - y) / 260, 0.55, 1);
      pine.setTint(fade > 0.8 ? 0xffffff : 0xd7e7f7);
      pine.setAlpha(0.6 + fade * 0.35);
    }
  }

  private buildTerrain(): void {
    const g = this.scene.add.graphics().setDepth(-4);
    // rolling snow mass with a wavy top edge, drawn via a curve Path
    const path = new Phaser.Curves.Path(-20, H + 20);
    path.lineTo(-20, 470);
    const top: Array<[number, number]> = [
      [120, 440], [300, 468], [480, 436], [660, 462], [840, 430], [1020, 458], [1180, 438], [1300, 462],
    ];
    let px = -20;
    let py = 470;
    for (const [x, y] of top) {
      path.quadraticBezierTo((px + x) / 2, Math.min(py, y) - 26, x, y);
      px = x;
      py = y;
    }
    path.lineTo(1300, H + 20);
    path.closePath();
    g.fillStyle(0xffffff, 1);
    path.draw(g);

    // soft blue shadow swooshes for rolling depth
    g.fillStyle(0xdceffa, 1);
    const shadows: Array<[number, number, number, number]> = [
      [260, 560, 300, 44], [700, 620, 360, 52], [1060, 560, 280, 40], [120, 660, 320, 46], [880, 690, 340, 40],
    ];
    for (const [x, y, w, h] of shadows) g.fillEllipse(x, y, w, h);

    // sparkle twinkles scattered on the snow
    for (let i = 0; i < 26; i++) {
      const x = Phaser.Math.Between(40, 1240);
      const y = Phaser.Math.Between(470, 700);
      const s = this.scene.add.image(x, y, "sparkle").setScale(0.28).setAlpha(0).setDepth(-3);
      this.scene.tweens.add({
        targets: s,
        alpha: { from: 0, to: 0.85 },
        scale: { from: 0.2, to: 0.42 },
        duration: Phaser.Math.Between(900, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2400),
        ease: "Sine.inOut",
      });
    }
  }

  private buildForeground(): void {
    // dark pine boughs intruding from the top corners: instant depth
    const left = this.scene.add.image(-30, 60, "pine").setScale(2.6).setTint(0x8fa8c4).setAlpha(0.96).setDepth(16);
    left.setAngle(-18);
    const left2 = this.scene.add.image(90, -20, "pine").setScale(2.1).setTint(0x9db4cf).setAlpha(0.95).setDepth(16);
    left2.setAngle(14);
    const right = this.scene.add.image(1310, 40, "pine").setScale(2.8).setTint(0x8fa8c4).setAlpha(0.96).setDepth(16);
    right.setAngle(20);
    const right2 = this.scene.add.image(1200, -30, "pine").setScale(2.0).setTint(0x9db4cf).setAlpha(0.95).setDepth(16);
    right2.setAngle(-12);
    // bottom-edge snowbank for a soft frame
    const g = this.scene.add.graphics().setDepth(16);
    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(180, 752, 620, 120);
    g.fillEllipse(1120, 758, 560, 120);
  }

  private buildFallingSnow(): void {
    this.scene.add.particles(0, -30, "snow-dot", {
      x: { min: 0, max: W },
      lifespan: { min: 5200, max: 9000 },
      speedY: { min: 42, max: 95 },
      speedX: { min: -28, max: 28 },
      scale: { min: 0.35, max: 0.9 },
      alpha: { min: 0.35, max: 0.9 },
      quantity: 1,
      frequency: 130,
    }).setDepth(30);
  }
}
