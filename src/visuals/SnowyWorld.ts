import Phaser from "phaser";
import { createSnowyTextures } from "./textures";
import { WORLD_W, WORLD_H, REGIONS } from "../worlds/husky/HuskyWorldLayout";

/** Deterministic PRNG so the designed layout is identical every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the expanded Snowy Peaks world: a 3360x720 scrolling level with
 * three visually distinct regions (Trailhead Forest / Frozen Valley /
 * Summit Race Camp), parallax mountain layers, region-specific terrain and
 * dressing, foreground framing and weather.
 *
 * Purely decorative: no gameplay state lives here.
 */
export class SnowyWorld {
  constructor(private scene: Phaser.Scene) {}

  build(): void {
    createSnowyTextures(this.scene);
    this.buildSky();
    this.buildFarMountains();
    this.buildMidMountains();
    this.buildSummitRidge();
    this.buildPineSilhouettes();
    this.buildTerrain();
    this.buildFrozenLake();
    this.buildRavine();
    this.buildRegionDressing();
    this.buildRegionGrading();
    this.buildForeground();
    this.buildWeather();
  }

  // ---------------------------------------------------------------- sky (fixed)

  private buildSky(): void {
    // camera-fixed sky: the heavens don't scroll with the world
    this.scene.add.image(0, 0, "sky-grad").setOrigin(0).setDisplaySize(1280, WORLD_H).setDepth(-10).setScrollFactor(0);

    this.scene.add.image(1075, 105, "soft-blob").setTint(0xfff3c4).setScale(3.4).setAlpha(0.85).setDepth(-9).setScrollFactor(0);
    this.scene.add.circle(1075, 105, 34, 0xfff8dc, 1).setDepth(-9).setScrollFactor(0);

    const clouds: Array<[number, number, number, number]> = [
      [220, 90, 4.6, 1.6],
      [640, 150, 5.6, 1.9],
      [980, 70, 3.8, 1.4],
      [420, 190, 3.2, 1.2],
    ];
    clouds.forEach(([x, y, sx, sy], i) => {
      const cloud = this.scene.add.image(x, y, "soft-blob").setScale(sx, sy).setAlpha(0.92).setDepth(-8).setScrollFactor(0);
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

  // ------------------------------------------------------- parallax mountains

  private jaggedRidge(
    g: Phaser.GameObjects.Graphics,
    x0: number,
    x1: number,
    baseY: number,
    amplitude: number,
    color: number,
    capColor: number,
    seedOffset: number,
    rocky = false,
  ): void {
    const rand = mulberry32(Math.floor(seedOffset * 1000) + 7);
    const pts: Phaser.Math.Vector2[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + (i / steps) * (x1 - x0);
      const peak =
        Math.abs(Math.sin(i * 2.7 + seedOffset)) * amplitude +
        Math.abs(Math.sin(i * 1.3 + seedOffset * 2)) * amplitude * 0.5 +
        rand() * amplitude * 0.22;
      pts.push(new Phaser.Math.Vector2(x, baseY - peak));
    }
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(x0, WORLD_H);
    g.lineTo(x0, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.lineTo(x1, WORLD_H);
    g.closePath();
    g.fillPath();
    // snow caps on the tallest peaks
    g.fillStyle(capColor, 1);
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const prev = pts[i - 1];
      const next = pts[i + 1];
      if (p.y < prev.y - 10 && p.y < next.y - 10) {
        const w = 52 + (i % 3) * 16;
        g.fillTriangle(p.x - w / 2, p.y + 48, p.x, p.y - 4, p.x + w / 2, p.y + 48);
      }
    }
    if (rocky) {
      // exposed rock faces on the steepest slopes
      g.fillStyle(0x6d7f92, 0.85);
      for (let i = 2; i < pts.length - 2; i += 4) {
        const p = pts[i];
        if (p.y < baseY - amplitude * 0.55) {
          g.fillTriangle(p.x - 26, p.y + 90, p.x + 6, p.y + 26, p.x + 34, p.y + 96);
        }
      }
    }
  }

  private buildFarMountains(): void {
    const g = this.scene.add.graphics().setDepth(-7).setScrollFactor(0.12, 0);
    this.jaggedRidge(g, -260, 2900, 400, 200, 0xbcd7f2, 0xe9f4ff, 1.7);
  }

  private buildMidMountains(): void {
    const g = this.scene.add.graphics().setDepth(-6).setScrollFactor(0.3, 0);
    this.jaggedRidge(g, -260, 2700, 470, 160, 0x9cc3ea, 0xf4faff, 4.2);
  }

  /** Extra-tall, steeper, rockier ridge looming behind the summit region. */
  private buildSummitRidge(): void {
    const g = this.scene.add.graphics().setDepth(-6);
    this.jaggedRidge(g, 2280, 3560, 500, 260, 0x8fb4dd, 0xffffff, 8.9, true);
  }

  /** Distant forest silhouette hugging the mountain base (parallax). */
  private buildPineSilhouettes(): void {
    const rand = mulberry32(1234);
    for (let i = 0; i < 64; i++) {
      const x = -160 + i * 48 + (rand() - 0.5) * 30;
      const y = 340 + (rand() - 0.5) * 60;
      const s = 0.7 + rand() * 0.5;
      const pine = this.scene.add.image(x, y, "pine")
        .setScale(s)
        .setDepth(-5)
        .setScrollFactor(0.55, 0);
      const fade = Phaser.Math.Clamp(1 - (360 - y) / 260, 0.55, 1);
      pine.setTint(fade > 0.8 ? 0xffffff : 0xd7e7f7);
      pine.setAlpha(0.55 + fade * 0.35);
    }
  }

  // ------------------------------------------------------------------ terrain

  private buildTerrain(): void {
    const g = this.scene.add.graphics().setDepth(-4);
    // rolling snow mass across the whole world
    const path = new Phaser.Curves.Path(-40, WORLD_H + 20);
    path.lineTo(-40, 480);
    const rand = mulberry32(99);
    let px = -40;
    let py = 480;
    for (let x = 120; x <= WORLD_W + 40; x += 170) {
      const y = 440 + rand() * 60;
      path.quadraticBezierTo((px + x) / 2, Math.min(py, y) - 26, x, y);
      px = x;
      py = y;
    }
    path.lineTo(WORLD_W + 40, WORLD_H + 20);
    path.closePath();
    g.fillStyle(0xffffff, 1);
    path.draw(g);

    // soft blue shadow swooshes for rolling depth
    const rand2 = mulberry32(555);
    g.fillStyle(0xdceffa, 1);
    for (let i = 0; i < 26; i++) {
      const x = rand2() * WORLD_W;
      const y = 520 + rand2() * 170;
      g.fillEllipse(x, y, 180 + rand2() * 220, 30 + rand2() * 26);
    }

    // sparkle twinkles scattered on the snow
    for (let i = 0; i < 70; i++) {
      const x = rand2() * WORLD_W;
      const y = 470 + rand2() * 230;
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

  /** The frozen lake: reflective ice sheet with cracks, in the valley. */
  private buildFrozenLake(): void {
    const cx = 1830;
    const cy = 620;
    this.scene.add.image(cx, cy, "lake-ice").setDisplaySize(560, 150).setDepth(-3).setAlpha(0.98);
    const g = this.scene.add.graphics().setDepth(-2);
    // crack lines
    g.lineStyle(3, 0x9cc8ec, 0.8);
    const rand = mulberry32(777);
    for (let i = 0; i < 9; i++) {
      const x0 = cx - 240 + rand() * 480;
      const y0 = cy - 40 + rand() * 80;
      g.beginPath();
      g.moveTo(x0, y0);
      let x = x0;
      let y = y0;
      for (let s = 0; s < 4; s++) {
        x += (rand() - 0.5) * 90;
        y += (rand() - 0.5) * 36;
        g.lineTo(x, y);
      }
      g.strokePath();
    }
    // bright glints
    for (let i = 0; i < 8; i++) {
      const s = this.scene.add.image(cx - 220 + rand() * 440, cy - 45 + rand() * 90, "sparkle")
        .setScale(0.4).setAlpha(0).setDepth(-2);
      this.scene.tweens.add({
        targets: s,
        alpha: { from: 0, to: 0.9 },
        duration: Phaser.Math.Between(800, 1800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: "Sine.inOut",
      });
    }
  }

  /** The ravine the broken bridge spans (forest region). */
  private buildRavine(): void {
    const g = this.scene.add.graphics().setDepth(-3);
    g.fillStyle(0x3d5a78, 1);
    g.beginPath();
    g.moveTo(748, 720);
    g.lineTo(772, 560);
    g.lineTo(868, 560);
    g.lineTo(892, 720);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x2c4258, 1);
    g.beginPath();
    g.moveTo(786, 720);
    g.lineTo(800, 600);
    g.lineTo(840, 600);
    g.lineTo(854, 720);
    g.closePath();
    g.fillPath();
  }

  // ------------------------------------------------------- region dressing

  private buildRegionDressing(): void {
    const rand = mulberry32(2024);
    const pineKeys = ["wlm-pine-tall", "wlm-pine-wide", "wlm-pine-snowy"];

    // FOREST: dense, varied, warm greens
    for (let i = 0; i < 46; i++) {
      const x = 20 + rand() * 1180;
      const y = 380 + rand() * 130;
      const key = pineKeys[Math.floor(rand() * 3)];
      const s = 0.55 + rand() * 0.65;
      const pine = this.scene.add.image(x, y, key).setScale(s).setDepth(3);
      const depthFade = Phaser.Math.Clamp((y - 380) / 130, 0, 1);
      pine.setAlpha(0.75 + depthFade * 0.25);
      if (rand() < 0.25) pine.setAngle((rand() - 0.5) * 8);
    }

    // VALLEY: sparse, snow-loaded, pale; ice rocks scattered
    for (let i = 0; i < 16; i++) {
      const x = 1280 + rand() * 1000;
      const y = 360 + rand() * 120;
      const key = rand() < 0.6 ? "wlm-pine-snowy" : "wlm-pine-tall";
      this.scene.add.image(x, y, key).setScale(0.6 + rand() * 0.6).setDepth(3).setTint(0xdcebfb);
    }
    for (let i = 0; i < 10; i++) {
      const x = 1300 + rand() * 980;
      const y = 480 + rand() * 160;
      this.scene.add.image(x, y, "wlm-rock-ice").setScale(0.5 + rand() * 0.7).setDepth(3).setAlpha(0.95);
    }

    // SUMMIT: windswept, very sparse; snow rocks
    for (let i = 0; i < 9; i++) {
      const x = 2400 + rand() * 880;
      const y = 380 + rand() * 100;
      this.scene.add.image(x, y, "wlm-pine-snowy").setScale(0.5 + rand() * 0.45).setDepth(3)
        .setTint(0xe8f2fc).setAngle(6 + rand() * 8);
    }
    for (let i = 0; i < 9; i++) {
      const x = 2420 + rand() * 860;
      const y = 500 + rand() * 150;
      this.scene.add.image(x, y, "wlm-rock-snow").setScale(0.55 + rand() * 0.6).setDepth(3);
    }

    // a few hero pines close to the trail (in front of paths, behind Kiki)
    const heroes: Array<[number, number, number]> = [
      [560, 640, 1.25], [1480, 650, 1.35], [1990, 430, 1.1], [2900, 640, 1.3],
    ];
    for (const [x, y, s] of heroes) {
      this.scene.add.image(x, y, "wlm-pine-wide").setScale(s).setDepth(12).setAlpha(0.98);
    }
  }

  /** Subtle color grading per region: warm forest, blue valley, crisp summit. */
  private buildRegionGrading(): void {
    for (const region of REGIONS) {
      const tint = region.id === "forest" ? 0xffe9c4 : region.id === "valley" ? 0xbcd9f2 : 0xffffff;
      const alpha = region.id === "summit" ? 0.05 : 0.1;
      const w = region.x1 - region.x0;
      this.scene.add.rectangle(region.x0 + w / 2, 360, w + 120, 720, tint, alpha).setDepth(2);
    }
    // valley gets an extra cool wash low over the lake
    this.scene.add.ellipse(1830, 600, 900, 220, 0x9cc8ec, 0.12).setDepth(2);
  }

  // --------------------------------------------------------------- foreground

  private buildForeground(): void {
    // camera-fixed pine boughs intruding from the top corners: instant depth
    const mk = (x: number, y: number, s: number, angle: number, tint: number) =>
      this.scene.add.image(x, y, "pine").setScale(s).setTint(tint).setAlpha(0.96)
        .setDepth(16).setScrollFactor(0).setAngle(angle);
    mk(-30, 60, 2.6, -18, 0x8fa8c4);
    mk(90, -20, 2.1, 14, 0x9db4cf);
    mk(1310, 40, 2.8, 20, 0x8fa8c4);
    mk(1200, -30, 2.0, -12, 0x9db4cf);

    // world-space near-camera pines along the bottom edge (scroll with world)
    const rand = mulberry32(31337);
    for (let i = 0; i < 8; i++) {
      const x = 200 + i * 420 + (rand() - 0.5) * 120;
      const pine = this.scene.add.image(x, 800, "wlm-pine-tall")
        .setScale(1.9 + rand() * 0.7)
        .setDepth(17)
        .setTint(0x7e97b5)
        .setAlpha(0.97);
      pine.setAngle((rand() - 0.5) * 10);
    }
    // bottom-edge snowbank softens the frame (camera-fixed)
    const g = this.scene.add.graphics().setDepth(16).setScrollFactor(0);
    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(180, 752, 620, 120);
    g.fillEllipse(1120, 758, 560, 120);
  }

  // ------------------------------------------------------------------ weather

  private buildWeather(): void {
    // world-wide gentle snowfall
    this.scene.add.particles(0, -30, "snow-dot", {
      x: { min: -100, max: WORLD_W + 100 },
      y: -30,
      lifespan: { min: 5200, max: 9000 },
      speedY: { min: 42, max: 95 },
      speedX: { min: -28, max: 28 },
      scale: { min: 0.35, max: 0.9 },
      alpha: { min: 0.35, max: 0.9 },
      quantity: 2,
      frequency: 90,
    }).setDepth(30);

    // valley wind: stronger, angled, denser
    this.scene.add.particles(0, 0, "snow-dot", {
      x: { min: 1250, max: 2350 },
      y: { min: 60, max: 560 },
      lifespan: { min: 1600, max: 3000 },
      speedX: { min: 120, max: 240 },
      speedY: { min: -30, max: 40 },
      scale: { min: 0.3, max: 0.7 },
      alpha: { min: 0.25, max: 0.6 },
      quantity: 2,
      frequency: 120,
    }).setDepth(30);
  }
}
