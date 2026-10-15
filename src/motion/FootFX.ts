/**
 * FootFX.ts — character ground FX driven by motion contact events.
 *
 * Footprints appear when paws actually contact the ground (not on timers):
 * CharacterMotion emits 'footstep' at the exact contact phases authored in
 * the motion data, with the paw's live world position. This class turns those
 * into pawprints, snow puffs, slip sparkles and shake bursts.
 *
 * Budgets (Chromebook): <=48 prints (fading pool), <=24 puffs, <=12 sparkles.
 * No physics, no particles system — plain images with manual fades.
 */
import Phaser from 'phaser';
import type { CharacterMotion } from './CharacterMotion';
import { ensureFxTextures } from './CharacterMotion';
import type { FootstepData, PointData } from './motionTypes';

interface Print {
  img: Phaser.GameObjects.Image;
  life: number;
}

const MAX_PRINTS = 48;
const PRINT_LIFE = 9000;
const MAX_PUFFS = 24;

export class FootFX {
  private scene: Phaser.Scene;
  private motion: CharacterMotion;
  private prints: Print[] = [];
  private puffs: Array<{ img: Phaser.GameObjects.Image; life: number; max: number; vx: number; vy: number }> = [];
  private sparkles: Array<{ img: Phaser.GameObjects.Image; life: number }> = [];
  private shadow?: Phaser.GameObjects.Image;
  private shadowBaseScale = 1;
  private wantPrints: boolean;
  private wantPuffs: boolean;

  constructor(
    scene: Phaser.Scene,
    motion: CharacterMotion,
    opts?: { prints?: boolean; puffs?: boolean; shadow?: boolean; shadowScale?: number },
  ) {
    this.scene = scene;
    this.motion = motion;
    this.wantPrints = opts?.prints ?? true;
    this.wantPuffs = opts?.puffs ?? true;
    ensureFxTextures(scene);

    motion.on('footstep', (d: FootstepData) => this.onFootstep(d));
    motion.on('shake', (d: PointData) => this.burst(d.x, d.y - 30, 5));
    motion.on('slip', (d: PointData) => this.slip(d.x, d.y));

    if (opts?.shadow) {
      this.shadow = scene.add.image(motion.container.x, 0, 'fx-shadow');
      this.shadow.setDepth(13);
      this.shadowBaseScale = opts.shadowScale ?? 1;
    }
  }

  /** Ground line the shadow sits on. Call when the terrain height changes. */
  setShadowGround(y: number): void {
    this.shadow?.setY(y);
  }

  private onFootstep(d: FootstepData): void {
    if (this.wantPrints && !["bridge", "ice", "cave"].includes(this.motion.getTerrain())) this.addPrint(d.x, d.y);
    if(this.motion.getTerrain() === "ice") { this.slip(d.x,d.y); return; }
    if (this.wantPuffs && this.motion.getTerrain() !== "bridge" && this.motion.getTerrain() !== "cave") {
      const turbo = this.motion.currentMotion === 'race-turbo';
      this.addPuff(d.x, d.y - 4, turbo ? 2 : 1);
    }
  }

  private addPrint(x: number, y: number): void {
    let p = this.prints.length >= MAX_PRINTS ? this.prints.shift() : undefined;
    if (p) {
      p.img.setPosition(x, y).setAlpha(0.55).setActive(true).setVisible(true);
      p.life = PRINT_LIFE;
      this.prints.push(p);
      return;
    }
    const img = this.scene.add.image(x, y, 'fx-paw')
      .setAlpha(0.55)
      .setAngle((Math.random() - 0.5) * 24)
      .setDepth(13);
    this.prints.push({ img, life: PRINT_LIFE });
  }

  private addPuff(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      if (this.puffs.length >= MAX_PUFFS) {
        const old = this.puffs.shift();
        old?.img.destroy();
      }
      const img = this.scene.add.image(
        x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 6, 'fx-puff',
      ).setDepth(17).setScale(0.5 + Math.random() * 0.3).setAlpha(0.75);
      this.puffs.push({
        img, life: 450, max: 450,
        vx: (Math.random() - 0.5) * 24, vy: -18 - Math.random() * 14,
      });
    }
  }

  private burst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) this.addPuff(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 24, 1);
  }

  private slip(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      if (this.sparkles.length >= 12) {
        const old = this.sparkles.shift();
        old?.img.destroy();
      }
      const img = this.scene.add.image(x + (Math.random() - 0.5) * 24, y - 6, 'fx-sparkle')
        .setDepth(17).setScale(0.7 + Math.random() * 0.5);
      this.sparkles.push({ img, life: 500 });
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100);
    for (const p of this.prints) {
      p.life -= dt;
      p.img.setAlpha(Math.max(0, 0.55 * (p.life / PRINT_LIFE)));
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt;
      if (p.life <= 0) { p.img.destroy(); this.puffs.splice(i, 1); continue; }
      const u = 1 - p.life / p.max;
      p.img.x += (p.vx * dt) / 1000;
      p.img.y += (p.vy * dt) / 1000;
      p.img.setScale(p.img.scaleX + (dt / 1000) * 1.2);
      p.img.setAlpha(0.75 * (1 - u));
    }
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.life -= dt;
      if (s.life <= 0) { s.img.destroy(); this.sparkles.splice(i, 1); continue; }
      s.img.setAlpha(s.life / 500).setAngle(s.img.angle + dt * 0.2);
    }
    if (this.shadow) {
      const hop = this.motion.hopY; // negative = airborne
      const s = this.shadowBaseScale * Math.max(0.55, Math.min(1.05, 1 + hop / 160));
      const scale = Math.abs(this.motion.container.scaleX);
      this.shadow.setScale(s * scale, s * scale).setPosition(this.motion.container.x, this.motion.container.y + 3).setVisible(this.motion.container.visible);
      this.shadow.setAlpha(0.85 * s);
    }
  }

  destroy(): void {
    for (const p of this.prints) p.img.destroy();
    for (const p of this.puffs) p.img.destroy();
    for (const s of this.sparkles) s.img.destroy();
    this.shadow?.destroy();
    this.prints = []; this.puffs = []; this.sparkles = [];
  }
}

