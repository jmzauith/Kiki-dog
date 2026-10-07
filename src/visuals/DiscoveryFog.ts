import Phaser from "phaser";

export type FogZone = "middle" | "right";

/**
 * Blowing-snow fog banks that hide unrevealed areas.
 * Replaces flat white rectangles + "?" with layered drifting mist
 * and wind-blown snow. reveal() blows the bank away.
 */
export class DiscoveryFog {
  private banks = new Map<FogZone, Phaser.GameObjects.Container>();

  constructor(private scene: Phaser.Scene) {}

  buildZone(zone: FogZone, x: number, y: number, w: number, h: number): void {
    const c = this.scene.add.container(x, y).setDepth(10);

    // layered soft blobs: denser in the middle, wispy at the edges
    for (let i = 0; i < 16; i++) {
      const bx = Phaser.Math.Between(-w / 2, w / 2);
      const by = Phaser.Math.Between(-h / 2, h / 2);
      const edge = Math.max(Math.abs(bx) / (w / 2), Math.abs(by) / (h / 2));
      const blob = this.scene.add.image(bx, by, "soft-blob")
        .setTint(0xeaf4fd)
        .setScale(Phaser.Math.FloatBetween(1.6, 3.4))
        .setAlpha(Phaser.Math.FloatBetween(0.5, 0.85) * (1 - edge * 0.45));
      c.add(blob);
      // slow internal drift so the bank feels alive
      this.scene.tweens.add({
        targets: blob,
        x: bx + Phaser.Math.Between(-46, 46),
        y: by + Phaser.Math.Between(-24, 24),
        duration: Phaser.Math.Between(5200, 9000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: Phaser.Math.Between(0, 3000),
      });
    }

    // wind-blown snow streaking through the bank
    const wind = this.scene.add.particles(0, 0, "snow-dot", {
      x: { min: -w / 2, max: w / 2 },
      y: { min: -h / 2, max: h / 2 },
      lifespan: { min: 1400, max: 2600 },
      speedX: { min: 90, max: 190 },
      speedY: { min: -24, max: 24 },
      scale: { min: 0.3, max: 0.75 },
      alpha: { min: 0.25, max: 0.7 },
      quantity: 2,
      frequency: 160,
    });
    c.add(wind);

    this.banks.set(zone, c);
  }

  /** Blow the fog bank away; resolves when the zone is fully clear. */
  reveal(zone: FogZone): Promise<void> {
    const bank = this.banks.get(zone);
    if (!bank || !bank.active) return Promise.resolve();
    this.banks.delete(zone);

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: bank,
        alpha: 0,
        x: bank.x + 170,
        scaleX: 1.25,
        duration: 1100,
        ease: "Sine.inOut",
        onComplete: () => {
          bank.destroy(true);
          resolve();
        },
      });
    });
  }

  has(zone: FogZone): boolean {
    return this.banks.has(zone);
  }
}
